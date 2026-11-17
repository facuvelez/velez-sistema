import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Calendar, Download, Filter, TrendingUp, Users, DollarSign, AlertTriangle, Check, ChevronsUpDown, Trophy, Crown, Medal, Award, Clock, CreditCard, TrendingDown, BarChart3 } from "lucide-react";
import { Client, Service, Debt, Payment } from '@/types/shared';
import { Cheque } from '@/hooks/useCheques';
import { formatCurrency } from "@/utils/numberFormatter";
import { format, parseISO, isWithinInterval, startOfMonth, endOfMonth, differenceInDays, addDays } from "date-fns";
import { generateAnalyticsPDF } from "@/utils/analyticsPdfGenerator";

// Custom tooltip formatter to display terms in Spanish
const customTooltipFormatter = (value: any, name: string, props: any) => {
  const translations: { [key: string]: string } = {
    'revenue': 'Ingresos',
    'count': 'Cantidad',
    'amount': 'Monto',
    'clients': 'Clientes',
    'formattedRevenue': 'Ingresos',
    'formattedAmount': 'Monto',
    'Pagado': 'Pagado',
    'Parcial': 'Parcial',
    'Pendiente': 'Pendiente',
    'Efectivo': 'Efectivo',
    'Tarjeta de Crédito': 'Tarjeta de Crédito',
    'Tarjeta de Débito': 'Tarjeta de Débito',
    'Transferencia Bancaria': 'Transferencia Bancaria',
    'Cheque': 'Cheque'
  };
  
  const translatedName = translations[name] || name;
  return [value, translatedName];
};

const customLabelFormatter = (label: string, payload: any[]) => {
  if (payload && payload.length > 0) {
    return label;
  }
  return label;
};

// Custom tooltip formatter specifically for pie charts
const pieTooltipFormatter = (value: any, name: string, props: any) => {
  if (typeof value === 'number') {
    return [value, name];
  }
  return [value, name];
};

const pieTooltipLabelFormatter = (label: string, payload: any[]) => {
  return label;
};

interface AnalyticsDashboardProps {
  clients: Client[];
  services: Service[];
  debts: Debt[];
  payments: Payment[];
  cheques: Cheque[];
}

