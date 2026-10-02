// src/tests/orderController.test.js
const { Op } = require("sequelize"); // THÊM IMPORT NÀY
const {
    createOrder,
    completeOrder,
    listOrders,
    getOrderDetail,
    checkIngredients,
} = require('../controllers/orderController');
const {
    sequelize,
    Order,
    OrderItem,
    Drink,
    Promotion,
    PromotionDetail,
    Recipe,
    Ingredient,
    Invoice,
    Employee,
} = require('../models');

jest.mock('../models');
jest.mock('bcryptjs');
jest.mock('../utils/jwt');

describe('Unit Test - Bán hàng (orderController)', () => {
    let req, res, next;
    let mockTransaction;

    beforeEach(() => {
        jest.clearAllMocks();

        mockTransaction = {
            commit: jest.fn(),
            rollback: jest.fn(),
            LOCK: { UPDATE: 'UPDATE' },
        };
        sequelize.transaction.mockResolvedValue(mockTransaction);

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

    // ==================== CREATE ORDER ====================
    describe('createOrder', () => {
        const mockDrinkBase = {
            PK_DO_UONG: 1,
            tenDoUong: 'Trà sữa',
            giaBan: '39000',
            dangBan: 1,
            PromotionDetails: [],
        };

        test('UT_BH_01: Tạo đơn hàng thành công với mức đường/đá mặc định', async () => {
            req.body = { items: [{ drinkId: 1, quantity: 2 }] };
            Drink.findAll.mockResolvedValue([mockDrinkBase]);
            Order.create.mockResolvedValue({ PK_DON_HANG: 1 });
            OrderItem.bulkCreate.mockResolvedValue([]);

            await createOrder(req, res, next);

            expect(OrderItem.bulkCreate).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({ mucDuong: '100%', mucDa: '100%' }),
                ]),
                { transaction: mockTransaction }
            );
            expect(res.status).toHaveBeenCalledWith(201);
        });

        test('UT_BH_02: Tạo đơn hàng có khuyến mãi và ghi chú, đường/đá tùy chỉnh', async () => {
            req.body = {
                items: [{ drinkId: 1, quantity: 1, note: 'Ít đá', mucDuong: '70%', mucDa: '50%' }]
            };
            const mockDrinkPromo = {
                ...mockDrinkBase,
                PromotionDetails: [{ Promotion: { phanTramGiam: '10', trangThai: 1 } }]
            };
            Drink.findAll.mockResolvedValue([mockDrinkPromo]);
            Order.create.mockResolvedValue({ PK_DON_HANG: 2 });

            await createOrder(req, res, next);

            expect(Order.create).toHaveBeenCalledWith(
                expect.objectContaining({ giamGia: 3900, thanhTien: 35100 }),
                { transaction: mockTransaction }
            );
            expect(OrderItem.bulkCreate).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({ ghiChu: 'Ít đá', mucDuong: '70%', mucDa: '50%' })
                ]),
                { transaction: mockTransaction }
            );
        });

        test('UT_BH_03: Đồ uống ngừng bán', async () => {
            req.body = { items: [{ drinkId: 1, quantity: 1 }] };
            Drink.findAll.mockResolvedValue([]);

            await createOrder(req, res, next);

            expect(mockTransaction.rollback).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'Đồ uống không hợp lệ: 1' });
        });

        test('UT_BH_04: Validation - items rỗng', async () => {
            req.body = { items: [] };
            await createOrder(req, res, next);
            expect(next).toHaveBeenCalled();
            expect(next.mock.calls[0][0].issues[0].message).toMatch(/at least 1 element/);
        });

        test('UT_BH_05: Validation - quantity = 0', async () => {
            req.body = { items: [{ drinkId: 1, quantity: 0 }] };
            await createOrder(req, res, next);
            expect(next).toHaveBeenCalled();
        });

        test('UT_BH_06: Validation - thiếu items', async () => {
            req.body = { note: 'test' };
            await createOrder(req, res, next);
            expect(next).toHaveBeenCalled();
        });

        test('UT_BH_07: Validation - mucDuong không hợp lệ', async () => {
            req.body = { items: [{ drinkId: 1, quantity: 1, mucDuong: '80%' }] };
            await createOrder(req, res, next);
            expect(next).toHaveBeenCalled();
        });

        test('UT_BH_13: Rollback khi lỗi DB', async () => {
            req.body = { items: [{ drinkId: 1, quantity: 1 }] };
            Drink.findAll.mockResolvedValue([mockDrinkBase]);
            Order.create.mockRejectedValue(new Error('DB error'));

            await createOrder(req, res, next);

            expect(mockTransaction.rollback).toHaveBeenCalled();
            expect(next).toHaveBeenCalled();
        });
    });

    // ==================== COMPLETE ORDER ====================
    describe('completeOrder', () => {
        let mockOrder, mockItems, mockRecipes, mockIngredients;

        beforeEach(() => {
            // Tạo mock chung cho tiền mặt
            mockOrder = {
                PK_DON_HANG: 1,
                trangThai: 'CHO_THANH_TOAN',
                thanhTien: '60000',
                save: jest.fn(),
            };
            mockItems = [{ FK_DO_UONG: 1, soLuong: 2, mucDuong: '50%', mucDa: '70%' }];
            mockRecipes = [
                { FK_DO_UONG: 1, FK_NGUYEN_LIEU: 1, dinhLuong: '150' },
                { FK_DO_UONG: 1, FK_NGUYEN_LIEU: 4, dinhLuong: '20' }, // SUGAR_ID=4
                { FK_DO_UONG: 1, FK_NGUYEN_LIEU: 9, dinhLuong: '30' }, // ICE_ID=9
            ];
            mockIngredients = [
                { PK_NGUYEN_LIEU: 1, tenNguyenLieu: 'Sữa', soLuongTon: '500', save: jest.fn() },
                { PK_NGUYEN_LIEU: 4, tenNguyenLieu: 'Đường', soLuongTon: '100', save: jest.fn() },
                { PK_NGUYEN_LIEU: 9, tenNguyenLieu: 'Đá', soLuongTon: '200', save: jest.fn() },
            ];

            Order.findByPk.mockResolvedValue(mockOrder);
            OrderItem.findAll.mockResolvedValue(mockItems);
            Recipe.findAll.mockResolvedValue(mockRecipes);
            Ingredient.findAll.mockResolvedValue(mockIngredients);
            Invoice.create.mockResolvedValue({});
            Invoice.findOne.mockResolvedValue({ phuongThuc: 'TIEN_MAT', soTienKhachDua: '100000', soTienThua: '40000' });
        });

        test('UT_BH_08: Thanh toán thành công - Tiền mặt, trừ nguyên liệu theo tỉ lệ đường/đá', async () => {
            req.params.id = '1';
            req.body = { method: 'TIEN_MAT', customerPaid: 100000 };

            await completeOrder(req, res, next);

            const duong = mockIngredients.find(i => i.PK_NGUYEN_LIEU === 4);
            const da = mockIngredients.find(i => i.PK_NGUYEN_LIEU === 9);
            expect(duong.save).toHaveBeenCalled();
            expect(da.save).toHaveBeenCalled();
            expect(mockTransaction.commit).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ daTruNguyenLieu: true }));
        });

        test('UT_BH_09: Thanh toán chuyển khoản thành công - không cần customerPaid', async () => {
            mockOrder.thanhTien = '23750';
            req.params.id = '1';
            req.body = { method: 'CHUYEN_KHOAN' };

            await completeOrder(req, res, next);

            // Xác nhận không có lỗi
            expect(next).not.toHaveBeenCalled();
            expect(mockTransaction.rollback).not.toHaveBeenCalled();

            expect(Invoice.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    phuongThuc: 'CHUYEN_KHOAN',
                    soTienKhachDua: 23750,
                    soTienThua: 0,
                }),
                { transaction: mockTransaction }
            );
            expect(mockTransaction.commit).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Thanh toán thành công',
                daTruNguyenLieu: true,
            }));
        });

        test('UT_BH_10: Khách đưa thiếu tiền', async () => {
            req.params.id = '1';
            req.body = { method: 'TIEN_MAT', customerPaid: 50000 };
            await completeOrder(req, res, next);
            expect(mockTransaction.rollback).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(400);
        });

        test('UT_BH_11: Đơn không ở trạng thái chờ', async () => {
            mockOrder.trangThai = 'HOAN_THANH';
            req.params.id = '1';
            req.body = { method: 'TIEN_MAT', customerPaid: 60000 };
            await completeOrder(req, res, next);
            expect(res.status).toHaveBeenCalledWith(400);
        });

        test('UT_BH_12: Không đủ tồn kho (tính cả hệ số)', async () => {
            mockIngredients.find(i => i.PK_NGUYEN_LIEU === 4).soLuongTon = '10';
            req.params.id = '1';
            req.body = { method: 'TIEN_MAT', customerPaid: 60000 };
            await completeOrder(req, res, next);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'Không đủ tồn kho: Đường' });
        });

        test('UT_BH_14: Rollback khi lỗi DB', async () => {
            Invoice.create.mockRejectedValue(new Error('DB error'));
            req.params.id = '1';
            req.body = { method: 'TIEN_MAT', customerPaid: 60000 };
            await completeOrder(req, res, next);
            expect(mockTransaction.rollback).toHaveBeenCalled();
            expect(next).toHaveBeenCalled();
        });
    });

    // ==================== LIST ORDERS ====================
    describe('listOrders', () => {
        test('UT_BH_15: Lấy danh sách có phân trang và lọc trạng thái', async () => {
            req.query = { page: 1, limit: 10, status: 'HOAN_THANH' };
            Order.findAndCountAll.mockResolvedValue({ count: 5, rows: [] });
            await listOrders(req, res, next);
            expect(Order.findAndCountAll).toHaveBeenCalledWith(
                expect.objectContaining({ where: { trangThai: 'HOAN_THANH' }, offset: 0, limit: 10 })
            );
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ total: 5, page: 1 }));
        });

        test('UT_BH_16: Tìm kiếm theo mã đơn hoặc ghi chú', async () => {
            req.query = { search: '26' };
            Order.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });
            await listOrders(req, res, next);
            const where = Order.findAndCountAll.mock.calls[0][0].where;
            expect(where[Op.or]).toBeDefined();
        });
    });

    // ==================== GET ORDER DETAIL ====================
    describe('getOrderDetail', () => {
        test('UT_BH_17: Xem chi tiết đơn hàng', async () => {
            req.params.id = '1';
            const mockOrderDetail = {
                PK_DON_HANG: 1,
                trangThai: 'HOAN_THANH',
                thanhTien: '50000',
                Employee: { hoTen: 'Staff' },
                OrderItems: [],
                Invoice: null,
            };
            Order.findByPk.mockResolvedValue(mockOrderDetail);
            await getOrderDetail(req, res, next);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }));
        });

        test('UT_BH_18: Đơn không tồn tại', async () => {
            req.params.id = '999';
            Order.findByPk.mockResolvedValue(null);
            await getOrderDetail(req, res, next);
            expect(res.status).toHaveBeenCalledWith(404);
        });
    });

    // ==================== CHECK INGREDIENTS ====================
    describe('checkIngredients', () => {
        test('UT_BH_19: Kiểm tra đủ nguyên liệu có tính đường/đá', async () => {
            req.body = { items: [{ drinkId: 1, quantity: 2, mucDuong: '50%', mucDa: '70%' }] };
            Drink.findAll.mockResolvedValue([{ PK_DO_UONG: 1, dangBan: 1 }]);
            Recipe.findAll.mockResolvedValue([
                { FK_DO_UONG: 1, FK_NGUYEN_LIEU: 4, dinhLuong: '20', Ingredient: { tenNguyenLieu: 'Đường', donViTinh: 'g' } },
            ]);
            Ingredient.findAll.mockResolvedValue([
                { PK_NGUYEN_LIEU: 4, tenNguyenLieu: 'Đường', donViTinh: 'g', soLuongTon: '50' },
            ]);
            await checkIngredients(req, res, next);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    allEnough: true,
                    ingredients: expect.arrayContaining([
                        expect.objectContaining({ needed: 20, insufficient: 0 })
                    ])
                })
            );
        });

        test('UT_BH_20: Đồ uống không hợp lệ', async () => {
            req.body = { items: [{ drinkId: 999, quantity: 1 }] };
            Drink.findAll.mockResolvedValue([]);
            await checkIngredients(req, res, next);
            expect(res.status).toHaveBeenCalledWith(400);
        });
    });
});