// src/tests/promotionController.test.js
const {
  listPromotions,
  createPromotion,
  updatePromotion,
  deletePromotion,
  assignPromotionToDrinks,
} = require('../controllers/promotionController');
const { Promotion, PromotionDetail } = require('../models');

// Mock models
jest.mock('../models');

describe('Unit Test - Khuyến mãi (promotionController)', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      body: {},
      params: {},
      query: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  // ==================== LIST PROMOTIONS ====================
  describe('listPromotions', () => {
    test('UT_KM_01: Lấy danh sách khuyến mãi thành công', async () => {
      const mockPromotions = [
        {
          PK_KHUYEN_MAI: 1,
          tenKhuyenMai: 'Black Friday',
          phanTramGiam: '30',
          tuNgay: new Date('2026-11-25'),
          denNgay: new Date('2026-11-26'),
          trangThai: 1,
        },
        {
          PK_KHUYEN_MAI: 2,
          tenKhuyenMai: 'Giáng sinh',
          phanTramGiam: '20',
          tuNgay: new Date('2026-12-24'),
          denNgay: new Date('2026-12-25'),
          trangThai: 0,
        },
      ];
      Promotion.findAll.mockResolvedValue(mockPromotions);

      await listPromotions(req, res, next);

      expect(Promotion.findAll).toHaveBeenCalledWith({ order: [['PK_KHUYEN_MAI', 'DESC']] });
      expect(res.json).toHaveBeenCalledWith({
        items: [
          {
            id: 1,
            name: 'Black Friday',
            percent: 30,
            from: expect.any(Date),
            to: expect.any(Date),
            isActive: true,
          },
          {
            id: 2,
            name: 'Giáng sinh',
            percent: 20,
            from: expect.any(Date),
            to: expect.any(Date),
            isActive: false,
          },
        ],
      });
    });

    test('UT_KM_02: Xác định isActive đúng khi trangThai=1', async () => {
      Promotion.findAll.mockResolvedValue([
        { PK_KHUYEN_MAI: 1, tenKhuyenMai: 'Test', phanTramGiam: '10', tuNgay: new Date(), denNgay: new Date(), trangThai: 1 },
      ]);
      await listPromotions(req, res, next);
      expect(res.json).toHaveBeenCalledWith({
        items: [expect.objectContaining({ isActive: true })],
      });
    });

    test('UT_KM_03: Xác định isActive = false khi trangThai=0', async () => {
      Promotion.findAll.mockResolvedValue([
        { PK_KHUYEN_MAI: 1, tenKhuyenMai: 'Test', phanTramGiam: '10', tuNgay: new Date(), denNgay: new Date(), trangThai: 0 },
      ]);
      await listPromotions(req, res, next);
      expect(res.json).toHaveBeenCalledWith({
        items: [expect.objectContaining({ isActive: false })],
      });
    });

  });

  // ==================== CREATE PROMOTION ====================
  describe('createPromotion', () => {
    test('UT_KM_04: Tạo khuyến mãi thành công với isActive = true', async () => {
      req.body = {
        name: 'Black Friday',
        percent: 30,
        from: '2026-11-25',
        to: '2026-11-26',
        isActive: true,
      };
      Promotion.create.mockResolvedValue({ PK_KHUYEN_MAI: 11 });

      await createPromotion(req, res, next);

      expect(Promotion.create).toHaveBeenCalledWith({
        tenKhuyenMai: 'Black Friday',
        phanTramGiam: 30,
        tuNgay: expect.any(Date),
        denNgay: expect.any(Date),
        trangThai: 1,
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ id: 11 });
    });

    test('UT_KM_05: Tạo KM với isActive mặc định = true khi không truyền', async () => {
      req.body = {
        name: 'Test',
        percent: 10,
        from: '2026-01-01',
        to: '2026-01-02',
      };
      Promotion.create.mockResolvedValue({ PK_KHUYEN_MAI: 12 });

      await createPromotion(req, res, next);

      expect(Promotion.create).toHaveBeenCalledWith(
        expect.objectContaining({ trangThai: 1 })
      );
    });

    test('UT_KM_06: Validation - Thiếu name', async () => {
      req.body = { percent: 10, from: '2026-01-01', to: '2026-01-02' };
      await createPromotion(req, res, next);
      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.issues[0].message).toContain('Required');
    });

    test('UT_KM_07: Validation - percent > 100', async () => {
      req.body = { name: 'Test', percent: 150, from: '2026-01-01', to: '2026-01-02' };
      await createPromotion(req, res, next);
      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.issues[0].message).toMatch(/less than or equal to 100/);
    });

    test('UT_KM_08: Validation - percent < 0', async () => {
      req.body = { name: 'Test', percent: -10, from: '2026-01-01', to: '2026-01-02' };
      await createPromotion(req, res, next);
      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.issues[0].message).toMatch(/greater than or equal to 0/);
    });


  });

  // ==================== UPDATE PROMOTION ====================
  describe('updatePromotion', () => {
    const mockPromotion = {
      PK_KHUYEN_MAI: 2,
      tenKhuyenMai: 'Giảm giá đặc biệt',
      phanTramGiam: 17,
      tuNgay: new Date(),
      denNgay: new Date(),
      trangThai: 1,
      save: jest.fn(),
    };

    test('UT_KM_09: Cập nhật khuyến mãi thành công', async () => {
      req.params.id = '2';
      req.body = {
        name: 'Giảm giá đặc biệt',
        percent: 20,
        from: '2026-11-11 07:00',
        to: '2026-11-12 06:59',
        isActive: true,
      };
      Promotion.findByPk.mockResolvedValue(mockPromotion);

      await updatePromotion(req, res, next);

      expect(Promotion.findByPk).toHaveBeenCalledWith(2);
      expect(mockPromotion.tenKhuyenMai).toBe('Giảm giá đặc biệt');
      expect(mockPromotion.phanTramGiam).toBe(20);
      expect(mockPromotion.trangThai).toBe(1);
      expect(mockPromotion.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ message: 'OK' });
    });

    test('UT_KM_10: Cập nhật KM - Không tồn tại', async () => {
      req.params.id = '999';
      req.body = { name: 'Test', percent: 10, from: '2026-01-01', to: '2026-01-02', isActive: true };
      Promotion.findByPk.mockResolvedValue(null);

      await updatePromotion(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Not found' });
    });


  });

  // ==================== DELETE PROMOTION ====================
  describe('deletePromotion', () => {
    test('UT_KM_11: Xóa mềm khuyến mãi (chuyển trangThai = 0)', async () => {
      req.params.id = '3';
      const mockPromotion = {
        PK_KHUYEN_MAI: 3,
        trangThai: 1,
        save: jest.fn(),
      };
      Promotion.findByPk.mockResolvedValue(mockPromotion);

      await deletePromotion(req, res, next);

      expect(Promotion.findByPk).toHaveBeenCalledWith(3);
      expect(mockPromotion.trangThai).toBe(0);
      expect(mockPromotion.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ message: 'OK' });
    });

  });

  // ==================== ASSIGN PROMOTION TO DRINKS ====================
  describe('assignPromotionToDrinks', () => {
    test('UT_KM_12: Gán đồ uống cho khuyến mãi thành công', async () => {
      req.params.id = '1';
      req.body = { drinkIds: [1, 2, 3] };
      PromotionDetail.bulkCreate.mockResolvedValue([]);

      await assignPromotionToDrinks(req, res, next);

      expect(PromotionDetail.bulkCreate).toHaveBeenCalledWith([
        { FK_KHUYEN_MAI: 1, FK_DO_UONG: 1 },
        { FK_KHUYEN_MAI: 1, FK_DO_UONG: 2 },
        { FK_KHUYEN_MAI: 1, FK_DO_UONG: 3 },
      ]);
      expect(res.json).toHaveBeenCalledWith({ message: 'OK' });
    });


  });
});