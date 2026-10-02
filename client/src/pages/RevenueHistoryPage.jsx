import { useEffect, useState } from "react";
import { Card, Table, Typography } from "antd";
import { getReportHistory } from "../utils/reportHistory";
import { useTranslation } from "react-i18next";

export default function RevenueHistoryPage() {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);

  useEffect(() => {
    setItems(getReportHistory("revenue"));
  }, []);

  return (
    <Card title={<Typography.Text strong>{t("revenue.historyTitle", { defaultValue: "Lịch sử xem báo cáo doanh thu" })}</Typography.Text>}>
      <Table
        rowKey={(r) => r.at}
        dataSource={items}
        pagination={{ pageSize: 10 }}
        columns={[
          { title: t("revenue.time", { defaultValue: "Thời điểm" }), dataIndex: "at", width: 200, render: (v) => new Date(v).toLocaleString("vi-VN") },
          { title: t("revenue.groupBy"), dataIndex: "groupBy", width: 120 },
          { title: t("revenue.from", { defaultValue: "Từ" }), dataIndex: "from", width: 180 },
          { title: t("revenue.to", { defaultValue: "Đến" }), dataIndex: "to", width: 180 },
        ]}
      />
    </Card>
  );
}

