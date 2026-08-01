import { Navigate, useLocation } from "react-router-dom";
import { canAccessRoute, getStoredWarehouseUser } from "@/utils/permissions";

export default function ProtectedRoute({ children }) {
  const location = useLocation();

  const token = localStorage.getItem("whmAccessToken");
  const user = getStoredWarehouseUser();
  const loggedIn = Boolean(token);

  if (!loggedIn) {
    return <Navigate to="/warehouse_management/login" replace />;
  }

  if (!canAccessRoute(user, location.pathname)) {
    return <Navigate to="/warehouse_management" replace />;
  }

  return children;
}
