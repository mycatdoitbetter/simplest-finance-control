const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const app = {
  categories: [],
  months: [],
  selectedMonth: null,
  selectedYear: null,
  pendingAttachment: null,
  async init() {
    this.categories = await API.categories();
    this.populateCategories();
    document.getElementById('input-type').addEventListener('change', () => this.populateCategories());
    document.getElementById('input-attachment').addEventListener('change', (e) => this.handleFileSelect(e));
    document.getElementById('remove-attachment').addEventListener('click', () => this.removeAttachment());
    document.getElementById('form-transaction').addEventListener('submit', (e) => this.handleSubmit(e));
    document.getElementById('form-category').addEventListener('submit', (e) => this.handleCategorySubmit(e));
    document.getElementById('category-cancel').addEventListener('click', () => this.cancelCategoryEdit());
    document.getElementById('transaction-cancel').addEventListener('click', () => this.cancelTransactionEdit());
    document.getElementById('bulk-delete-transactions').addEventListener('click', () => this.bulkDeleteTransactions());
    document.getElementById('bulk-delete-categories').addEventListener('click', () => this.bulkDeleteCategories());
    renderCategories(this.categories);
    this.setCurrentMonthYear();
    await this.loadMonths();
    await this.load();
  },
  populateCategories() {
    const type = document.getElementById('input-type').value;
    const filtered = this.categories.filter(c => c.type === type);
    const select = document.getElementById('input-category');
    select.innerHTML = filtered.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
  },
  setCurrentMonthYear() {
    const now = new Date();
    document.getElementById('input-date').value = now.toISOString().slice(0, 10);
  },
  async loadMonths() {
    this.months = await API.months();
    const container = document.getElementById('month-tabs');
    if (this.months.length === 0) {
      container.innerHTML = '<p class="text-sm text-slate-500">No transactions yet</p>';
      this.selectedMonth = null;
      this.selectedYear = null;
      return;
    }
    const now = new Date();
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
    const currentYear = now.getFullYear();
    const hasCurrent = this.months.some(m => m.month === currentMonth && m.year == currentYear);
    const defaultMonth = hasCurrent ? this.months.find(m => m.month === currentMonth && m.year == currentYear) : this.months[0];
    const stillExists = this.months.some(m => m.month === this.selectedMonth && m.year == this.selectedYear);
    if (!this.selectedMonth || !stillExists) {
      this.selectedMonth = defaultMonth.month;
      this.selectedYear = defaultMonth.year;
    }
    container.innerHTML = this.months.map(m => {
      const label = `${MONTH_NAMES[parseInt(m.month) - 1]}/${m.year}`;
      const active = m.month === this.selectedMonth && m.year == this.selectedYear;
      return `<button type="button" data-month="${m.month}" data-year="${m.year}" class="month-tab px-3 py-1.5 rounded text-sm ${active ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}">${label} <span class="opacity-75">(${m.count})</span></button>`;
    }).join('');
    container.querySelectorAll('.month-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        this.selectedMonth = btn.dataset.month;
        this.selectedYear = btn.dataset.year;
        this.loadMonths();
        this.load();
      });
    });
  },
  async load() {
    const month = this.selectedMonth;
    const year = this.selectedYear;
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
    const data = {
      date: document.getElementById('input-date').value,
      type,
      category_id: Number(categoryId),
      amount: parseFloat(document.getElementById('input-amount').value),
      notes: document.getElementById('input-notes').value || null,
      due_date: document.getElementById('input-due-date').value || null,
      pix_key: document.getElementById('input-pix-key').value || null,
      barcode: document.getElementById('input-barcode').value || null,
      planned_payment_date: document.getElementById('input-planned-payment').value || null,
      attachment: this.pendingAttachment !== undefined ? this.pendingAttachment : undefined
    };
    const txnId = document.getElementById('transaction-id').value;
    if (txnId) {
      await API.updateTransaction(txnId, data);
    } else {
      await API.addTransaction(data);
    }
    this.resetTransactionForm();
    await this.loadMonths();
    await this.load();
  },
  resetTransactionForm() {
    document.getElementById('form-transaction').reset();
    document.getElementById('transaction-id').value = '';
    document.getElementById('transaction-submit').textContent = 'Add';
    document.getElementById('transaction-cancel').classList.add('hidden');
    document.getElementById('input-date').value = new Date().toISOString().slice(0, 10);
    document.getElementById('input-due-date').value = '';
    document.getElementById('input-planned-payment').value = '';
    this.pendingAttachment = null;
    document.getElementById('attachment-name').classList.add('hidden');
    document.getElementById('remove-attachment').classList.add('hidden');
  },
  handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) {
      this.pendingAttachment = null;
      document.getElementById('attachment-name').classList.add('hidden');
      return;
    }
    if (file.type !== 'application/pdf' || file.size > 5 * 1024 * 1024) {
      alert('Apenas PDF ate 5MB');
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      this.pendingAttachment = reader.result;
      document.getElementById('attachment-name').textContent = file.name;
      document.getElementById('attachment-name').classList.remove('hidden');
    };
    reader.readAsDataURL(file);
    document.getElementById('remove-attachment').classList.remove('hidden');
  },
  removeAttachment() {
    this.pendingAttachment = '';
    document.getElementById('input-attachment').value = '';
    document.getElementById('attachment-name').classList.add('hidden');
    document.getElementById('remove-attachment').classList.add('hidden');
  },
  async editTransaction(t) {
    const full = await API.getTransaction(t.id);
    document.getElementById('transaction-id').value = full.id;
    document.getElementById('input-date').value = full.date || '';
    document.getElementById('input-type').value = full.type;
    this.populateCategories();
    document.getElementById('input-category').value = full.category_id;
    document.getElementById('input-amount').value = full.amount;
    document.getElementById('input-notes').value = full.notes || '';
    document.getElementById('input-due-date').value = full.due_date || '';
    document.getElementById('input-pix-key').value = full.pix_key || '';
    document.getElementById('input-barcode').value = full.barcode || '';
    document.getElementById('input-planned-payment').value = full.planned_payment_date || '';
    this.pendingAttachment = full.attachment || undefined;
    document.getElementById('input-attachment').value = '';
    document.getElementById('attachment-name').textContent = full.attachment ? 'Comprovante anexado' : '';
    document.getElementById('attachment-name').classList.toggle('hidden', !full.attachment);
    document.getElementById('remove-attachment').classList.toggle('hidden', !full.attachment);
    document.getElementById('transaction-submit').textContent = 'Save';
    document.getElementById('transaction-cancel').classList.remove('hidden');
  },
  cancelTransactionEdit() {
    this.resetTransactionForm();
  },
  async deleteTransaction(id) {
    if (!confirm('Delete this transaction?')) return;
    await API.deleteTransaction(id);
    await this.loadMonths();
    await this.load();
  },
  getSelectedTransactionIds() {
    return [...document.querySelectorAll('.txn-checkbox:checked')].map(cb => Number(cb.value));
  },
  getSelectedCategoryIds() {
    return [...document.querySelectorAll('.cat-checkbox:checked')].map(cb => Number(cb.value));
  },
  toggleBulkDeleteTransactions() {
    const btn = document.getElementById('bulk-delete-transactions');
    btn.classList.toggle('hidden', this.getSelectedTransactionIds().length === 0);
  },
  toggleBulkDeleteCategories() {
    const btn = document.getElementById('bulk-delete-categories');
    btn.classList.toggle('hidden', this.getSelectedCategoryIds().length === 0);
  },
  async bulkDeleteTransactions() {
    const ids = this.getSelectedTransactionIds();
    if (!ids.length || !confirm(`Delete ${ids.length} transaction(s)?`)) return;
    await API.bulkDeleteTransactions(ids);
    await this.loadMonths();
    await this.load();
  },
  async bulkDeleteCategories() {
    const ids = this.getSelectedCategoryIds();
    if (!ids.length || !confirm(`Delete ${ids.length} category(ies)?`)) return;
    try {
      const res = await API.bulkDeleteCategories(ids);
      if (res.skipped > 0) alert(`${res.deleted} deleted. ${res.skipped} skipped (have transactions).`);
      this.categories = await API.categories();
      renderCategories(this.categories);
      this.populateCategories();
      await this.load();
    } catch (err) {
      alert(err.message);
    }
  },
  async handleCategorySubmit(e) {
    e.preventDefault();
    const id = document.getElementById('category-id').value;
    const name = document.getElementById('category-name').value.trim();
    const type = document.getElementById('category-type').value;
    try {
      if (id) {
        await API.updateCategory(id, { name, type });
      } else {
        await API.addCategory({ name, type });
      }
      this.categories = await API.categories();
      renderCategories(this.categories);
      this.populateCategories();
      document.getElementById('form-category').reset();
      document.getElementById('category-id').value = '';
      document.getElementById('category-submit').textContent = 'Add';
      document.getElementById('category-cancel').classList.add('hidden');
    } catch (err) {
      alert(err.message);
    }
  },
  editCategory(id, name, type) {
    document.getElementById('category-id').value = id;
    document.getElementById('category-name').value = name;
    document.getElementById('category-type').value = type;
    document.getElementById('category-submit').textContent = 'Save';
    document.getElementById('category-cancel').classList.remove('hidden');
  },
  cancelCategoryEdit() {
    document.getElementById('form-category').reset();
    document.getElementById('category-id').value = '';
    document.getElementById('category-submit').textContent = 'Add';
    document.getElementById('category-cancel').classList.add('hidden');
  },
  async deleteCategory(id) {
    if (!confirm('Delete this category?')) return;
    try {
      await API.deleteCategory(id);
      this.categories = await API.categories();
      renderCategories(this.categories);
      this.populateCategories();
      await this.loadMonths();
      await this.load();
    } catch (err) {
      alert(err.message);
    }
  }
};

window.app = app;
app.init();
