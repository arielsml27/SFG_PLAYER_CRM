// הקמה חד-פעמית של מנהרה קבועה בשם, עם כתובת שלא משתנה.
//
//   node scripts/setup-tunnel.mjs shop.הדומיין-שלך.com
//   node scripts/setup-tunnel.mjs shop.example.com --dry-run
//
// אחרי ההקמה מריצים בשגרה:  pnpm start  +  cloudflared tunnel run samuel
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const TUNNEL_NAME = process.env.TUNNEL_NAME || "samuel";
const PORT = process.env.PORT || "3000";
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const hostname = args.find((a) => !a.startsWith("--"));

const cfDir = path.join(os.homedir(), ".cloudflared");
const configPath = path.join(cfDir, "config.yml");

function die(...lines) {
  console.error("");
  for (const line of lines) console.error("  " + line);
  console.error("");
  process.exit(1);
}

function run(cmdArgs) {
  if (dryRun) {
    console.log(`  [יבש] cloudflared ${cmdArgs.join(" ")}`);
    return { status: 0, stdout: "", stderr: "" };
  }
  const res = spawnSync("cloudflared", cmdArgs, { encoding: "utf8" });
  if (res.error?.code === "ENOENT") {
    die(
      "cloudflared לא מותקן.",
      "",
      "Windows:  winget install --id Cloudflare.cloudflared",
      "macOS:    brew install cloudflared"
    );
  }
  return res;
}

if (!hostname) {
  die(
    "חסרה כתובת.",
    "",
    "  node scripts/setup-tunnel.mjs shop.הדומיין-שלך.com",
    "",
    "אם כבר יש לך דומיין לעסק, אין צורך בחדש — תת-דומיין מספיק."
  );
}
if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(hostname)) {
  die(`"${hostname}" לא נראית ככתובת תקינה.`, "דוגמה: shop.samuel.co.il");
}

console.log(`מקים מנהרה בשם "${TUNNEL_NAME}" עבור ${hostname}`);
console.log("");

// 1. התחברות — נדרשת פעם אחת, פותחת דפדפן לבחירת הדומיין
if (!dryRun && !fs.existsSync(path.join(cfDir, "cert.pem"))) {
  console.log("[1/4] התחברות ל-Cloudflare — ייפתח דפדפן, בחר את הדומיין שלך…");
  const res = run(["tunnel", "login"]);
  if (res.status !== 0) die("ההתחברות נכשלה.", res.stderr || "");
} else {
  console.log("[1/4] כבר מחובר ל-Cloudflare");
}

// 2. יצירת המנהרה, אם עוד לא קיימת
console.log("[2/4] יצירת המנהרה…");
const list = run(["tunnel", "list"]);
if (!dryRun && list.stdout?.includes(TUNNEL_NAME)) {
  console.log(`      "${TUNNEL_NAME}" כבר קיימת`);
} else {
  const res = run(["tunnel", "create", TUNNEL_NAME]);
  if (!dryRun && res.status !== 0) die("יצירת המנהרה נכשלה.", res.stderr || "");
}

// 3. הפניית ה-DNS
console.log("[3/4] הפניית הכתובת אל המנהרה…");
const dns = run(["tunnel", "route", "dns", TUNNEL_NAME, hostname]);
if (!dryRun && dns.status !== 0 && !/already exists/i.test(dns.stderr ?? "")) {
  die(
    "הפניית ה-DNS נכשלה.",
    (dns.stderr || "").trim(),
    "",
    "הסיבה הנפוצה: הדומיין לא מנוהל ב-Cloudflare.",
    "צריך להפנות אליו את ה-nameservers אצל הרשם — חינם, ולוקח כמה שעות."
  );
}

// 4. קובץ ההגדרות
console.log("[4/4] כתיבת קובץ ההגדרות…");
const credentials = dryRun
  ? "<נתיב לקובץ ה-json שנוצר>"
  : (fs
      .readdirSync(cfDir)
      .filter((f) => f.endsWith(".json"))
      .map((f) => path.join(cfDir, f))
      .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)[0] ?? "");

const config = `# נוצר על ידי scripts/setup-tunnel.mjs
tunnel: ${TUNNEL_NAME}
credentials-file: ${credentials}

ingress:
  - hostname: ${hostname}
    service: http://localhost:${PORT}
  - service: http_status:404
`;

if (dryRun) {
  console.log("");
  console.log(`      היה נכתב אל ${configPath}:`);
  console.log("");
  console.log(config.split("\n").map((l) => "      " + l).join("\n"));
} else {
  if (fs.existsSync(configPath)) {
    const backup = `${configPath}.bak-${Date.now()}`;
    fs.copyFileSync(configPath, backup);
    console.log(`      גיבוי ההגדרות הקודמות: ${backup}`);
  }
  fs.mkdirSync(cfDir, { recursive: true });
  fs.writeFileSync(configPath, config);
}

// שמירת הכתובת ל-.env.local, כדי ש-pnpm tunnel ידע להשתמש בה
const envPath = path.join(process.cwd(), ".env.local");
const existing = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";
const url = `https://${hostname}`;
const next = existing.includes("TUNNEL_HOSTNAME=")
  ? existing.replace(/^TUNNEL_HOSTNAME=.*$/m, `TUNNEL_HOSTNAME=${hostname}`)
  : `${existing.replace(/\n*$/, existing ? "\n" : "")}TUNNEL_HOSTNAME=${hostname}\n`;
const withBase = next.includes("PUBLIC_BASE_URL=")
  ? next.replace(/^PUBLIC_BASE_URL=.*$/m, `PUBLIC_BASE_URL=${url}`)
  : `${next}PUBLIC_BASE_URL=${url}\n`;

if (dryRun) {
  console.log("");
  console.log("      היה נכתב אל .env.local:");
  console.log(`        TUNNEL_HOSTNAME=${hostname}`);
  console.log(`        PUBLIC_BASE_URL=${url}`);
} else {
  fs.writeFileSync(envPath, withBase);
}

console.log("");
console.log("  ─────────────────────────────────────────────");
console.log(`  הכתובת הקבועה:  ${url}`);
console.log("  ─────────────────────────────────────────────");
console.log("");
console.log("  מעכשיו, בכל הפעלה — שני חלונות:");
console.log("");
console.log("    pnpm build && pnpm start");
console.log(`    cloudflared tunnel run ${TUNNEL_NAME}`);
console.log("");
console.log("  הכתובת הזו לא תשתנה יותר. לינק שתשלח היום יעבוד גם בעוד שנה.");
console.log("");
