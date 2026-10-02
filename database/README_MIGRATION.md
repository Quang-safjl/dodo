# Migration: Thêm mức đường và mức đá

## Chạy Migration

Thực hiện lệnh sau để thêm 2 cột vào database:

```bash
mysql -u root -p do_do_tea_shop < database/migration_add_sugar_ice_levels.sql
```

**Hoặc nếu MySQL không yêu cầu password:**

```bash
mysql -u root do_do_tea_shop < database/migration_add_sugar_ice_levels.sql
```

## Gì đã thay đổi

- Thêm cột `mucDuong` (mức đường: 50%, 70%, 100%) vào `tbl_CHI_TIET_DON_HANG`
- Thêm cột `mucDa` (mức đá: 50%, 70%, 100%) vào `tbl_CHI_TIET_DON_HANG`
- Giá trị mặc định là "100%" cho cả hai

## Kiểm tra thành công

Sau khi chạy, kiểm tra cấu trúc bảng:

```bash
mysql -u root -p do_do_tea_shop -e "DESC tbl_CHI_TIET_DON_HANG;"
```

Bạn sẽ thấy 2 cột mới: `mucDuong` và `mucDa`
