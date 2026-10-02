const { DataTypes } = require("sequelize");

function defineEmployee(sequelize) {
  return sequelize.define(
    "Employee",
    {
      PK_NHAN_VIEN: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      hoTen: { type: DataTypes.STRING(255), allowNull: false },
      email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
      matKhauHash: { type: DataTypes.STRING(255), allowNull: false },
      vaiTro: {
        type: DataTypes.ENUM("ADMIN", "MANAGER", "STAFF"),
        allowNull: false,
        defaultValue: "STAFF",
      },
      trangThai: { type: DataTypes.TINYINT, allowNull: false, defaultValue: 1 },
      ngayTao: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    },
    { tableName: "tbl_NHAN_VIEN" }
  );
}

module.exports = { defineEmployee };
