import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { RefreshCw } from 'lucide-react';
import { formatPhoneNumber } from '@/utils/phoneFormatter';
import { Progress } from '@/components/ui/progress';

export const UpdateClientPhones = ({ onComplete }: { onComplete: () => void }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const handleUpdate = async () => {
    setIsUpdating(true);
    setProgress(0);

    try {
      // Obtener todos los clientes
      const { data: clients, error: fetchError } = await supabase
        .from('clients')
        .select('id, phone');

      if (fetchError) throw fetchError;

      if (!clients || clients.length === 0) {
        toast({
          title: "No hay clientes",
          description: "No se encontraron clientes para actualizar",
        });
        setIsUpdating(false);
        return;
      }

      let updated = 0;
      const total = clients.length;

      // Actualizar cada cliente
      for (let i = 0; i < clients.length; i++) {
        const client = clients[i];
        
        if (client.phone) {
          const formattedPhone = formatPhoneNumber(client.phone);
          const formattedPhoneStr = formattedPhone ? String(formattedPhone) : null;
          
          // Solo actualizar si el teléfono cambió
          if (formattedPhoneStr && formattedPhoneStr !== client.phone) {
            const { error: updateError } = await supabase
              .from('clients')
              .update({ phone: formattedPhoneStr })
              .eq('id', client.id);

            if (!updateError) {
              updated++;
            }
          }
        }

        setProgress(Math.round(((i + 1) / total) * 100));
      }

      toast({
        title: "Actualización completada",
        description: `${updated} teléfonos actualizados con +54`,
      });

      setIsUpdating(false);
      setProgress(0);
      onComplete();
    } catch (error: any) {
      console.error('Error updating phones:', error);
      toast({
        title: "Error",
        description: error.message || "Error al actualizar teléfonos",
        variant: "destructive",
      });
      setIsUpdating(false);
      setProgress(0);
    }
  };

  return (
    <Button 
      onClick={handleUpdate} 
      disabled={isUpdating}
      variant="outline"
      size="sm"
    >
      <RefreshCw className={`h-4 w-4 mr-2 ${isUpdating ? 'animate-spin' : ''}`} />
      {isUpdating ? `Actualizando... ${progress}%` : 'Actualizar Teléfonos (+54)'}
    </Button>
  );
};
