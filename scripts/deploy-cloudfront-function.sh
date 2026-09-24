#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CODE="$ROOT/cloudfront/functions/site-redirects.js"
NAME="${CLOUDFRONT_FUNCTION_NAME:-controlpointai-legacy-insight-redirects}"
DIST="${CLOUDFRONT_DISTRIBUTION_ID:-E3BX9NW5W3KZEA}"
[[ -f "$CODE" ]] || { echo "Missing $CODE" >&2; exit 1; }
HASH="$(sha256sum "$CODE"|awk '{print substr($1,1,16)}')"; COMMENT="Canonical and legacy redirects sha256:$HASH"
F="$(mktemp)"; D="$(mktemp)"; U="$(mktemp)"; trap 'rm -f "$F" "$D" "$U"' EXIT
if aws cloudfront describe-function --name "$NAME" --stage DEVELOPMENT >"$F" 2>/dev/null; then
  ETAG="$(jq -r .ETag "$F")"
  aws cloudfront update-function --name "$NAME" --if-match "$ETAG" --function-config "{\"Comment\":\"$COMMENT\",\"Runtime\":\"cloudfront-js-2.0\"}" --function-code "fileb://$CODE" >/dev/null
else
  aws cloudfront create-function --name "$NAME" --function-config "{\"Comment\":\"$COMMENT\",\"Runtime\":\"cloudfront-js-2.0\"}" --function-code "fileb://$CODE" >/dev/null
fi
aws cloudfront describe-function --name "$NAME" --stage DEVELOPMENT >"$F"; ETAG="$(jq -r .ETag "$F")"
aws cloudfront publish-function --name "$NAME" --if-match "$ETAG" >/dev/null
aws cloudfront describe-function --name "$NAME" --stage LIVE >"$F"; ARN="$(jq -r .FunctionSummary.FunctionMetadata.FunctionARN "$F")"
aws cloudfront get-distribution-config --id "$DIST" >"$D"; ETAG="$(jq -r .ETag "$D")"
EXISTING="$(jq -r '.DistributionConfig.DefaultCacheBehavior.FunctionAssociations.Items//[]|map(select(.EventType=="viewer-request"))|.[0].FunctionARN//""' "$D")"
LAMBDA="$(jq -r '.DistributionConfig.DefaultCacheBehavior.LambdaFunctionAssociations.Items//[]|map(select(.EventType=="viewer-request"))|.[0].LambdaFunctionARN//""' "$D")"
[[ -z "$LAMBDA" ]] || { echo "Existing viewer-request Lambda@Edge: $LAMBDA; refusing to replace it." >&2; exit 1; }
[[ -z "$EXISTING" || "$EXISTING" == "$ARN" ]] || { echo "Existing viewer-request function: $EXISTING; refusing to replace it." >&2; exit 1; }
if [[ "$EXISTING" != "$ARN" ]]; then
  jq --arg arn "$ARN" '.DistributionConfig.DefaultCacheBehavior.FunctionAssociations=((.DistributionConfig.DefaultCacheBehavior.FunctionAssociations//{"Quantity":0,"Items":[]})|.Items=((.Items//[])|map(select(.EventType!="viewer-request"))+[{"EventType":"viewer-request","FunctionARN":$arn}])|.Quantity=(.Items|length))|.DistributionConfig' "$D" >"$U"
  aws cloudfront update-distribution --id "$DIST" --if-match "$ETAG" --distribution-config "file://$U" >/dev/null
  aws cloudfront wait distribution-deployed --id "$DIST"
fi
echo "Canonical and legacy redirects are active on $DIST."
