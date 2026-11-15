import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { api, enviarJson, eventosSessao, lerToken, salvarToken } from "../lib/api";
import type { Usuario } from "../types";

interface AuthValor {
  usuario: Usuario | null;
  carregando: boolean;
  entrar: (email: string, senha: string) => Promise<Usuario>;
  cadastrar: (dados: { nome: string; email: string; senha: string; confirmacao_senha: string }) => Promise<Usuario>;
  sair: () => void;
}

const AuthCtx = createContext<AuthValor | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(Boolean(lerToken()));

  const sair = useCallback(() => {
    salvarToken(null);
    setUsuario(null);
  }, []);

  useEffect(() => {
    if (!lerToken()) return;
    api<Usuario>("/api/auth/me")
      .then(setUsuario)
      .catch(() => salvarToken(null))
      .finally(() => setCarregando(false));
  }, []);

  useEffect(() => {
    eventosSessao.addEventListener("expirou", sair);
    return () => eventosSessao.removeEventListener("expirou", sair);
  }, [sair]);

  const aplicar = (r: { token: string; usuario: Usuario }) => {
    salvarToken(r.token);
    setUsuario(r.usuario);
    return r.usuario;
  };

  const entrar = async (email: string, senha: string) =>
    aplicar(await api("/api/auth/login", enviarJson("POST", { email, senha })));

  const cadastrar: AuthValor["cadastrar"] = async (dados) =>
    aplicar(await api("/api/auth/registrar", enviarJson("POST", dados)));

  return (
    <AuthCtx.Provider value={{ usuario, carregando, entrar, cadastrar, sair }}>{children}</AuthCtx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth fora do AuthProvider");
  return ctx;
}
