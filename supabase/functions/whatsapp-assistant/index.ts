import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { callClaude } from '../_shared/llm.ts';
import * as XLSX from 'https://esm.sh/xlsx@0.18.5';
import {
  MODEL,
  SYSTEM_PROMPT,
  tools,
  handleTool,
  buildPreview,
  type Attachment,
} from '../_shared/quoteAssistantCore.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type, x-webhook-secret',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const N8N_WEBHOOK_SECRET = Deno.env.get('N8N_WEBHOOK_SECRET')!;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const reply = (text: string) => json({ reply: text });

type RawAttachment =
  | { filename: string; sheet_names: string[]; grid: unknown[][] }
  | { filename: string; base64: string };

function base64ToBytes(b64: string): Uint8Array {
  const clean = b64.includes(',') ? b64.slice(b64.indexOf(',') + 1) : b64;
  const bin = atob(clean);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function normalizeAttachments(raw: RawAttachment[]): Attachment[] {
  const out: Attachment[] = [];
  for (const att of raw || []) {
    if ('grid' in att && Array.isArray(att.grid)) {
      out.push({
        filename: att.filename,
        sheets: [{ name: (att.sheet_names && att.sheet_names[0]) || 'Hoja1', grid: att.grid }],
      });
      continue;
    }
    if ('base64' in att && att.base64) {
      try {
        const wb = XLSX.read(base64ToBytes(att.base64), { type: 'array' });
        const sheets = wb.SheetNames.map((name) => ({
          name,
          grid: XLSX.utils.sheet_to_json(wb.Sheets[name], {
            header: 1,
            defval: '',
          }) as unknown[][],
        }));
        out.push({ filename: att.filename, sheets });
      } catch (_e) {
        // Adjunto ilegible: se ignora, el modelo lo va a notar por la ausencia de vista previa.
      }
    }
  }
  return out;
}

// Normaliza al número local de 10 dígitos (saca prefijos 54 / 549 y el 9 de celular)
function normalizePhone(input: string): string {
  let local = (input || '').replace(/\D/g, '');
  if (local.startsWith('549')) local = local.slice(3);
  else if (local.startsWith('54')) local = local.slice(2);
  if (local.startsWith('9')) local = local.slice(1);
  return local;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const secret = req.headers.get('X-Webhook-Secret');
  if (!secret || !N8N_WEBHOOK_SECRET || secret !== N8N_WEBHOOK_SECRET) {
    return json({ error: 'No autorizado' }, 401);
  }

  try {
    const body = await req.json();
    const rawPhone: string = String(body?.phone_number ?? '').trim();
    const phoneNumber = normalizePhone(rawPhone);
    const text: string = String(body?.text ?? '').trim();

    if (!phoneNumber || !text) {
      return reply('No me llegó el número o el mensaje. Probá de nuevo.');
    }

    const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    const { data: authorized } = await sb
      .from('whatsapp_authorized_numbers')
      .select('id')
      .eq('phone_number', phoneNumber)
      .eq('is_active', true)
      .maybeSingle();

    if (!authorized) {
      return reply('Este número no está autorizado a usar este asistente.');
    }

    const attachments = normalizeAttachments(body?.attachments || []);

    const { data: history } = await sb
      .from('whatsapp_messages')
      .select('role, content, created_at')
      .eq('phone_number', phoneNumber)
      .order('created_at', { ascending: false })
      .limit(20);

    const previous = ((history || []) as any[])
      .slice()
      .reverse()
      .map((m) => ({ role: m.role as string, content: m.content as string }));

    const messages: any[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...previous,
    ];

    // Avisar al modelo si pasó mucho tiempo desde el último mensaje guardado
    const lastMessageAt = (history || [])[0]?.created_at;
    if (lastMessageAt) {
      const gapMs = Date.now() - new Date(lastMessageAt).getTime();
      const gapMinutes = gapMs / 60000;
      if (gapMinutes > 45) {
        let gapText: string;
        if (gapMinutes < 120) {
          gapText = `${Math.round(gapMinutes)} minutos`;
        } else if (gapMinutes < 2880) {
          const hours = Math.round(gapMinutes / 60);
          gapText = `${hours} ${hours === 1 ? 'hora' : 'horas'}`;
        } else {
          const days = Math.round(gapMinutes / 1440);
          gapText = `${days} ${days === 1 ? 'día' : 'días'}`;
        }
        messages.push({
          role: 'system',
          content:
            `Nota: pasaron ${gapText} desde el último mensaje de este chat. ` +
            'No asumas que el mensaje del usuario a continuación continúa el tema o pedido pendiente de la conversación anterior — puede ser una consulta nueva y totalmente distinta. ' +
            'Priorizá siempre responder exactamente lo que el usuario pregunta en su ÚLTIMO mensaje tal cual está escrito, no una tarea vieja del historial que haya quedado pendiente.',
        });
      }
    }

    messages.push({ role: 'user', content: text });

    if (attachments.length > 0) {
      messages.push({
        role: 'system',
        content: `El usuario adjuntó ${attachments.length} archivo(s) en este mensaje.\n\n${buildPreview(attachments)}`,
      });
    }

    let finalReply = 'No pude terminar la consulta. Probá reformularla más simple.';

    for (let step = 0; step < 8; step++) {
      const r = await callClaude({ model: MODEL, messages, tools });

      if (!r.ok) {
        finalReply =
          r.kind === 'saturated'
            ? 'Ahora mismo el asistente está saturado. Probá de nuevo en unos segundos.'
            : r.kind === 'no_credit'
              ? 'Se quedaron sin créditos de IA. Avisale al administrador para recargarlos.'
              : 'Tuve un problema para responder. Probá de nuevo en un ratito.';
        break;
      }

      const msg = r.message;
      console.log(`[step ${step}] tool_calls=${(msg.tool_calls || []).length} content_preview=${(msg.content || '').slice(0, 200)}`);

      const toolCalls = msg.tool_calls || [];
      if (toolCalls.length === 0) {
        finalReply = msg.content ?? '';
        break;
      }

      messages.push(msg);
      for (const tc of toolCalls) {
        let result: unknown;
        try {
          const args = JSON.parse(tc.function.arguments || '{}');
          result = await handleTool(sb, tc.function.name, args, attachments);
        } catch (e) {
          result = { status: 'error', message: (e as Error).message };
        }
        messages.push({ role: 'tool', tool_call_id: tc.id, content: JSON.stringify(result) });
      }
    }

    const rowsToSave = [
      { phone_number: phoneNumber, role: 'user', content: text },
      { phone_number: phoneNumber, role: 'assistant', content: finalReply },
    ];
    const { error: insertError } = await sb.from('whatsapp_messages').insert(rowsToSave);
    if (insertError) {
      console.error('Error guardando mensaje en whatsapp_messages:', insertError);
      const { error: retryError } = await sb.from('whatsapp_messages').insert(rowsToSave);
      if (retryError) {
        console.error('Error en reintento guardando mensaje en whatsapp_messages:', retryError);
      }
    }

    return reply(finalReply);
  } catch (e) {
    console.error('whatsapp-assistant error:', (e as Error).message);
    return reply('Tuve un problema procesando tu mensaje. Probá de nuevo en un rato.');
  }
});
