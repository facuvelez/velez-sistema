import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Play, CheckCircle2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useGuestOperator } from '@/contexts/GuestOperatorContext';
import { useWorkOrders, type WorkOrder } from '@/hooks/useWorkOrders';


const STATUS_META: Record<WorkOrder['status'], { label: string; className: string }> = {
  pending: { label: 'En espera', className: 'bg-blue-500 text-white hover:bg-blue-500' },
  in_progress: { label: 'En progreso', className: 'bg-amber-500 text-white hover:bg-amber-500' },
  ready_align: { label: 'Esperando alineación', className: 'bg-orange-500 text-white hover:bg-orange-500' },
  completed: { label: 'Completado', className: 'bg-green-600 text-white hover:bg-green-600' },
};

const fmtTime = (iso: string) => {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} hs`;
};

interface Props {
  order: WorkOrder;
}

const WorkOrderCard: React.FC<Props> = ({ order }) => {
  const { hasRole, profile } = useAuth();
  const { guestOperator } = useGuestOperator();
  const { updateStatus } = useWorkOrders();

  const isOperator = hasRole('Operator') || hasRole('Alineador');
  const isAligner = hasRole('Alineador');
  const isOffice = hasRole('Administrator') || hasRole('Administracion');

  const operatorName = profile?.username ?? guestOperator?.username ?? 'Operador';

  const meta = STATUS_META[order.status];

  const handleUpdate = async (newStatus: WorkOrder['status']) => {
    console.log('[WorkOrderCard] role:', profile?.role ?? guestOperator?.role, 'actor:', operatorName, 'action:', newStatus, 'order:', order.id);
    try {
      await updateStatus(order, newStatus, operatorName);
    } catch (err) {
      console.error('[WorkOrderCard] updateStatus failed:', err);
      toast.error('No se pudo actualizar la orden');
    }
  };

  const handleWhatsApp = () => {
    if (!order.client_phone) return;
    const mensaje = `Hola ${order.client_name}, tu vehículo (${order.vehicle_info}) ya está listo para retirar en Velez Neumáticos. ¡Gracias por elegirnos! 🔧`;
    const numero = order.client_phone.replace(/\D/g, '');
    window.open(`https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`, '_blank');
  };

  return (
    <Card className="border-2">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <Badge className={meta.className}>{meta.label}</Badge>
          <span className="text-sm text-muted-foreground">{fmtTime(order.created_at)}</span>
        </div>

        <div>
          <h3 className="text-xl font-bold leading-tight">{order.client_name}</h3>
          <p className="text-base text-muted-foreground">{order.vehicle_info}</p>
        </div>

        <ul className="text-base space-y-1">
          {order.tasks.map((t, i) => (
            <li key={i}>• {t}</li>
          ))}
        </ul>

        {order.notes && (
          <p className="text-sm bg-muted/50 rounded p-2">
            <span className="font-semibold">Notas:</span> {order.notes}
          </p>
        )}

        {order.status === 'pending' && isOperator && (
          <Button className="w-full gap-2" onClick={() => handleUpdate('in_progress')}>
            <Play className="h-4 w-4" /> Iniciar trabajo
          </Button>
        )}

        {order.status === 'in_progress' && isOperator && (
          order.requires_alignment ? (
            <Button className="w-full gap-2" onClick={() => handleUpdate('ready_align')}>
              <ArrowRight className="h-4 w-4" /> Listo para alinear
            </Button>
          ) : (
            <Button className="w-full gap-2" onClick={() => handleUpdate('completed')}>
              <CheckCircle2 className="h-4 w-4" /> Marcar listo
            </Button>
          )
        )}

        {order.status === 'ready_align' && isAligner && (
          <Button className="w-full gap-2" onClick={() => handleUpdate('completed')}>
            <CheckCircle2 className="h-4 w-4" /> Completar alineación
          </Button>
        )}

        {order.status === 'completed' && isOffice && order.client_phone && (
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-2 gap-2"
            onClick={handleWhatsApp}
          >
            <MessageCircle className="h-4 w-4" /> Avisar al cliente por WhatsApp
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default WorkOrderCard;
