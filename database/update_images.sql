USE do_do_tea_shop;

-- Set demo images for existing seed drinks (ids 1..4)
UPDATE tbl_DO_UONG SET hinhAnhUrl = 'https://picsum.photos/seed/dodo-milktea/640/360' WHERE PK_DO_UONG = 1;
UPDATE tbl_DO_UONG SET hinhAnhUrl = 'https://picsum.photos/seed/dodo-matcha/640/360' WHERE PK_DO_UONG = 2;
UPDATE tbl_DO_UONG SET hinhAnhUrl = 'https://picsum.photos/seed/dodo-peachtea/640/360' WHERE PK_DO_UONG = 3;
UPDATE tbl_DO_UONG SET hinhAnhUrl = 'https://picsum.photos/seed/dodo-choco/640/360' WHERE PK_DO_UONG = 4;

