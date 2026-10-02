const { DataTypes } = require("sequelize");

function defineCategory(sequelize) {
  return sequelize.define(
    "Category",
    {
      PK_DANH_MUC: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      tenDanhMuc: { type: DataTypes.STRING(255), allowNull: false },
      trangThai: { type: DataTypes.TINYINT, allowNull: false, defaultValue: 1 },
    },
    { tableName: "tbl_DANH_MUC" }
  );
}

module.exports = { defineCategory };
