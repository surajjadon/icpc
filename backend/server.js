require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// ==========================================
// 1. MONGODB CONNECTION
// ==========================================

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/cp-dashboard";

mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ MongoDB Connected"))
    .catch(err => console.error("❌ MongoDB Connection Error:", err));

const TaskSchema = new mongoose.Schema({
    date: {
        type: String,
        unique: true,
        default: () => new Date().toISOString().split('T')[0]
    },
    tasks: [{
        title: String,
        link: String,
        tags: [String]
    }]
});

const DailyTask = mongoose.model('DailyTask', TaskSchema);

// ==========================================
// 2. ADMIN API: Post Daily Tasks
// ==========================================

app.post('/api/daily', async (req, res) => {
    try {
        const { date, tasks } = req.body;
        if (!tasks || !Array.isArray(tasks)) {
            return res.status(400).json({ error: "Invalid format. 'tasks' must be an array." });
        }
        const targetDate = date || new Date().toISOString().split('T')[0];
        const updatedEntry = await DailyTask.findOneAndUpdate(
            { date: targetDate },
            { tasks: tasks },
            { new: true, upsert: true }
        );
        res.json({ success: true, message: "Tasks saved!", data: updatedEntry });
    } catch (err) {
        res.status(500).json({ error: "Failed to save tasks." });
    }
});

// ==========================================
// 3. COMBINED DASHBOARD API
// ==========================================
// Usage: /api/dashboard?cf=tourist&ac=chokudai

// ==========================================
// 3. COMBINED DASHBOARD API (FIXED)
// ==========================================

