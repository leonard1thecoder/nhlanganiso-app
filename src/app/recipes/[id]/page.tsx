import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { RecipeLikeButton } from '@/components/RecipeLikeButton';
import { RECIPES, getRecipe } from '@/lib/recipes';

type RecipePageProps = {
  params: Promise<{ id: string }>;
};

export function generateStaticParams() {
  return RECIPES.map((recipe) => ({ id: recipe.id }));
}

export async function generateMetadata({ params }: RecipePageProps): Promise<Metadata> {
  const { id } = await params;
  const recipe = getRecipe(id);
  if (!recipe) return { title: 'Recipe not found' };
  return {
    title: recipe.title,
    description: `${recipe.meta}. Ingredients and method for ${recipe.title.toLowerCase()}, from Nhlanganiso Catering & Baking.`,
  };
}

export default async function RecipePage({ params }: RecipePageProps) {
  const { id } = await params;
  const recipe = getRecipe(id);
  if (!recipe) notFound();

  return (
    <section className="container section recipe-detail">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span className="crumb-sep" aria-hidden="true">/</span>
        <Link href="/recipes">Recipes</Link>
        <span className="crumb-sep" aria-hidden="true">/</span>
        <span className="current" aria-current="page">{recipe.title}</span>
      </nav>

      <div className="recipe-detail__grid">
        <div className="recipe-detail__media">
          <Image
            src={recipe.image}
            alt={recipe.alt}
            width={recipe.imageWidth}
            height={recipe.imageHeight}
            sizes="(max-width: 720px) 100vw, 480px"
            priority
          />
        </div>

        <div className="recipe-detail__body">
          <p className="eyebrow"><span className="rule" aria-hidden="true" />From our kitchen</p>
          <h1>{recipe.title}</h1>
          <p className="recipe-card__meta">{recipe.meta}</p>
          <div className="recipe-detail__actions">
            <RecipeLikeButton id={recipe.id} title={recipe.title} showLabel />
            <Link href="/recipes" className="link-arrow">← Back to all recipes</Link>
          </div>
        </div>
      </div>

      <div className="card recipe-detail__panel">
        <h2>Ingredients</h2>
        <ul>
          {recipe.ingredients.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>

        <h2>Method</h2>
        <ol>
          {recipe.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </div>
    </section>
  );
}
