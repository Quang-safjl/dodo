const express = require("express");
const { listInventory, createReceipt } = require("../controllers/inventoryController");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

router.get("/", requireAuth, requireRole(["MANAGER", "ADMIN"]), listInventory);
router.post("/receipt", requireAuth, requireRole(["MANAGER", "ADMIN"]), createReceipt);

module.exports = { inventoryRoutes: router };
