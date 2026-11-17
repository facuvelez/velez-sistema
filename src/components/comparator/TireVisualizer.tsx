import React from 'react';
import { fmtNum } from '@/utils/tireCalculator';

interface Props {
  diamOriginal: number; // mm
  diamNuevo: number;    // mm
}

export const TireVisualizer: React.FC<Props> = ({ diamOriginal, diamNuevo }) => {
  // SVG viewBox
  const W = 500;
  const H = 300;
  const padding = 20;

  // Cada círculo ocupa la mitad del ancho disponible
  const slotW = (W - padding * 2) / 2;
  const cxO = padding + slotW / 2;
  const cxN = padding + slotW + slotW / 2;

  // La escala se calcula para que el círculo más grande quepa en su slot con margen
  const scale = Math.min(
    (slotW - padding * 2) / Math.max(diamOriginal, diamNuevo),
    (H - 60) / Math.max(diamOriginal, diamNuevo)
  );
  const rO = (diamOriginal * scale) / 2;
  const rN = (diamNuevo * scale) / 2;
  const baseY = H - 30;

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full max-w-md mx-auto"
        role="img"
        aria-label="Comparación visual de neumáticos"
      >
        {/* Suelo */}
        <line
          x1={20}
          y1={baseY}
          x2={W - 20}
          y2={baseY}
          stroke="hsl(var(--border))"
          strokeWidth={2}
        />
        {/* Original */}
        <circle
          cx={cxO}
          cy={baseY - rO}
          r={rO}
          fill="none"
          stroke="hsl(var(--muted-foreground))"
          strokeWidth={2}
        />
        <text
          x={cxO}
          y={baseY + 18}
          textAnchor="middle"
          className="fill-muted-foreground"
          fontSize={11}
        >
          Original · {fmtNum(diamOriginal, 1)} mm
        </text>
        {/* Nueva */}
        <circle
          cx={cxN}
          cy={baseY - rN}
          r={rN}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth={2.5}
        />
        <text
          x={cxN}
          y={baseY + 18}
          textAnchor="middle"
          className="fill-primary"
          fontSize={11}
          fontWeight={600}
        >
          Nueva · {fmtNum(diamNuevo, 1)} mm
        </text>
      </svg>
    </div>
  );
};
