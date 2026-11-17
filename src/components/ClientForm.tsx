
import { useState } from "react";
import { handleNameInput } from "@/utils/textFormatters";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { X } from "lucide-react";

interface ClientFormProps {
  onClose: () => void;
  onSave: (client: any) => void;
}

const ClientForm = ({ onClose, onSave }: ClientFormProps) => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    city: "",
    notes: "",
    type: "Persona",
    taxId: "",
    needsLegalInvoice: false
  });

  const isCompany = formData.type === "Empresa";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // For companies, only firstName is required. For individuals, both firstName and lastName are required.
    const baseValid = isCompany 
      ? formData.firstName && formData.phone 
      : formData.firstName && formData.lastName && formData.phone;
    
    if (baseValid) {
      // For companies, clear lastName to avoid confusion
      const clientData = isCompany 
        ? { ...formData, lastName: "" }
        : formData;
      onSave(clientData);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    let value = e.target.value;
    
    // Format CUIL/CUIT with hyphens
    if (e.target.name === 'taxId') {
      // Remove all non-numeric characters
      const numbers = value.replace(/\D/g, '');
      
      // Format as XX-XXXXXXXX-X
      if (numbers.length <= 2) {
        value = numbers;
      } else if (numbers.length <= 10) {
        value = `${numbers.slice(0, 2)}-${numbers.slice(2)}`;
      } else {
        value = `${numbers.slice(0, 2)}-${numbers.slice(2, 10)}-${numbers.slice(10, 11)}`;
      }
    }
    
    setFormData({
      ...formData,
      [e.target.name]: value
    });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value,
      // Clear lastName when switching to company type
      ...(name === "type" && value === "Empresa" ? { lastName: "" } : {})
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Agregar Nuevo Cliente</CardTitle>
              <CardDescription>Complete la información del cliente</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="type">Tipo de Cliente *</Label>
              <Select value={formData.type} onValueChange={(value) => handleSelectChange("type", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Persona">Persona</SelectItem>
                  <SelectItem value="Empresa">Empresa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className={isCompany ? "" : "grid grid-cols-2 gap-4"}>
              <div>
                <Label htmlFor="firstName">
                  {isCompany ? "Nombre de la Empresa *" : "Nombre *"}
                </Label>
                <Input
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={(e) => {
                    const { name, value } = e.target;
                    if (name === 'firstName') {
                      handleNameInput(value, (formattedValue) => {
                        setFormData(prev => ({ ...prev, [name]: formattedValue }));
                      });
                    } else {
                      handleChange(e);
                    }
                  }}
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck="false"
                  data-form-type="other"
                  required
                />
              </div>
              {!isCompany && (
                <div>
                  <Label htmlFor="lastName">Apellido *</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={(e) => {
                      const { name, value } = e.target;
                      if (name === 'lastName') {
                        handleNameInput(value, (formattedValue) => {
                          setFormData(prev => ({ ...prev, [name]: formattedValue }));
                        });
                      } else {
                        handleChange(e);
                      }
                    }}
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck="false"
                    data-form-type="other"
                    required
                  />
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="phone">Teléfono (WhatsApp) *</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder="+52 123 456 7890"
                value={formData.phone}
                onChange={handleChange}
                autoComplete="off"
                autoCorrect="off"
                spellCheck="false"
                data-form-type="other"
                required
              />
            </div>

            <div>
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="cliente@email.com"
                value={formData.email}
                onChange={handleChange}
                autoComplete="off"
                autoCorrect="off"
                spellCheck="false"
                data-form-type="other"
              />
            </div>

            <div>
              <Label htmlFor="city">Ciudad</Label>
              <Input
                id="city"
                name="city"
                placeholder="Nombre de la ciudad"
                value={formData.city}
                onChange={handleChange}
                autoComplete="off"
                autoCorrect="off"
                spellCheck="false"
                data-form-type="other"
              />
            </div>

            <div>
              <Label htmlFor="taxId">CUIT / CUIL (opcional)</Label>
              <Input
                id="taxId"
                name="taxId"
                placeholder="20-12345678-9"
                value={formData.taxId}
                onChange={handleChange}
                autoComplete="off"
                autoCorrect="off"
                spellCheck="false"
                data-form-type="other"
              />
            </div>

            <div>
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Notas adicionales sobre el cliente..."
                value={formData.notes}
                onChange={handleChange}
                autoComplete="off"
                autoCorrect="off"
                spellCheck="false"
                data-form-type="other"
                rows={3}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancelar
              </Button>
              <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">
                Guardar Cliente
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientForm;
