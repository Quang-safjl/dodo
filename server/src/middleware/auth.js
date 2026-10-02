const { verifyAccessToken } = require("../utils/jwt");
const { Employee } = require("../models");

async function requireAuth(req, res, next) {
  try {
    const auth = req.headers.authorization || "";
    const [, token] = auth.split(" ");
    if (!token) return res.status(401).json({ message: "Missing token" });

    const payload = verifyAccessToken(token);
    const employee = await Employee.findByPk(payload.employeeId);
    if (!employee || employee.trangThai !== 1) return res.status(401).json({ message: "Invalid user" });

    req.user = {
      employeeId: employee.PK_NHAN_VIEN,
      role: employee.vaiTro,
      email: employee.email,
      name: employee.hoTen,
    };
    next();
  } catch (err) {
    return res.status(401).json({ message: "Unauthorized" });
  }
}

function requireRole(allowedRoles) {
  const set = new Set(allowedRoles);
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    if (!set.has(req.user.role)) return res.status(403).json({ message: "Forbidden" });
    next();
  };
}

module.exports = { requireAuth, requireRole };
