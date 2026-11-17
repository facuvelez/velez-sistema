import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { CheckCircle2, AlertTriangle, XCircle, Gauge } from 'lucide-react';
import {
  fmtNum, formatPct,
  type VerdictResult, type CheckStatus,
} from '@/utils/tireCalculator';
import {
  loadKgFor, speedKmhFor,
  AGRICULTURAL_TREAD_TYPES, AGRICULTURAL_TECHNOLOGIES,
  OTR_TREAD_CODES, INDUSTRIAL_TREAD_TYPES,
  TRUCK_POSITIONS,
  ATV_TREAD_TYPES,
  type TireCategory, type TechExtras,
} from '@/utils/tireCalculatorExtended';
import type { Recommendation } from '@/utils/tireRecommendation';
import { TireVisualizer } from './TireVisualizer';

interface Props {
  verdict: VerdictResult;
  originalLabel: string;
  nuevoLabel: string;
  originalLI?: number;
  nuevoLI?: number;
  originalSR?: string;
  nuevoSR?: string;
  recommendation: Recommendation;
  category?: TireCategory;
  extras?: TechExtras;
}

const statusIcon = (s: CheckStatus, className = 'h-5 w-5') => {
  if (s === 'ok') return <CheckCircle2 className={`${className} text-emerald-600`} />;
  if (s === 'warn') return <AlertTriangle className={`${className} text-amber-600`} />;
  return <XCircle className={`${className} text-destructive`} />;
};

const verdictLabel = (s: CheckStatus) => {
  if (s === 'ok') return 'Apto';
  if (s === 'warn') return 'Apto con observaciones';
  return 'No recomendado';
};

const verdictBadgeClass = (s: CheckStatus) => {
  if (s === 'ok') return 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-100';
  if (s === 'warn') return 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-100';
  return 'bg-red-100 text-red-800 border-red-300 hover:bg-red-100';
};

