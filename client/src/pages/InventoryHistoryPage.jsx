// import { useEffect, useState } from "react";
// import { Card, Table, Typography } from "antd";
// import { getReportHistory } from "../utils/reportHistory";

// export default function InventoryHistoryPage() {
//   const [items, setItems] = useState([]);

//   useEffect(() => {
//     setItems(getReportHistory("inventory"));
//   }, []);

//   return (
//     <Card title={<Typography.Text strong>Lịch sử xem báo cáo tồn kho</Typography.Text>}>
//       <Table
//         rowKey={(r) => r.at}
//         dataSource={items}
//         pagination={{ pageSize: 10 }}
//         columns={[
//           { title: "Thời điểm", dataIndex: "at", width: 200, render: (v) => new Date(v).toLocaleString("vi-VN") },
//           { title: "Ghi chú", dataIndex: "note" },
//         ]}
//       />
//     </Card>
//   );
// }
