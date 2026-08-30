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

פתח ב-Cloudflare את **DNS ← Records**, ולידו את הצילום משלב 1. שורה מול שורה.

- [ ] **MX** — הכי קריטי. העתק את מה שיש לך בפועל, אל תחליף תצורה.
- [ ] **SPF (TXT)** — `v=spf1 include:_spf.google.com ~all`
- [ ] **DKIM** — `google._domainkey`, שלם ובלי קיצור.
- [ ] **אימות דומיין** — TXT שמתחילה ב-`google-site-verification=`
- [ ] **A / CNAME** קיימים, אם יש אתר על הדומיין.

Google עובדת עם אחת משתי תצורות MX. **שלך היא זו שכבר קיימת.**

| תצורה | רשומות | עדיפות |
|---|---|---|
| חדשה | `smtp.google.com` | 1 |
| קלאסית | `ASPMX.L.GOOGLE.COM`<br>`ALT1.ASPMX.L.GOOGLE.COM`<br>`ALT2.ASPMX.L.GOOGLE.COM`<br>`ALT3.ASPMX.L.GOOGLE.COM`<br>`ALT4.ASPMX.L.GOOGLE.COM` | 1<br>5<br>5<br>10<br>10 |

## 4. להחליף nameservers ב-Squarespace

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
