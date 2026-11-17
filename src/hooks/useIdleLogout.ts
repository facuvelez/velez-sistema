import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useGuestOperator } from '@/contexts/GuestOperatorContext';

const IDLE_TIMEOUT_MS = 60 * 60 * 1000; // 60 minutos
const ACTIVITY_EVENTS: (keyof WindowEventMap)[] = ['mousedown', 'keydown', 'touchstart', 'scroll', 'wheel'];
const LAST_ACTIVITY_KEY = 'velez_last_activity_at';
const WRITE_THROTTLE_MS = 5000; // no escribir en localStorage más de 1 vez cada 5s

/**
 * Cierra la sesión automáticamente (usuario logueado o modo Operador invitado)
 * después de IDLE_TIMEOUT_MS sin actividad del usuario, para que una sesión
 * olvidada en una computadora compartida no quede accesible para el próximo
 * que abra la URL.
 *
 * La marca de tiempo de la última actividad se guarda en localStorage (no solo
 * en memoria) para que el conteo de inactividad sobreviva a cerrar la
 * pestaña/el navegador: como Supabase mantiene la sesión persistida
 * (persistSession: true), si solo usáramos un timer en memoria, cerrar y
 * volver a abrir el navegador reiniciaba el conteo a cero y la sesión vieja
 * quedaba abierta para siempre sin volver a pedir contraseña, sin importar
 * cuánto tiempo real hubiera pasado. También escucha el evento `storage` para
 * mantener sincronizado el timer si hay varias pestañas abiertas a la vez.
 */
export function useIdleLogout() {
  const { user, signOut } = useAuth();
  const { guestOperator, clearGuestOperator } = useGuestOperator();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastWriteRef = useRef(0);

  const hasActiveSession = !!user || !!guestOperator;

  useEffect(() => {
    if (!hasActiveSession) {
      if (timerRef.current) clearTimeout(timerRef.current);
      localStorage.removeItem(LAST_ACTIVITY_KEY);
      return;
    }

    const handleTimeout = () => {
      localStorage.removeItem(LAST_ACTIVITY_KEY);
      if (guestOperator) clearGuestOperator();
      if (user) signOut();
    };

    const resetTimer = (delayMs: number) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(handleTimeout, delayMs);
    };

    const markActivity = (force = false) => {
      const now = Date.now();
      if (force || now - lastWriteRef.current > WRITE_THROTTLE_MS) {
        lastWriteRef.current = now;
        localStorage.setItem(LAST_ACTIVITY_KEY, String(now));
      }
      resetTimer(IDLE_TIMEOUT_MS);
    };

    const onActivity = () => markActivity();

    const onStorage = (e: StorageEvent) => {
      // Otra pestaña marcó actividad (o cerró sesión): re-sincronizamos.
      if (e.key !== LAST_ACTIVITY_KEY) return;
      if (e.newValue == null) {
        handleTimeout();
        return;
      }
      const storedAt = Number(e.newValue);
      const remaining = IDLE_TIMEOUT_MS - (Date.now() - storedAt);
      if (remaining <= 0) {
        handleTimeout();
      } else {
        resetTimer(remaining);
      }
    };

    // Al montar (login recién hecho, o pestaña/navegador reabierto con una
    // sesión persistida de Supabase), revisamos cuánto pasó desde la última
    // actividad conocida guardada en localStorage. Si ya se pasó el límite,
    // cerramos sesión ya mismo en vez de esperar otros 60 minutos completos.
    const storedAt = Number(localStorage.getItem(LAST_ACTIVITY_KEY));
    const elapsed = storedAt > 0 ? Date.now() - storedAt : 0;

    if (storedAt > 0 && elapsed >= IDLE_TIMEOUT_MS) {
      handleTimeout();
      return;
    }

    markActivity(true);
    if (storedAt > 0) resetTimer(IDLE_TIMEOUT_MS - elapsed);

    ACTIVITY_EVENTS.forEach((evt) => window.addEventListener(evt, onActivity, { passive: true }));
    window.addEventListener('storage', onStorage);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      ACTIVITY_EVENTS.forEach((evt) => window.removeEventListener(evt, onActivity));
      window.removeEventListener('storage', onStorage);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasActiveSession]);
}
