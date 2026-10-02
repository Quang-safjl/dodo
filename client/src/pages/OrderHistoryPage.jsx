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
  Select,
  Badge,
  Radio,
  InputNumber,
} from "antd";
import { ReloadOutlined, SearchOutlined, EyeOutlined, PrinterOutlined } from "@ant-design/icons";
import { api } from "../services/api";
import dayjs from "dayjs";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { useTranslation } from "react-i18next";

const { RangePicker } = DatePicker;
const { Option } = Select;

function formatMoney(v) {
  return new Intl.NumberFormat("vi-VN").format(v || 0) + " ₫";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

const getStatusConfig = (t) => ({
  CHO_THANH_TOAN: { label: t("orderHistory.status.CHO_THANH_TOAN"), color: "orange" },
  HOAN_THANH: { label: t("orderHistory.status.HOAN_THANH"), color: "green" },
  HUY: { label: t("orderHistory.status.HUY"), color: "red" },
});

export default function OrderHistoryPage() {
  const { t } = useTranslation();
  const statusConfig = getStatusConfig(t);
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState(null);
  const [dateRange, setDateRange] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailOrder, setDetailOrder] = useState(null);
  const [payVisible, setPayVisible] = useState(false);
  const [payingOrder, setPayingOrder] = useState(null);
  const [payMethod, setPayMethod] = useState("TIEN_MAT");
  const [customerPaid, setCustomerPaid] = useState(0);
  const [orderNote, setOrderNote] = useState("");
  const [paymentLoading, setPaymentLoading] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");

  // Refs để luôn lấy giá trị mới nhất trong fetchOrders
  const pageRef = useRef(page);
  const pageSizeRef = useRef(pageSize);
  const searchRef = useRef(searchText);
  const statusRef = useRef(statusFilter);
  const dateRangeRef = useRef(dateRange);

  useEffect(() => {
    pageRef.current = page;
  }, [page]);
  useEffect(() => {
    pageSizeRef.current = pageSize;
  }, [pageSize]);
  useEffect(() => {
    searchRef.current = searchText;
  }, [searchText]);
  useEffect(() => {
    statusRef.current = statusFilter;
  }, [statusFilter]);
  useEffect(() => {
    dateRangeRef.current = dateRange;
  }, [dateRange]);

  // Hàm gọi API, dùng ref để tránh stale closure
  const fetchOrders = useCallback(async (resetPage = false) => {
    // Xác định page hiện tại
    let currentPage = resetPage ? 1 : pageRef.current;
    if (resetPage && pageRef.current !== 1) {
      setPage(1); // đồng bộ state page
    }
    const currentLimit = pageSizeRef.current;
    const currentSearch = searchRef.current;
    const currentStatus = statusRef.current;
    const currentDateRange = dateRangeRef.current;

    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: currentLimit,
      };
      if (currentSearch) params.search = currentSearch;
      if (currentStatus) params.status = currentStatus;
      if (currentDateRange && currentDateRange[0] && currentDateRange[1]) {
        params.from = currentDateRange[0].startOf("day").toISOString();
        params.to = currentDateRange[1].endOf("day").toISOString();
      }
      const res = await api.get("/orders", { params });
      setOrders(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      message.error(err?.response?.data?.message || t("orderHistory.loadListFailed", { defaultValue: "Không tải được danh sách đơn hàng" }));
    } finally {
      setLoading(false);
    }
  }, []);

  // Effect cho filter (search, status, date): debounce và reset về trang 1
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOrders(true);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchText, statusFilter, dateRange, fetchOrders]);

  // Effect cho phân trang: khi page hoặc pageSize thay đổi (không reset)
  useEffect(() => {
    // Tránh gọi lúc khởi tạo (vì filter effect cũng sẽ gọi lần đầu)
    if (page === 1 && total === 0 && orders.length === 0) return;
    fetchOrders(false);
  }, [page, pageSize, fetchOrders]);

  // Khi pageSize thay đổi, buộc reset về trang 1
  useEffect(() => {
    setPage(1);
  }, [pageSize]);

  const handleTableChange = (pagination) => {
    setPage(pagination.current);
    setPageSize(pagination.pageSize);
  };

  const viewDetail = async (record) => {
    setSelectedOrder(record);
    setDetailVisible(true);
    setDetailLoading(true);
    try {
      const res = await api.get(`/orders/${record.id}`);
      setDetailOrder(res.data);
    } catch (err) {
      message.error(err?.response?.data?.message || t("orderHistory.loadDetailFailed", { defaultValue: "Không tải được chi tiết đơn hàng" }));
      setDetailOrder(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const openPaymentModal = (record) => {
    setPayingOrder(record);
    setPayMethod("TIEN_MAT");
    setCustomerPaid(Number(record.totalAmount || 0));
    setOrderNote(record.note || detailOrder?.note || "");
    setPayVisible(true);
  };

  const submitPayment = async () => {
    if (!payingOrder?.id) return;
    setPaymentLoading(true);
    try {
      await api.put(`/orders/${payingOrder.id}/complete`, {
        method: payMethod,
        customerPaid: payMethod === "TIEN_MAT" ? Number(customerPaid || 0) : undefined,
        note: orderNote,
      });
      message.success(t("orderHistory.paymentSuccess", { id: payingOrder.id }));
      setPayVisible(false);
      setPayingOrder(null);
      fetchOrders(true);
      if (detailVisible && selectedOrder?.id === payingOrder.id) {
        const res = await api.get(`/orders/${payingOrder.id}`);
        setDetailOrder(res.data);
      }
    } catch (err) {
      message.error(err?.response?.data?.message || t("orderHistory.paymentFailed", { defaultValue: "Thanh toán thất bại" }));
    } finally {
      setPaymentLoading(false);
    }
  };

  const printOrder = () => {
    if (!detailOrder) return;
    const printWindow = window.open("", "_blank");
    const invoiceHtml = `
      <div class="receipt">
        <div class="receipt__brand">
          <h3 class="receipt__title">Đô Đô Tea</h3>
          <div class="receipt__sub">Hóa đơn thanh toán</div>
        </div>
        <div class="receipt__meta">
          <div>Mã HĐ: #${detailOrder.id}</div>
          <div>${dayjs(detailOrder.completedAt || detailOrder.createdAt).format("DD/MM/YYYY HH:mm")}</div>
          <div>Nhân viên: ${escapeHtml(detailOrder.staffName || "—")}</div>
        </div>
        ${detailOrder.note ? `<div class="receipt__note"><strong>Ghi chú đơn:</strong> ${escapeHtml(detailOrder.note)}</div>` : ""}
        <hr class="receipt__divider" />
        <table class="receipt__table">
          <thead>
            <tr>
              <th align="left">Món</th>
              <th align="right">SL</th>
              <th align="right">Tiền</th>
            </tr>
          </thead>
          <tbody>
            ${(detailOrder.items || [])
              .map(
                (item) => `
              <tr>
                <td>${escapeHtml(item.drinkName || "")}</td>
                <td align="right">${item.quantity}</td>
                <td align="right">${formatMoney(item.total)}</td>
              </tr>
              <tr>
                <td colspan="3" class="receipt__item-detail">
                  ${item.mucDuong ? `<div>Đường: ${escapeHtml(item.mucDuong)}</div>` : ""}
                  ${item.mucDa ? `<div>Đá: ${escapeHtml(item.mucDa)}</div>` : ""}
                  ${item.note ? `<div>Ghi chú: ${escapeHtml(item.note)}</div>` : ""}
                </td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
        <hr class="receipt__divider" />
        <div class="receipt__total"><span>Tổng cộng</span><span>${formatMoney(detailOrder.totalAmount)}</span></div>
        ${
          detailOrder.invoice
            ? `
              <div class="receipt__method">PTTT: ${detailOrder.invoice.method === "TIEN_MAT" ? "Tiền mặt" : "Chuyển khoản"}</div>
              <div class="receipt__method">Tiền khách đưa: ${formatMoney(detailOrder.invoice.customerPaid)}</div>
              <div class="receipt__method">Tiền thừa: ${formatMoney(detailOrder.invoice.change)}</div>
            `
            : ""
        }
        <p class="receipt__footer">Cảm ơn quý khách và hẹn gặp lại!</p>
      </div>
    `;
    const html = `
      <html>
        <head>
          <title>Hóa đơn</title>
          <style>
            @page { size: 80mm auto; margin: 6mm; }
            body { margin: 0; background: #f5f5f5; font-family: "Segoe UI", Arial, sans-serif; color: #1f1f1f; }
            .receipt {
              width: 100%;
              max-width: 340px;
              margin: 0 auto;
              background: #fff;
              border: 1px solid #eaeaea;
              border-radius: 10px;
              padding: 14px 12px;
              box-sizing: border-box;
            }
            .receipt__brand { text-align: center; margin-bottom: 8px; }
            .receipt__title { margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 0.5px; }
            .receipt__sub { font-size: 12px; color: #8c8c8c; margin-top: 2px; }
            .receipt__meta { font-size: 12px; line-height: 1.5; }
            .receipt__note {
              margin-top: 8px;
              padding: 8px;
              border-radius: 8px;
              background: #f7f7f7;
              border: 1px dashed #d9d9d9;
              font-size: 12px;
              line-height: 1.45;
              white-space: pre-wrap;
            }
            .receipt__divider { border: 0; border-top: 1px dashed #cfcfcf; margin: 10px 0; }
            .receipt__table { width: 100%; border-collapse: collapse; font-size: 12px; }
            .receipt__table th { font-weight: 700; color: #595959; padding-bottom: 6px; }
            .receipt__table td { padding: 4px 0; vertical-align: top; }
            .receipt__item-detail { margin-left: 8px; color: #666; font-size: 11px; line-height: 1.4; }
            .receipt__total {
              display: flex;
              justify-content: space-between;
              font-size: 16px;
              font-weight: 800;
              margin-top: 2px;
            }
            .receipt__method { margin-top: 6px; font-size: 12px; color: #555; }
            .receipt__footer { text-align: center; margin-top: 12px; color: #8c8c8c; font-size: 12px; }
            @media print {
              body { background: #fff; }
              .receipt { border: 0; border-radius: 0; padding: 0; max-width: none; }
            }
          </style>
        </head>
        <body>
          ${invoiceHtml}
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  };

  // Cột cho bảng desktop
  const columns = [
    {
      title: t("orderHistory.orderId"),
      dataIndex: "id",
      width: 100,
      render: (id) => <Tag color="blue">#{id}</Tag>,
    },
    {
      title: t("orderHistory.createdAt"),
      dataIndex: "createdAt",
      width: 180,
      render: (v) => dayjs(v).format("DD/MM/YYYY HH:mm"),
      sorter: (a, b) => dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix(),
      defaultSortOrder: "descend",
    },
    {
      title: t("orderHistory.staff"),
      dataIndex: "staffName",
      width: 150,
    },
    {
      title: t("orderHistory.filterByStatus"),
      dataIndex: "status",
      width: 140,
      render: (status) => {
        const cfg = statusConfig[status];
        return <Badge color={cfg?.color} text={cfg?.label || status} />;
      },
    },
    {
      title: t("orderHistory.totalAmount"),
      dataIndex: "totalAmount",
      width: 150,
      align: "right",
      render: (v) => formatMoney(v),
      sorter: (a, b) => a.totalAmount - b.totalAmount,
    },
    {
      title: t("orderHistory.actions"),
      key: "action",
      width: 150,
      fixed: "right",
      render: (_, record) => (
        <Space>
          <Tooltip title={t("orderHistory.viewDetail")}>
            <Button type="link" icon={<EyeOutlined />} onClick={() => viewDetail(record)} />
          </Tooltip>
          {record.status === "CHO_THANH_TOAN" && (
            <Tooltip title={t("orderHistory.confirmPayment")}>
              <Button
                type="link"
                style={{ color: "#52c41a" }}
                  onClick={() => openPaymentModal(record)}
              >
                {t("orderHistory.confirmPayment")}
              </Button>
            </Tooltip>
          )}
        </Space>
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
          ...(isMobile && { flexDirection: "column", gap: 12, alignItems: "flex-start" }),
        }}
      >
        <Typography.Title level={4} style={{ margin: 0, color: "#3d2914" }}>
          {t("orderHistory.title")}
        </Typography.Title>
        <Button icon={<ReloadOutlined />} onClick={() => fetchOrders(true)}>
          {t("common.refresh")}
        </Button>
      </div>

      {/* Filter bar */}
      <Card size="small">
        <Space wrap style={{ ...(isMobile && { display: "flex", flexDirection: "column", width: "100%" }) }}>
          <Input
            placeholder={t("orderHistory.searchPlaceholder")}
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: isMobile ? "100%" : 280 }}
            allowClear
          />
          <Select
            placeholder={t("orderHistory.filterByStatus")}
            allowClear
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: isMobile ? "100%" : 160 }}
          >
            <Option value="CHO_THANH_TOAN">{t("orderHistory.status.CHO_THANH_TOAN")}</Option>
            <Option value="HOAN_THANH">{t("orderHistory.status.HOAN_THANH")}</Option>
            <Option value="HUY">{t("orderHistory.status.HUY")}</Option>
          </Select>
          <RangePicker
            value={dateRange}
            onChange={setDateRange}
            placeholder={t("orderHistory.dateRange")}
            style={{ width: isMobile ? "100%" : undefined }}
          />
          {(searchText || statusFilter || dateRange) && (
            <Button
              onClick={() => {
                setSearchText("");
                setStatusFilter(null);
                setDateRange(null);
              }}
            >
              {t("common.clearFilters")}
            </Button>
          )}
        </Space>
      </Card>

      {/* Desktop: Bảng */}
      {!isMobile && (
        <Table
          rowKey="id"
          loading={loading}
          dataSource={orders}
          columns={columns}
          pagination={{
            current: page,
            pageSize: pageSize,
            total: total,
            showSizeChanger: true,
            showTotal: (t) => `Tổng ${t} đơn`,
          }}
          onChange={handleTableChange}
          scroll={{ x: 1000 }}
        />
      )}

      {/* Mobile: Danh sách thẻ */}
      {isMobile && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {orders.map((order) => (
            <Card key={order.id} size="small" style={{ borderRadius: 12 }} bodyStyle={{ padding: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div>
                  <Tag color="blue">#{order.id}</Tag>
                  <Typography.Text strong style={{ marginLeft: 8 }}>
                    {dayjs(order.createdAt).format("DD/MM/YYYY HH:mm")}
                  </Typography.Text>
                </div>
                <Badge color={statusConfig[order.status]?.color} text={statusConfig[order.status]?.label} />
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
                  <span style={{ color: "#888" }}>{t("orderHistory.staff")}:</span> {order.staffName || "—"}
                </div>
                <div>
                  <span style={{ color: "#888" }}>{t("orderHistory.totalAmount")}:</span> {formatMoney(order.totalAmount)}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <Button size="small" icon={<EyeOutlined />} onClick={() => viewDetail(order)}>
                  {t("common.detail")}
                </Button>
                {order.status === "CHO_THANH_TOAN" && (
                  <Button size="small" type="primary" danger onClick={() => openPaymentModal(order)}>
                    {t("orderHistory.confirmPayment")}
                  </Button>
                )}
              </div>
            </Card>
          ))}
          {orders.length === 0 && !loading && (
            <div style={{ textAlign: "center", padding: 32, color: "#999" }}>
              {t("common.noData")}
            </div>
          )}
        </div>
      )}

      {/* Modal chi tiết đơn hàng */}
      <Modal
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[
          <Button key="print" icon={<PrinterOutlined />} onClick={printOrder}>
            {t("orderHistory.printOrder")}
          </Button>,
          <Button key="close" onClick={() => setDetailVisible(false)}>
            {t("common.close")}
          </Button>,
        ]}
        title={t("orderHistory.detailTitle", { id: selectedOrder?.id || "" })}
        width={isMobile ? "95%" : 800}
      >
        <Spin spinning={detailLoading}>
          {detailOrder && (
            <>
              <Descriptions column={isMobile ? 1 : 2} bordered size="small">
                <Descriptions.Item label={t("orderHistory.orderId")}>#{detailOrder.id}</Descriptions.Item>
                <Descriptions.Item label={t("orderHistory.createdAt")}>
                  {dayjs(detailOrder.createdAt).format("DD/MM/YYYY HH:mm")}
                </Descriptions.Item>
                <Descriptions.Item label={t("orderHistory.staff")}>{detailOrder.staffName || "—"}</Descriptions.Item>
                <Descriptions.Item label={t("common.status")}>
                  <Badge
                    color={statusConfig[detailOrder.status]?.color}
                    text={statusConfig[detailOrder.status]?.label}
                  />
                </Descriptions.Item>
                <Descriptions.Item label={t("orderHistory.originalTotal")} span={2}>
                  {formatMoney(detailOrder.originalTotal)}
                </Descriptions.Item>
                <Descriptions.Item label={t("orderHistory.discount")}>{formatMoney(detailOrder.discount)}</Descriptions.Item>
                <Descriptions.Item label={t("orderHistory.finalTotal")}>{formatMoney(detailOrder.totalAmount)}</Descriptions.Item>
                {detailOrder.invoice && (
                  <>
                    <Descriptions.Item label={t("orderHistory.paymentMethod")}>
                      {detailOrder.invoice.method === "TIEN_MAT" ? t("pos.cash") : t("pos.bankTransfer")}
                    </Descriptions.Item>
                    <Descriptions.Item label={t("orderHistory.customerPaid")}>
                      {formatMoney(detailOrder.invoice.customerPaid)}
                    </Descriptions.Item>
                    <Descriptions.Item label={t("orderHistory.change")}>
                      {formatMoney(detailOrder.invoice.change)}
                    </Descriptions.Item>
                  </>
                )}
                <Descriptions.Item label={t("orderHistory.note")} span={2}>
                  {detailOrder.note || "—"}
                </Descriptions.Item>
              </Descriptions>
              <Divider orientation="left">{t("orderHistory.items")}</Divider>
              <Table
                rowKey="drinkId"
                dataSource={detailOrder.items}
                pagination={false}
                size="small"
                columns={[
                  { title: t("orderHistory.product"), dataIndex: "drinkName" },
                  { title: t("orderHistory.note"), dataIndex: "note", render: (v) => v || "—" },
                  {
                    title: t("pos.sugarLevel"),
                    dataIndex: "mucDuong",
                    width: 120,
                    render: (v) => v || "100%",
                  },
                  {
                    title: t("pos.iceLevel"),
                    dataIndex: "mucDa",
                    width: 120,
                    render: (v) => v || "100%",
                  },
                  { title: t("orderHistory.quantity"), dataIndex: "quantity", align: "right" },
                  { title: t("orderHistory.unitPrice"), dataIndex: "unitPrice", align: "right", render: (v) => formatMoney(v) },
                  { title: t("orderHistory.lineTotal"), dataIndex: "total", align: "right", render: (v) => formatMoney(v) },
                ]}
                scroll={{ x: 900 }}
              />
            </>
          )}
        </Spin>
      </Modal>

      <Modal
        open={payVisible}
        onCancel={() => {
          setPayVisible(false);
          setPayingOrder(null);
        }}
        onOk={submitPayment}
        okText={t("common.confirm")}
        cancelText={t("common.cancel")}
        title={t("orderHistory.confirmPaymentTitle")}
        confirmLoading={paymentLoading}
      >
        <Space direction="vertical" style={{ width: "100%" }}>
          <div>
            <Typography.Text strong>{t("pos.orderNote")}</Typography.Text>
            <Input.TextArea
              value={orderNote}
              onChange={(e) => setOrderNote(e.target.value)}
              rows={2}
              placeholder={t("pos.orderNotePlaceholder")}
              maxLength={500}
              showCount
            />
          </div>
          <Radio.Group value={payMethod} onChange={(e) => setPayMethod(e.target.value)}>
            <Radio.Button value="TIEN_MAT">{t("pos.cash")}</Radio.Button>
            <Radio.Button value="CHUYEN_KHOAN">{t("pos.bankTransfer")}</Radio.Button>
          </Radio.Group>
          {payMethod === "TIEN_MAT" && (
            <div>
              <Typography.Text>{t("pos.customerPaid")}</Typography.Text>
              <InputNumber min={0} value={customerPaid} onChange={(v) => setCustomerPaid(v || 0)} style={{ width: "100%" }} />
              <div style={{ marginTop: 8, color: "#888" }}>
                {t("pos.change")}: {formatMoney(Math.max(0, Number(customerPaid || 0) - Number(payingOrder?.totalAmount || 0)))}
              </div>
            </div>
          )}
          <Divider style={{ margin: "12px 0" }} />
          <Typography.Text strong>
            {t("orderHistory.finalTotal")}: {formatMoney(payingOrder?.totalAmount || 0)}
          </Typography.Text>
        </Space>
      </Modal>
    </div>
  );
}