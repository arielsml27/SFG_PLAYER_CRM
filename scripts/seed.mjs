// Seeds the local SQLite database with realistic sample data so you can
// try the CRM immediately. Run with: node scripts/seed.mjs
import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import { randomUUID } from "node:crypto";

const dbFile = process.env.DATABASE_FILE || path.join(process.cwd(), "dev.db");
const db = new DatabaseSync(dbFile);
db.exec("PRAGMA foreign_keys = ON;");

function iso(y, m, d) {
  return new Date(Date.UTC(y, m - 1, d)).toISOString().slice(0, 10);
}
function daysFromNow(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
function rand(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function id() {
  return randomUUID();
}

function insert(table, columns, values) {
  const placeholders = columns.map(() => "?").join(", ");
  const stmt = db.prepare(`INSERT INTO ${table} (${columns.join(", ")}) VALUES (${placeholders})`);
  stmt.run(...values);
}

const now = () => new Date().toISOString();

console.log("Seeding database at", dbFile);

const clubDefs = [
  ["מכבי תל אביב", "ישראל", "ליגת העל"],
  ["הפועל תל אביב", "ישראל", "ליגת העל"],
  ["מכבי חיפה", "ישראל", "ליגת העל"],
  ['בית"ר ירושלים', "ישראל", "ליגת העל"],
  ["הפועל באר שבע", "ישראל", "ליגת העל"],
  ["רד סטאר בלגרד", "סרביה", "SuperLiga"],
  ["פרטיזן בלגרד", "סרביה", "SuperLiga"],
  ['צ"וקאריצ"קי', "סרביה", "SuperLiga"],
  ["וויקינג שטוונגר", "נורווגיה", "Eliteserien"],
  ["מולדה", "נורווגיה", "Eliteserien"],
];

const clubIds = {};
for (const [name, country, league] of clubDefs) {
  const cid = id();
  clubIds[name] = cid;
  insert(
    "clubs",
    ["id", "name", "country", "league", "created_at", "updated_at"],
    [cid, name, country, league, now(), now()]
  );
}

const positions = ["שוער", "בלם", "מגן ימני", "מגן שמאלי", "קשר הגנתי", "קשר מרכזי", "קשר יצירה", "כנף ימין", "כנף שמאל", "חלוץ"];
const feet = ["ימין", "שמאל", "שתי הרגליים"];
const statuses = ["PROSPECT", "SIGNED", "ACTIVE_CLIENT", "NEGOTIATION", "TRIAL", "LOAN", "FREE_AGENT", "MONITORING"];
const repStatuses = ["ACTIVE", "ENDED", "IN_NEGOTIATION", "UNKNOWN"];

const firstNames = ["איתי", "עומר", "דניאל", "יונתן", "עידו", "רועי", "אריאל", "טל", "גיא", "ניר", "אלון", "שי", "נועם", "אור", "אסף", "ליאור", "בן", "מתן", "יובל", "אלעד", "עמית", "דור", "יאיר", "רן"];
const lastNames = ["כהן", "לוי", "מזרחי", "פרץ", "ביטון", "אזולאי", "דהן", "אברהם", "חדד", "גבאי", "עמר", "בן דוד", "שרעבי", "וקנין", "טל", "רז", "אשכנזי", "יוסף", "חן", "מלכה", "סבן", "אוחיון", "פלד", "נחום"];
const englishFirst = ["Itay", "Omer", "Daniel", "Jonathan", "Ido", "Roy", "Ariel", "Tal", "Guy", "Nir", "Alon", "Shai", "Noam", "Or", "Asaf", "Lior", "Ben", "Matan", "Yuval", "Elad", "Amit", "Dor", "Yair", "Ran"];
const englishLast = ["Cohen", "Levi", "Mizrahi", "Peretz", "Biton", "Azoulay", "Dahan", "Avraham", "Hadad", "Gabay", "Amar", "Ben David", "Sharabi", "Vaknin", "Tal", "Raz", "Ashkenazi", "Yosef", "Hen", "Malka", "Saban", "Ohayon", "Peled", "Nahum"];

const playerCount = 24;
const playerIds = [];

for (let i = 0; i < playerCount; i++) {
  const firstName = firstNames[i % firstNames.length];
  const lastName = lastNames[i % lastNames.length];
  const birthYear = 2003 + (i % 8);
  const club = rand(clubDefs);
  const status = statuses[i % statuses.length];
  const repStatus = rand(repStatuses);
  const priority = Math.floor(Math.random() * 6);
  const pid = id();
  playerIds.push(pid);

  insert(
    "players",
    [
      "id", "first_name", "last_name", "full_name_hebrew", "full_name_english", "date_of_birth",
      "nationality", "main_position", "strong_foot", "current_club_id", "current_league", "current_country",
      "status", "internal_rating", "potential_rating", "priority_level", "representation_status",
      "agent_in_charge", "family_contact_name", "family_contact_phone", "notes", "next_action", "next_action_date",
      "created_at", "updated_at",
    ],
    [
      pid, firstName, lastName, `${firstName} ${lastName}`, `${englishFirst[i % englishFirst.length]} ${englishLast[i % englishLast.length]}`,
      iso(birthYear, 1 + (i % 12), 1 + (i % 27)),
      "ישראלי", positions[i % positions.length], feet[i % feet.length], clubIds[club[0]], club[2], club[1],
      status, 5 + (i % 5), 6 + (i % 4), priority, repStatus,
      "אריאל", `אבא של ${firstName}`, "050-1234567", "שחקן לדוגמה שנוצר על ידי סקריפט ה-seed.",
      i % 3 === 0 ? "לעדכן לינק SofaScore" : i % 3 === 1 ? "לבדוק סיום חוזה מול המועדון" : "לדבר עם המשפחה",
      daysFromNow(7 + i),
      now(), now(),
    ]
  );

  if (i % 5 !== 4) {
    const endsSoon = i % 4 === 0;
    insert(
      "club_contracts",
      ["id", "player_id", "club_id", "start_date", "end_date", "monthly_salary", "signing_bonus", "release_clause", "status", "created_at", "updated_at"],
      [id(), pid, clubIds[club[0]], iso(2023, 7, 1), endsSoon ? daysFromNow(20 + i * 2) : iso(2027, 6, 30), 3000 + i * 150, i % 2 === 0 ? 5000 : null, 150000 + i * 10000, "ACTIVE", now(), now()]
    );
  }

  if (i % 6 !== 5) {
    const endsSoon = i % 5 === 0;
    insert(
      "representation_agreements",
      ["id", "player_id", "start_date", "end_date", "commission_percent", "exclusive", "is_minor", "parents_signed", "signed_by", "status", "created_at", "updated_at"],
      [id(), pid, iso(2023, 1, 1), endsSoon ? daysFromNow(15 + i) : iso(2027, 12, 31), 10, 1, birthYear >= 2009 ? 1 : 0, birthYear >= 2009 ? "YES" : "NA", `${firstName} ${lastName}`, repStatus, now(), now()]
    );
  }

  insert(
    "player_links",
    ["id", "player_id", "type", "title", "url", "created_at"],
    [id(), pid, "TRANSFERMARKT", "פרופיל Transfermarkt", `https://www.transfermarkt.com/player/${i}`, now()]
  );
  if (i % 3 !== 0) {
    insert(
      "player_links",
      ["id", "player_id", "type", "title", "url", "created_at"],
      [id(), pid, "SOFASCORE", "פרופיל SofaScore", `https://www.sofascore.com/player/${i}`, now()]
    );
  }

  if (i % 4 !== 3) {
    insert(
      "videos",
      ["id", "player_id", "title", "type", "url", "date", "ready_to_send", "created_at"],
      [id(), pid, "היילייטס עונה נוכחית", "HIGHLIGHTS", `https://youtube.com/watch?v=demo${i}`, iso(2026, 3, 1), i % 2 === 0 ? 1 : 0, now()]
    );
  }

  if (i % 4 !== 0) {
    insert(
      "contacts",
      ["id", "player_id", "name", "role", "phone", "created_at"],
      [id(), pid, `אבא של ${firstName}`, "FATHER", "050-1234567", now()]
    );
  }

  insert(
    "timeline_events",
    ["id", "player_id", "type", "title", "event_date", "created_by", "created_at"],
    [id(), pid, "INTERNAL_NOTE", "שחקן נוסף למערכת", iso(2026, 1, 15), "אריאל", now()]
  );

  if (i % 3 === 0) {
    insert(
      "tasks",
      ["id", "player_id", "title", "owner", "due_date", "priority", "status", "created_at", "updated_at"],
      [id(), pid, `לבדוק סטטוס חוזה מול ${club[0]}`, "אריאל", daysFromNow(5 + i), i % 6 === 0 ? "CRITICAL" : i % 3 === 0 ? "HIGH" : "NORMAL", "OPEN", now(), now()]
    );
  }
}

insert(
  "tasks",
  ["id", "title", "owner", "priority", "status", "due_date", "created_at", "updated_at"],
  [id(), "גיבוי שבועי לקובץ SQLite", "אריאל", "HIGH", "OPEN", daysFromNow(3), now(), now()]
);
insert(
  "tasks",
  ["id", "title", "owner", "priority", "status", "created_at", "updated_at"],
  [id(), "לעדכן רשימת מועדונים רלוונטיים בסרביה", "אריאל", "NORMAL", "OPEN", now(), now()]
);

console.log(`Seed complete: ${playerIds.length} players, ${clubDefs.length} clubs.`);
db.close();