export const TireResultPanel: React.FC<Props> = ({
  verdict, originalLabel, nuevoLabel, originalLI, nuevoLI, originalSR, nuevoSR, recommendation,
  category = 'turismo', extras = {},
}) => {
  const drift = verdict.speedometerDrift;
  const dir = verdict.speedometerDirection;
  const velMarcada = Math.round(100 / (1 + drift / 100));
  const li = (n?: number) => (n != null ? loadKgFor(category, n) : null);
  const sr = (s?: string) => (s ? speedKmhFor(category, s) : null);

  return (
    <div className="space-y-4">
      {/* Fila 1: Veredicto + Comparativa */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start">
        <div className="md:col-span-2">
          {/* Veredicto */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <CardTitle className="text-lg">Veredicto técnico</CardTitle>
                <Badge variant="outline" className={`text-sm px-3 py-1 ${verdictBadgeClass(verdict.global)}`}>
                  {statusIcon(verdict.global, 'h-4 w-4 mr-1 inline-block')}
                  {verdictLabel(verdict.global)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <TireVisualizer diamOriginal={verdict.diamOriginal} diamNuevo={verdict.diamNuevo} />
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-3">
          {/* Tabla comparativa */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Comparativa</CardTitle></CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Parámetro</TableHead>
                    <TableHead>Original</TableHead>
                    <TableHead>Nueva</TableHead>
                    <TableHead>Diferencia</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Medida</TableCell>
                    <TableCell>{originalLabel}</TableCell>
                    <TableCell>{nuevoLabel}</TableCell>
                    <TableCell>—</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Diámetro exterior</TableCell>
                    <TableCell>{fmtNum(verdict.diamOriginal, 1)} mm</TableCell>
                    <TableCell>{fmtNum(verdict.diamNuevo, 1)} mm</TableCell>
                    <TableCell>{fmtNum(verdict.diamNuevo - verdict.diamOriginal, 1)} mm ({formatPct(((verdict.diamNuevo - verdict.diamOriginal) / verdict.diamOriginal) * 100)})</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Altura de flanco</TableCell>
                    <TableCell>{fmtNum(verdict.flancoOriginal, 1)} mm</TableCell>
                    <TableCell>{fmtNum(verdict.flancoNuevo, 1)} mm</TableCell>
                    <TableCell>{fmtNum(verdict.flancoNuevo - verdict.flancoOriginal, 1)} mm ({formatPct(((verdict.flancoNuevo - verdict.flancoOriginal) / verdict.flancoOriginal) * 100)})</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Circunferencia</TableCell>
                    <TableCell>{fmtNum(verdict.circOriginal, 1)} mm</TableCell>
                    <TableCell>{fmtNum(verdict.circNuevo, 1)} mm</TableCell>
                    <TableCell>{fmtNum(verdict.circNuevo - verdict.circOriginal, 1)} mm ({formatPct(((verdict.circNuevo - verdict.circOriginal) / verdict.circOriginal) * 100)})</TableCell>
                  </TableRow>
                  {originalLI != null && nuevoLI != null && (
                    <TableRow>
                      <TableCell className="font-medium">Índice de carga</TableCell>
                      <TableCell>{originalLI} ({li(originalLI) ?? '—'} kg)</TableCell>
                      <TableCell>{nuevoLI} ({li(nuevoLI) ?? '—'} kg)</TableCell>
                      <TableCell>
                        {li(nuevoLI) != null && li(originalLI) != null
                          ? `${(li(nuevoLI)! - li(originalLI)!).toString().replace(/^(?!-)/, '+')} kg`
                          : '—'}
                      </TableCell>
                    </TableRow>
                  )}
                  {originalSR && nuevoSR && (
                    <TableRow>
                      <TableCell className="font-medium">Código de velocidad</TableCell>
                      <TableCell>{originalSR} ({sr(originalSR) ?? '—'} km/h)</TableCell>
                      <TableCell>{nuevoSR} ({sr(nuevoSR) ?? '—'} km/h)</TableCell>
                      <TableCell>—</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Fila 2: Velocímetro + Análisis técnico */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
        {/* Velocímetro */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Gauge className="h-5 w-5" /> Impacto en el velocímetro
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {dir === 'none' && (
              <p className="text-muted-foreground">
                Sin desvío significativo en el velocímetro (diferencia menor al 0,5%).
              </p>
            )}
            {dir === 'reads-less' && (
              <>
                <p>
                  El neumático nuevo es <strong>más grande</strong> → el velocímetro va a marcar{' '}
                  <strong>menos</strong> de lo que realmente vas.
                </p>
                <p>
                  A <strong>100 km/h reales</strong>, el tablero mostrará <strong>~{velMarcada} km/h</strong>.
                </p>
                <p className="flex items-start gap-2 text-amber-700 dark:text-amber-500 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-md p-3 mt-2">
                  <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>
                    Estás yendo <strong>más rápido</strong> de lo que creés — tenelo en cuenta en ruta y en zonas con control de velocidad.
                  </span>
                </p>
              </>
            )}
            {dir === 'reads-more' && (
              <>
                <p>
                  El neumático nuevo es <strong>más chico</strong> → el velocímetro va a marcar{' '}
                  <strong>más</strong> de lo que realmente vas.
                </p>
                <p>
                  A <strong>100 km/h reales</strong>, el tablero mostrará <strong>~{velMarcada} km/h</strong>.
                </p>
                <p className="text-muted-foreground">
                  Vas más lento de lo que indica el tablero.
                </p>
              </>
            )}
            <p className="text-xs text-muted-foreground pt-1">
              Desvío calculado: {formatPct(drift)}
            </p>
          </CardContent>
        </Card>

        {/* Checks */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Análisis técnico</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {verdict.checks.map((c) => (
                <li key={c.label} className="flex items-start gap-3">
                  {statusIcon(c.status)}
                  <div>
                    <p className="font-medium text-sm">{c.label}</p>
                    <p className="text-sm text-muted-foreground">{c.detail}</p>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Fila 3: Recomendación */}
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader><CardTitle className="text-lg">Tipo de cubierta recomendado</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <p className="text-2xl font-bold text-primary">{recommendation.type}</p>
          <p className="text-sm">{recommendation.reason}</p>
          {recommendation.alert && (
            <p className="flex items-start gap-2 text-amber-700 dark:text-amber-500 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-md p-3 text-sm mt-2">
              <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{recommendation.alert}</span>
            </p>
          )}
        </CardContent>
      </Card>

      {/* Fila 4: Referencia técnica según categoría */}
      {category !== 'turismo' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">📚 Referencia técnica — {category === 'agricola' ? 'Agrícola' : category === 'vial' ? 'OTR / Vial' : category === 'industrial' ? 'Industrial' : category === 'camion' ? 'Camión' : 'ATV / UTV'}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            {extras.construccion && (
              <p><strong>Construcción:</strong> {extras.construccion === 'R'
                ? 'Radial — mayor superficie de contacto, menos compactación, más duradera.'
                : 'Diagonal (Bias) — más rígida, mayor resistencia a cortes, ideal para terrenos muy duros.'}</p>
            )}
            {extras.pr && <p><strong>PR (Capas):</strong> {extras.pr} PR — indica resistencia estructural y capacidad de carga.</p>}

            {category === 'agricola' && extras.tipoHuella && AGRICULTURAL_TREAD_TYPES[extras.tipoHuella] && (
              <p><strong>Tipo de huella:</strong> {AGRICULTURAL_TREAD_TYPES[extras.tipoHuella].name} — {AGRICULTURAL_TREAD_TYPES[extras.tipoHuella].desc}</p>
            )}
            {category === 'agricola' && extras.tecnologia && AGRICULTURAL_TECHNOLOGIES[extras.tecnologia] && (
              <p><strong>Tecnología {extras.tecnologia}:</strong> {AGRICULTURAL_TECHNOLOGIES[extras.tecnologia]}</p>
            )}

            {category === 'vial' && extras.tipoHuella && OTR_TREAD_CODES[extras.tipoHuella] && (
              <>
                <p><strong>Código de huella:</strong> {OTR_TREAD_CODES[extras.tipoHuella].name}</p>
                <p><strong>Aplicación:</strong> {OTR_TREAD_CODES[extras.tipoHuella].desc}</p>
              </>
            )}

            {category === 'industrial' && extras.tipoHuella && INDUSTRIAL_TREAD_TYPES[extras.tipoHuella] && (
              <p><strong>Tipo de huella:</strong> {INDUSTRIAL_TREAD_TYPES[extras.tipoHuella].name} — {INDUSTRIAL_TREAD_TYPES[extras.tipoHuella].desc}</p>
            )}

            {category === 'camion' && extras.posicion && TRUCK_POSITIONS[extras.posicion] && (
              <p><strong>Posición:</strong> {TRUCK_POSITIONS[extras.posicion].name} — {TRUCK_POSITIONS[extras.posicion].desc}</p>
            )}
            {category === 'camion' && originalLI != null && (
              <p><strong>LI simple:</strong> {originalLI} → {loadKgFor('camion', originalLI) ?? '—'} kg</p>
            )}
            {category === 'camion' && extras.liDoble && (
              <p><strong>LI doble montaje:</strong> {extras.liDoble} → {loadKgFor('camion', parseInt(extras.liDoble, 10)) ?? '—'} kg</p>
            )}

            {category === 'cuatriciclo' && extras.tipoHuella && ATV_TREAD_TYPES[extras.tipoHuella] && (
              <>
                <p><strong>Tipo de huella:</strong> {ATV_TREAD_TYPES[extras.tipoHuella].name}</p>
                <p><strong>Uso recomendado:</strong> {ATV_TREAD_TYPES[extras.tipoHuella].desc}</p>
              </>
            )}

            {!extras.construccion && !extras.pr && !extras.tipoHuella && !extras.tecnologia && !extras.posicion && !extras.liDoble && (
              <p className="text-muted-foreground italic">Completá los campos técnicos del formulario para ver información específica.</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
