# Tal'ah — PDPL Data Audit

Saudi Personal Data Protection Law (PDPL) compliance audit.
Last reviewed: May 2026.

## Data Inventory

| Data Point | Where Stored | Retention Period | Consent Required | Legal Basis |
|---|---|---|---|---|
| Email address | `users.email` (PostgreSQL) | Until account deletion | No — required for login | Contract performance |
| Phone number (legacy) | `users.phone` (PostgreSQL) | Until account deletion | No — required for login | Contract performance |
| OTP login codes | `otp` table (PostgreSQL) | 10 minutes (TTL via expiresAt) | No | Contract performance |
| OTP session tokens | `sessions` table | 30 days (expiresAt) | No | Contract performance |
| Nickname | `users.nickname` | Until account deletion | No — user-chosen pseudonym | Contract performance |
| Age range | `users.age_range` | Until account deletion | Disclosed at onboarding | Contract performance |
| Gender | `users.gender` | Until account deletion | Disclosed at onboarding | Contract performance |
| City | `users.city` | Until account deletion | Disclosed at onboarding | Contract performance |
| Personality traits & scores | `users.*_score`, `users.personality_traits` | Until account deletion | Disclosed at onboarding | Contract performance |
| Interests & lifestyle | `users.interests`, `users.lifestyle` | Until account deletion | Disclosed at onboarding | Contract performance |
| Availability preferences | `users.preferred_days`, `users.preferred_times` | Until account deletion | Disclosed at onboarding | Contract performance |
| Meetup requests | `requests` table | Until account deletion | Implicit (user-initiated) | Contract performance |
| Group membership | `groups.member_ids` array | Until account deletion | Implicit (user-initiated) | Contract performance |
| Match history | `groups` table | Until account deletion | Implicit (user-initiated) | Contract performance |
| Post-event ratings | `feedback` table | 2 years | Implicit (user-initiated) | Legitimate interest (service quality) |
| Post-event comments | `feedback.comment` | 2 years | Implicit (user-initiated) | Legitimate interest (service quality) |
| User-to-user reports | `reports` table | 3 years (safety) | N/A — safety obligation | Legal obligation |
| Admin audit logs | `admin_audit_logs` table | 3 years | N/A — internal | Legal obligation |
| Survey responses (micro/exit) | `surveys` table | 2 years | Shown in ConsentBanner | Legitimate interest |
| Expo push token | `users.expo_push_token` | Until account deletion or token refresh | Requested at onboarding | Consent |
| Mixpanel analytics events | Mixpanel cloud (EU region) | 25 months (Mixpanel default) | **Yes** — ConsentBanner required before any event is sent | Consent |
| Sentry error payloads | Sentry cloud | 90 days | No — PII is stripped before send (`sendDefaultPii: false`); only stack traces and anonymised request metadata are sent | Legitimate interest (security) |

## Notes on PII Stripping

- **Mixpanel**: The server-side `analytics.ts` wrapper strips `phone`, `email`, `name`, `deviceId`, and `ip` before sending any event. The `distinct_id` sent is the internal UUID, not a phone number or email.
- **Sentry**: Initialised with `sendDefaultPii: false`. No request bodies, no user emails, no tokens are captured in error reports.

## Data Subject Rights (PDPL Articles 4–6)

### Right to Access
A user may request a copy of all personal data held about them by emailing **privacy@talah.app** (placeholder). The operations team will compile a JSON export from the database within **10 business days** using the following query pattern:
```sql
SELECT u.*, r.*, f.*
FROM users u
LEFT JOIN requests r ON r.user_id = u.id
LEFT JOIN feedback f ON f.from_user_id = u.id
WHERE u.id = '<user_uuid>';
```

### Right to Erasure (Right to be Forgotten)
Users can permanently delete their own account from the **Profile** screen → **Delete account**. This triggers:
1. The `DELETE /api/users/me` API endpoint
2. Cascading deletion of all FK-linked rows (`requests`, `feedback`, `sessions`, `otp`, `surveys`, `reports` where reporter, `group_members`)
3. The user's `member_ids` entry is removed from any `groups` rows
4. Mixpanel: call `mixpanel.people.delete_user(userId)` — add this to the delete endpoint when Mixpanel People is enabled

Admins can also delete a user via the admin dashboard, which logs the action to `admin_audit_logs` with the user ID hashed (SHA-256) for audit traceability without retaining the raw ID.

### Right to Rectification
Users can update their profile data at any time via the **Profile → Edit** screen, which calls `PATCH /api/users/me`.

### Right to Object to Processing
A user who declines analytics via the ConsentBanner (stored in `AsyncStorage` under `analytics_consent: "declined"`) will have no events sent to Mixpanel. The app checks this flag before every tracking call. Declining does not affect core service functionality.

## Data Residency
- PostgreSQL database: Replit-managed, US region (note: consider migrating to a GCC/KSA-hosted PostgreSQL instance before commercial launch to comply with PDPL data localisation requirements for sensitive data categories)
- Mixpanel: configure EU data residency in Mixpanel project settings (`api.eu.mixpanel.com`)
- Sentry: configure EU data residency (`o*.ingest.eu.sentry.io` DSN)
