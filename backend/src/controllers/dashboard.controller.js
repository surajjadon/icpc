const cf = require("../providers/codeforces.provider");
const ac = require("../providers/atcoder.provider");
const { processDashboardData } = require("../providers/dashboard.provider");

exports.getDashboard = async (req, res) => {
  try {
    const { cf: cfHandle, ac: acHandle } = req.query;

    if (!cfHandle) {
      return res.status(400).json({ error: "CF handle required" });
    }

    const requests = [
      cf.fetchUserInfo(cfHandle),
      cf.fetchUserStatus(cfHandle),
      cf.fetchUserRating(cfHandle),
    ];

    if (acHandle) {
      requests.push(ac.fetchSubmissions(acHandle));
    }

    const results = await Promise.all(requests);

    const cfUserRes = results[0];
    const cfStatusRes = results[1];
    const cfRatingRes = results[2];
    const acStatusRes = acHandle ? results[3] : { data: [] };

    const {
      solvedIDs,
      streak,
      dailyDose,
      tagCounts,
      cfRatingCounts,
      acIndexCounts,
    } = await processDashboardData({
      cfUserRes,
      cfStatusRes,
      cfRatingRes,
      acStatusRes,
      cfHandle,
      acHandle,
    });

    // ================= LADDER =================
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

    let prev = "completed";
    const ladder = ladderLevels.map((l) => {
      const solved =
        l.type === "CF"
          ? cfRatingCounts[l.rating] || 0
          : acIndexCounts[l.index] || 0;

      let status = "locked";
      if (prev === "completed") {
        status = solved >= l.req ? "completed" : "in-progress";
      }
      prev = status;

      return {
        id: l.id,
        title: l.title,
        status,
        solved,
        req: l.req,
      };
    });

    // ================= CHART =================
    const ratings = cfRatingRes.data.result || [];
    const chartData = ratings.map((c) => ({
      date: new Date(c.ratingUpdateTimeSeconds * 1000).toLocaleDateString(
        "en-US",
        { month: "short", day: "2-digit" }
      ),
      official: c.newRating,
      performance: c.oldRating + (c.newRating - c.oldRating) * 4,
    }));

    // ================= CONTEST HISTORY =================
    const contestHistory = ratings
      .slice()
      .reverse()
      .map((c) => {
        const diff = c.newRating - c.oldRating;
        return {
          date: new Date(c.ratingUpdateTimeSeconds * 1000)
            .toISOString()
            .split("T")[0],
          contest: c.contestName,
          rank: `${c.rank}`,
          change: diff >= 0 ? `+${diff}` : `${diff}`,
          level:
            c.newRating >= 1900
              ? "CM"
              : c.newRating >= 1600
              ? "Expert"
              : c.newRating >= 1400
              ? "Specialist"
              : c.newRating >= 1200
              ? "Pupil"
              : "NewBie",
        };
      });

    // ================= RADAR =================
    const radarData = Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6)
      .map(([tag, count]) => ({
        subject: tag.charAt(0).toUpperCase() + tag.slice(1),
        A: count,
        fullMark: solvedIDs.size,
      }));

    const userInfo = cfUserRes.data.result[0];

    // ================= FINAL RESPONSE =================
    res.json({
      user: {
        name:
          `${userInfo.firstName || ""} ${userInfo.lastName || ""}`.trim() ||
          cfHandle,
        handle: `${cfHandle} | ${acHandle || "N/A"}`,
        streak,
        avatar: userInfo.titlePhoto,
      },
      dailyDose,
      ladder,
      chartData,
      contestHistory,
      radarData,
      stats: {
        totalSolved: solvedIDs.size,
        cfRating: userInfo.rating || 0,
      },
    });
  } catch (err) {
    console.error("Dashboard Error:", err.message);
    res.status(500).json({ error: "Server Error" });
  }
};