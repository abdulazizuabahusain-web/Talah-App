---
name: Groups table schema
description: Groups table column list — used when writing queries that JOIN groups.
---

The `groups` table has NO `title` column. Use `city`, `area`, `meetupType`, `venue`, `meetupAt` to describe a group in JOINs and API responses.

Columns: id, status, meetupType, gender, city, area, venue, meetupAt, memberIds (text[]), requestIds (text[]), createdAt, updatedAt.

**Why:** Queries failed when `groupsTable.title` was assumed to exist — it does not. Groups are identified by city/area/type, not a user-facing title.

**How to apply:** Any query selecting group identity fields for display should use `groupCity`, `groupArea`, `groupMeetupType` — never `groupTitle`.
