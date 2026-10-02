// src/models/orderModel.js
const pool = require('../config/db');

class OrderModel {
  // Lấy danh sách đơn hàng có phân trang, tìm kiếm, lọc
  static async findAll({ page = 1, limit = 10, search = '', status = null, from = null, to = null }) {
    const offset = (page - 1) * limit;
    let sql = `
      SELECT 
        o.id, o.ngayTao as createdAt, o.tongTien as totalAmount, o.trangThai as status, o.ghiChu as note,
        nv.hoTen as staffName,
        COALESCE(km.phanTramGiam, 0) as discountPercent,
        (SELECT SUM(ct.soLuong * ct.giaBan) FROM tbl_CHI_TIET_DON_HANG ct WHERE ct.FK_DON_HANG = o.id) as originalTotal
      FROM tbl_DON_HANG o
      LEFT JOIN tbl_NHAN_VIEN nv ON o.FK_NHAN_VIEN = nv.id
      LEFT JOIN tbl_KHUYEN_MAI km ON o.FK_KHUYEN_MAI = km.id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      sql += ` AND (o.id LIKE ? OR o.ghiChu LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }
    if (status) {
      sql += ` AND o.trangThai = ?`;
      params.push(status);
    }
    if (from && to) {
      sql += ` AND o.ngayTao BETWEEN ? AND ?`;
      params.push(from, to);
    }

    // Tổng số bản ghi
    const [countResult] = await pool.query(`SELECT COUNT(*) as total FROM (${sql}) as sub`, params);
    const total = countResult[0].total;

    // Thêm sắp xếp và phân trang
    sql += ` ORDER BY o.ngayTao DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const [rows] = await pool.query(sql, params);
    // Tính tổng tiền sau giảm giá cho mỗi đơn
    const items = rows.map(row => ({
      ...row,
      discount: row.originalTotal * (row.discountPercent / 100),
      totalAmount: row.originalTotal * (1 - row.discountPercent / 100)
    }));

    return { items, total, page, limit };
  }

  // Lấy chi tiết 1 đơn hàng theo ID
  static async findById(id) {
    const [rows] = await pool.query(`
      SELECT 
        o.id, o.ngayTao as createdAt, o.tongTien as totalAmount, o.trangThai as status, o.ghiChu as note,
        nv.hoTen as staffName,
        COALESCE(km.phanTramGiam, 0) as discountPercent,
        (SELECT SUM(ct.soLuong * ct.giaBan) FROM tbl_CHI_TIET_DON_HANG ct WHERE ct.FK_DON_HANG = o.id) as originalTotal
      FROM tbl_DON_HANG o
      LEFT JOIN tbl_NHAN_VIEN nv ON o.FK_NHAN_VIEN = nv.id
      LEFT JOIN tbl_KHUYEN_MAI km ON o.FK_KHUYEN_MAI = km.id
      WHERE o.id = ?
    `, [id]);
    if (rows.length === 0) return null;

    const order = rows[0];
    order.discount = order.originalTotal * (order.discountPercent / 100);
    order.totalAmount = order.originalTotal * (1 - order.discountPercent / 100);

    // Lấy danh sách sản phẩm trong đơn
    const [items] = await pool.query(`
      SELECT 
        du.id as drinkId, du.tenDoUong as drinkName, ct.soLuong as quantity, 
        ct.giaBan as unitPrice, ct.thanhTien as total, ct.ghiChu as note
      FROM tbl_CHI_TIET_DON_HANG ct
      JOIN tbl_DO_UONG du ON ct.FK_DO_UONG = du.id
      WHERE ct.FK_DON_HANG = ?
    `, [id]);
    order.items = items;

    // Lấy thông tin hóa đơn (nếu có)
    const [invoice] = await pool.query(`
      SELECT method, customerPaid, change FROM tbl_HOA_DON WHERE FK_DON_HANG = ?
    `, [id]);
    order.invoice = invoice[0] || null;

    return order;
  }

  // Cập nhật trạng thái đơn hàng
  static async updateStatus(id, newStatus) {
    const [result] = await pool.query(
      'UPDATE tbl_DON_HANG SET trangThai = ? WHERE id = ?',
      [newStatus, id]
    );
    return result.affectedRows > 0;
  }
}

module.exports = OrderModel;