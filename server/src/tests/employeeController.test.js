// src/tests/employeeController.test.js
const bcrypt = require("bcryptjs");
const { listEmployees, createEmployee, updateEmployee, deleteEmployee } = require('../controllers/employeeController');
const { Employee } = require('../models');

// Mock dependencies
jest.mock('../models');
jest.mock('bcryptjs');

describe('Unit Test - Quản lý nhân viên (employeeController)', () => {
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

  // ==================== LIST EMPLOYEES ====================
  describe('listEmployees', () => {
    test('UT_NV_01: Lấy danh sách nhân viên thành công', async () => {
      const mockEmployees = [
        {
          PK_NHAN_VIEN: 1,
          hoTen: 'Nguyễn Văn A',
          email: 'a@dodo.local',
          vaiTro: 'MANAGER',
          trangThai: 1,
          ngayTao: new Date('2026-01-01'),
        },
        {
          PK_NHAN_VIEN: 2,
          hoTen: 'Trần Thị B',
          email: 'b@dodo.local',
          vaiTro: 'STAFF',
          trangThai: 0,
          ngayTao: new Date('2026-02-01'),
        },
      ];
      Employee.findAll.mockResolvedValue(mockEmployees);

      await listEmployees(req, res, next);

      expect(Employee.findAll).toHaveBeenCalledWith({ order: [['PK_NHAN_VIEN', 'DESC']] });
      expect(res.json).toHaveBeenCalledWith({
        items: [
          {
            id: 1,
            name: 'Nguyễn Văn A',
            email: 'a@dodo.local',
            role: 'MANAGER',
            isActive: true,
            createdAt: expect.any(Date),
          },
          {
            id: 2,
            name: 'Trần Thị B',
            email: 'b@dodo.local',
            role: 'STAFF',
            isActive: false,
            createdAt: expect.any(Date),
          },
        ],
      });
    });

    test('UT_NV_02: Xác định isActive đúng khi trangThai=1', async () => {
      Employee.findAll.mockResolvedValue([{ PK_NHAN_VIEN: 1, hoTen: 'Test', email: 'test@dodo.local', vaiTro: 'STAFF', trangThai: 1, ngayTao: new Date() }]);
      await listEmployees(req, res, next);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        items: [expect.objectContaining({ isActive: true })]
      }));
    });

    test('UT_NV_03: Xác định isActive = false khi bị khóa (trangThai=0)', async () => {
      Employee.findAll.mockResolvedValue([{ PK_NHAN_VIEN: 1, hoTen: 'Test', email: 'test@dodo.local', vaiTro: 'STAFF', trangThai: 0, ngayTao: new Date() }]);
      await listEmployees(req, res, next);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        items: [expect.objectContaining({ isActive: false })]
      }));
    });
  });

  // ==================== CREATE EMPLOYEE ====================
  describe('createEmployee', () => {
    test('UT_NV_04: Tạo nhân viên mới thành công', async () => {
      req.body = {
        name: 'Nguyễn Văn A',
        email: 'new@dodo.local',
        password: 'Admin@123',
        role: 'STAFF',
      };
      const mockHash = '$2b$10$hashedpassword';
      bcrypt.hash.mockResolvedValue(mockHash);
      Employee.create.mockResolvedValue({ PK_NHAN_VIEN: 25 });

      await createEmployee(req, res, next);

      expect(bcrypt.hash).toHaveBeenCalledWith('Admin@123', 10);
      expect(Employee.create).toHaveBeenCalledWith({
        hoTen: 'Nguyễn Văn A',
        email: 'new@dodo.local',
        matKhauHash: mockHash,
        vaiTro: 'STAFF',
        trangThai: 1,
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ id: 25 });
    });

    test('UT_NV_05: Validation - Thiếu name', async () => {
      req.body = { email: 'test@dodo.local', password: '123456' };
      await createEmployee(req, res, next);
      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.issues[0].message).toContain('Required');
    });

    test('UT_NV_06: Validation - email sai định dạng', async () => {
      req.body = { name: 'Test', email: 'invalid-email', password: '123456' };
      await createEmployee(req, res, next);
      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.issues[0].message).toContain('Invalid email');
    });

    test('UT_NV_07: Validation - password < 6 ký tự', async () => {
      req.body = { name: 'Test', email: 'test@dodo.local', password: '123' };
      await createEmployee(req, res, next);
      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.issues[0].message).toMatch(/at least 6/);
    });

    test('UT_NV_08: Validation - role không hợp lệ', async () => {
      req.body = { name: 'Test', email: 'test@dodo.local', password: '123456', role: 'CASHIER' };
      await createEmployee(req, res, next);
      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.issues[0].message).toMatch(/Invalid enum value/);
    });
  });

  // ==================== UPDATE EMPLOYEE ====================
  describe('updateEmployee', () => {
    const mockEmployee = {
      PK_NHAN_VIEN: 21,
      hoTen: 'Lưu Thị Z',
      vaiTro: 'STAFF',
      trangThai: 1,
      matKhauHash: 'oldhash',
      save: jest.fn(),
    };

    test('UT_NV_09: Cập nhật nhân viên thành công (có đổi mật khẩu)', async () => {
      req.params.id = '21';
      req.body = {
        name: 'Lưu Thị Z',
        role: 'MANAGER',
        isActive: true,
        password: 'NewPass@123',
      };
      Employee.findByPk.mockResolvedValue(mockEmployee);
      bcrypt.hash.mockResolvedValue('newhash');

      await updateEmployee(req, res, next);

      expect(Employee.findByPk).toHaveBeenCalledWith(21);
      expect(mockEmployee.hoTen).toBe('Lưu Thị Z');
      expect(mockEmployee.vaiTro).toBe('MANAGER');
      expect(mockEmployee.trangThai).toBe(1);
      expect(bcrypt.hash).toHaveBeenCalledWith('NewPass@123', 10);
      expect(mockEmployee.matKhauHash).toBe('newhash');
      expect(mockEmployee.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ message: 'OK' });
    });

    test('UT_NV_10: Cập nhật nhân viên - Không đổi mật khẩu', async () => {
      req.params.id = '21';
      req.body = {
        name: 'Lưu Thị Z Updated',
        role: 'MANAGER',
        isActive: false,
        // không có password
      };
      Employee.findByPk.mockResolvedValue(mockEmployee);

      await updateEmployee(req, res, next);

      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(mockEmployee.trangThai).toBe(0); // isActive false -> 0
      expect(mockEmployee.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ message: 'OK' });
    });

    test('UT_NV_11: Cập nhật nhân viên - Không tồn tại', async () => {
      req.params.id = '999';
      req.body = { name: 'Test', role: 'STAFF', isActive: true };
      Employee.findByPk.mockResolvedValue(null);

      await updateEmployee(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Not found' });
    });
  });

  // ==================== DELETE EMPLOYEE ====================
  describe('deleteEmployee', () => {
    test('UT_NV_12: Xóa mềm nhân viên (khóa tài khoản)', async () => {
      req.params.id = '20';
      const mockEmployee = {
        PK_NHAN_VIEN: 20,
        trangThai: 1,
        save: jest.fn(),
      };
      Employee.findByPk.mockResolvedValue(mockEmployee);

      await deleteEmployee(req, res, next);

      expect(Employee.findByPk).toHaveBeenCalledWith(20);
      expect(mockEmployee.trangThai).toBe(0);
      expect(mockEmployee.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ message: 'OK' });
    });
  });
});