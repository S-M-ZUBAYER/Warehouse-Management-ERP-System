import DashboardPage from "@/features/dashboard/DashboardPage";
import InventoryPage from "@/features/inventory/InventoryPage";
import OrdersPage from "@/features/orders/OrdersPage";
import WarehousePage from "@/features/warehouse/WarehousePage";
import SuppliersPage from "@/features/suppliers/SuppliersPage";
import ReportsPage from "@/features/reports/ReportsPage";
import SettingsPage from "@/features/settings/SettingsPage";
import AppShell from "@/components/layout/AppShell";
import Login from "@/features/auth/pages/Login";
import Register from "@/features/auth/pages/Register";
import ForgotPassword from "@/features/auth/pages/ForgotPassword";
import VerifyEmail from "@/features/auth/pages/VerifyEmail";
import ProtectedRoute from "./ProtectedRoute";

export const routes = [
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "inventory", element: <InventoryPage /> },
      { path: "orders", element: <OrdersPage /> },
      { path: "warehouse", element: <WarehousePage /> },
      { path: "suppliers", element: <SuppliersPage /> },
      { path: "reports", element: <ReportsPage /> },
      { path: "settings", element: <SettingsPage /> },
      // { path: "/login", element: <Login /> },
      // { path: "/register", element: <Register /> },
      // { path: "/forgotpassword", element: <ForgotPassword /> },
      // { path: "/verifyemail", element: <VerifyEmail /> },
    ],
  },
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },
  { path: "/forgotpassword", element: <ForgotPassword /> },
  { path: "/verifyemail", element: <VerifyEmail /> },
];
