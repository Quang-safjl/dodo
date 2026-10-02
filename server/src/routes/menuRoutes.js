const express = require("express");
const {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  listDrinks,
  getDrinkDetail,
  createDrink,
  updateDrink,
  deleteDrink,
} = require("../controllers/menuController");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

router.get("/categories", requireAuth, requireRole(["MANAGER", "ADMIN"]), listCategories);
router.post("/categories", requireAuth, requireRole(["MANAGER", "ADMIN"]), createCategory);
router.put("/categories/:id", requireAuth, requireRole(["MANAGER", "ADMIN"]), updateCategory);
router.delete("/categories/:id", requireAuth, requireRole(["MANAGER", "ADMIN"]), deleteCategory);

router.get("/drinks", requireAuth, requireRole(["MANAGER", "ADMIN"]), listDrinks);
router.get("/drinks/:id", requireAuth, requireRole(["MANAGER", "ADMIN"]), getDrinkDetail);
router.post("/drinks", requireAuth, requireRole(["MANAGER", "ADMIN"]), createDrink);
router.put("/drinks/:id", requireAuth, requireRole(["MANAGER", "ADMIN"]), updateDrink);
router.delete("/drinks/:id", requireAuth, requireRole(["MANAGER", "ADMIN"]), deleteDrink);

module.exports = { menuRoutes: router };
