import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Calendar, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Filter,
  Eye,
  Edit,
  ArrowUpDown,
  Search,
  ChevronLeft,
  ChevronRight,
  Info,
  CreditCard,
  Building,
  User,
  Phone,
  Mail
} from "lucide-react";
import { formatCurrency } from "@/utils/numberFormatter";
import { useCheques, Cheque } from "@/hooks/useCheques";
import { format, isAfter, isBefore, addDays } from "date-fns";
import { es } from "date-fns/locale";

type SortField = 'payment_date' | 'amount' | 'bank_name' | 'status' | 'client_name';
type SortDirection = 'asc' | 'desc';

const getStatusColor = (status: string) => {
  switch (status) {
    case 'En cartera':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
    case 'Depositado':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
    case 'Cobrado':
      return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    case 'Rechazado':
      return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'En cartera':
      return <Clock className="h-3 w-3" />;
    case 'Depositado':
      return <Clock className="h-3 w-3" />;
    case 'Cobrado':
      return <CheckCircle className="h-3 w-3" />;
    case 'Rechazado':
      return <XCircle className="h-3 w-3" />;
    default:
      return <Clock className="h-3 w-3" />;
  }
};

const isOverdue = (paymentDate: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const chequeDate = new Date(paymentDate);
  chequeDate.setHours(0, 0, 0, 0);
  return isBefore(chequeDate, today);
};

const isUpcoming = (paymentDate: string, days: number = 3) => {
  const today = new Date();
  const futureDate = addDays(today, days);
  const chequeDate = new Date(paymentDate);
  return isAfter(chequeDate, today) && isBefore(chequeDate, futureDate);
};

