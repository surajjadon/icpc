const mongoose = require("mongoose");

const TaskSchema = new mongoose.Schema({
  date: {
    type: String,
    unique: true,
    default: () => new Date().toISOString().split("T")[0],
  },
  tasks: [
    {
      title: String,
      link: String,
      tags: [String],
    },
  ],
});

module.exports = mongoose.model("DailyTask", TaskSchema);
