'use client';

import { LikeButton } from '@/components/LikeButton';

const RECIPE_LIKES_KEY = 'nhl.recipe-likes.v1';

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
