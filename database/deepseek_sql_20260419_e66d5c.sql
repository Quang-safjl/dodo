USE do_do_tea_shop;

-- =============================================
-- 1. Bổ sung 20 NHÂN VIÊN (vai trò trộn lẫn)
-- =============================================
INSERT INTO tbl_NHAN_VIEN (hoTen, email, matKhauHash, vaiTro, trangThai)
VALUES
  ('Lê Thị B', 'staff2@dodo.local', '$2b$10$D.wSF.oAbFX.U6Si8W3STOTl8x.cFbqbwhaIJl0L5omgkE7UBB/EO', 'STAFF', 1),
  ('Trần Văn C', 'staff3@dodo.local', '$2b$10$D.wSF.oAbFX.U6Si8W3STOTl8x.cFbqbwhaIJl0L5omgkE7UBB/EO', 'STAFF', 1),
  ('Phạm Thị D', 'staff4@dodo.local', '$2b$10$D.wSF.oAbFX.U6Si8W3STOTl8x.cFbqbwhaIJl0L5omgkE7UBB/EO', 'STAFF', 1),
  ('Hoàng Văn E', 'staff5@dodo.local', '$2b$10$D.wSF.oAbFX.U6Si8W3STOTl8x.cFbqbwhaIJl0L5omgkE7UBB/EO', 'STAFF', 1),
  ('Ngô Thị F', 'staff6@dodo.local', '$2b$10$D.wSF.oAbFX.U6Si8W3STOTl8x.cFbqbwhaIJl0L5omgkE7UBB/EO', 'STAFF', 1),
  ('Đặng Văn G', 'staff7@dodo.local', '$2b$10$D.wSF.oAbFX.U6Si8W3STOTl8x.cFbqbwhaIJl0L5omgkE7UBB/EO', 'STAFF', 1),
  ('Bùi Thị H', 'staff8@dodo.local', '$2b$10$D.wSF.oAbFX.U6Si8W3STOTl8x.cFbqbwhaIJl0L5omgkE7UBB/EO', 'STAFF', 1),
  ('Đỗ Văn I', 'staff9@dodo.local', '$2b$10$D.wSF.oAbFX.U6Si8W3STOTl8x.cFbqbwhaIJl0L5omgkE7UBB/EO', 'STAFF', 1),
  ('Vũ Thị K', 'staff10@dodo.local', '$2b$10$D.wSF.oAbFX.U6Si8W3STOTl8x.cFbqbwhaIJl0L5omgkE7UBB/EO', 'STAFF', 1),
  ('Lý Văn L', 'staff11@dodo.local', '$2b$10$D.wSF.oAbFX.U6Si8W3STOTl8x.cFbqbwhaIJl0L5omgkE7UBB/EO', 'STAFF', 1),
  ('Trịnh Thị M', 'manager2@dodo.local', '$2b$10$GiFWNAfveplP3rh3/atTY.6aYFJ.Gfxp7hu4rENcaJ06HAqVXMcpm', 'MANAGER', 1),
  ('Phùng Văn N', 'manager3@dodo.local', '$2b$10$GiFWNAfveplP3rh3/atTY.6aYFJ.Gfxp7hu4rENcaJ06HAqVXMcpm', 'MANAGER', 1),
  ('Tạ Thị O', 'admin2@dodo.local', '$2b$10$9tHNymnNU1LBocAueEQC9uyYVDIUDU6/yp7rvKKsYe.7tO5P1J2z6', 'ADMIN', 1),
  ('Hà Văn P', 'staff12@dodo.local', '$2b$10$D.wSF.oAbFX.U6Si8W3STOTl8x.cFbqbwhaIJl0L5omgkE7UBB/EO', 'STAFF', 1),
  ('Nguyễn Thị Q', 'staff13@dodo.local', '$2b$10$D.wSF.oAbFX.U6Si8W3STOTl8x.cFbqbwhaIJl0L5omgkE7UBB/EO', 'STAFF', 1),
  ('Trương Văn R', 'staff14@dodo.local', '$2b$10$D.wSF.oAbFX.U6Si8W3STOTl8x.cFbqbwhaIJl0L5omgkE7UBB/EO', 'STAFF', 1),
  ('Đinh Thị S', 'staff15@dodo.local', '$2b$10$D.wSF.oAbFX.U6Si8W3STOTl8x.cFbqbwhaIJl0L5omgkE7UBB/EO', 'STAFF', 1),
  ('Mai Văn T', 'staff16@dodo.local', '$2b$10$D.wSF.oAbFX.U6Si8W3STOTl8x.cFbqbwhaIJl0L5omgkE7UBB/EO', 'STAFF', 1),
  ('Lương Thị U', 'staff17@dodo.local', '$2b$10$D.wSF.oAbFX.U6Si8W3STOTl8x.cFbqbwhaIJl0L5omgkE7UBB/EO', 'STAFF', 1),
  ('Phan Văn V', 'staff18@dodo.local', '$2b$10$D.wSF.oAbFX.U6Si8W3STOTl8x.cFbqbwhaIJl0L5omgkE7UBB/EO', 'STAFF', 1),
  ('Hồ Thị X', 'staff19@dodo.local', '$2b$10$D.wSF.oAbFX.U6Si8W3STOTl8x.cFbqbwhaIJl0L5omgkE7UBB/EO', 'STAFF', 1),
  ('Vương Văn Y', 'staff20@dodo.local', '$2b$10$D.wSF.oAbFX.U6Si8W3STOTl8x.cFbqbwhaIJl0L5omgkE7UBB/EO', 'STAFF', 1),
  ('Lưu Thị Z', 'staff21@dodo.local', '$2b$10$D.wSF.oAbFX.U6Si8W3STOTl8x.cFbqbwhaIJl0L5omgkE7UBB/EO', 'STAFF', 1);

