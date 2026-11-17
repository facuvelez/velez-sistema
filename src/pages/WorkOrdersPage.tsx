import React, { useState } from 'react';
import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { Plus, ArrowLeft, UserCog } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useGuestOperator } from '@/contexts/GuestOperatorContext';
import WorkOrderBoard from '@/components/work-orders/WorkOrderBoard';
import WorkOrderForm from '@/components/work-orders/WorkOrderForm';

const WorkOrdersPage: React.FC = () => {
  const { hasRole, profile } = useAuth();
  const { guestOperator, clearGuestOperator } = useGuestOperator();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const isOffice = hasRole('Administrator') || hasRole('Administracion');
  const isOperator = hasRole('Operator') || hasRole('Alineador');
  const isGuest = !profile && !!guestOperator;

  const handleChangeOperator = () => {
    clearGuestOperator();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background">
      {isGuest ? (
        <header className="border-b bg-card/50 backdrop-blur">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl font-bold truncate">Taller</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Operario: <span className="font-semibold">{guestOperator?.username}</span>
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleChangeOperator} className="gap-2">
              <UserCog className="h-4 w-4" /> Cambiar operador
            </Button>
          </div>
        </header>
      ) : (
        <AppHeader description="Órdenes de trabajo en curso" />
      )}
      <main className="container mx-auto px-4 py-4 space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          {!isGuest ? (
            <Button variant="outline" size="sm" onClick={() => navigate(isOperator && !isOffice ? '/operator' : '/')}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Volver
            </Button>
          ) : <div />}
          {isOffice && (
            <Button onClick={() => setShowForm(true)} className="gap-2">
              <Plus className="h-4 w-4" /> Nueva orden
            </Button>
          )}
        </div>
        <WorkOrderBoard />
      </main>
      <WorkOrderForm open={showForm} onClose={() => setShowForm(false)} />
    </div>
  );
};

export default WorkOrdersPage;
