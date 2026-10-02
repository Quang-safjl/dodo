import { useEffect, useState, useCallback, useRef } from "react";
import {
  Button,
  Card,
  DatePicker,
  Input,
  Modal,
  Space,
  Table,
  Tag,
  Typography,
  message,
  Tooltip,
  Descriptions,
  Divider,
  Spin,
} from "antd";
import { ReloadOutlined, SearchOutlined, EyeOutlined, PrinterOutlined } from "@ant-design/icons";
import { api } from "../services/api";
import dayjs from "dayjs";
import { useMediaQuery } from "../hooks/useMediaQuery"; // + thêm
import { useTranslation } from "react-i18next";

const { RangePicker } = DatePicker;

function formatMoney(v) {
  return new Intl.NumberFormat("vi-VN").format(v || 0) + " ₫";
}

export default function ReceiptHistoryPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [receipts, setReceipts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchSupplier, setSearchSupplier] = useState("");
  const [dateRange, setDateRange] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailItems, setDetailItems] = useState([]);
  const isMobile = useMediaQuery("(max-width: 768px)"); // + thêm

  const debounceTimer = useRef(null);

  // Hàm tải dữ liệu
  const loadReceipts = useCallback(async (resetPage = true) => {
    if (resetPage) setPage(1);
    setLoading(true);
    try {
      const params = {
        page: resetPage ? 1 : page,
        limit: pageSize,
      };
      if (searchSupplier) params.supplier = searchSupplier;
      if (dateRange && dateRange[0] && dateRange[1]) {
        params.from = dateRange[0].startOf("day").toISOString();
        params.to = dateRange[1].endOf("day").toISOString();
      }
      const res = await api.get("/receipts", { params });
      setReceipts(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      message.error(err?.response?.data?.message || t("receiptHistory.loadListFailed", { defaultValue: "Không tải được lịch sử nhập kho" }));
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, searchSupplier, dateRange]);

  // Debounce cho searchSupplier và dateRange
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      loadReceipts(true);
    }, 500);
    return () => clearTimeout(debounceTimer.current);
  }, [searchSupplier, dateRange, loadReceipts]);

  // Khi pageSize thay đổi
  useEffect(() => {
    loadReceipts(true);
  }, [pageSize]);

  // Khi page thay đổi (phân trang)
  useEffect(() => {
    if (page !== 1) loadReceipts(false);
  }, [page]);

  const handleTableChange = (pagination) => {
    setPage(pagination.current);
    setPageSize(pagination.pageSize);
  };

  async function viewDetail(record) {
    setSelectedReceipt(record);
    setDetailVisible(true);
    setDetailLoading(true);
    try {
      const res = await api.get(`/receipts/${record.id}`);
      setDetailItems(res.data.items || []);
    } catch (err) {
      message.error(err?.response?.data?.message || t("receiptHistory.loadDetailFailed", { defaultValue: "Không tải được chi tiết phiếu" }));
      setDetailItems([]);
    } finally {
      setDetailLoading(false);
    }
  }

  const printReceipt = () => {
    if (!selectedReceipt) return;
    const printWindow = window.open("", "_blank");
    const html = `
      <html>
        <head><title>Phiếu nhập #${selectedReceipt.id}</title></head>
        <body style="font-family: sans-serif; padding: 20px;">
          <h2>Đô Đô Tea - Phiếu nhập kho</h2>
          <p><strong>Mã phiếu:</strong> ${selectedReceipt.id}</p>
          <p><strong>Ngày nhập:</strong> ${dayjs(selectedReceipt.createdAt).format("DD/MM/YYYY HH:mm")}</p>
          <p><strong>Nhà cung cấp:</strong> ${selectedReceipt.supplier || "—"}</p>
          <p><strong>Nhân viên nhập:</strong> ${selectedReceipt.staffName || "—"}</p>
          <p><strong>Ghi chú:</strong> ${selectedReceipt.note || "—"}</p>
          <hr/>
          <table border="1" cellpadding="5" cellspacing="0" style="width:100%; border-collapse: collapse;">
            <thead>
              <tr><th>Nguyên liệu</th><th>ĐVT</th><th>Số lượng</th><th>Đơn giá</th><th>Thành tiền</th></tr>
            </thead>
            <tbody>
              ${detailItems
                .map(
                  (item) => `
                <tr>
                  <td>${item.ingredientName}</td>
                  <td>${item.unit}</td>
                  <td>${item.quantity}</td>
                  <td>${formatMoney(item.unitPrice)}</td>
                  <td>${formatMoney(item.amount)}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
          <hr/>
          <p><strong>Tổng tiền:</strong> ${formatMoney(selectedReceipt.totalAmount)}</p>
          <p style="text-align:center; margin-top:30px;">Cảm ơn!</p>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  };

  const clearFilters = () => {
    setSearchSupplier("");
    setDateRange(null);
    // loadReceipts sẽ được trigger bởi useEffect khi searchSupplier hoặc dateRange thay đổi
  };

  // Cột cho bảng (desktop)
  const columns = [
    {
      title: t("receiptHistory.receiptId"),
      dataIndex: "id",
      width: 100,
      render: (id) => <Tag color="blue">#{id}</Tag>,
    },
    {
      title: t("receiptHistory.importDate"),
      dataIndex: "createdAt",
      width: 180,
      render: (v) => dayjs(v).format("DD/MM/YYYY HH:mm"),
      sorter: (a, b) => dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix(),
      defaultSortOrder: "descend",
    },
    {
      title: t("receiptHistory.supplier"),
      dataIndex: "supplier",
      width: 200,
      render: (v) => v || "—",
    },
    {
      title: t("receiptHistory.staff"),
      dataIndex: "staffName",
      width: 180,
    },
    {
      title: t("receiptHistory.totalAmount"),
      dataIndex: "totalAmount",
      width: 150,
      align: "right",
      render: (v) => formatMoney(v),
      sorter: (a, b) => a.totalAmount - b.totalAmount,
    },
    {
      title: t("receiptHistory.note"),
      dataIndex: "note",
      ellipsis: true,
      render: (v) => v || "—",
    },
    {
      title: t("receiptHistory.actions"),
      key: "action",
      width: 100,
      fixed: "right",
      render: (_, record) => (
        <Tooltip title={t("common.detail")}>
          <Button type="link" icon={<EyeOutlined />} onClick={() => viewDetail(record)} />
        </Tooltip>
      ),
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          ...(isMobile && { flexDirection: "column", gap: 12, alignItems: "flex-start" }), // + thêm
        }}
      >
        <Typography.Title level={4} style={{ margin: 0, color: "#3d2914" }}>
          {t("receiptHistory.title")}
        </Typography.Title>
        <Button icon={<ReloadOutlined />} onClick={() => loadReceipts(true)}>
          {t("common.refresh")}
        </Button>
      </div>

      {/* Filter bar */}
      <Card size="small">
        <Space
          wrap
          style={{ width: "100%" }}
          direction={isMobile ? "vertical" : "horizontal"} // + thêm
        >
          <Input
            placeholder={t("receiptHistory.searchSupplier")}
            prefix={<SearchOutlined />}
            value={searchSupplier}
            onChange={(e) => setSearchSupplier(e.target.value)}
            style={{ width: isMobile ? "100%" : 250 }} // + sửa
            allowClear
          />
          <RangePicker
            value={dateRange}
            onChange={setDateRange}
            placeholder={t("receiptHistory.dateRange")}
            style={{ width: isMobile ? "100%" : undefined }} // + thêm
          />
          {(searchSupplier || dateRange) && (
            <Button onClick={clearFilters}>{t("common.clearFilters")}</Button>
          )}
        </Space>
      </Card>

      {/* Desktop: Bảng */}
      {!isMobile && (
        <Table
          rowKey="id"
          loading={loading}
          dataSource={receipts}
          columns={columns}
          pagination={{
            current: page,
            pageSize: pageSize,
            total: total,
            showSizeChanger: true,
            showTotal: (t) => `Tổng ${t} phiếu`,
          }}
          onChange={handleTableChange}
          scroll={{ x: 1000 }}
        />
      )}

      {/* Mobile: Danh sách thẻ */}
      {isMobile && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {receipts.map((receipt) => (
            <Card key={receipt.id} size="small" style={{ borderRadius: 12 }} bodyStyle={{ padding: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <Tag color="blue">#{receipt.id}</Tag>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  {dayjs(receipt.createdAt).format("DD/MM/YYYY HH:mm")}
                </Typography.Text>
              </div>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "8px 16px",
                  marginBottom: 12,
                  fontSize: 13,
                }}
              >
                <div>
                  <span style={{ color: "#888" }}>{t("receiptHistory.supplier")}:</span> {receipt.supplier || "—"}
                </div>
                <div>
                  <span style={{ color: "#888" }}>{t("receiptHistory.staff")}:</span> {receipt.staffName || "—"}
                </div>
                <div>
                  <span style={{ color: "#888" }}>{t("receiptHistory.totalAmount")}:</span> {formatMoney(receipt.totalAmount)}
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <Button size="small" icon={<EyeOutlined />} onClick={() => viewDetail(receipt)}>
                  {t("common.detail")}
                </Button>
              </div>
            </Card>
          ))}
          {receipts.length === 0 && !loading && (
            <div style={{ textAlign: "center", padding: 32, color: "#999" }}>
              Không có phiếu nhập nào
            </div>
          )}
        </div>
      )}

      {/* Modal chi tiết */}
      <Modal
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[
          <Button key="print" icon={<PrinterOutlined />} onClick={printReceipt}>
            {t("receiptHistory.printReceipt")}
          </Button>,
          <Button key="close" onClick={() => setDetailVisible(false)}>
            {t("common.close")}
          </Button>,
        ]}
        title={t("receiptHistory.detailTitle", { id: selectedReceipt?.id || "" })}
        width={isMobile ? "95%" : 800} // + điều chỉnh width trên mobile
      >
        <Spin spinning={detailLoading}>
          {selectedReceipt && (
            <>
              <Descriptions column={isMobile ? 1 : 2} bordered size="small"> {/* + điều chỉnh cột trên mobile */}
                <Descriptions.Item label={t("receiptHistory.receiptId")}>#{selectedReceipt.id}</Descriptions.Item>
                <Descriptions.Item label={t("receiptHistory.importDate")}>
                  {dayjs(selectedReceipt.createdAt).format("DD/MM/YYYY HH:mm")}
                </Descriptions.Item>
                <Descriptions.Item label={t("receiptHistory.supplier")}>
                  {selectedReceipt.supplier || "—"}
                </Descriptions.Item>
                <Descriptions.Item label={t("receiptHistory.staff")}>
                  {selectedReceipt.staffName || "—"}
                </Descriptions.Item>
                <Descriptions.Item label={t("receiptHistory.note")} span={2}>
                  {selectedReceipt.note || "—"}
                </Descriptions.Item>
              </Descriptions>
              <Divider orientation="left">{t("receiptHistory.items")}</Divider>
              <Table
                rowKey="ingredientId"
                dataSource={detailItems}
                pagination={false}
                size="small"
                columns={[
                  { title: t("receiptHistory.ingredient", { defaultValue: "Nguyên liệu" }), dataIndex: "ingredientName" },
                  { title: t("inventory.unit"), dataIndex: "unit", width: 80 },
                  { title: t("receipt.quantity"), dataIndex: "quantity", align: "right" },
                  { title: t("receipt.unitPrice"), dataIndex: "unitPrice", align: "right", render: (v) => formatMoney(v) },
                  { title: t("receipt.amount"), dataIndex: "amount", align: "right", render: (v) => formatMoney(v) },
                ]}
                summary={() => (
                  <Table.Summary fixed>
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} colSpan={4}>
                        <strong>{t("common.total")}</strong>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell align="right">
                        <strong>{formatMoney(selectedReceipt.totalAmount)}</strong>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  </Table.Summary>
                )}
              />
            </>
          )}
        </Spin>
      </Modal>
    </div>
  );
}