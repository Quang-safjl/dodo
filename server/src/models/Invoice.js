const { DataTypes } = require("sequelize");

function defineInvoice(sequelize) {
  return sequelize.define(
    "Invoice",
    {
      PK_HOA_DON: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      FK_DON_HANG: { type: DataTypes.INTEGER, allowNull: false, unique: true },
      phuongThuc: { type: DataTypes.ENUM("TIEN_MAT", "CHUYEN_KHOAN"), allowNull: false },
      soTienKhachDua: { type: DataTypes.DECIMAL(12, 0), allowNull: false, defaultValue: 0 },
      soTienThua: { type: DataTypes.DECIMAL(12, 0), allowNull: false, defaultValue: 0 },
      ngayThanhToan: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    },
    { tableName: "tbl_HOA_DON" }
  );
}

module.exports = { defineInvoice };
