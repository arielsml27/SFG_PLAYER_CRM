# העברת samuel-diamonds.io ל-Cloudflare

כדי שהמערכת תהיה נגישה מהאינטרנט, Cloudflare צריכה לנהל את ה-DNS של הדומיין.
ההעברה עצמה פשוטה. הסיכון היחיד הוא המייל.

**הרשם:** Squarespace (שקנתה את Google Domains) · **תפוגה:** 30 באוגוסט 2027
**זמן עבודה:** כשעה · **המתנה אחר כך:** עד 24 שעות · **עלות:** ללא ·
**אפשר לחזור אחורה:** כן

---

## הסיכון היחיד — המייל

`info@samuel-diamonds.io` עובד דרך רשומות MX. החלפת ה-nameservers מעבירה את כל
ניהול ה-DNS ל-Cloudflare, ואם רשומות ה-MX לא יעברו איתו — **המייל מפסיק להגיע.
בלי שגיאה, בלי הודעה.**

הסדר הוא: **לתעד → לייבא → לוודא → ורק אז להחליף.** אל תדלג על שלב 3.

---

## 1. לתעד מה יש עכשיו

לפני שנוגעים במשהו.

- [ ] **ב-Squarespace:** `account.squarespace.com/domains` ← לחץ על
      **samuel-diamonds.io** ← **DNS** בתפריט הצדדי.
- [ ] **צלם את כל הרשומות.** כל שורה: סוג, שם, ערך, עדיפות.
      שים לב לקטע **Custom Records** ולקטע של רשומות מוגדרות מראש.

> **הערה על דומיינים שהגיעו מ-Google Domains:** לפעמים רשומות ה-MX של Workspace
> מוצגות שם כהגדרה מרוכזת (״Google Workspace״) ולא כחמש שורות נפרדות. אם זה המצב,
> שלוף את הערכים האמיתיים דרך `mxtoolbox` בשלב הבא — Cloudflare צריכה את השורות
> עצמן.
- [ ] **גבה גם מבחוץ.** ב-`mxtoolbox.com/SuperTool.aspx` הרץ `MX Lookup` ואז
      `TXT Lookup` על הדומיין, ושמור את התוצאות.
- [ ] **שלוף את ה-DKIM ממסוף Workspace:** אפליקציות ← Google Workspace ← Gmail ←
      אימות מיילים. הערך של `google._domainkey` ארוך מאוד — העתק אותו במלואו.

## 2. להוסיף את הדומיין ל-Cloudflare

- [ ] פתח חשבון ב-`dash.cloudflare.com` (חינם).
- [ ] **Add a domain** ← `samuel-diamonds.io` ← תוכנית **Free**.
      אל תבחר בהעברת הדומיין עצמו (transfer) — רק ניהול ה-DNS עובר.
- [ ] תן ל-Cloudflare לסרוק. היא מייבאת מה שהיא רואה — **לא תמיד הכל.**

## 3. לוודא — לפני שמחליפים

הרשומות בפועל של הדומיין, כפי שנקראו ממסך ה-DNS ב-Squarespace.

### חייבות לעבור ל-Cloudflare — שלוש בלבד

| סוג | שם | עדיפות | ערך |
|---|---|---|---|
| `MX` | `@` | `1` | `smtp.google.com` |
| `TXT` | `@` | — | `v=spf1 include:_spf.google.com ~all` |
| `TXT` | `google._domainkey` | — | `v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ…` |

ה-MX כאן הוא **התצורה החדשה של Google — רשומה אחת בלבד**. אין צורך בחמש
רשומות `ASPMX`. אם Cloudflare תציע להוסיף אותן, סרב.

- [ ] MX קיים ב-Cloudflare עם עדיפות 1
- [ ] SPF קיים
- [ ] DKIM קיים **ובאורך מלא** (ראה למטה)

### ה-DKIM חייב לעבור שלם

הערך מוצג קטוע במסך של Squarespace (`…AOCAQ…`). מחרוזת חתוכה שקולה
לרשומה שבורה, והמיילים שלך ייחתמו לא נכון וייכנסו לספאם.

המקור האמין ביותר — **מסוף Workspace**:
אפליקציות ← Google Workspace ← Gmail ← **אימות מיילים** (Authenticate email).
שם הערך מוצג במלואו עם כפתור העתקה.

