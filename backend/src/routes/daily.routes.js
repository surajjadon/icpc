const router = require("express").Router();
const { postDailyTasks } = require("../controllers/daily.controller");

router.post("/", postDailyTasks);

module.exports = router;
