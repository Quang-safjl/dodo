const { DataTypes } = require("sequelize");

function defineReceipt(sequelize) {
  return sequelize.define(
    "Receipt",
    {
      PK_PHIEU_NHAP: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      FK_NHAN_VIEN: { type: DataTypes.INTEGER, allowNull: false },
      nhaCungCap: { type: DataTypes.STRING(255), allowNull: true },
      tongTien: { type: DataTypes.DECIMAL(12, 0), allowNull: false, defaultValue: 0 },
      ngayNhap: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      ghiChu: { type: DataTypes.STRING(500), allowNull: true },
    },
    { tableName: "tbl_PHIEU_NHAP" }
  );
}

module.exports = { defineReceipt };
