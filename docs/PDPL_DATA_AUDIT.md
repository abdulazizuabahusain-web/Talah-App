# PDPL Data Audit

This document is a working Saudi PDPL compliance inventory for Tal'ah. It should be reviewed by counsel before pilot launch and whenever data collection changes.

## Data inventory

| Data point                      | Where it is stored                                                 | Retention                                                                 | Consent required?                      | Legal basis                                       |
| ------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------- | -------------------------------------- | ------------------------------------------------- |
| Email address                   | `users.email`; login-code request payloads                         | Account lifetime; delete/anonymize on erasure request                     | Yes                                    | User account creation and authentication          |
| Phone number                    | Legacy `users.phone`; historical OTP/login identifier field        | Account lifetime or until migrated/anonymized                             | Yes                                    | Legacy account authentication and user contact    |
| OTP / email login codes         | `otp` table code field                                             | Until expiry; expired rows cleaned up                                     | Yes                                    | Authentication security                           |
| OTP / login-code request logs   | API logs and rate-limit telemetry                                  | Operational log retention window, typically 30-90 days                    | Yes where identifiable                 | Fraud prevention and service security             |
| Full name / nickname            | `users.nickname` and profile fields                                | Account lifetime; delete/anonymize on erasure request                     | Yes                                    | Account profile and group introductions           |
| City                            | `users.city`, `requests.area`, `groups.city`                       | Account/request/group lifetime                                            | Yes                                    | Matching and venue coordination                   |
| Personality traits and scores   | `users` personality fields and score columns                       | Account lifetime; delete/anonymize on erasure request                     | Yes                                    | Compatibility matching requested by the user      |
| Group membership history        | `groups.memberIds`, `group_members`, admin/audit records           | Operational history; review after pilot                                   | Yes                                    | Meetup operations, safety, dispute handling       |
| Match decisions                 | `requests.status`, `groups`, `group_requests`, matching/admin logs | Operational history; review after pilot                                   | Yes                                    | Service delivery and matching quality improvement |
| Post-event feedback and ratings | `feedback` table                                                   | Product quality retention window; anonymize for analytics where possible  | Yes                                    | Service improvement and safety monitoring         |
| Expo push tokens                | `users.expoPushToken`                                              | Until user logs out, disables notifications, or token is replaced/deleted | Yes                                    | Push notification delivery                        |
| Blocked user IDs                | `users.blockedUserIds`                                             | Account lifetime or until user unblocks/deletes account                   | Yes                                    | Safety and user preference enforcement            |
| Flag and report records         | `users.flagged`, `reports` table                                   | Safety retention window; review before deletion                           | Yes where user-submitted               | Safety, moderation, and legal obligation handling |
| Admin audit logs                | `admin_audit_logs`                                                 | Security/audit retention window; recommended minimum 1 year during pilot  | No user consent; admin notice required | Security, accountability, and fraud prevention    |
| Mixpanel analytics events       | Mixpanel project                                                   | Vendor-configured retention; minimize identifiers                         | Yes for analytics                      | Consent-based product analytics                   |
| Sentry error payloads           | Sentry project                                                     | Vendor-configured retention; scrub PII before launch                      | Notice/consent depending payload       | Service reliability and security monitoring       |

## International data transfers

Mixpanel and Sentry may process data outside Saudi Arabia. Before the pilot launch, obtain and file Data Transfer Agreements or equivalent transfer safeguards for each vendor, confirm data residency and subprocessors, and configure PII minimization/scrubbing so unnecessary personal data is not exported.

## Data subject rights

- **Right to access:** A user can request a copy of their account, profile, request, group, feedback, and safety records. Technically, export rows keyed by the user ID/email from `users`, `requests`, group membership tables, feedback, reports, and relevant audit references.
- **Right to correction:** A user can ask to correct profile details such as email, city, nickname, preferences, or personality answers. Technically, update the relevant `users` row and record any admin correction in `admin_audit_logs`.
- **Right to erasure:** A user can request deletion unless safety/legal retention applies. Technically, delete or anonymize the `users` row, auth sessions, Expo push token, profile fields, and user-linked requests/feedback; preserve minimal safety/audit records only when required.
- **Right to withdraw analytics consent:** A user can opt out of analytics. Technically, stop sending future Mixpanel events for that user, delete local analytics identifiers where applicable, and request vendor-side deletion for prior identifiable analytics events.
