import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { CalendarIcon, Upload, X, DollarSign, Building, CreditCard, User, CheckCircle, Clock, XCircle, CalendarDays, Info } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/numberFormatter";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { handleNameInput } from "@/utils/textFormatters";

interface ChequeFormProps {
  onSave: (chequeData: any) => void;
  onCancel: () => void;
  clientId: string;
  serviceId?: string;
  debtPaymentId?: string;
  defaultAmount?: number;
}

const ChequeForm = ({ 
  onSave, 
  onCancel, 
  clientId, 
  serviceId, 
  debtPaymentId, 
  defaultAmount 
}: ChequeFormProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    bankName: '',
    chequeNumber: '',
    amount: defaultAmount ? formatCurrency(defaultAmount) : '',
    holderName: '',
    cbuNumber: '',
    status: 'En cartera',
    notes: ''
  });

  const [issuanceDate, setIssuanceDate] = useState<Date | undefined>(new Date());
  const [paymentDate, setPaymentDate] = useState<Date | undefined>(new Date());
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const formatNumberWithDots = (value: string) => {
    const numbers = value.replace(/[^\d]/g, '');
    return numbers.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const formattedValue = formatNumberWithDots(rawValue);
    setFormData({ ...formData, amount: formattedValue });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          variant: "destructive",
          title: "Tipo de archivo no válido",
          description: "Solo se permiten archivos JPG, PNG o PDF"
        });
        return;
      }
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "Archivo muy grande",
          description: "El archivo no puede superar los 5MB"
        });
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const uploadFile = async () => {
    if (!selectedFile) return null;
    
    try {
      setUploading(true);
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${clientId}/${fileName}`;

      const { data, error } = await supabase.storage
        .from('cheques')
        .upload(filePath, selectedFile);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('cheques')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        variant: "destructive",
        title: "Error al subir archivo",
        description: "No se pudo subir la imagen del cheque"
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.bankName || !formData.chequeNumber || !formData.amount || 
        !formData.holderName || !issuanceDate || !paymentDate) {
      toast({
        variant: "destructive",
        title: "Campos requeridos",
        description: "Por favor complete todos los campos obligatorios"
      });
      return;
    }

    const imageUrl = await uploadFile();
    
    const chequeData = {
      client_id: clientId,
      service_id: serviceId,
      debt_payment_id: debtPaymentId,
      bank_name: formData.bankName,
      cheque_number: formData.chequeNumber,
      amount: parseFloat(formData.amount.replace(/\./g, '')),
      issuance_date: issuanceDate.toISOString().split('T')[0],
      payment_date: paymentDate.toISOString().split('T')[0],
      holder_name: formData.holderName,
      cbu_number: formData.cbuNumber || null,
      status: formData.status,
      image_url: imageUrl,
      notes: formData.notes || null
    };

    onSave(chequeData);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <Card className="w-full max-w-5xl max-h-[92vh] overflow-hidden border-primary/20 shadow-2xl bg-gradient-to-br from-background via-background to-primary/5">
        <CardHeader className="border-b border-primary/10 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 pb-6">
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Registrar Cheque
              </CardTitle>
              <p className="text-sm text-muted-foreground">Complete la información del cheque con precisión</p>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onCancel}
              className="hover:bg-destructive/10 hover:text-destructive transition-colors"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6 max-h-[calc(92vh-8rem)] overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Banco */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <Building className="h-4 w-4 text-primary" />
                  Banco *
                </Label>
                <Input
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  placeholder="Ej: Banco Nación, Santander..."
                  className="h-11 border-muted-foreground/20 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  required
                />
              </div>

              {/* Número de Cheque */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-primary" />
                  Número de Cheque *
                </Label>
                <Input
                  value={formData.chequeNumber}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 8);
                    setFormData({ ...formData, chequeNumber: value });
                  }}
                  maxLength={8}
                  placeholder="Ej: 12345678"
                  className="h-11 border-muted-foreground/20 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-mono"
                  required
                />
              </div>

              {/* Monto */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-primary" />
                  Monto *
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">$</span>
                  <Input
                    value={formData.amount}
                    onChange={handleAmountChange}
                    placeholder="0"
                    className="h-11 pl-7 border-muted-foreground/20 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-semibold text-lg"
                    required
                  />
                </div>
              </div>

              {/* Titular del Cheque */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  Emisor del Cheque *
                </Label>
                <Input
                  value={formData.holderName}
                  onChange={(e) => {
                    handleNameInput(e.target.value, (formattedValue) => {
                      setFormData({ ...formData, holderName: formattedValue });
                    });
                  }}
                  placeholder="Nombre completo del titular"
                  className="h-11 border-muted-foreground/20 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  required
                />
              </div>

              {/* Fecha de Emisión */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-primary" />
                  Fecha de Emisión *
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full h-11 justify-start text-left font-normal border-muted-foreground/20 hover:border-primary hover:bg-primary/5 transition-all",
                        !issuanceDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {issuanceDate ? format(issuanceDate, "dd/MM/yyyy") : <span>Seleccionar fecha</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={issuanceDate}
                      onSelect={setIssuanceDate}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Fecha de Pago */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-primary" />
                  Fecha de Pago *
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full h-11 justify-start text-left font-normal border-muted-foreground/20 hover:border-primary hover:bg-primary/5 transition-all",
                        !paymentDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {paymentDate ? format(paymentDate, "dd/MM/yyyy") : <span>Seleccionar fecha</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={paymentDate}
                      onSelect={setPaymentDate}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* CBU */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  CBU (Opcional)
                </Label>
                <Input
                  value={formData.cbuNumber}
                  onChange={(e) => setFormData({ ...formData, cbuNumber: e.target.value })}
                  placeholder="22 dígitos"
                  className="h-11 border-muted-foreground/20 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-mono"
                />
              </div>

              {/* Estado */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  Estado *
                </Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger className="h-11 border-muted-foreground/20 hover:border-primary transition-all">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="En cartera">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-blue-500" />
                        En cartera
                      </div>
                    </SelectItem>
                    <SelectItem value="Depositado">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-yellow-500" />
                        Depositado
                      </div>
                    </SelectItem>
                    <SelectItem value="Cobrado">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Cobrado
                      </div>
                    </SelectItem>
                    <SelectItem value="Rechazado">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-500" />
                        Rechazado
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Imagen del Cheque */}
            <div className="space-y-2 p-6 rounded-lg border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 transition-colors bg-muted/20">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <Upload className="h-4 w-4 text-primary" />
                Imagen del Cheque (Opcional)
              </Label>
              <p className="text-xs text-muted-foreground">JPG, PNG o PDF - Máximo 5MB</p>
              <div className="mt-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,application/pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-12 border-primary/30 hover:bg-primary/5 hover:border-primary transition-all"
                >
                  <Upload className="h-5 w-5 mr-2" />
                  {selectedFile ? selectedFile.name : 'Seleccionar archivo'}
                </Button>
                {selectedFile && (
                  <div className="mt-3 p-3 bg-primary/5 rounded-md border border-primary/20">
                    <p className="text-sm text-foreground font-medium flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {(selectedFile.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Notas */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <Info className="h-4 w-4 text-muted-foreground" />
                Notas (Opcional)
              </Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Observaciones adicionales sobre el cheque..."
                className="min-h-[100px] border-muted-foreground/20 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                rows={3}
              />
            </div>

            {/* Botones */}
            <div className="flex gap-4 pt-6 border-t border-primary/10">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel} 
                className="flex-1 h-12 border-muted-foreground/30 hover:bg-muted/50 transition-all"
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="flex-1 h-12 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/25 transition-all"
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Guardar Cheque
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChequeForm;