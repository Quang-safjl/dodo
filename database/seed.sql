USE do_do_tea_shop;

-- Employees (passwords: admin123 / manager123 / staff123)
INSERT INTO tbl_NHAN_VIEN (hoTen, email, matKhauHash, vaiTro, trangThai)
VALUES
  ('Admin Đô Đô', 'admin@dodo.local', '$2b$10$9tHNymnNU1LBocAueEQC9uyYVDIUDU6/yp7rvKKsYe.7tO5P1J2z6', 'ADMIN', 1),
  ('Quản lý Đô Đô', 'manager@dodo.local', '$2b$10$GiFWNAfveplP3rh3/atTY.6aYFJ.Gfxp7hu4rENcaJ06HAqVXMcpm', 'MANAGER', 1),
  ('Nhân viên A', 'staff@dodo.local', '$2b$10$D.wSF.oAbFX.U6Si8W3STOTl8x.cFbqbwhaIJl0L5omgkE7UBB/EO', 'STAFF', 1);

-- Categories
INSERT INTO tbl_DANH_MUC (tenDanhMuc, trangThai)
VALUES
  ('Trà sữa', 1),
  ('Trà trái cây', 1),
  ('Đá xay', 1);

-- Drinks
INSERT INTO tbl_DO_UONG (FK_DANH_MUC, tenDoUong, giaBan, hinhAnhUrl, dangBan)
VALUES
  (1, 'Trà sữa trân châu', 30000, 'https://picsum.photos/seed/dodo-milktea/640/360', 1),
  (1, 'Trà sữa matcha', 35000, 'https://picsum.photos/seed/dodo-matcha/640/360', 1),
  (2, 'Trà đào cam sả', 32000, 'https://picsum.photos/seed/dodo-peachtea/640/360', 1),
  (3, 'Đá xay chocolate', 38000, 'https://picsum.photos/seed/dodo-choco/640/360', 1);

-- Ingredients
INSERT INTO tbl_NGUYEN_LIEU (tenNguyenLieu, donViTinh, soLuongTon, nguongToiThieu, trangThai)
VALUES
  ('Trà đen', 'gram', 5000, 500, 1),
  ('Bột sữa', 'gram', 4000, 500, 1),
  ('Trân châu', 'gram', 3000, 500, 1),
  ('Đường', 'gram', 8000, 1000, 1),
  ('Đào', 'gram', 3000, 300, 1),
  ('Cam', 'gram', 3000, 300, 1),
  ('Sả', 'gram', 2000, 200, 1),
  ('Bột cacao', 'gram', 2000, 200, 1),
  ('Đá', 'gram', 20000, 3000, 1);

-- Recipes (định lượng cho 1 ly)
-- Trà sữa trân châu (id 1)
INSERT INTO tbl_CONG_THUC (FK_DO_UONG, FK_NGUYEN_LIEU, dinhLuong)
VALUES
  (1, 1, 10),  -- trà đen
  (1, 2, 20),  -- bột sữa
  (1, 3, 30),  -- trân châu
  (1, 4, 15);  -- đường

-- Trà sữa matcha (id 2)
INSERT INTO tbl_CONG_THUC (FK_DO_UONG, FK_NGUYEN_LIEU, dinhLuong)
VALUES
  (2, 2, 22),
  (2, 4, 15);

-- Trà đào cam sả (id 3)
INSERT INTO tbl_CONG_THUC (FK_DO_UONG, FK_NGUYEN_LIEU, dinhLuong)
VALUES
  (3, 5, 40),
  (3, 6, 40),
  (3, 7, 10),
  (3, 4, 10);

-- Đá xay chocolate (id 4)
INSERT INTO tbl_CONG_THUC (FK_DO_UONG, FK_NGUYEN_LIEU, dinhLuong)
VALUES
  (4, 8, 20),
  (4, 9, 200),
  (4, 4, 10);

-- Promotion 10% for drink 1 and 3 (valid long)
INSERT INTO tbl_KHUYEN_MAI (tenKhuyenMai, phanTramGiam, tuNgay, denNgay, trangThai)
VALUES
  ('Khuyến mãi khai trương', 10, '2025-01-01 00:00:00', '2030-01-01 00:00:00', 1);

INSERT INTO tbl_CHI_TIET_KHUYEN_MAI (FK_KHUYEN_MAI, FK_DO_UONG)
VALUES
  (1, 1),
  (1, 3);

