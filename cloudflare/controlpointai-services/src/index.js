const GITHUB_AUTHORIZE_URL = "https://github.com/login/oauth/authorize";
const GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token";
const GITHUB_API = "https://api.github.com";
const RESEND_EMAIL_URL = "https://api.resend.com/emails";
const OAUTH_COOKIE = "cpai_oauth_state";
const SESSION_COOKIE = "cpai_admin_session";
const REPOSITORY = "controlpointai/control-point-ai";
const encoder = new TextEncoder();

function headers(extra = {}) {
  return {
    "cache-control": "no-store",
    "content-type": "application/json; charset=utf-8",
    "referrer-policy": "no-referrer",
    "x-content-type-options": "nosniff",
    "x-frame-options": "DENY",
    ...extra,
  };
}

function json(body, status = 200, extra = {}) {
  return new Response(JSON.stringify(body), { status, headers: headers(extra) });
}

function html(body, status = 200, extra = {}) {
  return new Response(body, {
    status,
    headers: headers({ "content-type": "text/html; charset=utf-8", ...extra }),
  });
}

function redirect(location, extra = {}) {
  return new Response(null, { status: 302, headers: headers({ location, ...extra }) });
}

function allowedOrigins(env) {
  return new Set(String(env.ALLOWED_ORIGINS || "https://controlpointai.org")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean));
}

function corsHeaders(request, env) {
  const origin = request.headers.get("origin") || "";
  if (!allowedOrigins(env).has(origin)) return {};
  return {
    "access-control-allow-origin": origin,
    "access-control-allow-headers": "content-type, accept",
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-max-age": "86400",
    vary: "Origin",
  };
}

function base64url(bytes) {
  let binary = "";
  for (const byte of new Uint8Array(bytes)) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function signature(secret, payload) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return base64url(await crypto.subtle.sign("HMAC", key, encoder.encode(payload)));
}

async function signedValue(secret, parts) {
  const payload = parts.join(".");
  return payload + "." + await signature(secret, payload);
}

async function verifySignedValue(secret, value, partCount) {
  const parts = String(value || "").split(".");
  if (parts.length !== partCount + 1) return null;
  const payload = parts.slice(0, partCount).join(".");
  const expected = await signature(secret, payload);
  const actual = parts[partCount];
  if (expected.length !== actual.length) return null;
  let mismatch = 0;
  for (let index = 0; index < expected.length; index += 1) {
    mismatch |= expected.charCodeAt(index) ^ actual.charCodeAt(index);
  }
  return mismatch === 0 ? parts.slice(0, partCount) : null;
}

async function makeOauthState(secret, mode) {
  const random = base64url(crypto.getRandomValues(new Uint8Array(24)));
  const expires = String(Math.floor(Date.now() / 1000) + 600);
  return signedValue(secret, [random, mode, expires]);
}

async function oauthStateMode(secret, state) {
  const parts = await verifySignedValue(secret, state, 3);
  if (!parts || Number(parts[2]) < Math.floor(Date.now() / 1000)) return "";
  return parts[1] === "admin" ? "admin" : (parts[1] === "cms" ? "cms" : "");
}

function cookieValue(request, name) {
  const cookies = request.headers.get("cookie") || "";
  for (const part of cookies.split(";")) {
    const [key, ...value] = part.trim().split("=");
    if (key === name) return decodeURIComponent(value.join("="));
  }
  return "";
}

function requireOauthEnv(env) {
  for (const name of ["GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET", "STATE_SECRET"]) {
    if (!env[name]) throw new Error("Missing Worker secret: " + name);
  }
}

function callbackUrl(request) {
  return new URL("/callback", request.url).toString();
}

async function startAuth(request, env, mode) {
  requireOauthEnv(env);
  const state = await makeOauthState(env.STATE_SECRET, mode);
  const location = new URL(GITHUB_AUTHORIZE_URL);
  location.search = new URLSearchParams({
    client_id: env.GITHUB_CLIENT_ID,
    redirect_uri: callbackUrl(request),
    scope: "public_repo",
    state,
  }).toString();
  return redirect(location.toString(), {
    "set-cookie": OAUTH_COOKIE + "=" + encodeURIComponent(state) + "; Path=/; Max-Age=600; HttpOnly; Secure; SameSite=Lax",
  });
}

function escapeHtml(value) {
  return String(value).replace(/[&<>\"]/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;",
  }[character]));
}

