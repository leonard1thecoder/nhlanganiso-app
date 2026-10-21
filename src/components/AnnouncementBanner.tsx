'use client';

import { useEffect, useState } from 'react';
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
        // Silently fallback if announcements aren't available
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (dismissed || !announcements || announcements.length === 0) {
    return null;
  }

  const active = announcements[0];

  return (
    <aside className="announcement-banner" aria-label="Bakery announcement">
      <div className="container announcement-banner__inner">
        <span className="announcement-banner__tag">Notice</span>
        <div className="announcement-banner__content">
          <strong>{active.title}</strong>
          <span className="announcement-banner__sep">—</span>
          <span
            className="announcement-banner__body"
            dangerouslySetInnerHTML={{ __html: active.body_html }}
          />
        </div>
        <button
          type="button"
          className="announcement-banner__close"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss announcement"
        >
          ✕
        </button>
      </div>
    </aside>
  );
}
