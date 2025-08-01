import { cleanupAnalyticsCollection } from "../lib/analytics-unified"

async function runCleanup() {
  try {
    console.log("🧹 Starting analytics collection cleanup...")
    const deletedCount = await cleanupAnalyticsCollection()
    console.log(`✅ Cleanup completed successfully! Deleted ${deletedCount} documents.`)
    process.exit(0)
  } catch (error) {
    console.error("❌ Cleanup failed:", error)
    process.exit(1)
  }
}

runCleanup()
