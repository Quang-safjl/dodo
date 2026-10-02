const express = require("express");
const { listCategoriesPublic } = require("../controllers/categoryController");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

router.get("/", requireAuth, requireRole(["STAFF", "MANAGER", "ADMIN"]), listCategoriesPublic);

module.exports = { categoryRoutes: router };

