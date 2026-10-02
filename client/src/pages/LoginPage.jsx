import { Button, Card, Form, Input, Space, Typography, message } from "antd";
import { GlobalOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { useTranslation } from "react-i18next";

export default function LoginPage() {
  const { login } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const isMobile = useMediaQuery("(max-width: 768px)");

  async function onFinish(values) {
    try {
      const user = await login(values.email, values.password);
      if (user.role === "STAFF") navigate("/dashboard/pos", { replace: true });
      else navigate("/dashboard/revenue", { replace: true });
    } catch (err) {
      message.error(err?.response?.data?.message || t("login.loginFailed", { defaultValue: "Đăng nhập thất bại" }));
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "linear-gradient(160deg, #fdf6ee 0%, #f0dcc8 45%, #e8cfa8 100%)",
        padding: isMobile ? 16 : 0,
      }}
    >
      <Card
        style={{
          width: isMobile ? "100%" : 420,
          maxWidth: 420,
          borderRadius: 16,
          boxShadow: "0 18px 48px rgba(61, 41, 20, 0.12)",
        }}
        bodyStyle={{ padding: isMobile ? 24 : 32 }}
      >
        <Typography.Title
          level={2}
          style={{
            textAlign: "center",
            marginBottom: 0,
            fontSize: isMobile ? 20 : 24,
          }}
        >
          {t("app.loginTitle")}
        </Typography.Title>

        <Typography.Text
          style={{
            display: "block",
            textAlign: "center",
            marginBottom: 12,
            color: "#d35400",
            fontSize: isMobile ? 14 : 16,
          }}
        >
          {t("app.loginSubtitle")}
        </Typography.Text>

        <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
          <Space size={8}>
            {["vi", "en"].map((lang) => (
              <Button
                key={lang}
                icon={<GlobalOutlined />}
                type={i18n.language?.startsWith(lang) ? "primary" : "default"}
                onClick={() => i18n.changeLanguage(lang)}
              >
                {lang.toUpperCase()}
              </Button>
            ))}
          </Space>
        </div>

        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item
            label={t("login.username")}
            name="email"
            rules={[
              { required: true, message: t("login.emailRequired") },
              { type: "email", message: t("login.emailInvalid") },
            ]}
          >
            <Input size="large" placeholder={t("login.emailPlaceholder")} />
          </Form.Item>

          <Form.Item
            label={t("login.password")}
            name="password"
            rules={[{ required: true, message: t("login.passwordRequired") }]}
          >
            <Input.Password size="large" placeholder={t("login.passwordPlaceholder")} />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            block
            size="large"
            style={{
              height: 48,
              background: "#ff6a00",
              border: "none",
              borderRadius: 8,
            }}
          >
            {t("login.loginButton")}
          </Button>
        </Form>

        <Typography.Paragraph
          style={{
            textAlign: "center",
            marginTop: 16,
            fontSize: isMobile ? 12 : 14,
          }}
        >
          {t("app.welcomeMessage")}
        </Typography.Paragraph>
      </Card>
    </div>
  );
}