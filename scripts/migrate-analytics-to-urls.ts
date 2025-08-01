import { migrateAnalyticsToUrls } from "../lib/analytics-unified"

async function runMigration() {
  try {
    console.log("🚀 Starting analytics migration...")
    const migratedCount = await migrateAnalyticsToUrls()
    console.log(`✅ Migration completed successfully! Migrated ${migratedCount} records.`)
    process.exit(0)
  } catch (error) {
    console.error("❌ Migration failed:", error)
    process.exit(1)
  }
}

runMigration()
