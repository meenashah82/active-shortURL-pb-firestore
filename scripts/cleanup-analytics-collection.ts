import { cleanupAnalyticsCollection } from "../lib/analytics-unified"

async function runCleanup() {
  console.log("🧹 Starting cleanup of analytics collection...")
  console.log("This will permanently delete the old analytics collection.")
  console.log("")
  console.log("⚠️  WARNING: This action cannot be undone!")
  console.log("   Make sure the migration was successful before proceeding.")
  console.log("")

  try {
    const deletedCount = await cleanupAnalyticsCollection()
    console.log("")
    console.log("✅ Cleanup completed successfully!")
    console.log(`🗑️  Deleted ${deletedCount} analytics documents`)
    console.log("")
    console.log("🎉 Database migration is now complete!")
    console.log("   Your URLs collection now contains all analytics data.")
    process.exit(0)
  } catch (error) {
    console.error("")
    console.error("❌ Cleanup failed:", error)
    console.error("")
    console.error("Please check your Firebase configuration and try again.")
    process.exit(1)
  }
}

// Run the cleanup
runCleanup()
