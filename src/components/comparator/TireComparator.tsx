import React, { useMemo, useState } from 'react';
import { TireInputForm, type TireFormValues } from './TireInputForm';
import { TireResultPanel } from './TireResultPanel';
import { type VerdictResult } from '@/utils/tireCalculator';
import { getRecommendation, type Recommendation } from '@/utils/tireRecommendation';
import {
  parseTireByCategory, calcVerdictExtended,
  type TireCategory, type TechExtras,
} from '@/utils/tireCalculatorExtended';

const EMPTY: TireFormValues = {
  originalSize: '', originalLI: '', originalSR: '',
  nuevoSize: '', nuevoLI: '', nuevoSR: '',
  vehicleType: '', usage: '', load: '',
};

interface ResultState {
  verdict: VerdictResult;
  recommendation: Recommendation;
  originalLabel: string;
  nuevoLabel: string;
  originalLI?: number;
  nuevoLI?: number;
  originalSR?: string;
  nuevoSR?: string;
  category: TireCategory;
  extras: TechExtras;
}

export const TireComparator: React.FC = () => {
  const [category, setCategory] = useState<TireCategory>('turismo');
  const [values, setValues] = useState<TireFormValues>(EMPTY);
  const [extras, setExtras] = useState<TechExtras>({});
  const [result, setResult] = useState<ResultState | null>(null);

  const errors = useMemo(() => {
    const e: { original?: string; nuevo?: string } = {};
    if (values.originalSize.trim()) {
      try { parseTireByCategory(category, values.originalSize); } catch (err: any) { e.original = err.message; }
    }
    if (values.nuevoSize.trim()) {
      try { parseTireByCategory(category, values.nuevoSize); } catch (err: any) { e.nuevo = err.message; }
    }
    return e;
  }, [values.originalSize, values.nuevoSize, category]);

  const canCompare =
    !!values.originalSize.trim() && !!values.nuevoSize.trim() &&
    !!values.originalLI.trim() && !!values.nuevoLI.trim() &&
    !!values.originalSR.trim() && !!values.nuevoSR.trim() &&
    (category !== 'turismo' || (!!values.vehicleType && !!values.usage && !!values.load)) &&
    !errors.original && !errors.nuevo;

  const handleChange = (next: TireFormValues) => {
    setValues(next);
    if (result) setResult(null);
  };
  const handleExtrasChange = (e: TechExtras) => {
    setExtras(e);
    if (result) setResult(null);
  };
  const handleCategoryChange = (c: TireCategory) => {
    setCategory(c);
    setExtras({});
    setResult(null);
  };

  const handleCompare = () => {
    try {
      const original = parseTireByCategory(category, values.originalSize);
      const nuevo = parseTireByCategory(category, values.nuevoSize);
      const oLI = parseInt(values.originalLI, 10);
      const nLI = parseInt(values.nuevoLI, 10);
      const verdict = calcVerdictExtended({
        category, original, nuevo,
        loadIndexOriginal: Number.isFinite(oLI) ? oLI : undefined,
        loadIndexNuevo: Number.isFinite(nLI) ? nLI : undefined,
        speedRatingOriginal: values.originalSR || undefined,
        speedRatingNuevo: values.nuevoSR || undefined,
      });
      const recommendation = getRecommendation(
        values.vehicleType as any, values.usage as any, values.load as any,
      );
      setResult({
        verdict, recommendation,
        originalLabel: original.raw, nuevoLabel: nuevo.raw,
        originalLI: Number.isFinite(oLI) ? oLI : undefined,
        nuevoLI: Number.isFinite(nLI) ? nLI : undefined,
        originalSR: values.originalSR || undefined,
        nuevoSR: values.nuevoSR || undefined,
        category, extras: { ...extras },
      });
    } catch {
      // errores ya reflejados en el form
    }
  };

  return (
    <div className="space-y-6">
      <TireInputForm
        values={values}
        onChange={handleChange}
        onCompare={handleCompare}
        canCompare={canCompare}
        errors={errors}
        category={category}
        onCategoryChange={handleCategoryChange}
        extras={extras}
        onExtrasChange={handleExtrasChange}
      />
      {result && (
        <TireResultPanel
          verdict={result.verdict}
          originalLabel={result.originalLabel}
          nuevoLabel={result.nuevoLabel}
          originalLI={result.originalLI}
          nuevoLI={result.nuevoLI}
          originalSR={result.originalSR}
          nuevoSR={result.nuevoSR}
          recommendation={result.recommendation}
          category={result.category}
          extras={result.extras}
        />
      )}
    </div>
  );
};
