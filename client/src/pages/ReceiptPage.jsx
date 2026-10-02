import { useEffect, useMemo, useState } from "react";
import { Button, Card, Form, Input, InputNumber, Select, Space, Table, Typography, message } from "antd";
import { api } from "../services/api";
import { useMediaQuery } from "../hooks/useMediaQuery"; // + thêm
import { useTranslation } from "react-i18next";

export default function ReceiptPage() {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [ingredients, setIngredients] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastReceiptId, setLastReceiptId] = useState(null);
  const isMobile = useMediaQuery("(max-width: 768px)"); // + thêm

  async function loadIngredients() {
    const res = await api.get("/inventory");
    setIngredients(res.data.items || []);
  }

  useEffect(() => {
    loadIngredients().catch(() => {});
  }, []);

  const total = useMemo(() => items.reduce((s, it) => s + Math.round(it.quantity * it.unitPrice), 0), [items]);

  async function submit() {
    setLoading(true);
    try {
      const values = await form.validateFields();
      if (!items.length) {
        message.warning(t("receipt.warningNoItems"));
        return;
      }
      const invalid = items.find((it) => !it.quantity || it.quantity <= 0 || it.unitPrice < 0);
      if (invalid) {
        message.error(t("receipt.errorInvalidItems"));
        return;
      }
      const res = await api.post("/inventory/receipt", {
        supplier: values.supplier || undefined,
        note: values.note || undefined,
        items: items.map((it) => ({
          ingredientId: it.ingredientId,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
        })),
      });
      setLastReceiptId(res.data.receiptId);
      message.success(t("receipt.successSaved", { id: res.data.receiptId }));
      setItems([]);
      form.resetFields();
      await loadIngredients();
    } catch (err) {
      if (err?.errorFields) return;
      message.error(err?.response?.data?.message || t("receipt.saveFailed", { defaultValue: "Lưu phiếu nhập thất bại" }));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Space direction="vertical" style={{ width: "100%" }} size={12}>
      <Card title={<Typography.Text strong>{t("receipt.title")}</Typography.Text>}>
        
        {lastReceiptId != null && (
          <Typography.Text type="success">
            {t("receipt.lastReceipt", { id: lastReceiptId })}
          </Typography.Text>
        )}
        <Form form={form} layout="vertical" style={{ marginTop: 12 }}>
          <Space
            wrap
            style={{ width: "100%" }}
            align="start"
            direction={isMobile ? "vertical" : "horizontal"} // + thêm
          >
            <Form.Item
              name="supplier"
              label={t("receipt.supplier")}
              style={{ width: isMobile ? "100%" : 280 }} // + sửa
            >
              <Input placeholder={t("receipt.supplierPlaceholder")} />
            </Form.Item>
            <Form.Item
              name="note"
              label={t("common.note")}
              style={{ width: isMobile ? "100%" : 320 }} // + sửa
            >
              <Input placeholder={t("receipt.notePlaceholder")} />
            </Form.Item>
          </Space>
        </Form>
      </Card>

      <Card
        title={<Typography.Text strong>{t("receipt.detailTitle", { defaultValue: "Chi tiết phiếu nhập" })}</Typography.Text>}
        extra={
          <Space wrap style={{ justifyContent: isMobile ? "flex-end" : undefined }}>
            <Typography.Text strong>{t("common.total")}: {new Intl.NumberFormat("vi-VN").format(total)} ₫</Typography.Text>
            <Button type="primary" onClick={submit} loading={loading}>
              {t("receipt.saveReceipt")}
            </Button>
          </Space>
        }
      >
        <Space wrap style={{ marginBottom: 12, width: "100%" }}>
          <Select
            style={{ width: isMobile ? "100%" : 320 }} // + sửa
            showSearch
            placeholder={t("receipt.addIngredient")}
            optionFilterProp="label"
            options={ingredients.map((i) => ({ value: i.id, label: `${i.name} (${i.unit})` }))}
            onChange={(ingredientId) => {
              if (items.some((x) => x.ingredientId === ingredientId)) return;
              const ing = ingredients.find((x) => x.id === ingredientId);
              setItems((prev) => [...prev, { ingredientId, name: ing?.name, unit: ing?.unit, quantity: 1, unitPrice: 0 }]);
            }}
          />
        </Space>

        <div style={{ overflowX: "auto" }}>
          <Table
            rowKey="ingredientId"
            dataSource={items}
            pagination={false}
            columns={[
              { title: t("receipt.ingredient"), dataIndex: "name", fixed: isMobile ? false : undefined },
              { title: t("inventory.unit"), dataIndex: "unit", width: 90 },
              {
                title: t("receipt.quantity"),
                dataIndex: "quantity",
                width: 140,
                render: (v, r) => (
                  <InputNumber
                    min={0.01}
                    value={v}
                    onChange={(nv) => setItems((prev) => prev.map((x) => (x.ingredientId === r.ingredientId ? { ...x, quantity: nv || 0 } : x)))}
                  />
                ),
              },
              {
                title: t("receipt.unitPrice"),
                dataIndex: "unitPrice",
                width: 160,
                render: (v, r) => (
                  <InputNumber
                    min={0}
                    value={v}
                    onChange={(nv) => setItems((prev) => prev.map((x) => (x.ingredientId === r.ingredientId ? { ...x, unitPrice: nv || 0 } : x)))}
                  />
                ),
              },
              {
                title: t("receipt.amount"),
                key: "line",
                width: 160,
                render: (_, r) => new Intl.NumberFormat("vi-VN").format(Math.round(r.quantity * r.unitPrice)) + " ₫",
              },
              {
                title: "",
                key: "actions",
                width: 80,
                render: (_, r) => (
                  <Button danger size="small" onClick={() => setItems((prev) => prev.filter((x) => x.ingredientId !== r.ingredientId))}>
                    {t("common.delete")}
                  </Button>
                ),
              },
            ]}
            scroll={{ x: "max-content" }} // + thêm: cho phép cuộn ngang khi bảng rộng
          />
        </div>
      </Card>
    </Space>
  );
}