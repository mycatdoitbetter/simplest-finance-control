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
  async delete(path) {
    const res = await fetch(`${this.base}${path}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(res.statusText);
  },
  categories: () => API.get('/api/categories'),
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
  deleteTransaction: (id) => API.delete(`/api/transactions/${id}`)
};
