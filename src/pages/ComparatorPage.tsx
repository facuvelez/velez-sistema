import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppHeader } from '@/components/AppHeader';
import { TireComparator } from '@/components/comparator/TireComparator';

const ComparatorPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        description="Asesoramiento técnico para montaje de medidas distintas a la original"
      />
      <div className="container mx-auto px-4 py-2 sm:py-3 space-y-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Volver
        </Button>
        <TireComparator />
      </div>
    </div>
  );
};

export default ComparatorPage;
