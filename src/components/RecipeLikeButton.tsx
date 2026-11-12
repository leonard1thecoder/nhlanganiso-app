'use client';

import { LikeButton } from '@/components/LikeButton';
import { RECIPE_LIKES_KEY } from '@/lib/recipes';

export function RecipeLikeButton({
  id,
  title,
  showLabel = false,
}: {
  id: string;
  title: string;
  showLabel?: boolean;
}) {
  return (
    <LikeButton
      storageKey={RECIPE_LIKES_KEY}
      id={id}
      name={title}
      showLabel={showLabel}
      className={showLabel ? 'recipe-card__like recipe-card__like--labelled' : 'recipe-card__like'}
    />
  );
}
