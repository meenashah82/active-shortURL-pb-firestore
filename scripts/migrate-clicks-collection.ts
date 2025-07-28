import { migrateToClicksCollection } from "../lib/analytics-clean"

async function runMigration() {
  console.log("🚀 Starting clicks collection migration...")
  console.log("This will create a clicks document for each existing shortcode.")
  console.log("")

  try {
    await migrateToClicksCollection()
    console.log("")
    console.log("✅ Migration completed successfully!")
    console.log('You can now check your Firestore console to see the new "clicks" collection.')
    process.exit(0)
  } catch (error) {
    console.error("")
    console.error("❌ Migration failed:", error)
    console.error("")
    console.error("Please check your Firebase configuration and try again.")
    process.exit(1)
  }
}

// Run the migration
runMigration()
