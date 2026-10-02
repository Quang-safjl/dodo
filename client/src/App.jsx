import { Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import PosPage from "./pages/PosPage";
import DashboardLayout from "./pages/DashboardLayout";
import RevenueReportPage from "./pages/RevenueReportPage";
import InventoryPage from "./pages/InventoryPage";
import ReceiptPage from "./pages/ReceiptPage";
import MenuPage from "./pages/MenuPage";
import PromotionsPage from "./pages/PromotionsPage";
import EmployeesPage from "./pages/EmployeesPage";
import ReceiptHistoryPage from "./pages/ReceiptHistoryPage";
import OrderHistoryPage from "./pages/OrderHistoryPage";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";

function PosEntry() {
  return <Navigate to="/dashboard/pos" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/pos"
        element={
          <ProtectedRoute roles={["STAFF", "MANAGER", "ADMIN"]}>
            <PosEntry />
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute roles={["STAFF", "MANAGER", "ADMIN"]}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard/pos" replace />} />
        <Route path="pos" element={<PosPage />} />
        <Route
          path="revenue"
          element={
            <ProtectedRoute roles={["MANAGER", "ADMIN"]}>
              <RevenueReportPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="order-history"
          element={
            <ProtectedRoute roles={["MANAGER", "ADMIN"]}>
              <OrderHistoryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="inventory"
          element={
            <ProtectedRoute roles={["MANAGER", "ADMIN"]}>
              <InventoryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="receipt"
          element={
            <ProtectedRoute roles={["MANAGER", "ADMIN"]}>
              <ReceiptPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="receipt-history"
          element={
            <ProtectedRoute roles={["MANAGER", "ADMIN"]}>
              <ReceiptHistoryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="menu"
          element={
            <ProtectedRoute roles={["MANAGER", "ADMIN"]}>
              <MenuPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="promotions"
          element={
            <ProtectedRoute roles={["MANAGER", "ADMIN"]}>
              <PromotionsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="employees"
          element={
            <ProtectedRoute roles={["ADMIN", "MANAGER"]}>
              <EmployeesPage />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="/" element={<Navigate to="/pos" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}