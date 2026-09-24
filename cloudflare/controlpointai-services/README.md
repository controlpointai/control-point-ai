# ControlPointAI Services Worker

This Cloudflare Worker supplies the two server-side features used by the otherwise static Firebase-hosted site:

- GitHub OAuth for Decap CMS at `/auth` and `/callback`.
- Contact inquiry storage at `/contact`, with a protected inbox at `/inquiries`.

Contact submissions are stored in the `controlpointai-inquiries` D1 database. They are not sent to a form relay. The inbox requires GitHub write access to `controlpointai/control-point-ai`.

## Required secrets

Set these with `wrangler secret put`; never commit their values:

- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `STATE_SECRET`

The GitHub OAuth App callback URL must be the deployed Worker URL followed by `/callback`.

## Deploy

```powershell
npx.cmd --yes wrangler@latest d1 migrations apply controlpointai-inquiries --remote
npx.cmd --yes wrangler@latest deploy
```

Verify `/health`, then test both the Decap login and the protected inquiry inbox.
