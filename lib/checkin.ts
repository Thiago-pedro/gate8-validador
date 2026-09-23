import { getAccessToken } from '@/lib/auth';
import { siteUrl } from '@/constants/theme';

export type CheckinResult = 'ok' | 'already_used' | 'wrong_event' | 'invalid';

export type CheckinTicket = {
  id?: string;
  holder_name?: string;
  event_name?: string;
  batch_name?: string;
  status?: string;
};

export type CheckinResponse = {
  result: CheckinResult;
  ticket?: CheckinTicket;
};

function mapResult(status: number, result?: string): CheckinResult {
  if (result === 'ok' || result === 'already_used' || result === 'wrong_event' || result === 'invalid') {
    return result;
  }
  if (status === 200) return 'ok';
  if (status === 409) return 'already_used';
  if (status === 404) return 'invalid';
  return 'invalid';
}

export async function checkinCode(code: string): Promise<CheckinResponse> {
  const token = await getAccessToken();
  if (!token) throw new Error('Entre na conta da equipe para validar.');

  const response = await fetch(`${siteUrl}/api/public/app/checkin`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code: code.trim() }),
  });

  const body = (await response.json().catch(() => ({}))) as CheckinResponse & {
    message?: string;
    error?: string;
  };

  if (!response.ok && !body.result) {
    throw new Error(body.message || body.error || 'Não foi possível validar o ingresso.');
  }

  return {
    result: mapResult(response.status, body.result),
    ticket: body.ticket,
  };
}
