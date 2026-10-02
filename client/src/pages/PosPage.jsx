import { useEffect, useMemo, useState, Fragment } from "react";
import {
  Badge,
  Button,
  Col,
  Divider,
  Drawer,
  Image,
  Input,
  InputNumber,
  Modal,
  Radio,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Typography,
  message,
} from "antd";
import { SearchOutlined, ShoppingCartOutlined } from "@ant-design/icons";
import { api } from "../services/api";
import dayjs from "dayjs";
import { useAuth } from "../context/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { useTranslation } from "react-i18next";

function money(v) {
  return new Intl.NumberFormat("vi-VN").format(Number(v || 0)) + " ₫";
}

function productFallbackSvg(name = "") {
  const text = encodeURIComponent((name || "Đô Đô").slice(0, 12));
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='320' height='180'>
    <defs>
      <linearGradient id='g' x1='0' x2='1' y1='0' y2='1'>
        <stop offset='0' stop-color='#1677ff'/>
        <stop offset='1' stop-color='#52c41a'/>
      </linearGradient>
    </defs>
    <rect width='100%' height='100%' fill='url(#g)'/>
    <text x='16' y='44' font-family='Arial' font-size='20' fill='white' font-weight='700'>${text}</text>
    <text x='16' y='72' font-family='Arial' font-size='12' fill='white' opacity='0.9'>Đô Đô Tea</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export default function PosPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery("(max-width: 768px)");

  const [q, setQ] = useState("");
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cart, setCart] = useState([]);
  const [payOpen, setPayOpen] = useState(false);
  const [payMethod, setPayMethod] = useState("TIEN_MAT");
  const [customerPaid, setCustomerPaid] = useState(0);
  const [orderNote, setOrderNote] = useState("");
  const [printing, setPrinting] = useState(null);
  const [pendingOrder, setPendingOrder] = useState(null);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [customizeProduct, setCustomizeProduct] = useState(null);
  const [customizeData, setCustomizeData] = useState({ note: "", mucDuong: "100%", mucDa: "100%", quantity: 1 });
  const [ingredientIssues, setIngredientIssues] = useState([]);
  const [checkingIngredients, setCheckingIngredients] = useState(false);
  const [mobileCartOpen, setMobileCartOpen] = useState(false);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      loadProducts();
    }, 15000);
    const onFocus = () => loadProducts();
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", onFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, categoryId]);

  async function loadProducts() {
    setLoading(true);
    try {
      const params = {};
      if (q) params.q = q;
      if (categoryId) params.categoryId = categoryId;
      const res = await api.get("/products", { params });
      setProducts(res.data.items || []);
    } catch (err) {
      message.error(err?.response?.data?.message || t("pos.loadProductsFailed", { defaultValue: "Không tải được danh sách đồ uống" }));
    } finally {
      setLoading(false);
    }
  }

  async function loadCategories() {
    try {
      const res = await api.get("/categories");
      setCategories(res.data.items || []);
    } catch {
      setCategories([]);
    }
  }

  useEffect(() => {
    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, categoryId]);

  useEffect(() => {
    if ((user?.role === "ADMIN" || user?.role === "MANAGER") && location.pathname === "/pos") {
      navigate("/dashboard/pos", { replace: true });
    }
  }, [user?.role, location.pathname, navigate]);

  const totals = useMemo(() => {
    const tongTien = cart.reduce((s, it) => s + it.price * it.qty, 0);
    const giamGia = cart.reduce((s, it) => s + Math.round((it.price * it.qty * (it.promoPercent || 0)) / 100), 0);
    return { tongTien, giamGia, thanhTien: tongTien - giamGia };
  }, [cart]);

  async function checkAvailableIngredients(items) {
    setCheckingIngredients(true);
    try {
      const res = await api.post("/orders/check-ingredients", { items });
      setIngredientIssues(res.data.ingredients.filter((i) => !i.isEnough));
    } catch (err) {
      message.error(t("pos.checkIngredientsFailed", { defaultValue: "Không thể kiểm tra nguyên liệu" }));
      setIngredientIssues([]);
    } finally {
      setCheckingIngredients(false);
    }
  }

  function handleAddToCart(p) {
    if (pendingOrder?.orderId) {
      message.warning(t("pos.cannotAddPending"));
      return;
    }
    setCustomizeProduct(p);
    setCustomizeData({ note: "", mucDuong: "100%", mucDa: "100%", quantity: 1 });
    setCustomizeOpen(true);
    checkAvailableIngredients([{
      drinkId: p.id,
      quantity: 1,
      mucDuong: "100%",
      mucDa: "100%",
    }]);
  }

  async function handleCustomizeOk() {
    if (!customizeProduct || ingredientIssues.length > 0) return;
    const p = customizeProduct;
    const quantity = customizeData.quantity || 1;

    setCart((prev) => {
      const idx = prev.findIndex((x) => x.drinkId === p.id && x.mucDuong === customizeData.mucDuong && x.mucDa === customizeData.mucDa && x.note === customizeData.note);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + quantity };
        return next;
      }
      return [...prev, {
        drinkId: p.id,
        name: p.name,
        price: p.price,
        promoPercent: p.promotionPercent,
        qty: quantity,
        note: customizeData.note,
        mucDuong: customizeData.mucDuong,
        mucDa: customizeData.mucDa,
      }];
    });
    setCustomizeOpen(false);
    message.success(t("pos.addedToCart", { name: p.name, defaultValue: `Đã thêm ${p.name} vào giỏ hàng` }));
  }

  async function createPendingInvoice() {
    if (!cart.length) return;
    try {
      const create = await api.post("/orders", {
        items: cart.map((c) => ({
          drinkId: c.drinkId,
          quantity: c.qty,
          note: c.note || undefined,
          mucDuong: c.mucDuong || "100%",
          mucDa: c.mucDa || "100%",
        })),
      });
      const orderId = create.data.orderId;
      const now = new Date();
      setPendingOrder({ orderId, at: now, items: cart, totals, staff: user?.name, note: "" });
      message.success(t("pos.pendingCreated", { id: orderId, defaultValue: `Đã lập hóa đơn #${orderId} (Chờ thanh toán)` }));
    } catch (err) {
      message.error(err?.response?.data?.message || t("pos.createPendingFailed", { defaultValue: "Lập hóa đơn thất bại" }));
    }
  }

  async function checkout() {
    if (!pendingOrder?.orderId) {
      message.warning(t("pos.needPendingBeforePay", { defaultValue: "Vui lòng lập hóa đơn trước khi thanh toán" }));
      return;
    }
    try {
      await api.put(`/orders/${pendingOrder.orderId}/complete`, {
        method: payMethod,
        customerPaid: payMethod === "TIEN_MAT" ? Number(customerPaid || 0) : undefined,
        note: orderNote,
      });
      message.success(t("pos.paySuccess", { defaultValue: "Thanh toán thành công" }));
      setPayOpen(false);
      setCustomerPaid(0);
      setPrinting({
        orderId: pendingOrder.orderId,
        at: new Date(),
        method: payMethod,
        items: pendingOrder.items,
        totals: pendingOrder.totals,
        staff: user?.name,
        note: orderNote.trim(),
        customerPaid: payMethod === "TIEN_MAT" ? Number(customerPaid || 0) : pendingOrder.totals.thanhTien,
        change: payMethod === "TIEN_MAT" ? Math.max(0, Number(customerPaid || 0) - pendingOrder.totals.thanhTien) : 0,
      });
      setPendingOrder(null);
      setCart([]);
      setOrderNote("");
      loadProducts();
    } catch (err) {
      message.error(err?.response?.data?.message || t("pos.payFailed", { defaultValue: "Thanh toán thất bại" }));
    }
  }

  function printInvoice() {
    const html = document.getElementById("invoice-print")?.innerHTML;
    if (!html) return;
    const w = window.open("", "PRINT", "height=650,width=480");
    w.document.write(`
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
        <body>${html}</body>
      </html>
    `);
    w.document.close();
    w.focus();
    w.print();
    w.close();
  }

  const columns = [
    {
      title: t("orderHistory.product"), dataIndex: "name", key: "name",
      render: (v, r) => (
        <div>
          <b>{v}</b>
          {r.note && <div style={{ fontSize: 11, color: "#888" }}>{t("common.note")}: {r.note}</div>}
          <div style={{ fontSize: 11, color: "#666" }}>{t("pos.sugarLevel")}: {r.mucDuong || "100%"} | {t("pos.iceLevel")}: {r.mucDa || "100%"}</div>
        </div>
      ),
    },
    {
      title: t("orderHistory.quantity"), dataIndex: "qty", key: "qty", width: 90,
      render: (v, r) => (
        <InputNumber
          min={1} value={v}
          onChange={(nv) => setCart((prev) => prev.map((x) => (x.drinkId === r.drinkId ? { ...x, qty: nv || 1 } : x)))}
        />
      ),
    },
    { title: t("orderHistory.unitPrice"), dataIndex: "price", key: "price", width: 110, render: (v) => money(v) },
    {
      title: "", key: "actions", width: 60,
      render: (_, r) => (
        <Button danger size="small" onClick={() => setCart((prev) => prev.filter((x) => x.drinkId !== r.drinkId))}>X</Button>
      ),
    },
  ];

  const renderCartContent = () => (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ flexShrink: 0, padding: "12px 16px", borderBottom: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Space>
          <Typography.Text strong style={{ fontSize: 15 }}>{t("pos.cart")}</Typography.Text>
          <Badge count={cart.length} />
        </Space>
        {cart.length > 0 && (
          <Button
            danger size="small"
            onClick={() => {
              Modal.confirm({
                title: t("pos.clearCartConfirmTitle"),
                content: t("pos.clearCartConfirmContent"),
                okText: t("common.delete"),
                cancelText: t("common.cancel"),
                okButtonProps: { danger: true },
                onOk() {
                  setCart([]);
                  setPendingOrder(null);
                  setOrderNote("");
                  message.success(t("pos.clearCartSuccess"));
                },
              });
            }}
          >
            {t("pos.clearCart")}
          </Button>
        )}
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "0 8px" }}>
        <Table size="small" rowKey="drinkId" dataSource={cart} columns={columns} pagination={false} locale={{ emptyText: t("pos.emptyCart", { defaultValue: "Chưa có món" }) }} />
      </div>
      <div style={{ flexShrink: 0, padding: "12px 16px", borderTop: "1px solid #f0f0f0", background: "#fff" }}>
        <Row gutter={8}>
          <Col span={8}><Statistic title={t("pos.total")} value={totals.tongTien} formatter={(v) => money(v)} /></Col>
          <Col span={8}><Statistic title={t("pos.discount")} value={totals.giamGia} formatter={(v) => money(v)} /></Col>
          <Col span={8}><Statistic title={t("pos.finalTotal")} value={totals.thanhTien} formatter={(v) => money(v)} /></Col>
        </Row>
        <Button style={{ marginTop: 10 }} block disabled={!cart.length} onClick={createPendingInvoice}>{t("pos.pendingInvoice")}</Button>
        <Button
          type="primary"
          size="large"
          block
          style={{ marginTop: 8 }}
          disabled={!pendingOrder?.orderId}
          onClick={() => {
            setPayMethod("TIEN_MAT");
            setCustomerPaid(totals.thanhTien);
            setOrderNote(pendingOrder?.note || "");
            setPayOpen(true);
          }}
        >
          {t("pos.pay")}
        </Button>
        {!!printing && (
          <div style={{ marginTop: 8 }}>
            <Button block onClick={printInvoice}>{t("pos.printInvoice")}</Button>
            <div id="invoice-print" style={{ display: "none" }}>
              <div className="receipt">
                <div className="receipt__brand">
                  <h3 className="receipt__title">Đô Đô Tea</h3>
                  <div className="receipt__sub">Hóa đơn thanh toán</div>
                </div>
                <div className="receipt__meta">
                  <div>Mã HĐ: #{printing.orderId}</div>
                  <div>{dayjs(printing.at).format("DD/MM/YYYY HH:mm")}</div>
                  <div>Nhân viên: {printing.staff}</div>
                </div>
                {printing.note && (
                  <div className="receipt__note">
                    <strong>Ghi chú đơn:</strong> {printing.note}
                  </div>
                )}
                <hr className="receipt__divider" />
                <table className="receipt__table">
                  <thead>
                    <tr>
                      <th align="left">Món</th>
                      <th align="right">SL</th>
                      <th align="right">Tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {printing.items.map((it) => (
                      <Fragment key={it.drinkId}>
                        <tr>
                          <td>{it.name}</td>
                          <td align="right">{it.qty}</td>
                          <td align="right">{money(it.price * it.qty - Math.round((it.price * it.qty * (it.promoPercent || 0)) / 100))}</td>
                        </tr>
                        <tr>
                          <td colSpan="3" className="receipt__item-detail">
                            {it.mucDuong && <div>Đường: {it.mucDuong}</div>}
                            {it.mucDa && <div>Đá: {it.mucDa}</div>}
                            {it.note && <div>Ghi chú: {it.note}</div>}
                          </td>
                        </tr>
                      </Fragment>
                    ))}
                  </tbody>
                </table>
                <hr className="receipt__divider" />
                <div className="receipt__total"><span>Tổng cộng</span><span>{money(printing.totals.thanhTien)}</span></div>
                <div className="receipt__method">PTTT: {printing.method === "TIEN_MAT" ? "Tiền mặt" : "Chuyển khoản"}</div>
                <div className="receipt__method">Tiền khách đưa: {money(printing.customerPaid)}</div>
                <div className="receipt__method">Tiền thừa: {money(printing.change)}</div>
                <p className="receipt__footer">Cảm ơn quý khách và hẹn gặp lại!</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div style={{
      height: "100vh",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      padding: 12,
      boxSizing: "border-box",
      background: "#f5f5f5",
    }}>
      {/* Thanh tìm kiếm cố định */}
      <div style={{
        flexShrink: 0,
        background: "#fff",
        borderRadius: 8,
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        padding: isMobile ? "8px 12px" : "10px 16px",
        marginBottom: isMobile ? 8 : 12,
        display: "flex",
        alignItems: "center",
        gap: isMobile ? 8 : 12,
        flexWrap: "wrap",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}>
        <Typography.Text strong style={{ fontSize: isMobile ? 13 : 15 }}>{t("pos.title")}</Typography.Text>
        <Select
          size={isMobile ? "middle" : "large"}
          placeholder={t("pos.productCategory")}
          allowClear
          value={categoryId}
          onChange={(v) => setCategoryId(v || null)}
          style={{ width: isMobile ? "100%" : 180 }}
          options={categories.map((c) => ({ value: c.id, label: c.name }))}
        />
        <Input.Search
          size={isMobile ? "middle" : "large"}
          placeholder={t("pos.searchProduct")}
          enterButton={
            <Button
              icon={<SearchOutlined />}
              style={isMobile ? { height: 46, width: 62 } : undefined}
            />
          }
          allowClear
          value={q}
          onSearch={(value) => setQ(value)}
          onChange={(e) => setQ(e.target.value)}
          style={{
            width: isMobile ? "100%" : 260,
          }}
          styles={
            isMobile
              ? {
                  input: { height: 46, fontSize: 16 },
                }
              : undefined
          }
        />
      </div>

      {/* Nội dung chính */}
      <div style={{ flex: 1, display: "flex", gap: 12, overflow: "hidden", minHeight: 0, flexDirection: isMobile ? "column" : "row" }}>
        {/* Cột trái: danh sách sản phẩm */}
        <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "repeat(2, minmax(0, 1fr))" : "repeat(4, minmax(0, 1fr))",
            gap: 12,
            alignItems: "start",
          }}>
            {products.map((p) => (
              <div
                key={p.id}
                onClick={() => handleAddToCart(p)}
                style={{
                  background: "#fff",
                  borderRadius: 8,
                  boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                  cursor: pendingOrder?.orderId ? "not-allowed" : "pointer",
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                  transition: "box-shadow 0.2s",
                  opacity: pendingOrder?.orderId ? 0.5 : 1,
                  minHeight: isMobile ? 250 : 0,
                }}
                onMouseEnter={e => !pendingOrder?.orderId && (e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.15)")}
                onMouseLeave={e => e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.08)"}
              >
                <div style={{ width: "100%", height: 110, overflow: "hidden", flexShrink: 0 }}>
                  <Image preview={false} src={p.imageUrl || productFallbackSvg(p.name)} fallback={productFallbackSvg(p.name)} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                </div>
                <div style={{ padding: 10, display: "flex", flexDirection: "column", flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 4, marginBottom: 2 }}>
                    <Typography.Text
                      strong
                      style={{
                        flex: 1,
                        fontSize: 13,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        minHeight: 36,
                      }}
                    >
                      {p.name}
                    </Typography.Text>
                    {!!p.promotionPercent && <Badge color="green" text={`-${p.promotionPercent}%`} />}
                  </div>
                  <Typography.Text type="secondary" style={{ fontSize: 11, marginBottom: 4 }}>{p.category?.name || "—"}</Typography.Text>
                  <div style={{ marginBottom: 6 }}>
                    <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                      {t("pos.maxCanMake")}:
                    </Typography.Text>{" "}
                    <Typography.Text
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: (p.maxCanMake ?? 0) > 0 ? "#389e0d" : "#cf1322",
                      }}
                    >
                      {p.maxCanMake ?? 0}
                    </Typography.Text>
                  </div>
                  <Typography.Text style={{ fontSize: 15, marginBottom: 8 }}>{money(p.price)}</Typography.Text>
                  <div style={{ flex: 1 }} />
                  <Button type="primary" block size="large" disabled={!!pendingOrder?.orderId}>{t("pos.addToCart")}</Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {!isMobile && (
          <div style={{
            width: 340,
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            background: "#fff",
            borderRadius: 8,
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            overflow: "hidden",
            minHeight: 0,
          }}>
            {renderCartContent()}
          </div>
        )}
      </div>

      {isMobile && (
        <>
          <Button
            type="primary"
            icon={<ShoppingCartOutlined />}
            onClick={() => setMobileCartOpen(true)}
            style={{
              position: "fixed",
              left: 16,
              bottom: 16,
              zIndex: 1100,
              borderRadius: 999,
              boxShadow: "0 6px 20px rgba(0,0,0,0.2)",
            }}
          >
            {t("pos.cart")} ({cart.length})
          </Button>

          <Drawer
            title={`${t("pos.cart")} (${cart.length})`}
            placement="bottom"
            height="78vh"
            open={mobileCartOpen}
            onClose={() => setMobileCartOpen(false)}
            destroyOnClose={false}
            styles={{ body: { padding: 0 } }}
          >
            {renderCartContent()}
          </Drawer>
        </>
      )}

      {/* MODAL CUSTOMIZE */}
      <Modal
        open={customizeOpen}
        onCancel={() => setCustomizeOpen(false)}
        onOk={handleCustomizeOk}
        okText={t("pos.addToCart")}
        cancelText={t("common.cancel")}
        title={`${t("pos.customize")}: ${customizeProduct?.name || ""}`}
        okButtonProps={{ disabled: ingredientIssues.length > 0 || checkingIngredients }}
        width={isMobile ? "95%" : 500}
      >
        <Space direction="vertical" style={{ width: "100%" }}>
          <div style={{ textAlign: "center" }}>
            <Image preview={false} src={customizeProduct?.imageUrl || productFallbackSvg(customizeProduct?.name)} fallback={productFallbackSvg(customizeProduct?.name)} alt={customizeProduct?.name} style={{ width: 150, height: 100, objectFit: "cover", borderRadius: 8 }} />
            <div style={{ marginTop: 8 }}>
              <Typography.Text strong>{customizeProduct?.name}</Typography.Text>
              <div style={{ fontSize: 14, color: "#666" }}>{money(customizeProduct?.price)}</div>
            </div>
          </div>
          <div>
            <Typography.Text strong>{t("pos.quantity")}</Typography.Text>
            <InputNumber min={1} value={customizeData.quantity} onChange={(v) => { const newQty = v || 1; setCustomizeData({ ...customizeData, quantity: newQty }); if (customizeProduct) checkAvailableIngredients([{ drinkId: customizeProduct.id, quantity: newQty, mucDuong: customizeData.mucDuong, mucDa: customizeData.mucDa }]); }} style={{ width: "100%" }} />
          </div>
          <div>
            <Typography.Text strong>{t("pos.note")}</Typography.Text>
            <Input.TextArea value={customizeData.note} onChange={(e) => setCustomizeData({ ...customizeData, note: e.target.value })} placeholder={t("pos.notePlaceholder")} rows={2} />
          </div>
          <div>
            <Typography.Text strong>{t("pos.sugarLevel")}</Typography.Text>
            <Radio.Group value={customizeData.mucDuong} onChange={(e) => { setCustomizeData({ ...customizeData, mucDuong: e.target.value }); if (customizeProduct) checkAvailableIngredients([{ drinkId: customizeProduct.id, quantity: customizeData.quantity || 1, mucDuong: e.target.value, mucDa: customizeData.mucDa }]); }}>
              <Radio value="50%">50% (ít)</Radio>
              <Radio value="70%">70% (vừa)</Radio>
              <Radio value="100%">100% (nhiều)</Radio>
            </Radio.Group>
          </div>
          <div>
            <Typography.Text strong>{t("pos.iceLevel")}</Typography.Text>
            <Radio.Group value={customizeData.mucDa} onChange={(e) => { setCustomizeData({ ...customizeData, mucDa: e.target.value }); if (customizeProduct) checkAvailableIngredients([{ drinkId: customizeProduct.id, quantity: customizeData.quantity || 1, mucDuong: customizeData.mucDuong, mucDa: e.target.value }]); }}>
              <Radio value="50%">50% (ít)</Radio>
              <Radio value="70%">70% (vừa)</Radio>
              <Radio value="100%">100% (nhiều)</Radio>
            </Radio.Group>
          </div>
          {ingredientIssues.length > 0 && (
            <div style={{ padding: 12, background: "#fff2f0", borderRadius: 6, borderLeft: "4px solid #ff4d4f" }}>
              <Typography.Text strong style={{ color: "#ff4d4f" }}>{t("pos.ingredientWarning")}</Typography.Text>
              <div style={{ marginTop: 8 }}>
                {ingredientIssues.map((ing) => (
                  <div key={ing.id} style={{ fontSize: 13, marginBottom: 6 }}>
                    <div><span style={{ color: "#ff4d4f", fontWeight: 500 }}>{ing.name}</span> ({ing.unit})</div>
                    <div style={{ fontSize: 12, color: "#666" }}>{t("pos.ingredientNeeded")}: {ing.needed} | {t("pos.ingredientAvailable")}: {ing.available} | {t("pos.ingredientShortage")}: <span style={{ color: "#ff4d4f", fontWeight: 500 }}>{ing.insufficient}</span></div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Space>
      </Modal>

      {/* MODAL THANH TOÁN */}
      <Modal
        open={payOpen}
        onCancel={() => setPayOpen(false)}
        onOk={checkout}
        okText={t("common.confirm")}
        cancelText={t("common.cancel")}
        title={t("pos.checkout")}
        okButtonProps={{ disabled: !cart.length }}
        width={isMobile ? "95%" : 520}
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
              <div style={{ marginTop: 8, color: "#888" }}>{t("pos.change")}: {money(Math.max(0, Number(customerPaid || 0) - totals.thanhTien))}</div>
            </div>
          )}
          <Divider style={{ margin: "12px 0" }} />
          {!!orderNote?.trim() && (
            <div>
              <Typography.Text strong>{t("pos.orderNote")}:</Typography.Text>
              <Typography.Paragraph
                style={{ marginBottom: 0, marginTop: 4 }}
                ellipsis={{ rows: 2, expandable: true, symbol: t("pos.viewDetail") }}
              >
                {orderNote.trim()}
              </Typography.Paragraph>
            </div>
          )}
          <Typography.Text strong>{t("pos.finalTotal")}: {money(totals.thanhTien)}</Typography.Text>
        </Space>
      </Modal>
    </div>
  );
}