-- =============================================
-- 2. Bổ sung 20 DANH MỤC (mở rộng các loại đồ uống)
-- =============================================
INSERT INTO tbl_DANH_MUC (tenDanhMuc, trangThai)
VALUES
  ('Cà phê', 1),
  ('Trà sữa đặc biệt', 1),
  ('Sinh tố', 1),
  ('Nước ép', 1),
  ('Yogurt', 1),
  ('Đá xay hoa quả', 1),
  ('Matcha - Socola', 1),
  ('Hồng trà', 1),
  ('Trà hoa', 1),
  ('Macchiato', 1),
  ('Trà sữa kem cheese', 1),
  ('Topping', 1),
  ('Combo đặc biệt', 1),
  ('Trà detox', 1),
  ('Nước suối - Nước ngọt', 1),
  ('Bánh ngọt', 1),
  ('Kem', 1),
  ('Trà sữa chân trâu hoàng gia', 1),
  ('Trà ô long', 1),
  ('Sữa tươi trân châu', 1),
  ('Trà đào', 1),
  ('Nước dừa', 1),
  ('Cocktail trái cây', 1);

-- =============================================
-- 3. Bổ sung 20 ĐỒ UỐNG (liên kết danh mục mới)
-- =============================================
INSERT INTO tbl_DO_UONG (FK_DANH_MUC, tenDoUong, giaBan, hinhAnhUrl, dangBan)
VALUES
  (4, 'Cà phê đen', 25000, 'https://picsum.photos/seed/dodo-blackcoffee/640/360', 1),
  (4, 'Cà phê sữa', 28000, 'https://picsum.photos/seed/dodo-milkcoffee/640/360', 1),
  (5, 'Trà sữa hoàng kim', 42000, 'https://picsum.photos/seed/dodo-goldenmilktea/640/360', 1),
  (6, 'Sinh tố bơ', 40000, 'https://picsum.photos/seed/dodo-avocadosmoothie/640/360', 1),
  (6, 'Sinh tố xoài', 38000, 'https://picsum.photos/seed/dodo-mangosmoothie/640/360', 1),
  (7, 'Nước ép cam', 35000, 'https://picsum.photos/seed/dodo-orangejuice/640/360', 1),
  (7, 'Nước ép táo', 33000, 'https://picsum.photos/seed/dodo-applejuice/640/360', 1),
  (8, 'Yogurt việt quất', 37000, 'https://picsum.photos/seed/dodo-blueberryyogurt/640/360', 1),
  (9, 'Đá xay dâu', 45000, 'https://picsum.photos/seed/dodo-strawberryslush/640/360', 1),
  (10, 'Matcha đá xay', 48000, 'https://picsum.photos/seed/dodo-matchaslush/640/360', 1),
  (11, 'Hồng trà sữa', 32000, 'https://picsum.photos/seed/dodo-blackmilktea/640/360', 1),
  (12, 'Trà hoa cúc', 30000, 'https://picsum.photos/seed/dodo-chamomiletea/640/360', 1),
  (13, 'Macchiato caramel', 43000, 'https://picsum.photos/seed/dodo-caramelmacchiato/640/360', 1),
  (14, 'Trà sữa kem cheese', 47000, 'https://picsum.photos/seed/dodo-cheesemilktea/640/360', 1),
  (15, 'Trân châu đen topping', 15000, 'https://picsum.photos/seed/dodo-pearltopping/640/360', 1),
  (16, 'Combo trà sữa + bánh', 65000, 'https://picsum.photos/seed/dodo-combo1/640/360', 1),
  (17, 'Trà detox cam sả', 35000, 'https://picsum.photos/seed/dodo-detoxtea/640/360', 1),
  (18, 'Nước suối Dasani', 10000, 'https://picsum.photos/seed/dodo-water/640/360', 1),
  (19, 'Bánh tiramisu', 45000, 'https://picsum.photos/seed/dodo-tiramisu/640/360', 1),
  (20, 'Kem dừa', 25000, 'https://picsum.photos/seed/dodo-coconuticecream/640/360', 1),
  (21, 'Trà sữa chân trâu đen', 35000, 'https://picsum.photos/seed/dodo-bubbletea/640/360', 1),
  (22, 'Trà ô long kem sữa', 37000, 'https://picsum.photos/seed/dodo-oolongmilktea/640/360', 1),
  (23, 'Sữa tươi trân châu đường đen', 39000, 'https://picsum.photos/seed/dodo-freshmilkbubble/640/360', 1);

