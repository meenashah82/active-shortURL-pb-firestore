import { migrateAnalyticsToUrls } from "../lib/analytics-unified"

async function runMigration() {
  console.log("🚀 Starting analytics to URLs migration...")
  console.log("This will merge all analytics data into the corresponding URL documents.")
  console.log("")

  try {
    const migratedCount = await migrateAnalyticsToUrls()
    console.log("")
    console.log("✅ Migration completed successfully!")
    console.log(`📊 Migrated ${migratedCount} analytics records`)
    console.log("")
    console.log("📋 What was migrated:")
    console.log("   • totalClicks from analytics → embedded in URL documents")
    console.log("   • lastClickAt from analytics → embedded in URL documents")
    console.log("   • clickEvents from analytics → embedded in URL documents")
    console.log("")
    console.log("🔍 Check your Firestore console:")
    console.log("   urls/{shortCode} now contains embedded analytics data")
    console.log("")
    console.log("📝 Next step: You can now safely delete the 'analytics' collection")
    console.log("   Run: npm run cleanup-analytics")
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
