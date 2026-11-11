'use client';

import { useEffect, useState } from 'react';

const RECIPE_LIKES_KEY = 'nhl.recipe-likes.v1';

// Likes are saved on this device only, until a shared count is available from the API.
function readLikes(): string[] {
  try {
    const stored = window.localStorage.getItem(RECIPE_LIKES_KEY);
    const parsed: unknown = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    // Storage can be unavailable (for example in private browsing).
    return [];
  }
}

function writeLikes(ids: string[]) {
  try {
    window.localStorage.setItem(RECIPE_LIKES_KEY, JSON.stringify(ids));
  } catch {
    // Ignore write failures; the like still shows for this visit.
  }
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

export function RecipeLikeButton({
  id,
  title,
  showLabel = false,
}: {
  id: string;
  title: string;
  showLabel?: boolean;
}) {
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    setLiked(readLikes().includes(id));
  }, [id]);

  const toggle = () => {
    // Read the latest stored list so likes for other recipes are never overwritten.
    const current = readLikes();
    const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
    writeLikes(next);
    setLiked(next.includes(id));
  };

  return (
    <button
      type="button"
      className={`recipe-card__like${showLabel ? ' recipe-card__like--labelled' : ''}${liked ? ' is-liked' : ''}`}
      aria-pressed={liked}
      aria-label={showLabel ? undefined : `${liked ? 'Unlike' : 'Like'} ${title}`}
      title={liked ? 'Unlike' : 'Like'}
      onClick={toggle}
    >
      <HeartIcon filled={liked} />
      {showLabel && <span>Like</span>}
    </button>
  );
}
