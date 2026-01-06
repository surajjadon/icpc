const DailyTask = require("../models/DailyTask.model");

exports.postDailyTasks = async (req, res) => {
  try {
    const { date, tasks } = req.body;
    if (!Array.isArray(tasks)) {
      return res.status(400).json({ error: "tasks must be array" });
    }

    const targetDate =
      date || new Date().toISOString().split("T")[0];

    const saved = await DailyTask.findOneAndUpdate(
      { date: targetDate },
      { tasks },
      { new: true, upsert: true }
    );

    res.json({ success: true, data: saved });
  } catch {
    res.status(500).json({ error: "Failed to save tasks" });
  }
};
