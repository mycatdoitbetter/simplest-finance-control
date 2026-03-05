function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

function formatDate(str) {
  if (!str) return '-';
  const [y, m, d] = str.split('-');
  return d && m && y ? `${d}/${m}/${y}` : str;
}

function renderTable(transactions) {
  const tbody = document.getElementById('table-body');
  tbody.innerHTML = transactions.map(t => `
    <tr class="border-b border-slate-100 hover:bg-slate-50">
      <td class="py-2"><input type="checkbox" class="txn-checkbox rounded" value="${t.id}"></td>
      <td class="py-2 whitespace-nowrap">${formatDate(t.date)}</td>
      <td class="py-2"><span class="px-2 py-0.5 rounded text-xs ${t.type === 'income' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}">${t.type}</span></td>
      <td class="py-2">${t.category_name}</td>
      <td class="py-2 font-medium whitespace-nowrap ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}">${formatCurrency(t.amount)}</td>
      <td class="py-2 whitespace-nowrap text-slate-600">${formatDate(t.due_date)}</td>
      <td class="py-2 text-slate-600 max-w-[120px] truncate" title="${(t.pix_key || '').replace(/"/g, '&quot;')}">${t.pix_key || '-'}</td>
      <td class="py-2 text-slate-600 max-w-[100px] truncate" title="${(t.barcode || '').replace(/"/g, '&quot;')}">${t.barcode || '-'}</td>
      <td class="py-2 whitespace-nowrap text-slate-600">${formatDate(t.planned_payment_date)}</td>
      <td class="py-2 text-slate-500 max-w-[150px] truncate" title="${(t.notes || '').replace(/"/g, '&quot;')}">${t.notes || '-'}</td>
      <td class="py-2">${t.has_attachment ? `<a href="/api/transactions/${t.id}/attachment" target="_blank" class="text-slate-600 hover:text-slate-800 text-xs">Ver</a>` : '-'}</td>
      <td class="py-2">
        <button data-id="${t.id}" class="edit-btn text-slate-600 hover:text-slate-800 text-xs mr-2">Edit</button>
        <button data-id="${t.id}" class="delete-btn text-rose-500 hover:text-rose-700 text-xs">Delete</button>
      </td>
    </tr>
  `).join('');
  tbody.querySelectorAll('.edit-btn').forEach(btn => {
    const t = transactions.find(x => x.id == btn.dataset.id);
    btn.addEventListener('click', () => window.app.editTransaction(t));
  });
  tbody.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', () => window.app.deleteTransaction(Number(btn.dataset.id)));
  });
  document.getElementById('select-all-transactions').checked = false;
  document.getElementById('select-all-transactions').onchange = (e) => {
    tbody.querySelectorAll('.txn-checkbox').forEach(cb => cb.checked = e.target.checked);
    window.app.toggleBulkDeleteTransactions();
  };
  tbody.querySelectorAll('.txn-checkbox').forEach(cb => {
    cb.onchange = () => window.app.toggleBulkDeleteTransactions();
  });
  window.app.toggleBulkDeleteTransactions();
}