-- =============================================
-- 4. Bổ sung 20 NGUYÊN LIỆU
-- =============================================
INSERT INTO tbl_NGUYEN_LIEU (tenNguyenLieu, donViTinh, soLuongTon, nguongToiThieu, trangThai)
VALUES
  ('Cà phê bột', 'gram', 4000, 400, 1),
  ('Sữa tươi', 'ml', 20000, 2000, 1),
  ('Sữa đặc', 'gram', 5000, 500, 1),
  ('Bơ', 'gram', 3000, 200, 1),
  ('Xoài', 'gram', 4000, 400, 1),
  ('Cam tươi', 'gram', 5000, 500, 1),
  ('Táo', 'gram', 4000, 400, 1),
  ('Việt quất', 'gram', 2000, 200, 1),
  ('Dâu tây', 'gram', 3000, 300, 1),
  ('Matcha bột', 'gram', 2000, 200, 1),
  ('Caramel sauce', 'ml', 3000, 300, 1),
  ('Kem cheese', 'gram', 4000, 400, 1),
  ('Trân châu trắng', 'gram', 3500, 350, 1),
  ('Bánh flan', 'cái', 100, 10, 1),
  ('Nước cốt dừa', 'ml', 5000, 500, 1),
  ('Đường nâu', 'gram', 4000, 400, 1),
  ('Siro dâu', 'ml', 3000, 300, 1),
  ('Socola chip', 'gram', 2000, 200, 1),
  ('Kem vani', 'gram', 3000, 300, 1),
  ('Nước lọc', 'ml', 50000, 5000, 1),
  ('Trà ô long', 'gram', 4000, 400, 1),
  ('Bột béo', 'gram', 5000, 500, 1),
  ('Hương vani', 'ml', 2000, 200, 1);

-- =============================================
-- 5. Bổ sung 20 CÔNG THỨC cho các đồ uống mới
-- =============================================
-- Lưu ý: FK_DO_UONG từ 5 đến 24 (vì đã có 4 món trước đó)
-- Mỗi món tối thiểu 2-3 nguyên liệu

-- Cà phê đen (id 5)
INSERT INTO tbl_CONG_THUC (FK_DO_UONG, FK_NGUYEN_LIEU, dinhLuong)
VALUES (5, 10, 15);  -- cà phê bột

-- Cà phê sữa (id 6)
INSERT INTO tbl_CONG_THUC (FK_DO_UONG, FK_NGUYEN_LIEU, dinhLuong)
VALUES (6, 10, 15), (6, 11, 30);

-- Trà sữa hoàng kim (id 7)
INSERT INTO tbl_CONG_THUC (FK_DO_UONG, FK_NGUYEN_LIEU, dinhLuong)
VALUES (7, 1, 12), (7, 2, 25), (7, 4, 15), (7, 31, 20);  -- trà đen, bột sữa, đường, bột béo

-- Sinh tố bơ (id 8)
INSERT INTO tbl_CONG_THUC (FK_DO_UONG, FK_NGUYEN_LIEU, dinhLuong)
VALUES (8, 13, 80), (8, 11, 40), (8, 4, 15), (8, 9, 30);  -- bơ, sữa tươi, đường, đá

-- Sinh tố xoài (id 9)
INSERT INTO tbl_CONG_THUC (FK_DO_UONG, FK_NGUYEN_LIEU, dinhLuong)
VALUES (9, 14, 80), (9, 11, 40), (9, 4, 15), (9, 9, 30);

