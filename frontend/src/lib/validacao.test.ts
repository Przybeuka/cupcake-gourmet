import { mascaraCartao, mascaraCep, mascaraValidade } from "./formato";
import { emailValido, requisitosSenha, senhaValida } from "./validacao";

describe("HU 01 - validações de cadastro", () => {
  it("CA#1: valida formato do e-mail", () => {
    expect(emailValido("maria@exemplo.com")).toBe(true);
    expect(emailValido("maria.exemplo.com")).toBe(false);
    expect(emailValido("maria@exemplo")).toBe(false);
  });

  it("RN02: senha com 8+ caracteres, maiúscula e número", () => {
    expect(senhaValida("Senha123")).toBe(true);
    expect(senhaValida("senha123")).toBe(false);
    expect(senhaValida("Senhaaaa")).toBe(false);
    expect(senhaValida("Se1")).toBe(false);
    expect(requisitosSenha("abc").filter((r) => !r.ok)).toHaveLength(3);
  });
});

describe("máscaras de formulário", () => {
  it("formata CEP, cartão e validade", () => {
    expect(mascaraCep("80010000")).toBe("80010-000");
    expect(mascaraCartao("4111111111111111")).toBe("4111 1111 1111 1111");
    expect(mascaraValidade("1235")).toBe("12/35");
  });
});
