const express = require("express");
const { createOrder, completeOrder, listOrders, getOrderDetail, checkIngredients } = require("../controllers/orderController");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

router.post("/", requireAuth, requireRole(["STAFF", "MANAGER", "ADMIN"]), createOrder);
router.post("/check-ingredients", requireAuth, requireRole(["STAFF", "MANAGER", "ADMIN"]), checkIngredients);
router.put("/:id/complete", requireAuth, requireRole(["STAFF", "MANAGER", "ADMIN"]), completeOrder);
router.get("/", requireAuth, requireRole(["MANAGER", "ADMIN"]), listOrders);
router.get("/:id", requireAuth, requireRole(["MANAGER", "ADMIN"]), getOrderDetail);

module.exports = { orderRoutes: router };