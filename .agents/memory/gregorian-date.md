---
name: Gregorian date locale fix
description: Arabic locale must include -u-ca-gregory to avoid Hijri calendar in date display
---

When formatting dates in Arabic (`language === "ar"`), always use `"ar-SA-u-ca-gregory"` not `"ar-SA"`.

**Why:** `"ar-SA"` defaults to the Hijri (Islamic) calendar in most environments, producing unexpected year/month values for users expecting Gregorian dates.

**How to apply:** In any `toLocaleString` / `toLocaleDateString` call gated on Arabic language, replace `"ar-SA"` with `"ar-SA-u-ca-gregory"`. Applied in `upcoming.tsx` and `reveal/[id].tsx`.
