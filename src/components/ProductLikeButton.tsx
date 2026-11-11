'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useFavorites } from '@/context/FavoritesContext';

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

/**
 * A product's like heart. Likes are saved to the shopper's account (the Favourites list), so
 * signed-out shoppers are sent to log in first. `count` is the total across all shoppers;
 * when the API does not provide it yet, the heart shows without a number.
 */
export function ProductLikeButton({
  id,
  name,
  count,
  showLabel = false,
}: {
  id: string;
  name: string;
  count?: number | null;
  showLabel?: boolean;
}) {
  const { status } = useAuth();
  const { isFavorite, favoriteDelta, toggleFavorite } = useFavorites();
  const router = useRouter();
  const pathname = usePathname();

  const liked = isFavorite(id);
  const total = typeof count === 'number' ? Math.max(0, count + favoriteDelta(id)) : null;
  const countText = total === null ? '' : `${total} ${total === 1 ? 'like' : 'likes'}`;

  const onClick = () => {
    if (status === 'loading') return;
    if (status !== 'authenticated') {
      router.push(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    void toggleFavorite(id);
  };

  const classes = [
    'product-like',
    showLabel ? 'product-like--labelled' : '',
    total !== null ? 'product-like--counted' : '',
    liked ? 'is-liked' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type="button"
      className={classes}
      aria-pressed={liked}
      aria-label={showLabel ? undefined : `Like ${name}${countText ? `, ${countText}` : ''}`}
      title={status !== 'authenticated' ? 'Log in to like' : liked ? 'Remove like' : 'Like'}
      onClick={onClick}
    >
      <HeartIcon filled={liked} />
      {total !== null ? <span className="product-like__count">{total}</span> : null}
      {showLabel ? <span>Like</span> : null}
    </button>
  );
}
