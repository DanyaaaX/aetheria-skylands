import express from 'express';
// 👇 ВАЖЛИВО: В ES Modules обов'язково вказувати розширення .js
import User from '../models/User.js';

const router = express.Router();

/**
 * GET /api/leaderboard
 * Maps to the root of the mounted path. Provides elite records for the Hall of Records.
 */
router.get('/', async (req, res) => {
  try {
    console.log(">> REGISTRY HALL: Synchronizing leaderboard data...");
    
    // Attempt to fetch real user data
    const eliteGuardians = await User.find()
      .sort({ points: -1, inviteCount: -1 })
      .limit(100)
      .select('username points inviteCount -_id')
      .lean();

    // FAILOVER: If database query yields no results, return high-quality Genesis records
    if (!eliteGuardians || eliteGuardians.length === 0) {
      console.log(">> REGISTRY HALL: Real-time records empty. Injecting Genesis Data.");
      const genesisData = [
        { username: "GENESIS_ARCHITECT", points: 5000, inviteCount: 100 },
        { username: "AETHER_PRIME", points: 2500, inviteCount: 50 },
        { username: "SKYLAND_UNIT_01", points: 1500, inviteCount: 30 },
        { username: "NEURAL_STORM", points: 800, inviteCount: 15 },
        { username: "VOID_WALKER", points: 300, inviteCount: 5 }
      ];
      return res.status(200).json(genesisData);
    }

    res.status(200).json(eliteGuardians);
  } catch (err) {
    console.error("!! LEADERBOARD SYNC BREAK:", err.message);
    // CRITICAL FAIL-SAFE: Return an empty array instead of 500/404 to keep Frontend stable
    res.status(200).json([]);
  }
});

// Explicit health check sub-route
router.get('/status', (req, res) => res.json({ service: 'Hall of Records', status: 'Operational' }));

export default router;