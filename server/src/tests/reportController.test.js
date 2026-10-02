// src/tests/revenueController.test.js
const { revenueReport } = require('../controllers/reportController');
const { sequelize } = require('../models');
const { QueryTypes } = require('sequelize');

// Mock sequelize
jest.mock('../models', () => ({
  sequelize: {
    query: jest.fn(),
  },
}));

describe('Unit Test - Báo cáo doanh thu (revenueController)', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      query: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  // ==================== REVENUE REPORT ====================
  describe('revenueReport', () => {
    test('UT_BC_01: Báo cáo doanh thu theo ngày - không lọc ngày', async () => {
      req.query = { groupBy: 'day' };
      const mockRows = [
        { bucket: '2026-04-01', orderCount: 1, revenue: '50000' },
        { bucket: '2026-04-15', orderCount: 1, revenue: '70000' },
      ];
      sequelize.query.mockResolvedValue(mockRows);

      await revenueReport(req, res, next);

      expect(sequelize.query).toHaveBeenCalledWith(
        expect.stringContaining("DATE_FORMAT(o.ngayHoanThanh, :fmt) AS bucket"),
        expect.objectContaining({
          replacements: { fmt: '%Y-%m-%d' },
          type: QueryTypes.SELECT,
        })
      );
      expect(res.json).toHaveBeenCalledWith({
        groupBy: 'day',
        totalRevenue: 120000,
        totalOrders: 2,
        series: [
          { bucket: '2026-04-01', orderCount: 1, revenue: 50000 },
          { bucket: '2026-04-15', orderCount: 1, revenue: 70000 },
        ],
      });
    });

    test('UT_BC_02: Báo cáo doanh thu theo tháng', async () => {
      req.query = { groupBy: 'month', from: '2026-01-01', to: '2026-12-31' };
      const mockRows = [
        { bucket: '2026-04', orderCount: 2, revenue: '120000' },
      ];
      sequelize.query.mockResolvedValue(mockRows);

      await revenueReport(req, res, next);

      expect(sequelize.query).toHaveBeenCalledWith(
        expect.stringContaining('DATE_FORMAT'),
        expect.objectContaining({
          replacements: expect.objectContaining({ fmt: '%Y-%m' }),
        })
      );
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ groupBy: 'month' })
      );
    });

    test('UT_BC_03: Báo cáo doanh thu theo năm', async () => {
      req.query = { groupBy: 'year' };
      const mockRows = [
        { bucket: '2026', orderCount: 5, revenue: '500000' },
      ];
      sequelize.query.mockResolvedValue(mockRows);

      await revenueReport(req, res, next);

      expect(sequelize.query).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          replacements: expect.objectContaining({ fmt: '%Y' }),
        })
      );
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ groupBy: 'year' })
      );
    });

    test('UT_BC_04: Báo cáo doanh thu - Lọc theo from', async () => {
      req.query = { from: '2026-04-01' };
      sequelize.query.mockResolvedValue([]);

      await revenueReport(req, res, next);

      const callArgs = sequelize.query.mock.calls[0];
      const sql = callArgs[0];
      const options = callArgs[1];

      expect(sql).toContain("o.ngayHoanThanh >= :from");
      expect(options.replacements).toHaveProperty('from', '2026-04-01');
    });

    test('UT_BC_05: Báo cáo doanh thu - Lọc theo to', async () => {
      req.query = { to: '2026-04-30' };
      sequelize.query.mockResolvedValue([]);

      await revenueReport(req, res, next);

      const callArgs = sequelize.query.mock.calls[0];
      const sql = callArgs[0];
      const options = callArgs[1];

      expect(sql).toContain("o.ngayHoanThanh <= :to");
      expect(options.replacements).toHaveProperty('to', '2026-04-30');
    });

    test('UT_BC_06: Báo cáo doanh thu - Lọc cả from và to', async () => {
      req.query = { from: '2026-04-01', to: '2026-04-30' };
      sequelize.query.mockResolvedValue([]);

      await revenueReport(req, res, next);

      const callArgs = sequelize.query.mock.calls[0];
      const sql = callArgs[0];
      const options = callArgs[1];

      expect(sql).toContain("o.ngayHoanThanh >= :from");
      expect(sql).toContain("o.ngayHoanThanh <= :to");
      expect(options.replacements).toMatchObject({
        from: '2026-04-01',
        to: '2026-04-30',
      });
    });

    test('UT_BC_07: Validation - groupBy không hợp lệ', async () => {
      req.query = { groupBy: 'week' };

      await revenueReport(req, res, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.issues[0].message).toMatch(/Invalid enum value/);
      expect(sequelize.query).not.toHaveBeenCalled();
    });

    test('UT_BC_11: Báo cáo doanh thu - Không có đơn hàng nào', async () => {
      req.query = { from: '2026-03-01', to: '2026-03-31' };
      sequelize.query.mockResolvedValue([]);

      await revenueReport(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        groupBy: 'day', // default
        totalRevenue: 0,
        totalOrders: 0,
        series: [],
      });
    });

    test('UT_BC_12: Báo cáo doanh thu - Chỉ tính đơn HOAN_THANH và có ngayHoanThanh', async () => {
      req.query = {};
      sequelize.query.mockResolvedValue([]);

      await revenueReport(req, res, next);

      const callArgs = sequelize.query.mock.calls[0];
      const sql = callArgs[0];
      expect(sql).toContain("o.trangThai = 'HOAN_THANH'");
      expect(sql).toContain("o.ngayHoanThanh IS NOT NULL");
    });

    test('UT_BC_13: Xử lý lỗi từ database', async () => {
      req.query = {};
      const dbError = new Error('DB error');
      sequelize.query.mockRejectedValue(dbError);

      await revenueReport(req, res, next);

      expect(next).toHaveBeenCalledWith(dbError);
    });
  });

  // ==================== BUILD FORMAT (hàm nội bộ) ====================
  // Để test buildFormat, ta có thể import riêng nếu export, nhưng hiện tại không export
  // Ta có thể kiểm tra gián tiếp qua groupBy test trên, hoặc tách hàm ra module khác để test.
  // Ở đây ta test gián tiếp qua UT_BC_01,02,03.
});