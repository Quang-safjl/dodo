const express = require("express");
const { authRoutes } = require("./authRoutes");
const { categoryRoutes } = require("./categoryRoutes");
const { productRoutes } = require("./productRoutes");
const { orderRoutes } = require("./orderRoutes");
const { reportRoutes } = require("./reportRoutes");
const { revenueRoutes } = require("./revenueRoutes");
const { inventoryRoutes } = require("./inventoryRoutes");
const { menuRoutes } = require("./menuRoutes");
const { promotionRoutes } = require("./promotionRoutes");
const { employeeRoutes } = require("./employeeRoutes");
const receiptRoutes = require("./receiptRoutes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/categories", categoryRoutes);
router.use("/products", productRoutes);
router.use("/orders", orderRoutes);
router.use("/reports", reportRoutes);
router.use("/revenue", revenueRoutes);
router.use("/inventory", inventoryRoutes);
router.use("/menu", menuRoutes);
router.use("/promotions", promotionRoutes);
router.use("/employees", employeeRoutes);
router.use("/receipts", receiptRoutes);

module.exports = { apiRoutes: router };