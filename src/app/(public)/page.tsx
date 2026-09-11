import { HomeSearch } from '@/components/home/home-search';
import { PopularCategories } from '@/components/home/popular-categories';
import { listActiveAreas, listPublicCategories } from '@/lib/services/public';

export default async function HomePage() {
  const [areas, popular] = await Promise.all([
    listActiveAreas(),
    listPublicCategories({ popularOnly: true }),
  ]);
  const categories = popular.length > 0 ? popular : await listPublicCategories();

  return (
    <main className="px-4 py-10 sm:px-6 sm:py-16">
      <section className="mx-auto min-h-[58dvh] max-w-5xl content-center">
        <HomeSearch areas={areas} />
      </section>

      <section className="mx-auto mt-16 max-w-3xl" aria-labelledby="popular-heading">
        <PopularCategories categories={categories} areas={areas} />
      </section>
    </main>
  );
}
