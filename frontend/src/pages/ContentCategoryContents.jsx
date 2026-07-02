import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { booksAPI } from '../api/books';
import { ContentCard } from '../components/content/ContentCard';
import { ContentFilters } from '../components/content/ContentFilters';
import { Logo } from '../components/Logo';
import { ChevronLeftIcon } from '../components/Icons';
import { getContentLibraryCategory } from '../constants/contentLibrary';
import { filterContentItems, normalizeContentItem } from '../utils/contentLibrary';

const defaultFilters = {
  search: '',
  category: '',
  age: '',
  language: '',
};

function ContentCategoryContents() {
  const { categoryId } = useParams();
  const category = getContentLibraryCategory(categoryId);
  const [contents, setContents] = useState([]);
  const [filters, setFilters] = useState(defaultFilters);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (category) loadContents();
  }, [categoryId]);

  const loadContents = async () => {
    try {
      setLoading(true);
      const response = await booksAPI.getPublishedBooks();
      setContents((response.data || []).map(normalizeContentItem));
    } catch (error) {
      console.error('Error loading category contents:', error);
      setContents([]);
    } finally {
      setLoading(false);
    }
  };

  const visibleContents = useMemo(
    () => filterContentItems(contents, filters, category),
    [contents, filters, category]
  );

  if (!category) {
    return <Navigate to="/content-library" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-red-50/40 dark:from-neutral-900 dark:to-neutral-800">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link to="/">
            <Logo size="default" showText={true} />
          </Link>
          <Link
            to="/content-library"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 font-black text-neutral-800 shadow-sm transition hover:bg-neutral-50 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700"
          >
            <ChevronLeftIcon className="h-5 w-5" />
            <span>Bibliotheque</span>
          </Link>
        </header>

        <section className={`mb-6 rounded-2xl bg-gradient-to-br ${category.gradient} p-6 text-white shadow-lg`}>
          <span className="grid h-20 w-20 place-items-center rounded-2xl bg-white/20 text-5xl backdrop-blur">
            {category.pictogram}
          </span>
          <h1 className="mt-5 text-4xl font-black">{category.label}</h1>
          <p className="mt-2 max-w-xl font-semibold text-white/85">{category.description}</p>
        </section>

        <ContentFilters
          filters={filters}
          onChange={setFilters}
          showCategory={false}
        />

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
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              {visibleContents.map((content) => (
                <ContentCard key={content.id} content={content} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default ContentCategoryContents;
