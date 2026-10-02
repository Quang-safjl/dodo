const { DataTypes } = require("sequelize");

function defineDrink(sequelize) {
  return sequelize.define(
    "Drink",
    {
      PK_DO_UONG: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      FK_DANH_MUC: { type: DataTypes.INTEGER, allowNull: false },
      tenDoUong: { type: DataTypes.STRING(255), allowNull: false },
      giaBan: { type: DataTypes.DECIMAL(12, 0), allowNull: false },
      hinhAnhUrl: { type: DataTypes.STRING(500), allowNull: true },
      dangBan: { type: DataTypes.TINYINT, allowNull: false, defaultValue: 1 },
    },
    { tableName: "tbl_DO_UONG" }
  );
}

module.exports = { defineDrink };
