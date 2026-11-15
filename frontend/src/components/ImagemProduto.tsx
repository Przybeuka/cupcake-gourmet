import { useState } from "react";
import { coresDoSabor, CupcakeArte } from "./CupcakeArte";

interface Props {
  nome: string;
  id: number;
  url: string | null;
  className?: string;
  glace?: boolean;
}

/** Foto do produto com recorte de glacê; sem foto (ou se falhar), mostra a ilustração do sabor. */
export function ImagemProduto({ nome, id, url, className = "", glace = true }: Props) {
  const [falhou, setFalhou] = useState(false);
  const fundo = coresDoSabor(nome, id).cobertura;

  return (
    <div
      className={`relative overflow-hidden ${glace ? "glace" : ""} ${className}`}
      style={{ background: `color-mix(in srgb, ${fundo} 35%, white)` }}
    >
      {url && !falhou ? (
        <img
          src={url}
          alt={nome}
          loading="lazy"
          onError={() => setFalhou(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <CupcakeArte nome={nome} id={id} className="mx-auto h-full w-full p-[10%] pt-[14%]" />
      )}
    </div>
  );
}
