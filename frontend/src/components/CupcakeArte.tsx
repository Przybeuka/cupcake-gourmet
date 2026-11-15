/** Ilustração do cupcake quando o produto ainda não tem foto: a cobertura assume a cor do sabor. */

const SABORES: [RegExp, { cobertura: string; forminha: string; topo: string }][] = [
  [/red velvet/i, { cobertura: "#f6e9e4", forminha: "#a3242f", topo: "#a3242f" }],
  [/cenoura/i, { cobertura: "#5a3326", forminha: "#e88a3a", topo: "#e88a3a" }],
  [/chocolate|brigadeiro/i, { cobertura: "#5a3326", forminha: "#8a5a44", topo: "#2e1a14" }],
  [/lim[aã]o/i, { cobertura: "#f7eda0", forminha: "#d9c45c", topo: "#8fbf4d" }],
  [/frutas vermelhas|morango|framboesa/i, { cobertura: "#f2a7c3", forminha: "#b8336a", topo: "#c4122f" }],
  [/maracuj[aá]|coco/i, { cobertura: "#fff6d8", forminha: "#e9b53c", topo: "#f2a31b" }],
  [/doce de leite|caramelo/i, { cobertura: "#d9a066", forminha: "#a8703d", topo: "#f6e3c4" }],
  [/pistache/i, { cobertura: "#c5dba5", forminha: "#7fa36b", topo: "#5c8048" }],
];

const PADRAO = [
  { cobertura: "#f7c6d9", forminha: "#b8336a", topo: "#7fa36b" },
  { cobertura: "#d8e8c8", forminha: "#7fa36b", topo: "#b8336a" },
  { cobertura: "#f1dcc4", forminha: "#a8703d", topo: "#b8336a" },
];

export function coresDoSabor(nome: string, id: number) {
  return SABORES.find(([re]) => re.test(nome))?.[1] ?? PADRAO[id % PADRAO.length];
}

export function CupcakeArte({ nome, id, className = "" }: { nome: string; id: number; className?: string }) {
  const c = coresDoSabor(nome, id);
  return (
    <svg viewBox="0 0 120 120" className={className} role="img" aria-label={`Ilustração do cupcake ${nome}`}>
      <path d="M30 66h60l-8 40H38z" fill={c.forminha} />
      <path d="M42 66l3 40M54 66l1 40M66 66l-1 40M78 66l-3 40" stroke="#fff" strokeOpacity=".28" strokeWidth="3" />
      <path
        d="M24 68c-4 0-6-4-4-8 2-5 7-6 10-6-1-7 5-13 12-13 2-9 10-15 18-15s16 6 18 15c7 0 13 6 12 13 3 0 8 1 10 6 2 4 0 8-4 8z"
        fill={c.cobertura}
      />
      <path d="M36 52c8 4 20 5 30 3M44 38c8 3 18 3 26 0" stroke="#000" strokeOpacity=".07" strokeWidth="4" fill="none" strokeLinecap="round" />
      <circle cx="60" cy="18" r="7" fill={c.topo} />
      <path d="M60 11c2-5 6-7 10-7" stroke="#5c8048" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}
