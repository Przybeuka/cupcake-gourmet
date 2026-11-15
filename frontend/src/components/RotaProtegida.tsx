import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Carregando } from "./ui";

export function RotaProtegida({ children, admin = false }: { children: ReactNode; admin?: boolean }) {
  const { usuario, carregando } = useAuth();
  const local = useLocation();

  if (carregando) return <Carregando />;
  if (!usuario) return <Navigate to={`/entrar?voltar=${encodeURIComponent(local.pathname)}`} replace />;
  if (admin && usuario.perfil !== "ADMIN") return <Navigate to="/" replace />;
  return <>{children}</>;
}
