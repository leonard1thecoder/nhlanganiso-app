'use client';

import { useEffect, useState } from 'react';

type LikesChange = { storageKey: string; ids: string[] };

// Fired after every change so each heart for the same item on the page stays in step.
const LIKES_CHANGED_EVENT = 'nhl:likes-changed';

// Likes are saved on this device only, until a shared count is available from the API.
function readLikes(storageKey: string): string[] {
  try {
    const stored = window.localStorage.getItem(storageKey);
    const parsed: unknown = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    // Storage can be unavailable (for example in private browsing).
    return [];
  }
}

function writeLikes(storageKey: string, ids: string[]) {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(ids));
  } catch {
    // Ignore write failures; the like still shows for this visit.
  }
}

/** The ids saved under a storage key, kept up to date as they change on this page or in other tabs. */
export function useStoredLikes(storageKey: string): string[] {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    setIds(readLikes(storageKey));

    const onChanged = (event: Event) => {
      const { detail } = event as CustomEvent<LikesChange>;
      if (detail.storageKey === storageKey) setIds(detail.ids);
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key === storageKey) setIds(readLikes(storageKey));
    };

    window.addEventListener(LIKES_CHANGED_EVENT, onChanged);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(LIKES_CHANGED_EVENT, onChanged);
      window.removeEventListener('storage', onStorage);
    };
  }, [storageKey]);

  return ids;
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function LikeButton({
  storageKey,
  id,
  name,
  className,
  showLabel = false,
}: {
  storageKey: string;
  id: string;
  name: string;
  className: string;
  showLabel?: boolean;
}) {
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    setLiked(readLikes(storageKey).includes(id));

    const onChanged = (event: Event) => {
      const { detail } = event as CustomEvent<LikesChange>;
      if (detail.storageKey === storageKey) setLiked(detail.ids.includes(id));
    };
    // Keeps other open tabs in step with this one.
    const onStorage = (event: StorageEvent) => {
      if (event.key === storageKey) setLiked(readLikes(storageKey).includes(id));
    };

    window.addEventListener(LIKES_CHANGED_EVENT, onChanged);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(LIKES_CHANGED_EVENT, onChanged);
      window.removeEventListener('storage', onStorage);
    };
  }, [storageKey, id]);

  const toggle = () => {
    // Read the latest stored list so likes for other items are never overwritten.
    const current = readLikes(storageKey);
    const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
    writeLikes(storageKey, next);
    window.dispatchEvent(new CustomEvent<LikesChange>(LIKES_CHANGED_EVENT, { detail: { storageKey, ids: next } }));
  };

  return (
    <button
      type="button"
      className={`${className}${liked ? ' is-liked' : ''}`}
      aria-pressed={liked}
      aria-label={showLabel ? undefined : `Like ${name}`}
      title={liked ? 'Unlike' : 'Like'}
      onClick={toggle}
    >
      <HeartIcon filled={liked} />
      {showLabel && <span>Like</span>}
    </button>
  );
}
