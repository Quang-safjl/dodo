const dotenv = require("dotenv");

dotenv.config();

function requireEnv(name) {
  const value = process.env[name];
  // Allow empty string values (e.g. XAMPP's root password can be empty)
  if (value === undefined) throw new Error(`Missing env var: ${name}`);
  return value;
}

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 5000),
  db: {
    host: requireEnv("DB_HOST"),
    port: Number(process.env.DB_PORT || 3306),
    name: requireEnv("DB_NAME"),
    user: requireEnv("DB_USER"),
    password: requireEnv("DB_PASSWORD"),
  },
  jwt: {
    secret: requireEnv("JWT_SECRET"),
    expiresIn: process.env.JWT_EXPIRES_IN || "24h",
  },
};

module.exports = { env };
