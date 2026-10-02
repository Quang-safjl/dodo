const { z } = require("zod");
const { Promotion, PromotionDetail } = require("../models");

async function listPromotions(req, res, next) {
  try {
    const items = await Promotion.findAll({ order: [["PK_KHUYEN_MAI", "DESC"]] });
    return res.json({
      items: items.map((p) => ({
        id: p.PK_KHUYEN_MAI,
        name: p.tenKhuyenMai,
        percent: Number(p.phanTramGiam),
        from: p.tuNgay,
        to: p.denNgay,
        isActive: p.trangThai === 1,
      })),
    });
  } catch (err) {
    return next(err);
  }
}

const upsertPromotionSchema = z.object({
  name: z.string().min(1).max(255),
  percent: z.number().min(0).max(100),
  from: z.coerce.date(),
  to: z.coerce.date(),
  isActive: z.boolean().optional(),
});

async function createPromotion(req, res, next) {
  try {
    const { name, percent, from, to, isActive } = upsertPromotionSchema.parse(req.body);
    const p = await Promotion.create({
      tenKhuyenMai: name,
      phanTramGiam: percent,
      tuNgay: from,
      denNgay: to,
      trangThai: isActive === false ? 0 : 1,
    });
    return res.status(201).json({ id: p.PK_KHUYEN_MAI });
  } catch (err) {
    return next(err);
  }
}

async function updatePromotion(req, res, next) {
  try {
    const id = Number(req.params.id);
    const { name, percent, from, to, isActive } = upsertPromotionSchema.parse(req.body);
    const p = await Promotion.findByPk(id);
    if (!p) return res.status(404).json({ message: "Not found" });
    p.tenKhuyenMai = name;
    p.phanTramGiam = percent;
    p.tuNgay = from;
    p.denNgay = to;
    p.trangThai = isActive === false ? 0 : 1;
    await p.save();
    return res.json({ message: "OK" });
  } catch (err) {
    return next(err);
  }
}

async function deletePromotion(req, res, next) {
  try {
    const id = Number(req.params.id);
    const p = await Promotion.findByPk(id);
    if (!p) return res.status(404).json({ message: "Not found" });
    p.trangThai = 0;
    await p.save();
    return res.json({ message: "OK" });
  } catch (err) {
    return next(err);
  }
}

const assignSchema = z.object({
  drinkIds: z.array(z.number().int().positive()).min(1),
});

async function assignPromotionToDrinks(req, res, next) {
  try {
    const promotionId = Number(req.params.id);
    const { drinkIds } = assignSchema.parse(req.body);
    const rows = drinkIds.map((drinkId) => ({ FK_KHUYEN_MAI: promotionId, FK_DO_UONG: drinkId }));
    await PromotionDetail.bulkCreate(rows);
    return res.json({ message: "OK" });
  } catch (err) {
    return next(err);
  }
}

module.exports = { listPromotions, createPromotion, updatePromotion, deletePromotion, assignPromotionToDrinks };

