import { sqliteTable, text, integer, real, uniqueIndex } from "drizzle-orm/sqlite-core";
import { relations, sql } from "drizzle-orm";

// ---------- Helpers ----------
const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());

const timestamps = {
  createdAt: text("created_at").notNull().default(sql`(current_timestamp)`),
  updatedAt: text("updated_at").notNull().default(sql`(current_timestamp)`),
};

// ---------- Clubs ----------
export const clubs = sqliteTable("clubs", {
  id: id(),
  name: text("name").notNull(),
  country: text("country"),
  league: text("league"),
  city: text("city"),
  website: text("website"),
  notes: text("notes"),
  ...timestamps,
});

// ---------- Players ----------
export const players = sqliteTable("players", {
  id: id(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  fullNameHebrew: text("full_name_hebrew"),
  fullNameEnglish: text("full_name_english"),
  email: text("email"),
  phone: text("phone"),
  photoPath: text("photo_path"),
  dateOfBirth: text("date_of_birth").notNull(), // ISO date
  nationality: text("nationality"),
  secondNationality: text("second_nationality"),
  passportNumber: text("passport_number"),
  height: real("height"),
  weight: real("weight"),
  mainPosition: text("main_position").notNull(),
  secondaryPositions: text("secondary_positions"),
  strongFoot: text("strong_foot"),

  currentClubId: text("current_club_id").references(() => clubs.id),
  currentLeague: text("current_league"),
  currentCountry: text("current_country"),

  // Football background
  startingPlace: text("starting_place"),
  startingAge: integer("starting_age"),
  previousClubs: text("previous_clubs"),
  trainingFrequency: text("training_frequency"),
  playerComparison: text("player_comparison"),

  // Habits
  nutritionDiscipline: text("nutrition_discipline"),
  extraTraining: text("extra_training"),
  externalProfessionals: text("external_professionals"),

  // Family / education / health background
  familyFootballBackground: text("family_football_background"),
  educationStatus: text("education_status"),
  languagesSpoken: text("languages_spoken"),
  injuryHistory: text("injury_history"),
  willingToRelocate: text("willing_to_relocate"),

  status: text("status").notNull().default("PROSPECT"),
  internalRating: integer("internal_rating"),
  potentialRating: integer("potential_rating"),
  priorityLevel: integer("priority_level").default(0),

  shortDescription: text("short_description"),
  strengths: text("strengths"),
  weaknesses: text("weaknesses"),
  playingStyle: text("playing_style"),
  idealRole: text("ideal_role"),
  targetLevel: text("target_level"),
  relevantClubs: text("relevant_clubs"),
  internalValuation: text("internal_valuation"),

  representationStatus: text("representation_status").notNull().default("UNKNOWN"),

  // BASIC (free self-registration), PREMIUM (paid monthly subscription), or GOLD (one-time paid package).
  // PREMIUM_ACTIVE is reserved for when real billing exists; nothing sets it yet.
  subscriptionTier: text("subscription_tier").notNull().default("BASIC"),
  premiumRequestedAt: text("premium_requested_at"),
  goldRequestedAt: text("gold_requested_at"),

  agentInCharge: text("agent_in_charge"),
  familyContactName: text("family_contact_name"),
  familyContactPhone: text("family_contact_phone"),
  familyContactEmail: text("family_contact_email"),
  address: text("address"),
  notes: text("notes"),

  tags: text("tags"),
  nextAction: text("next_action"),
  nextActionDate: text("next_action_date"),

  // AI-generated professional summary (web-search-backed), shown on the export report.
  aiSummary: text("ai_summary"),
  aiSummaryGeneratedAt: text("ai_summary_generated_at"),

  ...timestamps,
});

// ---------- Club contracts ----------
export const clubContracts = sqliteTable("club_contracts", {
  id: id(),
  playerId: text("player_id")
    .notNull()
    .references(() => players.id, { onDelete: "cascade" }),
  clubId: text("club_id").references(() => clubs.id),

  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),

  monthlySalary: real("monthly_salary"),
  signingBonus: real("signing_bonus"),
  releaseClause: real("release_clause"),
  sellOnPercent: real("sell_on_percent"),
  trainingCompensationNotes: text("training_compensation_notes"),
  bonuses: text("bonuses"),

  status: text("status").notNull().default("ACTIVE"),
  documentId: text("document_id"),
  notes: text("notes"),

  ...timestamps,
});

