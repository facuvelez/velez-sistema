import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import type { VehicleType, Usage, Load } from '@/utils/tireRecommendation';
import { MOTO_CATALOG, getMarcas, getModelos, type MotoEntry } from '@/utils/motoData';
import {
  CATEGORY_META, AGRICULTURAL_TREAD_TYPES, AGRICULTURAL_TECHNOLOGIES,
  OTR_TREAD_CODES, OTR_PLY_RATINGS, INDUSTRIAL_TREAD_TYPES,
  TRUCK_POSITIONS, TRUCK_PLY_RATINGS, ATV_TREAD_TYPES, ATV_PLY_RATINGS,
  type TireCategory, type TechExtras,
} from '@/utils/tireCalculatorExtended';

export interface TireFormValues {
  originalSize: string;
  originalLI: string;
  originalSR: string;
  nuevoSize: string;
  nuevoLI: string;
  nuevoSR: string;
  vehicleType: VehicleType | '';
  usage: Usage | '';
  load: Load | '';
}

interface Props {
  values: TireFormValues;
  onChange: (next: TireFormValues) => void;
  onCompare: () => void;
  canCompare: boolean;
  errors: { original?: string; nuevo?: string };
  category: TireCategory;
  onCategoryChange: (c: TireCategory) => void;
  extras: TechExtras;
  onExtrasChange: (e: TechExtras) => void;
}

const CATEGORIES: TireCategory[] = ['turismo', 'agricola', 'vial', 'industrial', 'camion', 'cuatriciclo'];

