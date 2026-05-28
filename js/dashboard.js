// ============================================================
// DASHBOARD PAGE
// ============================================================

document.addEventListener('DOMContentLoaded', async function() {
  if (!isConfigured()) return;
  await loadDashboard();
});

async function loadDashboard() {
  await Promise.all([
    loadStats(),
    loadLowStock(),
    loadTopCredits(),
    loadRecentSales()
  ]);
}

async function loadStats() {
  // Total products
  const { count: productCount } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true });
  document.getElementById('totalProducts').textContent = productCount || 0;

  // Low stock items
  const { data: products } = await supabase
    .from('products')
    .select('quantity, low_stock_threshold');
  const lowCount = (products || []).filter(function(p) {
    return p.quantity <= p.low_stock_threshold;
  }).length;
  document.getElementById('lowStockCount').textContent = lowCount;

  // Total unpaid credits
  const { data: credits } = await supabase
    .from('credits')
    .select('amount, paid_amount')
    .eq('is_paid', false);
  const totalUtang = (credits || []).reduce(function(sum, c) {
    return sum + (parseFloat(c.amount) - parseFloat(c.paid_amount || 0));
  }, 0);
  document.getElementById('totalCredits').textContent = formatCurrency(totalUtang);

  // Today's sales
  const today = new Date().toISOString().split('T')[0];
  const { data: sales } = await supabase
    .from('sales')
    .select('total')
    .gte('created_at', today + 'T00:00:00')
    .lte('created_at', today + 'T23:59:59');
  const todayTotal = (sales || []).reduce(function(sum, s) {
    return sum + parseFloat(s.total);
  }, 0);
  document.getElementById('todaySales').textContent = formatCurrency(todayTotal);
}

async function loadLowStock() {
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .order('quantity', { ascending: true })
    .limit(10);

  const lowStock = (products || []).filter(function(p) {
    return p.quantity <= p.low_stock_threshold;
  });

  const tbody = document.getElementById('lowStockTable');
  if (lowStock.length === 0) {
    tbody.innerHTML = '<tr><td colspan="3" class="text-center text-muted py-3"><i class="bi bi-check-circle text-success"></i> All items are well-stocked!</td></tr>';
    return;
  }

  tbody.innerHTML = lowStock.map(function(p) {
    var statusClass = p.quantity === 0 ? 'badge-stock-out' : 'badge-stock-low';
    var statusText = p.quantity === 0 ? 'Out of Stock' : 'Low Stock';
    return '<tr>' +
      '<td class="fw-semibold">' + p.name + '</td>' +
      '<td>' + p.quantity + ' ' + p.unit + '</td>' +
      '<td><span class="' + statusClass + '">' + statusText + '</span></td>' +
      '</tr>';
  }).join('');
}

async function loadTopCredits() {
  const { data: credits } = await supabase
    .from('credits')
    .select('amount, paid_amount, customer_id, customers(name)')
    .eq('is_paid', false);

  // Group by customer
  var customerTotals = {};
  (credits || []).forEach(function(c) {
    var name = c.customers ? c.customers.name : 'Unknown';
    var remaining = parseFloat(c.amount) - parseFloat(c.paid_amount || 0);
    if (!customerTotals[name]) customerTotals[name] = 0;
    customerTotals[name] += remaining;
  });

  var sorted = Object.entries(customerTotals)
    .sort(function(a, b) { return b[1] - a[1]; })
    .slice(0, 10);

  var tbody = document.getElementById('topCreditsTable');
  if (sorted.length === 0) {
    tbody.innerHTML = '<tr><td colspan="3" class="text-center text-muted py-3"><i class="bi bi-check-circle text-success"></i> No outstanding credits!</td></tr>';
    return;
  }

  tbody.innerHTML = sorted.map(function(entry) {
    return '<tr>' +
      '<td class="fw-semibold">' + entry[0] + '</td>' +
      '<td class="text-danger fw-bold">' + formatCurrency(entry[1]) + '</td>' +
      '<td><span class="badge-unpaid">Unpaid</span></td>' +
      '</tr>';
  }).join('');
}

async function loadRecentSales() {
  var { data: sales } = await supabase
    .from('sales')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  var tbody = document.getElementById('recentSalesTable');
  if (!sales || sales.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-3">No sales yet today</td></tr>';
    return;
  }

  tbody.innerHTML = sales.map(function(s) {
    var payBadge = s.payment_type === 'cash' ? 'badge-cash' : 'badge-credit';
    var payLabel = s.payment_type === 'cash' ? 'Cash' : 'Utang';
    return '<tr>' +
      '<td class="fw-semibold">' + s.product_name + '</td>' +
      '<td>' + s.quantity + '</td>' +
      '<td class="text-success fw-bold">' + formatCurrency(s.total) + '</td>' +
      '<td><span class="' + payBadge + '">' + payLabel + '</span></td>' +
      '<td class="text-muted small">' + formatDateTime(s.created_at) + '</td>' +
      '</tr>';
  }).join('');
}
