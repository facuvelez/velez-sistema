import { useNavigate } from 'react-router-dom';
import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useComisionistas } from '@/components/comisionistas/useComisionistas';
import BuscadorComisionista from '@/components/comisionistas/BuscadorComisionista';
import GestionComisionistas from '@/components/comisionistas/GestionComisionistas';

export default function ComisionistasPage() {
  const navigate = useNavigate();
  const datos = useComisionistas();

  return (
    <div className="min-h-screen bg-background">
      <AppHeader description="Recorridos de comisionistas y quién conviene para cada envío" />
      <div className="container mx-auto max-w-7xl px-4 py-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="mb-2">
          <ArrowLeft className="mr-1 h-4 w-4" /> Volver
        </Button>

        {datos.isLoading ? (
          <div className="flex items-center gap-2 p-8 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" /> Cargando comisionistas…
          </div>
        ) : datos.error ? (
          <p className="rounded-md border border-destructive p-4 text-sm">
            No se pudieron cargar los comisionistas: {datos.error.message}
          </p>
        ) : (
          <Tabs defaultValue="buscar">
            <TabsList className="mb-4">
              <TabsTrigger value="buscar">¿Quién me conviene?</TabsTrigger>
              <TabsTrigger value="gestion">Comisionistas y recorridos</TabsTrigger>
            </TabsList>
            <TabsContent value="buscar">
              <BuscadorComisionista comisionistas={datos.comisionistas} recorridos={datos.recorridos} />
            </TabsContent>
            <TabsContent value="gestion">
              <GestionComisionistas datos={datos} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
