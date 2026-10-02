const { Sequelize } = require("sequelize");
const { env } = require("./env");

const sequelize = new Sequelize(env.db.name, env.db.user, env.db.password, {
  host: env.db.host,
  port: env.db.port,
  dialect: "mysql",
  logging: false,
  define: {
    freezeTableName: true,
    timestamps: false,
  },
});

module.exports = { sequelize };
