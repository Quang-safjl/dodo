import { Layout, Menu, Typography, Button, Avatar, Drawer } from "antd";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";
import {
  LogoutOutlined,
  GlobalOutlined,
  ShoppingCartOutlined,
  InboxOutlined,
  FileTextOutlined,
  BarChartOutlined,
  TagOutlined,
  TeamOutlined,
  HistoryOutlined,
  ContainerOutlined,
  MenuOutlined,
} from "@ant-design/icons";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { useTranslation } from "react-i18next";

const { Content, Header } = Layout;

const siderBg = "#4a2e1a";
const activeBg = "#6b3f22";
const hoverBg = "#5a3520";

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [lang, setLang] = useState(i18n.language?.startsWith("en") ? "en" : "vi");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");

  const selectedKey = location.pathname.startsWith("/dashboard")
    ? location.pathname
    : "/dashboard/pos";

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const allMenuItems = [
    {
      key: "/dashboard/pos",
      icon: <ShoppingCartOutlined />,
      label: <Link to="/dashboard/pos">{t("nav.pos")}</Link>,
    },
    {
      key: "/dashboard/inventory",
      icon: <InboxOutlined />,
      label: <Link to="/dashboard/inventory">{t("nav.inventory")}</Link>,
    },
    {
      key: "/dashboard/receipt",
      icon: <FileTextOutlined />,
      label: <Link to="/dashboard/receipt">{t("nav.receipt")}</Link>,
    },
    {
      key: "/dashboard/receipt-history",
      icon: <ContainerOutlined />,
      label: <Link to="/dashboard/receipt-history">{t("nav.receiptHistory")}</Link>,
    },
    {
      key: "/dashboard/revenue",
      icon: <BarChartOutlined />,
      label: <Link to="/dashboard/revenue">{t("nav.revenue")}</Link>,
    },
    {
      key: "/dashboard/order-history",
      icon: <HistoryOutlined />,
      label: <Link to="/dashboard/order-history">{t("nav.orderHistory")}</Link>,
    },
    {
      key: "/dashboard/promotions",
      icon: <TagOutlined />,
      label: <Link to="/dashboard/promotions">{t("nav.promotions")}</Link>,
    },
    {
      key: "/dashboard/employees",
      icon: <TeamOutlined />,
      label: <Link to="/dashboard/employees">{t("nav.employees")}</Link>,
    },
    {
      key: "/dashboard/menu",
      icon: <FileTextOutlined />,
      label: <Link to="/dashboard/menu">{t("nav.menu")}</Link>,
    },
  ];
  const menuItems =
    user?.role === "STAFF"
      ? allMenuItems.filter((item) => item.key === "/dashboard/pos")
      : allMenuItems;

  const avatarLetter = user?.name?.charAt(0)?.toUpperCase() || "U";

  const renderSidebarContent = () => (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Logo */}
      <div
        style={{
          padding: "20px 16px 16px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          borderBottom: `1px solid ${hoverBg}`,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: "#e07b2a",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20,
          }}
        >
          🧋
        </div>
        <div>
          <Typography.Text
            style={{
              color: "white",
              fontWeight: 700,
              fontSize: 14,
              display: "block",
              lineHeight: 1.3,
            }}
          >
            {t("app.name")}
          </Typography.Text>
          <Typography.Text
            style={{ color: "rgba(255,255,255,0.55)", fontSize: 11 }}
          >
            {t("app.subtitle")}
          </Typography.Text>
        </div>
      </div>

      {/* User info */}
      <div
        style={{
          padding: "14px 16px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          borderBottom: `1px solid ${hoverBg}`,
          marginBottom: 6,
        }}
      >
        <Avatar
          style={{ background: "#e07b2a", fontWeight: 700, flexShrink: 0 }}
        >
          {avatarLetter}
        </Avatar>
        <div>
          <Typography.Text
            style={{
              color: "white",
              fontWeight: 600,
              fontSize: 13,
              display: "block",
              lineHeight: 1.3,
            }}
          >
            {user?.name}
          </Typography.Text>
          <Typography.Text
            style={{ color: "rgba(255,255,255,0.55)", fontSize: 11 }}
          >
            {user?.role}
          </Typography.Text>
        </div>
      </div>

      {/* Nav Menu */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          style={{ background: "transparent", border: "none" }}
          theme="dark"
          onClick={() => isMobile && setMobileMenuOpen(false)}
          styles={{
            item: {
              borderRadius: 8,
              margin: "2px 8px",
              width: "calc(100% - 16px)",
            },
          }}
        />
      </div>

      {/* Bottom: Language + Logout */}
      <div
        style={{
          borderTop: `1px solid ${hoverBg}`,
          padding: "12px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <div style={{ display: "flex", gap: 6 }}>
          {["vi", "en"].map((l) => (
            <button
              key={l}
              onClick={() => {
                setLang(l);
                i18n.changeLanguage(l);
              }}
              style={{
                flex: 1,
                padding: "6px 0",
                borderRadius: 8,
                border: "none",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: 13,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 5,
                background: lang === l ? activeBg : "transparent",
                color: lang === l ? "white" : "rgba(255,255,255,0.5)",
                transition: "all 0.2s",
              }}
            >
              <GlobalOutlined style={{ fontSize: 13 }} />
              {l.toUpperCase()}
            </button>
          ))}
        </div>

        <Button
          type="text"
          icon={<LogoutOutlined />}
          onClick={handleLogout}
          style={{
            width: "100%",
            color: "#ff6b6b",
            fontWeight: 600,
            fontSize: 14,
            height: 38,
            borderRadius: 8,
          }}
        >
          {t("nav.logout")}
        </Button>
      </div>
    </div>
  );

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {!isMobile ? (
        <Layout.Sider
          width={220}
          breakpoint="lg"
          collapsedWidth="0"
          style={{
            background: siderBg,
            position: "fixed",
            height: "100vh",
            left: 0,
            top: 0,
            zIndex: 100,
          }}
        >
          {renderSidebarContent()}
        </Layout.Sider>
      ) : (
        <>
          <Button
            icon={<MenuOutlined />}
            onClick={() => setMobileMenuOpen(true)}
            style={{
              position: "fixed",
              top: 16,
              left: 16,
              zIndex: 100,
              background: siderBg,
              color: "white",
              border: "none",
            }}
          />
          <Drawer
            placement="left"
            open={mobileMenuOpen}
            onClose={() => setMobileMenuOpen(false)}
            bodyStyle={{ padding: 0, background: siderBg }}
            width={260}
          >
            {renderSidebarContent()}
          </Drawer>
        </>
      )}

      <Layout style={{ marginLeft: !isMobile ? 220 : 0 }}>
        <Header
          style={{
            background: "#fdf6ee",
            padding: isMobile ? "0 12px 0 56px" : "0 20px",
            borderBottom: "1px solid rgba(122,74,46,0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "sticky",
            top: 0,
            zIndex: 99,
          }}
        >
          <Typography.Text
            strong
            style={{
              color: "#3d2914",
              fontSize: isMobile ? 13 : 16,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: isMobile ? "70vw" : "none",
            }}
          >
            {t("app.title")}
          </Typography.Text>
          <span />
        </Header>

        <Content style={{ padding: 16 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}