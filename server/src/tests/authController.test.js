// __tests__/authController.test.js
const bcrypt = require("bcryptjs");
const { login } = require("../controllers/authController");
const { Employee } = require("../models");
const { signAccessToken } = require("../utils/jwt");

// Mock tất cả dependencies
jest.mock("../models");
jest.mock("bcryptjs");
jest.mock("../utils/jwt");

describe("Unit Test - Login (authController)", () => {
  let req, res, next;

  beforeEach(() => {
    // Reset mock trước mỗi test
    jest.clearAllMocks();

    req = {
      body: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  // ==================== UT_LG_01 ====================
  test("UT_LG_01: Đăng nhập thành công - Email hợp lệ, mật khẩu đúng, trạng thái hoạt động", async () => {
    // Arrange
    req.body = {
      email: "manager@dodo.local",
      password: "Admin@123",
    };

    const mockEmployee = {
      PK_NHAN_VIEN: 1,
      email: "manager@dodo.local",
      hoTen: "Quản lý Đỏ Đỏ",
      matKhauHash: "$2b$10$hashed_password_here",
      vaiTro: "MANAGER",
      trangThai: 1,
    };

    const mockToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxx.yyy";

    Employee.findOne.mockResolvedValue(mockEmployee);
    bcrypt.compare.mockResolvedValue(true);
    signAccessToken.mockReturnValue(mockToken);

    // Act
    await login(req, res, next);

    // Assert
    expect(Employee.findOne).toHaveBeenCalledWith({ where: { email: "manager@dodo.local" } });
    expect(bcrypt.compare).toHaveBeenCalledWith("Admin@123", "$2b$10$hashed_password_here");
    expect(signAccessToken).toHaveBeenCalledWith({ employeeId: 1, role: "MANAGER" });
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({
      accessToken: mockToken,
      user: {
        employeeId: 1,
        name: "Quản lý Đỏ Đỏ",
        email: "manager@dodo.local",
        role: "MANAGER",
      },
    });
  });

  // ==================== UT_LG_02 ====================
  test("UT_LG_02: Validation - Email sai định dạng (thiếu @)", async () => {
    req.body = { email: "manager.dodo.local", password: "123456" };

    await login(req, res, next);

    // ZodError được throw và bị catch, gọi next(err)
    expect(next).toHaveBeenCalledTimes(1);
    const error = next.mock.calls[0][0];
    expect(error.issues[0].message).toContain("Invalid email");
    expect(Employee.findOne).not.toHaveBeenCalled();
  });

  // ==================== UT_LG_03 ====================
  test("UT_LG_03: Validation - Email rỗng", async () => {
    req.body = { email: "", password: "123456" };

    await login(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const error = next.mock.calls[0][0];
    expect(error.issues[0].message).toContain("Invalid email");
  });

  // ==================== UT_LG_04 ====================
  test("UT_LG_04: Validation - Password rỗng", async () => {
    req.body = { email: "manager@dodo.local", password: "" };

    await login(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const error = next.mock.calls[0][0];
    expect(error.issues[0].message).toContain("String must contain at least 1 character(s)");
  });

  // ==================== UT_LG_05 ====================
  test("UT_LG_05: Validation - Thiếu cả email và password", async () => {
    req.body = {};

    await login(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const error = next.mock.calls[0][0];
    expect(error.issues).toBeDefined();
  });

  // ==================== UT_LG_06 ====================
  test("UT_LG_06: Đăng nhập thất bại - Email không tồn tại", async () => {
    req.body = { email: "unknown@dodo.local", password: "AnyPassword123" };
    Employee.findOne.mockResolvedValue(null);

    await login(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Sai thông tin đăng nhập" });
    expect(bcrypt.compare).not.toHaveBeenCalled();
  });

  // ==================== UT_LG_07 ====================
  test("UT_LG_07: Đăng nhập thất bại - Sai mật khẩu", async () => {
    req.body = { email: "manager@dodo.local", password: "WrongPassword" };
    const mockEmployee = {
      PK_NHAN_VIEN: 1,
      matKhauHash: "$2b$10$hashed_password_here",
      trangThai: 1,
    };
    Employee.findOne.mockResolvedValue(mockEmployee);
    bcrypt.compare.mockResolvedValue(false);

    await login(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Sai thông tin đăng nhập" });
  });

  // ==================== UT_LG_08 ====================
  test("UT_LG_08: Đăng nhập thất bại - Tài khoản bị khóa (trangThai != 1)", async () => {
    req.body = { email: "staff@dodo.local", password: "CorrectPassword" };
    const mockEmployee = {
      PK_NHAN_VIEN: 2,
      matKhauHash: "$2b$10$hashed",
      trangThai: 0, // bị khóa
    };
    Employee.findOne.mockResolvedValue(mockEmployee);

    await login(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Sai thông tin đăng nhập" });
    expect(bcrypt.compare).not.toHaveBeenCalled(); // không cần check password
  });

  // ==================== UT_LG_09 ====================
  test("UT_LG_09: Đăng nhập thất bại - Tài khoản bị xóa mềm", async () => {
    req.body = { email: "fired@dodo.local", password: "OldPassword" };
    // Employee.findOne trả về null nếu paranoid: true được bật
    Employee.findOne.mockResolvedValue(null);

    await login(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Sai thông tin đăng nhập" });
  });

  // ==================== UT_LG_10 ====================
  test("UT_LG_10: Kiểm tra gọi signAccessToken với đúng payload", async () => {
    req.body = { email: "manager@dodo.local", password: "Admin@123" };
    const mockEmployee = {
      PK_NHAN_VIEN: 1,
      email: "manager@dodo.local",
      hoTen: "Quản lý Đỏ Đỏ",
      matKhauHash: "$2b$10$hash",
      vaiTro: "MANAGER",
      trangThai: 1,
    };
    Employee.findOne.mockResolvedValue(mockEmployee);
    bcrypt.compare.mockResolvedValue(true);
    signAccessToken.mockReturnValue("mocked_jwt_token");

    await login(req, res, next);

    expect(signAccessToken).toHaveBeenCalledWith({
      employeeId: 1,
      role: "MANAGER",
    });
  });

  // ==================== UT_LG_11 ====================
  test("UT_LG_11: Kiểm tra bcrypt.compare được gọi đúng tham số", async () => {
    req.body = { email: "manager@dodo.local", password: "Admin@123" };
    const mockEmployee = {
      PK_NHAN_VIEN: 1,
      matKhauHash: "$2b$10$specific_hash",
      trangThai: 1,
    };
    Employee.findOne.mockResolvedValue(mockEmployee);
    bcrypt.compare.mockResolvedValue(true);

    await login(req, res, next);

    expect(bcrypt.compare).toHaveBeenCalledWith("Admin@123", "$2b$10$specific_hash");
  });

  // ==================== UT_LG_12 ====================
  test("UT_LG_12: Xử lý lỗi database khi Employee.findOne thất bại", async () => {
    req.body = { email: "test@dodo.local", password: "123456" };
    const dbError = new Error("DB Connection failed");
    Employee.findOne.mockRejectedValue(dbError);

    await login(req, res, next);

    expect(next).toHaveBeenCalledWith(dbError);
    expect(res.status).not.toHaveBeenCalled();
  });

  // ==================== UT_LG_13 ====================
  test("UT_LG_13: Xử lý lỗi khi bcrypt.compare throw exception", async () => {
    req.body = { email: "test@dodo.local", password: "123456" };
    const mockEmployee = {
      PK_NHAN_VIEN: 1,
      matKhauHash: "$2b$10$hash",
      trangThai: 1,
    };
    Employee.findOne.mockResolvedValue(mockEmployee);
    const bcryptError = new Error("bcrypt error");
    bcrypt.compare.mockRejectedValue(bcryptError);

    await login(req, res, next);

    expect(next).toHaveBeenCalledWith(bcryptError);
  });

  // ==================== UT_LG_14 ====================
  test("UT_LG_14: Xử lý lỗi khi signAccessToken throw exception", async () => {
    req.body = { email: "test@dodo.local", password: "123456" };
    const mockEmployee = {
      PK_NHAN_VIEN: 1,
      matKhauHash: "$2b$10$hash",
      trangThai: 1,
    };
    Employee.findOne.mockResolvedValue(mockEmployee);
    bcrypt.compare.mockResolvedValue(true);
    const jwtError = new Error("JWT Secret not defined");
    signAccessToken.mockImplementation(() => {
      throw jwtError;
    });

    await login(req, res, next);

    expect(next).toHaveBeenCalledWith(jwtError);
  });

  // ==================== UT_LG_15 ====================
  test("UT_LG_15: Kiểm tra response JSON có đúng cấu trúc user object", async () => {
    req.body = { email: "manager@dodo.local", password: "Admin@123" };
    const mockEmployee = {
      PK_NHAN_VIEN: 1,
      email: "manager@dodo.local",
      hoTen: "Quản lý Đỏ Đỏ",
      matKhauHash: "$2b$10$hash",
      vaiTro: "MANAGER",
      trangThai: 1,
    };
    Employee.findOne.mockResolvedValue(mockEmployee);
    bcrypt.compare.mockResolvedValue(true);
    signAccessToken.mockReturnValue("token");

    await login(req, res, next);

    const responseBody = res.json.mock.calls[0][0];
    expect(responseBody.user).toEqual({
      employeeId: 1,
      name: "Quản lý Đỏ Đỏ",
      email: "manager@dodo.local",
      role: "MANAGER",
    });
    expect(responseBody.user).not.toHaveProperty("matKhauHash");
  });

  // ==================== UT_LG_16 ====================
  test("UT_LG_16: Kiểm tra status 401 không bị gọi khi thành công", async () => {
    req.body = { email: "manager@dodo.local", password: "Admin@123" };
    const mockEmployee = {
      PK_NHAN_VIEN: 1,
      email: "manager@dodo.local",
      hoTen: "Quản lý Đỏ Đỏ",
      matKhauHash: "$2b$10$hash",
      vaiTro: "MANAGER",
      trangThai: 1,
    };
    Employee.findOne.mockResolvedValue(mockEmployee);
    bcrypt.compare.mockResolvedValue(true);
    signAccessToken.mockReturnValue("token");

    await login(req, res, next);

    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledTimes(1);
  });

  // ==================== UT_LG_17 ====================
  test("UT_LG_17: Kiểm tra email phân biệt hoa thường khi query DB", async () => {
    req.body = { email: "Manager@Dodo.Local", password: "Admin@123" };
    // DB lưu email thường, nếu không dùng iLike thì sẽ không tìm thấy
    Employee.findOne.mockResolvedValue(null); // giả sử DB phân biệt hoa thường

    await login(req, res, next);

    expect(Employee.findOne).toHaveBeenCalledWith({ where: { email: "Manager@Dodo.Local" } });
    expect(res.status).toHaveBeenCalledWith(401);
  });

  // ==================== UT_LG_18 ====================
  test("UT_LG_18: Validation - Email có khoảng trắng đầu/cuối", async () => {
    req.body = { email: "  manager@dodo.local  ", password: "123456" };

    await login(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const error = next.mock.calls[0][0];
    expect(error.issues[0].message).toContain("Invalid email");
  });

  // ==================== UT_LG_19 ====================
  test("UT_LG_19: Validation - Email dài bất thường", async () => {
    const longEmail = "a".repeat(300) + "@dodo.local";
    req.body = { email: longEmail, password: "123456" };

    await login(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const error = next.mock.calls[0][0];
    expect(error.issues[0].message).toContain("Invalid email");
  });

  // ==================== UT_LG_20 ====================
  test("UT_LG_20: Performance - Thời gian phản hồi khi đăng nhập thành công < 500ms", async () => {
    req.body = { email: "manager@dodo.local", password: "Admin@123" };
    const mockEmployee = {
      PK_NHAN_VIEN: 1,
      email: "manager@dodo.local",
      hoTen: "Quản lý Đỏ Đỏ",
      matKhauHash: "$2b$10$hash",
      vaiTro: "MANAGER",
      trangThai: 1,
    };
    Employee.findOne.mockResolvedValue(mockEmployee);
    bcrypt.compare.mockResolvedValue(true);
    signAccessToken.mockReturnValue("token");

    const start = Date.now();
    await login(req, res, next);
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(500);
  });
});