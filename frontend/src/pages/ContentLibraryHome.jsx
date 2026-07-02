import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { booksAPI } from '../api/books';
import { ContentCategoryCard } from '../components/content/ContentCategoryCard';
import { ContentFilters } from '../components/content/ContentFilters';
import { ContentCard } from '../components/content/ContentCard';
import { Logo } from '../components/Logo';
import { CONTENT_LIBRARY_CATEGORIES } from '../constants/contentLibrary';
import { filterContentItems, normalizeContentItem } from '../utils/contentLibrary';

const defaultFilters = {
  search: '',
  category: '',
  age: '',
  language: '',
};

function ContentLibraryHome() {
  const [contents, setContents] = useState([]);
  const [filters, setFilters] = useState(defaultFilters);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContents();
  }, []);

  const loadContents = async () => {
    try {
      setLoading(true);
      const response = await booksAPI.getPublishedBooks();
      setContents((response.data || []).map(normalizeContentItem));
    } catch (error) {
      console.error('Error loading content library:', error);
      setContents([]);
    } finally {
      setLoading(false);
    }
  };

  const categoryCounts = useMemo(() => {
    return CONTENT_LIBRARY_CATEGORIES.reduce((acc, category) => {
      acc[category.id] = contents.filter((content) =>
        category.contentTypes.includes(content.content_type || 'story')
      ).length;
      return acc;
    }, {});
  }, [contents]);

  const selectedCategory = CONTENT_LIBRARY_CATEGORIES.find((category) => category.id === filters.category) || null;
  const visibleContents = useMemo(
    () => filterContentItems(contents, filters, selectedCategory).slice(0, 8),
    [contents, filters, selectedCategory]
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-red-50/40 dark:from-neutral-900 dark:to-neutral-800">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link to="/">
            <Logo size="default" showText={true} />
          </Link>
          <Link
            to="/kids"
            className="inline-flex min-h-12 items-center justify-center rounded-xl bg-neutral-900 px-5 py-3 font-black text-white shadow-md transition hover:bg-neutral-800"
          >
            Espace enfant
          </Link>
        </header>

        <section className="mb-6 rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-800">
          <p className="text-sm font-black uppercase text-red-500">Le Lit Qui Lit</p>
          <h1 className="mt-2 text-3xl font-black text-neutral-900 dark:text-neutral-100 sm:text-4xl">
            Bibliotheque de contenus
          </h1>
        </section>

        <section className="mb-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {CONTENT_LIBRARY_CATEGORIES.map((category) => (
              <ContentCategoryCard
                key={category.id}
                category={category}
                count={categoryCounts[category.id] || 0}
              />
            ))}
          </div>
        </section>

        <ContentFilters filters={filters} onChange={setFilters} />

        <section className="mt-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-xl font-black text-neutral-900 dark:text-neutral-100">
              Contenus
            </h2>
            <span className="rounded-full bg-white px-4 py-2 text-sm font-bold text-neutral-600 shadow-sm dark:bg-neutral-800 dark:text-neutral-200">
              {visibleContents.length}
            </span>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-72 animate-pulse rounded-xl bg-white dark:bg-neutral-800" />
              ))}
            </div>
          ) : visibleContents.length === 0 ? (
            <div className="rounded-xl bg-white p-10 text-center font-bold text-neutral-500 shadow-sm dark:bg-neutral-800 dark:text-neutral-300">
              Aucun contenu
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4"
            >
              {visibleContents.map((content) => (
                <ContentCard key={content.id} content={content} />
              ))}
            </motion.div>
          )}
        </section>
      </div>
    </div>
  );
}

export default ContentLibraryHome;
