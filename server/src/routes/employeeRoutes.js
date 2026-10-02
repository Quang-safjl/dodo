const express = require("express");
const { listEmployees, createEmployee, updateEmployee, deleteEmployee } = require("../controllers/employeeController");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

router.get("/", requireAuth, requireRole(["ADMIN", "MANAGER"]), listEmployees);
router.post("/", requireAuth, requireRole(["ADMIN", "MANAGER"]), createEmployee);
router.put("/:id", requireAuth, requireRole(["ADMIN", "MANAGER"]), updateEmployee);
router.delete("/:id", requireAuth, requireRole(["ADMIN", "MANAGER"]), deleteEmployee);

module.exports = { employeeRoutes: router };