// ---------- Representation agreements ----------
export const representationAgreements = sqliteTable("representation_agreements", {
  id: id(),
  playerId: text("player_id")
    .notNull()
    .references(() => players.id, { onDelete: "cascade" }),

  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),

  commissionPercent: real("commission_percent"),
  exclusive: integer("exclusive", { mode: "boolean" }).default(false),
  isMinor: integer("is_minor", { mode: "boolean" }).default(false),
  parentsSigned: text("parents_signed").default("NA"),
  signedBy: text("signed_by"),
  documentId: text("document_id"),

  status: text("status").notNull().default("ACTIVE"),
  notes: text("notes"),

  ...timestamps,
});

// ---------- Links ----------
export const playerLinks = sqliteTable("player_links", {
  id: id(),
  playerId: text("player_id")
    .notNull()
    .references(() => players.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  title: text("title").notNull(),
  url: text("url").notNull(),
  notes: text("notes"),
  createdAt: text("created_at").notNull().default(sql`(current_timestamp)`),
});

// ---------- Videos ----------
export const videos = sqliteTable("videos", {
  id: id(),
  playerId: text("player_id")
    .notNull()
    .references(() => players.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  type: text("type").notNull(),
  url: text("url").notNull(),
  date: text("date"),
  readyToSend: integer("ready_to_send", { mode: "boolean" }).default(false),
  notes: text("notes"),
  createdAt: text("created_at").notNull().default(sql`(current_timestamp)`),
});

// ---------- Documents ----------
export const documents = sqliteTable("documents", {
  id: id(),
  playerId: text("player_id")
    .notNull()
    .references(() => players.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  type: text("type").notNull(),
  filePath: text("file_path"),
  expiryDate: text("expiry_date"),
  notes: text("notes"),
  createdAt: text("created_at").notNull().default(sql`(current_timestamp)`),
});

// ---------- Contacts ----------
export const contacts = sqliteTable("contacts", {
  id: id(),
  playerId: text("player_id")
    .notNull()
    .references(() => players.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  role: text("role").notNull(),
  phone: text("phone"),
  email: text("email"),
  whatsapp: text("whatsapp"),
  relation: text("relation"),
  notes: text("notes"),
  createdAt: text("created_at").notNull().default(sql`(current_timestamp)`),
});

// ---------- Timeline events ----------
export const timelineEvents = sqliteTable("timeline_events", {
  id: id(),
  playerId: text("player_id")
    .notNull()
    .references(() => players.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  eventDate: text("event_date").notNull(),
  createdBy: text("created_by"),
  link: text("link"),
  documentId: text("document_id"),
  createdAt: text("created_at").notNull().default(sql`(current_timestamp)`),
});

// ---------- Tasks ----------
export const tasks = sqliteTable("tasks", {
  id: id(),
  playerId: text("player_id").references(() => players.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  owner: text("owner"),
  dueDate: text("due_date"),
  priority: text("priority").notNull().default("NORMAL"),
  status: text("status").notNull().default("OPEN"),
  reminderDate: text("reminder_date"),
  ...timestamps,
});

// ---------- Scouting reports ----------
export const scoutingReports = sqliteTable("scouting_reports", {
  id: id(),
  playerId: text("player_id")
    .notNull()
    .unique()
    .references(() => players.id, { onDelete: "cascade" }),

  scoutedBy: text("scouted_by"),
  lastWatchedDate: text("last_watched_date"),
  summary: text("summary"),

  // Technical/tactical parameters depend on the player's position group
  // (goalkeeper / defender / midfielder / forward), stored as a JSON map
  // of skill-key -> 0-5 star rating (0.5 steps) since the parameter set varies.
  positionGroup: text("position_group"),
  technicalRatings: text("technical_ratings"),

  // Physical (0-5 stars, 0.5 steps)
  speed: real("speed"),
  pace: real("pace"),
  stamina: real("stamina"),
  explosiveness: real("explosiveness"),
  supportPlay: real("support_play"),
  crossing: real("crossing"),
  strength: real("strength"),
  durability: real("durability"),

  // Mental (0-5 stars, 0.5 steps)
  concentration: real("concentration"),
  attitude: real("attitude"),
  motivation: real("motivation"),
  workRate: real("work_rate"),
  leadership: real("leadership"),
  composure: real("composure"),

  // Family / parents assessment (0-5 stars, 0.5 steps)
  familyCooperation: real("family_cooperation"),
  familyInvolvementBalance: real("family_involvement_balance"),
  familyExpectations: real("family_expectations"),
  familyStability: real("family_stability"),
  familyProfessionalism: real("family_professionalism"),
  familyPositiveEncouragement: real("family_positive_encouragement"),
  familyWatchingCalmly: real("family_watching_calmly"),
  familyCommentsShoutingAtOthers: real("family_comments_shouting_at_others"),
  familyArguingWithOtherParents: real("family_arguing_with_other_parents"),

  // On-field behavior and actions (0-5 stars, 0.5 steps)
  workRateOffBall: real("work_rate_off_ball"),
  tacklingPressDefense: real("tackling_press_defense"),
  dribblingShootingCreating: real("dribbling_shooting_creating"),
  passingRangeUnderPressure: real("passing_range_under_pressure"),
  firstTouchTightSpace: real("first_touch_tight_space"),
  spaceAwareness: real("space_awareness"),
  teamCommunication: real("team_communication"),
  selfControlAfterFoul: real("self_control_after_foul"),
  gameReadingAnticipation: real("game_reading_anticipation"),

  // Body language and reactions (0-5 stars, 0.5 steps)
  postureConfidence: real("posture_confidence"),
  reactionToTeamLoss: real("reaction_to_team_loss"),
  reactionToOwnLoss: real("reaction_to_own_loss"),
  concentrationWhenUninvolved: real("concentration_when_uninvolved"),
  composureUnderPressure: real("composure_under_pressure"),
  teamOrganisationEncouragement: real("team_organisation_encouragement"),
  endGameEffort: real("end_game_effort"),
  respectForReferee: real("respect_for_referee"),
  attitudeDuringSubstitution: real("attitude_during_substitution"),
  coachBenchInteraction: real("coach_bench_interaction"),
  recoveryFromTackles: real("recovery_from_tackles"),

  // Overall rating (0-5 stars, 0.5 steps)
  generalTechnicalAbility: real("general_technical_ability"),
  mentalResilience: real("mental_resilience"),
  overallPotential: real("overall_potential"),

  ...timestamps,
});

// ---------- Deals ----------
export const deals = sqliteTable("deals", {
  id: id(),
  playerId: text("player_id")
    .notNull()
    .references(() => players.id, { onDelete: "cascade" }),
  clubId: text("club_id").references(() => clubs.id),
  type: text("type").notNull(),
  status: text("status").notNull().default("OPEN"),
  expectedValue: real("expected_value"),
  commissionPotential: real("commission_potential"),
  startDate: text("start_date"),
  expectedCloseDate: text("expected_close_date"),
  notes: text("notes"),
  ...timestamps,
});

// ---------- Extended questionnaire responses (one row per question answered) ----------
export const questionnaireResponses = sqliteTable(
  "questionnaire_responses",
  {
    id: id(),
    playerId: text("player_id")
      .notNull()
      .references(() => players.id, { onDelete: "cascade" }),
    sectionId: text("section_id").notNull(),
    questionId: text("question_id").notNull(),
    value: text("value"),
    ...timestamps,
  },
  (table) => [uniqueIndex("questionnaire_responses_player_question_idx").on(table.playerId, table.questionId)]
);

// ---------- CRM users (per-user login + player-level permissions) ----------
export const crmUsers = sqliteTable("crm_users", {
  id: id(),
  email: text("email").notNull().unique(),
  name: text("name"),
  passwordHash: text("password_hash").notNull(),
  passwordSalt: text("password_salt").notNull(),
  // ADMIN sees every player; AGENT sees only players assigned via userPlayerAssignments.
  role: text("role").notNull().default("AGENT"),
  ...timestamps,
});

export const userPlayerAssignments = sqliteTable(
  "user_player_assignments",
  {
    id: id(),
    userId: text("user_id")
      .notNull()
      .references(() => crmUsers.id, { onDelete: "cascade" }),
    playerId: text("player_id")
      .notNull()
      .references(() => players.id, { onDelete: "cascade" }),
    ...timestamps,
  },
  (table) => [uniqueIndex("user_player_assignments_user_player_idx").on(table.userId, table.playerId)]
);

// ---------- Prospects (שחקנים למעקב — pre-signing scouting leads) ----------
// Lighter-weight than `players`: no DOB/status/etc, just enough to track
// initial outreach before a lead becomes a full player record.
export const prospects = sqliteTable("prospects", {
  id: id(),
  name: text("name").notNull(),
  club: text("club"),
  position: text("position"),
  age: integer("age"),
  parentPhone: text("parent_phone"),
  contactedByUserId: text("contacted_by_user_id").references(() => crmUsers.id, { onDelete: "set null" }),
  // NOT_CONTACTED | CONTACTED_NO_MEETING | MEETING_SCHEDULED | MEETING_HELD
  status: text("status").notNull().default("NOT_CONTACTED"),
  meetingDate: text("meeting_date"),
  meetingTime: text("meeting_time"),
  meetingLocation: text("meeting_location"),
  followUpDate: text("follow_up_date"),
  notes: text("notes"),
  ...timestamps,
});

// ---------- Relations ----------
export const playersRelations = relations(players, ({ one, many }) => ({
  currentClub: one(clubs, { fields: [players.currentClubId], references: [clubs.id] }),
  clubContracts: many(clubContracts),
  representationAgreements: many(representationAgreements),
  links: many(playerLinks),
  videos: many(videos),
  documents: many(documents),
  contacts: many(contacts),
  timelineEvents: many(timelineEvents),
  tasks: many(tasks),
  deals: many(deals),
  questionnaireResponses: many(questionnaireResponses),
  scoutingReport: one(scoutingReports, { fields: [players.id], references: [scoutingReports.playerId] }),
}));

export const scoutingReportsRelations = relations(scoutingReports, ({ one }) => ({
  player: one(players, { fields: [scoutingReports.playerId], references: [players.id] }),
}));

export const clubsRelations = relations(clubs, ({ many }) => ({
  players: many(players),
  clubContracts: many(clubContracts),
  deals: many(deals),
}));

export const clubContractsRelations = relations(clubContracts, ({ one }) => ({
  player: one(players, { fields: [clubContracts.playerId], references: [players.id] }),
  club: one(clubs, { fields: [clubContracts.clubId], references: [clubs.id] }),
}));

export const representationAgreementsRelations = relations(representationAgreements, ({ one }) => ({
  player: one(players, { fields: [representationAgreements.playerId], references: [players.id] }),
}));

export const playerLinksRelations = relations(playerLinks, ({ one }) => ({
  player: one(players, { fields: [playerLinks.playerId], references: [players.id] }),
}));

export const videosRelations = relations(videos, ({ one }) => ({
  player: one(players, { fields: [videos.playerId], references: [players.id] }),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  player: one(players, { fields: [documents.playerId], references: [players.id] }),
}));

export const contactsRelations = relations(contacts, ({ one }) => ({
  player: one(players, { fields: [contacts.playerId], references: [players.id] }),
}));

export const timelineEventsRelations = relations(timelineEvents, ({ one }) => ({
  player: one(players, { fields: [timelineEvents.playerId], references: [players.id] }),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  player: one(players, { fields: [tasks.playerId], references: [players.id] }),
}));

export const dealsRelations = relations(deals, ({ one }) => ({
  player: one(players, { fields: [deals.playerId], references: [players.id] }),
  club: one(clubs, { fields: [deals.clubId], references: [clubs.id] }),
}));

export const questionnaireResponsesRelations = relations(questionnaireResponses, ({ one }) => ({
  player: one(players, { fields: [questionnaireResponses.playerId], references: [players.id] }),
}));

export const crmUsersRelations = relations(crmUsers, ({ many }) => ({
  assignments: many(userPlayerAssignments),
}));

export const userPlayerAssignmentsRelations = relations(userPlayerAssignments, ({ one }) => ({
  user: one(crmUsers, { fields: [userPlayerAssignments.userId], references: [crmUsers.id] }),
  player: one(players, { fields: [userPlayerAssignments.playerId], references: [players.id] }),
}));

export const prospectsRelations = relations(prospects, ({ one }) => ({
  contactedBy: one(crmUsers, { fields: [prospects.contactedByUserId], references: [crmUsers.id] }),
}));
