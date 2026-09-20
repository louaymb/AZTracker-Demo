#!/usr/bin/env bash
#
# The Firebase CLI applies `invoker: "public"` to 2nd-gen onRequest functions
# but not to onCall functions. Callable functions must be publicly invokable at
# the Cloud Run IAM layer — Firebase Auth is enforced *inside* the function.
#
# Run this once after `firebase deploy --only functions`:
#   ./scripts/set-public-invokers.sh
#
set -euo pipefail

PROJECT="${GOOGLE_CLOUD_PROJECT:-azubitracker}"
REGION="${FUNCTIONS_REGION:-us-central1}"

SERVICES=(
  gmailauthurl
  gmailoauthcallback
  syncgmail
  disconnectgmail
  researchapplication
)

for service in "${SERVICES[@]}"; do
  if gcloud run services add-iam-policy-binding "$service" \
    --project="$PROJECT" \
    --region="$REGION" \
    --member="allUsers" \
    --role="roles/run.invoker" \
    --quiet >/dev/null 2>&1; then
    echo "public invoker granted: $service"
  else
    echo "WARN: could not update $service (does it exist yet?)" >&2
  fi
done
