import { Navigate } from "react-router-dom";

export default function PublicOnlyRoute({ children }) {
  const token = localStorage.getItem("whmAccessToken");

  if (token) {
    return <Navigate to="/warehouse_management" replace />;
  }

  return children;
}
