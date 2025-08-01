import { cleanupAnalyticsCollection } from "../lib/analytics-unified"

async function runCleanup() {
  console.log("🧹 Starting analytics collection cleanup...")
  console.log("⚠️  WARNING: This will permanently delete the 'analytics' collection!")
  console.log("Make sure you have run the migration script first.")
  console.log("")

  // Simple confirmation (in a real app, you might want a more robust confirmation)
  console.log("Proceeding with cleanup in 3 seconds...")
  await new Promise((resolve) => setTimeout(resolve, 3000))

  try {
    await cleanupAnalyticsCollection()
    console.log("")
    console.log("✅ Cleanup completed successfully!")
    console.log("")
    console.log("📋 What was cleaned up:")
    console.log("   • Deleted all documents in the 'analytics' collection")
    console.log("   • Analytics data is now only stored in URL documents")
    console.log("")
    console.log("🎉 Database structure is now unified!")
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
