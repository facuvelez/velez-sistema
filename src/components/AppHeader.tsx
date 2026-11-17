import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { LogOut } from 'lucide-react';
import { ModeToggle } from '@/components/ui/mode-toggle';
import { useNavigate } from 'react-router-dom';

interface AppHeaderProps {
  title?: string;
  description?: string;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ title = "Velez Neumáticos", description }) => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const getInitials = (username: string) => {
    return username.slice(0, 2).toUpperCase();
  };

  const getRoleDisplay = (role: string) => {
    switch (role) {
      case 'Administrator': return 'Admin';
      case 'Administracion': return 'Administración';
      case 'Operator': return 'Operador';
      case 'Alineador': return 'Alineador';
      default: return role;
    }
  };

  return (
    <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
      <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-4 flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-lg sm:text-2xl font-bold truncate">{title}</h1>
          {description && (
            <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block" style={{ whiteSpace: 'pre-line' }}>{description}</p>
          )}
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
          <ModeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>
                    {profile?.username ? getInitials(profile.username) : 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {profile?.username}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {profile?.role ? getRoleDisplay(profile.role) : ''}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Cerrar Sesión</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};