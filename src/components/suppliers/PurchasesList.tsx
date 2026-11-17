import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { useSupplierPurchases } from '@/hooks/useSupplierPurchases';
import { PurchaseForm } from './PurchaseForm';
import { formatCurrency } from '@/utils/numberFormatter';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog';

export const PurchasesList: React.FC = () => {
  const { purchases, isLoading, deletePurchase } = useSupplierPurchases();
  const [formOpen, setFormOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Nueva compra
        </Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Cargando...</p>
      ) : purchases.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          No hay compras registradas todavía.
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {purchases.map((p) => {
            const isOpen = expanded === p.id;
            return (
              <Card key={p.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-base truncate">{p.supplier_name}</CardTitle>
                      <div className="flex flex-wrap gap-2 mt-1 text-sm text-muted-foreground">
                        <span>{new Date(p.purchase_date + 'T00:00:00').toLocaleDateString('es-AR')}</span>
                        {p.invoice_number && <Badge variant="outline">N° {p.invoice_number}</Badge>}
                        <Badge variant="secondary">{p.items?.length || 0} ítem(s)</Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="font-semibold text-primary">{formatCurrency(p.total_amount)}</span>
                      <Button size="icon" variant="ghost" onClick={() => setExpanded(isOpen ? null : p.id)}>
                        {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="icon" variant="ghost">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar compra?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción eliminará la compra y todos sus ítems.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deletePurchase.mutate(p.id)}>Eliminar</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>
                {isOpen && p.items && p.items.length > 0 && (
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-left text-muted-foreground">
                            <th className="py-2 pr-2">Marca</th>
                            <th className="py-2 pr-2">Descripción</th>
                            <th className="py-2 pr-2">Veh.</th>
                            <th className="py-2 pr-2 text-right">Cant.</th>
                            <th className="py-2 pr-2 text-right">Lista</th>
                            <th className="py-2 pr-2 text-right">Desc%</th>
                            <th className="py-2 pr-2 text-right">Flete%</th>
                            <th className="py-2 pr-2 text-right">Unit. final</th>
                            <th className="py-2 text-right">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {p.items.map((it) => (
                            <tr key={it.id} className="border-b last:border-0">
                              <td className="py-2 pr-2">{it.brand || '—'}</td>
                              <td className="py-2 pr-2">{it.description || '—'}</td>
                              <td className="py-2 pr-2">{it.vehicle_type || '—'}</td>
                              <td className="py-2 pr-2 text-right">{it.quantity}</td>
                              <td className="py-2 pr-2 text-right">{formatCurrency(it.list_price)}</td>
                              <td className="py-2 pr-2 text-right">{it.discount_percent}%</td>
                              <td className="py-2 pr-2 text-right">{it.freight_percent}%</td>
                              <td className="py-2 pr-2 text-right font-semibold">{formatCurrency(it.final_unit_cost)}</td>
                              <td className="py-2 text-right font-semibold text-primary">{formatCurrency(it.subtotal)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {p.notes && (
                      <p className="mt-3 text-sm text-muted-foreground">📝 {p.notes}</p>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <PurchaseForm open={formOpen} onOpenChange={setFormOpen} />
    </div>
  );
};