const ChequesList = () => {
  const {
    cheques,
    loading,
    updateCheque,
    deleteCheque,
    getPendingCheques,
    getUpcomingCheques,
    getOverdueCheques,
    getRejectedCheques
  } = useCheques();

  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('payment_date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [selectedCheque, setSelectedCheque] = useState<Cheque | null>(null);

  const filteredAndSortedCheques = useMemo(() => {
    let filtered = cheques.filter(cheque => {
      const matchesSearch = searchTerm === '' || 
        cheque.bank_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cheque.cheque_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cheque.holder_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (cheque.clients && 
          (`${cheque.clients.first_name} ${cheque.clients.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
           (cheque.clients.company_name && cheque.clients.company_name.toLowerCase().includes(searchTerm.toLowerCase())))) ||
        (cheque.services && cheque.services.service_type.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = filterStatus === 'all' || cheque.status === filterStatus;
      const matchesType = filterType === 'all' || cheque.cheque_type === filterType;
      
      return matchesSearch && matchesStatus && matchesType;
    });

    // Sort
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortField) {
        case 'payment_date':
          aValue = new Date(a.payment_date);
          bValue = new Date(b.payment_date);
          break;
        case 'amount':
          aValue = a.amount;
          bValue = b.amount;
          break;
        case 'bank_name':
          aValue = a.bank_name.toLowerCase();
          bValue = b.bank_name.toLowerCase();
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'client_name':
          aValue = a.clients ? `${a.clients.first_name} ${a.clients.last_name}`.toLowerCase() : '';
          bValue = b.clients ? `${b.clients.first_name} ${b.clients.last_name}`.toLowerCase() : '';
          break;
        default:
          aValue = a.payment_date;
          bValue = b.payment_date;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [cheques, searchTerm, filterStatus, filterType, sortField, sortDirection]);

  const paginatedCheques = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedCheques.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedCheques, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredAndSortedCheques.length / itemsPerPage);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const handleStatusChange = async (chequeId: string, newStatus: string) => {
    try {
      await updateCheque(chequeId, { status: newStatus as any });
    } catch (error) {
      console.error('Error updating cheque status:', error);
    }
  };

  const handleViewImage = (imageUrl: string) => {
    window.open(imageUrl, '_blank');
  };

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      size="sm"
      className="h-8 p-0 font-medium"
      onClick={() => handleSort(field)}
    >
      {children}
      <ArrowUpDown className="ml-1 h-3 w-3" />
    </Button>
  );

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center py-8">
          <p className="dark:text-gray-300">Cargando cheques...</p>
        </div>
      </div>
    );
  }

  const pendingCheques = getPendingCheques();
  const upcomingCheques = getUpcomingCheques();
  const overdueCheques = getOverdueCheques();
  const rejectedCheques = getRejectedCheques();

  return (
    <div className="container mx-auto p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
            Gestión de Cheques
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Administre y controle sus cheques y echeqs</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <Card className="border-primary/10 bg-gradient-to-br from-blue-50/50 to-transparent dark:from-blue-950/20 dark:to-transparent hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 hover:scale-105">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">En Cartera</p>
                <p className="text-2xl lg:text-3xl font-bold text-blue-600 dark:text-blue-400">{pendingCheques.length}</p>
                <p className="text-xs text-muted-foreground">activos</p>
              </div>
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Clock className="h-5 w-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-primary/10 bg-gradient-to-br from-orange-50/50 to-transparent dark:from-orange-950/20 dark:to-transparent hover:shadow-lg hover:shadow-orange-500/10 transition-all duration-300 hover:scale-105">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Próximos</p>
                <p className="text-2xl lg:text-3xl font-bold text-orange-600 dark:text-orange-400">{upcomingCheques.length}</p>
                <p className="text-xs text-muted-foreground">a vencer</p>
              </div>
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-primary/10 bg-gradient-to-br from-red-50/50 to-transparent dark:from-red-950/20 dark:to-transparent hover:shadow-lg hover:shadow-red-500/10 transition-all duration-300 hover:scale-105">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Vencidos</p>
                <p className="text-2xl lg:text-3xl font-bold text-red-600 dark:text-red-400">{overdueCheques.length}</p>
                <p className="text-xs text-muted-foreground">atrasados</p>
              </div>
              <div className="p-2 bg-red-500/10 rounded-lg">
                <XCircle className="h-5 w-5 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-primary/10 bg-gradient-to-br from-green-50/50 to-transparent dark:from-green-950/20 dark:to-transparent hover:shadow-lg hover:shadow-green-500/10 transition-all duration-300 hover:scale-105">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Total</p>
                <p className="text-2xl lg:text-3xl font-bold text-green-600 dark:text-green-400">{cheques.length}</p>
                <p className="text-xs text-muted-foreground">registrados</p>
              </div>
              <div className="p-2 bg-green-500/10 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-primary/10 shadow-sm">
        <CardContent className="p-4 lg:p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por banco, número, titular o cliente..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10 h-11 border-muted-foreground/20 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
            <div className="flex gap-3">
              <Select value={filterStatus} onValueChange={(value) => {
                setFilterStatus(value);
                setCurrentPage(1);
              }}>
                <SelectTrigger className="w-full lg:w-48 h-11 border-muted-foreground/20 hover:border-primary transition-all">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los Estados</SelectItem>
                  <SelectItem value="En cartera">En cartera</SelectItem>
                  <SelectItem value="Depositado">Depositado</SelectItem>
                  <SelectItem value="Cobrado">Cobrado</SelectItem>
                  <SelectItem value="Rechazado">Rechazado</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterType} onValueChange={(value) => {
                setFilterType(value);
                setCurrentPage(1);
              }}>
                <SelectTrigger className="w-full lg:w-48 h-11 border-muted-foreground/20 hover:border-primary transition-all">
                  <CreditCard className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los Tipos</SelectItem>
                  <SelectItem value="Cheque">Cheques</SelectItem>
                  <SelectItem value="Echeq">Echeqs</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mobile Grid View */}
      <div className="md:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
        {paginatedCheques.map((cheque) => {
          const clientName = cheque.clients 
            ? `${cheque.clients.first_name} ${cheque.clients.last_name}${cheque.clients.type === 'Empresa' ? ` (${cheque.clients.company_name || 'Empresa'})` : ''}`
            : 'Cliente no encontrado';
          
          const isOverdueStatus = cheque.status === 'En cartera' && isOverdue(cheque.payment_date);
          const isUpcomingStatus = cheque.status === 'En cartera' && isUpcoming(cheque.payment_date);

          return (
            <Card 
              key={cheque.id} 
              className="border-primary/10 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 hover:scale-[1.02] bg-gradient-to-br from-background to-primary/5"
            >
              <CardContent className="p-4 space-y-3">
                {/* Status and Type */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge className={`${getStatusColor(cheque.status)} text-xs`}>
                      {getStatusIcon(cheque.status)}
                      <span className="ml-1">{cheque.status}</span>
                    </Badge>
                    {isOverdueStatus && (
                      <Badge className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 text-xs">
                        Vencido
                      </Badge>
                    )}
                    {isUpcomingStatus && (
                      <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400 text-xs">
                        Próximo
                      </Badge>
                    )}
                  </div>
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${
                      cheque.cheque_type === 'Echeq' 
                        ? 'border-purple-500 text-purple-700 dark:text-purple-400' 
                        : 'border-blue-500 text-blue-700 dark:text-blue-400'
                    }`}
                  >
                    {cheque.cheque_type || 'Cheque'}
                  </Badge>
                </div>

                {/* Amount */}
                <div className="pt-2 pb-3 border-b border-primary/10">
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(cheque.amount)}
                  </p>
                </div>

                {/* Client Info */}
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <User className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground">Cliente</p>
                      <p className="text-sm font-medium truncate">{clientName}</p>
                      {cheque.services && (
                        <p className="text-xs text-muted-foreground truncate">
                          {cheque.services.service_type}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Bank Info */}
                  <div className="flex items-start gap-2">
                    <Building className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground">Banco</p>
                      <p className="text-sm font-medium truncate">{cheque.bank_name}</p>
                      <p className="text-xs text-muted-foreground truncate">{cheque.holder_name}</p>
                    </div>
                  </div>
                </div>

                {/* Cheque Number and Date */}
                <div className="flex justify-between items-center gap-3 pt-2 border-t border-primary/10">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">N° Serie</p>
                    <p className="text-xs font-mono font-medium truncate">{cheque.cheque_number}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">F. Pago</p>
                    <p className="text-xs font-semibold">
                      {format(new Date(cheque.payment_date), 'dd/MM/yy', { locale: es })}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-primary/10">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedCheque(cheque)}
                        className="h-9 flex-1 text-xs border-primary/30 hover:bg-primary/10 hover:text-primary hover:border-primary transition-all"
                      >
                        <Info className="h-3 w-3 mr-1.5" />
                        Ver
                      </Button>
                    </DialogTrigger>
                  </Dialog>
                  {cheque.image_url && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewImage(cheque.image_url!)}
                      className="h-9 w-9 p-0 border-primary/30 hover:bg-primary/10 hover:text-primary hover:border-primary transition-all"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}
                  <Select
                    value={cheque.status}
                    onValueChange={(value) => handleStatusChange(cheque.id, value)}
                  >
                    <SelectTrigger className="h-9 w-12 text-xs p-0 border-primary/30 hover:border-primary transition-all">
                      <Edit className="h-3.5 w-3.5" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="En cartera">En cartera</SelectItem>
                      <SelectItem value="Depositado">Depositado</SelectItem>
                      <SelectItem value="Cobrado">Cobrado</SelectItem>
                      <SelectItem value="Rechazado">Rechazado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          );
        })}
        
        {filteredAndSortedCheques.length === 0 && (
          <div className="col-span-full p-12 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="p-4 bg-muted/30 rounded-full">
                <CreditCard className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <p className="text-base font-medium">No se encontraron cheques</p>
                <p className="text-sm text-muted-foreground mt-1">Intente ajustar los filtros de búsqueda</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Desktop Table View */}
      <Card className="hidden md:block border-primary/10 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30 border-b-2 border-primary/10">
                  <TableHead className="font-semibold">Estado</TableHead>
                  <TableHead className="font-semibold">Tipo</TableHead>
                  <TableHead className="font-semibold">
                    <SortButton field="client_name">Cliente</SortButton>
                  </TableHead>
                  <TableHead className="font-semibold">
                    <SortButton field="bank_name">Banco</SortButton>
                  </TableHead>
                  <TableHead className="font-semibold">N° Serie</TableHead>
                  <TableHead className="font-semibold">
                    <SortButton field="amount">Monto</SortButton>
                  </TableHead>
                  <TableHead className="font-semibold">
                    <SortButton field="payment_date">F. Pago</SortButton>
                  </TableHead>
                  <TableHead className="font-semibold text-center">Acciones</TableHead>
                </TableRow>
              </TableHeader>
            <TableBody>
              {paginatedCheques.map((cheque) => {
                const clientName = cheque.clients 
                  ? `${cheque.clients.first_name} ${cheque.clients.last_name}${cheque.clients.type === 'Empresa' ? ` (${cheque.clients.company_name || 'Empresa'})` : ''}`
                  : 'Cliente no encontrado';
                
                const isOverdueStatus = cheque.status === 'En cartera' && isOverdue(cheque.payment_date);
                const isUpcomingStatus = cheque.status === 'En cartera' && isUpcoming(cheque.payment_date);

                return (
                  <TableRow 
                    key={cheque.id} 
                    className="hover:bg-primary/5 transition-colors border-b border-muted"
                  >
                    <TableCell>
                      <div className="flex flex-col gap-1.5">
                        <Badge className={`${getStatusColor(cheque.status)} text-xs w-fit`}>
                          {getStatusIcon(cheque.status)}
                          <span className="ml-1">{cheque.status}</span>
                        </Badge>
                        {isOverdueStatus && (
                          <Badge className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 text-xs w-fit">
                            Vencido
                          </Badge>
                        )}
                        {isUpcomingStatus && (
                          <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400 text-xs w-fit">
                            Próximo
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          cheque.cheque_type === 'Echeq' 
                            ? 'border-purple-500 text-purple-700 dark:text-purple-400' 
                            : 'border-blue-500 text-blue-700 dark:text-blue-400'
                        }`}
                      >
                        {cheque.cheque_type || 'Cheque'}
                      </Badge>
                    </TableCell>
                    <TableCell className="dark:text-gray-100">
                      <div>
                        <p className="font-medium text-sm">{clientName}</p>
                        {cheque.services && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {cheque.services.service_type}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="dark:text-gray-100">
                      <p className="text-sm">{cheque.bank_name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{cheque.holder_name}</p>
                    </TableCell>
                    <TableCell className="dark:text-gray-100 text-sm">
                      {cheque.cheque_number}
                    </TableCell>
                    <TableCell>
                      <p className="font-semibold text-lg text-green-600 dark:text-green-400">
                        {formatCurrency(cheque.amount)}
                      </p>
                    </TableCell>
                    <TableCell className="text-sm font-medium">
                      {format(new Date(cheque.payment_date), 'dd/MM/yy', { locale: es })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setSelectedCheque(cheque)}
                              className="h-9 w-9 p-0 hover:bg-primary/10 hover:text-primary transition-colors"
                            >
                              <Info className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                        </Dialog>
                        {cheque.image_url && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewImage(cheque.image_url!)}
                            className="h-9 w-9 p-0 hover:bg-primary/10 hover:text-primary transition-colors"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        <Select
                          value={cheque.status}
                          onValueChange={(value) => handleStatusChange(cheque.id, value)}
                        >
                          <SelectTrigger className="h-9 w-24 text-xs border-muted-foreground/20 hover:border-primary transition-all">
                            <Edit className="h-3 w-3 mr-1" />
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="En cartera">En cartera</SelectItem>
                            <SelectItem value="Depositado">Depositado</SelectItem>
                            <SelectItem value="Cobrado">Cobrado</SelectItem>
                            <SelectItem value="Rechazado">Rechazado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
            </Table>
          </div>
          
          {filteredAndSortedCheques.length === 0 && (
            <div className="p-12 text-center border-t">
              <div className="flex flex-col items-center gap-3">
                <div className="p-4 bg-muted/30 rounded-full">
                  <CreditCard className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-base font-medium">No se encontraron cheques</p>
                  <p className="text-sm text-muted-foreground mt-1">Intente ajustar los filtros de búsqueda</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2">
          <p className="text-sm text-muted-foreground">
            Mostrando <span className="font-medium text-foreground">{((currentPage - 1) * itemsPerPage) + 1}</span> a <span className="font-medium text-foreground">{Math.min(currentPage * itemsPerPage, filteredAndSortedCheques.length)}</span> de <span className="font-medium text-foreground">{filteredAndSortedCheques.length}</span> cheques
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="h-9 w-9 p-0 border-muted-foreground/20 hover:bg-primary/10 hover:text-primary hover:border-primary disabled:opacity-50 transition-all"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-1">
              <span className="text-sm font-medium px-3 py-1.5 bg-primary/10 text-primary rounded-md">
                {currentPage}
              </span>
              <span className="text-sm text-muted-foreground">de {totalPages}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="h-9 w-9 p-0 border-muted-foreground/20 hover:bg-primary/10 hover:text-primary hover:border-primary disabled:opacity-50 transition-all"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Cheque Details Dialog */}
      {selectedCheque && (
        <Dialog open={!!selectedCheque} onOpenChange={() => setSelectedCheque(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto dark:bg-gray-800 dark:border-gray-700 p-4 sm:p-6">
            <DialogHeader className="pb-2 sm:pb-4">
              <DialogTitle className="flex items-center gap-2 dark:text-gray-100 text-base sm:text-lg">
                <CreditCard className="h-4 w-4 sm:h-5 sm:w-5" />
                Detalles del {selectedCheque.cheque_type || 'Cheque'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-3 sm:space-y-6">
              {/* Header Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={`${getStatusColor(selectedCheque.status)} text-xs`}>
                      {selectedCheque.status}
                    </Badge>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${
                        selectedCheque.cheque_type === 'Echeq' 
                          ? 'border-purple-500 text-purple-700 dark:text-purple-400' 
                          : 'border-blue-500 text-blue-700 dark:text-blue-400'
                      }`}
                    >
                      {selectedCheque.cheque_type || 'Cheque'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Monto</p>
                    <p className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">
                      {formatCurrency(selectedCheque.amount)}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Número de Serie</p>
                    <p className="text-base sm:text-lg font-semibold dark:text-gray-100 break-all">{selectedCheque.cheque_number}</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Fecha de Pago</p>
                    <p className="text-xs sm:text-sm dark:text-gray-100">
                      {format(new Date(selectedCheque.payment_date), 'dd/MM/yyyy', { locale: es })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Bank and Client Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6">
                <Card className="dark:bg-gray-900/50 dark:border-gray-600">
                  <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-6">
                    <CardTitle className="text-xs sm:text-sm flex items-center gap-2 dark:text-gray-100">
                      <Building className="h-3 w-3 sm:h-4 sm:w-4" />
                      Información Bancaria
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 p-3 sm:p-6 pt-0">
                    <div>
                      <p className="text-[10px] sm:text-xs font-medium text-gray-600 dark:text-gray-400">Banco</p>
                      <p className="text-xs sm:text-sm dark:text-gray-100 break-words">{selectedCheque.bank_name}</p>
                    </div>
                    <div>
                      <p className="text-[10px] sm:text-xs font-medium text-gray-600 dark:text-gray-400">Titular</p>
                      <p className="text-xs sm:text-sm dark:text-gray-100 break-words">{selectedCheque.holder_name}</p>
                    </div>
                    {selectedCheque.cbu_number && (
                      <div>
                        <p className="text-[10px] sm:text-xs font-medium text-gray-600 dark:text-gray-400">CBU</p>
                        <p className="text-xs sm:text-sm dark:text-gray-100 break-all">{selectedCheque.cbu_number}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-[10px] sm:text-xs font-medium text-gray-600 dark:text-gray-400">Fecha de Emisión</p>
                      <p className="text-xs sm:text-sm dark:text-gray-100">
                        {format(new Date(selectedCheque.issuance_date), 'dd/MM/yyyy', { locale: es })}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="dark:bg-gray-900/50 dark:border-gray-600">
                  <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-6">
                    <CardTitle className="text-xs sm:text-sm flex items-center gap-2 dark:text-gray-100">
                      <User className="h-3 w-3 sm:h-4 sm:w-4" />
                      Cliente y Servicio
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 p-3 sm:p-6 pt-0">
                    {selectedCheque.clients && (
                      <>
                        <div>
                          <p className="text-[10px] sm:text-xs font-medium text-gray-600 dark:text-gray-400">Cliente</p>
                          <p className="text-xs sm:text-sm dark:text-gray-100 break-words">
                            {`${selectedCheque.clients.first_name} ${selectedCheque.clients.last_name}`}
                            {selectedCheque.clients.type === 'Empresa' && selectedCheque.clients.company_name && (
                              <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 block">
                                ({selectedCheque.clients.company_name})
                              </span>
                            )}
                          </p>
                        </div>
                      </>
                    )}
                    {selectedCheque.services && (
                      <>
                        <div>
                          <p className="text-[10px] sm:text-xs font-medium text-gray-600 dark:text-gray-400">Servicio</p>
                          <p className="text-xs sm:text-sm dark:text-gray-100 break-words">{selectedCheque.services.service_type}</p>
                        </div>
                        <div>
                          <p className="text-[10px] sm:text-xs font-medium text-gray-600 dark:text-gray-400">Monto del Servicio</p>
                          <p className="text-xs sm:text-sm dark:text-gray-100">
                            {formatCurrency(selectedCheque.services.total_amount)}
                          </p>
                        </div>
                      </>
                    )}
                    <div>
                      <p className="text-[10px] sm:text-xs font-medium text-gray-600 dark:text-gray-400">Fecha de Creación</p>
                      <p className="text-xs sm:text-sm dark:text-gray-100">
                        {format(new Date(selectedCheque.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Notes */}
              {selectedCheque.notes && (
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Observaciones</p>
                  <p className="text-xs sm:text-sm p-2 sm:p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg dark:text-gray-100 break-words">
                    {selectedCheque.notes}
                  </p>
                </div>
              )}

              {/* Image */}
              {selectedCheque.image_url && (
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Imagen</p>
                  <Button
                    variant="outline"
                    onClick={() => handleViewImage(selectedCheque.image_url!)}
                    className="dark:bg-gray-700 dark:border-gray-600 w-full sm:w-auto text-xs sm:text-sm"
                  >
                    <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                    Ver Imagen del {selectedCheque.cheque_type || 'Cheque'}
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default ChequesList;