const app = {
  categories: [],
  async init() {
    this.categories = await API.categories();
    this.populateYears();
    this.populateCategories();
    this.setCurrentMonthYear();
    document.getElementById('input-type').addEventListener('change', () => this.populateCategories());
    document.getElementById('form-transaction').addEventListener('submit', (e) => this.handleSubmit(e));
    document.getElementById('filter-month').addEventListener('change', () => this.load());
    document.getElementById('filter-year').addEventListener('change', () => this.load());
    await this.load();
  },
  populateYears() {
    const select = document.getElementById('filter-year');
    const year = new Date().getFullYear();
    select.innerHTML = '<option value="">All years</option>' +
      Array.from({ length: 5 }, (_, i) => year - i).map(y => `<option value="${y}">${y}</option>`).join('');
  },
  populateCategories() {
    const type = document.getElementById('input-type').value;
    const filtered = this.categories.filter(c => c.type === type);
    const select = document.getElementById('input-category');
    select.innerHTML = filtered.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
  },
  setCurrentMonthYear() {
    const now = new Date();
    document.getElementById('filter-month').value = String(now.getMonth() + 1).padStart(2, '0');
    document.getElementById('filter-year').value = now.getFullYear();
    document.getElementById('input-date').value = now.toISOString().slice(0, 10);
  },
  getFilters() {
    return {
      month: document.getElementById('filter-month').value,
      year: document.getElementById('filter-year').value
    };
  },
  async load() {
    const { month, year } = this.getFilters();
    const [transactions, summary] = await Promise.all([
      API.transactions(month, year),
      API.summary(month, year)
    ]);
    renderTable(transactions);
    document.getElementById('summary-income').textContent = formatCurrency(summary.income);
    document.getElementById('summary-expense').textContent = formatCurrency(summary.expense);
    document.getElementById('summary-balance').textContent = formatCurrency(summary.balance);
    document.getElementById('summary-balance').className = `text-xl font-semibold ${summary.balance >= 0 ? 'text-slate-800' : 'text-rose-600'}`;
    renderChart(summary.byCategory);
  },
  async handleSubmit(e) {
    e.preventDefault();
    const type = document.getElementById('input-type').value;
    const categoryId = document.getElementById('input-category').value;
    if (!this.categories.find(c => c.id == categoryId && c.type === type)) return;
    await API.addTransaction({
      date: document.getElementById('input-date').value,
      type,
      category_id: Number(categoryId),
      amount: parseFloat(document.getElementById('input-amount').value),
      notes: document.getElementById('input-notes').value || null
    });
    document.getElementById('input-amount').value = '';
    document.getElementById('input-notes').value = '';
    await this.load();
  },
  async deleteTransaction(id) {
    if (!confirm('Delete this transaction?')) return;
    await API.deleteTransaction(id);
    await this.load();
  }
};

window.app = app;
app.init();