-- Nước ép cam (id 10)
INSERT INTO tbl_CONG_THUC (FK_DO_UONG, FK_NGUYEN_LIEU, dinhLuong)
VALUES (10, 15, 100), (10, 4, 10), (10, 9, 20);

-- Nước ép táo (id 11)
INSERT INTO tbl_CONG_THUC (FK_DO_UONG, FK_NGUYEN_LIEU, dinhLuong)
VALUES (11, 16, 120), (11, 4, 10);

-- Yogurt việt quất (id 12)
INSERT INTO tbl_CONG_THUC (FK_DO_UONG, FK_NGUYEN_LIEU, dinhLuong)
VALUES (12, 17, 50), (12, 11, 50), (12, 4, 10);

-- Đá xay dâu (id 13)
INSERT INTO tbl_CONG_THUC (FK_DO_UONG, FK_NGUYEN_LIEU, dinhLuong)
VALUES (13, 18, 60), (13, 26, 20), (13, 4, 15), (13, 9, 200);

-- Matcha đá xay (id 14)
INSERT INTO tbl_CONG_THUC (FK_DO_UONG, FK_NGUYEN_LIEU, dinhLuong)
VALUES (14, 19, 15), (14, 11, 50), (14, 4, 15), (14, 9, 200);

-- Hồng trà sữa (id 15)
INSERT INTO tbl_CONG_THUC (FK_DO_UONG, FK_NGUYEN_LIEU, dinhLuong)
VALUES (15, 1, 15), (15, 2, 25), (15, 4, 15);

-- Trà hoa cúc (id 16)
INSERT INTO tbl_CONG_THUC (FK_DO_UONG, FK_NGUYEN_LIEU, dinhLuong)
VALUES (16, 1, 10), (16, 4, 10);

-- Macchiato caramel (id 17)
INSERT INTO tbl_CONG_THUC (FK_DO_UONG, FK_NGUYEN_LIEU, dinhLuong)
VALUES (17, 10, 20), (17, 11, 50), (17, 20, 15), (17, 4, 10);

-- Trà sữa kem cheese (id 18)
INSERT INTO tbl_CONG_THUC (FK_DO_UONG, FK_NGUYEN_LIEU, dinhLuong)
VALUES (18, 1, 15), (18, 2, 25), (18, 21, 30), (18, 4, 15);

-- Trân châu đen topping (id 19)
INSERT INTO tbl_CONG_THUC (FK_DO_UONG, FK_NGUYEN_LIEU, dinhLuong)
VALUES (19, 3, 50), (19, 25, 20);  -- trân châu đen, đường nâu

-- Combo (id 20) giả định gồm trà sữa và bánh (chỉ tính phần bánh flan)
INSERT INTO tbl_CONG_THUC (FK_DO_UONG, FK_NGUYEN_LIEU, dinhLuong)
VALUES (20, 23, 1), (20, 1, 10), (20, 2, 20), (20, 4, 10);

-- Trà detox (id 21)
INSERT INTO tbl_CONG_THUC (FK_DO_UONG, FK_NGUYEN_LIEU, dinhLuong)
VALUES (21, 5, 20), (21, 6, 20), (21, 7, 5), (21, 4, 10);

-- Nước suối (id 22)
INSERT INTO tbl_CONG_THUC (FK_DO_UONG, FK_NGUYEN_LIEU, dinhLuong)
VALUES (22, 29, 500);

-- Bánh tiramisu (id 23) - nguyên liệu giả định
INSERT INTO tbl_CONG_THUC (FK_DO_UONG, FK_NGUYEN_LIEU, dinhLuong)
VALUES (23, 18, 30), (23, 28, 20), (23, 32, 5);

-- Kem dừa (id 24)
INSERT INTO tbl_CONG_THUC (FK_DO_UONG, FK_NGUYEN_LIEU, dinhLuong)
VALUES (24, 24, 100), (24, 28, 30), (24, 4, 15);

-- Trà sữa chân trâu đen (id 25 - dùng lại món cũ nhưng là món mới)
INSERT INTO tbl_CONG_THUC (FK_DO_UONG, FK_NGUYEN_LIEU, dinhLuong)
VALUES (25, 1, 12), (25, 2, 22), (25, 3, 35), (25, 4, 15);

-- Trà ô long kem sữa (id 26)
INSERT INTO tbl_CONG_THUC (FK_DO_UONG, FK_NGUYEN_LIEU, dinhLuong)
VALUES (26, 30, 15), (26, 11, 50), (26, 4, 15);

-- Sữa tươi trân châu đường đen (id 27)
INSERT INTO tbl_CONG_THUC (FK_DO_UONG, FK_NGUYEN_LIEU, dinhLuong)
VALUES (27, 11, 150), (27, 3, 40), (27, 25, 25);

