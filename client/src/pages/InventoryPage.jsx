import { useEffect, useState, useMemo } from "react";
import { Table, Typography, message, Input, Button, Card, Space, Tag, Row, Col } from "antd"; // + thêm Card, Space, Tag, Row, Col
import {
  SearchOutlined,
  ReloadOutlined,
  PlusOutlined,
  InboxOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { addReportHistory } from "../utils/reportHistory";
import { useMediaQuery } from "../hooks/useMediaQuery"; // + thêm
import { useTranslation } from "react-i18next";

/* ── Status helper ── */
function getStatus(stock, minStock) {
  if (stock === 0) return "empty";
  if (stock < minStock) return "low";
  return "ok";
}

const STATUS_CONFIG = (t) => ({
  ok: { label: t("inventory.status.ok"), color: "#52c41a", icon: <InboxOutlined /> },
  low: {
    label: t("inventory.status.low"),
    color: "#fa8c16",
    icon: <span style={{ fontWeight: 700 }}>↘</span>,
  },
  empty: { label: t("inventory.status.empty"), color: "#ff4d4f", icon: <WarningOutlined /> },
});

export default function InventoryPage() {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const statusConfig = STATUS_CONFIG(t);

  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const isMobile = useMediaQuery("(max-width: 768px)"); // + thêm

  async function load() {
    setLoading(true);
    try {
      const res = await api.get("/inventory");
      setItems(res.data.items || []);
      addReportHistory({ type: "inventory", note: t("inventory.historyViewNote", { defaultValue: "Xem tồn kho hiện tại" }) });
    } catch (err) {
      message.error(err?.response?.data?.message || t("inventory.loadFailed", { defaultValue: "Không tải được tồn kho" }));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  /* ── filter ── */
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((e) => e.name?.toLowerCase().includes(q));
  }, [items, search]);

  /* ── columns (chỉ dùng cho desktop) ── */
  const columns = [
    {
      title: t("inventory.ingredient"),
      dataIndex: "name",
      render: (name) => (
        <Typography.Text strong style={{ color: "#3d2914" }}>
          {name}
        </Typography.Text>
      ),
    },
    {
      title: t("inventory.stock"),
      dataIndex: "stock",
      width: 140,
      render: (v, row) => (
        <Typography.Text style={{ color: "#555" }}>
          {v} {row.unit}
        </Typography.Text>
      ),
    },
    {
      title: t("inventory.minStock"),
      dataIndex: "minStock",
      width: 160,
      render: (v, row) => (
        <Typography.Text style={{ color: "#999" }}>
          {v} {row.unit}
        </Typography.Text>
      ),
    },
    {
      title: t("common.status"),
      width: 160,
      render: (_, row) => {
        const s = getStatus(row.stock, row.minStock);
        const cfg = statusConfig[s];
        return (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              color: cfg.color,
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            {cfg.icon} {cfg.label}
          </span>
        );
      },
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* ── Header ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          ...(isMobile && { flexDirection: "column", gap: 12, alignItems: "flex-start" }), // + thêm
        }}
      >
        <Typography.Title level={4} style={{ margin: 0, color: "#3d2914" }}>
          {t("inventory.title")}
        </Typography.Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate("/dashboard/receipt")}
          style={{
            background: "#6b3f22",
            borderColor: "#6b3f22",
            borderRadius: 8,
            fontWeight: 600,
          }}
        >
          {t("inventory.importStock")}
        </Button>
      </div>

      {/* ── Search ── */}
      <Input
        allowClear
        size="large"
        placeholder={t("inventory.searchPlaceholder")}
        prefix={<SearchOutlined style={{ color: "#bbb" }} />}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ borderRadius: 10, background: "white", ...(isMobile && { width: "100%" }) }} // + thêm
      />

      {search && (
        <Typography.Text
          type="secondary"
          style={{ fontSize: 13, marginTop: -12 }}
        >
          {t("inventory.foundResults", { count: filtered.length, total: items.length })}
        </Typography.Text>
      )}

      {/* ── Table / Card view ── */}
      <div
        style={{
          background: "white",
          borderRadius: 12,
          border: "1px solid #ede8e0",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            padding: "10px 16px",
            borderBottom: "1px solid #f0ebe3",
          }}
        >
          <Button icon={<ReloadOutlined />} size="small" onClick={load}>
            {t("inventory.reload")}
          </Button>
        </div>

        {/* Desktop: bảng */}
        {!isMobile && (
          <Table
            rowKey="id"
            loading={loading}
            dataSource={filtered}
            columns={columns}
            pagination={{
              pageSize: 10,
              showTotal: (t) => `Tổng ${t} nguyên liệu`,
            }}
            locale={{ emptyText: "Không tìm thấy nguyên liệu nào" }}
            rowClassName={(row) => {
              const s = getStatus(row.stock, row.minStock);
              if (s === "empty") return "row-empty";
              if (s === "low") return "row-low";
              return "";
            }}
          />
        )}

        {/* Mobile: thẻ dọc */}
        {isMobile && (
          <div style={{ padding: 12 }}>
            {filtered.map((item) => {
              const s = getStatus(item.stock, item.minStock);
              const cfg = statusConfig[s];
              return (
                <Card
                  key={item.id}
                  size="small"
                  style={{ marginBottom: 12, borderRadius: 10 }}
                  bodyStyle={{ padding: 12 }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <Typography.Text strong style={{ color: "#3d2914", fontSize: 15 }}>
                      {item.name}
                    </Typography.Text>
                    <span style={{ color: cfg.color, fontWeight: 600 }}>
                      {cfg.icon} {cfg.label}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "12px 16px",
                      marginTop: 8,
                    }}
                  >
                    <div>
                      <span style={{ color: "#888", fontSize: 12 }}>Tồn kho:</span>{" "}
                      <span style={{ fontWeight: 500 }}>
                        {item.stock} {item.unit}
                      </span>
                    </div>
                    <div>
                      <span style={{ color: "#888", fontSize: 12 }}>Tồn tối thiểu:</span>{" "}
                      <span style={{ fontWeight: 500 }}>
                        {item.minStock} {item.unit}
                      </span>
                    </div>
                  </div>
                </Card>
              );
            })}
            {filtered.length === 0 && (
              <div style={{ textAlign: "center", padding: 32, color: "#999" }}>
                Không tìm thấy nguyên liệu nào
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        .row-empty td { background: #fff5f5 !important; }
        .row-low   td { background: #fffbf0 !important; }
        .ant-table-thead > tr > th {
          background: #f5f0ea !important;
          color: #5a3d28 !important;
          font-weight: 600 !important;
          border-bottom: 1px solid #e8e0d5 !important;
        }
      `}</style>
    </div>
  );
}