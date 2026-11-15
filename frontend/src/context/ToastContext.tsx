import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

type Tipo = "sucesso" | "erro";
interface Toast { id: number; texto: string; tipo: Tipo }

const ToastCtx = createContext<(texto: string, tipo?: Tipo) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const mostrar = useCallback((texto: string, tipo: Tipo = "sucesso") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t.slice(-2), { id, texto, tipo }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);

  return (
    <ToastCtx.Provider value={mostrar}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.tipo === "erro" ? "alert" : "status"}
            className={`toast-entrada pointer-events-auto max-w-sm rounded-xl px-4 py-3 text-sm font-medium shadow-lg ${
              t.tipo === "erro" ? "bg-alerta text-white" : "bg-tinta text-white"
            }`}
          >
            {t.texto}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export const useToast = () => useContext(ToastCtx);
