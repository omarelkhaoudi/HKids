import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { booksAPI, categoriesAPI } from '../../api/books';
import { API_URL } from '../../config/api';
import { BookIcon, PublishIcon, UnpublishIcon, XIcon, LightBulbIcon, TrashIcon, StarIcon } from '../Icons';

// Helper: base URL for images (backend origin, without /api)
const getImageBaseUrl = () => {
  // 1) VITE_API_URL (prod) – ex: https://hkids-backend.fly.dev or https://hkids-backend.fly.dev/api
  const viteApiUrl = import.meta.env.VITE_API_URL;
  if (viteApiUrl) {
    const baseUrl = viteApiUrl.replace(/\/api\/?$/, '');
    return baseUrl;
  }

  // 2) API_URL already computed in config (may be absolute or relative)
  if (API_URL && (API_URL.startsWith('http://') || API_URL.startsWith('https://'))) {
    return API_URL.replace(/\/api\/?$/, '');
  }

  // 3) Dev mode with Vite proxy -> backend on localhost:3000
  if (API_URL && API_URL.startsWith('/')) {
    return 'http://localhost:3000';
  }

  // 4) Fallback
  return 'http://localhost:3000';
};

// Helper: normalize image path stored in DB (can be relative or full URL)
const normalizeImagePath = (rawPath) => {
  if (!rawPath) return null;

  let path = rawPath;

  try {
    // If full URL, keep only pathname+search (drop protocol+host)
    if (rawPath.startsWith('http://') || rawPath.startsWith('https://')) {
      const urlObj = new URL(rawPath);
      path = urlObj.pathname + urlObj.search;
    }
  } catch {
    // If URL parsing fails, keep original string
    path = rawPath;
  }

  // Ensure leading slash
  if (!path.startsWith('/')) {
    path = `/${path}`;
  }

  return path;
};

