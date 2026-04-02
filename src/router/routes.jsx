import DashboardPage from "@/features/dashboard/DashboardPage";
import WarehousePage from "@/features/warehouseManagement/WarehousePage";
import AppShell from "@/components/layout/AppShell";
import Login from "@/features/auth/pages/Login";
import Register from "@/features/auth/pages/Register";
import ForgotPassword from "@/features/auth/pages/ForgotPassword";
import VerifyEmail from "@/features/auth/pages/VerifyEmail";
import ProtectedRoute from "./ProtectedRoute";
import NotFound from "../components/shared/NotFound";
import StoreAuthorizationPage from "../features/systemConfigaration/storeAuthorization/StoreAuthorizationPage";
import SubAccountPage from "../features/systemConfigaration/subAccount/SubAccountPage";
import RoleManagementPage from "../features/systemConfigaration/roleManagement/RoleManagementPage";
import ProductListPage from "../features/productManagement/productList/ProductListPage";
import CombineSKUPage from "../features/productManagement/combineSKU/CombineSKUPage";
import NewOrderPage from "../features/orderManagement/orderProcessing/newOrder/NewOrderPage";
import ProcessedOrderPage from "../features/orderManagement/orderProcessing/processedOrder/ProcessedOrderPage";
import PickUpOrderPage from "../features/orderManagement/orderProcessing/pickUpOrder/PickUpOrderPage";
import ShippedOrderPage from "../features/orderManagement/orderProcessing/shippedOrder/ShippedOrderPage";
import CompletedPage from "../features/orderManagement/orderProcessing/completed/CompletedPage";
import AllOrderPage from "../features/orderManagement/orderProcessing/allOrder/AllOrderpage";
import CanceledOrderPage from "../features/orderManagement/orderProcessing/canceledOrder/CanceledOrderPage";
import ManualOrderPage from "../features/orderManagement/manualOrder/ManualOrderPage";
import InventoryListPage from "../features/inventoryManagement/inventoryList/InventoryListPage";
import ManualInboundPage from "../features/inventoryManagement/manualInbound/ManualInboundPage";
import OutboundOrderPage from "../features/inventoryManagement/outboundOrder/OutboundOrderPage";
import InventoryLogPage from "../features/inventoryManagement/inventoryLog/InventoryLogPage";
import AddCombineSKUPage from "../features/productManagement/combineSKU/AddCombineSKUPage";
import OrderDetailPage from "../features/orderManagement/orderProcessing/allOrder/component/OrderDetailPage";
import ByMerchantSKUMappingsPage from "../features/inventoryManagement/SKUMapping/byMerchantSKUMapping/ByMerchantSKUMappingsPage";
import ByProductSKUMappingsPage from "../features/inventoryManagement/SKUMapping/byProductSKUMapping/ByProductSKUMappingPage";
import MerchantSKUPage from "../features/inventoryManagement/merchantSKU/MerchantSKUPage";
import InboundCompletedPage from "../features/inventoryManagement/Inbound/completed/InboundCompletedPage";
import InboundOnTheWayPage from "../features/inventoryManagement/Inbound/onTheWay/InboundOnTheWayPage";
import InboundDraftPage from "../features/inventoryManagement/Inbound/draft/InboundDraftPage";

export const routes = [
  {
    path: "/warehouse_management",
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      // Dashboard Routes
      { index: true, element: <DashboardPage /> },

      // Product Management Routes
      {
        path: "/warehouse_management/products/list",
        element: <ProductListPage />,
      },
      {
        path: "/warehouse_management/products/combine_sku",
        element: <CombineSKUPage />,
      },
      {
        path: "/warehouse_management/products/combine_sku/add",
        element: <AddCombineSKUPage />,
      },

      // Inventory Management Routes
      {
        path: "/warehouse_management/inventory/merchant_SKU",
        element: <MerchantSKUPage />,
      },
      {
        path: "/warehouse_management/inventory/SKU_mapping/byProduct",
        element: <ByProductSKUMappingsPage />,
      },
      {
        path: "/warehouse_management/inventory/SKU_mapping/byMerchant",
        element: <ByMerchantSKUMappingsPage />,
      },
      {
        path: "/warehouse_management/inventory/list",
        element: <InventoryListPage />,
      },
      {
        path: "/warehouse_management/inventory/manual_inbound",
        element: <ManualInboundPage />,
      },
      {
        path: "/warehouse_management/inventory/inbound/draft",
        element: <InboundDraftPage />,
      },
      {
        path: "/warehouse_management/inventory/inbound/onTheWay",
        element: <InboundOnTheWayPage />,
      },
      {
        path: "/warehouse_management/inventory/inbound/completed",
        element: <InboundCompletedPage />,
      },
      {
        path: "/warehouse_management/inventory/outbound_order",
        element: <OutboundOrderPage />,
      },
      {
        path: "/warehouse_management/inventory/log",
        element: <InventoryLogPage />,
      },

      // Order Management Routes
      {
        path: "/warehouse_management/orders/processing/new_order",
        element: <NewOrderPage />,
      },
      {
        path: "/warehouse_management/orders/processing/processed",
        element: <ProcessedOrderPage />,
      },
      {
        path: "/warehouse_management/orders/processing/pick_up",
        element: <PickUpOrderPage />,
      },
      {
        path: "/warehouse_management/orders/processing/shipped",
        element: <ShippedOrderPage />,
      },
      {
        path: "/warehouse_management/orders/processing/completed",
        element: <CompletedPage />,
      },
      {
        path: "/warehouse_management/orders/processing/all_order",
        element: <AllOrderPage />,
      },
      {
        path: "/warehouse_management/orders/processing/canceled",
        element: <CanceledOrderPage />,
      },
      {
        path: "/warehouse_management/orders/manual_order",
        element: <ManualOrderPage />,
      },
      {
        path: "/warehouse_management/orders/detail/:id",
        element: <OrderDetailPage />,
      },

      // Warehouse Management Routes
      { path: "/warehouse_management/warehouse", element: <WarehousePage /> },

      // System Configaration Mantnageme Routes
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
