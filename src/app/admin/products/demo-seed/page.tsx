'use client';

import Link from 'next/link';
import { useCallback, useState } from 'react';
import { Notice } from '@/components/Notice';
import { RequireAuth } from '@/components/RequireAuth';
import { describeError } from '@/lib/api';
import { adminService, categoryService, productService } from '@/lib/services';
import type { Category, Product } from '@/lib/types';

type SeedCategory = {
  name: string;
  image: string;
  prefix: string;
  products: Array<[string, number]>;
};

const CATALOGUE: SeedCategory[] = [
  {
    name: 'Bread',
    prefix: 'bread',
    image: 'https://messychefbakery.com/assets/paris_sourdough.png',
    products: [
      ['Classic Sourdough Bread', 68], ['Seeded Sourdough Bread', 78], ['Country White Bread', 48],
      ['Farmhouse Brown Bread', 52], ['Wholewheat Bread', 55], ['Multigrain Bread', 62],
      ['Rye Bread', 72], ['Olive Herb Bread', 82], ['Garlic Rosemary Bread', 76],
      ['Cheese Jalapeno Bread', 88], ['Sunflower Seed Bread', 65], ['Pumpkin Seed Bread', 68],
      ['Milk Loaf Bread', 46], ['Brioche Bread', 74], ['Cinnamon Raisin Bread', 69],
      ['French Baguette Bread', 42], ['Ciabatta Bread', 58], ['Focaccia Bread', 64],
      ['Mini Dinner Roll Bread Pack', 55], ['Soft Burger Bun Bread Pack', 49],
      ['Hot Dog Roll Bread Pack', 49], ['Pretzel Bread Loaf', 62], ['Potato Bread', 58],
      ['Spelt Bread', 76], ['Gluten-Free Seed Bread', 85], ['Buttermilk Bread', 54],
      ['Corn Bread', 59], ['Caramelised Onion Bread', 79], ['Herb Pull-Apart Bread', 72],
      ['Rustic Artisan Bread', 82],
    ],
  },
  {
    name: 'Cakes',
    prefix: 'cakes',
    image: 'https://goldbelly.imgix.net/uploads/showcase_media_asset/image/134450/whole-chocolate-cake.4.jpg',
    products: [
      ['Chocolate Fudge Cake', 420], ['Vanilla Celebration Cake', 380], ['Red Velvet Cake', 440],
      ['Carrot Walnut Cake', 390], ['Lemon Drizzle Cake', 350], ['Black Forest Cake', 460],
      ['Classic Cheesecake', 430], ['Baked Basque Cake', 450], ['Coffee Mocha Cake', 410],
      ['Strawberry Cream Cake', 430], ['Rainbow Layer Cake', 480], ['Coconut Cake', 370],
      ['Marble Cake', 340], ['Banana Loaf Cake', 280], ['Orange Poppy Seed Cake', 350],
      ['Salted Caramel Cake', 450], ['Chocolate Mint Cake', 430], ['Oreo Cream Cake', 460],
      ['Vanilla Berry Cake', 420], ['Pineapple Upside-Down Cake', 360], ['Apple Crumble Cake', 370],
      ['Malva Pudding Cake', 390], ['Milk Tart Cake', 380], ['Peanut Butter Cake', 420],
      ['Lindt Chocolate Cake', 520], ['Ferrero Rocher Cake', 540], ['Funfetti Birthday Cake', 450],
      ['Elegant Wedding Cake', 1250], ['Mini Bento Cake', 180], ['Red Berry Pavlova Cake', 420],
    ],
  },
  {
    name: 'Cupcakes',
    prefix: 'cupcakes',
    image: 'https://www.frenchvillagebakery.com/wp-content/uploads/2023/05/cupcakes.jpg',
    products: [
      ['Vanilla Bean Cupcakes', 28], ['Chocolate Ganache Cupcakes', 32], ['Red Velvet Cupcakes', 34],
      ['Lemon Meringue Cupcakes', 32], ['Salted Caramel Cupcakes', 35], ['Cookies and Cream Cupcakes', 34],
      ['Strawberry Swirl Cupcakes', 32], ['Carrot Cake Cupcakes', 30], ['Coffee Buttercream Cupcakes', 32],
      ['Rainbow Sprinkle Cupcakes', 30], ['Peanut Butter Cupcakes', 34], ['Coconut Cream Cupcakes', 30],
      ['Black Forest Cupcakes', 36], ['Biscoff Cupcakes', 36], ['Oreo Crunch Cupcakes', 34],
      ['Mint Chocolate Cupcakes', 32], ['Blueberry Lemon Cupcakes', 34], ['Raspberry White Chocolate Cupcakes', 36],
      ['Mocha Espresso Cupcakes', 34], ['Banana Toffee Cupcakes', 32], ['Funfetti Party Cupcakes', 30],
      ['Vanilla Mini Cupcakes', 18], ['Chocolate Mini Cupcakes', 18], ['Assorted Cupcakes Box of 6', 180],
      ['Assorted Cupcakes Box of 12', 340], ['Luxury Cupcakes Box of 6', 210],
      ['Luxury Cupcakes Box of 12', 390], ['Floral Buttercream Cupcakes', 38],
      ['Birthday Message Cupcakes', 38], ['Vegan Chocolate Cupcakes', 35],
    ],
  },
  {
    name: 'Pastries',
    prefix: 'pastries',
    image: 'https://images.squarespace-cdn.com/content/v1/5f2c7c0e7a0e2f2f5f5f5f5f/epicerie-boulud-pastries.jpg',
    products: [
      ['Butter Croissant Pastry', 32], ['Almond Croissant Pastry', 42], ['Chocolate Pain au Chocolat Pastry', 38],
      ['Cinnamon Danish Pastry', 35], ['Apple Turnover Pastry', 34], ['Custard Danish Pastry', 36],
      ['Berry Danish Pastry', 38], ['Portuguese Custard Tart Pastry', 24], ['Mini Milk Tart Pastry', 26],
      ['Lemon Meringue Tart Pastry', 42], ['Chocolate Tart Pastry', 45], ['Pecan Nut Tart Pastry', 48],
      ['Butter Scone Pastry', 22], ['Cheese Scone Pastry', 25], ['Blueberry Muffin Pastry', 28],
      ['Chocolate Muffin Pastry', 28], ['Bran Muffin Pastry', 24], ['Vanilla Eclair Pastry', 38],
      ['Chocolate Eclair Pastry', 40], ['Cream Puff Pastry', 30], ['Cinnamon Roll Pastry', 34],
      ['Sticky Bun Pastry', 36], ['Guava Danish Pastry', 34], ['Spinach Feta Puff Pastry', 32],
      ['Chicken Mayo Puff Pastry', 38], ['Sausage Roll Pastry', 30], ['Mini Quiche Pastry', 35],
      ['Apple Crumble Tart Pastry', 42], ['Lemon Curd Tartlet Pastry', 38], ['Assorted Petit Fours Pastry Box', 160],
    ],
  },
  {
    name: 'Platters',
    prefix: 'platters',
    image: 'https://sempresano.com/wp-content/uploads/2022/05/catering-platter.jpg',
    products: [
      ['Classic Sandwich Platter', 320], ['Chicken Wrap Platter', 360], ['Mini Burger Platter', 420],
      ['Cocktail Sausage Roll Platter', 290], ['Mini Quiche Platter', 340], ['Cheese and Crackers Platter', 390],
      ['Fresh Fruit Platter', 280], ['Seasonal Fruit and Cheese Platter', 420], ['Vegetarian Snack Platter', 330],
      ['Crudites and Dip Platter', 290], ['Chicken Drumstick Platter', 460], ['Chicken Skewer Platter', 440],
      ['Beef Meatball Platter', 420], ['Mini Savoury Pie Platter', 380], ['Samoosa and Spring Roll Platter', 350],
      ['Mini Pizza Platter', 360], ['Breakfast Pastry Platter', 340], ['Scone and Preserve Platter', 280],
      ['Dessert Bite Platter', 390], ['Cupcake Celebration Platter', 420], ['Brownie and Blondie Platter', 360],
      ['Biscuit and Cookie Platter', 300], ['Grazing Board Platter', 650], ['Executive Lunch Platter', 520],
      ['Kids Party Snack Platter', 380], ['Tea Time Treats Platter', 420], ['Mini Pancake Platter', 320],
      ['Breakfast Finger Food Platter', 460], ['Mixed Savoury Platter', 440], ['Nhlanganiso Signature Platter', 720],
    ],
  },
  {
    name: 'Other Products',
    prefix: 'other',
    image: "https://sweetmonas.com/wp-content/uploads/2021/06/baked-goods.jpg",
    products: [
      ['Other Product - Chocolate Chip Cookies', 18], ['Other Product - Oatmeal Raisin Cookies', 18],
      ['Other Product - Shortbread Biscuits', 22], ['Other Product - Ginger Biscuits', 20],
      ['Other Product - Chocolate Brownies', 28], ['Other Product - Walnut Blondies', 30],
      ['Other Product - Fudge Squares', 25], ['Other Product - Rocky Road Bars', 28],
      ['Other Product - Lemon Bars', 26], ['Other Product - Coconut Macaroons', 22],
      ['Other Product - Homemade Granola', 95], ['Other Product - Rusks', 85],
      ['Other Product - Buttermilk Rusks', 88], ['Other Product - Mini Doughnuts', 16],
      ['Other Product - Cinnamon Doughnuts', 20], ['Other Product - Waffles', 55],
      ['Other Product - Flapjacks', 48], ['Other Product - Pancake Stack', 52],
      ['Other Product - Milk Tart', 260], ['Other Product - Malva Pudding', 240],
      ['Other Product - Chocolate Mousse Cups', 38], ['Other Product - Fruit Yoghurt Cups', 35],
      ['Other Product - Dessert Jar', 48], ['Other Product - Chocolate Truffles Box', 150],
      ['Other Product - Assorted Biscuit Box', 130], ['Other Product - Homemade Jam', 65],
      ['Other Product - Caramel Sauce', 58], ['Other Product - Buttercream Tub', 75],
      ['Other Product - Mini Pavlovas', 32], ['Other Product - Seasonal Treat Box', 220],
    ],
  },
];