function BookManagement() {
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    description: '',
    category_id: '',
    age_group_min: 0,
    age_group_max: 12,
    is_published: false
  });
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [pageFiles, setPageFiles] = useState([]);

  useEffect(() => {
    // Log the image base URL on component mount for debugging
    console.log('[BookManagement] Component mounted');
    console.log('[BookManagement] API_URL:', API_URL);
    console.log('[BookManagement] VITE_API_URL env:', import.meta.env.VITE_API_URL);
    console.log('[BookManagement] Image base URL will be:', getImageBaseUrl());
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [booksRes, categoriesRes] = await Promise.all([
        booksAPI.getAllBooks(),
        categoriesAPI.getAll()
      ]);
      console.log('[BookManagement] Books loaded:', booksRes.data);
      // Log cover images for debugging
      booksRes.data.forEach(book => {
        console.log(`[Book ${book.id}] ${book.title} - cover_image:`, book.cover_image);
      });
      setBooks(booksRes.data);
      setCategories(categoriesRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Error loading data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!editingBook && pageFiles.length === 0) {
      alert('Veuillez sélectionner au moins une page pour le livre!');
      return;
    }
    
    setSubmitting(true);
    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        data.append(key, formData[key]);
      });
      
      if (coverFile) {
        data.append('cover', coverFile);
      }
      
      // Ajouter toutes les pages
      if (pageFiles.length > 0) {
        pageFiles.forEach((file) => {
          data.append('pages', file);
        });
        console.log(`Envoi de ${pageFiles.length} pages au serveur...`);
      }

      if (editingBook) {
        await booksAPI.updateBook(editingBook.id, data);
      } else {
        await booksAPI.createBook(data);
      }

      setShowModal(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error saving book:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Unknown error occurred';
      const statusCode = error.response?.status;
      
      if (statusCode === 404) {
        alert('Error: Endpoint not found. Please check your API configuration.');
      } else if (statusCode === 401) {
        alert('Error: Authentication failed. Please log in again.');
      } else if (statusCode === 400) {
        alert(`Error: ${errorMessage}`);
      } else {
        alert(`Error saving book: ${errorMessage}`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (book) => {
    setEditingBook(book);
    setFormData({
      title: book.title || '',
      author: book.author || '',
      description: book.description || '',
      category_id: book.category_id || '',
      age_group_min: book.age_group_min || 0,
      age_group_max: book.age_group_max || 12,
      is_published: book.is_published === true || book.is_published === 1
    });
    // Set cover preview to existing image (normalize any stored URL)
    const normalizedPath = normalizeImagePath(book.cover_image);
    if (normalizedPath) {
      const imageUrl = `${getImageBaseUrl()}${normalizedPath}`;
      setCoverPreview(imageUrl);
    } else {
      setCoverPreview(null);
    }
    setCoverFile(null);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this book?')) return;
    
    try {
      await booksAPI.deleteBook(id);
      loadData();
    } catch (error) {
      console.error('Error deleting book:', error);
      alert('Error deleting book');
    }
  };

  const handleTogglePublish = async (book) => {
    try {
      const isCurrentlyPublished = book.is_published === true || book.is_published === 1;
      const newPublishedStatus = !isCurrentlyPublished;
      
      const formData = new FormData();
      formData.append('title', book.title);
      formData.append('author', book.author || '');
      formData.append('description', book.description || '');
      formData.append('category_id', book.category_id || '');
      formData.append('age_group_min', book.age_group_min);
      formData.append('age_group_max', book.age_group_max);
      // FormData convertit les booléens en strings, donc on envoie explicitement 'true' ou 'false'
      formData.append('is_published', newPublishedStatus ? 'true' : 'false');
      
      await booksAPI.updateBook(book.id, formData);
      loadData();
    } catch (error) {
      console.error('Error updating book:', error);
      alert('Error updating book: ' + (error.response?.data?.error || error.message));
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      author: '',
      description: '',
      category_id: '',
      age_group_min: 0,
      age_group_max: 12,
      is_published: false
    });
    setCoverFile(null);
    setCoverPreview(null);
    setPageFiles([]);
    setEditingBook(null);
  };

  const handleCoverFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCoverFile(file);
      // Create preview URL for the new file
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setCoverFile(null);
      // If editing, restore the original cover image preview (normalized)
      if (editingBook && editingBook.cover_image) {
        const normalizedPath = normalizeImagePath(editingBook.cover_image);
        if (normalizedPath) {
          const imageUrl = `${getImageBaseUrl()}${normalizedPath}`;
          setCoverPreview(imageUrl);
        } else {
          setCoverPreview(null);
        }
      } else {
        setCoverPreview(null);
      }
    }
  };

  return (
    <div className="relative z-10">
      {/* Hero Section avec style aquarelle magique */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative mb-8 rounded-3xl overflow-hidden"
      >
        {/* Fond avec gradient chaud et effet aquarelle */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-200/40 via-pink-200/40 to-red-200/40 backdrop-blur-sm"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,200,100,0.3),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,150,150,0.2),transparent_50%)]"></div>
        
        {/* Étincelles magiques animées */}
        {Array.from({ length: 12 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{
              left: `${20 + (i * 7)}%`,
              top: `${30 + (i % 3) * 20}%`,
            }}
            animate={{
              y: [0, -15, 0],
              opacity: [0.4, 1, 0.4],
              scale: [0.8, 1.2, 0.8],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 2 + Math.random() * 1.5,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          >
            <div className="w-2 h-2 bg-yellow-300 rounded-full shadow-lg shadow-yellow-400/50"></div>
          </motion.div>
        ))}
        
        {/* Contenu principal */}
        <div className="relative px-8 py-12 md:py-16">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex-1">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 backdrop-blur-md border border-orange-200/50 mb-4"
              >
                <BookIcon className="w-5 h-5 text-orange-600" />
                <span className="text-sm font-semibold text-orange-700">Gestion de la Bibliothèque</span>
              </motion.div>
              
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-4xl md:text-5xl font-extrabold mb-3 bg-gradient-to-r from-orange-600 via-pink-600 to-red-600 bg-clip-text text-transparent"
              >
                Book Management
              </motion.h2>
              
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-lg text-neutral-700 max-w-2xl"
              >
                Créez, modifiez et gérez votre collection de livres pour enfants avec un design magique et intuitif.
              </motion.p>
            </div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
            >
              <motion.button
                onClick={() => {
                  resetForm();
                  setShowModal(true);
                }}
                whileHover={{ scale: 1.05, boxShadow: "0 20px 25px -5px rgba(239, 68, 68, 0.3)" }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-gradient-to-r from-orange-500 via-pink-500 to-red-500 text-white rounded-2xl hover:from-orange-600 hover:via-pink-600 hover:to-red-600 transition-all font-bold text-lg shadow-2xl shadow-orange-500/30 relative overflow-hidden group"
              >
                {/* Effet de brillance au survol */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                <span className="relative flex items-center gap-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Ajouter un livre
                </span>
              </motion.button>
            </motion.div>
          </div>
        </div>
        
        {/* Bordure décorative en bas */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-orange-300/50 to-transparent"></div>
      </motion.div>

      <div className="px-8 pb-8">

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-red-500 border-t-transparent"></div>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-red-200/50 overflow-hidden"
        >
          <table className="min-w-full divide-y divide-red-100">
            <thead className="bg-gradient-to-r from-red-50 to-pink-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-red-700 uppercase">Cover</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-red-700 uppercase">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-red-700 uppercase">Author</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-red-700 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-red-700 uppercase">Age Group</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-red-700 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-red-700 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-red-100">
              {books.map((book, index) => (
                <motion.tr
                  key={book.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                  className="hover:bg-red-50/50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    {(() => {
                      const normalizedPath = normalizeImagePath(book.cover_image);
                      if (!normalizedPath) {
                        return (
                          <div className="w-16 h-20 bg-neutral-200 rounded flex items-center justify-center">
                            <BookIcon className="w-8 h-8 text-neutral-400" />
                          </div>
                        );
                      }

                      const imageUrl = `${getImageBaseUrl()}${normalizedPath}`;
                      return (
                        <img
                          src={imageUrl}
                          alt={book.title}
                          className="w-16 h-20 object-cover rounded"
                          onError={(e) => {
                            console.error(`[Book ${book.id}] Failed to load image from:`, imageUrl);
                            e.target.style.display = 'none';
                          }}
                        />
                      );
                    })()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{book.title}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{book.author || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{book.category_name || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {book.age_group_min}-{book.age_group_max} years
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1.5 text-xs rounded-full font-medium ${
                      (book.is_published === true || book.is_published === 1)
                        ? 'bg-green-100 text-green-800 border border-green-200'
                        : 'bg-gray-100 text-gray-800 border border-gray-200'
                    }`}>
                      {(book.is_published === true || book.is_published === 1) ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      {!(book.is_published === true || book.is_published === 1) && (
                        <motion.button
                          onClick={() => handleTogglePublish(book)}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="px-3 py-1.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 text-xs font-medium flex items-center gap-1 transition-all shadow-sm"
                          title="Publier le livre"
                        >
                          <PublishIcon className="w-3 h-3" />
                          <span>Publier</span>
                        </motion.button>
                      )}
                      {(book.is_published === true || book.is_published === 1) && (
                        <motion.button
                          onClick={() => handleTogglePublish(book)}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="px-3 py-1.5 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg hover:from-gray-600 hover:to-gray-700 text-xs font-medium flex items-center gap-1 transition-all shadow-sm"
                          title="Dépublier le livre"
                        >
                          <UnpublishIcon className="w-3 h-3" />
                          <span>Dépublier</span>
                        </motion.button>
                      )}
                      <motion.button
                        onClick={() => handleEdit(book)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="text-red-600 hover:text-red-800 font-medium transition-colors"
                      >
                        Edit
                      </motion.button>
                      <motion.button
                        onClick={() => handleDelete(book.id)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="text-red-600 hover:text-red-800 font-medium transition-colors"
                      >
                        Delete
                      </motion.button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white/95 backdrop-blur-lg rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border-2 border-red-200 shadow-2xl"
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-neutral-900">
                  {editingBook ? 'Edit Book' : 'Add New Book'}
                </h3>
                <motion.button
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  className="text-red-400 hover:text-red-600 transition-colors"
                >
                  <XIcon className="w-5 h-5" />
                </motion.button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-red-700 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    className="w-full px-4 py-2.5 border-2 border-red-200 rounded-xl focus:ring-4 focus:ring-red-500/20 focus:border-red-400 transition-all bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-red-700 mb-1">
                    Author
                  </label>
                  <input
                    type="text"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-red-200 rounded-xl focus:ring-4 focus:ring-red-500/20 focus:border-red-400 transition-all bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-red-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2.5 border-2 border-red-200 rounded-xl focus:ring-4 focus:ring-red-500/20 focus:border-red-400 transition-all bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-red-700 mb-1">
                      Category
                    </label>
                    <select
                      value={formData.category_id}
                      onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                      className="w-full px-4 py-2.5 border-2 border-red-200 rounded-xl focus:ring-4 focus:ring-red-500/20 focus:border-red-400 transition-all bg-white"
                    >
                      <option value="">None</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-red-700 mb-1">
                      Age Group
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={formData.age_group_min}
                        onChange={(e) => setFormData({ ...formData, age_group_min: parseInt(e.target.value) })}
                        min="0"
                        max="12"
                        className="w-full px-4 py-2.5 border-2 border-red-200 rounded-xl focus:ring-4 focus:ring-red-500/20 focus:border-red-400 transition-all bg-white"
                        placeholder="Min"
                      />
                      <input
                        type="number"
                        value={formData.age_group_max}
                        onChange={(e) => setFormData({ ...formData, age_group_max: parseInt(e.target.value) })}
                        min="0"
                        max="12"
                        className="w-full px-4 py-2.5 border-2 border-red-200 rounded-xl focus:ring-4 focus:ring-red-500/20 focus:border-red-400 transition-all bg-white"
                        placeholder="Max"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-red-700 mb-1">
                    Cover Image
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverFileChange}
                    className="w-full px-4 py-2.5 border-2 border-red-200 rounded-xl focus:ring-4 focus:ring-red-500/20 focus:border-red-400 transition-all bg-white mb-2"
                  />
                  {coverPreview && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-600 mb-2">Aperçu de l'image de couverture:</p>
                      <img
                        src={coverPreview}
                        alt="Cover preview"
                        className="w-full max-w-xs h-48 object-cover rounded-lg border-2 border-red-200"
                        onError={(e) => {
                          console.error('Error loading cover image:', coverPreview);
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>

                {!editingBook && (
                  <div>
                    <label className="block text-sm font-medium text-red-700 mb-2">
                      Page Images (multiple) *
                    </label>
                    <div className="space-y-3">
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        multiple
                        id="page-files-input"
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          if (files.length > 0) {
                            // Ajouter les nouveaux fichiers aux fichiers existants
                            setPageFiles(prev => {
                              const combined = [...prev, ...files];
                              // Éviter les doublons basés sur le nom et la taille
                              const unique = combined.filter((file, index, self) =>
                                index === self.findIndex(f => f.name === file.name && f.size === file.size)
                              );
                              console.log(`${unique.length} fichiers au total:`, unique.map(f => f.name));
                              return unique;
                            });
                            // Réinitialiser l'input pour permettre de sélectionner à nouveau
                            e.target.value = '';
                          }
                        }}
                        className="hidden"
                      />
                      <label
                        htmlFor="page-files-input"
                        className="block w-full px-6 py-4 border-2 border-dashed border-neutral-300 rounded-lg hover:border-neutral-400 hover:bg-neutral-50 transition-all cursor-pointer text-center"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <svg className="w-12 h-12 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                          </svg>
                          <span className="font-semibold text-neutral-700">
                            Cliquez pour sélectionner plusieurs pages
                          </span>
                          <span className="text-sm text-gray-500">
                            Maintenez Ctrl (ou Cmd) pour sélectionner plusieurs fichiers
                          </span>
                          <span className="text-xs text-gray-400 mt-1">
                            Formats acceptés: JPG, PNG, GIF, PDF
                          </span>
                        </div>
                      </label>
                      
                      {pageFiles.length > 0 && (
                        <div className="mt-3 p-4 bg-green-50 border-2 border-green-200 rounded-xl">
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-sm font-medium text-neutral-700">
                              {pageFiles.length} {pageFiles.length === 1 ? 'fichier sélectionné' : 'fichiers sélectionnés'}
                            </p>
                            <button
                              type="button"
                              onClick={() => setPageFiles([])}
                              className="text-xs text-red-600 hover:text-red-800 font-medium flex items-center gap-1"
                            >
                              <TrashIcon className="w-3 h-3" />
                              <span>Tout effacer</span>
                            </button>
                          </div>
                          <div className="max-h-40 overflow-y-auto space-y-2 bg-white p-3 rounded-lg border border-green-200">
                            {pageFiles.map((file, index) => (
                              <div key={`${file.name}-${file.size}-${index}`} className="flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-gray-100">
                                <div className="flex items-center gap-3 flex-1">
                                  <span className="font-bold text-neutral-700 w-8">#{index + 1}</span>
                                  <span className="text-sm text-gray-700 flex-1 truncate">{file.name}</span>
                                  <span className="text-xs text-gray-500">({(file.size / 1024).toFixed(1)} KB)</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPageFiles(prev => prev.filter((_, i) => i !== index));
                                  }}
                                  className="ml-2 text-red-500 hover:text-red-700 transition-colors"
                                  title="Supprimer"
                                >
                                  <XIcon className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                          <div className="mt-3 flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                // Réorganiser: déplacer vers le haut
                                const newFiles = [...pageFiles];
                                if (newFiles.length > 1) {
                                  // Permettre de réorganiser (optionnel)
                                }
                              }}
                              className="text-xs px-3 py-1 bg-neutral-100 text-neutral-700 rounded hover:bg-neutral-200"
                            >
                              L'ordre actuel sera utilisé pour les pages
                            </button>
                          </div>
                          <p className="text-xs text-neutral-600 mt-2 flex items-start gap-2">
                            <LightBulbIcon className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <span>L'ordre d'affichage ci-dessus correspond à l'ordre des pages dans le livre. Vous pouvez cliquer sur "Sélectionner" à nouveau pour ajouter plus de fichiers.</span>
                          </p>
                        </div>
                      )}
                      
                      {pageFiles.length === 0 && (
                        <div className="mt-2 p-3 bg-neutral-50 border border-neutral-200 rounded-lg">
                          <p className="text-xs text-neutral-700 flex items-start gap-2">
                            <LightBulbIcon className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <span>
                              <strong>Astuce:</strong> Cliquez sur la zone ci-dessus, puis dans la fenêtre de sélection, maintenez <strong>Ctrl</strong> (Windows) ou <strong>Cmd</strong> (Mac) et cliquez sur plusieurs fichiers pour les sélectionner tous en même temps. Vous pouvez aussi cliquer plusieurs fois pour ajouter des fichiers progressivement.
                            </span>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_published"
                    checked={formData.is_published}
                    onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                    className="mr-2"
                  />
                  <label htmlFor="is_published" className="text-sm font-medium text-gray-700">
                    Publish immediately
                  </label>
                </div>

                <div className="flex gap-4 pt-4">
                  <motion.button
                    type="submit"
                    disabled={submitting}
                    whileHover={submitting ? {} : { scale: 1.02 }}
                    whileTap={submitting ? {} : { scale: 0.98 }}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl hover:from-red-600 hover:to-pink-600 transition-all font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        <span>Création en cours...</span>
                      </>
                    ) : (
                      editingBook ? 'Update Book' : 'Create Book'
                    )}
                  </motion.button>
                  <motion.button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors border-2 border-gray-300"
                  >
                    Cancel
                  </motion.button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default BookManagement;

