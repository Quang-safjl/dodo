const { z } = require("zod");
const { Op } = require("sequelize");
const { sequelize, Category, Drink, Recipe, Ingredient } = require("../models");

async function listCategories(req, res, next) {
  try {
    const items = await Category.findAll({ where: { trangThai: 1 }, order: [["PK_DANH_MUC", "ASC"]] });
    return res.json({ items: items.map((c) => ({ id: c.PK_DANH_MUC, name: c.tenDanhMuc })) });
  } catch (err) {
    return next(err);
  }
}

const upsertCategorySchema = z.object({ name: z.string().min(1).max(255) });

async function createCategory(req, res, next) {
  try {
    const { name } = upsertCategorySchema.parse(req.body);
    const c = await Category.create({ tenDanhMuc: name, trangThai: 1 });
    return res.status(201).json({ id: c.PK_DANH_MUC });
  } catch (err) {
    return next(err);
  }
}

async function updateCategory(req, res, next) {
  try {
    const id = Number(req.params.id);
    const { name } = upsertCategorySchema.parse(req.body);
    const c = await Category.findByPk(id);
    if (!c) return res.status(404).json({ message: "Not found" });
    c.tenDanhMuc = name;
    await c.save();
    return res.json({ message: "OK" });
  } catch (err) {
    return next(err);
  }
}

async function deleteCategory(req, res, next) {
  try {
    const id = Number(req.params.id);
    const c = await Category.findByPk(id);
    if (!c) return res.status(404).json({ message: "Not found" });
    c.trangThai = 0;
    await c.save();
    return res.json({ message: "OK" });
  } catch (err) {
    return next(err);
  }
}

const recipeLineSchema = z.object({
  ingredientId: z.number().int().positive(),
  quantity: z.number().positive(),
});

const upsertDrinkSchema = z.object({
  categoryId: z.number().int().positive(),
  name: z.string().min(1).max(255),
  price: z.number().nonnegative(),
  imageUrl: z.string().max(500).optional().or(z.literal("")),
  isSelling: z.boolean().optional(),
  recipe: z.array(recipeLineSchema).min(1),
});

async function listDrinks(req, res, next) {
  try {
    const items = await Drink.findAll({ order: [["PK_DO_UONG", "DESC"]] });
    return res.json({
      items: items.map((d) => ({
        id: d.PK_DO_UONG,
        categoryId: d.FK_DANH_MUC,
        name: d.tenDoUong,
        price: Number(d.giaBan),
        imageUrl: d.hinhAnhUrl,
        isSelling: d.dangBan === 1,
      })),
    });
  } catch (err) {
    return next(err);
  }
}

async function getDrinkDetail(req, res, next) {
  try {
    const id = Number(req.params.id);
    const drink = await Drink.findByPk(id, {
      include: [
        { model: Category },
        {
          model: Recipe,
          include: [{ model: Ingredient }],
        },
      ],
    });
    if (!drink) return res.status(404).json({ message: "Không tìm thấy đồ uống" });

    const rows = [...(drink.Recipes || [])].sort((a, b) => (a.PK_CONG_THUC || 0) - (b.PK_CONG_THUC || 0));
    const recipes = rows.map((r) => ({
      ingredientId: r.FK_NGUYEN_LIEU,
      tenNguyenLieu: r.Ingredient?.tenNguyenLieu || "",
      donViTinh: r.Ingredient?.donViTinh || "",
      soLuongTonKho: r.Ingredient ? Number(r.Ingredient.soLuongTon) : null,
      dinhLuong: Number(r.dinhLuong),
    }));

    return res.json({
      id: drink.PK_DO_UONG,
      categoryId: drink.FK_DANH_MUC,
      categoryName: drink.Category?.tenDanhMuc || "",
      name: drink.tenDoUong,
      price: Number(drink.giaBan),
      imageUrl: drink.hinhAnhUrl,
      isSelling: drink.dangBan === 1,
      recipe: recipes,
    });
  } catch (err) {
    return next(err);
  }
}

function badRequest(msg) {
  const e = new Error(msg);
  e.statusCode = 400;
  return e;
}

async function validateRecipeIngredients(recipeLines, transaction) {
  const ids = recipeLines.map((r) => r.ingredientId);
  if (new Set(ids).size !== ids.length) throw badRequest("Nguyên liệu bị trùng trong công thức");
  const ings = await Ingredient.findAll({
    where: { PK_NGUYEN_LIEU: { [Op.in]: ids }, trangThai: 1 },
    transaction,
  });
  if (ings.length !== ids.length) throw badRequest("Có nguyên liệu không tồn tại hoặc đã ngừng");
}

async function createDrink(req, res, next) {
  const t = await sequelize.transaction();
  try {
    const { categoryId, name, price, imageUrl, isSelling, recipe } = upsertDrinkSchema.parse(req.body);
    await validateRecipeIngredients(recipe, t);

    const d = await Drink.create(
      {
        FK_DANH_MUC: categoryId,
        tenDoUong: name,
        giaBan: price,
        hinhAnhUrl: imageUrl || null,
        dangBan: isSelling === false ? 0 : 1,
      },
      { transaction: t }
    );

    await Recipe.bulkCreate(
      recipe.map((r) => ({
        FK_DO_UONG: d.PK_DO_UONG,
        FK_NGUYEN_LIEU: r.ingredientId,
        dinhLuong: r.quantity,
      })),
      { transaction: t }
    );

    await t.commit();
    return res.status(201).json({ id: d.PK_DO_UONG });
  } catch (err) {
    await t.rollback();
    if (err.statusCode === 400) return res.status(400).json({ message: err.message });
    return next(err);
  }
}

async function updateDrink(req, res, next) {
  const t = await sequelize.transaction();
  try {
    const id = Number(req.params.id);
    const { categoryId, name, price, imageUrl, isSelling, recipe } = upsertDrinkSchema.parse(req.body);
    const d = await Drink.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!d) {
      await t.rollback();
      return res.status(404).json({ message: "Not found" });
    }

    await validateRecipeIngredients(recipe, t);

    d.FK_DANH_MUC = categoryId;
    d.tenDoUong = name;
    d.giaBan = price;
    d.hinhAnhUrl = imageUrl || null;
    d.dangBan = isSelling === false ? 0 : 1;
    await d.save({ transaction: t });

    await Recipe.destroy({ where: { FK_DO_UONG: id }, transaction: t });
    await Recipe.bulkCreate(
      recipe.map((r) => ({
        FK_DO_UONG: id,
        FK_NGUYEN_LIEU: r.ingredientId,
        dinhLuong: r.quantity,
      })),
      { transaction: t }
    );

    await t.commit();
    return res.json({ message: "OK" });
  } catch (err) {
    await t.rollback();
    if (err.statusCode === 400) return res.status(400).json({ message: err.message });
    return next(err);
  }
}

async function deleteDrink(req, res, next) {
  try {
    const id = Number(req.params.id);
    const d = await Drink.findByPk(id);
    if (!d) return res.status(404).json({ message: "Not found" });
    d.dangBan = 0;
    await d.save();
    return res.json({ message: "OK" });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  listDrinks,
  getDrinkDetail,
  createDrink,
  updateDrink,
  deleteDrink,
};
