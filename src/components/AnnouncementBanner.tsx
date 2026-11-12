'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { announcementService } from '@/lib/services';
import type { PublicAnnouncement } from '@/lib/types';

export function AnnouncementBanner() {
  const [announcements, setAnnouncements] = useState<PublicAnnouncement[] | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    announcementService
      .publicList('sent')
      .then((res) => {
        if (!cancelled && res && res.length > 0) {
          setAnnouncements(res);
        }
      })
      .catch(() => {
        // The partner invitation remains visible if the announcements API is unavailable.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (dismissed) return null;

  const active = announcements?.[0];

  return (
    <aside className="announcement-banner" aria-label="Bakery announcement">
      <div className="container announcement-banner__inner">
        <span className="announcement-banner__tag">
          {active ? 'Notice' : 'Sell with us'}
        </span>
        <div className="announcement-banner__content">
          {active ? (
            <>
              <strong>{active.title}</strong>
              <span className="announcement-banner__sep" aria-hidden="true">—</span>
              <span
                className="announcement-banner__body"
                dangerouslySetInnerHTML={{ __html: active.body_html }}
              />
            </>
          ) : (
            <>
              <strong>Have a bakery or food business?</strong>
              <span className="announcement-banner__body">
                Grow your reach — sell your baked goods in the Nhlanganiso online bakery.
              </span>
            </>
          )}
          <Link href="/contact" className="announcement-banner__cta">
            Become a bakery partner <span aria-hidden="true">→</span>
          </Link>
        </div>
        <button
          type="button"
          className="announcement-banner__close"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss announcement"
        >
          <span aria-hidden="true">×</span>
        </button>
      </div>
    </aside>
  );
}
