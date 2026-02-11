import { useState, useEffect } from 'react';
import { booksAPI, categoriesAPI } from '../../api/books';
import { BookIcon, PublishIcon, UnpublishIcon, XIcon, LightBulbIcon, TrashIcon } from '../Icons';

function BookManagement() {
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
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
  const [pageFiles, setPageFiles] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [booksRes, categoriesRes] = await Promise.all([
        booksAPI.getAllBooks(),
        categoriesAPI.getAll()
      ]);
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
      alert('Error saving book: ' + (error.response?.data?.error || error.message));
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
      is_published: book.is_published === 1
    });
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
      const formData = new FormData();
      formData.append('title', book.title);
      formData.append('author', book.author || '');
      formData.append('description', book.description || '');
      formData.append('category_id', book.category_id || '');
      formData.append('age_group_min', book.age_group_min);
      formData.append('age_group_max', book.age_group_max);
      formData.append('is_published', book.is_published === 1 ? 'false' : 'true');
      
      await booksAPI.updateBook(book.id, formData);
      loadData();
    } catch (error) {
      console.error('Error updating book:', error);
      alert('Error updating book');
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
    setPageFiles([]);
    setEditingBook(null);
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Book Management</h2>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="px-6 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors font-medium"
        >
          + Add New Book
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-neutral-900"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cover</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Author</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Age Group</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {books.map(book => (
                <tr key={book.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {book.cover_image ? (
                      <img
                        src={`http://localhost:3000${book.cover_image}`}
                        alt={book.title}
                        className="w-16 h-20 object-cover rounded"
                      />
                    ) : (
                      <div className="w-16 h-20 bg-neutral-200 rounded flex items-center justify-center">
                        <BookIcon className="w-8 h-8 text-neutral-400" />
                      </div>
                    )}
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
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      book.is_published === 1
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {book.is_published === 1 ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      {book.is_published === 0 && (
                        <button
                          onClick={() => handleTogglePublish(book)}
                          className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs font-medium flex items-center gap-1"
                          title="Publier le livre"
                        >
                          <PublishIcon className="w-3 h-3" />
                          <span>Publier</span>
                        </button>
                      )}
                      {book.is_published === 1 && (
                        <button
                          onClick={() => handleTogglePublish(book)}
                          className="px-3 py-1 bg-neutral-600 text-white rounded hover:bg-neutral-700 text-xs font-medium flex items-center gap-1"
                          title="Dépublier le livre"
                        >
                          <UnpublishIcon className="w-3 h-3" />
                          <span>Dépublier</span>
                        </button>
                      )}
                      <button
                        onClick={() => handleEdit(book)}
                        className="text-neutral-700 hover:text-neutral-900"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(book.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-800">
                  {editingBook ? 'Edit Book' : 'Add New Book'}
                </h3>
                <button
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="text-neutral-400 hover:text-neutral-600 transition-colors"
                >
                  <XIcon className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Author
                  </label>
                  <input
                    type="text"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      value={formData.category_id}
                      onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">None</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Age Group
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={formData.age_group_min}
                        onChange={(e) => setFormData({ ...formData, age_group_min: parseInt(e.target.value) })}
                        min="0"
                        max="12"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        placeholder="Min"
                      />
                      <input
                        type="number"
                        value={formData.age_group_max}
                        onChange={(e) => setFormData({ ...formData, age_group_max: parseInt(e.target.value) })}
                        min="0"
                        max="12"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        placeholder="Max"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cover Image
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setCoverFile(e.target.files[0])}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                {!editingBook && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Page Images (multiple) *
                    </label>
                    <div className="space-y-3">
                      <input
                        type="file"
                        accept="image/*"
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
                            Formats acceptés: JPG, PNG, GIF
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
                  <button
                    type="submit"
                    className="flex-1 px-6 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors font-medium"
                  >
                    {editingBook ? 'Update Book' : 'Create Book'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="flex-1 px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BookManagement;

