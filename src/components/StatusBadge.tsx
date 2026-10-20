import { cn } from '@/lib/format';
import type { CateringStatus, FulfilmentStatus, PaymentStatus } from '@/lib/types';

const PAYMENT_LABEL: Record<PaymentStatus, string> = {
  pending: 'Awaiting payment',
  paid: 'Paid',
  failed: 'Failed',
  cancelled: 'Cancelled',
};

const FULFILMENT_LABEL: Record<FulfilmentStatus, string> = {
  new: 'Received',
  preparing: 'Being prepared',
  ready: 'Ready for collection',
  delivered: 'Completed',
  cancelled: 'Cancelled',
};

const CATERING_LABEL: Record<CateringStatus, string> = {
  new: 'New enquiry',
  reviewing: 'Reviewing',
  quoted: 'Quote sent',
  replied: 'Replied',
  closed: 'Closed',
  accepted: 'Accepted',
  declined: 'Declined',
};

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  return <span className={cn('badge', `badge--${status}`)}>{PAYMENT_LABEL[status] ?? status}</span>;
}

export function FulfilmentBadge({ status }: { status: FulfilmentStatus }) {
  return <span className={cn('badge', `badge--f-${status}`)}>{FULFILMENT_LABEL[status] ?? status}</span>;
}

export function CateringBadge({ status }: { status: CateringStatus }) {
  return <span className={cn('badge', `badge--c-${status}`)}>{CATERING_LABEL[status] ?? status}</span>;
}

export const FULFILMENT_OPTIONS = Object.entries(FULFILMENT_LABEL) as Array<[FulfilmentStatus, string]>;
export const CATERING_OPTIONS = Object.entries(CATERING_LABEL) as Array<[CateringStatus, string]>;