function errorPage(message, status = 400) {
  const body = "<!doctype html><html lang=\"en\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><title>ControlPointAI Login</title></head><body><main><h1>Login could not be completed</h1><p>" + escapeHtml(message) + "</p></main></body></html>";
  return html(body, status);
}

function cmsSuccessPage(token, env) {
  const nonce = base64url(crypto.getRandomValues(new Uint8Array(18)));
  const origins = JSON.stringify([...allowedOrigins(env)]).replace(/</g, "\\u003c");
  const protocolMessage = "authorization:github:success:" + JSON.stringify({ token, provider: "github" });
  const message = JSON.stringify(protocolMessage).replace(/</g, "\\u003c");
  const body = "<!doctype html><html lang=\"en\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><title>ControlPointAI CMS Login</title></head><body><p>Completing GitHub login...</p><script nonce=\"" + nonce + "\">(function(){var allowed=new Set(" + origins + ");var payload=" + message + ";function receive(event){if(!allowed.has(event.origin)||!window.opener)return;window.opener.postMessage(payload,event.origin);window.removeEventListener(\"message\",receive);window.close()}window.addEventListener(\"message\",receive,false);if(window.opener)window.opener.postMessage(\"authorizing:github\",\"*\")})();</script></body></html>";
  return html(body, 200, {
    "content-security-policy": "default-src 'none'; script-src 'nonce-" + nonce + "'; style-src 'none'; base-uri 'none'; frame-ancestors 'none'",
    "set-cookie": OAUTH_COOKIE + "=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax",
  });
}

async function githubJson(url, token) {
  const response = await fetch(url, {
    headers: {
      accept: "application/vnd.github+json",
      authorization: "Bearer " + token,
      "user-agent": "ControlPointAI-Services",
      "x-github-api-version": "2022-11-28",
    },
  });
  const data = await response.json();
  if (!response.ok) throw new Error("GitHub authorization check failed");
  return data;
}

async function makeAdminSession(secret, username) {
  const expires = String(Math.floor(Date.now() / 1000) + 8 * 60 * 60);
  return signedValue(secret, [base64url(encoder.encode(username)), expires]);
}

async function adminUsername(request, env) {
  if (!env.STATE_SECRET) return "";
  const parts = await verifySignedValue(env.STATE_SECRET, cookieValue(request, SESSION_COOKIE), 2);
  if (!parts || Number(parts[1]) < Math.floor(Date.now() / 1000)) return "";
  try {
    const encoded = parts[0].replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(encoded + "=".repeat((4 - encoded.length % 4) % 4));
    return new TextDecoder().decode(Uint8Array.from(binary, (character) => character.charCodeAt(0)));
  } catch (_error) {
    return "";
  }
}

async function finishAuth(request, env) {
  requireOauthEnv(env);
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state") || "";
  const savedState = cookieValue(request, OAUTH_COOKIE);
  const mode = await oauthStateMode(env.STATE_SECRET, state);
  if (!code) return errorPage("GitHub did not return an authorization code.");
  if (!savedState || state !== savedState || !mode) {
    return errorPage("The login request expired or could not be verified. Please try again.");
  }
  const response = await fetch(GITHUB_TOKEN_URL, {
    method: "POST",
    headers: { accept: "application/json", "content-type": "application/json" },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: callbackUrl(request),
    }),
  });
  const data = await response.json();
  if (!response.ok || data.error || !data.access_token) {
    return errorPage(data.error_description || data.error || "GitHub did not return an access token.");
  }
  if (mode === "cms") return cmsSuccessPage(data.access_token, env);
  const user = await githubJson(GITHUB_API + "/user", data.access_token);
  const permission = await githubJson(GITHUB_API + "/repos/" + REPOSITORY + "/collaborators/" + encodeURIComponent(user.login) + "/permission", data.access_token);
  if (!["admin", "maintain", "write"].includes(permission.permission)) {
    return errorPage("This GitHub account does not have publishing access to the ControlPointAI repository.", 403);
  }
  const session = await makeAdminSession(env.STATE_SECRET, user.login);
  return redirect(new URL("/inquiries", request.url).toString(), {
    "set-cookie": SESSION_COOKIE + "=" + encodeURIComponent(session) + "; Path=/; Max-Age=28800; HttpOnly; Secure; SameSite=Strict",
  });
}

