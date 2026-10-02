const { z } = require("zod");
const { Op } = require("sequelize");
const { sequelize, Ingredient, Receipt, ReceiptItem } = require("../models");

async function listInventory(req, res, next) {
  try {
    const items = await Ingredient.findAll({ where: { trangThai: 1 }, order: [["PK_NGUYEN_LIEU", "DESC"]] });
    return res.json({
      items: items.map((i) => ({
        id: i.PK_NGUYEN_LIEU,
        name: i.tenNguyenLieu,
        unit: i.donViTinh,
        stock: Number(i.soLuongTon),
        minStock: Number(i.nguongToiThieu),
        isLow: Number(i.soLuongTon) < Number(i.nguongToiThieu),
      })),
    });
  } catch (err) {
    return next(err);
  }
}

const createReceiptSchema = z.object({
  supplier: z.string().max(255).optional(),
  note: z.string().max(500).optional(),
  items: z
    .array(
      z.object({
        ingredientId: z.number().int().positive(),
        quantity: z.number().positive(),
        unitPrice: z.number().nonnegative(),
      })
    )
    .min(1),
});

async function createReceipt(req, res, next) {
  const t = await sequelize.transaction();
  try {
    const { supplier, note, items } = createReceiptSchema.parse(req.body);

    const ingredientIds = items.map((i) => i.ingredientId);
    const ingredients = await Ingredient.findAll({
      where: { PK_NGUYEN_LIEU: { [Op.in]: ingredientIds } },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    const ingById = new Map(ingredients.map((i) => [i.PK_NGUYEN_LIEU, i]));

    for (const it of items) {
      if (!ingById.has(it.ingredientId)) {
        await t.rollback();
        return res.status(400).json({ message: `Nguyên liệu không hợp lệ: ${it.ingredientId}` });
      }
    }

    const total = items.reduce((sum, it) => sum + Math.round(it.quantity * it.unitPrice), 0);
    const receipt = await Receipt.create(
      {
        FK_NHAN_VIEN: req.user.employeeId,
        nhaCungCap: supplier || null,
        tongTien: total,
        ghiChu: note || null,
      },
      { transaction: t }
    );

    await ReceiptItem.bulkCreate(
      items.map((it) => ({
        FK_PHIEU_NHAP: receipt.PK_PHIEU_NHAP,
        FK_NGUYEN_LIEU: it.ingredientId,
        soLuong: it.quantity,
        donGia: it.unitPrice,
        thanhTien: Math.round(it.quantity * it.unitPrice),
      })),
      { transaction: t }
    );

    // Update stocks
    for (const it of items) {
      const ing = ingById.get(it.ingredientId);
      ing.soLuongTon = Number(ing.soLuongTon) + Number(it.quantity);
      await ing.save({ transaction: t });
    }

    await t.commit();
    return res.status(201).json({ receiptId: receipt.PK_PHIEU_NHAP });
  } catch (err) {
    await t.rollback();
    return next(err);
  }
}

module.exports = { listInventory, createReceipt };