app.get('/api/dashboard', async (req, res) => {
    try {
        const cfHandle = req.query.cf;
        const acHandle = req.query.ac;

        if (!cfHandle) {
            return res.status(400).json({ error: "Please provide a Codeforces handle" });
        }

        // --- FETCH DATA ---
        const promises = [
            axios.get(`https://codeforces.com/api/user.info?handles=${cfHandle}`),
            axios.get(`https://codeforces.com/api/user.status?handle=${cfHandle}`),
            axios.get(`https://codeforces.com/api/user.rating?handle=${cfHandle}`)
        ];

        if (acHandle) {
            promises.push(axios.get(`https://kenkoooo.com/atcoder/atcoder-api/v3/user/submissions?user=${acHandle}&from_second=0`));
        }

        const results = await Promise.all(promises);
        
        const cfUserRes = results[0];
        const cfStatusRes = results[1];
        const cfRatingRes = results[2];
        const acStatusRes = acHandle ? results[3] : { data: [] };
        
        // --- DATA STORES ---
        // We use a Set because it ensures uniqueness. 
        // If a problem is added once (Accepted), it stays there, regardless of other failures.
        
        const solvedIDs = new Set();
        const activityDates = new Set();
        const tagCounts = {};
        const cfRatingCounts = {}; 
        const acIndexCounts = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 }; 

        // -------------------------------------------------------
        // 1. Process Codeforces (The Fix for Multiple Submissions)
        // -------------------------------------------------------

        if (cfStatusRes.data.status === 'OK') {
            cfStatusRes.data.result.forEach(sub => {
                // Only process if Verdict is OK. We ignore fails entirely.
                if (sub.verdict === 'OK') {
                    // FIX: Force UpperCase to match URL inputs case-insensitively
                    const id = `CF-${sub.problem.contestId}-${sub.problem.index}`.toUpperCase();
                    
                    if (!solvedIDs.has(id)) {
                        solvedIDs.add(id);
                        
                        // Tag Stats
                        if (sub.problem.tags) {
                            sub.problem.tags.forEach(tag => tagCounts[tag] = (tagCounts[tag] || 0) + 1);
                        }
                        // Rating Stats
                        if (sub.problem.rating) {
                            cfRatingCounts[sub.problem.rating] = (cfRatingCounts[sub.problem.rating] || 0) + 1;
                        }
                    }
                    // Activity Date
                    const date = new Date(sub.creationTimeSeconds * 1000);
                    activityDates.add(date.toISOString().split('T')[0]);
                }
            });
        }

        // -------------------------------------------------------
        // 2. Process AtCoder
        // -------------------------------------------------------

        if (acHandle && Array.isArray(acStatusRes.data)) {
            acStatusRes.data.forEach(sub => {
                if (sub.result === 'AC') {
                    // FIX: Force UpperCase
                    const id = `AC-${sub.problem_id}`.toUpperCase();
                    
                    if (!solvedIDs.has(id)) {
                        solvedIDs.add(id);
                        
                        // Extract Index (e.g., abc123_a -> A)
                        const parts = sub.problem_id.split('_');
                        const index = parts[parts.length - 1].toUpperCase();
                        if (acIndexCounts.hasOwnProperty(index)) acIndexCounts[index]++;
                        
                        tagCounts["AtCoder"] = (tagCounts["AtCoder"] || 0) + 1;
                    }
                    const date = new Date(sub.epoch_second * 1000);
                    activityDates.add(date.toISOString().split('T')[0]);
                }
            });
        }

        // 3. Streak Logic
        let currentStreak = 0;
        let d = new Date();
        // Check "Today" first. If no sub today, check yesterday to start counting.
        // (Optional: Adjust logic if you want 0 streak if not solved today)
        while (true) {
            const dateStr = d.toISOString().split('T')[0];
            if (activityDates.has(dateStr)) {
                currentStreak++;
            } else if (dateStr !== new Date().toISOString().split('T')[0]) {
                // If it's not today and we missed a day, break.
                break;
            }
            d.setDate(d.getDate() - 1);
        }

        // -------------------------------------------------------
        // 4. Daily Dose Processing (The Link Matching Fix)
        // -------------------------------------------------------

        const allDailyEntries = await DailyTask.find().sort({ date: -1 });
        let processedDailyDose = [];
        let globalIndex = 1;

        for (const entry of allDailyEntries) {
            const entryDate = entry.date;
            
            const tasksForDay = entry.tasks.map(task => {
                let isSolved = false;
                
                // --- CODEFORCES MATCHING ---
                // Regex handles: 
                // 1. https://codeforces.com/contest/1234/problem/C
                // 2. https://codeforces.com/problemset/problem/1234/C

                const cfMatch = task.link.match(/(?:contest|gym|problemset\/problem)\/(\d+)(?:\/problem\/|\/)([A-Z0-9]+)/i);
                
                if (cfMatch) {
                    // Clean inputs to ensure "1234-a" matches "1234-A" in the Set
                    const contestId = cfMatch[1];
                    const index = cfMatch[2].toUpperCase(); 
                    const checkId = `CF-${contestId}-${index}`;
                    isSolved = solvedIDs.has(checkId);
                }

                // --- ATCODER MATCHING ---
                // Regex handles: https://atcoder.jp/contests/abc123/tasks/abc123_a
                const acMatch = task.link.match(/tasks\/([a-zA-Z0-9_]+)/);
                
                if (acMatch) {
                    const problemId = acMatch[1].toUpperCase();
                    const checkId = `AC-${problemId}`;
                    isSolved = solvedIDs.has(checkId);
                }

                return {
                    id: globalIndex++,
                    date: entryDate,
                    platform: task.link.includes("atcoder") ? "AtCoder" : "Codeforces",
                    title: task.title,
                    link: task.link,
                    status: isSolved ? "solved" : "pending",
                    tags: task.tags || ["Daily"]
                };
            });
            processedDailyDose.push(...tasksForDay);
        }

        // ... (Keep the rest of your Ladder/Chart logic exactly as it was) ...
        
        // -------------------------------------------------------
        // LADDER CONFIGURATION 
        // -------------------------------------------------------

        const ladderLevels = [
            { id: 1, title: "AtCoder A", req: 50, type: "AC", index: "A" },
            { id: 2, title: "AtCoder B", req: 50, type: "AC", index: "B" },
            { id: 3, title: "CF 900", req: 30, type: "CF", rating: 900 },
            { id: 4, title: "CF 1000", req: 30, type: "CF", rating: 1000 },
            { id: 5, title: "CF 1100", req: 30, type: "CF", rating: 1100 },
            { id: 6, title: "AtCoder C", req: 50, type: "AC", index: "C" },
            { id: 7, title: "CF 1200", req: 30, type: "CF", rating: 1200 },
            { id: 8, title: "CF 1300", req: 30, type: "CF", rating: 1300 },
            { id: 9, title: "AtCoder D", req: 75, type: "AC", index: "D" },
            { id: 10, title: "CF 1400", req: 35, type: "CF", rating: 1400 },
            { id: 11, title: "CF 1500", req: 40, type: "CF", rating: 1500 },
            { id: 12, title: "CF 1600", req: 40, type: "CF", rating: 1600 },
            { id: 13, title: "AtCoder E", req: 75, type: "AC", index: "E" },
            { id: 14, title: "CF 1700", req: 60, type: "CF", rating: 1700 },
            { id: 15, title: "CF 1800", req: 75, type: "CF", rating: 1800 },
            { id: 16, title: "CF 1900", req: 75, type: "CF", rating: 1900 },
        ];

        let previousStatus = "completed";
        const processedLadder = ladderLevels.map(level => {
            let userCount = 0;
            let status = "locked";

            if (level.type === "CF") {
                userCount = cfRatingCounts[level.rating] || 0;
            } else if (level.type === "AC") {
                userCount = acIndexCounts[level.index] || 0;
            }

            if (previousStatus === "completed") {
                status = userCount >= level.req ? "completed" : "in-progress";
            } else {
                status = "locked";
            }
            previousStatus = status;

            return { 
                id: level.id, 
                title: level.title, 
                status, 
                req: level.req, 
                solved: userCount 
            };
        });

        // Response Data Prep
        const ratings = cfRatingRes.data.result || [];
        const chartData = ratings.map(c => ({
            date: new Date(c.ratingUpdateTimeSeconds * 1000).toLocaleDateString('en-US', { month: 'short', day: '2-digit' }),
            official: c.newRating,
            performance: c.oldRating + (c.newRating - c.oldRating) * 4
        }));

        const contestHistory = ratings.slice().reverse().map(c => {
            const diff = c.newRating - c.oldRating;
            return {
                date: new Date(c.ratingUpdateTimeSeconds * 1000).toISOString().split('T')[0],
                contest: c.contestName,
                rank: `${c.rank}`,
                change: diff >= 0 ? `+${diff}` : `${diff}`,
                level: c.newRating >= 1900 ? "CM" : c.newRating >= 1600 ? "Expert" :c.newRating >= 1400? "Specialist":c.newRating >= 1200?"Pupil":"NewBie"
            };
        });

        const radarData = Object.entries(tagCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 6)
            .map(([tag, count]) => ({
                subject: tag.charAt(0).toUpperCase() + tag.slice(1),
                A: count,
                fullMark: solvedIDs.size
            }));

        const userInfo = cfUserRes.data.result[0];
        
        res.json({
            user: {
                name: `${userInfo.firstName || ''} ${userInfo.lastName || ''}`.trim() || cfHandle,
                handle: `${cfHandle} | ${acHandle || 'N/A'}`,
                streak: currentStreak,
                avatar: userInfo.titlePhoto
            },
            dailyDose: processedDailyDose,
            ladder: processedLadder,
            chartData,
            contestHistory,
            radarData,
            stats: {
                totalSolved: solvedIDs.size,
                cfRating: userInfo.rating || 0
            }
        });

    } catch (err) {
        console.error("API Error:", err.message);
        res.status(500).json({ error: "Server Error" });
    }
});