function cleanText(value, maxLength) {
  return String(value || "").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

async function sendInquiryNotification(env, inquiry) {
  if (!env.RESEND_API_KEY || !env.NOTIFICATION_EMAIL || !env.NOTIFICATION_FROM) {
    console.warn("Inquiry email notification is not configured");
    return false;
  }
  const requestLabel = inquiry.concern || "Website inquiry";
  const response = await fetch(RESEND_EMAIL_URL, {
    method: "POST",
    headers: {
      authorization: "Bearer " + env.RESEND_API_KEY,
      "content-type": "application/json",
      "idempotency-key": "contact-inquiry/" + inquiry.id,
    },
    body: JSON.stringify({
      from: env.NOTIFICATION_FROM,
      to: [env.NOTIFICATION_EMAIL],
      reply_to: inquiry.email,
      subject: "New ControlPointAI inquiry: " + requestLabel,
      text: [
        "A new inquiry was submitted through controlpointai.org.",
        "",
        "Name: " + inquiry.name,
        "Email: " + inquiry.email,
        "Request: " + requestLabel,
        "",
        "Message:",
        inquiry.workflow,
        "",
        "Reply to this email to respond directly to " + inquiry.name + ".",
      ].join("\n"),
      html: "<h1>New ControlPointAI inquiry</h1>"
        + "<p><strong>Name:</strong> " + escapeHtml(inquiry.name) + "<br>"
        + "<strong>Email:</strong> <a href=\"mailto:" + encodeURIComponent(inquiry.email) + "\">" + escapeHtml(inquiry.email) + "</a><br>"
        + "<strong>Request:</strong> " + escapeHtml(requestLabel) + "</p>"
        + "<p style=\"white-space:pre-wrap\">" + escapeHtml(inquiry.workflow) + "</p>"
        + "<p>Reply to this email to respond directly to " + escapeHtml(inquiry.name) + ".</p>",
    }),
  });
  if (!response.ok) {
    console.error("Resend notification failed", response.status, await response.text());
    return false;
  }
  return true;
}

async function submitContact(request, env) {
  const cors = corsHeaders(request, env);
  const origin = request.headers.get("origin") || "";
  if (!allowedOrigins(env).has(origin)) return json({ ok: false, error: "Origin not allowed" }, 403, cors);
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 32768) return json({ ok: false, error: "Request too large" }, 413, cors);
  let body;
  try {
    body = await request.json();
  } catch (_error) {
    return json({ ok: false, error: "Invalid request" }, 400, cors);
  }
  if (body.company_website) return json({ ok: true }, 200, cors);
  const name = cleanText(body.name, 120);
  const email = cleanText(body.email, 254);
  const concern = cleanText(body.concern, 200);
  const workflow = cleanText(body.workflow, 5000);
  if (!name || !workflow || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ ok: false, error: "Name, email, and inquiry are required" }, 400, cors);
  }
  const recent = await env.INQUIRIES_DB.prepare(
    "SELECT COUNT(*) AS count FROM inquiries WHERE email = ? AND submitted_at > datetime('now', '-10 minutes')",
  ).bind(email).first();
  if (Number(recent && recent.count || 0) >= 3) {
    return json({ ok: false, error: "Please wait before sending another inquiry" }, 429, cors);
  }
  const id = crypto.randomUUID();
  await env.INQUIRIES_DB.prepare(
    "INSERT INTO inquiries (id, submitted_at, name, email, concern, workflow, status) VALUES (?, datetime('now'), ?, ?, ?, ?, 'new')",
  ).bind(id, name, email, concern, workflow).run();
  try {
    await sendInquiryNotification(env, { id, name, email, concern, workflow });
  } catch (error) {
    console.error("Inquiry notification error", error);
  }
  return json({ ok: true }, 200, cors);
}

function inboxStyles() {
  return "body{font-family:Arial,sans-serif;margin:0;color:#14202a;background:#f4f7f8}header,main{max-width:1100px;margin:auto;padding:24px}header{display:flex;justify-content:space-between;align-items:center}a{color:#075f8c}table{width:100%;border-collapse:collapse;background:#fff}th,td{text-align:left;vertical-align:top;padding:12px;border:1px solid #d9e1e5}th{background:#e8f0f3}.new{font-weight:700}.message{white-space:pre-wrap;min-width:280px}.actions{display:flex;gap:8px}.button,button{display:inline-block;border:1px solid #075f8c;background:#075f8c;color:#fff;padding:8px 10px;text-decoration:none;cursor:pointer}.secondary{background:#fff;color:#075f8c}.empty{background:#fff;padding:24px}";
}

