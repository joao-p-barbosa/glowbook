import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../../store/auth";

export function ProtectedRoute() {
  const ready = useAuthStore((s) => s.ready);
  const user = useAuthStore((s) => s.user);

  if (!ready) {
    return (
      <div className="loading-state" style={{ minHeight: "100vh" }}>
        Carregando…
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}
