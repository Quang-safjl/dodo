const { Op } = require("sequelize");
const { z } = require("zod");
const { Receipt, ReceiptItem, Ingredient, Employee } = require("../models");

const listReceiptsSchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  supplier: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

async function listReceipts(req, res, next) {
  try {
    const { from, to, supplier, page, limit } = listReceiptsSchema.parse(req.query);
    const where = {};

    if (from || to) {
      where.ngayNhap = {};
      if (from) where.ngayNhap[Op.gte] = new Date(from);
      if (to) where.ngayNhap[Op.lte] = new Date(to);
    }
    if (supplier) {
      where.nhaCungCap = { [Op.like]: `%${supplier}%` };
    }

    const offset = (page - 1) * limit;
    const { count, rows } = await Receipt.findAndCountAll({
      where,
      include: [{ model: Employee, attributes: ["hoTen"] }],
      order: [["ngayNhap", "DESC"]],
      offset,
      limit,
    });

    return res.json({
      items: rows.map(r => ({
        id: r.PK_PHIEU_NHAP,
        supplier: r.nhaCungCap,
        totalAmount: Number(r.tongTien),
        note: r.ghiChu,
        createdAt: r.ngayNhap,
        staffName: r.Employee?.hoTen || "",
      })),
      total: count,
      page,
      limit,
    });
  } catch (err) {
    return next(err);
  }
}

async function getReceiptDetail(req, res, next) {
  try {
    const id = Number(req.params.id);
    const receipt = await Receipt.findByPk(id, {
      include: [
        { model: Employee, attributes: ["hoTen"] },
        {
          model: ReceiptItem,
          include: [{ model: Ingredient, attributes: ["tenNguyenLieu", "donViTinh"] }],
        },
      ],
    });
    if (!receipt) return res.status(404).json({ message: "Phiếu nhập không tồn tại" });

    return res.json({
      id: receipt.PK_PHIEU_NHAP,
      supplier: receipt.nhaCungCap,
      totalAmount: Number(receipt.tongTien),
      note: receipt.ghiChu,
      createdAt: receipt.ngayNhap,
      staffName: receipt.Employee?.hoTen || "",
      items: receipt.ReceiptItems.map(item => ({
        ingredientId: item.FK_NGUYEN_LIEU,
        ingredientName: item.Ingredient?.tenNguyenLieu || "",
        unit: item.Ingredient?.donViTinh || "",
        quantity: Number(item.soLuong),
        unitPrice: Number(item.donGia),
        amount: Number(item.thanhTien),
      })),
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = { listReceipts, getReceiptDetail };