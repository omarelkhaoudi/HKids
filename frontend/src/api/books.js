import axios from 'axios';
import { API_URL } from '../config/api.js';

export const booksAPI = {
  getPublishedBooks: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.age_group) params.append('age_group', filters.age_group);
    if (filters.category_id) params.append('category_id', filters.category_id);
    
    return axios.get(`${API_URL}/books/published?${params}`);
  },

  getBook: (id) => {
    return axios.get(`${API_URL}/books/${id}`);
  },

  getAllBooks: () => {
    return axios.get(`${API_URL}/books`);
  },

  createBook: (formData) => {
    const token = localStorage.getItem('token');
    return axios.post(`${API_URL}/books`, formData, {
      headers: { 
        'Content-Type': 'multipart/form-data',
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    });
  },

  updateBook: (id, formData) => {
    const token = localStorage.getItem('token');
    return axios.put(`${API_URL}/books/${id}`, formData, {
      headers: { 
        'Content-Type': 'multipart/form-data',
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    });
  },

  deleteBook: (id) => {
    return axios.delete(`${API_URL}/books/${id}`);
  }
};

export const categoriesAPI = {
  getAll: () => {
    return axios.get(`${API_URL}/categories`);
  },

  create: (data) => {
    return axios.post(`${API_URL}/categories`, data);
  },

  update: (id, data) => {
    return axios.put(`${API_URL}/categories/${id}`, data);
  },

  delete: (id) => {
    return axios.delete(`${API_URL}/categories/${id}`);
  }
};

