const axios = require("axios");
const DailyTask = require("../models/DailyTask.model");

// ==========================================
// DETAILED ANALYSIS CONTROLLER
// Usage:
// /api/cf/detailed-analysis?handle=tourist&start=2024-01-01&end=2024-01-31
// ==========================================

exports.getDetailedAnalysis = async (req, res) => {
  try {
    const { handle, start, end } = req.query;

    if (!handle || !start || !end) {
      return res
        .status(400)
        .json({ error: "handle, start and end are required" });
    }

    const startTs = new Date(`${start}T00:00:00Z`).getTime() / 1000;
    const endTs = new Date(`${end}T23:59:59Z`).getTime() / 1000;

    // -----------------------------
    // Fetch Codeforces data
    // -----------------------------
    const [statusRes, ratingRes] = await Promise.all([
      axios.get(`https://codeforces.com/api/user.status?handle=${handle}`),
      axios.get(`https://codeforces.com/api/user.rating?handle=${handle}`),
    ]);

    if (statusRes.data.status !== "OK") {
      return res
        .status(500)
        .json({ error: "Failed to fetch submissions" });
    }

    const submissions = statusRes.data.result;

    // -----------------------------
    // Solved / Attempted Problems
    // -----------------------------
    const solvedMap = new Map();
    const attemptedMap = new Map();

    // Used for daily task matching
    const solvedCFSet = new Set();

    submissions.forEach((sub) => {
      if (
        sub.creationTimeSeconds < startTs ||
        sub.creationTimeSeconds > endTs ||
        !sub.problem ||
        !sub.problem.contestId
      )
        return;

      const key = `${sub.problem.contestId}-${sub.problem.index}`;

      attemptedMap.set(key, sub.problem);

      if (sub.verdict === "OK") {
        solvedMap.set(key, sub.problem);
        solvedCFSet.add(`CF-${key}`.toUpperCase());
      }
    });

    const solvedProblems = [...solvedMap.values()];
    const pendingProblems = [...attemptedMap.values()].filter(
      (p) => !solvedMap.has(`${p.contestId}-${p.index}`)
    );

    // -----------------------------
    // Rating Logic
    // -----------------------------
    const ratingChanges = ratingRes.data.result.filter(
      (r) =>
        r.ratingUpdateTimeSeconds >= startTs &&
        r.ratingUpdateTimeSeconds <= endTs
    );

    const ratingChange = ratingChanges.reduce(
      (sum, r) => sum + (r.newRating - r.oldRating),
      0
    );

    // -----------------------------
    // Daily Task Analysis
    // -----------------------------
    const dailyEntries = await DailyTask.find({
      date: { $gte: start, $lte: end },
    });

    const dailySolved = [];
    const dailyUnsolved = [];

    dailyEntries.forEach((entry) => {
      entry.tasks.forEach((task) => {
        if (!task.link) return;

        // Match Codeforces problem link
        const cfMatch = task.link.match(
          /(?:contest|problemset\/problem)\/(\d+)\/([A-Z0-9]+)/i
        );

        if (!cfMatch) return;

        const contestId = Number(cfMatch[1]);
        const index = cfMatch[2].toUpperCase();
        const cfKey = `CF-${contestId}-${index}`;

        const problem =
          solvedMap.get(`${contestId}-${index}`) ||
          attemptedMap.get(`${contestId}-${index}`);

        const payload = {
          contestId,
          index,
          name: problem?.name || task.title,
          rating: problem?.rating || "",
          tags: problem?.tags || task.tags || [],
        };

        if (solvedCFSet.has(cfKey)) {
          dailySolved.push(payload);
        } else {
          dailyUnsolved.push(payload);
        }
      });
    });

    // -----------------------------
    // Final Response
    // -----------------------------
    res.json({
      handle,
      period: { start, end },
      summary: {
        solvedCount: solvedProblems.length,
        pendingCount: pendingProblems.length,
        contestCount: ratingChanges.length,
        ratingChange,
        dailyTasksSolvedCount: dailySolved.length,
        dailyTasksUnsolvedCount: dailyUnsolved.length,
      },
      solvedProblems: solvedProblems.map((p) => ({
        contestId: p.contestId,
        index: p.index,
        name: p.name,
        rating: p.rating || "",
        tags: p.tags || [],
      })),
      pendingProblems: pendingProblems.map((p) => ({
        contestId: p.contestId,
        index: p.index,
        name: p.name,
      })),
      dailyTasksSolved: dailySolved,
      dailyTasksUnsolved: dailyUnsolved,
      contests: ratingChanges.map((r) => ({
        contestId: r.contestId,
        contestName: r.contestName,
        oldRating: r.oldRating,
        newRating: r.newRating,
        delta: r.newRating - r.oldRating,
      })),
    });
  } catch (err) {
    console.error("Detailed Analysis Error:", err.message);
    res.status(500).json({ error: "Server Error" });
  }
};