-- =============================================
-- 6. Bổ sung 20 KHUYẾN MÃI (nhiều chương trình)
-- =============================================
INSERT INTO tbl_KHUYEN_MAI (tenKhuyenMai, phanTramGiam, tuNgay, denNgay, trangThai)
VALUES
  ('Giảm giá mùa hè', 15, '2026-04-01 00:00:00', '2026-08-31 23:59:59', 1),
  ('Ưu đãi sinh viên', 10, '2026-01-01 00:00:00', '2026-12-31 23:59:59', 1),
  ('Happy Hour 14h-17h', 20, '2026-04-01 00:00:00', '2026-04-30 23:59:59', 1),
  ('Khuyến mãi cuối tuần', 5, '2026-05-01 00:00:00', '2026-05-31 23:59:59', 1),
  ('Flash Sale 1/6', 25, '2026-06-01 00:00:00', '2026-06-01 23:59:59', 1),
  ('Combo 2 ly giảm 10%', 10, '2026-04-15 00:00:00', '2026-05-15 23:59:59', 1),
  ('Ưu đãi thành viên mới', 12, '2026-04-01 00:00:00', '2026-06-30 23:59:59', 1),
  ('Giảm giá lễ 30/4', 18, '2026-04-25 00:00:00', '2026-05-05 23:59:59', 1),
  ('Back to School', 8, '2026-08-15 00:00:00', '2026-09-15 23:59:59', 1),
  ('Sale cuối năm', 30, '2026-12-20 00:00:00', '2026-12-31 23:59:59', 1),
  ('Ngày quốc tế phụ nữ', 15, '2026-03-08 00:00:00', '2026-03-08 23:59:59', 1),
  ('Trung thu đoàn viên', 10, '2026-09-20 00:00:00', '2026-09-30 23:59:59', 1),
  ('Giáng sinh an lành', 12, '2026-12-20 00:00:00', '2026-12-25 23:59:59', 1),
  ('Valentine đôi lứa', 20, '2027-02-14 00:00:00', '2027-02-14 23:59:59', 1),
  ('Thứ 3 vui vẻ', 7, '2026-05-01 00:00:00', '2026-05-31 23:59:59', 1),
  ('Tri ân khách hàng', 15, '2026-06-01 00:00:00', '2026-06-30 23:59:59', 1),
  ('Khai trương chi nhánh mới', 22, '2026-07-01 00:00:00', '2026-07-07 23:59:59', 1),
  ('Mừng sinh nhật quán', 25, '2026-10-10 00:00:00', '2026-10-10 23:59:59', 1),
  ('Giảm giá đặc biệt', 17, '2026-11-11 00:00:00', '2026-11-11 23:59:59', 1),
  ('Ưu đãi thanh toán online', 5, '2026-04-01 00:00:00', '2026-12-31 23:59:59', 1);

-- =============================================
-- 7. Bổ sung 20 CHI TIẾT KHUYẾN MÃI (áp dụng cho đồ uống)
-- =============================================
INSERT INTO tbl_CHI_TIET_KHUYEN_MAI (FK_KHUYEN_MAI, FK_DO_UONG)
VALUES
  (2, 5),   -- KM 2 áp dụng cà phê đen
  (2, 7),   -- KM 2 áp dụng trà sữa hoàng kim
  (3, 13),  -- Happy hour đá xay dâu
  (3, 14),  -- Happy hour matcha đá xay
  (4, 8),   -- Cuối tuần sinh tố bơ
  (5, 18),  -- Flash sale trà sữa kem cheese
  (6, 1),   -- Combo 2 ly giảm 10% trà sữa trân châu
  (6, 2),   -- Combo 2 ly giảm 10% trà sữa matcha
  (7, 10),  -- Thành viên mới nước ép cam
  (8, 17),  -- Lễ 30/4 macchiato caramel
  (9, 21),  -- Back to school trà detox
  (10, 24), -- Cuối năm kem dừa
  (11, 12), -- 8/3 trà hoa cúc
  (12, 20), -- Trung thu combo
  (13, 25), -- Giáng sinh trà sữa chân trâu đen
  (14, 26), -- Valentine trà ô long kem sữa
  (15, 9),  -- Thứ 3 sinh tố xoài
  (16, 15), -- Tri ân hồng trà sữa
  (17, 22), -- Khai trương nước suối
  (18, 23), -- Sinh nhật quán bánh tiramisu
  (19, 19), -- 11/11 trân châu đen topping
  (20, 27); -- Thanh toán online sữa tươi trân châu đường đen