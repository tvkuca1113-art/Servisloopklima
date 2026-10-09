'use client';

import { relativeDays, type CivilDate } from '@/lib/dates';
import { dueStatus, DUE_LABEL, type DueStatus } from '@/lib/derive';
import type { Device, RequestStatus, WorkOrderStatus } from '@/lib/types';

import { Badge, type Tone } from './ui';

const DUE_TONE: Record<DueStatus, Tone> = { zakasnio: 'danger', sedam: 'warn', uskoro: 'warn', uredu: 'ok' };

export function DueBadge({ device, today }: { device: Device; today: CivilDate }) {
  if (device.status === 'ugradnja') return <Badge tone="info">Ugradnja planirana</Badge>;
  const s = dueStatus(device, today);
  return <Badge tone={DUE_TONE[s]}>{s === 'zakasnio' ? `Kasni ${relativeDays(device.nextServiceOn, today).replace('prije ', '')}` : DUE_LABEL[s]}</Badge>;
}

export const REQUEST_LABEL: Record<RequestStatus, string> = {
  na_cekanju: 'Na čekanju',
  potvrdjen: 'Potvrđen u demou',
  odbijen: 'Odbijen u demou',
};

export function RequestBadge({ status }: { status: RequestStatus }) {
  const tone: Tone = status === 'na_cekanju' ? 'warn' : status === 'potvrdjen' ? 'ok' : 'neutral';
  return <Badge tone={tone}>{REQUEST_LABEL[status]}</Badge>;
}

export const ORDER_LABEL: Record<WorkOrderStatus, string> = {
  planiran: 'Planiran',
  u_radu: 'U radu',
  zavrsen: 'Završen',
  otkazan: 'Otkazan',
};

export function OrderBadge({ status }: { status: WorkOrderStatus }) {
  const tone: Tone = status === 'planiran' ? 'info' : status === 'u_radu' ? 'warn' : status === 'zavrsen' ? 'ok' : 'neutral';
  return <Badge tone={tone}>{ORDER_LABEL[status]}</Badge>;
}

export function KindLabel({ kind }: { kind: Device['kind'] }) {
  return <span>{kind === 'pumpa' ? 'Toplotna pumpa' : 'Klima'}</span>;
}