const AnalyticsDashboard = ({ clients, services, debts, payments, cheques }: AnalyticsDashboardProps) => {
  const [dateRange, setDateRange] = useState({
    startDate: format(new Date(new Date().getFullYear(), 0, 1), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd')
  });
  const [selectedClient, setSelectedClient] = useState<string>("all");
  const [clientSearchOpen, setClientSearchOpen] = useState(false);

  // Color schemes for charts with distinct colors that work with Recharts
  const COLORS = {
    primary: [
      '#3b82f6', // Blue
      '#ef4444', // Red  
      '#22c55e', // Green
      '#eab308', // Yellow
      '#a855f7', // Purple
      '#06b6d4', // Cyan
      '#f97316', // Orange
      '#ec4899', // Pink
      '#84cc16', // Lime
      '#6366f1'  // Indigo
    ],
    status: {
      paid: '#22c55e',   // Green
      partial: '#eab308', // Yellow
      pending: '#ef4444'  // Red
    }
  };

  // Filter data based on date range and selected client
  const filteredServices = useMemo(() => {
    return services.filter(service => {
      const serviceDate = parseISO(service.date);
      const start = parseISO(dateRange.startDate);
      const end = parseISO(dateRange.endDate);
      const isInDateRange = isWithinInterval(serviceDate, { start, end });
      const isSelectedClient = selectedClient === "all" || service.clientId === selectedClient;
      
      return isInDateRange && isSelectedClient;
    });
  }, [services, dateRange, selectedClient]);

  const filteredDebts = useMemo(() => {
    return debts.filter(debt => {
      const service = services.find(s => s.id === debt.serviceId);
      if (!service) return false;
      
      const serviceDate = parseISO(service.date);
      const start = parseISO(dateRange.startDate);
      const end = parseISO(dateRange.endDate);
      const isInDateRange = isWithinInterval(serviceDate, { start, end });
      const isSelectedClient = selectedClient === "all" || debt.clientId === selectedClient;
      
      return isInDateRange && isSelectedClient;
    });
  }, [debts, services, dateRange, selectedClient]);

  // 1. Monthly Sales Data
  const monthlySalesData = useMemo(() => {
    const monthlyData: { [key: string]: number } = {};
    
    filteredServices.forEach(service => {
      const monthKey = format(parseISO(service.date), 'yyyy-MM');
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + service.amount;
    });

    return Object.entries(monthlyData)
      .map(([month, revenue]) => ({
        month: format(parseISO(month + '-01'), 'MMM yyyy'),
        revenue,
        formattedRevenue: formatCurrency(revenue),
        sortKey: month // Keep original YYYY-MM format for sorting
      }))
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey)); // Sort by YYYY-MM format
  }, [filteredServices]);

  // 2. Most Requested Services (excluding products)
  const serviceFrequencyData = useMemo(() => {
    const serviceCount: { [key: string]: number } = {};
    const excludedProducts = ['Neumáticos', 'Repuestos', 'Llantas'];
    
    // Tipos de servicios válidos del formulario
    const validServiceTypes = [
      "Alineado",
      "Arme", 
      "Balanceo",
      "Colocar",
      "Desarme",
      "Reparación de cámara",
      "Reparación de llanta", 
      "Reparación de neumático",
      "Rotación",
      "Sacar",
      "Vulcanizado"
    ];
    
    filteredServices.forEach(service => {
      // Excluir servicios que sean productos directamente
      if (!excludedProducts.includes(service.type)) {
        // Verificar si el tipo está en la lista de servicios válidos
        if (validServiceTypes.includes(service.type)) {
          serviceCount[service.type] = (serviceCount[service.type] || 0) + 1;
        }
        // También revisar en serviceItems si contienen servicios válidos
        else if (service.serviceItems && service.serviceItems.length > 0) {
          service.serviceItems.forEach((item: any) => {
            if (validServiceTypes.includes(item.type)) {
              serviceCount[item.type] = (serviceCount[item.type] || 0) + (item.quantity || 1);
            }
          });
        }
      }
    });

    const result = Object.entries(serviceCount)
      .map(([service, count]) => ({ service, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8); // Top 8 services
    
    console.log('serviceFrequencyData:', result);
    return result;
  }, [filteredServices]);



  // 4. Payment Status Overview
  const paymentStatusData = useMemo(() => {
    const statusCount = { paid: 0, partial: 0, pending: 0 };
    
    filteredServices.forEach(service => {
      if (service.status === 'paid') statusCount.paid++;
      else if (service.status === 'partial') statusCount.partial++;
      else statusCount.pending++;
    });

    return [
      { status: 'Pagado', count: statusCount.paid, fill: COLORS.status.paid },
      { status: 'Parcial', count: statusCount.partial, fill: COLORS.status.partial },
      { status: 'Pendiente', count: statusCount.pending, fill: COLORS.status.pending }
    ].filter(item => item.count > 0);
  }, [filteredServices]);

  // 5. Preferred Payment Methods
  const paymentMethodData = useMemo(() => {
    const methodCount: { [key: string]: number } = {};
    
    filteredServices.forEach(service => {
      methodCount[service.paymentMethod] = (methodCount[service.paymentMethod] || 0) + 1;
      if (service.secondaryPaymentMethod) {
        methodCount[service.secondaryPaymentMethod] = (methodCount[service.secondaryPaymentMethod] || 0) + 1;
      }
    });

    return Object.entries(methodCount)
      .map(([method, count]) => ({ method, count }))
      .sort((a, b) => b.count - a.count);
  }, [filteredServices]);

  // 6. New Clients Per Month
  const newClientsData = useMemo(() => {
    const monthlyClients: { [key: string]: number } = {};
    
    clients.forEach(client => {
      const clientDate = parseISO(client.createdAt);
      const start = parseISO(dateRange.startDate);
      const end = parseISO(dateRange.endDate);
      
      if (isWithinInterval(clientDate, { start, end })) {
        const monthKey = format(clientDate, 'yyyy-MM');
        monthlyClients[monthKey] = (monthlyClients[monthKey] || 0) + 1;
      }
    });

    return Object.entries(monthlyClients)
      .map(([month, count]) => ({
        month: format(parseISO(month + '-01'), 'MMM yyyy'),
        clients: count
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [clients, dateRange]);







  // Calculate summary stats
  const totalRevenue = filteredServices.reduce((sum, service) => sum + service.amount, 0);
  const totalDebts = filteredDebts.reduce((sum, debt) => sum + debt.remainingAmount, 0);
  const averageServiceValue = filteredServices.length > 0 ? totalRevenue / filteredServices.length : 0;

  // ============= NEW ANALYTICS CHARTS =============
  
  // 1. DEBT AGING ANALYSIS
  const debtAgingData = useMemo(() => {
    const today = new Date();
    const ranges = {
      '0-30 días': 0,
      '31-60 días': 0,
      '61-90 días': 0,
      '+90 días': 0
    };
    
    filteredDebts.forEach(debt => {
      const service = services.find(s => s.id === debt.serviceId);
      if (!service) return;
      
      const serviceDate = parseISO(service.date);
      const daysOld = differenceInDays(today, serviceDate);
      
      if (daysOld <= 30) ranges['0-30 días'] += debt.remainingAmount;
      else if (daysOld <= 60) ranges['31-60 días'] += debt.remainingAmount;
      else if (daysOld <= 90) ranges['61-90 días'] += debt.remainingAmount;
      else ranges['+90 días'] += debt.remainingAmount;
    });
    
    return Object.entries(ranges).map(([range, amount]) => ({
      range,
      amount,
      formattedAmount: formatCurrency(amount)
    }));
  }, [filteredDebts, services]);

  // 2. CHECK STATUS DISTRIBUTION
  const chequeStatusData = useMemo(() => {
    const filteredCheques = cheques.filter(cheque => {
      const chequeDate = parseISO(cheque.created_at);
      const start = parseISO(dateRange.startDate);
      const end = parseISO(dateRange.endDate);
      return isWithinInterval(chequeDate, { start, end });
    });

    const statusCount = {
      'En cartera': 0,
      'Depositado': 0,
      'Cobrado': 0,
      'Rechazado': 0
    };
    
    filteredCheques.forEach(cheque => {
      statusCount[cheque.status] = (statusCount[cheque.status] || 0) + cheque.amount;
    });
    
    return Object.entries(statusCount)
      .filter(([_, amount]) => amount > 0)
      .map(([status, amount]) => ({
        status,
        amount,
        formattedAmount: formatCurrency(amount)
      }));
  }, [cheques, dateRange]);

  // 3. UPCOMING CHEQUES (Next 7, 15, 30 days)
  const upcomingChequesData = useMemo(() => {
    const today = new Date();
    const ranges = [
      { label: 'Próximos 7 días', days: 7 },
      { label: 'Próximos 15 días', days: 15 },
      { label: 'Próximos 30 días', days: 30 }
    ];
    
    return ranges.map(({ label, days }) => {
      const targetDate = addDays(today, days);
      const matchingCheques = cheques.filter(cheque => {
        if (cheque.status !== 'En cartera') return false;
        const paymentDate = parseISO(cheque.payment_date);
        return paymentDate >= today && paymentDate <= targetDate;
      });
      
      const amount = matchingCheques.reduce((sum, cheque) => sum + cheque.amount, 0);
      
      return {
        periodo: label,
        monto: amount,
        count: matchingCheques.length,
        formattedMonto: formatCurrency(amount)
      };
    });
  }, [cheques]);

  // 4. PROJECTED CASH FLOW vs ACTUAL
  const cashFlowData = useMemo(() => {
    const monthlyData: { [key: string]: { projected: number; actual: number } } = {};
    
    // Projected from pending cheques
    cheques
      .filter(c => c.status === 'En cartera')
      .forEach(cheque => {
        const monthKey = format(parseISO(cheque.payment_date), 'yyyy-MM');
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { projected: 0, actual: 0 };
        }
        monthlyData[monthKey].projected += cheque.amount;
      });
    
    // Actual from collected cheques
    cheques
      .filter(c => c.status === 'Cobrado' || c.status === 'Depositado')
      .forEach(cheque => {
        const monthKey = format(parseISO(cheque.payment_date), 'yyyy-MM');
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { projected: 0, actual: 0 };
        }
        monthlyData[monthKey].actual += cheque.amount;
      });
    
    return Object.entries(monthlyData)
      .map(([month, data]) => ({
        month: format(parseISO(month + '-01'), 'MMM yyyy'),
        proyectado: data.projected,
        cobrado: data.actual,
        sortKey: month
      }))
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
      .slice(-6); // Last 6 months
  }, [cheques]);


  // 6. DEBT EVOLUTION (Generated vs Collected Monthly)
  const debtEvolutionData = useMemo(() => {
    const monthlyEvolution: { [key: string]: { generated: number; collected: number } } = {};
    
    // Generated debts (from services)
    filteredServices.forEach(service => {
      const monthKey = format(parseISO(service.date), 'yyyy-MM');
      const debtAmount = service.amount - service.amountDelivered;
      if (debtAmount > 0) {
        if (!monthlyEvolution[monthKey]) {
          monthlyEvolution[monthKey] = { generated: 0, collected: 0 };
        }
        monthlyEvolution[monthKey].generated += debtAmount;
      }
    });
    
    // Collected debts (from payments)
    payments.forEach(payment => {
      const monthKey = format(parseISO(payment.date), 'yyyy-MM');
      if (!monthlyEvolution[monthKey]) {
        monthlyEvolution[monthKey] = { generated: 0, collected: 0 };
      }
      monthlyEvolution[monthKey].collected += payment.amount;
    });
    
    return Object.entries(monthlyEvolution)
      .map(([month, data]) => ({
        month: format(parseISO(month + '-01'), 'MMM yyyy'),
        generadas: data.generated,
        cobradas: data.collected,
        sortKey: month
      }))
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  }, [filteredServices, payments]);

  // 7. PAYMENT METHOD EFFECTIVENESS
  const paymentMethodEffectiveness = useMemo(() => {
    const methodStats: { [key: string]: { total: number; paid: number; avgDays: number; count: number } } = {};
    
    filteredServices.forEach(service => {
      const method = service.paymentMethod;
      if (!methodStats[method]) {
        methodStats[method] = { total: 0, paid: 0, avgDays: 0, count: 0 };
      }
      
      methodStats[method].total++;
      if (service.status === 'paid') {
        methodStats[method].paid++;
        
        // Calculate avg collection days for paid services
        const serviceDate = parseISO(service.date);
        const today = new Date();
        methodStats[method].avgDays += differenceInDays(today, serviceDate);
        methodStats[method].count++;
      }
    });
    
    return Object.entries(methodStats)
      .map(([method, stats]) => ({
        metodo: method,
        tasaExito: stats.total > 0 ? (stats.paid / stats.total) * 100 : 0,
        diasPromedio: stats.count > 0 ? Math.round(stats.avgDays / stats.count) : 0
      }))
      .sort((a, b) => b.tasaExito - a.tasaExito);
  }, [filteredServices]);

  // 8. INVOICED VS COLLECTED MONTHLY
  const invoicedVsCollectedData = useMemo(() => {
    const monthlyComparison: { [key: string]: { invoiced: number; collected: number } } = {};
    
    // Invoiced (from services total amount)
    filteredServices.forEach(service => {
      const monthKey = format(parseISO(service.date), 'yyyy-MM');
      if (!monthlyComparison[monthKey]) {
        monthlyComparison[monthKey] = { invoiced: 0, collected: 0 };
      }
      monthlyComparison[monthKey].invoiced += service.amount;
      monthlyComparison[monthKey].collected += service.amountDelivered;
    });
    
    // Add debt payments to collected
    payments.forEach(payment => {
      const monthKey = format(parseISO(payment.date), 'yyyy-MM');
      if (!monthlyComparison[monthKey]) {
        monthlyComparison[monthKey] = { invoiced: 0, collected: 0 };
      }
      monthlyComparison[monthKey].collected += payment.amount;
    });
    
    return Object.entries(monthlyComparison)
      .map(([month, data]) => ({
        month: format(parseISO(month + '-01'), 'MMM yyyy'),
        facturado: data.invoiced,
        cobrado: data.collected,
        brecha: data.invoiced - data.collected,
        sortKey: month
      }))
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  }, [filteredServices, payments]);

  // Top 50 Clients Ranking by Money Spent (only paid money)
  const topClientsRanking = useMemo(() => {
    const clientPayments: { [key: string]: number } = {};
    
    console.log('=== DEBUG: Ranking Calculation ===');
    console.log('Total filteredServices:', filteredServices.length);
    
    filteredServices.forEach(service => {
      const paidAmount = service.amountDelivered || 0;
      if (paidAmount > 0) {
        const prevAmount = clientPayments[service.clientId] || 0;
        clientPayments[service.clientId] = prevAmount + paidAmount;
        console.log(`Client ${service.clientId}: ${prevAmount} + ${paidAmount} = ${clientPayments[service.clientId]}`);
      }
    });

    console.log('=== Client Payments Object ===', clientPayments);
    console.log('Number of unique clients:', Object.keys(clientPayments).length);

    const ranking = Object.entries(clientPayments)
      .map(([clientId, totalPaid]) => {
        const client = clients.find(c => c.id === clientId);
        const clientName = client 
          ? client.type === 'Empresa' && client.firstName 
            ? client.firstName // Para empresas, usar el campo firstName como nombre de empresa
            : `${client.firstName} ${client.lastName}` // Para personas, nombre completo
          : 'Cliente Desconocido';
        
        console.log(`Mapping client: ${clientId} -> ${clientName} (${totalPaid})`);
        
        return {
          clientId: clientId,
          clientName,
          clientType: client?.type || 'Desconocido',
          totalPaid,
          formattedAmount: formatCurrency(totalPaid)
        };
      })
      .sort((a, b) => b.totalPaid - a.totalPaid)
      .slice(0, 50) // Top 50 clients
      .map((client, index) => ({
        ...client,
        rank: index + 1
      }));

    console.log('=== Final Ranking ===', ranking);
    console.log('Ranking entries:', ranking.length);
    
    return ranking;
  }, [filteredServices, clients]);


  // Handler to download PDF
  const handleDownloadPDF = () => {
    generateAnalyticsPDF({
      dateRange,
      selectedClient: selectedClient !== "all" ? selectedClient : undefined,
      totalRevenue,
      totalDebts,
      averageServiceValue,
      monthlySalesData,
      serviceFrequencyData,
      paymentStatusData,
      paymentMethodData,
      debtAgingData,
      chequeStatusData,
      upcomingChequesData,
      debtEvolutionData
    });
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </div>
          <Button onClick={handleDownloadPDF} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Descargar PDF
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Fecha Inicio</label>
              <Input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Fecha Fin</label>
              <Input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Cliente</label>
              <Popover open={clientSearchOpen} onOpenChange={setClientSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={clientSearchOpen}
                    className="w-full justify-between"
                  >
                    {selectedClient === "all" 
                      ? "Todos los clientes" 
                      : clients.find(client => client.id.toString() === selectedClient)
                        ? `${clients.find(client => client.id.toString() === selectedClient)!.firstName} ${clients.find(client => client.id.toString() === selectedClient)!.lastName}`
                        : "Seleccionar cliente..."
                    }
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Buscar cliente..." />
                    <CommandList>
                      <CommandEmpty>No se encontraron clientes.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          key="all"
                          value="all"
                          onSelect={() => {
                            setSelectedClient("all");
                            setClientSearchOpen(false);
                          }}
                        >
                          <Check
                            className={`mr-2 h-4 w-4 ${
                              selectedClient === "all" ? "opacity-100" : "opacity-0"
                            }`}
                          />
                          Todos los clientes
                        </CommandItem>
                        {clients.map((client) => (
                          <CommandItem
                            key={client.id}
                            value={`${client.firstName} ${client.lastName}`}
                            onSelect={() => {
                              setSelectedClient(client.id.toString());
                              setClientSearchOpen(false);
                            }}
                          >
                            <Check
                              className={`mr-2 h-4 w-4 ${
                                selectedClient === client.id.toString() ? "opacity-100" : "opacity-0"
                              }`}
                            />
                            {client.firstName} {client.lastName}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ingresos Totales</p>
                <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Deudas Activas</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(totalDebts)}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Servicios Totales</p>
                <p className="text-2xl font-bold">{filteredServices.length}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Valor Promedio</p>
                <p className="text-2xl font-bold">{formatCurrency(averageServiceValue)}</p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="space-y-6">
        {/* 1. Monthly Sales Graph - Full Width */}
        <Card>
          <CardHeader>
            <CardTitle>Ventas Mensuales</CardTitle>
            <CardDescription>Ingresos facturados por mes</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={monthlySalesData} margin={{ left: 20, right: 20, top: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis 
                  dataKey="month" 
                  className="fill-foreground"
                />
                <YAxis 
                  tickFormatter={(value) => formatCurrency(value)}
                  className="fill-foreground"
                  width={80}
                />
                <Tooltip 
                  formatter={customTooltipFormatter}
                  labelFormatter={customLabelFormatter}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--popover-foreground))'
                  }}
                />
                <Line 
                  type="monotone"
                  dataKey="revenue" 
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 2. Most Requested Services */}
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Servicios Más Solicitados</CardTitle>
              <CardDescription>Frecuencia de cada tipo de servicio</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                 <PieChart>
                   <Pie
                     data={serviceFrequencyData}
                     cx="50%"
                     cy="50%"
                     labelLine={false}
                     label={({ service, count }) => `${service}: ${count}`}
                     outerRadius={120}
                     fill="hsl(var(--primary))"
                     dataKey="count"
                   >
                     {serviceFrequencyData.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={COLORS.primary[index % COLORS.primary.length]} />
                     ))}
                   </Pie>
                    <Tooltip 
                      formatter={pieTooltipFormatter}
                      labelFormatter={pieTooltipLabelFormatter}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        color: 'hsl(var(--popover-foreground))'
                      }}
                    />
                 </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Other charts in grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* 4. Payment Status Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Estado de Pagos</CardTitle>
              <CardDescription>Distribución de estados de facturación</CardDescription>
            </CardHeader>
            <CardContent>
               <ResponsiveContainer width="100%" height={300}>
                 <PieChart>
                   <Pie
                     data={paymentStatusData}
                     cx="50%"
                     cy="50%"
                     labelLine={false}
                     label={({ status, count }) => `${status}: ${count}`}
                     outerRadius={80}
                     dataKey="count"
                   >
                     {paymentStatusData.map((entry, index) => {
                       const color = COLORS.primary[index % COLORS.primary.length];
                       console.log(`Aplicando color ${color} para ${entry.status} en índice ${index}`);
                       return (
                         <Cell 
                           key={`payment-status-${index}`} 
                           fill={color}
                           stroke="#ffffff"
                           strokeWidth={2}
                         />
                       );
                     })}
                   </Pie>
                    <Tooltip 
                      formatter={pieTooltipFormatter}
                      labelFormatter={pieTooltipLabelFormatter}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        color: 'hsl(var(--popover-foreground))'
                      }}
                    />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* 5. Preferred Payment Methods */}
          <Card>
            <CardHeader>
              <CardTitle>Métodos de Pago Preferidos</CardTitle>
              <CardDescription>Porcentaje de uso de cada método</CardDescription>
            </CardHeader>
            <CardContent>
               <ResponsiveContainer width="100%" height={300}>
                 <PieChart>
                   <Pie
                     data={paymentMethodData}
                     cx="50%"
                     cy="50%"
                     labelLine={false}
                     label={({ method, count }) => `${method}: ${count}`}
                     outerRadius={80}
                     dataKey="count"
                   >
                     {paymentMethodData.map((entry, index) => {
                       const color = COLORS.primary[index % COLORS.primary.length];
                       console.log(`Aplicando color ${color} para método ${entry.method} en índice ${index}`);
                       return (
                         <Cell 
                           key={`payment-method-${index}`} 
                           fill={color}
                           stroke="#ffffff"
                           strokeWidth={2}
                         />
                       );
                     })}
                   </Pie>
                    <Tooltip 
                      formatter={pieTooltipFormatter}
                      labelFormatter={pieTooltipLabelFormatter}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        color: 'hsl(var(--popover-foreground))'
                      }}
                    />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

        </div>

        {/* ==================== NEW ANALYTICS SECTION ==================== */}
        <div className="space-y-6 mt-8">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Análisis Avanzado de Control Financiero
          </h2>

          {/* 1. DEBT AGING ANALYSIS */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Análisis de Antigüedad de Deudas
              </CardTitle>
              <CardDescription>Distribución de deudas activas por rangos de antigüedad</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={debtAgingData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ range, amount, percent }) => 
                      `${range}: ${formatCurrency(amount)} (${(percent * 100).toFixed(1)}%)`
                    }
                    outerRadius={120}
                    innerRadius={60}
                    dataKey="amount"
                    paddingAngle={2}
                  >
                    {debtAgingData.map((entry, index) => (
                      <Cell key={`debt-aging-${index}`} fill={COLORS.primary[index % COLORS.primary.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any) => [formatCurrency(value), 'Monto']}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--popover-foreground))'
                    }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    formatter={(value, entry: any) => `${entry.payload.range}`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* 2. CHECK STATUS AND CONTROL */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Estado de Cheques
                </CardTitle>
                <CardDescription>Distribución por estado actual</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={chequeStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ status, amount }) => `${status}: ${formatCurrency(amount)}`}
                      outerRadius={90}
                      dataKey="amount"
                    >
                      {chequeStatusData.map((entry, index) => (
                        <Cell key={`cheque-status-${index}`} fill={COLORS.primary[index % COLORS.primary.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: any) => [formatCurrency(value), 'Monto']}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        color: 'hsl(var(--popover-foreground))'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Cheques por Vencer
                </CardTitle>
                <CardDescription>Próximos vencimientos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingChequesData.map((item, index) => {
                    const getUrgencyColor = (periodo: string) => {
                      if (periodo.includes('7')) return 'destructive';
                      if (periodo.includes('15')) return 'default';
                      return 'secondary';
                    };

                    const getUrgencyIcon = (periodo: string) => {
                      if (periodo.includes('7')) return <AlertTriangle className="h-5 w-5 text-destructive" />;
                      if (periodo.includes('15')) return <Clock className="h-5 w-5 text-primary" />;
                      return <Calendar className="h-5 w-5 text-muted-foreground" />;
                    };

                    const percentage = upcomingChequesData.length > 0 
                      ? (item.monto / Math.max(...upcomingChequesData.map(d => d.monto))) * 100 
                      : 0;

                    return (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {getUrgencyIcon(item.periodo)}
                            <div>
                              <p className="font-medium">{item.periodo}</p>
                              <p className="text-sm text-muted-foreground">
                                {item.count} cheque{item.count !== 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>
                          <Badge variant={getUrgencyColor(item.periodo)} className="text-base px-3 py-1">
                            {formatCurrency(item.monto)}
                          </Badge>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  
                  {upcomingChequesData.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No hay cheques próximos a vencer
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 3. PROJECTED CASH FLOW */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Flujo de Caja Proyectado vs Real
              </CardTitle>
              <CardDescription>Comparación de ingresos esperados de cheques vs cobrados</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={cashFlowData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" className="fill-foreground" />
                  <YAxis 
                    tickFormatter={(value) => formatCurrency(value)}
                    className="fill-foreground"
                    width={100}
                  />
                  <Tooltip 
                    formatter={(value: any, name: string) => [
                      formatCurrency(value), 
                      name === 'proyectado' ? 'Proyectado' : 'Cobrado'
                    ]}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--popover-foreground))'
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="proyectado" 
                    stroke={COLORS.primary[0]} 
                    strokeWidth={2}
                    name="Proyectado"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="cobrado" 
                    stroke={COLORS.primary[2]} 
                    strokeWidth={2}
                    name="Cobrado"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>


          {/* 4. DEBT EVOLUTION */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Evolución de Deudas
              </CardTitle>
              <CardDescription>Deudas generadas vs cobradas por mes</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={debtEvolutionData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" className="fill-foreground" />
                  <YAxis 
                    tickFormatter={(value) => formatCurrency(value)}
                    className="fill-foreground"
                    width={100}
                  />
                  <Tooltip 
                    formatter={(value: any, name: string) => [
                      formatCurrency(value), 
                      name === 'generadas' ? 'Generadas' : 'Cobradas'
                    ]}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--popover-foreground))'
                    }}
                  />
                  <Legend />
                  <Bar key="bar-generadas" dataKey="generadas" fill={COLORS.primary[1]} name="Generadas" />
                  <Bar key="bar-cobradas" dataKey="cobradas" fill={COLORS.primary[2]} name="Cobradas" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* 6. PAYMENT METHOD EFFECTIVENESS */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Efectividad de Métodos de Pago
              </CardTitle>
              <CardDescription>Tasa de éxito y tiempo promedio de cobro</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={paymentMethodEffectiveness}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="metodo" className="fill-foreground" />
                    <YAxis className="fill-foreground" />
                    <Tooltip 
                      formatter={(value: any) => [`${value.toFixed(1)}%`, 'Tasa de Éxito']}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        color: 'hsl(var(--popover-foreground))'
                      }}
                    />
                    <Bar 
                      dataKey="tasaExito" 
                      fill={COLORS.primary[2]}
                      radius={[4, 4, 0, 0]}
                      name="Tasa de Éxito (%)"
                    />
                  </BarChart>
                </ResponsiveContainer>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={paymentMethodEffectiveness}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="metodo" className="fill-foreground" />
                    <YAxis className="fill-foreground" />
                    <Tooltip 
                      formatter={(value: any) => [`${value} días`, 'Tiempo Promedio']}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        color: 'hsl(var(--popover-foreground))'
                      }}
                    />
                    <Bar 
                      dataKey="diasPromedio" 
                      fill={COLORS.primary[4]}
                      radius={[4, 4, 0, 0]}
                      name="Días Promedio"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* 7. INVOICED VS COLLECTED */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Facturado vs Cobrado Mensual
              </CardTitle>
              <CardDescription>Comparación de montos facturados vs efectivamente cobrados</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={invoicedVsCollectedData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" className="fill-foreground" />
                  <YAxis 
                    tickFormatter={(value) => formatCurrency(value)}
                    className="fill-foreground"
                    width={100}
                  />
                  <Tooltip 
                    formatter={(value: any, name: string) => {
                      const labels: any = {
                        'facturado': 'Facturado',
                        'cobrado': 'Cobrado',
                        'brecha': 'Brecha'
                      };
                      return [formatCurrency(value), labels[name] || name];
                    }}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--popover-foreground))'
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="facturado" 
                    stroke={COLORS.primary[0]} 
                    strokeWidth={2}
                    name="Facturado"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="cobrado" 
                    stroke={COLORS.primary[2]} 
                    strokeWidth={2}
                    name="Cobrado"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="brecha" 
                    stroke={COLORS.primary[1]} 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="Brecha"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>


      {/* Top 50 Clients Ranking */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-600" />
            Ranking de Clientes por Dinero Gastado
          </CardTitle>
          <CardDescription>Top 50 clientes que más dinero han pagado (solo montos efectivamente abonados)</CardDescription>
        </CardHeader>
        <CardContent>
          {topClientsRanking.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Pos.</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="w-24">Tipo</TableHead>
                  <TableHead className="text-right">Total Pagado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topClientsRanking.map((client) => (
                  <TableRow key={client.clientId} className={client.rank <= 3 ? "bg-muted/50" : ""}>
                    <TableCell className="text-center font-bold">
                      <div className="flex items-center justify-center">
                        {client.rank === 1 && <Crown className="h-5 w-5 text-yellow-500 mr-1" />}
                        {client.rank === 2 && <Medal className="h-5 w-5 text-gray-400 mr-1" />}
                        {client.rank === 3 && <Award className="h-5 w-5 text-amber-600 mr-1" />}
                        <span className={
                          client.rank === 1 ? "text-yellow-600 font-bold text-lg" :
                          client.rank === 2 ? "text-gray-600 font-bold" :
                          client.rank === 3 ? "text-amber-600 font-bold" :
                          "text-foreground"
                        }>
                          #{client.rank}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {client.clientName}
                    </TableCell>
                    <TableCell>
                      <Badge variant={client.clientType === 'Empresa' ? 'default' : 'outline'}>
                        {client.clientType === 'Empresa' ? 'Empresa' : 'Persona'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      <span className={
                        client.rank === 1 ? "text-yellow-600 text-lg" :
                        client.rank === 2 ? "text-gray-600" :
                        client.rank === 3 ? "text-amber-600" :
                        "text-green-600"
                      }>
                        {client.formattedAmount}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No hay datos de pagos para mostrar en el ranking
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
};

export default AnalyticsDashboard;
