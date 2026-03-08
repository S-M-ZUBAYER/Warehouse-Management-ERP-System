import DashboardPage from "@/features/dashboard/DashboardPage";
import InventoryPage from "@/features/inventory/InventoryPage";
import OrdersPage from "@/features/orders/OrdersPage";
import WarehousePage from "@/features/warehouse/WarehousePage";
import SuppliersPage from "@/features/suppliers/SuppliersPage";
import ReportsPage from "@/features/reports/ReportsPage";
import AppShell from "@/components/layout/AppShell";
import Login from "@/features/auth/pages/Login";
import Register from "@/features/auth/pages/Register";
import ForgotPassword from "@/features/auth/pages/ForgotPassword";
import VerifyEmail from "@/features/auth/pages/VerifyEmail";
import ProtectedRoute from "./ProtectedRoute";
import NotFound from "../components/shared/NotFound";
import StoreAuthorizationPage from "../features/systemConfigaration/storeAuthorization/storeAuthorizationPage";
import SubAccountPage from "../features/systemConfigaration/subAccount/SubAccountPage";
import RoleManagementPage from "../features/systemConfigaration/roleManagement/RoleManagementPage";
import ProductListPage from "../features/productManagement/productList/ProductListPage";
import CombineSKUPage from "../features/productManagement/combineSKU/CombineSKUPage";

export const routes = [
  {
    path: "/warehouse_management",
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      {
        path: "/warehouse_management/products/list",
        element: <ProductListPage />,
      },
      {
        path: "/warehouse_management/products/combine_sku",
        element: <CombineSKUPage />,
      },
      { path: "/warehouse_management/inventory", element: <InventoryPage /> },
      { path: "/warehouse_management/orders", element: <OrdersPage /> },
      { path: "/warehouse_management/warehouse", element: <WarehousePage /> },
      {
        path: "/warehouse_management/inventory/returns/requests",
        element: <InventoryPage />,
      },
      { path: "/warehouse_management/suppliers", element: <SuppliersPage /> },
      { path: "/warehouse_management/reports", element: <ReportsPage /> },

      {
        path: "/warehouse_management/config/store_authorization",
        element: <StoreAuthorizationPage />,
      },
      {
        path: "/warehouse_management/config/account_management/sub_account",
        element: <SubAccountPage />,
      },
      {
        path: "/warehouse_management/config/account_management/role_management",
        element: <RoleManagementPage />,
      },
    ],
  },
  { path: "warehouse_management/login", element: <Login /> },
  { path: "warehouse_management/register", element: <Register /> },
  { path: "warehouse_management/forgotpassword", element: <ForgotPassword /> },
  { path: "warehouse_management/verifyemail", element: <VerifyEmail /> },
  { path: "*", element: <NotFound /> },
];
