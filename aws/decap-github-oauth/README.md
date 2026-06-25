# Decap CMS GitHub OAuth Bridge

The ControlPointAI site is hosted as static files on S3 and CloudFront. Decap CMS can edit GitHub content from a static admin page, but GitHub login still needs a small server-side OAuth bridge so the GitHub client secret is not exposed in the browser.

This Lambda handles three routes:

- `/auth` starts GitHub OAuth.
- `/callback` exchanges the GitHub code for a token and returns it to Decap CMS.
- `/health` returns `{ "ok": true }` for a quick smoke test.

## AWS Setup

1. In GitHub, create an OAuth App:
   - Application name: `ControlPointAI CMS`
   - Homepage URL: `https://controlpointai.org`
   - Authorization callback URL: use the API Gateway callback URL after step 5.

2. In AWS Lambda, create a function:
   - Runtime: Node.js 20.x
   - Handler: `index.handler`
   - Upload `index.mjs` as the function code.

3. Add Lambda environment variables:
   - `GITHUB_CLIENT_ID`: GitHub OAuth app client ID
   - `GITHUB_CLIENT_SECRET`: GitHub OAuth app client secret
   - `OAUTH_CALLBACK_URL`: API Gateway callback URL, for example `https://abc123.execute-api.us-east-2.amazonaws.com/callback`

4. Create an HTTP API Gateway trigger for the Lambda:
   - Route: `ANY /{proxy+}`
   - CORS is not required for the popup flow.

5. Copy the API Gateway invoke URL and update the GitHub OAuth App callback URL:
   - `https://YOUR_API_ID.execute-api.us-east-2.amazonaws.com/callback`

6. Update `admin/config.yml`:

```yaml
backend:
  name: github
  repo: controlpointai/control-point-ai
  branch: main
  base_url: https://YOUR_API_ID.execute-api.us-east-2.amazonaws.com
  auth_endpoint: auth
```

7. Visit the health check:

```text
https://YOUR_API_ID.execute-api.us-east-2.amazonaws.com/health
```

If it returns `{ "ok": true }`, redeploy the site and try:

```text
https://controlpointai.org/admin/
```

## Important Notes

- Do not commit the GitHub client secret.
- Keep the GitHub OAuth App callback URL exactly aligned with `OAUTH_CALLBACK_URL`.
- For a public repo, the OAuth app only allows authorized GitHub users to commit. It does not allow random visitors to run GitHub Actions or publish content.
