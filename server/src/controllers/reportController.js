const { z } = require("zod");
const { QueryTypes } = require("sequelize");
const { sequelize } = require("../models");

const revenueSchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  groupBy: z.enum(["day", "month", "year"]).default("day"),
});

function buildFormat(groupBy) {
  if (groupBy === "year") return "%Y";
  if (groupBy === "month") return "%Y-%m";
  return "%Y-%m-%d";
}

async function revenueReport(req, res, next) {
  try {
    const { from, to, groupBy } = revenueSchema.parse(req.query);
    const fmt = buildFormat(groupBy);

    const where = [];
    const replacements = { fmt };
    if (from) {
      where.push("o.ngayHoanThanh >= :from");
      replacements.from = from;
    }
    if (to) {
      where.push("o.ngayHoanThanh <= :to");
      replacements.to = to;
    }
    const whereSql = where.length ? `AND ${where.join(" AND ")}` : "";

    const rows = await sequelize.query(
      `
      SELECT
        DATE_FORMAT(o.ngayHoanThanh, :fmt) AS bucket,
        COUNT(*) AS orderCount,
        SUM(o.thanhTien) AS revenue
      FROM tbl_DON_HANG o
      WHERE o.trangThai = 'HOAN_THANH' AND o.ngayHoanThanh IS NOT NULL
      ${whereSql}
      GROUP BY bucket
      ORDER BY bucket ASC
      `,
      { replacements, type: QueryTypes.SELECT }
    );

    const totalRevenue = rows.reduce((s, r) => s + Number(r.revenue || 0), 0);
    const totalOrders = rows.reduce((s, r) => s + Number(r.orderCount || 0), 0);

    return res.json({
      groupBy,
      totalRevenue,
      totalOrders,
      series: rows.map((r) => ({ bucket: r.bucket, orderCount: Number(r.orderCount), revenue: Number(r.revenue || 0) })),
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = { revenueReport };

