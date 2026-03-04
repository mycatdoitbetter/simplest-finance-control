let chartExpenses = null;

function renderChart(byCategory) {
  const expenseData = byCategory.filter(c => c.type === 'expense');
  const ctx = document.getElementById('chart-expenses').getContext('2d');
  if (chartExpenses) chartExpenses.destroy();
  chartExpenses = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: expenseData.map(c => c.name),
      datasets: [{
        data: expenseData.map(c => c.total),
        backgroundColor: [
          '#f43f5e', '#fb923c', '#eab308', '#22c55e', '#3b82f6',
          '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316'
        ]
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom' }
      }
    }
  });
}
