const bcrypt = require("bcryptjs");
const { z } = require("zod");
const { Employee } = require("../models");

async function listEmployees(req, res, next) {
  try {
    const items = await Employee.findAll({ order: [["PK_NHAN_VIEN", "DESC"]] });
    return res.json({
      items: items.map((e) => ({
        id: e.PK_NHAN_VIEN,
        name: e.hoTen,
        email: e.email,
        role: e.vaiTro,
        isActive: e.trangThai === 1,
        createdAt: e.ngayTao,
      })),
    });
  } catch (err) {
    return next(err);
  }
}

const createSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email(),
  password: z.string().min(6).max(100),
  role: z.enum(["ADMIN", "MANAGER", "STAFF"]).default("STAFF"),
});

async function createEmployee(req, res, next) {
  try {
    const { name, email, password, role } = createSchema.parse(req.body);
    const matKhauHash = await bcrypt.hash(password, 10);
    const e = await Employee.create({ hoTen: name, email, matKhauHash, vaiTro: role, trangThai: 1 });
    return res.status(201).json({ id: e.PK_NHAN_VIEN });
  } catch (err) {
    return next(err);
  }
}

const updateSchema = z.object({
  name: z.string().min(1).max(255),
  role: z.enum(["ADMIN", "MANAGER", "STAFF"]),
  isActive: z.boolean(),
  password: z.string().min(6).max(100).optional(),
});

async function updateEmployee(req, res, next) {
  try {
    const id = Number(req.params.id);
    const { name, role, isActive, password } = updateSchema.parse(req.body);
    const e = await Employee.findByPk(id);
    if (!e) return res.status(404).json({ message: "Not found" });
    e.hoTen = name;
    e.vaiTro = role;
    e.trangThai = isActive ? 1 : 0;
    if (password) e.matKhauHash = await bcrypt.hash(password, 10);
    await e.save();
    return res.json({ message: "OK" });
  } catch (err) {
    return next(err);
  }
}

async function deleteEmployee(req, res, next) {
  try {
    const id = Number(req.params.id);
    const e = await Employee.findByPk(id);
    if (!e) return res.status(404).json({ message: "Not found" });
    e.trangThai = 0;
    await e.save();
    return res.json({ message: "OK" });
  } catch (err) {
    return next(err);
  }
}

module.exports = { listEmployees, createEmployee, updateEmployee, deleteEmployee };