export const TireInputForm: React.FC<Props> = ({
  values, onChange, onCompare, canCompare, errors,
  category, onCategoryChange, extras, onExtrasChange,
}) => {
  const set = <K extends keyof TireFormValues>(k: K, v: TireFormValues[K]) =>
    onChange({ ...values, [k]: v });
  const setEx = <K extends keyof TechExtras>(k: K, v: TechExtras[K]) =>
    onExtrasChange({ ...extras, [k]: v });

  const meta = CATEGORY_META[category];
  const isTurismo = category === 'turismo';

  // Moto quick-select (solo turismo + vehicleType moto)
  const [selectedMarca, setSelectedMarca] = useState<string>('');
  const [selectedModelo, setSelectedModelo] = useState<string>('');
  const [selectedPosicion, setSelectedPosicion] = useState<'delantero' | 'trasero' | ''>('');
  const selectedEntry = useMemo<MotoEntry | null>(
    () => MOTO_CATALOG.find(m => m.marca === selectedMarca && m.modelo === selectedModelo) ?? null,
    [selectedMarca, selectedModelo]
  );
  useEffect(() => {
    if (values.vehicleType !== 'moto' || !isTurismo) {
      setSelectedMarca(''); setSelectedModelo(''); setSelectedPosicion('');
    }
  }, [values.vehicleType, isTurismo]);

  const handleAplicarMedida = () => {
    if (!selectedEntry || !selectedPosicion) return;
    const medida = selectedPosicion === 'delantero' ? selectedEntry.delantero : selectedEntry.trasero;
    onChange({ ...values, originalSize: medida.replace(/\s*-\s*/g, '-').trim() });
  };

  const treadOptions: Array<[string, string]> = useMemo(() => {
    if (category === 'agricola') return Object.entries(AGRICULTURAL_TREAD_TYPES).map(([k, v]) => [k, v.name]);
    if (category === 'vial') return Object.entries(OTR_TREAD_CODES).map(([k, v]) => [k, v.name]);
    if (category === 'industrial') return Object.entries(INDUSTRIAL_TREAD_TYPES).map(([k, v]) => [k, v.name]);
    if (category === 'cuatriciclo') return Object.entries(ATV_TREAD_TYPES).map(([k, v]) => [k, v.name]);
    return [];
  }, [category]);

  const prOptions: number[] = useMemo(() => {
    if (category === 'vial') return OTR_PLY_RATINGS;
    if (category === 'camion') return TRUCK_PLY_RATINGS;
    if (category === 'cuatriciclo') return ATV_PLY_RATINGS;
    if (category === 'agricola' || category === 'industrial') return [4, 6, 8, 10, 12, 14, 16, 18];
    return [];
  }, [category]);

  return (
    <Card>
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-base">Datos de comparación</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-3">
        {/* Selector de tipo de rodado */}
        <div>
          <Label className="text-xs">Tipo de rodado</Label>
          <Select value={category} onValueChange={(v) => onCategoryChange(v as TireCategory)}>
            <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>{CATEGORY_META[c].label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-1">{meta.sizeHint}</p>
        </div>

        {/* Medidas */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-end">
          <div className="lg:col-span-2 space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Medida original</h3>
            <Input
              value={values.originalSize}
              onChange={(e) => set('originalSize', e.target.value)}
              placeholder={meta.sizePlaceholder}
              className="h-8 text-sm"
            />
            {errors.original && <p className="text-xs text-destructive">{errors.original}</p>}
            <div className="grid grid-cols-2 gap-2">
              <Input
                value={values.originalLI}
                onChange={(e) => set('originalLI', e.target.value)}
                placeholder={`${meta.liPlaceholder} (LI)`}
                inputMode="numeric"
                className="h-8 text-sm"
              />
              <Input
                value={values.originalSR}
                onChange={(e) => set('originalSR', e.target.value.toUpperCase())}
                placeholder={`${meta.srPlaceholder} (vel.)`}
                className="h-8 text-sm"
              />
            </div>
          </div>

          <div className="lg:col-span-2 space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Medida nueva</h3>
            <Input
              value={values.nuevoSize}
              onChange={(e) => set('nuevoSize', e.target.value)}
              placeholder={meta.sizePlaceholder}
              className="h-8 text-sm"
            />
            {errors.nuevo && <p className="text-xs text-destructive">{errors.nuevo}</p>}
            <div className="grid grid-cols-2 gap-2">
              <Input
                value={values.nuevoLI}
                onChange={(e) => set('nuevoLI', e.target.value)}
                placeholder={`${meta.liPlaceholder} (LI)`}
                inputMode="numeric"
                className="h-8 text-sm"
              />
              <Input
                value={values.nuevoSR}
                onChange={(e) => set('nuevoSR', e.target.value.toUpperCase())}
                placeholder={`${meta.srPlaceholder} (vel.)`}
                className="h-8 text-sm"
              />
            </div>
          </div>

          <div className="lg:col-span-1 flex items-end justify-end">
            <Button onClick={onCompare} disabled={!canCompare} size="sm" className="w-full">
              Comparar medidas
            </Button>
          </div>
        </div>

        {/* Campos técnicos específicos por categoría */}
        {!isTurismo && (
          <div className="space-y-3 pt-2 border-t">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {prOptions.length > 0 && (
                <div>
                  <Label className="text-xs">PR / Capas</Label>
                  <Select value={extras.pr ?? ''} onValueChange={(v) => setEx('pr', v)}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent>
                      {prOptions.map((n) => (
                        <SelectItem key={n} value={String(n)}>{n} PR</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {category === 'camion' && (
                <div>
                  <Label className="text-xs">LI doble montaje</Label>
                  <Input
                    value={extras.liDoble ?? ''}
                    onChange={(e) => setEx('liDoble', e.target.value)}
                    placeholder="148"
                    inputMode="numeric"
                    className="h-8 text-sm"
                  />
                </div>
              )}
            </div>

            <AsistenteIdentificacion
              category={category}
              originalSize={values.originalSize}
              onDetected={(det) => {
                onExtrasChange({
                  ...extras,
                  tipoHuella: det.tipoHuella || extras.tipoHuella,
                  construccion: det.construccion,
                  camara: det.camara,
                  ...(category === 'camion' && det.posicion ? { posicion: det.posicion } : {}),
                });
              }}
            />
          </div>
        )}


        {/* Selectores comunes: vehículo/uso/carga */}
        <div className="grid grid-cols-3 gap-3 pt-2 border-t">
          <div>
            <Label className="text-xs">Tipo de vehículo</Label>
            <Select value={values.vehicleType} onValueChange={(v) => {
              const next = { ...values, vehicleType: v as VehicleType };
              if (v === 'moto' && (values.usage === 'mixto' || values.usage === 'offroad')) next.usage = '';
              else if (v !== 'moto' && v !== 'cuatriciclo' && values.usage === 'dual') next.usage = '';
              onChange(next);
            }}>
              <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto</SelectItem>
                <SelectItem value="suv-deportivo">SUV deportivo</SelectItem>
                <SelectItem value="camioneta">Camioneta / 4x4 / SUV</SelectItem>
                <SelectItem value="utilitario">Utilitario</SelectItem>
                <SelectItem value="moto">Moto</SelectItem>
                <SelectItem value="cuatriciclo">Cuatriciclo / ATV / UTV</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Uso predominante</Label>
            <Select value={values.usage} onValueChange={(v) => set('usage', v as Usage)}>
              <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
              <SelectContent>
                {values.vehicleType === 'moto' ? (
                  <>
                    <SelectItem value="ciudad">Ciudad</SelectItem>
                    <SelectItem value="ruta">Ruta</SelectItem>
                    <SelectItem value="dual">Dual (asfalto + tierra)</SelectItem>
                  </>
                ) : values.vehicleType === 'cuatriciclo' ? (
                  <>
                    <SelectItem value="ciudad">Ciudad / Trabajo liviano</SelectItem>
                    <SelectItem value="ruta">Ruta / Camino firme</SelectItem>
                    <SelectItem value="dual">Dual (mixto)</SelectItem>
                    <SelectItem value="offroad">Off-road intenso</SelectItem>
                  </>
                ) : (
                  <>
                    <SelectItem value="ciudad">Ciudad</SelectItem>
                    <SelectItem value="ruta">Ruta</SelectItem>
                    <SelectItem value="mixto">Mixto (ruta + tierra)</SelectItem>
                    <SelectItem value="offroad">Off-road</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Carga típica</Label>
            <Select value={values.load} onValueChange={(v) => set('load', v as Load)}>
              <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="liviana">Liviana</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="pesada">Pesada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Autocompletar moto (solo turismo) */}
        {isTurismo && values.vehicleType === 'moto' && (
          <div className="border rounded-md p-3 bg-muted/30 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Autocompletar desde catálogo
            </p>
            <p className="text-xs text-muted-foreground">
              ⚠️ El catálogo incluye marcas y modelos comunes pero puede no estar completo.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Select onValueChange={(v) => { setSelectedMarca(v); setSelectedModelo(''); setSelectedPosicion(''); }} value={selectedMarca}>
                <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Marca" /></SelectTrigger>
                <SelectContent>{getMarcas().map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select>
              <Select onValueChange={(v) => { setSelectedModelo(v); setSelectedPosicion(''); }} value={selectedModelo} disabled={!selectedMarca}>
                <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Modelo" /></SelectTrigger>
                <SelectContent>{getModelos(selectedMarca).map(e => <SelectItem key={e.modelo} value={e.modelo}>{e.modelo}</SelectItem>)}</SelectContent>
              </Select>
              <Select onValueChange={(v) => setSelectedPosicion(v as 'delantero' | 'trasero')} value={selectedPosicion} disabled={!selectedModelo}>
                <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="¿Cuál reemplazás?" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="delantero">Delantero</SelectItem>
                  <SelectItem value="trasero">Trasero</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {selectedEntry && selectedPosicion && (
              <div className="flex items-center gap-3 text-sm pt-1">
                <span className="text-muted-foreground">Medida de fábrica:</span>
                <span className="font-mono font-semibold">
                  {selectedPosicion === 'delantero' ? selectedEntry.delantero : selectedEntry.trasero}
                </span>
                <Button size="sm" variant="outline" className="h-7 text-xs ml-auto" onClick={handleAplicarMedida} type="button">
                  Aplicar como medida original
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// =============== Asistente conversacional de identificación ===============
interface AsistenteProps {
  category: TireCategory;
  originalSize: string;
  onDetected: (d: { tipoHuella: string; construccion?: 'R' | 'D'; camara: 'TL' | 'TT'; posicion?: string }) => void;
}

const detectarConstruccion = (medida: string): 'R' | 'D' | undefined => {
  const upper = (medida || '').toUpperCase();
  if (/\dR\d/.test(upper) || upper.includes('R')) return 'R';
  if (upper.includes('-') || upper.includes('X')) return 'D';
  return undefined;
};

const determinarHuella = (posicion: string, terreno: string, categoria: TireCategory): string => {
  if (categoria === 'agricola') {
    if (posicion === 'implemento') return terreno === 'duro' ? 'I-3' : 'I-1';
    if (posicion === 'delantera') return 'F-2';
    if (terreno === 'muy_humedo') return 'R-1W';
    if (terreno === 'duro') return 'R-4';
    return 'R-1';
  }
  if (categoria === 'vial') {
    if (terreno === 'roca') return 'E-3';
    if (terreno === 'muy_duro') return 'E-4';
    if (posicion === 'cargadora') return terreno === 'roca' ? 'L-3' : 'L-2';
    if (posicion === 'niveladora') return 'G-2';
    return 'E-2';
  }
  if (categoria === 'industrial') {
    if (posicion === 'interior') return 'I-1';
    return 'I-3';
  }
  if (categoria === 'camion') {
    if (posicion === 'direccion') return 'S';
    if (posicion === 'remolque') return 'T';
    if (posicion === 'all') return 'AP';
    return 'D';
  }
  if (categoria === 'cuatriciclo') {
    if (posicion === 'barro') return 'MUD';
    if (posicion === 'arena') return 'SAND';
    if (posicion === 'pasto') return 'TURF';
    if (posicion === 'duro') return 'UTILITY';
    return 'AT';
  }
  return '';
};

const OPCIONES_POSICION: Record<TireCategory, Array<{ val: string; label: string }>> = {
  turismo: [],
  agricola: [
    { val: 'trasera', label: '🚜 Rueda trasera (motriz)' },
    { val: 'delantera', label: '↔️ Rueda delantera' },
    { val: 'implemento', label: '🔧 Implemento / Remolque' },
  ],
  vial: [
    { val: 'excavadora', label: '⛏️ Retroexcavadora / Mototraílla' },
    { val: 'cargadora', label: '🏗️ Cargadora / Pala' },
    { val: 'niveladora', label: '🛣️ Motoniveladora' },
    { val: 'compactador', label: '🔨 Compactador / Rodillo' },
  ],
  industrial: [
    { val: 'interior', label: '🏭 Interior (piso liso, depósito)' },
    { val: 'mixto', label: '🔀 Mixto (interior + exterior)' },
    { val: 'exterior', label: '🌿 Exterior (terreno irregular)' },
  ],
  camion: [
    { val: 'traccion', label: '⚙️ Tracción (eje trasero motriz)' },
    { val: 'direccion', label: '🎯 Dirección (eje delantero)' },
    { val: 'remolque', label: '🚛 Remolque / Semi' },
    { val: 'all', label: '🔄 All Position (cualquier eje)' },
  ],
  cuatriciclo: [
    { val: 'mixto', label: '🌲 Sendero mixto (AT)' },
    { val: 'barro', label: '💧 Barro / Terreno húmedo' },
    { val: 'arena', label: '🏖️ Arena / Dunas' },
    { val: 'pasto', label: '🌿 Pasto / Jardín' },
    { val: 'duro', label: '🪨 Terreno duro / Granja' },
  ],
};

const OPCIONES_TERRENO: Partial<Record<TireCategory, Array<{ val: string; label: string }>>> = {
  agricola: [
    { val: 'blando', label: '🌾 Campo blando (tierra, cultivos)' },
    { val: 'muy_humedo', label: '💧 Barro / muy húmedo' },
    { val: 'mixto', label: '🔀 Mixto (campo + ruta)' },
    { val: 'duro', label: '🛣️ Principalmente ruta / asfalto' },
  ],
  vial: [
    { val: 'tierra', label: '🌍 Tierra / suelo blando' },
    { val: 'mixto', label: '🔀 Mixto (tierra + piedra)' },
    { val: 'roca', label: '🪨 Roca / cantera' },
    { val: 'muy_duro', label: '⛏️ Roca extrema / muy abrasivo' },
  ],
};

const PREGUNTA_POSICION: Record<TireCategory, string> = {
  turismo: '',
  agricola: '¿Dónde va montado este neumático?',
  vial: '¿En qué tipo de máquina va montado?',
  industrial: '¿En qué tipo de piso trabaja el equipo?',
  camion: '¿En qué posición va el neumático?',
  cuatriciclo: '¿Para qué tipo de terreno lo necesitás?',
};

const OptButton: React.FC<{ selected: boolean; onClick: () => void; label: string }> = ({ selected, onClick, label }) => (
  <button
    type="button"
    onClick={onClick}
    className={`text-left text-sm px-3 py-2 rounded-md border transition-colors ${
      selected
        ? 'border-primary bg-primary/10 text-primary font-medium'
        : 'border-border hover:bg-muted/50'
    }`}
  >
    {label}
  </button>
);

const AsistenteIdentificacion: React.FC<AsistenteProps> = ({ category, originalSize, onDetected }) => {
  const [respuestaPosicion, setRespuestaPosicion] = useState('');
  const [respuestaTerreno, setRespuestaTerreno] = useState('');
  const [respuestaCamara, setRespuestaCamara] = useState<'TL' | 'TT' | ''>('');

  // reset al cambiar categoría
  useEffect(() => {
    setRespuestaPosicion('');
    setRespuestaTerreno('');
    setRespuestaCamara('');
  }, [category]);

  const requiereTerreno = category === 'agricola' || category === 'vial';
  const puedePreguntarCamara =
    (respuestaPosicion && !requiereTerreno) || (respuestaPosicion && respuestaTerreno);

  const construccion = detectarConstruccion(originalSize);
  const huella = respuestaCamara
    ? determinarHuella(respuestaPosicion, respuestaTerreno || respuestaPosicion, category)
    : '';

  useEffect(() => {
    if (respuestaCamara && huella) {
      onDetected({
        tipoHuella: huella,
        construccion,
        camara: respuestaCamara as 'TL' | 'TT',
        posicion: category === 'camion' ? respuestaPosicion : undefined,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [respuestaCamara, huella, construccion]);

  const reset = () => {
    setRespuestaPosicion('');
    setRespuestaTerreno('');
    setRespuestaCamara('');
  };

  return (
    <div className="border rounded-md p-4 bg-muted/20 space-y-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
        🔍 Identificador automático de características
      </p>

      <div className="space-y-2">
        <p className="text-sm font-medium">{PREGUNTA_POSICION[category]}</p>
        <div className="grid grid-cols-2 gap-2">
          {OPCIONES_POSICION[category].map(op => (
            <OptButton
              key={op.val}
              selected={respuestaPosicion === op.val}
              onClick={() => { setRespuestaPosicion(op.val); setRespuestaTerreno(''); setRespuestaCamara(''); }}
              label={op.label}
            />
          ))}
        </div>
      </div>

      {respuestaPosicion && requiereTerreno && (
        <div className="space-y-2 border-t pt-3">
          <p className="text-sm font-medium">
            {category === 'agricola' ? '¿En qué tipo de terreno trabaja principalmente?' : '¿Con qué tipo de suelo trabaja?'}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {(OPCIONES_TERRENO[category] ?? []).map(op => (
              <OptButton
                key={op.val}
                selected={respuestaTerreno === op.val}
                onClick={() => { setRespuestaTerreno(op.val); setRespuestaCamara(''); }}
                label={op.label}
              />
            ))}
          </div>
        </div>
      )}

      {puedePreguntarCamara && (
        <div className="space-y-2 border-t pt-3">
          <p className="text-sm font-medium">¿Con cámara o sin cámara?</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { val: 'TL' as const, label: '🚫 Sin cámara (Tubeless)' },
              { val: 'TT' as const, label: '💿 Con cámara (Tube Type)' },
            ].map(op => (
              <OptButton
                key={op.val}
                selected={respuestaCamara === op.val}
                onClick={() => setRespuestaCamara(op.val)}
                label={op.label}
              />
            ))}
          </div>
        </div>
      )}

      {respuestaCamara && (
        <div className="border-t pt-3 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            ✅ Características detectadas automáticamente
          </p>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="bg-muted/30 rounded p-2">
              <p className="text-xs text-muted-foreground">Tipo de huella</p>
              <p className="font-medium">{huella}</p>
            </div>
            <div className="bg-muted/30 rounded p-2">
              <p className="text-xs text-muted-foreground">Construcción</p>
              <p className="font-medium">{construccion === 'R' ? 'Radial' : construccion === 'D' ? 'Diagonal' : 'No detectada'}</p>
            </div>
            <div className="bg-muted/30 rounded p-2">
              <p className="text-xs text-muted-foreground">Cámara</p>
              <p className="font-medium">{respuestaCamara}</p>
            </div>
          </div>
          <Button type="button" variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={reset}>
            🔄 Volver a responder
          </Button>
        </div>
      )}
    </div>
  );
};
