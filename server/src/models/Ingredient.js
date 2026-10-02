const { DataTypes } = require("sequelize");

function defineIngredient(sequelize) {
  return sequelize.define(
    "Ingredient",
    {
      PK_NGUYEN_LIEU: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      tenNguyenLieu: { type: DataTypes.STRING(255), allowNull: false },
      donViTinh: { type: DataTypes.STRING(50), allowNull: false },
      soLuongTon: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      nguongToiThieu: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      trangThai: { type: DataTypes.TINYINT, allowNull: false, defaultValue: 1 },
    },
    { tableName: "tbl_NGUYEN_LIEU" }
  );
}

module.exports = { defineIngredient };
