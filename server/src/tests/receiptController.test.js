// src/tests/receiptController.test.js
const { Op } = require("sequelize");
const { listReceipts, getReceiptDetail } = require('../controllers/receiptController');
const { Receipt, ReceiptItem, Ingredient, Employee } = require('../models');

jest.mock('../models');
jest.mock('bcryptjs');
jest.mock('../utils/jwt');

describe('Unit Test - Nhập kho (receiptController)', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      body: {},
      params: {},
      query: {},
      user: { employeeId: 1 },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  // ==================== LIST RECEIPTS ====================
  describe('listReceipts', () => {
    test('UT_RC_01: Lấy danh sách phiếu nhập thành công với phân trang mặc định', async () => {
      req.query = {};
      const mockReceipts = [
        {
          PK_PHIEU_NHAP: 1,
          nhaCungCap: 'Công ty A',
          tongTien: '1000000',
          ghiChu: 'Ghi chú 1',
          ngayNhap: new Date('2026-04-01'),
          Employee: { hoTen: 'Nguyễn Văn A' },
        },
        {
          PK_PHIEU_NHAP: 2,
          nhaCungCap: null,
          tongTien: '500000',
          ghiChu: null,
          ngayNhap: new Date('2026-04-02'),
          Employee: { hoTen: 'Trần Thị B' },
        },
      ];
      Receipt.findAndCountAll.mockResolvedValue({ count: 2, rows: mockReceipts });

      await listReceipts(req, res, next);

      expect(Receipt.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
          offset: 0,
          limit: 20,
          order: [['ngayNhap', 'DESC']],
          include: [{ model: Employee, attributes: ['hoTen'] }],
        })
      );
      expect(res.json).toHaveBeenCalledWith({
        items: [
          {
            id: 1,
            supplier: 'Công ty A',
            totalAmount: 1000000,
            note: 'Ghi chú 1',
            createdAt: expect.any(Date),
            staffName: 'Nguyễn Văn A',
          },
          {
            id: 2,
            supplier: null,
            totalAmount: 500000,
            note: null,
            createdAt: expect.any(Date),
            staffName: 'Trần Thị B',
          },
        ],
        total: 2,
        page: 1,
        limit: 20,
      });
    });

    test('UT_RC_02: Lọc phiếu nhập theo khoảng thời gian', async () => {
      req.query = { from: '2026-04-01', to: '2026-04-30' };
      Receipt.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

      await listReceipts(req, res, next);

      expect(Receipt.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            ngayNhap: {
              [Op.gte]: new Date('2026-04-01'),
              [Op.lte]: new Date('2026-04-30'),
            },
          },
        })
      );
    });

    test('UT_RC_03: Lọc phiếu nhập theo nhà cung cấp (tìm kiếm tương đối)', async () => {
      req.query = { supplier: 'Công ty' };
      Receipt.findAndCountAll.mockResolvedValue({ count: 1, rows: [] });

      await listReceipts(req, res, next);

      expect(Receipt.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            nhaCungCap: { [Op.like]: '%Công ty%' },
          },
        })
      );
    });

    test('UT_RC_04: Kết hợp lọc theo ngày và nhà cung cấp', async () => {
      req.query = { from: '2026-01-01', to: '2026-12-31', supplier: 'A' };
      Receipt.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

      await listReceipts(req, res, next);

      expect(Receipt.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            ngayNhap: {
              [Op.gte]: new Date('2026-01-01'),
              [Op.lte]: new Date('2026-12-31'),
            },
            nhaCungCap: { [Op.like]: '%A%' },
          },
        })
      );
    });

    test('UT_RC_05: Phân trang - page và limit tùy chỉnh', async () => {
      req.query = { page: 2, limit: 5 };
      Receipt.findAndCountAll.mockResolvedValue({ count: 12, rows: [] });

      await listReceipts(req, res, next);

      expect(Receipt.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          offset: 5, // (2-1)*5
          limit: 5,
        })
      );
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ page: 2, limit: 5 }));
    });

    test('UT_RC_06: Validation - page không phải số nguyên dương', async () => {
      req.query = { page: 0 };
      await listReceipts(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0].issues[0].message).toMatch(/Number must be greater than or equal to 1/);
    });

    test('UT_RC_07: Validation - limit vượt quá 100', async () => {
      req.query = { limit: 200 };
      await listReceipts(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0].issues[0].message).toMatch(/Number must be less than or equal to 100/);
    });

    test('UT_RC_08: Xử lý lỗi từ database', async () => {
      req.query = {};
      const dbError = new Error('DB connection error');
      Receipt.findAndCountAll.mockRejectedValue(dbError);

      await listReceipts(req, res, next);

      expect(next).toHaveBeenCalledWith(dbError);
    });
  });

  // ==================== GET RECEIPT DETAIL ====================
  describe('getReceiptDetail', () => {
    test('UT_RC_09: Lấy chi tiết phiếu nhập thành công', async () => {
      req.params.id = '1';
      const mockReceipt = {
        PK_PHIEU_NHAP: 1,
        nhaCungCap: 'Công ty A',
        tongTien: '1500000',
        ghiChu: 'Nhập hàng đầu tháng',
        ngayNhap: new Date('2026-04-15'),
        Employee: { hoTen: 'Lê Văn C' },
        ReceiptItems: [
          {
            FK_NGUYEN_LIEU: 10,
            soLuong: '100',
            donGia: '5000',
            thanhTien: '500000',
            Ingredient: { tenNguyenLieu: 'Sữa tươi', donViTinh: 'ml' },
          },
          {
            FK_NGUYEN_LIEU: 11,
            soLuong: '20',
            donGia: '50000',
            thanhTien: '1000000',
            Ingredient: { tenNguyenLieu: 'Trân châu', donViTinh: 'kg' },
          },
        ],
      };
      Receipt.findByPk.mockResolvedValue(mockReceipt);

      await getReceiptDetail(req, res, next);

      expect(Receipt.findByPk).toHaveBeenCalledWith(1, {
        include: [
          { model: Employee, attributes: ['hoTen'] },
          {
            model: ReceiptItem,
            include: [{ model: Ingredient, attributes: ['tenNguyenLieu', 'donViTinh'] }],
          },
        ],
      });
      expect(res.json).toHaveBeenCalledWith({
        id: 1,
        supplier: 'Công ty A',
        totalAmount: 1500000,
        note: 'Nhập hàng đầu tháng',
        createdAt: expect.any(Date),
        staffName: 'Lê Văn C',
        items: [
          {
            ingredientId: 10,
            ingredientName: 'Sữa tươi',
            unit: 'ml',
            quantity: 100,
            unitPrice: 5000,
            amount: 500000,
          },
          {
            ingredientId: 11,
            ingredientName: 'Trân châu',
            unit: 'kg',
            quantity: 20,
            unitPrice: 50000,
            amount: 1000000,
          },
        ],
      });
    });

    test('UT_RC_10: Phiếu nhập không tồn tại', async () => {
      req.params.id = '999';
      Receipt.findByPk.mockResolvedValue(null);

      await getReceiptDetail(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Phiếu nhập không tồn tại' });
    });

    test('UT_RC_11: Xử lý trường hợp không có nhân viên (Employee = null)', async () => {
      req.params.id = '2';
      const mockReceipt = {
        PK_PHIEU_NHAP: 2,
        nhaCungCap: null,
        tongTien: '200000',
        ghiChu: null,
        ngayNhap: new Date(),
        Employee: null,
        ReceiptItems: [],
      };
      Receipt.findByPk.mockResolvedValue(mockReceipt);

      await getReceiptDetail(req, res, next);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        staffName: '',
      }));
    });

    test('UT_RC_12: Xử lý lỗi database', async () => {
      req.params.id = '1';
      const dbError = new Error('DB error');
      Receipt.findByPk.mockRejectedValue(dbError);

      await getReceiptDetail(req, res, next);

      expect(next).toHaveBeenCalledWith(dbError);
    });
  });
});