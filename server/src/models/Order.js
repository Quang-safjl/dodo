const { DataTypes } = require("sequelize");

function defineOrder(sequelize) {
  return sequelize.define(
    "Order",
    {
      PK_DON_HANG: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      FK_NHAN_VIEN: { type: DataTypes.INTEGER, allowNull: false },
      trangThai: {
        type: DataTypes.ENUM("CHO_THANH_TOAN", "HOAN_THANH", "HUY"),
        allowNull: false,
        defaultValue: "CHO_THANH_TOAN",
      },
      tongTien: { type: DataTypes.DECIMAL(12, 0), allowNull: false, defaultValue: 0 },
      giamGia: { type: DataTypes.DECIMAL(12, 0), allowNull: false, defaultValue: 0 },
      thanhTien: { type: DataTypes.DECIMAL(12, 0), allowNull: false, defaultValue: 0 },
      ghiChu: { type: DataTypes.STRING(500), allowNull: true },
      ngayTao: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      ngayHoanThanh: { type: DataTypes.DATE, allowNull: true },
    },
    { tableName: "tbl_DON_HANG" }
  );
}

module.exports = { defineOrder };
