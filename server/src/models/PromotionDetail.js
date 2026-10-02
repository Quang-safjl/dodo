const { DataTypes } = require("sequelize");

function definePromotionDetail(sequelize) {
  return sequelize.define(
    "PromotionDetail",
    {
      PK_CHI_TIET_KM: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      FK_KHUYEN_MAI: { type: DataTypes.INTEGER, allowNull: false },
      FK_DO_UONG: { type: DataTypes.INTEGER, allowNull: false },
    },
    { tableName: "tbl_CHI_TIET_KHUYEN_MAI" }
  );
}

module.exports = { definePromotionDetail };
