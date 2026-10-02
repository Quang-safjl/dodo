import { useEffect, useState, useMemo } from "react";
import {
  Button,
  Card,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Switch,
  Table,
  Typography,
  message,
  Tag,
  Avatar,
  Tooltip,
  Popconfirm,
  Row,
  Col,
} from "antd";
import {
  SearchOutlined,
  ReloadOutlined,
  PlusOutlined,
  EditOutlined,
  UserOutlined,
  DeleteOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  SafetyOutlined,
} from "@ant-design/icons";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { useTranslation } from "react-i18next";

/* ── Role config ── */
const ROLE = (t) => ({
  ADMIN: { label: t("employees.roleAdmin"), color: "#ff4d4f", bg: "#fff1f0", border: "#ffa39e" },
  MANAGER: {
    label: t("employees.roleManager"),
    color: "#fa8c16",
    bg: "#fff7e6",
    border: "#ffd591",
  },
  STAFF: {
    label: t("employees.roleStaff"),
    color: "#1677ff",
    bg: "#e6f4ff",
    border: "#91caff",
  },
});

/* ── Permission helper ── */
function canDeactivate(currentUser, target) {
  if (!currentUser) return false;
  if (currentUser.role === "ADMIN") return true;
  if (currentUser.role === "MANAGER") return target.role === "STAFF";
  return false;
}