const slugify = (value: string) =>
  value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

type SeedState = {
  phase: 'idle' | 'running' | 'done' | 'error';
  total: number;
  completed: number;
  created: number;
  skipped: number;
  failed: string[];
  message: string;
};

const initialState: SeedState = {
  phase: 'idle', total: 180, completed: 0, created: 0, skipped: 0, failed: [], message: '',
};

async function loadAllProducts() {
  const first = await productService.list({ page: 1, per_page: 100 });
  const all = [...first.data];
  const pages = Math.ceil(first.meta.total / first.meta.per_page);
  for (let page = 2; page <= pages; page += 1) {
    const result = await productService.list({ page, per_page: 100 });
    all.push(...result.data);
  }
  return all;
}

function DemoCatalogueSeeder() {
  const [state, setState] = useState<SeedState>(initialState);

  const seed = useCallback(async () => {
    if (state.phase === 'running') return;
    setState({ ...initialState, phase: 'running', message: 'Checking categories and existing products…' });
    let created = 0;
    let skipped = 0;
    let completed = 0;
    const failed: string[] = [];

    try {
      const existingCategories = await categoryService.list();
      const categoryByName = new Map(existingCategories.map((category) => [category.name.toLowerCase(), category]));
      for (const definition of CATALOGUE) {
        if (categoryByName.has(definition.name.toLowerCase())) continue;
        try {
          const category = await adminService.createCategory({
            name: definition.name,
            slug: slugify(definition.name),
          });
          categoryByName.set(definition.name.toLowerCase(), {
            id: category.id, name: definition.name, slug: slugify(definition.name),
          });
        } catch {
          // A concurrent run may have created it. Re-read before treating this as a failure.
          const refreshed = await categoryService.list();
          const match = refreshed.find((item) => item.name.toLowerCase() === definition.name.toLowerCase());
          if (!match) throw new Error(`Could not create category "${definition.name}".`);
          categoryByName.set(definition.name.toLowerCase(), match);
        }
      }

      const existingProducts = await loadAllProducts();
      const existingSlugs = new Set(existingProducts.map((product) => product.slug));
      const queue = CATALOGUE.flatMap((definition) => {
        const category = categoryByName.get(definition.name.toLowerCase());
        if (!category) return [];
        return definition.products.map(([name, price]) => ({
          name,
          slug: slugify(name),
          price_cents: price * 100,
          description: `A freshly prepared Nhlanganiso ${definition.name.toLowerCase()} favourite. Made for sharing, celebrations and everyday treats.`,
          image_url: definition.image,
          active: true,
          category_id: category.id,
        }));
      }).filter((product) => !existingSlugs.has(product.slug));

      skipped = 180 - queue.length;
      setState({ phase: 'running', total: 180, completed: skipped, created: 0, skipped, failed: [], message: 'Adding products to the live catalogue…' });

      for (let index = 0; index < queue.length; index += 3) {
        const batch = queue.slice(index, index + 3);
        const results = await Promise.allSettled(batch.map((product) => adminService.createProduct(product)));
        for (let offset = 0; offset < results.length; offset += 1) {
          const result = results[offset];
          if (result.status === 'fulfilled') created += 1;
          else failed.push(`${batch[offset].name}: ${describeError(result.reason)}`);
          completed += 1;
        }
        setState({
          phase: 'running', total: 180, completed: skipped + completed, created, skipped, failed: [...failed],
          message: `Created ${created} of ${queue.length} new products…`,
        });
      }

      setState({
        phase: failed.length ? 'error' : 'done',
        total: 180,
        completed: 180 - failed.length,
        created,
        skipped,
        failed,
        message: failed.length
          ? 'Some products could not be created. You can run the seeder again; existing products will be skipped.'
          : 'The demo catalogue is now available in the public shop.',
      });
    } catch (error) {
      setState({
        phase: 'error', total: 180, completed, created, skipped, failed,
        message: describeError(error),
      });
    }
  }, [state.phase]);

  const percent = Math.round((state.completed / state.total) * 100);

  return (
    <section className="container section">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/admin">Dashboard</Link><span aria-hidden="true">/</span>
        <Link href="/admin/products">Products</Link><span aria-hidden="true">/</span>
        <span>Demo catalogue</span>
      </nav>

      <header className="page-head">
        <div>
          <p className="eyebrow">Storefront setup</p>
          <h1>Seed the public catalogue</h1>
          <p className="muted small">Create demo products through the same API used by the storefront.</p>
        </div>
        <Link href="/products" className="btn btn-outline">Preview public shop ↗</Link>
      </header>

      <div className="card form-stack">
        <div>
          <h2>180 demo products · 6 categories</h2>
          <p className="muted">
            This creates real, active catalogue records. Visitors will see them in the public shop,
            and the existing product detail, bag and checkout flows will use the API product IDs.
          </p>
        </div>
        <div className="category-grid">
          {CATALOGUE.map((category) => (
            <article className="card" key={category.name}>
              <strong>{category.name}</strong>
              <span className="muted small">{category.products.length} products</span>
            </article>
          ))}
        </div>
        <Notice tone="warning" title="Demo photography">
          Each category uses one representative third-party image across its 30 products.
          These are temporary demo images, not Nhlanganiso-owned photography. Replace them
          with licensed brand images before treating the catalogue as production content.
        </Notice>
        <p className="muted small">
          Existing products with matching slugs are skipped. The action is safe to rerun after a
          partial failure. Product creation requires an authenticated administrator.
        </p>

        {state.phase !== 'idle' ? (
          <div aria-live="polite" className="form-stack">
            <div className="row-between">
              <strong>{state.message}</strong>
              <span className="muted small">{state.completed}/{state.total}</span>
            </div>
            <div className="progress-track" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
              <div className="progress-track__bar" style={{ width: `${percent}%` }} />
            </div>
            <div className="admin-products-actions">
              <span className="muted small">{state.created} created · {state.skipped} already existed · {state.failed.length} failed</span>
              {state.phase === 'done' ? <Link href="/products" className="btn btn-primary">View public catalogue</Link> : null}
            </div>
            {state.failed.length > 0 ? (
              <details>
                <summary>{state.failed.length} failed products</summary>
                <ul>{state.failed.map((failure) => <li key={failure}>{failure}</li>)}</ul>
              </details>
            ) : null}
          </div>
        ) : null}

        <button type="button" className="btn btn-primary btn-lg" onClick={seed} disabled={state.phase === 'running'}>
          {state.phase === 'running' ? 'Seeding catalogue…' : state.phase === 'done' ? 'Run again (only missing products)' : 'Create 180 demo products'}
        </button>
      </div>
    </section>
  );
}

export default function DemoCatalogueSeederPage() {
  return <RequireAuth adminOnly><DemoCatalogueSeeder /></RequireAuth>;
}