// ==========================================
// 4. DETAILED ANALYSIS API (DATE RANGE)
// ==========================================
// Usage:
// /api/cf/detailed-analysis?handle=tourist&start=2024-01-01&end=2024-01-31

app.get('/api/cf/detailed-analysis', async (req, res) => {
    try {
        const { handle, start, end } = req.query;

        if (!handle || !start || !end) {
            return res.status(400).json({ error: "handle, start and end are required" });
        }

        const startTs = new Date(`${start}T00:00:00Z`).getTime() / 1000;
        const endTs = new Date(`${end}T23:59:59Z`).getTime() / 1000;

        // -----------------------------
        // Fetch Codeforces data
        // -----------------------------
        const [statusRes, ratingRes] = await Promise.all([
            axios.get(`https://codeforces.com/api/user.status?handle=${handle}`),
            axios.get(`https://codeforces.com/api/user.rating?handle=${handle}`)
        ]);

        if (statusRes.data.status !== "OK") {
            return res.status(500).json({ error: "Failed to fetch submissions" });
        }

        const submissions = statusRes.data.result;

        // -----------------------------
        // Solved / Attempted Problems
        // -----------------------------
        const solvedMap = new Map();
        const attemptedMap = new Map();

        // Also build a solved CF Set (for daily task matching)
        const solvedCFSet = new Set();

        submissions.forEach(sub => {
            if (
                sub.creationTimeSeconds < startTs ||
                sub.creationTimeSeconds > endTs ||
                !sub.problem ||
                !sub.problem.contestId
            ) return;

            const key = `${sub.problem.contestId}-${sub.problem.index}`;

            attemptedMap.set(key, sub.problem);

            if (sub.verdict === "OK") {
                solvedMap.set(key, sub.problem);
                solvedCFSet.add(`CF-${key}`.toUpperCase());
            }
        });

        const solvedProblems = [...solvedMap.values()];
        const pendingProblems = [...attemptedMap.values()].filter(
            p => !solvedMap.has(`${p.contestId}-${p.index}`)
        );

        // -----------------------------
        // Rating Logic
        // -----------------------------
        
        const ratingChanges = ratingRes.data.result.filter(
            r =>
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
            date: { $gte: start, $lte: end }
        });

        const dailySolved = [];
        const dailyUnsolved = [];

        dailyEntries.forEach(entry => {
            entry.tasks.forEach(task => {
                if (!task.link) return;

                // Match Codeforces problem link
                const cfMatch = task.link.match(
                    /(?:contest|problemset\/problem)\/(\d+)\/([A-Z0-9]+)/i
                );

                if (!cfMatch) return;

                const contestId = Number(cfMatch[1]);
                const index = cfMatch[2].toUpperCase();
                const cfKey = `CF-${contestId}-${index}`;

                // Try to find full problem info from solved/attempted maps
                const problem =
                    solvedMap.get(`${contestId}-${index}`) ||
                    attemptedMap.get(`${contestId}-${index}`);

                const payload = {
                    contestId,
                    index,
                    name: problem?.name || task.title,
                    rating: problem?.rating || "",
                    tags: problem?.tags || task.tags || []
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
                dailyTasksUnsolvedCount: dailyUnsolved.length
            },
            solvedProblems: solvedProblems.map(p => ({
                contestId: p.contestId,
                index: p.index,
                name: p.name,
                rating: p.rating || "",
                tags: p.tags || []
            })),
            pendingProblems: pendingProblems.map(p => ({
                contestId: p.contestId,
                index: p.index,
                name: p.name
            })),
            dailyTasksSolved: dailySolved,
            dailyTasksUnsolved: dailyUnsolved,
            contests: ratingChanges.map(r => ({
                contestId: r.contestId,
                contestName: r.contestName,
                oldRating: r.oldRating,
                newRating: r.newRating,
                delta: r.newRating - r.oldRating
            }))
        });

    } catch (err) {
        console.error("Detailed Analysis Error:", err.message);
        res.status(500).json({ error: "Server Error" });
    }
});



app.listen(PORT, () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
});