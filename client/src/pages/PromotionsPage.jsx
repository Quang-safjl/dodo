import { useEffect, useState } from "react";
import {
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Switch,
  Typography,
  message,
  Tag,
} from "antd";
import { api } from "../services/api";
import dayjs from "dayjs";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { useTranslation } from "react-i18next";

export default function PromotionsPage() {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [drinks, setDrinks] = useState([]);
  const [loading, setLoading] = useState(false);

  const [open, setOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);

  const [selectedPromotion, setSelectedPromotion] = useState(null);
  const [editingPromotion, setEditingPromotion] = useState(null);

  const [searchName, setSearchName] = useState("");
  const [searchDate, setSearchDate] = useState(null);

  const [form] = Form.useForm();
  const [assignForm] = Form.useForm();
  const isMobile = useMediaQuery("(max-width: 768px)");

  async function load() {
    setLoading(true);
    try {
      const [pRes, dRes] = await Promise.all([
        api.get("/promotions"),
        api.get("/menu/drinks"),
      ]);
      setItems(pRes.data.items || []);
      setDrinks(dRes.data.items || []);
    } catch {
      message.error(t("promotions.loadFailed", { defaultValue: "Không tải được khuyến mãi" }));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function getStatus(p) {
    const now = new Date();
    const from = new Date(p.from);
    const to = new Date(p.to);

    if (now >= from && now <= to) return "active";
    if (now < from) return "upcoming";
    return "expired";
  }

  function filterItems(list) {
    return list.filter((p) => {
      const matchName = p.name
        .toLowerCase()
        .includes(searchName.toLowerCase());

      let matchDate = true;

      if (searchDate) {
        const d = dayjs(searchDate).startOf("day").valueOf();
        const from = dayjs(p.from).startOf("day").valueOf();
        const to = dayjs(p.to).endOf("day").valueOf();

        matchDate = d >= from && d <= to;
      }

      return matchName && matchDate;
    });
  }

  const filtered = filterItems(items);

  const activeList = filtered.filter((p) => getStatus(p) === "active");
  const upcomingList = filtered.filter((p) => getStatus(p) === "upcoming");
  const expiredList = filtered.filter((p) => getStatus(p) === "expired");

  async function togglePromotion(p) {
    const status = getStatus(p);

    if (status === "expired" && !p.isActive) {
      openEdit(p);
      return;
    }

    try {
      await api.put(`/promotions/${p.id}`, {
        ...p,
        isActive: !p.isActive,
      });
      message.success(t("promotions.statusUpdated", { defaultValue: "Đã cập nhật trạng thái" }));
      load();
    } catch {
      message.error(t("promotions.toggleError"));
    }
  }

  function statusTag(status, isActive) {
    if (!isActive) return <Tag color="red">{t("promotions.status.inactive")}</Tag>;
    if (status === "active") return <Tag color="green">{t("promotions.status.active")}</Tag>;
    if (status === "upcoming") return <Tag color="blue">{t("promotions.status.upcoming")}</Tag>;
    return <Tag>{t("promotions.status.expired")}</Tag>;
  }

  function openEdit(p) {
    setEditingPromotion(p);
    setOpen(true);

    form.setFieldsValue({
      name: p.name,
      percent: p.percent,
      range: [dayjs(p.from), dayjs(p.to)],
      isActive: p.isActive,
    });
  }

  function renderCard(p) {
    const status = getStatus(p);

    return (
      <Card
        key={p.id}
        style={{
          marginBottom: 16,
          borderRadius: 12,
          background:
            status === "active"
              ? "#f6ffed"
              : status === "upcoming"
                ? "#f0f5ff"
                : "#fafafa",
          opacity: p.isActive ? 1 : 0.5,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <b>{p.name}</b>
          {statusTag(status, p.isActive)}
        </div>

        <div style={{ marginTop: 6 }}>{p.percent}% OFF</div>

        <div style={{ color: "#888", fontSize: 13 }}>
          {new Date(p.from).toLocaleDateString()} →{" "}
          {new Date(p.to).toLocaleDateString()}
        </div>

        <Space style={{ marginTop: 10 }} wrap>
          <span>{t("promotions.isActive")}</span>

          <Switch
            checked={p.isActive}
            onChange={() => togglePromotion(p)}
          />

          <Button size="small" onClick={() => openEdit(p)}>
            {t("promotions.edit")}
          </Button>

          <Button
            size="small"
            onClick={() => {
              setSelectedPromotion(p);
              setAssignOpen(true);
            }}
          >
            {t("promotions.assign")}
          </Button>
        </Space>
      </Card>
    );
  }

  async function submit() {
    try {
      const v = await form.validateFields();

      if (editingPromotion) {
        await api.put(`/promotions/${editingPromotion.id}`, {
          name: v.name,
          percent: v.percent,
          from: v.range[0].toDate(),
          to: v.range[1].toDate(),
          isActive: v.isActive,
        });
        message.success(t("promotions.updated", { defaultValue: "Đã cập nhật" }));
      } else {
        await api.post("/promotions", {
          name: v.name,
          percent: v.percent,
          from: v.range[0].toDate(),
          to: v.range[1].toDate(),
          isActive: v.isActive,
        });
        message.success(t("promotions.created", { defaultValue: "Đã tạo" }));
      }

      setOpen(false);
      setEditingPromotion(null);
      form.resetFields();
      load();
    } catch (err) {
      if (err?.errorFields) return;
      message.error(t("promotions.saveError", { defaultValue: "Lỗi lưu" }));
    }
  }

  async function assign() {
    try {
      const v = await assignForm.validateFields();
      await api.post(`/promotions/${selectedPromotion.id}/assign`, {
        drinkIds: v.drinkIds,
      });
      message.success(t("promotions.assignSuccess"));
      setAssignOpen(false);
    } catch {
      message.error(t("promotions.assignFailed"));
    }
  }

  return (
    <Card
      title={<Typography.Text strong>{t("promotions.title")}</Typography.Text>}
      extra={
        <Space>
          <Button onClick={load}>{t("promotions.reload")}</Button>
          <Button
            type="primary"
            onClick={() => {
              setEditingPromotion(null);
              setOpen(true);
            }}
          >
            {t("promotions.createPromotion")}
          </Button>
        </Space>
      }
    >
      <Space
        style={{ marginBottom: 16 }}
        direction={isMobile ? "vertical" : "horizontal"}
        wrap
      >
        <Input
          placeholder={t("promotions.searchName")}
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
          style={{ width: isMobile ? "100%" : 200 }}
        />
        <DatePicker
          onChange={(v) => setSearchDate(v)}
          style={{ width: isMobile ? "100%" : undefined }}
        />
      </Space>

      <div
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          gap: 16,
        }}
      >
        <Card title={t("promotions.active")} style={{ flex: 1 }}>
          {activeList.map(renderCard)}
          {activeList.length === 0 && (
            <div style={{ textAlign: "center", color: "#999" }}>Không có</div>
          )}
        </Card>

        <Card title={t("promotions.upcoming")} style={{ flex: 1 }}>
          {upcomingList.map(renderCard)}
          {upcomingList.length === 0 && (
            <div style={{ textAlign: "center", color: "#999" }}>Không có</div>
          )}
        </Card>

        <Card title={t("promotions.expired")} style={{ flex: 1 }}>
          {expiredList.map(renderCard)}
          {expiredList.length === 0 && (
            <div style={{ textAlign: "center", color: "#999" }}>Không có</div>
          )}
        </Card>
      </div>

      <Modal
        open={open}
        onCancel={() => setOpen(false)}
        onOk={submit}
        title={editingPromotion ? t("promotions.editPromotion", { defaultValue: "Sửa khuyến mãi" }) : t("promotions.createPromotion")}
        width={isMobile ? "95%" : 520}
      >
        <Form form={form} layout="vertical" initialValues={{ isActive: true }}>
          <Form.Item name="name" label={t("promotions.name")} rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Form.Item
            name="percent"
            label={t("promotions.percent")}
            rules={[
              { required: true, message: t("promotions.percentRequired", { defaultValue: "Nhập % giảm" }) },
              {
                validator: (_, value) => {
                  if (value === undefined || value === null) {
                    return Promise.reject(t("promotions.percentRequired", { defaultValue: "Nhập % giảm" }));
                  }
                  if (value <= 0 || value > 100) {
                    return Promise.reject(t("promotions.percentRange", { defaultValue: "Phải từ 1 đến 100" }));
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <InputNumber style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item name="range" label={t("promotions.timeRange")} rules={[{ required: true }]}>
            <DatePicker.RangePicker showTime style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={assignOpen}
        onCancel={() => setAssignOpen(false)}
        onOk={assign}
        okText={t("promotions.assign")}
        cancelText={t("common.cancel")}
        title={
          selectedPromotion
            ? t("promotions.assignPromotion", { name: selectedPromotion.name })
            : ""
        }
        width={isMobile ? "95%" : 520}
      >
        <Form form={assignForm} layout="vertical">
          <Form.Item name="drinkIds" rules={[{ required: true }]}>
            <Select
              mode="multiple"
              placeholder={t("promotions.assignDrinks")}
              options={drinks.map((d) => ({
                value: d.id,
                label: d.name,
              }))}
            />
          </Form.Item>

          <Space>
            <Button
              onClick={() => {
                const allIds = drinks.map((d) => d.id);
                assignForm.setFieldsValue({ drinkIds: allIds });
              }}
            >
              {t("common.selectAll")}
            </Button>

            <Button
              onClick={() => {
                assignForm.setFieldsValue({ drinkIds: [] });
              }}
            >
              {t("common.deselectAll")}
            </Button>
          </Space>
        </Form>
      </Modal>
    </Card>
  );
}