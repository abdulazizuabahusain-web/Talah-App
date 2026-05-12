# Tal'ah — PDPL Data Audit

Tal'ah collects the minimum operational data needed to run safe, consent-based meetups. Product analytics events are recorded only after explicit analytics consent, and analytics payloads exclude direct identifiers such as names, phone numbers, and raw device identifiers.

| Data Point | Where Stored | Retention Period | Consent Required | Legal Basis |
|---|---|---|---|---|
| Phone numbers | `users.phone`, `otp.phone` while codes are active | Account lifetime; OTP rows expire after 10 minutes and are removed on verification or replacement | Required for account creation and login | Contractual necessity to authenticate the user and secure the account |
| OTP logs | `otp` table with phone, code, expiry, and creation time | Up to 10 minutes, or until verification/replacement | Required for login flow | Security and contractual necessity |
| Personality traits and profile preferences | `users` profile columns including interests, lifestyle, personality, scores, boundaries, and meetup preferences | Account lifetime or until user edits/deletes account | Required when user completes onboarding/profile fields | User-provided consent and service personalization |
| Group membership | `groups.member_ids`, `groups.request_ids`, `requests.user_id` | Account lifetime or until account deletion cascades linked records | Required to join matchmaking | Contractual necessity to provide meetup matching |
| Match history | `groups`, `requests`, and consented `events` for match acceptance/decline | Account lifetime for operational tables; consented event history retained for pilot analytics review | Analytics consent required for events; operational history required for service | Contractual necessity for service records; consent for analytics |
| Feedback ratings | `feedback.rating`, `feedback.comment`, `feedback.connections` | Account lifetime or until account deletion cascades feedback | Required only when submitting feedback | User consent to submit feedback and legitimate service quality review |
| Mixpanel events | Mixpanel project and local `events` table; only sanitized event names, user IDs, city, group ID, rating, and non-PII properties | Pilot analytics retention, reviewed at least quarterly | Explicit analytics consent required before tracking | Consent |
| Sentry error payloads | Sentry project, if `SENTRY_DSN` is configured | Sentry project retention policy, reviewed at least quarterly | Not used for product analytics; avoid adding direct PII to error contexts | Legitimate interest/security to diagnose and protect the service |
| Expo push tokens | `users.expo_push_token` | Account lifetime or until replaced/removed | Required only if user enables notifications | Consent to receive notifications |
| Account deletion audit event | `events` table with anonymised hash only | Security/audit retention, reviewed at least quarterly | No analytics consent required because it is an anonymised audit record | Legal obligation and security audit necessity |

## Data Subject Rights

- **Right to access:** A user can request a copy of their account, profile, group, request, and feedback data through Tal'ah support. Operations should verify the requester, export only that user's linked records, and respond within the applicable PDPL timeline.
- **Right to erasure:** A user can delete their account through `DELETE /api/users/me`. This permanently deletes the user's row and cascades linked sessions, requests, feedback, and other foreign-key-linked records, while preserving only an anonymised deletion audit event.
- **How to trigger requests:** In-app account deletion should call `DELETE /api/users/me`. For access or manual erasure assistance, the user should contact support from the phone number associated with the account so operations can verify identity before acting.
