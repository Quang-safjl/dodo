const { DataTypes } = require("sequelize");

function defineRecipe(sequelize) {
  return sequelize.define(
    "Recipe",
    {
      PK_CONG_THUC: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      FK_DO_UONG: { type: DataTypes.INTEGER, allowNull: false },
      FK_NGUYEN_LIEU: { type: DataTypes.INTEGER, allowNull: false },
      dinhLuong: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    },
    { tableName: "tbl_CONG_THUC" }
  );
}

module.exports = { defineRecipe };
