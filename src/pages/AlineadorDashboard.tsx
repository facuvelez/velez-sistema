import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AppHeader } from '@/components/AppHeader';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wrench, Calendar, ArrowLeft } from 'lucide-react';
import AppointmentsList from '@/components/AppointmentsList';
import { useSupabaseSync } from '@/hooks/useSupabaseSync';
import { useAuth } from '@/contexts/AuthContext';

const AlineadorDashboard = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const {
    appointments,
    clients,
    createAppointment,
    updateAppointment,
    deleteAppointment,
    hardDeleteAppointment,
    refetch: fetchData,
  } = useSupabaseSync();
  const tab = searchParams.get('tab');

  useEffect(() => {
    fetchData();
  }, []);

  if (tab === 'appointments') {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader title="Velez Neumáticos" />
        <div className="container mx-auto px-4 py-4 max-w-7xl">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/alineador')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Volver
          </Button>
          <AppointmentsList
            appointments={appointments}
            clients={clients}
            onCreateAppointment={createAppointment}
            onUpdateAppointment={updateAppointment}
            onDeleteAppointment={deleteAppointment}
              onHardDeleteAppointment={hardDeleteAppointment}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
        <AppHeader />
      <div className="container mx-auto px-4 py-6 max-w-5xl flex flex-col">
        <div className="text-center mb-2">
          <h1 className="text-2xl font-bold">Panel de Alineador</h1>
          <p className="text-muted-foreground">Bienvenido, {profile?.username}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-8">
          {[
            { title: 'Taller', desc: 'Órdenes de trabajo en curso', icon: Wrench, to: '/taller' },
            { title: 'Turnos', desc: 'Turnos reservados', icon: Calendar, to: '/alineador?tab=appointments' },
          ].map(({ title, desc, icon: Icon, to }) => (
            <Card
              key={to}
              onClick={() => navigate(to)}
              className="cursor-pointer hover:-translate-y-0.5 hover:shadow-xl transition-all border-border min-h-[160px]"
            >
              <CardHeader className="flex flex-col items-center justify-center text-center h-full py-8 gap-4">
                <div className="rounded-xl bg-primary/10 p-4 text-primary">
                  <Icon className="h-10 w-10" />
                </div>
                <CardTitle className="text-xl">{title}</CardTitle>
                <CardDescription className="text-sm">{desc}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AlineadorDashboard;
