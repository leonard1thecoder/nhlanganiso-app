'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';
import { Notice } from '@/components/Notice';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { describeError } from '@/lib/api';
import { STORAGE_KEYS } from '@/lib/config';
import { formatZAR } from '@/lib/format';
import { orderService } from '@/lib/services';
import type { OrderDetail, PaymentStatus } from '@/lib/types';

const POLL_MS = 3000;
const MAX_POLLS = 10;

interface LastOrder {
  id: string;
  reference: string;
  total_cents: number;
}

function readLastOrder(orderId: string | null): LastOrder | null {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEYS.lastOrder);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LastOrder;
    return !orderId || parsed.id === orderId ? parsed : null;
  } catch {
    return null;
  }
}

function SuccessView() {
  const params = useSearchParams();
  const orderId = params.get('order');
  const { clear } = useCart();
  const { status: authStatus } = useAuth();

  const [lastOrder, setLastOrder] = useState<LastOrder | null>(null);
  const [payment, setPayment] = useState<PaymentStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const polls = useRef(0);

  // Payment has returned: the cart's job is done.
  useEffect(() => {
    setLastOrder(readLastOrder(orderId));
    clear();
    // Only on first mount; `clear` is stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  // Signed-in customers can see the authoritative status (the API only marks an order
  // paid after a validated PayFast ITN, never from this redirect).
  useEffect(() => {
    if (!orderId || authStatus !== 'authenticated') return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;

    const check = async () => {
      try {
        const o: OrderDetail = await orderService.paymentStatus(orderId);
        if (cancelled) return;
        setPayment(o.payment_status);
        if (o.payment_status === 'pending' && polls.current < MAX_POLLS) {
          polls.current += 1;
          timer = setTimeout(check, POLL_MS);
        }
      } catch (err) {
        if (!cancelled) setError(describeError(err));
      }
    };
    void check();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [orderId, authStatus]);

  const headline =
    payment === 'paid'
      ? 'Payment received — thank you!'
      : payment === 'failed'
        ? 'Your payment did not go through'
        : 'Thank you — we are confirming your payment';

  return (
    <section className="container section center">
      <p className="eyebrow">Order placed</p>
      <h1>{headline}</h1>

      {lastOrder ? (
        <p className="lead">
          Reference <strong>{lastOrder.reference}</strong> · Total {formatZAR(lastOrder.total_cents)}
        </p>
      ) : null}

      {payment === 'pending' ? (
        <p className="muted">PayFast is confirming your payment. This page refreshes automatically.</p>
      ) : null}

      {payment === null && authStatus !== 'authenticated' ? (
        <p className="muted">
          You will receive a receipt by email as soon as PayFast confirms your payment.
        </p>
      ) : null}

      {payment === 'failed' ? (
        <Notice tone="error">
          The payment was not completed. Your order is saved; you can <Link href="/cart">review your cart</Link> and try again.
        </Notice>
      ) : null}

      {error ? <Notice tone="warning">{error}</Notice> : null}

      <div className="cta-row">
        {authStatus === 'authenticated' ? <Link href="/orders" className="btn btn-primary">View my orders</Link> : null}
        <Link href="/products" className="btn btn-outline">Continue shopping</Link>
      </div>
    </section>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div className="page-loading" role="status">Loading…</div>}>
      <SuccessView />
    </Suspense>
  );
}
