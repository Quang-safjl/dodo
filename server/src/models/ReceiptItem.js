const { DataTypes } = require("sequelize");

function defineReceiptItem(sequelize) {
  return sequelize.define(
    "ReceiptItem",
    {
      PK_CTPN: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      FK_PHIEU_NHAP: { type: DataTypes.INTEGER, allowNull: false },
      FK_NGUYEN_LIEU: { type: DataTypes.INTEGER, allowNull: false },
      soLuong: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
      donGia: { type: DataTypes.DECIMAL(12, 0), allowNull: false },
      thanhTien: { type: DataTypes.DECIMAL(12, 0), allowNull: false },
    },
    { tableName: "tbl_CHI_TIET_PHIEU_NHAP" }
  );
}

module.exports = { defineReceiptItem };
