# ControlPointAI Services Worker

This Cloudflare Worker supplies the two server-side features used by the otherwise static Firebase-hosted site:

- GitHub OAuth for Decap CMS at `/auth` and `/callback`.
- Contact inquiry storage at `/contact`, email notification through Resend, and a protected inbox at `/inquiries`.

Contact submissions are stored in the `controlpointai-inquiries` D1 database before the Worker attempts email delivery to Wayne. A temporary email failure does not lose the inquiry or fail the visitor's submission. The inbox requires GitHub write access to `controlpointai/control-point-ai`.

## Required secrets

Set these with `wrangler secret put`; never commit their values:

- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `STATE_SECRET`
- `RESEND_API_KEY`

The GitHub OAuth App callback URL must be the deployed Worker URL followed by `/callback`.
The Resend domain `notify.controlpointai.org` must be verified before deploying email notifications.

## Deploy

```powershell
npx.cmd --yes wrangler@latest d1 migrations apply controlpointai-inquiries --remote
npx.cmd --yes wrangler@latest deploy
```

Verify `/health`, then test both the Decap login and the protected inquiry inbox.
