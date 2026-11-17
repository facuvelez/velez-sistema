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

export const getRoleDisplay = (role: string) => {
  switch (role) {
    case 'Administrator': return 'Admin';
    case 'Administracion': return 'Administración';
    case 'Operator': return 'Operador';
    case 'Alineador': return 'Alineador';
    default: return role;
  }
};

export const AppHeader: React.FC<AppHeaderProps> = ({ title = 'Vélez Neumáticos', description }) => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const initials = profile?.username ? profile.username.slice(0, 2).toUpperCase() : 'U';
  const subtitle = description?.trim();

  return (
    <header className="sticky top-0 z-40 bg-chrome text-chrome-foreground shadow-[0_1px_0_rgba(0,0,0,0.4)]">
      <div className="container mx-auto flex h-16 items-center justify-between gap-3 px-3 sm:px-4">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="flex min-w-0 items-center gap-3 rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          aria-label="Ir al inicio"
        >
          <img src="/favicon.png" alt="" className="h-9 w-9 shrink-0" />
          <div className="min-w-0">
            <p className="font-display text-lg font-semibold leading-tight tracking-tight sm:text-xl">{title}</p>
            {subtitle && (
              <p className="hidden truncate text-xs text-chrome-foreground/60 sm:block">{subtitle}</p>
            )}
          </div>
        </button>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <ModeToggle className="border-white/15 bg-transparent text-chrome-foreground hover:bg-white/10 hover:text-chrome-foreground" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-10 gap-2 rounded-full px-1 text-chrome-foreground hover:bg-white/10 hover:text-chrome-foreground sm:pr-3"
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-brand text-xs font-semibold text-brand-foreground">{initials}</AvatarFallback>
                </Avatar>
                <span className="hidden text-left leading-tight sm:block">
                  <span className="block text-sm font-medium">{profile?.username}</span>
                  <span className="block text-[11px] text-chrome-foreground/60">
                    {profile?.role ? getRoleDisplay(profile.role) : ''}
                  </span>
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{profile?.username}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {profile?.role ? getRoleDisplay(profile.role) : ''}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Cerrar sesión</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="tread-strip" aria-hidden="true" />
    </header>
  );
};
