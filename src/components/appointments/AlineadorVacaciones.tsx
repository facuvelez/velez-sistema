import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Palmtree, X, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { differenceInDays } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  useAlineadorVacaciones,
  rangesOverlap,
  formatDateDMY,
} from "@/hooks/useAlineadorVacaciones";

const AlineadorVacaciones = () => {
  const { vacaciones, refetch } = useAlineadorVacaciones();
  const { profile } = useAuth();
  const [expandido, setExpandido] = useState(false);
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [motivo, setMotivo] = useState("");
  const [esEnfermedad, setEsEnfermedad] = useState(false);
  const [saving, setSaving] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  const handleAgregar = async () => {
    if (!fechaDesde || !fechaHasta) {
      toast.error("Completá ambas fechas");
      return;
    }
    if (fechaDesde < today) {
      toast.error("La fecha desde no puede ser anterior a hoy");
      return;
    }
    if (fechaHasta < fechaDesde) {
      toast.error("La fecha hasta no puede ser anterior a la fecha desde");
      return;
    }

    const diffDias = differenceInDays(new Date(fechaHasta), new Date(fechaDesde)) + 1;
    if (diffDias > 31 && !esEnfermedad) {
      toast.error(
        "Las vacaciones no pueden superar los 31 días. Si es una ausencia por enfermedad, marcá el checkbox correspondiente."
      );
      return;
    }

    const overlap = vacaciones.find((v) =>
      rangesOverlap(fechaDesde, fechaHasta, v.fecha_desde, v.fecha_hasta)
    );
    if (overlap) {
      toast.error("Ya existe un período de vacaciones que se superpone con esas fechas");
      return;
    }

    setSaving(true);
    const { error } = await supabase.from("alineador_vacaciones").insert({
      fecha_desde: fechaDesde,
      fecha_hasta: fechaHasta,
      motivo: motivo || null,
      es_enfermedad: esEnfermedad,
      created_by_username: profile?.username || null,
    } as any);
    setSaving(false);

    if (error) {
      toast.error("Error al guardar: " + error.message);
      return;
    }
    toast.success("Período agregado");
    setFechaDesde("");
    setFechaHasta("");
    setMotivo("");
    setEsEnfermedad(false);
    refetch();
  };

  const handleEliminar = async (id: string) => {
    if (!confirm("¿Eliminar este período de vacaciones?")) return;
    const { error } = await supabase.from("alineador_vacaciones").delete().eq("id", id);
    if (error) {
      toast.error("Error al eliminar: " + error.message);
      return;
    }
    toast.success("Período eliminado");
    refetch();
  };

  return (
    <div className="border rounded-md overflow-hidden">
      {/* Header colapsable — siempre visible */}
      <button
        type="button"
        onClick={() => setExpandido(!expandido)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2 text-muted-foreground">
          <Palmtree className="h-4 w-4" />
          <span>Vacaciones del Alineador</span>
          {/* Mostrar cantidad de períodos activos como badge */}
          {vacaciones.length > 0 && (
            <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">
              {vacaciones.length} período{vacaciones.length > 1 ? "s" : ""}
            </span>
          )}
        </div>
        {expandido ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {/* Contenido colapsable */}
      {expandido && (
        <div className="px-4 pb-4 pt-2 border-t space-y-4">
          <div>
            <p className="text-sm font-medium mb-2">Períodos configurados:</p>
            {vacaciones.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay períodos configurados</p>
            ) : (
              <ul className="space-y-1.5">
                {vacaciones.map((v: any) => (
                  <li
                    key={v.id}
                    className="flex items-center justify-between gap-2 p-2 rounded-md bg-muted/50 border"
                  >
                    <div className="text-sm flex items-center gap-2 flex-wrap">
                      {v.es_enfermedad ? (
                        <Badge className="bg-orange-500 hover:bg-orange-500 text-white">
                          🏥 Enfermedad
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Vacaciones</Badge>
                      )}
                      <span className="font-medium">
                        {formatDateDMY(v.fecha_desde)} al {formatDateDMY(v.fecha_hasta)}
                      </span>
                      {v.motivo && (
                        <span className="text-muted-foreground"> — {v.motivo}</span>
                      )}
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => handleEliminar(v.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="border-t pt-4 space-y-3">
            <p className="text-sm font-medium">Agregar período:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="vac-desde" className="text-xs">Desde</Label>
                <Input
                  id="vac-desde"
                  type="date"
                  min={today}
                  value={fechaDesde}
                  onChange={(e) => setFechaDesde(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="vac-hasta" className="text-xs">Hasta</Label>
                <Input
                  id="vac-hasta"
                  type="date"
                  min={fechaDesde || today}
                  value={fechaHasta}
                  onChange={(e) => setFechaHasta(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="vac-motivo" className="text-xs">Motivo (opcional)</Label>
              <Input
                id="vac-motivo"
                placeholder="Ej: Vacaciones anuales"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Checkbox
                id="es_enfermedad"
                checked={esEnfermedad}
                onCheckedChange={(v) => setEsEnfermedad(!!v)}
              />
              <label htmlFor="es_enfermedad" className="text-sm cursor-pointer">
                Ausencia por enfermedad
              </label>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleAgregar} disabled={saving} size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Agregar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlineadorVacaciones;
