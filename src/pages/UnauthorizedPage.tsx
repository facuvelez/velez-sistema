import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function UnauthorizedPage() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate('/');
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <Shield className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-2xl font-bold">Acceso Denegado</CardTitle>
          <CardDescription>
            No tienes permisos para acceder a esta sección
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center text-sm text-muted-foreground">
            Tu rol actual: <span className="font-medium">{profile?.role}</span>
          </div>
          
          <div className="flex flex-col gap-2">
            <Button onClick={handleGoBack} variant="outline" className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al inicio
            </Button>
            
            <Button onClick={handleLogout} variant="ghost" className="w-full">
              Cerrar sesión
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}