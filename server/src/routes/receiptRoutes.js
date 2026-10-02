const express = require("express");
const { listReceipts, getReceiptDetail } = require("../controllers/receiptController");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

router.get("/", requireAuth, requireRole(["MANAGER", "ADMIN"]), listReceipts);
router.get("/:id", requireAuth, requireRole(["MANAGER", "ADMIN"]), getReceiptDetail);

module.exports = router;   // export trực tiếp router