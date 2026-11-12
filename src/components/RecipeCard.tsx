import Image from 'next/image';
import Link from 'next/link';
import { RecipeLikeButton } from '@/components/RecipeLikeButton';
import type { Recipe } from '@/lib/recipes';

export function RecipeCard({ recipe }: { recipe: Recipe }) {
  return (
    <li className="card recipe-card">
      <div className="recipe-card__media">
        <Image
          src={recipe.image}
          alt={recipe.alt}
          width={recipe.imageWidth}
          height={recipe.imageHeight}
          sizes="(max-width: 960px) 100vw, 360px"
        />
      </div>
      <h2 className="recipe-card__title">{recipe.title}</h2>
      <p className="recipe-card__meta">{recipe.meta}</p>
      <div className="recipe-card__actions">
        <Link href={`/recipes/${recipe.id}`} className="btn btn-outline recipe-card__toggle">
          View ingredients and method
        </Link>
        <RecipeLikeButton id={recipe.id} title={recipe.title} />
      </div>
    </li>
  );
}
