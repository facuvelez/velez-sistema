import React, { useMemo, useState } from 'react';
import { useWorkOrders } from '@/hooks/useWorkOrders';
import WorkOrderCard from './WorkOrderCard';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Loader2 } from 'lucide-react';

const isToday = (iso: string) => {
  const d = new Date(iso);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
};

const WorkOrderBoard: React.FC = () => {
  const { orders, loading } = useWorkOrders();
  const [showCompleted, setShowCompleted] = useState(false);

  const { active, completedToday } = useMemo(() => {
    const active = orders.filter((o) => o.status !== 'completed');
    const completedToday = orders.filter((o) => o.status === 'completed' && isToday(o.updated_at));
    // Sort active by status priority then oldest first
    const priority: Record<string, number> = { pending: 0, in_progress: 1, ready_align: 2 };
    active.sort((a, b) => {
      const p = (priority[a.status] ?? 9) - (priority[b.status] ?? 9);
      if (p !== 0) return p;
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });
    return { active, completedToday };
  }, [orders]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {active.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No hay órdenes activas</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {active.map((o) => (
            <WorkOrderCard key={o.id} order={o} />
          ))}
        </div>
      )}

      {completedToday.length > 0 && (
        <div className="border-t pt-4">
          <Button
            variant="ghost"
            className="w-full justify-between"
            onClick={() => setShowCompleted((v) => !v)}
          >
            <span>Completadas hoy ({completedToday.length})</span>
            {showCompleted ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
          {showCompleted && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-4">
              {completedToday.map((o) => (
                <WorkOrderCard key={o.id} order={o} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WorkOrderBoard;
