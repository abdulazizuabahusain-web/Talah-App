---
name: EAS iOS build from Replit sandbox
description: How to run eas build --platform ios non-interactively from the Replit sandbox environment
---

## The working approach (confirmed July 2026 — build 55e7fa2e succeeded)

EAS CLI cannot be run interactively from Replit's bash tool (no TTY). The only fully automated path for iOS production builds is:

1. **Local credentials** (`"credentialsSource": "local"` in eas.json production profile)
2. **`credentials.json`** at project root with `signing/distribution.p12` + `signing/Talah_App_Store.mobileprovision`
3. **Provisioning profile via ASC API** — generate programmatically using ASC_API_KEY_ID / ASC_ISSUER_ID / ASC_PRIVATE_KEY secrets; no file transfer needed
4. **Run via Python pty fork** — direct bash/shell invocations get killed as "waiting for input"; `pty.openpty()` + `os.fork()` works

**Why:** EAS `--non-interactive` refuses to validate/generate remote credentials without Apple ID login even when ASC API key env vars are set. Interactive menus get killed by sandbox input detection. Local credentials bypass all remote credential validation.

## Key env vars for pty build run

- `EAS_NO_VCS=1` — prevents `git add`/`git commit` which hits sandbox destructive-git block
- `EAS_SKIP_AUTO_FINGERPRINT=1` — bypasses a `brace_expansion` bug in EAS CLI fingerprint step (client-side only)
- `EAS_BUILD_NO_EXPO_GO_WARNING=true` — suppresses noisy warning

## credentials.json — use literal password, NOT env var reference

Put the actual p12 password directly in `credentials.json`. EAS CLI does NOT expand `$ENV_VAR` references from this file — the literal string gets sent to the build server and fails with "password probably invalid". The file is gitignored so it is safe.

```json
{
  "ios": {
    "provisioningProfilePath": "signing/Talah_App_Store.mobileprovision",
    "distributionCertificate": {
      "path": "signing/distribution.p12",
      "password": "<actual-password-here>"
    }
  }
}
```

## p12 must be generated with 3DES/SHA1 (macOS-compatible format)

OpenSSL 3.x on Linux generates p12 files with AES-256-CBC by default. macOS's `security import` rejects these with "hasn't been imported successfully". Re-generate with:

```bash
# Extract (requires -provider legacy -provider default on this Debian OpenSSL build)
openssl pkcs12 -in distribution.p12 -nocerts -nodes \
  -provider legacy -provider default \
  -passin pass:"$PASS" -out dist.key

openssl pkcs12 -in distribution.p12 -nokeys \
  -provider legacy -provider default \
  -passin pass:"$PASS" -out dist.cer

# Re-export with 3DES/SHA1 (macOS compatible)
openssl pkcs12 -export \
  -provider legacy -provider default \
  -keypbe PBE-SHA1-3DES -certpbe PBE-SHA1-3DES -macalg SHA1 \
  -in dist.cer -inkey dist.key \
  -out distribution.p12 \
  -passout pass:"$PASS" \
  -name "Apple Distribution: Abdulaziz Abahusain"
```

## Provisioning profile MUST include Push Notifications entitlement

The app uses `expo-notifications`. Xcode requires `aps-environment: production` in the provisioning profile. When creating the profile via ASC API, first enable the capability on the bundle ID:

```python
# Enable capability (idempotent — 409 if already enabled)
asc('POST', '/bundleIdCapabilities', {
    'data': {
        'type': 'bundleIdCapabilities',
        'attributes': {'capabilityType': 'PUSH_NOTIFICATIONS'},
        'relationships': {'bundleId': {'data': {'type': 'bundleIds', 'id': BUNDLE_ID}}}
    }
})
# Then create the profile — it will include aps-environment automatically
```

Verify before uploading: `ents.get('aps-environment') == 'production'`

## eas submit — free-tier queue warning

**DO NOT** run `eas submit --wait` in a loop. On the free tier, the submission queue can take 30+ minutes. Each call to `eas submit` creates a NEW submission entry — running it multiple times while waiting stacks up duplicate queue entries, making things slower. The correct approach:

1. Run `eas submit --non-interactive --no-wait` **once** to schedule the submission
2. Note the submission ID and dashboard URL from the output
3. Check status manually at https://expo.dev/accounts/abdulaziz-abahusain/projects/talah/submissions/
4. Also check App Store Connect → TestFlight for the build appearing there

`eas submission:view` does not exist in EAS CLI v16. Use `eas build:view <id> --json` to get the logFiles[] signed URL for debugging build failures.

## Getting build error details from EAS

`eas build:view <id> --json` returns `logFiles[]` — a signed GCS URL (valid 15 min) with newline-delimited JSON logs. Fetch with `curl --compressed`. Filter level ≥ 50 for errors. Key phases to watch: `PREPARE_CREDENTIALS` (signing setup) and `RUN_FASTLANE` (Xcode build).

## eas.json submit profile — ASC API key configuration

For non-interactive `eas submit`, configure the ASC API key directly in eas.json (no interactive credential setup needed):

```json
"submit": {
  "production": {
    "ios": {
      "ascApiKeyPath": "./signing/AuthKey_<KEY_ID>.p8",
      "ascApiKeyIssuerId": "<ISSUER_ID>",
      "ascApiKeyId": "<KEY_ID>"
    }
  }
}
```

Save the key from `ASC_PRIVATE_KEY` env var to `signing/AuthKey_<KEY_ID>.p8` (gitignored). Wrap in PEM headers if not already present.

## Project-specific values (Tal'ah)

- Bundle ID: `com.abdulaziz.talah` (ASC record ID: `97MCULYP7K`)
- Distribution cert: `Apple Distribution: Abdulaziz Abahusain` (ASC cert ID: `J35XUM5X54`, fingerprint: `95ACCF1AD5C96AA57CC213084809EA5EE64B0D3F`, expires 2027-07-08)
- Provisioning profile: `77VQCGVPYN` (includes Push Notifications + aps-environment: production)
- p12: `artifacts/talah/signing/distribution.p12` (3DES format, password in credentials.json)
- ASC API key file: `artifacts/talah/signing/AuthKey_MW4922RJR6.p8`
- All paths gitignored via `signing/` + `credentials.json` in `.gitignore`

**How to apply:** Any time a new iOS production build is needed. Re-run provisioning profile generation script if cert changes or profile expires (annually).
