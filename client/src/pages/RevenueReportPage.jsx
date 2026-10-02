import { useMemo, useState } from "react";
import {
  Button,
  Card,
  DatePicker,
  Empty,
  Radio,
  Space,
  Statistic,
  Table,
  Typography,
  message,
} from "antd";
import { PrinterOutlined } from "@ant-design/icons";
import { api } from "../services/api";
import dayjs from "dayjs";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { addReportHistory } from "../utils/reportHistory";
import { useMediaQuery } from "../hooks/useMediaQuery"; // + thêm
import { useTranslation } from "react-i18next";

function money(v) {
  return new Intl.NumberFormat("vi-VN").format(Number(v || 0)) + " ₫";
}

/** FR6: chọn loại báo cáo + khoảng thời gian → nút “Xem báo cáo” → GET /api/revenue (JWT) */
export default function RevenueReportPage() {
  const { t } = useTranslation();
  const [groupBy, setGroupBy] = useState("day");
  const [range, setRange] = useState([
    dayjs().startOf("month"),
    dayjs().endOf("month"),
  ]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)"); // + thêm

  const params = useMemo(() => {
    return {
      groupBy,
      from: range?.[0]?.format("YYYY-MM-DD 00:00:00"),
      to: range?.[1]?.format("YYYY-MM-DD 23:59:59"),
    };
  }, [groupBy, range]);

  async function load() {
    if (!range?.[0] || !range?.[1]) {
      message.warning(t("revenue.selectRange", { defaultValue: "Chọn khoảng thời gian" }));
      return;
    }
    setLoading(true);
    try {
      const res = await api.get("/revenue", { params });
      setData(res.data);
      addReportHistory({ type: "revenue", ...params });
      message.success(t("revenue.loaded", { defaultValue: "Đã tải báo cáo doanh thu" }));
    } catch (err) {
      message.error(
        err?.response?.data?.message || t("revenue.loadFailed", { defaultValue: "Không tải được báo cáo doanh thu" })
      );
    } finally {
      setLoading(false);
    }
  }

  // In báo cáo
  const handlePrint = () => {
    if (!data) return;

    const originalTitle = document.title;
    document.title = `${t("revenue.title")} ${params.from} - ${params.to}`;

    const summaryRows = `
      <div style="display:flex; gap:20px; flex-wrap:wrap; margin-bottom:16px;">
        <div style="border:1px solid #ddd; border-radius:8px; padding:12px; min-width:180px;">
          <div style="font-size:12px;color:#666;">${t("revenue.totalRevenue")}</div>
          <div style="font-size:20px;font-weight:700;">${money(data.totalRevenue || 0)}</div>
        </div>
        <div style="border:1px solid #ddd; border-radius:8px; padding:12px; min-width:180px;">
          <div style="font-size:12px;color:#666;">${t("revenue.totalOrders")}</div>
          <div style="font-size:20px;font-weight:700;">${data.totalOrders || 0}</div>
        </div>
        <div style="border:1px solid #ddd; border-radius:8px; padding:12px; min-width:180px;">
          <div style="font-size:12px;color:#666;">${t("revenue.averagePerOrder")}</div>
          <div style="font-size:20px;font-weight:700;">${money(averagePerOrder)}</div>
        </div>
      </div>
    `;

    const tableRows = tableData
      .map(
        (row) => `
          <tr>
            <td>${row.bucket}</td>
            <td style="text-align:right;">${money(row.revenue)}</td>
          </tr>
        `,
      )
      .join("");

    const totalRevenue = tableData.reduce((sum, row) => sum + Number(row.revenue || 0), 0);

    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>${t("revenue.title")}</title>
          <style>
            body { font-family: sans-serif; padding: 20px; }
            .no-print { display: none; }
            .ant-card { border: 1px solid #ddd; margin-bottom: 16px; }
            .ant-statistic-title { font-weight: bold; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .recharts-wrapper { margin: 20px 0; }
          </style>
        </head>
        <body>
          <h2 style="margin: 0 0 8px 0;">${t("revenue.title")}</h2>
          <div style="margin-bottom: 16px; color: #666;">
            ${params.from || ""} - ${params.to || ""}
          </div>
          ${summaryRows}
          <h3 style="margin: 0 0 8px 0;">${t("revenue.detailsTable")}</h3>
          <table>
            <thead>
              <tr>
                <th>${groupBy === "day" ? t("revenue.bucket.day") : groupBy === "month" ? t("revenue.bucket.month") : t("revenue.bucket.year")}</th>
                <th style="text-align:right;">${t("revenue.revenue")}</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
            <tfoot>
              <tr>
                <th>${t("revenue.summary")}</th>
                <th style="text-align:right;">${money(totalRevenue)}</th>
              </tr>
            </tfoot>
          </table>
          <script>window.onload = () => window.print(); setTimeout(() => window.close(), 500);<\/script>
        </body>
      </html>
    `);
    printWindow.document.close();
    document.title = originalTitle;
  };

  const tableData = useMemo(() => {
    if (!data?.series) return [];
    return data.series.map((item, index) => ({
      key: index,
      bucket: item.bucket,
      revenue: item.revenue,
    }));
  }, [data]);

  const columns = [
    {
      title: groupBy === "day" ? t("revenue.bucket.day") : groupBy === "month" ? t("revenue.bucket.month") : t("revenue.bucket.year"),
      dataIndex: "bucket",
      key: "bucket",
    },
    {
      title: t("revenue.revenue"),
      dataIndex: "revenue",
      key: "revenue",
      align: "right",
      render: (val) => money(val),
    },
  ];

  const averagePerOrder = data?.totalOrders
    ? data.totalRevenue / data.totalOrders
    : 0;

  return (
    <Space direction="vertical" style={{ width: "100%" }} size={12}>
      <Card className="no-print">
        <Space
          wrap
          align={isMobile ? "start" : "center"}
          direction={isMobile ? "vertical" : "horizontal"}
          style={{ width: isMobile ? "100%" : undefined }}
        >
          <Typography.Text strong>{t("revenue.title")}</Typography.Text>
          <Radio.Group
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value)}
            buttonStyle="solid"
            style={{ width: isMobile ? "100%" : undefined }}
          >
            <Radio.Button value="day" style={{ flex: isMobile ? 1 : undefined }}>{t("revenue.day")}</Radio.Button>
            <Radio.Button value="month" style={{ flex: isMobile ? 1 : undefined }}>{t("revenue.month")}</Radio.Button>
            <Radio.Button value="year" style={{ flex: isMobile ? 1 : undefined }}>{t("revenue.year")}</Radio.Button>
          </Radio.Group>
          <DatePicker.RangePicker
            value={range}
            onChange={(v) => setRange(v)}
            style={{ width: isMobile ? "100%" : undefined }}
          />
          <Button type="primary" onClick={load} loading={loading} block={isMobile}>
            {t("revenue.viewReport")}
          </Button>
          <Button
            icon={<PrinterOutlined />}
            onClick={handlePrint}
            disabled={!data}
            block={isMobile}
          >
            {t("revenue.printReport")}
          </Button>
        </Space>
        
      </Card>

      <div>
        <Card loading={loading}>
          {!data ? (
            <Empty description={t("revenue.noData")} />
          ) : (
            <>
              <Space
                wrap
                size={24}
                style={{ marginBottom: 16 }}
                direction={isMobile ? "vertical" : "horizontal"}
              >
                <Statistic
                  title={t("revenue.totalRevenue")}
                  value={data.totalRevenue || 0}
                  formatter={(v) => money(v)}
                />
                <Statistic
                  title={t("revenue.totalOrders")}
                  value={data.totalOrders || 0}
                />
                <Statistic
                  title={t("revenue.averagePerOrder")}
                  value={averagePerOrder}
                  formatter={(v) => money(v)}
                  precision={0}
                />
              </Space>

              <div style={{ height: isMobile ? 240 : 320, marginTop: 8 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.series || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="bucket" tick={{ fontSize: isMobile ? 10 : 12 }} />
                    <YAxis
                      tickFormatter={(v) => `${Math.round(v / 1000)}k`}
                      tick={{ fontSize: isMobile ? 10 : 12 }}
                    />
                    <Tooltip formatter={(v) => money(v)} />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#7a4a2e"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <Card
                type="inner"
                title={t("revenue.detailsTable")}
                style={{ marginTop: 24 }}
              >
                <Table
                  dataSource={tableData}
                  columns={columns}
                  size="small"
                  pagination={{ pageSize: 10, responsive: true }}
                  summary={() => {
                    const total = tableData.reduce(
                      (sum, record) => sum + (record.revenue || 0),
                      0
                    );
                    return (
                      <Table.Summary fixed>
                        <Table.Summary.Row>
                          <Table.Summary.Cell index={0}>
                            <strong>{t("revenue.summary")}</strong>
                          </Table.Summary.Cell>
                          <Table.Summary.Cell align="right" index={1}>
                            <strong>{money(total)}</strong>
                          </Table.Summary.Cell>
                        </Table.Summary.Row>
                      </Table.Summary>
                    );
                  }}
                />
              </Card>
            </>
          )}
        </Card>
      </div>
    </Space>
  );
}