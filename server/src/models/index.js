const { sequelize } = require("../config/sequelize");
const { defineEmployee } = require("./Employee");
const { defineCategory } = require("./Category");
const { defineDrink } = require("./Drink");
const { defineIngredient } = require("./Ingredient");
const { defineRecipe } = require("./Recipe");
const { definePromotion } = require("./Promotion");
const { definePromotionDetail } = require("./PromotionDetail");
const { defineOrder } = require("./Order");
const { defineOrderItem } = require("./OrderItem");
const { defineInvoice } = require("./Invoice");
const { defineReceipt } = require("./Receipt");
const { defineReceiptItem } = require("./ReceiptItem");

const Employee = defineEmployee(sequelize);
const Category = defineCategory(sequelize);
const Drink = defineDrink(sequelize);
const Ingredient = defineIngredient(sequelize);
const Recipe = defineRecipe(sequelize);
const Promotion = definePromotion(sequelize);
const PromotionDetail = definePromotionDetail(sequelize);
const Order = defineOrder(sequelize);
const OrderItem = defineOrderItem(sequelize);
const Invoice = defineInvoice(sequelize);
const Receipt = defineReceipt(sequelize);
const ReceiptItem = defineReceiptItem(sequelize);

// Associations
Category.hasMany(Drink, { foreignKey: "FK_DANH_MUC" });
Drink.belongsTo(Category, { foreignKey: "FK_DANH_MUC" });

Drink.hasMany(Recipe, { foreignKey: "FK_DO_UONG" });
Recipe.belongsTo(Drink, { foreignKey: "FK_DO_UONG" });
Ingredient.hasMany(Recipe, { foreignKey: "FK_NGUYEN_LIEU" });
Recipe.belongsTo(Ingredient, { foreignKey: "FK_NGUYEN_LIEU" });

Promotion.hasMany(PromotionDetail, { foreignKey: "FK_KHUYEN_MAI" });
PromotionDetail.belongsTo(Promotion, { foreignKey: "FK_KHUYEN_MAI" });
Drink.hasMany(PromotionDetail, { foreignKey: "FK_DO_UONG" });
PromotionDetail.belongsTo(Drink, { foreignKey: "FK_DO_UONG" });

Employee.hasMany(Order, { foreignKey: "FK_NHAN_VIEN" });
Order.belongsTo(Employee, { foreignKey: "FK_NHAN_VIEN" });

Order.hasMany(OrderItem, { foreignKey: "FK_DON_HANG" });
OrderItem.belongsTo(Order, { foreignKey: "FK_DON_HANG" });
Drink.hasMany(OrderItem, { foreignKey: "FK_DO_UONG" });
OrderItem.belongsTo(Drink, { foreignKey: "FK_DO_UONG" });

Order.hasOne(Invoice, { foreignKey: "FK_DON_HANG" });
Invoice.belongsTo(Order, { foreignKey: "FK_DON_HANG" });

Employee.hasMany(Receipt, { foreignKey: "FK_NHAN_VIEN" });
Receipt.belongsTo(Employee, { foreignKey: "FK_NHAN_VIEN" });
Receipt.hasMany(ReceiptItem, { foreignKey: "FK_PHIEU_NHAP" });
ReceiptItem.belongsTo(Receipt, { foreignKey: "FK_PHIEU_NHAP" });
Ingredient.hasMany(ReceiptItem, { foreignKey: "FK_NGUYEN_LIEU" });
ReceiptItem.belongsTo(Ingredient, { foreignKey: "FK_NGUYEN_LIEU" });

module.exports = {
  sequelize,
  Employee,
  Category,
  Drink,
  Ingredient,
  Recipe,
  Promotion,
  PromotionDetail,
  Order,
  OrderItem,
  Invoice,
  Receipt,
  ReceiptItem,
};
