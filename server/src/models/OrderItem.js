const { DataTypes } = require("sequelize");

function defineOrderItem(sequelize) {
  return sequelize.define(
    "OrderItem",
    {
      PK_CTDH: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      FK_DON_HANG: { type: DataTypes.INTEGER, allowNull: false },
      FK_DO_UONG: { type: DataTypes.INTEGER, allowNull: false },
      soLuong: { type: DataTypes.INTEGER, allowNull: false },
      donGia: { type: DataTypes.DECIMAL(12, 0), allowNull: false },
      ghiChu: { type: DataTypes.STRING(255), allowNull: true },
      mucDuong: { type: DataTypes.STRING(50), allowNull: true, defaultValue: "100%" },
      mucDa: { type: DataTypes.STRING(50), allowNull: true, defaultValue: "100%" },
      thanhTien: { type: DataTypes.DECIMAL(12, 0), allowNull: false },
    },
    { tableName: "tbl_CHI_TIET_DON_HANG" }
  );
}

module.exports = { defineOrderItem };
