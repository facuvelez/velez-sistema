
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Users, Calendar, DollarSign, AlertTriangle, Clock } from "lucide-react";
import { Client, Service, Debt, Payment } from '@/types/shared';
import { formatCurrency } from "@/utils/numberFormatter";


interface DashboardProps {
  clients: Client[];
  services: Service[];
  debts: Debt[];
  payments: Payment[];
}

const Dashboard = ({ clients, services, debts, payments }: DashboardProps) => {
  // Calculate recent activity
  const recentServices = services
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const recentSales = services
    .filter(service => service.category === 'venta')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  // Calculate monthly revenue from all actual payments made
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  // Sum service payments (amount_delivered)
  const servicePayments = services
    .filter(service => {
      const serviceDate = new Date(service.date);
      return serviceDate.getMonth() === currentMonth && serviceDate.getFullYear() === currentYear;
    })
    .reduce((sum, service) => sum + (service.amountDelivered || 0), 0);
  
  // Sum debt payments made this month
  const debtPayments = payments
    .filter(payment => {
      const paymentDate = new Date(payment.date);
      return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear;
    })
    .reduce((sum, payment) => sum + payment.amount, 0);
    
  const monthlyRevenue = servicePayments + debtPayments;

  // Overdue debts (more than 6 months old based on service date)
  const overdueDebts = debts.filter(debt => {
    // Find the corresponding service to get the service date
    const correspondingService = services.find(service => service.id === debt.serviceId);
    if (!correspondingService) return false;
    
    const serviceDate = new Date(correspondingService.date);
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    return serviceDate < sixMonthsAgo && debt.remainingAmount > 0;
  });

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client ? `${client.firstName} ${client.lastName}` : "Cliente Desconocido";
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid': return 'pagado';
      case 'pending': return 'pendiente';
      case 'overdue': return 'vencido';
      default: return status;
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-blue-100">Ingresos Este Mes</p>
                <p className="text-xl sm:text-3xl font-bold">{formatCurrency(monthlyRevenue)}</p>
              </div>
              <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-green-100">Ventas Este Mes</p>
                <p className="text-xl sm:text-3xl font-bold">{services.filter(s => {
                  const serviceDate = new Date(s.date);
                  return serviceDate.getMonth() === currentMonth && 
                         serviceDate.getFullYear() === currentYear && 
                         s.category === 'venta';
                }).length}</p>
              </div>
              <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-purple-100">Servicios Este Mes</p>
                <p className="text-xl sm:text-3xl font-bold">{services.filter(s => new Date(s.date).getMonth() === currentMonth).length}</p>
              </div>
              <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-purple-200 dark:text-white" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-red-100">Pagos Vencidos Este Mes</p>
                <p className="text-xl sm:text-3xl font-bold">{overdueDebts.length}</p>
              </div>
              <AlertTriangle className="h-6 w-6 sm:h-8 sm:w-8 text-red-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent Services */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 dark:text-white" />
              Servicios Recientes
            </CardTitle>
            <CardDescription>Últimos servicios proporcionados a clientes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentServices.map((service) => (
                <div key={service.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{service.type}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{getClientName(service.clientId)}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(service.date).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600 dark:text-green-400">{formatCurrency(service.amount)}</p>
                    <Badge variant={service.status === 'paid' ? 'default' : 'secondary'}>
                      {getStatusText(service.status)}
                    </Badge>
                  </div>
                </div>
              ))}
              {recentServices.length === 0 && (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">No hay servicios recientes</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Sales */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 dark:text-white" />
              Ventas Recientes
            </CardTitle>
            <CardDescription>Últimas ventas realizadas a clientes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentSales.map((sale) => (
                <div key={sale.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{sale.type}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{getClientName(sale.clientId)}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(sale.date).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600 dark:text-green-400">{formatCurrency(sale.amount)}</p>
                    <Badge variant={sale.status === 'paid' ? 'default' : 'secondary'}>
                      {getStatusText(sale.status)}
                    </Badge>
                  </div>
                </div>
              ))}
              {recentSales.length === 0 && (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">No hay ventas recientes</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
