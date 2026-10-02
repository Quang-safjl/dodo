-- Migration: Add sugar and ice level columns to order items
USE do_do_tea_shop;

ALTER TABLE tbl_CHI_TIET_DON_HANG
ADD COLUMN mucDuong VARCHAR(50) DEFAULT '100%' COMMENT 'Sugar level: 50%, 70%, 100%' AFTER ghiChu,
ADD COLUMN mucDa VARCHAR(50) DEFAULT '100%' COMMENT 'Ice level: 50%, 70%, 100%' AFTER mucDuong;
