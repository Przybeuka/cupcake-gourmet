import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import { AuthProvider } from "../context/AuthContext";
import { ToastProvider } from "../context/ToastContext";
import Cadastro from "../pages/Cadastro";
import { etapasDoPedido, LinhaDoTempo } from "./LinhaDoTempo";
import { Seletor } from "./ui";

describe("HU 12 - linha do tempo", () => {
  it("delivery tem a etapa 'Saiu para entrega' e retirada não", () => {
    expect(etapasDoPedido("DELIVERY")).toContain("SAIU_PARA_ENTREGA");
    expect(etapasDoPedido("RETIRADA")).not.toContain("SAIU_PARA_ENTREGA");
  });

  it("marca a etapa atual", () => {
    render(<LinhaDoTempo status="EM_PREPARO" modalidade="DELIVERY" />);
    const atual = screen.getByText("Em preparo").closest("li");
    expect(atual).toHaveAttribute("aria-current", "step");
  });
});

describe("HU 06 - seletor de quantidade", () => {
  it("não permite menos que o mínimo nem mais que o máximo", async () => {
    const mudar = vi.fn();
    const { rerender } = render(<Seletor valor={1} max={3} onMudar={mudar} rotulo="Quantidade" />);
    expect(screen.getByLabelText("Diminuir")).toBeDisabled();
    await userEvent.click(screen.getByLabelText("Aumentar"));
    expect(mudar).toHaveBeenCalledWith(2);
    rerender(<Seletor valor={3} max={3} onMudar={mudar} rotulo="Quantidade" />);
    expect(screen.getByLabelText("Aumentar")).toBeDisabled();
  });
});

describe("HU 01 - formulário de cadastro", () => {
  const renderizar = () =>
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ToastProvider>
          <AuthProvider>
            <Cadastro />
          </AuthProvider>
        </ToastProvider>
      </MemoryRouter>,
    );

  it("mostra erros sem chamar o servidor quando os dados são inválidos", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    renderizar();
    await userEvent.type(screen.getByLabelText("E-mail"), "invalido");
    await userEvent.type(screen.getByLabelText("Senha"), "fraca");
    await userEvent.type(screen.getByLabelText("Confirme a senha"), "outra");
    await userEvent.click(screen.getByRole("button", { name: "Criar conta" }));

    expect(screen.getByText("Informe seu nome completo.")).toBeInTheDocument();
    expect(screen.getByText(/e-mail válido/)).toBeInTheDocument();
    expect(screen.getByText("As senhas não são iguais.")).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});
