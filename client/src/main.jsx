import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App as AntdApp, ConfigProvider } from "antd";
import viVN from "antd/locale/vi_VN";
import enUS from "antd/locale/en_US";
import { useEffect, useState } from "react";
import "./index.css";
import AppRoot from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { dodoTheme } from "./theme/antdTheme.js";
import i18n from "./i18n.js";

function Root() {
  const [antdLocale, setAntdLocale] = useState(
    i18n.language?.startsWith("en") ? enUS : viVN,
  );

  useEffect(() => {
    const onLanguageChanged = (lng) => {
      setAntdLocale(lng?.startsWith("en") ? enUS : viVN);
    };
    i18n.on("languageChanged", onLanguageChanged);
    return () => i18n.off("languageChanged", onLanguageChanged);
  }, []);

  return (
    <ConfigProvider locale={antdLocale} theme={dodoTheme}>
      <AntdApp>
        <BrowserRouter>
          <AuthProvider>
            <AppRoot />
          </AuthProvider>
        </BrowserRouter>
      </AntdApp>
    </ConfigProvider>
  );
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Root />
  </StrictMode>
);
