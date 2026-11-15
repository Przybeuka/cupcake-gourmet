/** Mesmas regras do back-end, para dar retorno imediato no formulário. */

export const emailValido = (email: string) => /^[^@\s]+@[^@\s]+\.[a-zA-Z]{2,}$/.test(email.trim());

/** RN02: retorna a lista de requisitos ainda não atendidos. */
export function requisitosSenha(senha: string) {
  return [
    { texto: "8 caracteres ou mais", ok: senha.length >= 8 },
    { texto: "uma letra maiúscula", ok: /[A-Z]/.test(senha) },
    { texto: "um número", ok: /\d/.test(senha) },
  ];
}

export const senhaValida = (senha: string) => requisitosSenha(senha).every((r) => r.ok);
