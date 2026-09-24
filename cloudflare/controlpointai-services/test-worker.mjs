import assert from "node:assert/strict";
import worker from "./src/index.js";

const calls = [];
const emailRequests = [];
const originalFetch = globalThis.fetch;
globalThis.fetch = async (url, options) => {
  if (String(url) !== "https://api.resend.com/emails") return originalFetch(url, options);
  emailRequests.push({ url: String(url), options });
  return new Response(JSON.stringify({ id: "test-email" }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
};
const db = {
  prepare(sql) {
    return {
      bind(...values) {
        return {
          async first() {
            calls.push({ sql, values, action: "first" });
            return { count: 0 };
          },
          async run() {
            calls.push({ sql, values, action: "run" });
            return { success: true };
          },
        };
      },
      async all() {
        return { results: [] };
      },
    };
  },
};
const env = {
  ALLOWED_ORIGINS: "https://controlpointai.org",
  GITHUB_CLIENT_ID: "test-client",
  GITHUB_CLIENT_SECRET: "test-secret",
  STATE_SECRET: "test-state-secret-that-is-long-enough",
  RESEND_API_KEY: "re_test",
  NOTIFICATION_EMAIL: "wayne@controlpointai.org",
  NOTIFICATION_FROM: "ControlPointAI Website <website@notify.controlpointai.org>",
  INQUIRIES_DB: db,
};

const health = await worker.fetch(new Request("https://worker.example/health"), env);
assert.equal(health.status, 200);
assert.deepEqual(await health.json(), {
  ok: true,
  service: "controlpointai-services",
  oauthConfigured: true,
  inquiriesConfigured: true,
  emailConfigured: true,
});

const auth = await worker.fetch(new Request("https://worker.example/auth"), env);
assert.equal(auth.status, 302);
assert.match(auth.headers.get("location"), /scope=public_repo/);
assert.match(auth.headers.get("set-cookie"), /HttpOnly/);
assert.match(auth.headers.get("set-cookie"), /SameSite=Lax/);

const contact = await worker.fetch(new Request("https://worker.example/contact", {
  method: "POST",
  headers: { origin: "https://controlpointai.org", "content-type": "application/json" },
  body: JSON.stringify({
    name: "Test User",
    email: "test@example.com",
    concern: "Test inquiry",
    workflow: "Verify secure database delivery.",
  }),
}), env);
assert.equal(contact.status, 200);
assert.equal(contact.headers.get("access-control-allow-origin"), "https://controlpointai.org");
assert.equal(calls.filter((call) => call.action === "run").length, 1);
assert.equal(emailRequests.length, 1);
const emailPayload = JSON.parse(emailRequests[0].options.body);
assert.equal(emailPayload.from, "ControlPointAI Website <website@notify.controlpointai.org>");
assert.deepEqual(emailPayload.to, ["wayne@controlpointai.org"]);
assert.equal(emailPayload.reply_to, "test@example.com");
assert.match(emailPayload.subject, /Test inquiry/);
assert.match(emailPayload.text, /Verify secure database delivery/);

const rejected = await worker.fetch(new Request("https://worker.example/contact", {
  method: "POST",
  headers: { origin: "https://example.com", "content-type": "application/json" },
  body: "{}",
}), env);
assert.equal(rejected.status, 403);

const inbox = await worker.fetch(new Request("https://worker.example/inquiries"), env);
assert.equal(inbox.status, 302);
assert.equal(inbox.headers.get("location"), "https://worker.example/admin-auth");

globalThis.fetch = originalFetch;
console.log("Validated Worker health, signed OAuth start, inquiry storage, email notification, origin protection, and inbox authentication.");
