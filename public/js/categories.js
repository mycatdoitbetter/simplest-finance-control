function renderCategories(categories) {
  const tbody = document.getElementById('categories-body');
  tbody.innerHTML = categories.map(c => `
    <tr class="border-b border-slate-100 hover:bg-slate-50">
      <td class="py-2"><input type="checkbox" class="cat-checkbox rounded" value="${c.id}"></td>
      <td class="py-2">${c.name}</td>
      <td class="py-2"><span class="px-2 py-0.5 rounded text-xs ${c.type === 'income' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}">${c.type}</span></td>
      <td class="py-2">
        <button data-id="${c.id}" class="edit-cat text-slate-600 hover:text-slate-800 text-xs mr-2">Edit</button>
        <button data-id="${c.id}" class="delete-cat text-rose-500 hover:text-rose-700 text-xs">Delete</button>
      </td>
    </tr>
  `).join('');
  tbody.querySelectorAll('.edit-cat').forEach(btn => {
    const cat = categories.find(c => c.id == btn.dataset.id);
    btn.addEventListener('click', () => window.app.editCategory(cat.id, cat.name, cat.type));
  });
  tbody.querySelectorAll('.delete-cat').forEach(btn => {
    btn.addEventListener('click', () => window.app.deleteCategory(Number(btn.dataset.id)));
  });
  document.getElementById('select-all-categories').checked = false;
  document.getElementById('select-all-categories').onchange = (e) => {
    tbody.querySelectorAll('.cat-checkbox').forEach(cb => cb.checked = e.target.checked);
    window.app.toggleBulkDeleteCategories();
  };
  tbody.querySelectorAll('.cat-checkbox').forEach(cb => {
    cb.onchange = () => window.app.toggleBulkDeleteCategories();
  });
  window.app.toggleBulkDeleteCategories();
}