חלופה: `mxtoolbox.com/dkim.aspx`, סלקטור `google`, דומיין `samuel-diamonds.io`.

### לא צריך להעביר

| רשומה | למה לא |
|---|---|
| ארבע רשומות `A` ל-`198.185.159.x` / `198.49.23.x` | מצביעות על דף חנייה של Squarespace שאינך משתמש בו |
| `CNAME www → ext-sq.squarespace.com` | אותו דבר |
| רשומת `HTTPS` | של אחסון Squarespace |
| `CNAME _domainconnect` | שירות פנימי של Squarespace |

**המשמעות:** אחרי המעבר, `samuel-diamonds.io` עצמו לא יצביע לשום מקום —
רק `shop.samuel-diamonds.io` יעבוד. זה בסדר כל עוד אין לך אתר. כשיהיה,
מוסיפים רשומה ב-Cloudflare.

### אימות הדומיין מול Google

אין רשומת `google-site-verification` — האימות נעשה דרך הקשר בין
Google Domains ל-Workspace. המעבר לא אמור לבטל אותו. אם Google תבקש
אימות מחדש, היא תיתן רשומת TXT להוסיף ב-Cloudflare.

## 4. להחליף nameservers ב-Squarespace

> ### לפני הכל — DNSSEC
>
> בתפריט הצדדי של Squarespace יש **DNSSEC**. אם הוא **מופעל**, החלפת
> nameservers תשבור את הדומיין **לגמרי** — לא רק את המייל. הדפדפן פשוט
> לא ימצא אותו, ותיקון לוקח שעות.
>
> - [ ] היכנס ל-**DNSSEC** וודא שהוא **כבוי**. מופעל — כבה אותו,
>       וחכה שעה לפני שממשיכים.
> - [ ] אפשר להפעיל אותו מחדש מתוך Cloudflare אחרי שהמעבר הושלם.

- [ ] העתק את שני ה-nameservers ש-Cloudflare נותנת
      (למשל `arya.ns.cloudflare.com`).
- [ ] ב-Squarespace: **samuel-diamonds.io** ← **DNS** ← גלול ל-**Nameservers**.
- [ ] בחר **Use custom nameservers** (במקום Squarespace defaults),
      הזן את שני השמות ושמור.
- [ ] Squarespace תזהיר ש**ניהול ה-DNS שלה יפסיק לפעול** — זו בדיוק המטרה.
      מרגע זה כל הרשומות מנוהלות ב-Cloudflare, ולכן שלב 3 חייב להיות מושלם
      לפני שלוחצים כאן.
- [ ] חכה. בדרך כלל שעה עד ארבע, לפעמים 24. Cloudflare תשלח מייל
      *"is now active"*. עד אז הכל ממשיך לעבוד.

## 5. לוודא שהמייל חי

- [ ] שלח מייל מ-Gmail הפרטי אל `info@samuel-diamonds.io`.
- [ ] שלח גם החוצה מהכתובת העסקית — בודק SPF ו-DKIM.
- [ ] הרץ שוב `MX Lookup`. התוצאה חייבת להיות זהה לזו משלב 1.

**אם המייל נפל:** חזור ל-Squarespace ← DNS ← Nameservers ← **Use Squarespace
defaults**. תוך שעות המייל חוזר. תקן ב-Cloudflare בנחת ונסה שוב.
אל תתקן תחת לחץ.

## 6. לחבר את המערכת

רק אחרי ש-Cloudflare פעילה והמייל אומת.

```bash
winget install --id Cloudflare.cloudflared
pnpm setup:tunnel shop.samuel-diamonds.io
```

מכאן, שני חלונות בכל הפעלה:

```bash
pnpm build && pnpm start
cloudflared tunnel run samuel
```

- [ ] פתח `https://shop.samuel-diamonds.io` **מהטלפון בחיבור סלולרי** —
      לא מהמחשב ולא בוויי-פיי של הבית. זו הבדיקה האמיתית.

---

כל הקישורים במערכת ייבנו מהכתובת החדשה אוטומטית. **הסלאגים לא משתנים**,
ולכן קישור שכבר יצא ממשיך לעבוד.
