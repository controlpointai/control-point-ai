import assert from "node:assert/strict";
import worker from "./src/index.js";

const calls = [];
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
  INQUIRIES_DB: db,
};

const health = await worker.fetch(new Request("https://worker.example/health"), env);
assert.equal(health.status, 200);
assert.deepEqual(await health.json(), {
  ok: true,
  service: "controlpointai-services",
  oauthConfigured: true,
  inquiriesConfigured: true,
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

const rejected = await worker.fetch(new Request("https://worker.example/contact", {
  method: "POST",
  headers: { origin: "https://example.com", "content-type": "application/json" },
  body: "{}",
}), env);
assert.equal(rejected.status, 403);

const inbox = await worker.fetch(new Request("https://worker.example/inquiries"), env);
assert.equal(inbox.status, 302);
assert.equal(inbox.headers.get("location"), "https://worker.example/admin-auth");

console.log("Validated Worker health, signed OAuth start, inquiry storage, origin protection, and inbox authentication.");
