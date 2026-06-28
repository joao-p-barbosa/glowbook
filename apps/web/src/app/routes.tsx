import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppLayout } from "../components/layout/AppLayout";
import { ProtectedRoute } from "../features/auth/ProtectedRoute";
import { LoginPage } from "../pages/Login";
import { SignupPage } from "../pages/Signup";
import { AgendaPage } from "../pages/Agenda";
import { ListaPage } from "../pages/Lista";
import { ClientesPage } from "../pages/Clientes";
import { ServicosPage } from "../pages/Servicos";
import { EquipePage } from "../pages/Equipe";
import { ConfiguracoesPage } from "../pages/Configuracoes";

export const router = createBrowserRouter([
  { path: "/", element: <Navigate to="/app/agenda" replace /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/signup", element: <SignupPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/app",
        element: <AppLayout />,
        children: [
          { index: true, element: <Navigate to="/app/agenda" replace /> },
          { path: "agenda", element: <AgendaPage /> },
          { path: "agenda/lista", element: <ListaPage /> },
          { path: "clientes", element: <ClientesPage /> },
          { path: "servicos", element: <ServicosPage /> },
          { path: "equipe", element: <EquipePage /> },
          { path: "configuracoes", element: <ConfiguracoesPage /> },
        ],
      },
    ],
  },
  { path: "*", element: <Navigate to="/app/agenda" replace /> },
]);
