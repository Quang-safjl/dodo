const express = require("express");
const {
  listPromotions,
  createPromotion,
  updatePromotion,
  deletePromotion,
  assignPromotionToDrinks,
} = require("../controllers/promotionController");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

router.get("/", requireAuth, requireRole(["MANAGER", "ADMIN"]), listPromotions);
router.post("/", requireAuth, requireRole(["MANAGER", "ADMIN"]), createPromotion);
router.put("/:id", requireAuth, requireRole(["MANAGER", "ADMIN"]), updatePromotion);
router.delete("/:id", requireAuth, requireRole(["MANAGER", "ADMIN"]), deletePromotion);
router.post("/:id/assign", requireAuth, requireRole(["MANAGER", "ADMIN"]), assignPromotionToDrinks);

module.exports = { promotionRoutes: router };
