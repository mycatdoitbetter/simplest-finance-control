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
function escAttr(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
const iconCopy = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
const iconEdit = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>';
const iconDelete = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>';

function renderTable(transactions) {
  const tbody = document.getElementById('table-body');
  tbody.innerHTML = transactions.map(t => `
    <tr class="border-b border-slate-100 hover:bg-slate-50">
      <td class="py-2"><input type="checkbox" class="txn-checkbox rounded" value="${t.id}"></td>
      <td class="py-2 whitespace-nowrap">${formatDate(t.date)}</td>
      <td class="py-2"><span class="px-2 py-0.5 rounded text-xs ${t.type === 'income' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}">${t.type}</span></td>
      <td class="py-2">${t.category_name}</td>
      <td class="py-2 font-medium whitespace-nowrap ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}">
        <span class="inline-flex items-center gap-1"><span>${formatCurrency(t.amount)}</span><button type="button" class="copy-btn p-0.5 rounded hover:bg-slate-200 text-slate-500 hover:text-slate-700 inline-flex" data-copy="${escAttr(t.amount)}" title="Copiar">${iconCopy}</button></span>
      </td>
      <td class="py-2 whitespace-nowrap text-slate-600">${formatDate(t.due_date)}</td>
      <td class="py-2 text-slate-600 max-w-[120px]">
        <span class="inline-flex items-center gap-1 max-w-full"><span class="truncate" title="${escAttr(t.pix_key)}">${t.pix_key || '-'}</span>${t.pix_key ? `<button type="button" class="copy-btn flex-shrink-0 p-0.5 rounded hover:bg-slate-200 text-slate-500 hover:text-slate-700 inline-flex" data-copy="${escAttr(t.pix_key)}" title="Copiar">${iconCopy}</button>` : ''}</span>
      </td>
      <td class="py-2 text-slate-600 max-w-[100px]">
        <span class="inline-flex items-center gap-1 max-w-full"><span class="truncate" title="${escAttr(t.barcode)}">${t.barcode || '-'}</span>${t.barcode ? `<button type="button" class="copy-btn flex-shrink-0 p-0.5 rounded hover:bg-slate-200 text-slate-500 hover:text-slate-700 inline-flex" data-copy="${escAttr(t.barcode)}" title="Copiar">${iconCopy}</button>` : ''}</span>
      </td>
      <td class="py-2 whitespace-nowrap text-slate-600">${formatDate(t.planned_payment_date)}</td>
      <td class="py-2 text-slate-500 max-w-[150px] truncate" title="${(t.notes || '').replace(/"/g, '&quot;')}">${t.notes || '-'}</td>
      <td class="py-2">${t.has_attachment ? `<a href="/api/transactions/${t.id}/attachment" target="_blank" class="text-slate-600 hover:text-slate-800 text-xs">Ver</a>` : '-'}</td>
      <td class="py-2">
        <div class="flex items-center gap-1">
          <button data-id="${t.id}" class="edit-btn p-1 rounded hover:bg-slate-200 text-slate-600 hover:text-slate-800 inline-flex" title="Editar">${iconEdit}</button>
          <button data-id="${t.id}" class="delete-btn p-1 rounded hover:bg-rose-100 text-rose-500 hover:text-rose-700 inline-flex" title="Excluir">${iconDelete}</button>
        </div>
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
  tbody.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const text = btn.dataset.copy;
      if (text) navigator.clipboard.writeText(text).then(() => btn.title = 'Copiado');
    });
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
