'use client';

import { LikeButton } from '@/components/LikeButton';

const PRODUCT_LIKES_KEY = 'nhl.product-likes.v1';

// The heart on a product tile (icon only) or on the product page (with a label).
export function ProductLikeButton({
  id,
  name,
  showLabel = false,
}: {
  id: string;
  name: string;
  showLabel?: boolean;
}) {
  return (
    <LikeButton
      storageKey={PRODUCT_LIKES_KEY}
      id={id}
      name={name}
      showLabel={showLabel}
      className={showLabel ? 'product-like product-like--labelled' : 'product-like'}
    />
  );
}
