import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppHeader } from '@/components/AppHeader';
import { SuppliersList } from '@/components/suppliers/SuppliersList';

const SuppliersPage: React.FC = () => {
  const navigate = useNavigate();
  const [atTopLevel, setAtTopLevel] = useState(true);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader description="Proveedores: marcas, descuentos y listas de precios" />

      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6">
        {atTopLevel && (
          <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-1" /> Volver
          </Button>
        )}

        <h1 className="text-2xl font-bold mb-4">Proveedores</h1>

        <SuppliersList onLevelChange={setAtTopLevel} />
      </div>
    </div>
  );
};

export default SuppliersPage;
