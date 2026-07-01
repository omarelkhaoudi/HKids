import axios from 'axios';
import { buildApiUrl } from '../config/api.js';

const noCacheConfig = {
  headers: {
    'Cache-Control': 'no-cache',
    Pragma: 'no-cache',
  },
};

export const booksAPI = {
  getPublishedBooks: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.age_group) params.append('age_group', filters.age_group);
    if (filters.category_id) params.append('category_id', filters.category_id);
    if (filters.theme) params.append('theme', filters.theme);
    if (filters.language) params.append('language', filters.language);
    if (filters.content_type) params.append('content_type', filters.content_type);
    
    return axios.get(`${buildApiUrl('/books/published')}?${params}`, noCacheConfig);
  },

  getBook: (id) => {
    return axios.get(buildApiUrl(`/books/${id}`), noCacheConfig);
  },

  getAllBooks: () => {
    return axios.get(buildApiUrl('/books'), noCacheConfig);
  },

  createBook: (formData) => {
    const token = localStorage.getItem('token');
    return axios.post(buildApiUrl('/books'), formData, {
      headers: { 
        'Content-Type': 'multipart/form-data',
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    });
  },

  updateBook: (id, formData) => {
    const token = localStorage.getItem('token');
    return axios.put(buildApiUrl(`/books/${id}`), formData, {
      headers: { 
        'Content-Type': 'multipart/form-data',
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    });
  },

  deleteBook: (id) => {
    return axios.delete(buildApiUrl(`/books/${id}`));
  }
};

export const categoriesAPI = {
  getAll: () => {
    return axios.get(buildApiUrl('/categories'));
  },

  create: (data) => {
    const token = localStorage.getItem('token');
    return axios.post(buildApiUrl('/categories'), data, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    });
  },

  update: (id, data) => {
    const token = localStorage.getItem('token');
    return axios.put(buildApiUrl(`/categories/${id}`), data, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    });
  },

  delete: (id) => {
    const token = localStorage.getItem('token');
    return axios.delete(buildApiUrl(`/categories/${id}`), {
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    });
  }
};

