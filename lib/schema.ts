import {
  pgTable,
  text,
  timestamp,
  uuid,
  jsonb,
  integer,
  index,
  primaryKey,
} from "drizzle-orm/pg-core";

// NextAuth required tables (Drizzle adapter schema)
export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  registeredAt: timestamp("registered_at", { mode: "date" }),
});

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compositePk: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  })
);

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (verificationToken) => ({
    compositePk: primaryKey({
      columns: [
        verificationToken.identifier,
        verificationToken.token,
      ],
    }),
  })
);

// App tables
export const domains = pgTable("domains", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  domainUrl: text("domain_url").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
});

export const promptSets = pgTable("prompt_sets", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  prompts: jsonb("prompts").$type<string[]>().notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
});


export const trackingConfigs = pgTable(
  "tracking_configs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    domainId: uuid("domain_id")
      .notNull()
      .references(() => domains.id, { onDelete: "cascade" }),
    promptSetId: uuid("prompt_set_id")
      .notNull()
      .references(() => promptSets.id, { onDelete: "cascade" }),
    interval: text("interval").$type<"daily" | "weekly" | "monthly" | "on_demand">(),
    nextRunAt: timestamp("next_run_at", { mode: "date" }),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
  },
  (table) => [
    index("tracking_configs_next_run").on(table.nextRunAt),
    index("tracking_configs_user").on(table.userId),
  ]
);

export const trackingRuns = pgTable("tracking_runs", {
  id: uuid("id").defaultRandom().primaryKey(),
  configId: uuid("config_id")
    .notNull()
    .references(() => trackingConfigs.id, { onDelete: "cascade" }),
  startedAt: timestamp("started_at", { mode: "date" }).defaultNow(),
  completedAt: timestamp("completed_at", { mode: "date" }),
  status: text("status").$type<"pending" | "running" | "completed" | "failed">().default("pending"),
});

export const trackingResults = pgTable("tracking_results", {
  id: uuid("id").defaultRandom().primaryKey(),
  runId: uuid("run_id")
    .notNull()
    .references(() => trackingRuns.id, { onDelete: "cascade" }),
  provider: text("provider").$type<"chatgpt" | "claude" | "gemini" | "perplexity">().notNull(),
  prompt: text("prompt").notNull(),
  response: text("response").notNull(),
  visibilityScore: integer("visibility_score"),
  mentionCount: integer("mention_count").default(0),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
});
