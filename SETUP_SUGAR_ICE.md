# Hướng dẫn: Tính năng Mức Đường, Mức Đá & Kiểm tra Nguyên Liệu

## 1. Chạy Migration Database

Thêm 2 cột `mucDuong` và `mucDa` vào bảng `tbl_CHI_TIET_DON_HANG`:

```bash
mysql -u root do_do_tea_shop < database/migration_add_sugar_ice_levels.sql
```

Kiểm tra:
```bash
mysql -u root do_do_tea_shop -e "DESC tbl_CHI_TIET_DON_HANG;" | grep -E "mucDuong|mucDa"
```

## 2. Cấu hình Sugar & Ice IDs

Trong `server/src/controllers/orderController.js`, các ID được cố định:
- **Sugar (Đường)**: ID = 4
- **Ice (Đá)**: ID = 9

Nếu database của bạn khác, hãy cập nhật các ID này trong:
- Hàm `createOrder()` (dòng ~175)
- Hàm `checkIngredients()` (dòng ~394-395)
- Hàm `completeOrder()` (dòng ~158-159)

Cách tìm ID:
```bash
mysql -u root do_do_tea_shop -e "SELECT PK_NGUYEN_LIEU, tenNguyenLieu FROM tbl_NGUYEN_LIEU WHERE tenNguyenLieu IN ('Đường', 'Đá');"
```

## 3. Khởi động Server

```bash
cd server && npm start
```

## 4. Khởi động Client

```bash
cd client && npm start
```

## 5. Kiểm tra Tính Năng

### Khi click vào sản phẩm:
- Popup hiển thị: ảnh, tên sản phẩm, giá tiền
- Có input chọn **Số lượng** (mặc định 1)
- Có input chọn **Mức đường** (50%, 70%, 100%)
- Có input chọn **Mức đá** (50%, 70%, 100%)
- Có input chọn **Ghi chú**

### Kiểm tra Nguyên Liệu Tự động:
- Khi thay đổi số lượng → kiểm tra nguyên liệu
- Khi thay đổi mức đường → kiểm tra nguyên liệu
- Khi thay đổi mức đá → kiểm tra nguyên liệu

### Cảnh báo Thiếu Nguyên Liệu:
- Nếu thiếu, popup mở rộng hiển thị:
  - Tên nguyên liệu thiếu
  - Lượng cần (tính theo %)
  - Lượng có trong kho
  - Lượng thiếu
- Nút "Thêm vào giỏ" bị disable (xám ra)
- Không thể thêm khi thiếu nguyên liệu

### Thêm Vào Giỏ:
- Nếu đủ nguyên liệu → thêm thành công
- Giỏ hiển thị: mức đường, mức đá trong cột "Món"
- Nếu thêm cùng sản phẩm nhưng cấu hình khác → item riêng biệt

## 6. Tính Toán Nguyên Liệu

Ví dụ: Trà sữa bình thường (recipe: 15g đường, 30g đá)

- **100% đường + 100% đá**: Cần 15g đường, 30g đá
- **50% đường + 100% đá**: Cần 7.5g đường, 30g đá
- **70% đường + 50% đá**: Cần 10.5g đường, 15g đá

Nếu số lượng = 2:
- **100% đường + 100% đá (x2)**: Cần 30g đường, 60g đá
- **50% đường + 50% đá (x2)**: Cần 15g đường, 30g đá

## 7. Lưu Dữ Liệu

Khi tạo đơn hàng, dữ liệu được lưu:
- `mucDuong`: Mức đường đã chọn
- `mucDa`: Mức đá đã chọn
- `ghiChu`: Ghi chú từ người dùng
- `soLuong`: Số lượng chính xác

Khi hoàn thành đơn hàng (thanh toán), hệ thống:
- Tính lượng nguyên liệu cần (áp dụng %)
- Kiểm tra kho
- Trừ kho đúng theo %

## Lỗi Thường Gặp

**"API không tìm thấy endpoint"**
- Kiểm tra server đã restart chưa
- Kiểm tra orderRoutes.js có import `checkIngredients` không

**"Nguyên liệu ID không đúng"**
- Update SUGAR_ID (4) và ICE_ID (9) nếu database khác
- Kiểm tra tên nguyên liệu trong database: `SELECT * FROM tbl_NGUYEN_LIEU;`

**"Popup không check nguyên liệu"**
- Mở DevTools (F12) → Network tab
- Bấm vào sản phẩm, kiểm tra request POST `/orders/check-ingredients`
- Nếu error, kiểm tra log server
