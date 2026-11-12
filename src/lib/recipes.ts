// Recipe likes are saved in this browser under this key.
export const RECIPE_LIKES_KEY = 'nhl.recipe-likes.v1';

export type Recipe = {
  id: string;
  title: string;
  meta: string;
  image: string;
  imageWidth: number;
  imageHeight: number;
  alt: string;
  ingredients: string[];
  steps: string[];
};

// The id is used in the recipe URL, for example /recipes/chocolate-cupcakes.
// Demo recipes removed. Add published recipes here.
export const RECIPES: Recipe[] = [];

export function getRecipe(id: string): Recipe | undefined {
  return RECIPES.find((recipe) => recipe.id === id);
}
