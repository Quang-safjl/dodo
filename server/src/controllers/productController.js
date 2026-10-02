const { Op } = require("sequelize");
const { z } = require("zod");
const { Drink, Category, Promotion, PromotionDetail, Recipe, Ingredient } = require("../models");

const listSchema = z.object({
  categoryId: z.coerce.number().int().positive().optional(),
  q: z.string().trim().min(1).optional(),
});

async function listProducts(req, res, next) {
  try {
    const { categoryId, q } = listSchema.parse(req.query);
    const where = { dangBan: 1 };
    if (categoryId) where.FK_DANH_MUC = categoryId;
    if (q) where.tenDoUong = { [Op.like]: `%${q}%` };

    const now = new Date();
    const drinks = await Drink.findAll({
      where,
      include: [
        { model: Category },
        {
          model: Recipe,
          required: false,
          include: [{ model: Ingredient, required: false }],
        },
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
      order: [["PK_DO_UONG", "DESC"]],
    });

    const result = drinks.map((d) => {
      const promos =
        d.PromotionDetails?.map((pd) => pd.Promotion).filter(Boolean).map((p) => Number(p.phanTramGiam)) || [];
      const bestPercent = promos.length ? Math.max(...promos) : 0;
      const recipeLines = d.Recipes || [];
      const maxCanMake =
        recipeLines.length === 0
          ? null
          : Math.max(
              0,
              Math.floor(
                recipeLines.reduce((minVal, line) => {
                  const need = Number(line.dinhLuong || 0);
                  const available = Number(line.Ingredient?.soLuongTon || 0);
                  if (need <= 0) return minVal;
                  return Math.min(minVal, available / need);
                }, Number.POSITIVE_INFINITY)
              )
            );
      return {
        id: d.PK_DO_UONG,
        name: d.tenDoUong,
        price: Number(d.giaBan),
        imageUrl: d.hinhAnhUrl,
        category: d.Category ? { id: d.Category.PK_DANH_MUC, name: d.Category.tenDanhMuc } : null,
        promotionPercent: bestPercent,
        maxCanMake,
      };
    });

    return res.json({ items: result });
  } catch (err) {
    return next(err);
  }
}

module.exports = { listProducts };
