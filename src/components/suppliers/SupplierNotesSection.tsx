import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Supplier, useSuppliers } from '@/hooks/useSuppliers';

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

export const SupplierNotesSection: React.FC<{ supplier: Supplier }> = ({ supplier }) => {
  const { updateSupplier } = useSuppliers();
  const [value, setValue] = useState(supplier.notes || '');

  useEffect(() => {
    setValue(supplier.notes || '');
  }, [supplier.id, supplier.notes]);

  const dirty = value !== (supplier.notes || '');

  const handleSave = () => {
    updateSupplier.mutate({ id: supplier.id, notes: value.trim() || null });
  };

  return (
    <Card onClick={(e) => e.stopPropagation()}>
      <CardHeader>
        <CardTitle className="text-base">Notas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Notas internas sobre este proveedor..."
          rows={4}
        />
        <div className="flex items-center justify-between flex-wrap gap-2">
          <p className="text-xs text-muted-foreground">
            {supplier.notes_updated_at
              ? `Última actualización: ${formatDateTime(supplier.notes_updated_at)}`
              : 'Sin actualizaciones registradas'}
          </p>
          <Button size="sm" onClick={handleSave} disabled={!dirty || updateSupplier.isPending}>
            Guardar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
