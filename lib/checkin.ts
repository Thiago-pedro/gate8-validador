import { siteUrl } from '@/constants/theme';

export type CheckinKind = 'valid' | 'used' | 'wrong_event' | 'event_ended' | 'invalid' | 'error';

export type CheckinTicket = {
  code?: string;
  holder_name?: string;
  event_name?: string;
  batch_name?: string;
  status?: string;
};

export type CheckinResponse = {
  kind: CheckinKind;
  message: string;
  ticket?: CheckinTicket;
};

const CHECKIN_FN = '1f73d192a4910d4e192faf809c56f3762ff265305b87d552c92ab10b626b8189';

type SerovalNode = {
  t?: number | SerovalNode;
  s?: string | number | boolean;
  p?: { k: string[]; v: SerovalNode[] };
  f?: number;
  m?: unknown[];
};

function encodeServerFn(eventId: string, code: string) {
  return JSON.stringify({
    t: {
      t: 10,
      i: 0,
      p: {
        k: ['data'],
        v: [
          {
            t: 10,
            i: 1,
            p: {
              k: ['event_id', 'code'],
              v: [
                { t: 1, s: eventId },
                { t: 1, s: code },
              ],
            },
            o: 0,
          },
        ],
      },
      o: 0,
    },
    f: 63,
    m: [],
  });
}

function decodeNode(node: SerovalNode | unknown): unknown {
  if (node == null || typeof node !== 'object') return node;
  const value = node as SerovalNode;
  if (value.t && typeof value.t === 'object') {
    const inner = decodeNode(value.t);
    if (inner && typeof inner === 'object' && 'result' in inner) {
      return (inner as { result: unknown }).result;
    }
    return inner;
  }
  if (value.t === 1) return value.s;
  if (value.t === 2) return value.s === 1 || value.s === true;
  if (value.t === 10 && value.p) {
    const out: Record<string, unknown> = {};
    value.p.k.forEach((key, index) => {
      out[key] = decodeNode(value.p!.v[index]);
    });
    return out;
  }
  return node;
}

export function extractTicketCode(raw: string) {
  let code = raw.trim();
  const fromTicketUrl = code.match(/\/ingressos\/([A-Za-z0-9]+)/i);
  if (fromTicketUrl) return fromTicketUrl[1];
  if (/^https?:\/\//i.test(code)) {
    const last = code.split(/[/?#]/).filter(Boolean).pop() ?? '';
    if (/^[A-Za-z0-9]+$/.test(last)) return last;
  }
  return code;
}

function asKind(value: unknown): CheckinKind {
  if (
    value === 'valid' ||
    value === 'used' ||
    value === 'wrong_event' ||
    value === 'event_ended' ||
    value === 'invalid' ||
    value === 'error'
  ) {
    return value;
  }
  return 'invalid';
}

export async function checkinCode(eventId: string, rawCode: string): Promise<CheckinResponse> {
  const code = extractTicketCode(rawCode);
  if (!code) throw new Error('Informe o código do ingresso.');

  const response = await fetch(`${siteUrl}/_serverFn/${CHECKIN_FN}`, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'x-tsr-serverfn': 'true',
    },
    body: encodeServerFn(eventId, code),
  });

  const payload = (await response.json().catch(() => null)) as unknown;
  const decoded = (decodeNode(payload) ?? payload) as {
    kind?: unknown;
    message?: string;
    ticket?: CheckinTicket;
    result?: { kind?: unknown; message?: string; ticket?: CheckinTicket };
  } | null;

  const body = decoded?.kind ? decoded : decoded?.result;
  if (!body?.kind && !response.ok) {
    throw new Error('Não foi possível validar o ingresso.');
  }

  const kind = asKind(body?.kind);
  return {
    kind,
    message: body?.message || (kind === 'valid' ? 'Ingresso válido' : 'Ingresso inválido'),
    ticket: body?.ticket,
  };
}
