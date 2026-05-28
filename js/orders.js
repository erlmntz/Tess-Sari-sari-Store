// ============================================================
// PICKUP ORDERS PAGE (Admin)
// ============================================================

document.addEventListener('DOMContentLoaded', async function() {
  if (!isConfigured()) return;
  await loadOrders();
});

async function loadOrders() {
  var statusFilter = document.getElementById('filterOrderStatus').value;

  var query = supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (statusFilter) {
    query = query.eq('status', statusFilter);
  }

  var { data, error } = await query;

  if (error) {
    showToast('Error loading orders: ' + error.message, 'error');
    return;
  }

  var orders = data || [];
  renderOrders(orders);
  updateOrderStats(orders);
}

function updateOrderStats(orders) {
  // Load all orders for stats
  supabase.from('orders').select('status').then(function(res) {
    var all = res.data || [];
    var pending = all.filter(function(o) { return o.status === 'pending' || o.status === 'preparing' || o.status === 'ready'; }).length;
    var completed = all.filter(function(o) { return o.status === 'completed'; }).length;
    document.getElementById('pendingCount').textContent = pending;
    document.getElementById('completedCount').textContent = completed;
  });
}

function renderOrders(orders) {
  var container = document.getElementById('ordersList');

  if (orders.length === 0) {
    container.innerHTML = '<div class="card seven-card"><div class="card-body text-center text-muted py-4"><i class="bi bi-inbox" style="font-size:2rem;display:block;margin-bottom:8px"></i>Walang orders</div></div>';
    return;
  }

  container.innerHTML = orders.map(function(order) {
    var items = order.items || [];
    var itemsList = items.map(function(item) {
      return '<div style="display:flex;justify-content:space-between;font-size:0.85rem;padding:2px 0">' +
        '<span>' + item.qty + 'x ' + item.name + '</span>' +
        '<span>' + formatCurrency(item.subtotal) + '</span>' +
      '</div>';
    }).join('');

    var statusBadge = getStatusBadge(order.status);
    var statusButtons = getStatusButtons(order.id, order.status);
    var orderId = order.id.substring(0, 8).toUpperCase();

    return '<div class="card seven-card mb-3">' +
      '<div class="card-body">' +
        '<div class="d-flex justify-content-between align-items-start mb-2">' +
          '<div>' +
            '<h6 class="fw-bold mb-1">Order #' + orderId + '</h6>' +
            '<small class="text-muted">' + formatDateTime(order.created_at) + '</small>' +
          '</div>' +
          '<div class="text-end">' +
            statusBadge +
          '</div>' +
        '</div>' +
        '<div class="row g-3">' +
          '<div class="col-md-4">' +
            '<div class="mb-2"><strong><i class="bi bi-person-fill"></i> ' + order.customer_name + '</strong></div>' +
            '<div class="text-muted small"><i class="bi bi-telephone-fill"></i> ' + order.phone + '</div>' +
            (order.pickup_time ? '<div class="text-muted small mt-1"><i class="bi bi-clock-fill"></i> Pickup: ' + order.pickup_time + '</div>' : '') +
            (order.notes ? '<div class="text-muted small mt-1"><i class="bi bi-chat-left-text-fill"></i> ' + order.notes + '</div>' : '') +
          '</div>' +
          '<div class="col-md-5">' +
            '<div class="small fw-semibold mb-1">Items:</div>' +
            itemsList +
            '<div style="border-top:1px dashed #ddd;margin-top:6px;padding-top:6px;font-weight:700;display:flex;justify-content:space-between">' +
              '<span>Total</span><span class="text-success">' + formatCurrency(order.total) + '</span>' +
            '</div>' +
          '</div>' +
          '<div class="col-md-3 text-end">' +
            statusButtons +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';
  }).join('');
}

function getStatusBadge(status) {
  var badges = {
    'pending': '<span class="badge-stock-low"><i class="bi bi-clock"></i> Pending</span>',
    'preparing': '<span style="background:#dbeafe;color:#2563eb;font-weight:600;padding:4px 10px;border-radius:20px;font-size:0.75rem"><i class="bi bi-gear"></i> Preparing</span>',
    'ready': '<span style="background:#d1fae5;color:#059669;font-weight:600;padding:4px 10px;border-radius:20px;font-size:0.75rem"><i class="bi bi-check-circle"></i> Ready</span>',
    'completed': '<span class="badge-paid"><i class="bi bi-check-circle-fill"></i> Completed</span>',
    'cancelled': '<span class="badge-stock-out"><i class="bi bi-x-circle"></i> Cancelled</span>'
  };
  return badges[status] || '<span class="badge bg-secondary">' + status + '</span>';
}

function getStatusButtons(orderId, currentStatus) {
  if (currentStatus === 'completed' || currentStatus === 'cancelled') return '';

  var buttons = '';

  if (currentStatus === 'pending') {
    buttons += '<button class="btn btn-seven-orange btn-sm mb-1 w-100" onclick="updateOrderStatus(\'' + orderId + '\', \'preparing\')"><i class="bi bi-gear"></i> Preparing</button>';
  }
  if (currentStatus === 'pending' || currentStatus === 'preparing') {
    buttons += '<button class="btn btn-seven-green btn-sm mb-1 w-100" onclick="updateOrderStatus(\'' + orderId + '\', \'ready\')"><i class="bi bi-check-circle"></i> Ready</button>';
  }
  if (currentStatus === 'ready') {
    buttons += '<button class="btn btn-seven-green btn-sm mb-1 w-100" onclick="updateOrderStatus(\'' + orderId + '\', \'completed\')"><i class="bi bi-check-circle-fill"></i> Completed</button>';
  }

  buttons += '<button class="btn btn-seven-red btn-sm w-100" onclick="updateOrderStatus(\'' + orderId + '\', \'cancelled\')"><i class="bi bi-x-circle"></i> Cancel</button>';

  return buttons;
}

async function updateOrderStatus(orderId, newStatus) {
  var statusLabels = {
    'preparing': 'Preparing',
    'ready': 'Ready for Pickup',
    'completed': 'Completed',
    'cancelled': 'Cancelled'
  };

  if (!confirm('Change order status to "' + statusLabels[newStatus] + '"?')) return;

  var { error } = await supabase
    .from('orders')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', orderId);

  if (error) {
    showToast('Error: ' + error.message, 'error');
    return;
  }

  showToast('Order status updated to ' + statusLabels[newStatus] + '!');
  await loadOrders();
}
