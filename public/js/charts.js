let chartExpenses = null;

function renderChart(byCategory) {
  const expenseData = (byCategory || []).filter(c => c.type === 'expense');
  const ctx = document.getElementById('chart-expenses')?.getContext('2d');
  if (!ctx) return;
  if (chartExpenses) chartExpenses.destroy();
  const labels = expenseData.length ? expenseData.map(c => c.name) : ['Nenhuma'];
  const data = expenseData.length ? expenseData.map(c => c.total) : [1];
  chartExpenses = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: ['#f43f5e', '#fb923c', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316']
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { position: 'bottom' } }
    }
  });
}
