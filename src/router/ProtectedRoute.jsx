// import { Navigate } from "react-router-dom";
// import { useAuthStore } from "@/stores/authStore";

// export default function ProtectedRoute({ children }) {
//   const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
//   return isAuthenticated ? children : <Navigate to="/login" replace />;
// }

export default function ProtectedRoute({ children }) {
  return children; // remove auth check until login page is built
}
