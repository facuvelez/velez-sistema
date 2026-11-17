import { useIdleLogout } from '@/hooks/useIdleLogout';

/** Componente sin render que solo activa el hook de cierre de sesión por inactividad. */
export const IdleLogoutWatcher: React.FC = () => {
  useIdleLogout();
  return null;
};
