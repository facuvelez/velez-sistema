import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { HelpCircle, X, Send, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const WELCOME: ChatMessage = {
  role: 'assistant',
  content:
    '¡Hola! Soy el asistente de ayuda del sistema. Puedo explicarte cómo usar cada sección paso a paso.\n\nPor ejemplo: "¿cómo cargo un proveedor nuevo?" o "¿cómo registro un pago de una deuda?".',
};

export const HelpAssistantWidget: React.FC = () => {
  const { session } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading, open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  if (!session) return null;

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const history = messages.filter((m) => m !== WELCOME);
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setInput('');
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('help-assistant', {
        body: { message: text, messages: history },
      });
      const reply =
        (data as any)?.reply ??
        (data as any)?.error ??
        (error ? 'No pude conectarme al asistente. Probá de nuevo en un rato.' : 'No recibí respuesta.');
      setMessages((prev) => [...prev, { role: 'assistant', content: String(reply) }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Tuve un problema para responder. Probá de nuevo en un ratito.' },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  return createPortal(
    <>
      {!open && (
        <Button
          onClick={() => setOpen(true)}
          size="icon"
          aria-label="Abrir asistente de ayuda"
          className="fixed bottom-4 right-4 z-50 h-14 w-14 rounded-full shadow-lg"
        >
          <HelpCircle className="h-7 w-7" />
        </Button>
      )}

      {open && (
        <div className="fixed bottom-4 right-4 z-50 flex h-[70vh] max-h-[560px] w-[min(92vw,380px)] flex-col overflow-hidden rounded-xl border bg-card shadow-2xl">
          <div className="flex items-center justify-between gap-2 border-b bg-primary/10 px-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold">Ayuda del sistema</p>
              <p className="text-xs text-muted-foreground">Te explico cómo usar la app</p>
            </div>
            <Button variant="ghost" size="icon" aria-label="Cerrar asistente" onClick={() => setOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
            {messages.map((m, i) => (
              <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                <div
                  className={
                    'max-w-[85%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm ' +
                    (m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground')
                  }
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Escribiendo...
                </div>
              </div>
            )}
          </div>

          <div className="flex items-end gap-2 border-t p-2">
            <Textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
              placeholder="Escribí tu consulta..."
              rows={1}
              className="max-h-28 min-h-[40px] resize-none text-sm"
            />
            <Button size="icon" onClick={() => void send()} disabled={loading || !input.trim()} aria-label="Enviar">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </>,
    document.body,
  );
};

export default HelpAssistantWidget;
