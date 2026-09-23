import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@/lib/config';
import type { EventSession } from '@/lib/event-session';

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const GATE_TOKEN = /^[A-Za-z0-9]{4,12}$/;

type GateRow = {
  id?: string;
  event_id?: string;
  name?: string;
  slug?: string;
};

function headers() {
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
}

export function parsePortariaToken(raw: string): { slug?: string; id?: string; gate?: string } {
  const token = raw.trim();
  if (!token) return {};

  const withProtocol = token.match(/^(?:https?:\/\/)?(?:www\.)?gate8\.club(\/.*)?$/i);
  if (withProtocol) {
    try {
      const url = new URL(token.includes('://') ? token : `https://${token}`);
      const fromPath = url.pathname.match(/\/p\/([^/?#]+)/i);
      if (fromPath?.[1]) return { slug: decodeURIComponent(fromPath[1]) };
      const eventId = url.searchParams.get('event');
      if (eventId) return UUID.test(eventId) ? { id: eventId } : { slug: eventId };
    } catch {
      // fall through
    }
  }

  const nested = token.match(/\/p\/([A-Za-z0-9_-]+)/i);
  if (nested?.[1]) return { slug: nested[1] };

  if (UUID.test(token)) return { id: token };
  if (GATE_TOKEN.test(token) && !token.includes('-')) return { gate: token };

  return { slug: token.replace(/^\/+|\/+$/g, '') };
}

async function fetchEvent(query: string) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/events?select=id,name,slug&${query}`, {
    headers: headers(),
  });

  const body = (await response.json().catch(() => null)) as EventSession[] | { message?: string } | null;
  if (!response.ok) {
    const message = body && !Array.isArray(body) ? body.message : null;
    throw new Error(message || 'Não foi possível abrir a portaria.');
  }

  const event = Array.isArray(body) ? body[0] : null;
  if (!event?.id) return null;
  return event;
}

function asEvent(row: GateRow | null): EventSession | null {
  if (!row) return null;
  const id = row.event_id || row.id;
  if (!id) return null;
  if (row.name && row.slug) return { id, name: row.name, slug: row.slug };
  return { id, name: row.name || '', slug: row.slug || '' };
}

async function eventFromId(id: string) {
  const event = await fetchEvent(`id=eq.${encodeURIComponent(id)}`);
  if (!event) throw new Error('Token inválido. Esse token não está ligado a um evento.');
  return event;
}

async function resolveGateToken(token: string): Promise<EventSession | null> {
  const payloads = [{ token }, { p_token: token }];

  for (const payload of payloads) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/resolve_event_gate_token`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(payload),
    });
    if (response.status === 404) continue;
    const body = (await response.json().catch(() => null)) as GateRow | GateRow[] | { message?: string } | null;
    if (!response.ok) continue;
    const row = Array.isArray(body) ? body[0] : (body as GateRow | null);
    const mapped = asEvent(row ?? null);
    if (mapped?.name && mapped.slug) return mapped;
    if (mapped?.id) return eventFromId(mapped.id);
  }

  const table = await fetch(
    `${SUPABASE_URL}/rest/v1/event_gate_tokens?token=eq.${encodeURIComponent(token)}&select=event_id,token,created_at,updated_at`,
    { headers: headers() }
  );
  const rows = (await table.json().catch(() => [])) as GateRow[];
  const row = Array.isArray(rows) ? rows[0] : null;
  if (row?.event_id) return eventFromId(row.event_id);
  return null;
}

export async function resolveEventFromToken(token: string): Promise<EventSession> {
  const parsed = parsePortariaToken(token);

  if (parsed.gate) {
    const fromGate = await resolveGateToken(parsed.gate);
    if (fromGate) return fromGate;
    throw new Error('Token inválido');
  }

  if (parsed.id) {
    const event = await fetchEvent(`id=eq.${encodeURIComponent(parsed.id)}`);
    if (event) return event;
  }

  if (parsed.slug) {
    const event = await fetchEvent(`slug=eq.${encodeURIComponent(parsed.slug)}`);
    if (event) return event;
  }

  throw new Error('Token inválido');
}
