const API = {
  base: '',
  async get(path) {
    const res = await fetch(`${this.base}${path}`);
    if (!res.ok) throw new Error(res.statusText);
    return res.json();
  },
  async post(path, body) {
    const res = await fetch(`${this.base}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(res.statusText);
    return res.status === 204 ? null : res.json();
  },
  async put(path, body) {
    const res = await fetch(`${this.base}${path}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(res.statusText);
    return res.json();
  },
  async delete(path) {
    const res = await fetch(`${this.base}${path}`, { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || res.statusText);
    }
  },
  categories: () => API.get('/api/categories'),
  addCategory: (data) => API.post('/api/categories', data),
  updateCategory: (id, data) => API.put(`/api/categories/${id}`, data),
  deleteCategory: (id) => API.delete(`/api/categories/${id}`),
  bulkDeleteCategories: (ids) => API.post('/api/categories/bulk-delete', { ids }),
  months: () => API.get('/api/months'),
  getTransaction: (id) => API.get(`/api/transactions/${id}`),
  transactions: (month, year) => {
    const q = new URLSearchParams();
    if (month) q.set('month', month);
    if (year) q.set('year', year);
    return API.get(`/api/transactions?${q}`);
  },
  summary: (month, year) => {
    const q = new URLSearchParams();
    if (month) q.set('month', month);
    if (year) q.set('year', year);
    return API.get(`/api/summary?${q}`);
  },
  addTransaction: (data) => API.post('/api/transactions', data),
  updateTransaction: (id, data) => API.put(`/api/transactions/${id}`, data),
  deleteTransaction: (id) => API.delete(`/api/transactions/${id}`),
  bulkDeleteTransactions: (ids) => API.post('/api/transactions/bulk-delete', { ids })
};
