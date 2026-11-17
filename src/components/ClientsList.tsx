
import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Edit, Trash2, Phone, Mail, MapPin, Search } from "lucide-react";
import { Link } from "react-router-dom";
import EditClientForm from "./EditClientForm";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";


interface Client {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  city: string;
  notes: string;
  createdAt: string;
  type?: string;
}

interface OriginalClient {
  id: string;
  first_name: string;
  last_name: string;
  phone?: string;
  email?: string;
  address?: string;
  type: string;
  created_at: string;
}

interface ClientsListProps {
  clients: Client[];
  originalClients?: OriginalClient[];
  services?: any[];
  debts?: any[];
  payments?: any[];
  setClients: (clients: Client[]) => void;
  updateClient?: (clientId: string, updates: any) => Promise<any>;
}

const ClientsList = ({ clients, originalClients, services = [], debts = [], payments = [], setClients, updateClient }: ClientsListProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [ordenamiento, setOrdenamiento] = useState<'nombre' | 'deuda_longeva' | 'deuda_monto'>('nombre');
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // Pending debts helper (transformed debts use camelCase; "pending" = active with remaining amount)
  const isPendingDebt = (d: any) =>
    (d.status ?? 'active') === 'active' && (d.remainingAmount ?? d.amount ?? 0) > 0;

  const getOldestPendingDebt = (clientId: string) =>
    debts
      .filter((d: any) => d.clientId === clientId && isPendingDebt(d))
      .sort((x: any, y: any) => new Date(x.createdAt).getTime() - new Date(y.createdAt).getTime())[0];

  const filteredClients = clients.filter(client =>
    `${client.firstName} ${client.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone.includes(searchTerm) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAndSortedClients = useMemo(() => {
    const arr = [...filteredClients];

    if (ordenamiento === 'deuda_longeva') {
      return arr.sort((a, b) => {
        const deudaA = getOldestPendingDebt(a.id);
        const deudaB = getOldestPendingDebt(b.id);
        if (!deudaA && !deudaB) return 0;
        if (!deudaA) return 1;
        if (!deudaB) return -1;
        return new Date(deudaA.createdAt).getTime() - new Date(deudaB.createdAt).getTime();
      });
    }

    if (ordenamiento === 'deuda_monto') {
      return arr.sort((a, b) => {
        const totalA = debts
          .filter((d: any) => d.clientId === a.id && isPendingDebt(d))
          .reduce((sum: number, d: any) => sum + (d.remainingAmount ?? d.amount ?? 0), 0);
        const totalB = debts
          .filter((d: any) => d.clientId === b.id && isPendingDebt(d))
          .reduce((sum: number, d: any) => sum + (d.remainingAmount ?? d.amount ?? 0), 0);
        return totalB - totalA;
      });
    }

    return arr.sort((a, b) => {
      const nameA = `${a.lastName} ${a.firstName}`.toLowerCase();
      const nameB = `${b.lastName} ${b.firstName}`.toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }, [filteredClients, debts, ordenamiento]);

  // Group clients by first letter (only when sorting alphabetically)
  const groupedClients = filteredAndSortedClients.reduce((groups, client) => {
    const firstLetter = client.lastName.charAt(0).toUpperCase();
    if (!groups[firstLetter]) {
      groups[firstLetter] = [];
    }
    groups[firstLetter].push(client);
    return groups;
  }, {} as Record<string, Client[]>);

  const alphabetizedGroups = Object.keys(groupedClients).sort();


  const getOriginalClientId = (transformedClient: Client): string => {
    if (originalClients) {
      // Find the original client by matching name (since phone/email might be empty)
      const original = originalClients.find(oc => 
        oc.first_name === transformedClient.firstName && 
        oc.last_name === transformedClient.lastName
      );
      if (original) {
        return original.id;
      }
    }
    // If not found, this shouldn't happen but we need a fallback
    console.error('Could not find original client ID for:', transformedClient);
    return transformedClient.id;
  };

  const { toast } = useToast();

  const handleDelete = async (clientId: string) => {
    try {
      // Find the original client UUID to delete from Supabase
      const originalClientId = getOriginalClientId(clients.find(c => c.id === clientId)!);
      
      // Delete from Supabase
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', originalClientId);

      if (error) {
        throw error;
      }

      // Update local state
      setClients(clients.filter(client => client.id !== clientId));
      
      toast({
        title: "Cliente eliminado",
        description: "El cliente ha sido eliminado correctamente.",
      });
    } catch (error) {
      console.error('Error deleting client:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el cliente. Inténtelo de nuevo.",
        variant: "destructive",
      });
    }
  };

  const handleEditClient = async (updatedClient: Client) => {
    if (updateClient && originalClients) {
      // Find the original client UUID
      const originalClientId = getOriginalClientId(updatedClient);
      
      // Transform the client data back to database format
      const dbUpdates = {
        first_name: updatedClient.firstName,
        last_name: updatedClient.lastName,
        phone: updatedClient.phone,
        email: updatedClient.email,
        address: updatedClient.city,
        type: updatedClient.type || 'Persona',
        // For companies, store the company name in the appropriate field
        ...(updatedClient.type === 'Empresa' ? {
          company_name: updatedClient.firstName,
          first_name: updatedClient.firstName
        } : {})
      };
      
      try {
        await updateClient(originalClientId, dbUpdates);
        setEditingClient(null);
      } catch (error) {
        console.error('Failed to update client:', error);
      }
    } else {
      // Fallback to local state update if no database function is provided
      setClients(clients.map(client => 
        client.id === updatedClient.id ? updatedClient : client
      ));
      setEditingClient(null);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Search Controls */}
      <div className="flex flex-col gap-3 sm:gap-4">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar clientes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 text-sm"
            />
          </div>
          <Select value={ordenamiento} onValueChange={(v: any) => setOrdenamiento(v)}>
            <SelectTrigger className="w-full sm:w-56 h-9 text-sm">
              <SelectValue placeholder="Ordenar por..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="nombre">Nombre (A-Z)</SelectItem>
              <SelectItem value="deuda_longeva">Deuda más longeva primero</SelectItem>
              <SelectItem value="deuda_monto">Mayor deuda primero</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-center p-3 bg-muted rounded-lg">
          <span className="text-sm font-medium">
            Total de clientes: <span className="text-primary font-bold">{clients.length}</span>
          </span>
        </div>
      </div>


      {/* Clients Grid with Alphabetical Groups */}
      <div className="space-y-4 sm:space-y-6">
        {alphabetizedGroups.map((letter, groupIndex) => (
          <div key={letter}>
            {/* Letter Separator */}
            <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
              <div className="bg-primary text-primary-foreground w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-semibold text-xs sm:text-sm">
                {letter}
              </div>
              <Separator className="flex-1" />
            </div>
            
            {/* Clients in this letter group */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
              {groupedClients[letter].map((client) => {
                return (
                  <Card key={client.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-2 pt-3 px-3 sm:px-6">
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0 flex-1">
                          <CardTitle className="text-sm sm:text-base truncate">
                            {client.firstName} {client.lastName}
                          </CardTitle>
                          <CardDescription className="text-xs truncate">{client.city}</CardDescription>
                          {ordenamiento === 'deuda_longeva' && (() => {
                            const deudaMasAntigua = getOldestPendingDebt(client.id);
                            if (!deudaMasAntigua) return null;
                            const dias = Math.floor(
                              (Date.now() - new Date(deudaMasAntigua.createdAt).getTime()) / (1000 * 60 * 60 * 24)
                            );
                            return (
                              <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                                dias > 60 ? 'bg-destructive/10 text-destructive' :
                                dias > 30 ? 'bg-amber-500/10 text-amber-600' :
                                'bg-muted text-muted-foreground'
                              }`}>
                                Deuda hace {dias} días
                              </span>
                            );
                          })()}
                        </div>
                        <Badge variant="secondary" className="text-xs px-2 py-0.5 flex-shrink-0">
                          {new Date(client.createdAt).getFullYear()}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2 pt-0 px-3 sm:px-6 pb-3">
                      <div className="flex items-center gap-2 text-xs">
                        <Phone className="h-3 w-3 text-blue-500 flex-shrink-0" />
                        <span className="truncate">{client.phone}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs">
                        <Mail className="h-3 w-3 text-purple-500 flex-shrink-0" />
                        <span className="truncate">{client.email}</span>
                      </div>

                      {client.notes && (
                        <div className="mt-2 p-1.5 bg-muted rounded text-xs">
                          <p className="line-clamp-2">{client.notes}</p>
                        </div>
                      )}

                      <div className="flex gap-1 mt-3">
                        <Button asChild size="sm" className="flex-1 h-7 px-2 text-xs">
                          <Link to={`/client/${getOriginalClientId(client)}`}>
                            <span className="hidden sm:inline">Ver Perfil</span>
                            <span className="sm:hidden">Ver</span>
                          </Link>
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="h-7 px-2"
                          onClick={() => setEditingClient(client)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              className="h-7 px-2"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción no se puede deshacer. Se eliminará permanentemente el cliente 
                                <strong> {client.firstName} {client.lastName}</strong> y todos sus datos asociados.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction 
                                className="bg-red-600 hover:bg-red-700"
                                onClick={() => handleDelete(client.id)}
                              >
                                Eliminar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {filteredAndSortedClients.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No se encontraron clientes</p>
          <p className="text-gray-400">Intente ajustar los términos de búsqueda</p>
        </div>
      )}

      {/* Edit Client Modal */}
      {editingClient && (
        <EditClientForm 
          client={editingClient}
          onClose={() => setEditingClient(null)}
          onSave={handleEditClient}
        />
      )}
    </div>
  );
};

export default ClientsList;
