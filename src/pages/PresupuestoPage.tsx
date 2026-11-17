import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Presupuestador from '@/components/presupuesto/Presupuestador';
import PresupuestosLog from '@/components/presupuesto/PresupuestosLog';
import { useAuth } from '@/contexts/AuthContext';

const PresupuestoPage: React.FC = () => {
  const navigate = useNavigate();
  const { hasRole, profile } = useAuth();
  console.log('[PresupuestoPage] hasRole Admin:', hasRole('Administrator'));
  console.log('[PresupuestoPage] profile:', profile);
  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        description="Generá y enviá presupuestos por WhatsApp"
      />
      <div className="container mx-auto px-4 py-4 max-w-6xl">
        <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Volver
        </Button>
        <Presupuestador />
        {hasRole('Administrator') && (
          <div className="mt-8">
            <PresupuestosLog />
          </div>
        )}
      </div>
    </div>
  );
};

export default PresupuestoPage;
