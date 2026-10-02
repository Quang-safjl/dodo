// src/tests/productController.test.js
const { Op } = require("sequelize");
const { listProducts } = require('../controllers/productController');
const { Drink, Category, Promotion, PromotionDetail } = require('../models');

// Mock models
jest.mock('../models');

describe('Unit Test - Menu / Sản phẩm (productController)', () => {
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

  // ==================== LIST PRODUCTS ====================
  describe('listProducts', () => {
    const mockDrinkBase = {
      PK_DO_UONG: 1,
      tenDoUong: 'Trà sữa trân châu',
      giaBan: '39000',
      hinhAnhUrl: 'http://example.com/image.jpg',
      dangBan: 1,
      Category: { PK_DANH_MUC: 1, tenDanhMuc: 'Trà sữa' },
      PromotionDetails: [],
    };

    test('UT_MN_01: Lấy danh sách đồ uống đang bán thành công', async () => {
      req.query = {};
      Drink.findAll.mockResolvedValue([mockDrinkBase]);

      await listProducts(req, res, next);

      expect(Drink.findAll).toHaveBeenCalledWith({
        where: { dangBan: 1 },
        include: [
          { model: Category },
          {
            model: PromotionDetail,
            required: false,
            include: [{
              model: Promotion,
              where: { trangThai: 1, tuNgay: { [Op.lte]: expect.any(Date) }, denNgay: { [Op.gte]: expect.any(Date) } },
              required: false,
            }],
          },
        ],
        order: [['PK_DO_UONG', 'DESC']],
      });
      expect(res.json).toHaveBeenCalledWith({
        items: [{
          id: 1,
          name: 'Trà sữa trân châu',
          price: 39000,
          imageUrl: 'http://example.com/image.jpg',
          category: { id: 1, name: 'Trà sữa' },
          promotionPercent: 0,
        }],
      });
    });

    test('UT_MN_02: Lọc đồ uống theo categoryId', async () => {
      req.query = { categoryId: '2' };
      Drink.findAll.mockResolvedValue([]);

      await listProducts(req, res, next);

      expect(Drink.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { dangBan: 1, FK_DANH_MUC: 2 },
        })
      );
    });

    test('UT_MN_03: Tìm kiếm đồ uống theo từ khóa q', async () => {
      req.query = { q: 'trà' };
      Drink.findAll.mockResolvedValue([]);

      await listProducts(req, res, next);

      expect(Drink.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { dangBan: 1, tenDoUong: { [Op.like]: '%trà%' } },
        })
      );
    });

    test('UT_MN_04: Lọc kết hợp categoryId và q', async () => {
      req.query = { categoryId: '2', q: 'sữa' };
      Drink.findAll.mockResolvedValue([]);

      await listProducts(req, res, next);

      expect(Drink.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { dangBan: 1, FK_DANH_MUC: 2, tenDoUong: { [Op.like]: '%sữa%' } },
        })
      );
    });

    test('UT_MN_05: Validation - categoryId không phải số nguyên dương', async () => {
      req.query = { categoryId: '-1' };
      await listProducts(req, res, next);
      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.issues[0].message).toMatch(/positive/);
    });

    test('UT_MN_06: Validation - q rỗng sau khi trim', async () => {
      req.query = { q: '   ' };
      await listProducts(req, res, next);
      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.issues[0].message).toMatch(/at least 1 character/);
    });

    test('UT_MN_07: Tính promotionPercent - Đồ uống không có khuyến mãi', async () => {
      req.query = {};
      Drink.findAll.mockResolvedValue([mockDrinkBase]);

      await listProducts(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        items: [expect.objectContaining({ promotionPercent: 0 })],
      });
    });

    test('UT_MN_08: Tính promotionPercent - Đồ uống có 1 khuyến mãi đang hoạt động', async () => {
      req.query = {};
      const mockDrinkWithPromo = {
        ...mockDrinkBase,
        PromotionDetails: [{
          Promotion: { phanTramGiam: '15', trangThai: 1, tuNgay: new Date('2026-01-01'), denNgay: new Date('2026-12-31') },
        }],
      };
      Drink.findAll.mockResolvedValue([mockDrinkWithPromo]);

      await listProducts(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        items: [expect.objectContaining({ promotionPercent: 15 })],
      });
    });

    test('UT_MN_09: Tính promotionPercent - Đồ uống có nhiều khuyến mãi, chọn % cao nhất', async () => {
      req.query = {};
      const mockDrinkWithMultiplePromos = {
        ...mockDrinkBase,
        PromotionDetails: [
          { Promotion: { phanTramGiam: '5', trangThai: 1 } },
          { Promotion: { phanTramGiam: '20', trangThai: 1 } },
        ],
      };
      Drink.findAll.mockResolvedValue([mockDrinkWithMultiplePromos]);

      await listProducts(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        items: [expect.objectContaining({ promotionPercent: 20 })],
      });
    });

    test('UT_MN_10: Tính promotionPercent - Khuyến mãi hết hạn không được tính', async () => {
      req.query = {};
      // PromotionDetail có Promotion nhưng bị lọc do điều kiện ngày trong include (required: false)
      // Sequelize sẽ trả về Promotion = null nếu không thỏa mãn where
      const mockDrinkWithExpiredPromo = {
        ...mockDrinkBase,
        PromotionDetails: [{ Promotion: null }], // Do điều kiện where loại bỏ
      };
      Drink.findAll.mockResolvedValue([mockDrinkWithExpiredPromo]);

      await listProducts(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        items: [expect.objectContaining({ promotionPercent: 0 })],
      });
    });

    test('UT_MN_11: Tính promotionPercent - Khuyến mãi bị vô hiệu hóa', async () => {
      req.query = {};
      const mockDrinkWithInactivePromo = {
        ...mockDrinkBase,
        PromotionDetails: [{ Promotion: null }], // Vì trangThai=0 bị loại
      };
      Drink.findAll.mockResolvedValue([mockDrinkWithInactivePromo]);

      await listProducts(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        items: [expect.objectContaining({ promotionPercent: 0 })],
      });
    });

    test('UT_MN_12: Trả về category = null nếu đồ uống không có danh mục', async () => {
      req.query = {};
      const mockDrinkNoCategory = {
        ...mockDrinkBase,
        Category: null,
      };
      Drink.findAll.mockResolvedValue([mockDrinkNoCategory]);

      await listProducts(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        items: [expect.objectContaining({ category: null })],
      });
    });
  });
});