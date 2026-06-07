export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { syncIntelligence } = await import("./lib/intelligence");

    console.log(">>> [System] Initializing Intelligence Background Scheduler...");

    // Initial sync on start
    syncIntelligence().catch(err => console.error("Initial Sync Failed:", err));

    // Schedule sync every 10 minutes (600,000 ms)
    setInterval(() => {
        console.log(">>> [System] Running Scheduled Intelligence Sync...");
        syncIntelligence().catch(err => console.error("Scheduled Sync Failed:", err));
    }, 10 * 60 * 1000);
    
    console.log(">>> [System] Scheduler active: Syncing every 10 minutes.");
  }
}
