import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppHeader } from '@/components/AppHeader';
import { usePriceFlow } from '@/hooks/usePriceFlow';
import { useAuth } from '@/contexts/AuthContext';
import { PriceFlowSimulator } from '@/components/price-flows/PriceFlowSimulator';
import { PriceFlowEditor } from '@/components/price-flows/PriceFlowEditor';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Settings } from 'lucide-react';

const PriceFlowsPage: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { flow, isLoading } = usePriceFlow();
  const isAdmin = profile?.role === 'Administrator';

  return (
    <div className="min-h-screen bg-background">
      <AppHeader description="Simulá precios mayorista y público a partir del costo" />

      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Volver
        </Button>

        {isLoading ? (
          <div className="text-center text-muted-foreground py-12">Cargando...</div>
        ) : (
          <>
            <PriceFlowSimulator flow={flow} />

            {isAdmin && flow && (
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    <span className="flex items-center">
                      <Settings className="h-4 w-4 mr-2" /> Configuración del flujo
                    </span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-4">
                  <PriceFlowEditor flow={flow} />
                </CollapsibleContent>
              </Collapsible>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PriceFlowsPage;
