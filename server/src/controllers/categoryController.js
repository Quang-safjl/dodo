const { Category } = require("../models");

async function listCategoriesPublic(req, res, next) {
  try {
    const items = await Category.findAll({ where: { trangThai: 1 }, order: [["PK_DANH_MUC", "ASC"]] });
    return res.json({ items: items.map((c) => ({ id: c.PK_DANH_MUC, name: c.tenDanhMuc })) });
  } catch (err) {
    return next(err);
  }
}

module.exports = { listCategoriesPublic };

