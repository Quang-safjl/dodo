const express = require("express");
const { listProducts } = require("../controllers/productController");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

router.get("/", requireAuth, requireRole(["STAFF", "MANAGER", "ADMIN"]), listProducts);

module.exports = { productRoutes: router };
