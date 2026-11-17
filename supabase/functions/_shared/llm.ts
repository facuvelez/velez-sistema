// Adaptador: recibe mensajes y herramientas en formato "OpenAI" (el que usaba el
// código anterior) y habla con la API de Anthropic (Claude). Devuelve un mensaje
// con la misma forma ({ content, tool_calls }) para no tocar el resto de la lógica.

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') ?? '';

export type LlmResult =
  | { ok: true; message: { role: 'assistant'; content: string; tool_calls: any[] } }
  | { ok: false; status: number; kind: 'saturated' | 'no_credit' | 'other'; detail: string };

function toAnthropic(messages: any[]) {
  const system: string[] = [];
  const out: any[] = [];

  const push = (role: 'user' | 'assistant', blocks: any[]) => {
    if (blocks.length === 0) return;
    const last = out[out.length - 1];
    if (last && last.role === role) last.content.push(...blocks);
    else out.push({ role, content: [...blocks] });
  };

  for (const m of messages) {
    if (m.role === 'system') {
      // El primer "system" es el prompt; los siguientes son avisos de contexto
      // que se envían como texto del usuario (Claude no admite system en el medio).
      if (out.length === 0 && system.length === 0) system.push(String(m.content ?? ''));
      else push('user', [{ type: 'text', text: `[Aviso del sistema] ${String(m.content ?? '')}` }]);
    } else if (m.role === 'user') {
      const t = String(m.content ?? '').trim();
      if (t) push('user', [{ type: 'text', text: t }]);
    } else if (m.role === 'assistant') {
      const blocks: any[] = [];
      const t = String(m.content ?? '').trim();
      if (t) blocks.push({ type: 'text', text: t });
      for (const tc of m.tool_calls ?? []) {
        let input = {};
        try { input = JSON.parse(tc.function?.arguments || '{}'); } catch (_) { /* vacío */ }
        blocks.push({ type: 'tool_use', id: tc.id, name: tc.function.name, input });
      }
      push('assistant', blocks);
    } else if (m.role === 'tool') {
      push('user', [{ type: 'tool_result', tool_use_id: m.tool_call_id, content: String(m.content ?? '') }]);
    }
  }

  // La conversación debe empezar con un mensaje del usuario.
  while (out.length && out[0].role !== 'user') out.shift();
  // Los tool_result deben ir primero dentro de su mensaje de usuario.
  for (const m of out) {
    if (m.role === 'user') {
      m.content.sort((a: any, b: any) => Number(b.type === 'tool_result') - Number(a.type === 'tool_result'));
    }
  }
  return { system: system.join('\n\n'), messages: out };
}

export async function callClaude(opts: {
  model: string;
  messages: any[];
  tools?: any[];
  maxTokens?: number;
}): Promise<LlmResult> {
  const { system, messages } = toAnthropic(opts.messages);
  const body: any = {
    model: opts.model,
    max_tokens: opts.maxTokens ?? 4096,
    system,
    messages,
  };
  if (opts.tools?.length) {
    body.tools = opts.tools.map((t) => ({
      name: t.function.name,
      description: t.function.description,
      input_schema: t.function.parameters,
    }));
  }

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const detail = await res.text();
    const kind =
      res.status === 429 || res.status === 529 || res.status === 503
        ? 'saturated'
        : /credit balance|billing/i.test(detail)
          ? 'no_credit'
          : 'other';
    console.error('Anthropic error', res.status, detail.slice(0, 500));
    return { ok: false, status: res.status, kind, detail };
  }

  const data = await res.json();
  let text = '';
  const tool_calls: any[] = [];
  for (const b of data.content ?? []) {
    if (b.type === 'text') text += b.text;
    if (b.type === 'tool_use') {
      tool_calls.push({
        id: b.id,
        type: 'function',
        function: { name: b.name, arguments: JSON.stringify(b.input ?? {}) },
      });
    }
  }
  return { ok: true, message: { role: 'assistant', content: text, tool_calls } };
}