async function inboxPage(request, env) {
  const username = await adminUsername(request, env);
  if (!username) return redirect(new URL("/admin-auth", request.url).toString());
  const query = await env.INQUIRIES_DB.prepare(
    "SELECT id, submitted_at, name, email, concern, workflow, status FROM inquiries ORDER BY submitted_at DESC LIMIT 200",
  ).all();
  const rows = (query.results || []).map((item) => {
    const statusButton = item.status === "resolved"
      ? "<button class=\"secondary\" name=\"status\" value=\"new\">Mark new</button>"
      : "<button name=\"status\" value=\"resolved\">Resolve</button>";
    return "<tr class=\"" + (item.status === "new" ? "new" : "") + "\"><td>" + escapeHtml(item.submitted_at) + "</td><td>" + escapeHtml(item.name) + "<br><a href=\"mailto:" + encodeURIComponent(item.email) + "\">" + escapeHtml(item.email) + "</a></td><td>" + escapeHtml(item.concern) + "</td><td class=\"message\">" + escapeHtml(item.workflow) + "</td><td><form class=\"actions\" method=\"post\" action=\"/inquiries/" + encodeURIComponent(item.id) + "\">" + statusButton + "<button class=\"secondary\" name=\"action\" value=\"delete\" onclick=\"return confirm('Delete this inquiry?')\">Delete</button></form></td></tr>";
  }).join("");
  const content = rows
    ? "<table><thead><tr><th>Received UTC</th><th>Contact</th><th>Request</th><th>Message</th><th>Actions</th></tr></thead><tbody>" + rows + "</tbody></table>"
    : "<p class=\"empty\">No inquiries have been received yet.</p>";
  const body = "<!doctype html><html lang=\"en\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><meta name=\"robots\" content=\"noindex\"><title>Contact inquiries | ControlPointAI</title><style>" + inboxStyles() + "</style></head><body><header><div><strong>ControlPointAI</strong><h1>Contact inquiries</h1><p>Signed in as " + escapeHtml(username) + "</p></div><a class=\"button secondary\" href=\"https://controlpointai.org/admin/\">Content CMS</a></header><main>" + content + "</main></body></html>";
  return html(body);
}

async function updateInquiry(request, env, id) {
  const username = await adminUsername(request, env);
  if (!username) return redirect(new URL("/admin-auth", request.url).toString());
  const origin = request.headers.get("origin") || "";
  if (origin && origin !== new URL(request.url).origin) return json({ ok: false, error: "Origin not allowed" }, 403);
  const form = await request.formData();
  if (form.get("action") === "delete") {
    await env.INQUIRIES_DB.prepare("DELETE FROM inquiries WHERE id = ?").bind(id).run();
  } else {
    const status = form.get("status") === "resolved" ? "resolved" : "new";
    await env.INQUIRIES_DB.prepare("UPDATE inquiries SET status = ? WHERE id = ?").bind(status, id).run();
  }
  return redirect(new URL("/inquiries", request.url).toString());
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    try {
      if (url.pathname === "/health" && request.method === "GET") {
        return json({
          ok: true,
          service: "controlpointai-services",
          oauthConfigured: Boolean(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET && env.STATE_SECRET),
          inquiriesConfigured: Boolean(env.INQUIRIES_DB),
          emailConfigured: Boolean(env.RESEND_API_KEY && env.NOTIFICATION_EMAIL && env.NOTIFICATION_FROM),
        });
      }
      if (url.pathname === "/auth" && request.method === "GET") return startAuth(request, env, "cms");
      if (url.pathname === "/admin-auth" && request.method === "GET") return startAuth(request, env, "admin");
      if (url.pathname === "/callback" && request.method === "GET") return finishAuth(request, env);
      if (url.pathname === "/contact" && request.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: corsHeaders(request, env) });
      }
      if (url.pathname === "/contact" && request.method === "POST") return submitContact(request, env);
      if (url.pathname === "/inquiries" && request.method === "GET") return inboxPage(request, env);
      const inquiryMatch = url.pathname.match(/^\/inquiries\/([a-z0-9-]+)$/i);
      if (inquiryMatch && request.method === "POST") return updateInquiry(request, env, inquiryMatch[1]);
      return json({ ok: false, error: "Not found" }, 404);
    } catch (error) {
      console.error(error);
      return json({ ok: false, error: "Service temporarily unavailable" }, 503, corsHeaders(request, env));
    }
  },
};
