const { DataTypes } = require("sequelize");

function definePromotion(sequelize) {
  return sequelize.define(
    "Promotion",
    {
      PK_KHUYEN_MAI: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      tenKhuyenMai: { type: DataTypes.STRING(255), allowNull: false },
      phanTramGiam: { type: DataTypes.DECIMAL(5, 2), allowNull: false },
      tuNgay: { type: DataTypes.DATE, allowNull: false },
      denNgay: { type: DataTypes.DATE, allowNull: false },
      trangThai: { type: DataTypes.TINYINT, allowNull: false, defaultValue: 1 },
    },
    { tableName: "tbl_KHUYEN_MAI" }
  );
}

module.exports = { definePromotion };
