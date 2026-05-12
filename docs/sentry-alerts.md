# Sentry Alert Configuration

Configure these alert rules manually in the Sentry dashboard under
**Alerts → Alert Rules** for the `talah-api` project.

## P1 Alerts (Immediate Response)

### Error Rate > 5% over 5 minutes
- **Type**: Issue Alert
- **Condition**: Error rate exceeds 5% of total requests in any 5-minute window
- **Actions**: Email all team members + POST to `SLACK_WEBHOOK_URL` (set in Sentry integrations)
- **Threshold**: `error_rate() > 0.05`
- **Window**: 5 minutes

### Database Connection Errors
- **Type**: Issue Alert
- **Condition**: Any event matching `error.type:ConnectionError OR error.message:*ECONNREFUSED* OR error.message:*connection refused*`
- **Actions**: Email + Slack webhook (immediate)
- **Resolution**: Auto-resolve after 1 hour of silence

## P2 Alerts (Investigate within business hours)

### p99 Latency > 2000ms
- **Type**: Performance Alert
- **Metric**: `p99(transaction.duration)`
- **Condition**: `> 2000ms` over a 15-minute window
- **Actions**: Email team
- **Filter**: Transactions on `/api/*` routes

### Any New Unhandled Exception
- **Type**: Issue Alert
- **Condition**: New issue detected (first seen) with `level:error` AND `!has:handled`
- **Actions**: Email + Slack notification
- **Note**: Regression alerts should fire if the same issue resurfaces after being resolved

## Environments
- Apply all rules to `production` environment only
- `development` environment: alerts disabled by default

## Webhook Placeholder
```
POST https://hooks.slack.com/services/PLACEHOLDER/REPLACE_WITH_REAL_WEBHOOK
Content-Type: application/json
Body: { "text": "🚨 Sentry P1 Alert: {{issue.title}}" }
```
