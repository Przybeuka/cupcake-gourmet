const BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ?? "";
const CHAVE_TOKEN = "cupcake.token";

export class ApiError extends Error {
  status: number;
  campo?: string;
  constructor(mensagem: string, status: number, campo?: string) {
    super(mensagem);
    this.status = status;
    this.campo = campo;
  }
}

export function lerToken(): string | null {
  try {
    return localStorage.getItem(CHAVE_TOKEN);
  } catch {
    return null;
  }
}

export function salvarToken(token: string | null) {
  try {
    if (token) localStorage.setItem(CHAVE_TOKEN, token);
    else localStorage.removeItem(CHAVE_TOKEN);
  } catch {
    /* navegação privada: a sessão vale só nesta aba */
  }
}

/** Avisa o app quando a sessão expira (401), para deslogar e mandar ao login. */
export const eventosSessao = new EventTarget();

export async function api<T>(caminho: string, opcoes: RequestInit = {}): Promise<T> {
  const headers = new Headers(opcoes.headers);
  const token = lerToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (opcoes.body && !(opcoes.body instanceof FormData)) headers.set("Content-Type", "application/json");

  let resposta: Response;
  try {
    resposta = await fetch(`${BASE}${caminho}`, { ...opcoes, headers });
  } catch {
    throw new ApiError("Sem conexão com o servidor. Verifique sua internet e tente de novo.", 0);
  }

  const corpo = await resposta.json().catch(() => null);
  if (!resposta.ok) {
    if (resposta.status === 401 && token) eventosSessao.dispatchEvent(new Event("expirou"));
    throw new ApiError(corpo?.erro ?? "Algo deu errado. Tente novamente.", resposta.status, corpo?.campo);
  }
  return corpo as T;
}

export const enviarJson = (metodo: string, dados: unknown): RequestInit => ({
  method: metodo,
  body: JSON.stringify(dados),
});
