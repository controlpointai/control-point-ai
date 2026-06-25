const GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token";

const requiredEnv = ["GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET", "OAUTH_CALLBACK_URL"];

function getEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function html(body, statusCode = 200) {
  return {
    statusCode,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
    },
    body,
  };
}

function json(body, statusCode = 200) {
  return {
    statusCode,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
    body: JSON.stringify(body),
  };
}

function getPath(event) {
  return event.rawPath || event.path || "/";
}

function getQuery(event) {
  return event.queryStringParameters || {};
}

function getRedirectUri() {
  return getEnv("OAUTH_CALLBACK_URL");
}

function escapeForScript(value) {
  return String(value).replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

function successPage(token) {
  const safeToken = escapeForScript(token);

  return html(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>ControlPointAI CMS Login</title>
  </head>
  <body>
    <script>
      (function () {
        function receiveMessage(message) {
          window.opener.postMessage(
            'authorization:github:success:' + JSON.stringify({ token: '${safeToken}' }),
            message.origin
          );
          window.removeEventListener('message', receiveMessage, false);
          window.close();
        }

        window.addEventListener('message', receiveMessage, false);
        window.opener.postMessage('authorizing:github', '*');
      })();
    </script>
    <p>Completing GitHub login...</p>
  </body>
</html>`);
}

function errorPage(message) {
  const safeMessage = String(message).replace(/[<>&"]/g, (char) => ({
    "<": "&lt;",
    ">": "&gt;",
    "&": "&amp;",
    '"': "&quot;",
  }[char]));

  return html(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>ControlPointAI CMS Login Error</title>
  </head>
  <body>
    <h1>GitHub login could not be completed</h1>
    <p>${safeMessage}</p>
  </body>
</html>`, 400);
}

async function startAuth(event) {
  const clientId = getEnv("GITHUB_CLIENT_ID");
  const query = getQuery(event);
  const scope = query.scope || "repo";
  const state = query.state || "controlpointai";
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getRedirectUri(),
    scope,
    state,
  });

  return {
    statusCode: 302,
    headers: {
      location: `https://github.com/login/oauth/authorize?${params.toString()}`,
      "cache-control": "no-store",
    },
    body: "",
  };
}

async function finishAuth(event) {
  const query = getQuery(event);
  if (!query.code) {
    return errorPage("GitHub did not return an authorization code.");
  }

  const response = await fetch(GITHUB_TOKEN_URL, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      client_id: getEnv("GITHUB_CLIENT_ID"),
      client_secret: getEnv("GITHUB_CLIENT_SECRET"),
      code: query.code,
      redirect_uri: getRedirectUri(),
    }),
  });

  const data = await response.json();
  if (!response.ok || data.error || !data.access_token) {
    return errorPage(data.error_description || data.error || "GitHub did not return an access token.");
  }

  return successPage(data.access_token);
}

export async function handler(event) {
  for (const name of requiredEnv) {
    getEnv(name);
  }

  const path = getPath(event).replace(/\/$/, "");

  if (path.endsWith("/auth")) {
    return startAuth(event);
  }

  if (path.endsWith("/callback")) {
    return finishAuth(event);
  }

  if (path.endsWith("/health")) {
    return json({ ok: true });
  }

  return json({ error: "Not found" }, 404);
}
