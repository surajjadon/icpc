const DailyTask = require("../models/DailyTask.model");

exports.processDashboardData = async ({
  cfUserRes,
  cfStatusRes,
  cfRatingRes,
  acStatusRes,
  cfHandle,
  acHandle,
}) => {
  const solvedIDs = new Set();
  const activityDates = new Set();
  const tagCounts = {};
  const cfRatingCounts = {};
  const acIndexCounts = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 };

  // ================= CF PROCESSING =================
  if (cfStatusRes.data.status === "OK") {
    cfStatusRes.data.result.forEach((sub) => {
      if (sub.verdict === "OK") {
        const id = `CF-${sub.problem.contestId}-${sub.problem.index}`.toUpperCase();

        if (!solvedIDs.has(id)) {
          solvedIDs.add(id);

          sub.problem.tags?.forEach(
            (t) => (tagCounts[t] = (tagCounts[t] || 0) + 1)
          );

          if (sub.problem.rating) {
            cfRatingCounts[sub.problem.rating] =
              (cfRatingCounts[sub.problem.rating] || 0) + 1;
          }
        }

        activityDates.add(
          new Date(sub.creationTimeSeconds * 1000)
            .toISOString()
            .split("T")[0]
        );
      }
    });
  }

  // ================= ATCODER =================
  if (acHandle && Array.isArray(acStatusRes.data)) {
    acStatusRes.data.forEach((sub) => {
      if (sub.result === "AC") {
        const id = `AC-${sub.problem_id}`.toUpperCase();

        if (!solvedIDs.has(id)) {
          solvedIDs.add(id);
          const idx = sub.problem_id.split("_").pop().toUpperCase();
          if (acIndexCounts[idx] !== undefined) acIndexCounts[idx]++;
          tagCounts["AtCoder"] = (tagCounts["AtCoder"] || 0) + 1;
        }

        activityDates.add(
          new Date(sub.epoch_second * 1000)
            .toISOString()
            .split("T")[0]
        );
      }
    });
  }

  // ================= STREAK =================
  let streak = 0;
  let d = new Date();
  while (true) {
    const ds = d.toISOString().split("T")[0];
    if (activityDates.has(ds)) streak++;
    else if (ds !== new Date().toISOString().split("T")[0]) break;
    d.setDate(d.getDate() - 1);
  }

  // ================= DAILY TASKS =================
  const dailyEntries = await DailyTask.find().sort({ date: -1 });
  let idx = 1;
  const dailyDose = [];

  for (const entry of dailyEntries) {
    for (const task of entry.tasks) {
      let solved = false;

      const cfMatch = task.link.match(
        /(?:contest|problemset\/problem)\/(\d+)(?:\/problem\/|\/)([A-Z0-9]+)/i
      );
      if (cfMatch) {
        solved = solvedIDs.has(
          `CF-${cfMatch[1]}-${cfMatch[2].toUpperCase()}`
        );
      }

      const acMatch = task.link.match(/tasks\/([a-zA-Z0-9_]+)/);
      if (acMatch) {
        solved = solvedIDs.has(`AC-${acMatch[1].toUpperCase()}`);
      }

      dailyDose.push({
        id: idx++,
        date: entry.date,
        title: task.title,
        link: task.link,
        platform: task.link.includes("atcoder") ? "AtCoder" : "Codeforces",
        status: solved ? "solved" : "pending",
        tags: task.tags || ["Daily"],
      });
    }
  }

  return {
    solvedIDs,
    streak,
    dailyDose,
    tagCounts,
    cfRatingCounts,
    acIndexCounts,
  };
};
