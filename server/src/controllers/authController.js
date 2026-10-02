const bcrypt = require("bcryptjs");
const { z } = require("zod");
const { Employee } = require("../models");
const { signAccessToken } = require("../utils/jwt");

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

async function login(req, res, next) {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const employee = await Employee.findOne({ where: { email } });
    if (!employee || employee.trangThai !== 1) return res.status(401).json({ message: "Sai thông tin đăng nhập" });

    const ok = await bcrypt.compare(password, employee.matKhauHash);
    if (!ok) return res.status(401).json({ message: "Sai thông tin đăng nhập" });

    const token = signAccessToken({ employeeId: employee.PK_NHAN_VIEN, role: employee.vaiTro });
    return res.json({
      accessToken: token,
      user: {
        employeeId: employee.PK_NHAN_VIEN,
        name: employee.hoTen,
        email: employee.email,
        role: employee.vaiTro,
      },
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = { login };