export default function EmployeesPage() {
  const { t } = useTranslation();
  const { user: currentUser } = useAuth();
  const roleConfig = ROLE(t);

  const isMobile = useMediaQuery("(max-width: 768px)");

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const [form] = Form.useForm();

  async function load() {
    setLoading(true);
    try {
      const res = await api.get("/employees");
      const all = res.data.items || [];
      setItems(
        currentUser?.role === "ADMIN"
          ? all
          : all.filter((e) => e.role !== "ADMIN"),
      );
    } catch (err) {
      message.error(
        err?.response?.data?.message || t("employees.loadFailed", { defaultValue: "Không tải được danh sách nhân viên" }),
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(id) {
    setDeleting(id);
    try {
      await api.delete(`/employees/${id}`);
      message.success(t("employees.deleteSuccess"));
      await load();
    } catch (err) {
      message.error(err?.response?.data?.message || t("employees.deleteFailed"));
    } finally {
      setDeleting(null);
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (e) =>
        e.name?.toLowerCase().includes(q) ||
        e.email?.toLowerCase().includes(q) ||
        e.role?.toLowerCase().includes(q),
    );
  }, [items, search]);

  const totalActive = items.filter((e) => e.isActive).length;
  const totalManager = items.filter(
    (e) => e.role === "MANAGER" || e.role === "ADMIN",
  ).length;

  function openCreate() {
    setEditing(null);
    form.resetFields();
    setOpen(true);
  }

  function openEdit(row) {
    setEditing(row);
    form.setFieldsValue({
      name: row.name,
      role: row.role,
      isActive: row.isActive,
      password: "",
    });
    setOpen(true);
  }

  async function submit() {
    try {
      const v = await form.validateFields();
      if (editing && v.isActive !== editing.isActive) {
        if (!canDeactivate(currentUser, editing)) {
          message.error(
            t("employees.cannotDeactivate"),
          );
          return;
        }
      }
      if (!editing) {
        await api.post("/employees", {
          name: v.name,
          email: v.email,
          password: v.password,
          role: v.role,
        });
      } else {
        await api.put(`/employees/${editing.id}`, {
          name: v.name,
          role: v.role,
          isActive: v.isActive,
          password: v.password || undefined,
        });
      }
      message.success(t("common.successSave"));
      setOpen(false);
      await load();
    } catch (err) {
      if (err?.errorFields) return;
      message.error(err?.response?.data?.message || t("common.errorSave"));
    }
  }

  function DeleteButton({ row }) {
    const allowed = canDeactivate(currentUser, row);
    const alreadyInactive = !row.isActive;

    if (alreadyInactive) {
      return (
        <Tooltip title={t("employees.alreadyInactive")}>
          <Button icon={<DeleteOutlined />} size="small" danger disabled />
        </Tooltip>
      );
    }

    if (!allowed) {
      const reason =
        currentUser?.role === "MANAGER"
          ? "Quản lý không thể vô hiệu hóa Admin hoặc Quản lý khác"
          : "Bạn không có quyền thực hiện thao tác này";
      return (
        <Tooltip title={reason}>
          <Button icon={<DeleteOutlined />} size="small" danger disabled />
        </Tooltip>
      );
    }

    return (
      <Popconfirm
        title={t("employees.deactivateConfirmTitle")}
        description={
          <span>
            {t("employees.deactivateConfirmContent", { name: row.name })}<br />
            <span style={{ color: "#ff4d4f", fontSize: 12 }}>
              {t("employees.deactivateWarning")}
            </span>
          </span>
        }
        onConfirm={() => handleDelete(row.id)}
        okText={t("employees.delete")}
        cancelText={t("common.cancel")}
        okButtonProps={{ danger: true }}
        placement="topRight"
      >
        <Tooltip title={t("employees.delete")}>
          <Button
            icon={<DeleteOutlined />}
            size="small"
            danger
            loading={deleting === row.id}
          />
        </Tooltip>
      </Popconfirm>
    );
  }

  function ActiveSwitch() {
    const allowed = canDeactivate(currentUser, editing || {});
    return (
      <Tooltip
        title={
          !allowed
            ? "Bạn không có quyền thay đổi trạng thái người dùng này"
            : ""
        }
      >
        <Form.Item
          name="isActive"
          label={t("employees.status")}
          valuePropName="checked"
        >
          <Switch
            checkedChildren={t("employees.activeStatus")}
            unCheckedChildren={t("employees.inactiveStatus")}
            disabled={!allowed}
          />
        </Form.Item>
      </Tooltip>
    );
  }

  // Cột cho bảng (desktop)
  const columns = [
    {
      title: t("employees.name"),
      dataIndex: "name",
      render: (name, row) => (
        <Space>
          <Avatar
            style={{
              background: roleConfig[row.role]?.color || "#999",
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {name?.charAt(0)?.toUpperCase()}
          </Avatar>
          <div>
            <div style={{ fontWeight: 600, lineHeight: 1.3 }}>{name}</div>
            <div style={{ fontSize: 12, color: "#aaa" }}>{row.email}</div>
          </div>
        </Space>
      ),
    },
    {
      title: t("employees.role"),
      dataIndex: "role",
      width: 120,
      render: (role) => {
        const r = roleConfig[role] || {
          label: role,
          color: "#666",
          bg: "#f5f5f5",
          border: "#ddd",
        };
        return (
          <span
            style={{
              padding: "2px 10px",
              borderRadius: 12,
              fontSize: 12,
              fontWeight: 600,
              color: r.color,
              background: r.bg,
              border: `1px solid ${r.border}`,
              whiteSpace: "nowrap",
            }}
          >
            {r.label}
          </span>
        );
      },
    },
    {
      title: t("employees.status"),
      dataIndex: "isActive",
      width: 130,
      render: (v) =>
        v ? (
          <Tag color="success" style={{ borderRadius: 10 }}>
            {t("employees.activeStatus")}
          </Tag>
        ) : (
          <Tag color="default" style={{ borderRadius: 10 }}>
            {t("employees.inactiveStatus")}
          </Tag>
        ),
    },
    {
      title: t("employees.createdAt"),
      dataIndex: "createdAt",
      width: 120,
      render: (v) => (v ? new Date(v).toLocaleDateString("vi-VN") : "—"),
    },
    {
      title: t("employees.actions"),
      key: "actions",
      width: 110,
      render: (_, r) => (
        <Space size={6}>
          <Tooltip title={t("employees.edit")}>
            <Button
              icon={<EditOutlined />}
              size="small"
              onClick={() => openEdit(r)}
              style={{ borderColor: "#1677ff", color: "#1677ff" }}
            />
          </Tooltip>
          <DeleteButton row={r} />
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
          alignItems: "flex-start",
          ...(isMobile && { flexDirection: "column", gap: 12 }),
        }}
      >
        <div>
          <Typography.Title level={4} style={{ margin: 0, color: "#3d2914" }}>
            {t("employees.title")}
          </Typography.Title>
          <Typography.Text type="secondary" style={{ fontSize: 13 }}>
            {t("employees.subtitle")}
          </Typography.Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={openCreate}
          style={{
            background: "#6b3f22",
            borderColor: "#6b3f22",
            borderRadius: 8,
            fontWeight: 600,
          }}
        >
          {t("employees.add")}
        </Button>
      </div>

      {/* Stat cards */}
      <Row gutter={[16, 16]}>
        {[
          {
            label: t("employees.total"),
            value: items.length,
            color: "#1677ff",
            icon: <TeamOutlined />,
          },
          {
            label: t("employees.active"),
            value: totalActive,
            color: "#52c41a",
            icon: <CheckCircleOutlined />,
          },
          {
            label: t("employees.managers"),
            value: totalManager,
            color: "#fa8c16",
            icon: <SafetyOutlined />,
          },
        ].map((s) => (
          <Col xs={24} sm={8} key={s.label}>
            <Card
              style={{ background: s.color, borderRadius: 12, border: "none" }}
              styles={{ body: { padding: "16px 20px" } }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <div
                    style={{ color: "rgba(255,255,255,0.85)", fontSize: 13 }}
                  >
                    {s.label}
                  </div>
                  <div
                    style={{
                      color: "white",
                      fontSize: 32,
                      fontWeight: 700,
                      lineHeight: 1.2,
                    }}
                  >
                    {s.value}
                  </div>
                </div>
                <div style={{ fontSize: 36, color: "rgba(255,255,255,0.4)" }}>
                  {s.icon}
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Search + Table / Cards */}
      <Card style={{ borderRadius: 12 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
            gap: 12,
            ...(isMobile && { flexWrap: "wrap" }),
          }}
        >
          <Input
            allowClear
            size="large"
            placeholder={t("employees.search")}
            prefix={<SearchOutlined style={{ color: "#bbb" }} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ borderRadius: 8, maxWidth: 400, ...(isMobile && { flex: 1, minWidth: 200 }) }}
          />
          <Tooltip title="Tải lại">
            <Button icon={<ReloadOutlined />} onClick={load} />
          </Tooltip>
        </div>

        {search && (
          <Typography.Text
            type="secondary"
            style={{ display: "block", marginBottom: 8, fontSize: 13 }}
          >
            {t("employees.foundResults", { count: filtered.length, total: items.length })}
          </Typography.Text>
        )}

        {/* Desktop: bảng */}
        {!isMobile && (
          <Table
            rowKey="id"
            loading={loading}
            dataSource={filtered}
            columns={columns}
            pagination={{ pageSize: 10, showTotal: (t) => `Tổng ${t} nhân viên` }}
            locale={{ emptyText: "Không tìm thấy nhân viên nào" }}
            rowClassName={(r) => (!r.isActive ? "row-inactive" : "")}
          />
        )}

        {/* Mobile: thẻ dọc */}
        {isMobile && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            {filtered.map((emp) => (
              <Card
                key={emp.id}
                size="small"
                style={{ borderRadius: 12 }}
                bodyStyle={{ padding: 12 }}
              >
                {/* Hàng 1: Avatar + tên + nút sửa/xóa */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 12,
                  }}
                >
                  <Space>
                    <Avatar
                      style={{
                        background: roleConfig[emp.role]?.color || "#999",
                        fontWeight: 700,
                      }}
                    >
                      {emp.name?.charAt(0)?.toUpperCase()}
                    </Avatar>
                    <div>
                      <div style={{ fontWeight: 600 }}>{emp.name}</div>
                      <div style={{ fontSize: 12, color: "#aaa" }}>
                        {emp.email}
                      </div>
                    </div>
                  </Space>
                  <Space size={6}>
                    <Tooltip title="Chỉnh sửa">
                      <Button
                        icon={<EditOutlined />}
                        size="small"
                        onClick={() => openEdit(emp)}
                        style={{ borderColor: "#1677ff", color: "#1677ff" }}
                      />
                    </Tooltip>
                    <DeleteButton row={emp} />
                  </Space>
                </div>

                {/* Hàng 2: các thông tin ngắn (vai trò, trạng thái, ngày tạo) xếp linh hoạt */}
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "12px 16px",
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <div>
                    <span style={{ color: "#888", fontSize: 12 }}>Vai trò:</span>{" "}
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: 12,
                        fontSize: 12,
                        fontWeight: 600,
                        color: roleConfig[emp.role]?.color,
                        background: roleConfig[emp.role]?.bg,
                        border: `1px solid ${roleConfig[emp.role]?.border}`,
                      }}
                    >
                      {roleConfig[emp.role]?.label}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: "#888", fontSize: 12 }}>Trạng thái:</span>{" "}
                    {emp.isActive ? (
                      <Tag color="success" style={{ borderRadius: 10 }}>
                        Hoạt động
                      </Tag>
                    ) : (
                      <Tag color="default" style={{ borderRadius: 10 }}>
                        Đã khoá
                      </Tag>
                    )}
                  </div>
                  <div>
                    <span style={{ color: "#888", fontSize: 12 }}>Ngày tạo:</span>{" "}
                    <span style={{ fontSize: 13 }}>
                      {emp.createdAt
                        ? new Date(emp.createdAt).toLocaleDateString("vi-VN")
                        : "—"}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
            {filtered.length === 0 && (
              <div style={{ textAlign: "center", padding: 32, color: "#999" }}>
                Không tìm thấy nhân viên nào
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Modal thêm/sửa */}
      <Modal
        open={open}
        onCancel={() => setOpen(false)}
        onOk={submit}
        okText="Lưu"
        cancelText="Hủy"
        title={editing ? t("employees.modalEditTitle") : t("employees.modalCreateTitle")}
        destroyOnClose
        {...(isMobile && { width: "95%" })}
      >
        <Form
          layout="vertical"
          form={form}
          initialValues={{ role: "STAFF", isActive: true }}
        >
          <Form.Item
            name="name"
            label={t("employees.name")}
            rules={[{ required: true, message: t("validation.required") }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Nguyễn Văn A" />
          </Form.Item>
          {!editing && (
            <Form.Item
              name="email"
            label={t("employees.email")}
              rules={[
                { required: true, message: t("validation.required") },
                { type: "email", message: t("validation.email") },
              ]}
            >
              <Input placeholder="example@dodo.vn" />
            </Form.Item>
          )}
          <Form.Item name="role" label={t("employees.role")} rules={[{ required: true }]}>
            <Select
              options={[
                { value: "ADMIN", label: t("employees.roleAdmin") },
                { value: "MANAGER", label: t("employees.roleManager") },
                { value: "STAFF", label: t("employees.roleStaff") },
              ]}
            />
          </Form.Item>
          {editing && <ActiveSwitch />}
          <Form.Item
            name="password"
            label={editing ? t("employees.changePassword") : t("employees.password")}
            rules={
              editing
                ? []
                : [{ required: true, min: 6, message: t("employees.passwordMinLength") }]
            }
          >
            <Input.Password
              placeholder={
                editing ? t("employees.leaveEmpty") : t("employees.passwordMinLength")
              }
            />
          </Form.Item>
        </Form>
      </Modal>

      <style>{`.row-inactive td { opacity: 0.5; }`}</style>
    </div>
  );
}