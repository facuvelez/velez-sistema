import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppHeader } from '@/components/AppHeader';
import { usePriceCompetition } from '@/hooks/usePriceCompetition';
import { ComparatorTable } from '@/components/price-competition/ComparatorTable';
import { MatchesManager } from '@/components/price-competition/MatchesManager';
import { CompetidoresManager } from '@/components/price-competition/CompetidoresManager';

const PriceCompetitionPage = () => {
  const navigate = useNavigate();
  const { productos, minByProducto, loading } = usePriceCompetition();

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="container mx-auto px-4 py-4 max-w-7xl">
        <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" /> Volver
        </Button>

        <Tabs defaultValue="comparator">
          <TabsList>
            <TabsTrigger value="comparator">Comparador</TabsTrigger>
            <TabsTrigger value="matches">Gestionar matches</TabsTrigger>
            <TabsTrigger value="competidores">Competidores</TabsTrigger>
          </TabsList>

          <TabsContent value="comparator" className="mt-4">
            {loading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
            ) : (
              <ComparatorTable productos={productos} minByProducto={minByProducto} />
            )}
          </TabsContent>

          <TabsContent value="matches" className="mt-4">
            <MatchesManager />
          </TabsContent>

          <TabsContent value="competidores" className="mt-4">
            <CompetidoresManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default PriceCompetitionPage;
