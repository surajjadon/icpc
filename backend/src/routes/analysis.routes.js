const router = require("express").Router();
const { getDetailedAnalysis } = require("../controllers/analysis.controller");

router.get("/cf/detailed-analysis", getDetailedAnalysis);

module.exports = router;
