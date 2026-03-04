function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

function renderTable(transactions) {
  const tbody = document.getElementById('table-body');
  tbody.innerHTML = transactions.map(t => `
    <tr class="border-b border-slate-100 hover:bg-slate-50">
      <td class="py-2">${t.date}</td>
      <td class="py-2"><span class="px-2 py-0.5 rounded text-xs ${t.type === 'income' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}">${t.type}</span></td>
      <td class="py-2">${t.category_name}</td>
      <td class="py-2 text-right font-medium ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}">${formatCurrency(t.amount)}</td>
      <td class="py-2 text-slate-500">${t.notes || '-'}</td>
      <td class="py-2"><button data-id="${t.id}" class="delete-btn text-rose-500 hover:text-rose-700 text-xs">Delete</button></td>
    </tr>
  `).join('');
  tbody.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', () => window.app.deleteTransaction(Number(btn.dataset.id)));
  });
}
