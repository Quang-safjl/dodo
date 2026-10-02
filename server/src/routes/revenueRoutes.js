const express = require("express");
const { revenueReport } = require("../controllers/reportController");
const { requireAuth, requireRole } = require("../middleware/auth");

/**
 * Alias theo tài liệu: GET /api/revenue?groupBy=&from=&to=
 * (cùng handler với GET /api/reports/revenue)
 */
const router = express.Router();

router.get("/", requireAuth, requireRole(["MANAGER", "ADMIN"]), revenueReport);

module.exports = { revenueRoutes: router };
