/**
 * Migration script: Creates teams for existing users who don't have one yet,
 * and sets teamId on all existing domains, prompt_sets, and tracking_configs.
 *
 * Run after applying the Drizzle migration:
 *   npx tsx scripts/migrate-existing-users-to-teams.ts
 */

import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, isNull } from "drizzle-orm";
import {
  users,
  teams,
  teamMembers,
  domains,
  promptSets,
  trackingConfigs,
} from "../lib/schema";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

async function main() {
  console.log("Starting migration: existing users → teams...\n");

  // Get all registered users
  const allUsers = await db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users);

  console.log(`Found ${allUsers.length} users total.\n`);

  let created = 0;
  let skipped = 0;

  for (const user of allUsers) {
    // Check if user already has a team
    const [existing] = await db
      .select()
      .from(teamMembers)
      .where(eq(teamMembers.userId, user.id))
      .limit(1);

    if (existing) {
      skipped++;
      continue;
    }

    // Create team
    const teamName = user.name ? `${user.name}s Team` : "Team";
    const [team] = await db
      .insert(teams)
      .values({ name: teamName })
      .returning();

    // Add user as owner
    await db.insert(teamMembers).values({
      teamId: team.id,
      userId: user.id,
      role: "owner",
    });

    // Update all user's resources with the new teamId
    await db
      .update(domains)
      .set({ teamId: team.id })
      .where(eq(domains.userId, user.id));

    await db
      .update(promptSets)
      .set({ teamId: team.id })
      .where(eq(promptSets.userId, user.id));

    await db
      .update(trackingConfigs)
      .set({ teamId: team.id })
      .where(eq(trackingConfigs.userId, user.id));

    created++;
    console.log(
      `  ✓ Team "${teamName}" erstellt für ${user.email || user.id}`
    );
  }

  console.log(
    `\nFertig! ${created} Teams erstellt, ${skipped} Nutzer übersprungen (hatten bereits ein Team).`
  );
}

main().catch((err) => {
  console.error("Migration fehlgeschlagen:", err);
  process.exit(1);
});
