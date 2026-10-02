const { Op } = require("sequelize");
const { z } = require("zod");
const {
  sequelize,
  Order,
  OrderItem,
  Drink,
  Promotion,
  PromotionDetail,
  Recipe,
  Ingredient,
  Invoice,
  Employee,
} = require("../models");

const createSchema = z.object({
  note: z.string().max(500).optional(),
  items: z
    .array(
      z.object({
        drinkId: z.number().int().positive(),
        quantity: z.number().int().positive(),
        note: z.string().max(255).optional(),
        mucDuong: z.enum(["50%", "70%", "100%"]).optional().default("100%"),
        mucDa: z.enum(["50%", "70%", "100%"]).optional().default("100%"),
      })
    )
    .min(1),
});

async function createOrder(req, res, next) {
  const t = await sequelize.transaction();
  try {
    const { items, note } = createSchema.parse(req.body);
    const drinkIds = items.map((i) => i.drinkId);

    const now = new Date();
    const drinks = await Drink.findAll({
      where: { PK_DO_UONG: { [Op.in]: drinkIds }, dangBan: 1 },
      include: [
        {
          model: PromotionDetail,
          required: false,
          include: [
            {
              model: Promotion,
              where: { trangThai: 1, tuNgay: { [Op.lte]: now }, denNgay: { [Op.gte]: now } },
              required: false,
            },
          ],
        },
      ],
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    const drinkById = new Map(drinks.map((d) => [d.PK_DO_UONG, d]));
    for (const it of items) {
      if (!drinkById.has(it.drinkId)) {
        await t.rollback();
        return res.status(400).json({ message: `Đồ uống không hợp lệ: ${it.drinkId}` });
      }
    }

    let tongTien = 0;
    let giamGia = 0;
    const orderItems = items.map((it) => {
      const d = drinkById.get(it.drinkId);
      const price = Number(d.giaBan);
      const lineTotal = price * it.quantity;
      const promos =
        d.PromotionDetails?.map((pd) => pd.Promotion).filter(Boolean).map((p) => Number(p.phanTramGiam)) || [];
      const bestPercent = promos.length ? Math.max(...promos) : 0;
      const discount = Math.round((lineTotal * bestPercent) / 100);

      tongTien += lineTotal;
      giamGia += discount;
      return {
        FK_DO_UONG: d.PK_DO_UONG,
        soLuong: it.quantity,
        donGia: price,
        ghiChu: it.note || null,
        mucDuong: it.mucDuong || "100%",
        mucDa: it.mucDa || "100%",
        thanhTien: lineTotal - discount,
      };
    });

    const thanhTien = tongTien - giamGia;
    const order = await Order.create(
      {
        FK_NHAN_VIEN: req.user.employeeId,
        trangThai: "CHO_THANH_TOAN",
        tongTien,
        giamGia,
        thanhTien,
        ghiChu: note || null,
      },
      { transaction: t }
    );

    await OrderItem.bulkCreate(
      orderItems.map((oi) => ({ ...oi, FK_DON_HANG: order.PK_DON_HANG })),
      { transaction: t }
    );

    await t.commit();

    const chiTiet = orderItems.map((oi) => {
      const d = drinkById.get(oi.FK_DO_UONG);
      return {
        drinkId: oi.FK_DO_UONG,
        tenDoUong: d?.tenDoUong || "",
        soLuong: oi.soLuong,
        donGia: Number(oi.donGia),
        thanhTien: Number(oi.thanhTien),
        ghiChu: oi.ghiChu,
        mucDuong: oi.mucDuong,
        mucDa: oi.mucDa,
      };
    });

    return res.status(201).json({
      message: "Đã lập hóa đơn (Chờ thanh toán)",
      orderId: order.PK_DON_HANG,
      trangThai: order.trangThai,
      tongTien: Number(order.tongTien),
      giamGia: Number(order.giamGia),
      thanhTien: Number(order.thanhTien),
      chiTiet,
    });
  } catch (err) {
    await t.rollback();
    return next(err);
  }
}

const completeSchema = z.object({
  method: z.enum(["TIEN_MAT", "CHUYEN_KHOAN"]),
  customerPaid: z.number().nonnegative().optional(),
  note: z.string().max(500).optional(),
});

async function completeOrder(req, res, next) {
  const t = await sequelize.transaction();
  try {
    const orderId = Number(req.params.id);
    const { method, customerPaid, note } = completeSchema.parse(req.body);

    const order = await Order.findByPk(orderId, { transaction: t, lock: t.LOCK.UPDATE });
    if (!order) {
      await t.rollback();
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }
    if (order.trangThai !== "CHO_THANH_TOAN") {
      await t.rollback();
      return res.status(400).json({ message: "Đơn hàng không ở trạng thái chờ thanh toán" });
    }

    const items = await OrderItem.findAll({ where: { FK_DON_HANG: orderId }, transaction: t });
    const drinkIds = items.map((i) => i.FK_DO_UONG);
    const recipes = await Recipe.findAll({ where: { FK_DO_UONG: { [Op.in]: drinkIds } }, transaction: t });

    const required = new Map();
    const SUGAR_ID = 4;
    const ICE_ID = 9;

    for (const it of items) {
      const sugarPercent = it.mucDuong ? parseInt(it.mucDuong) / 100 : 1;
      const icePercent = it.mucDa ? parseInt(it.mucDa) / 100 : 1;

      for (const r of recipes.filter((x) => x.FK_DO_UONG === it.FK_DO_UONG)) {
        let need = Number(r.dinhLuong) * it.soLuong;

        if (r.FK_NGUYEN_LIEU === SUGAR_ID) need *= sugarPercent;
        if (r.FK_NGUYEN_LIEU === ICE_ID) need *= icePercent;

        required.set(r.FK_NGUYEN_LIEU, (required.get(r.FK_NGUYEN_LIEU) || 0) + need);
      }
    }

    const ingredientIds = [...required.keys()];
    const ingredients = await Ingredient.findAll({
      where: { PK_NGUYEN_LIEU: { [Op.in]: ingredientIds } },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    const ingById = new Map(ingredients.map((i) => [i.PK_NGUYEN_LIEU, i]));

    for (const [ingId, need] of required) {
      const ing = ingById.get(ingId);
      if (!ing) {
        await t.rollback();
        return res.status(400).json({ message: `Thiếu nguyên liệu (ID=${ingId}) trong kho` });
      }
      if (Number(ing.soLuongTon) < need) {
        await t.rollback();
        return res.status(400).json({ message: `Không đủ tồn kho: ${ing.tenNguyenLieu}` });
      }
    }

    for (const [ingId, need] of required) {
      const ing = ingById.get(ingId);
      ing.soLuongTon = Number(ing.soLuongTon) - need;
      await ing.save({ transaction: t });
    }

    const paid = method === "TIEN_MAT" ? Number(customerPaid || 0) : Number(order.thanhTien);
    const change = method === "TIEN_MAT" ? Math.max(0, paid - Number(order.thanhTien)) : 0;
    if (method === "TIEN_MAT" && paid < Number(order.thanhTien)) {
      await t.rollback();
      return res.status(400).json({ message: "Số tiền khách đưa không đủ" });
    }

    await Invoice.create(
      {
        FK_DON_HANG: orderId,
        phuongThuc: method,
        soTienKhachDua: paid,
        soTienThua: change,
      },
      { transaction: t }
    );

    order.trangThai = "HOAN_THANH";
    order.ngayHoanThanh = new Date();
    if (typeof note !== "undefined") {
      const normalized = note.trim();
      order.ghiChu = normalized || null;
    }
    await order.save({ transaction: t });

    await t.commit();

    const inv = await Invoice.findOne({ where: { FK_DON_HANG: orderId } });
    const ord = await Order.findByPk(orderId);
    return res.json({
      message: "Thanh toán thành công",
      order: {
        orderId,
        trangThai: ord.trangThai,
        thanhTien: Number(ord.thanhTien),
        ngayHoanThanh: ord.ngayHoanThanh,
      },
      invoice: inv
        ? {
            phuongThuc: inv.phuongThuc,
            soTienKhachDua: Number(inv.soTienKhachDua),
            soTienThua: Number(inv.soTienThua),
            ngayThanhToan: inv.ngayThanhToan,
          }
        : null,
      daTruNguyenLieu: true,
    });
  } catch (err) {
    await t.rollback();
    return next(err);
  }
}

// ========== THÊM MỚI: Lấy danh sách đơn hàng ==========
const listOrdersSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(["CHO_THANH_TOAN", "HOAN_THANH", "HUY"]).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  search: z.string().optional(),
});

async function listOrders(req, res, next) {
  try {
    const { page, limit, status, from, to, search } = listOrdersSchema.parse(req.query);
    const where = {};

    if (status) where.trangThai = status;
    if (from || to) {
      where.ngayTao = {};
      if (from) where.ngayTao[Op.gte] = new Date(from);
      if (to) where.ngayTao[Op.lte] = new Date(to);
    }
    if (search) {
      const isNumeric = !isNaN(Number(search));
      where[Op.or] = [
        isNumeric ? { PK_DON_HANG: Number(search) } : { PK_DON_HANG: 0 },
        { ghiChu: { [Op.like]: `%${search}%` } },
      ];
    }

    const offset = (page - 1) * limit;
    const { count, rows } = await Order.findAndCountAll({
      where,
      include: [{ model: Employee, attributes: ["hoTen"] }],
      order: [["ngayTao", "DESC"]],
      offset,
      limit,
    });

    const items = rows.map(order => ({
      id: order.PK_DON_HANG,
      status: order.trangThai,
      totalAmount: Number(order.thanhTien),
      originalTotal: Number(order.tongTien),
      discount: Number(order.giamGia),
      note: order.ghiChu,
      createdAt: order.ngayTao,
      completedAt: order.ngayHoanThanh,
      staffName: order.Employee?.hoTen,
    }));

    return res.json({ items, total: count, page, limit });
  } catch (err) {
    return next(err);
  }
}

// ========== THÊM MỚI: Xem chi tiết 1 đơn hàng ==========
async function getOrderDetail(req, res, next) {
  try {
    const id = Number(req.params.id);
    const order = await Order.findByPk(id, {
      include: [
        { model: Employee, attributes: ["hoTen"] },
        { model: OrderItem, include: [Drink] },
        { model: Invoice },
      ],
    });
    if (!order) return res.status(404).json({ message: "Đơn hàng không tồn tại" });

    return res.json({
      id: order.PK_DON_HANG,
      status: order.trangThai,
      totalAmount: Number(order.thanhTien),
      originalTotal: Number(order.tongTien),
      discount: Number(order.giamGia),
      note: order.ghiChu,
      createdAt: order.ngayTao,
      completedAt: order.ngayHoanThanh,
      staffName: order.Employee?.hoTen,
      invoice: order.Invoice
        ? {
            method: order.Invoice.phuongThuc,
            customerPaid: Number(order.Invoice.soTienKhachDua),
            change: Number(order.Invoice.soTienThua),
            paidAt: order.Invoice.ngayThanhToan,
          }
        : null,
      items: order.OrderItems?.map(item => ({
        drinkId: item.FK_DO_UONG,
        drinkName: item.Drink?.tenDoUong,
        quantity: item.soLuong,
        unitPrice: Number(item.donGia),
        total: Number(item.thanhTien),
        note: item.ghiChu,
        mucDuong: item.mucDuong,
        mucDa: item.mucDa,
      })),
    });
  } catch (err) {
    return next(err);
  }
}

const checkIngredientsSchema = z.object({
  items: z
    .array(
      z.object({
        drinkId: z.number().int().positive(),
        quantity: z.number().int().positive(),
        mucDuong: z.enum(["50%", "70%", "100%"]).optional().default("100%"),
        mucDa: z.enum(["50%", "70%", "100%"]).optional().default("100%"),
      })
    )
    .min(1),
});

async function checkIngredients(req, res, next) {
  try {
    const { items } = checkIngredientsSchema.parse(req.body);
    const drinkIds = items.map((i) => i.drinkId);

    const drinks = await Drink.findAll({
      where: { PK_DO_UONG: { [Op.in]: drinkIds }, dangBan: 1 },
    });
    const drinkById = new Map(drinks.map((d) => [d.PK_DO_UONG, d]));

    for (const it of items) {
      if (!drinkById.has(it.drinkId)) {
        return res.status(400).json({ message: `Đồ uống không hợp lệ: ${it.drinkId}` });
      }
    }

    const recipes = await Recipe.findAll({
      where: { FK_DO_UONG: { [Op.in]: drinkIds } },
      include: [{ model: Ingredient }],
    });

    const required = new Map();
    const SUGAR_ID = 4;
    const ICE_ID = 9;

    for (const it of items) {
      const sugarPercent = parseInt(it.mucDuong) / 100;
      const icePercent = parseInt(it.mucDa) / 100;

      for (const r of recipes.filter((x) => x.FK_DO_UONG === it.drinkId)) {
        let need = Number(r.dinhLuong) * it.quantity;

        if (r.FK_NGUYEN_LIEU === SUGAR_ID) need *= sugarPercent;
        if (r.FK_NGUYEN_LIEU === ICE_ID) need *= icePercent;

        required.set(r.FK_NGUYEN_LIEU, (required.get(r.FK_NGUYEN_LIEU) || 0) + need);
      }
    }

    const ingredientIds = [...required.keys()];
    const ingredients = await Ingredient.findAll({
      where: { PK_NGUYEN_LIEU: { [Op.in]: ingredientIds } },
    });
    const ingById = new Map(ingredients.map((i) => [i.PK_NGUYEN_LIEU, i]));

    const ingredientStatus = ingredients.map((ing) => {
      const need = required.get(ing.PK_NGUYEN_LIEU) || 0;
      const available = Number(ing.soLuongTon);
      const insufficient = Math.max(0, need - available);

      return {
        id: ing.PK_NGUYEN_LIEU,
        name: ing.tenNguyenLieu,
        unit: ing.donViTinh,
        needed: Math.round(need * 100) / 100,
        available: available,
        insufficient: Math.round(insufficient * 100) / 100,
        isEnough: insufficient === 0,
      };
    });

    const allEnough = ingredientStatus.every((i) => i.isEnough);

    return res.json({ allEnough, ingredients: ingredientStatus });
  } catch (err) {
    return next(err);
  }
}

module.exports = { createOrder, completeOrder, listOrders, getOrderDetail, checkIngredients };