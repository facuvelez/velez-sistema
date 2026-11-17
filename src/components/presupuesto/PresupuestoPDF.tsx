import React, { forwardRef } from 'react';
import logoVelez from '@/assets/logo-velez.png';

export interface PresupuestoPDFProps {
  cliente: string;
  vehiculo: string;
  items: { cantidad: number; descripcion: string; precioUnitario: number }[];
  incluirIVA: boolean;
  totalConIVA: number;
  totalSinIVA: number;
  fecha: string;
}

const fmt = (n: number) =>
  `$${(n || 0).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

export const PresupuestoPDF = forwardRef<HTMLDivElement, PresupuestoPDFProps>(
  ({ cliente, vehiculo, items, incluirIVA, totalConIVA, totalSinIVA, fecha }, ref) => {
    return (
      <div
        ref={ref}
        style={{
          width: '600px',
          background: '#ffffff',
          color: '#0f172a',
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: '13px',
          padding: '0',
          boxSizing: 'border-box',
          margin: '0 auto',
        }}
      >
        {/* Header */}
        <div
          style={{
            background: 'hsl(221 83% 53%)',
            color: '#ffffff',
            padding: '16px 24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: '6px',
          }}
        >
          <img
            src={logoVelez}
            alt="Velez Neumáticos"
            crossOrigin="anonymous"
            style={{ height: '128px', width: 'auto', borderRadius: '4px' }}
          />
          <div style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '1px', marginTop: '4px' }}>
            PRESUPUESTO ESTIMATIVO
          </div>
          <div style={{ fontSize: '13px', opacity: 0.95 }}>
            Berrotarán, Córdoba. Tel: 358 5181710
          </div>
        </div>

        {/* Cliente */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div><strong>Cliente:</strong> {cliente || '—'}</div>
            {vehiculo.trim() && (
              <div><strong>Vehículo:</strong> {vehiculo}</div>
            )}
            <div><strong>Fecha:</strong> {fecha}</div>
            <div>&nbsp;</div>
          </div>
        </div>

        {/* Tabla */}
        <div style={{ padding: '16px 24px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ background: '#f1f5f9' }}>
                <th style={thPct(8)}>Cant.</th>
                <th style={{ ...thPct(46), textAlign: 'left' }}>Descripción</th>
                <th style={thPct(20)}>P. Unit</th>
                <th style={thPct(26)}>Total</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ ...td, textAlign: 'center', color: '#64748b', padding: '24px' }}>
                    Sin ítems
                  </td>
                </tr>
              ) : (
                items.map((it, i) => (
                  <tr key={i}>
                    <td style={{ ...td, textAlign: 'center' }}>{it.cantidad || 0}</td>
                    <td style={{ ...td, textAlign: 'left' }}>{it.descripcion || '—'}</td>
                    <td style={{ ...td, textAlign: 'right' }}>{fmt(it.precioUnitario)}</td>
                    <td style={{ ...td, textAlign: 'right' }}>
                      {fmt((it.cantidad || 0) * (it.precioUnitario || 0))}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Totales */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
            <div style={{ minWidth: '220px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '10px 0',
                  fontSize: '16px',
                  fontWeight: 700,
                }}
              >
                <span>{incluirIVA ? 'TOTAL (sin IVA)' : 'TOTAL'}</span>
                <span>{fmt(incluirIVA ? totalSinIVA : totalConIVA)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            borderTop: '1px solid #e2e8f0',
            padding: '16px 24px',
            textAlign: 'center',
            color: '#475569',
            fontSize: '12px',
          }}
        >
          Velez Neumáticos
        </div>
      </div>
    );
  }
);

PresupuestoPDF.displayName = 'PresupuestoPDF';

const thPct = (pct: number): React.CSSProperties => ({
  border: '1px solid #cbd5e1',
  padding: '8px',
  textAlign: 'center',
  fontWeight: 600,
  width: `${pct}%`,
});

const td: React.CSSProperties = {
  border: '1px solid #e2e8f0',
  padding: '8px',
};

const Row: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
    <span style={{ color: '#475569' }}>{label}:</span>
    <span style={{ fontWeight: 500 }}>{value}</span>
  </div>
);
