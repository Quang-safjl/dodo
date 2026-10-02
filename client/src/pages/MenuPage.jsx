import { useEffect, useState } from "react";
import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Spin,
  Switch,
  Table,
  Typography,
  Tag,
  Avatar,
  Row,
  Col,
  message,
} from "antd";
import {
  EditOutlined,
  EyeOutlined,
  ReloadOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { api } from "../services/api";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { useTranslation } from "react-i18next";

export default function MenuPage() {
  const { t } = useTranslation();
  const [categories, setCategories] = useState([]);
  const [drinks, setDrinks] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState(null);
  const [search, setSearch] = useState("");
  const isMobile = useMediaQuery("(max-width: 768px)");

  const [form] = Form.useForm();

  async function loadIngredients() {
    const res = await api.get("/inventory");
    setIngredients(res.data.items || []);
  }

  async function load() {
    setLoading(true);
    try {
      const [cRes, dRes] = await Promise.all([
        api.get("/menu/categories"),
        api.get("/menu/drinks"),
      ]);
      setCategories(cRes.data.items || []);
      setDrinks(dRes.data.items || []);
      setFiltered(dRes.data.items || []);
    } catch (err) {
      message.error(err?.response?.data?.message || t("menu.errorLoad"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    loadIngredients().catch(() => { });
  }, []);

  useEffect(() => {
    const f = drinks.filter((d) =>
      d.name.toLowerCase().includes(search.toLowerCase())
    );
    setFiltered(f);
  }, [search, drinks]);

  function openCreate() {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({
      isSelling: true,
      recipe: [{ ingredientId: undefined, quantity: 1 }],
    });
    setOpen(true);
  }

  async function openEdit(row) {
    setEditing(row);
    try {
      const res = await api.get(`/menu/drinks/${row.id}`);
      const d = res.data;
      form.setFieldsValue({
        categoryId: d.categoryId,
        name: d.name,
        price: d.price,
        imageUrl: d.imageUrl || "",
        isSelling: d.isSelling,
        recipe: (d.recipe || []).map((r) => ({
          ingredientId: r.ingredientId,
          quantity: r.dinhLuong,
        })),
      });
      setOpen(true);
    } catch {
      message.error(t("menu.detailLoadError", { defaultValue: "Không tải chi tiết" }));
    }
  }

  async function openDetail(row) {
    setDetail(null);
    setDetailOpen(true);
    setDetailLoading(true);
    try {
      const res = await api.get(`/menu/drinks/${row.id}`);
      setDetail(res.data);
    } catch {
      message.error(t("menu.detailLoadError", { defaultValue: "Không tải chi tiết" }));
      setDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  }

  async function submit() {
    try {
      const v = await form.validateFields();

      const recipe = (v.recipe || [])
        .filter((r) => r?.ingredientId && r?.quantity > 0)
        .map((r) => ({
          ingredientId: r.ingredientId,
          quantity: r.quantity,
        }));

      if (!recipe.length) {
        message.error(t("menu.needAtLeastOneIngredient", { defaultValue: "Cần ít nhất 1 nguyên liệu" }));
        return;
      }

      const body = { ...v, recipe };

      if (!editing) {
        await api.post("/menu/drinks", body);
      } else {
        await api.put(`/menu/drinks/${editing.id}`, body);
        setDrinks((prev) =>
          prev.map((d) =>
            d.id === editing.id ? { ...d, ...body } : d
          )
        );
      }

      message.success(t("menu.saveSuccess"));
      setOpen(false);
      load();
    } catch (err) {
      if (!err?.errorFields) message.error(t("menu.saveError", { defaultValue: "Lỗi" }));
    }
  }

  const ingOptions = ingredients.map((i) => ({
    value: i.id,
    label: `${i.name} (${i.unit}) — tồn: ${i.stock}`,
  }));

  return (
    <div style={{ padding: isMobile ? 12 : 24 }}>
      <Card
        style={{ borderRadius: 12 }}
        title={<Typography.Title level={4}>{t("menu.title")}</Typography.Title>}
        extra={
          <Space wrap style={{ marginBottom: isMobile ? 8 : 0 }}>
            <Input
              placeholder={t("menu.searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: isMobile ? "100%" : 260, borderRadius: 8 }}
            />
            <Button icon={<ReloadOutlined />} onClick={load} />
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              {t("menu.addDrink")}
            </Button>
          </Space>
        }
      >
        {/* Desktop: bảng */}
        {!isMobile && (
          <Table
            rowKey="id"
            loading={loading}
            dataSource={filtered}
            pagination={{ pageSize: 8 }}
            columns={[
              {
                title: t("menu.drinkName"),
                dataIndex: "name",
                render: (v, r) => (
                  <Space>
                    <Avatar style={{ backgroundColor: "#1677ff" }}>
                      {v?.charAt(0)?.toUpperCase()}
                    </Avatar>
                    <Button type="link" onClick={() => openDetail(r)}>
                      {v}
                    </Button>
                  </Space>
                ),
              },
              {
                title: t("menu.category"),
                dataIndex: "categoryId",
                render: (x) =>
                  categories.find((c) => c.id === x)?.name || x,
              },
              {
                title: t("menu.price"),
                dataIndex: "price",
                render: (x) =>
                  new Intl.NumberFormat("vi-VN").format(x) + " ₫",
              },
              {
                title: t("menu.sellingStatus"),
                dataIndex: "isSelling",
                render: (x) =>
                  x ? (
                    <Tag color="green">{t("menu.selling")}</Tag>
                  ) : (
                    <Tag color="red">{t("menu.notSelling")}</Tag>
                  ),
              },
              {
                title: t("common.actions"),
                render: (_, r) => (
                  <Space>
                    <Button icon={<EyeOutlined />} onClick={() => openDetail(r)} />
                    <Button type="primary" icon={<EditOutlined />} onClick={() => openEdit(r)} />
                  </Space>
                ),
              },
            ]}
          />
        )}

        {/* Mobile: danh sách thẻ */}
        {isMobile && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filtered.map((drink) => (
              <Card key={drink.id} size="small" bodyStyle={{ padding: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <Space>
                    <Avatar style={{ backgroundColor: "#1677ff" }}>
                      {drink.name?.charAt(0)?.toUpperCase()}
                    </Avatar>
                    <Typography.Text strong>{drink.name}</Typography.Text>
                  </Space>
                  <Space>
                    <Button size="small" icon={<EyeOutlined />} onClick={() => openDetail(drink)} />
                    <Button size="small" type="primary" icon={<EditOutlined />} onClick={() => openEdit(drink)} />
                  </Space>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 16px", fontSize: 13, color: "#555" }}>
                  <div>
                    <span style={{ color: "#888" }}>{t("menu.category")}:</span>{" "}
                    {categories.find((c) => c.id === drink.categoryId)?.name || drink.categoryId}
                  </div>
                  <div>
                    <span style={{ color: "#888" }}>{t("menu.price")}:</span>{" "}
                    {new Intl.NumberFormat("vi-VN").format(drink.price)} ₫
                  </div>
                  <div>
                    <span style={{ color: "#888" }}>{t("common.status")}:</span>{" "}
                    {drink.isSelling ? <Tag color="green">{t("menu.selling")}</Tag> : <Tag color="red">{t("menu.notSelling")}</Tag>}
                  </div>
                </div>
              </Card>
            ))}
            {filtered.length === 0 && !loading && (
              <div style={{ textAlign: "center", padding: 32, color: "#999" }}>
                {t("menu.noProducts")}
              </div>
            )}
          </div>
        )}
      </Card>

      {/* MODAL EDIT */}
      <Modal
        open={open}
        onCancel={() => setOpen(false)}
        onOk={submit}
        title={editing ? t("menu.editDrink") : t("menu.addDrink")}
        width={isMobile ? "95%" : 650}
      >
        <Form form={form} layout="vertical">
          <Row gutter={12}>
            <Col span={isMobile ? 24 : 12}>
              <Form.Item name="categoryId" label={t("menu.category")} rules={[{ required: true }]}>
                <Select options={categories.map((c) => ({ value: c.id, label: c.name }))} />
              </Form.Item>
            </Col>
            <Col span={isMobile ? 24 : 12}>
              <Form.Item name="price" label={t("menu.price")} rules={[{ required: true }]}>
                <InputNumber style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="name" label={t("menu.drinkName")} rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Form.Item name="imageUrl" label={t("menu.imageUrl")}>
            <Input />
          </Form.Item>

          <Form.Item name="isSelling" valuePropName="checked" label={t("menu.sellingStatus")}>
            <Switch />
          </Form.Item>

          <Typography.Text strong>{t("menu.recipe")}</Typography.Text>

          <Form.List name="recipe">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...rest }) => (
                  <Row key={key} gutter={8} align="middle" style={{ marginBottom: 8 }}>
                    <Col flex="auto">
                      <Form.Item
                        {...rest}
                        name={[name, "ingredientId"]}
                        style={{ marginBottom: 0 }}
                        rules={[{ required: true, message: t("menu.chooseIngredient", { defaultValue: "Chọn nguyên liệu" }) }]}
                      >
                        <Select options={ingOptions} placeholder={t("menu.ingredient")} />
                      </Form.Item>
                    </Col>
                    <Col flex="100px">
                      <Form.Item
                        {...rest}
                        name={[name, "quantity"]}
                        style={{ marginBottom: 0 }}
                        rules={[
                          {
                            validator: (_, value) => {
                              if (value === undefined || value === null) {
                                return Promise.reject(t("menu.requiredField", { defaultValue: "Không để trống" }));
                              }
                              if (value <= 0) {
                                return Promise.reject(t("validation.numberPositive"));
                              }
                              return Promise.resolve();
                            },
                          },
                        ]}
                      >
                        <InputNumber style={{ width: "100%" }} placeholder={t("menu.quantity")} />
                      </Form.Item>
                    </Col>
                    <Col>
                      <Button danger onClick={() => remove(name)}>{t("common.delete")}</Button>
                    </Col>
                    <Col>
                      <Form.Item shouldUpdate noStyle>
                        {() => {
                          const error = form.getFieldError(["recipe", name, "quantity"]);
                          return error.length ? (
                            <span style={{ color: "red", fontSize: 12 }}>
                              {error[0]}
                            </span>
                          ) : null;
                        }}
                      </Form.Item>
                    </Col>
                  </Row>
                ))}
                <Button type="dashed" onClick={() => add()} block>
                  {t("menu.addIngredient")}
                </Button>
              </>
            )}
          </Form.List>
        </Form>
      </Modal>

      {/* MODAL DETAIL */}
      <Modal
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={null}
        title={detail ? t("menu.detailTitle", { name: detail.name }) : t("common.detail")}
        width={isMobile ? "95%" : 700}
      >
        <Spin spinning={detailLoading}>
          {detail && (
            <>
              <p><b>{t("menu.category")}:</b> {detail.categoryName}</p>
              <p>
                <b>{t("menu.price")}:</b>{" "}
                {new Intl.NumberFormat("vi-VN").format(detail.price)} ₫
              </p>
              <p>
                <b>{t("menu.sellingStatus")}:</b>{" "}
                {detail.isSelling ? (
                  <Tag color="green">{t("menu.selling")}</Tag>
                ) : (
                  <Tag color="red">{t("menu.notSelling")}</Tag>
                )}
              </p>

              <Table
                size="small"
                pagination={false}
                rowKey="ingredientId"
                dataSource={detail.recipe || []}
                columns={[
                  { title: t("menu.ingredient"), dataIndex: "tenNguyenLieu" },
                  { title: t("menu.unit"), dataIndex: "donViTinh" },
                  {
                    title: t("menu.quantity"),
                    render: (_, r) => `${r.dinhLuong} ${r.donViTinh}`,
                  },
                  { title: t("menu.stock"), dataIndex: "soLuongTonKho" },
                ]}
              />
            </>
          )}
        </Spin>
      </Modal>
    </div>
  );
}