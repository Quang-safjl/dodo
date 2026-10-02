const express = require("express");
const { revenueReport } = require("../controllers/reportController");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

router.get("/revenue", requireAuth, requireRole(["MANAGER", "ADMIN"]), revenueReport);

module.exports = { reportRoutes: router };
