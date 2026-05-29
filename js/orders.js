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
    showToast('Hindi na-load ang mga order: ' + error.message, 'error');
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
    container.innerHTML = '<div class="order-card"><div style="text-align:center;padding:40px;color:#94a3b8"><i class="bi bi-inbox" style="font-size:2.5rem;display:block;margin-bottom:12px"></i><p style="margin:0;font-size:0.95rem">Walang orders</p></div></div>';
    return;
  }

  container.innerHTML = orders.map(function(order, index) {
    var items = order.items || [];
    var itemsList = items.map(function(item) {
      return '<div class="order-item-row">' +
        '<span class="order-item-name"><span class="order-item-qty">' + item.qty + 'x</span> ' + item.name + '</span>' +
        '<span class="order-item-price">' + formatCurrency(item.subtotal) + '</span>' +
      '</div>';
    }).join('');

    var statusBadge = getStatusBadge(order.status);
    var statusButtons = getStatusButtons(order.id, order.status);
    var orderId = order.id.substring(0, 8).toUpperCase();
    var cardBg = index % 2 === 0 ? '#ffffff' : '#f8fafc';

    return '<div class="order-card" style="background:' + cardBg + '">' +
      '<div class="order-card-top">' +
        '<div class="order-card-id">' +
          '<span class="order-hash">#' + orderId + '</span>' +
          '<span class="order-date">' + formatDateTime(order.created_at) + '</span>' +
        '</div>' +
        statusBadge +
      '</div>' +
      '<div class="order-card-body">' +
        '<div class="order-customer-section">' +
          '<div class="order-customer-name"><i class="bi bi-person-fill"></i> ' + order.customer_name + '</div>' +
          '<div class="order-customer-detail"><i class="bi bi-telephone-fill"></i> ' + order.phone + '</div>' +
          (order.pickup_time ? '<div class="order-customer-detail"><i class="bi bi-clock-fill"></i> Pickup: ' + order.pickup_time + '</div>' : '') +
          (order.notes ? '<div class="order-customer-detail"><i class="bi bi-chat-left-text-fill"></i> ' + order.notes + '</div>' : '') +
        '</div>' +
        '<div class="order-items-section">' +
          '<div class="order-items-label">Mga Item:</div>' +
          itemsList +
          '<div class="order-total-row">' +
            '<span>Kabuuan</span><span class="order-total-amount">' + formatCurrency(order.total) + '</span>' +
          '</div>' +
        '</div>' +
        '<div class="order-actions-section">' +
          statusButtons +
        '</div>' +
      '</div>' +
    '</div>';
  }).join('');
}

function getStatusBadge(status) {
  var badges = {
    'pending': '<span class="badge-stock-low"><i class="bi bi-clock"></i> Naghihintay</span>',
    'preparing': '<span style="background:#dbeafe;color:#2563eb;font-weight:600;padding:4px 10px;border-radius:20px;font-size:0.75rem"><i class="bi bi-gear"></i> Inihahanda</span>',
    'ready': '<span style="background:#d1fae5;color:#059669;font-weight:600;padding:4px 10px;border-radius:20px;font-size:0.75rem"><i class="bi bi-check-circle"></i> Handa na</span>',
    'completed': '<span class="badge-paid"><i class="bi bi-check-circle-fill"></i> Tapos na</span>',
    'cancelled': '<span class="badge-stock-out"><i class="bi bi-x-circle"></i> Kinansela</span>'
  };
  return badges[status] || '<span class="badge bg-secondary">' + status + '</span>';
}

function getStatusButtons(orderId, currentStatus) {
  if (currentStatus === 'completed' || currentStatus === 'cancelled') return '';

  var buttons = '';

  if (currentStatus === 'pending') {
    buttons += '<button class="btn order-btn order-btn-prepare" onclick="updateOrderStatus(\'' + orderId + '\', \'preparing\')"><i class="bi bi-gear"></i> Inihahanda</button>';
  }
  if (currentStatus === 'pending' || currentStatus === 'preparing') {
    buttons += '<button class="btn order-btn order-btn-ready" onclick="updateOrderStatus(\'' + orderId + '\', \'ready\')"><i class="bi bi-check-circle"></i> Handa na</button>';
  }
  if (currentStatus === 'ready') {
    buttons += '<button class="btn order-btn order-btn-ready" onclick="updateOrderStatus(\'' + orderId + '\', \'completed\')"><i class="bi bi-check-circle-fill"></i> Tapos na</button>';
  }

  buttons += '<button class="btn order-btn order-btn-cancel" onclick="updateOrderStatus(\'' + orderId + '\', \'cancelled\')"><i class="bi bi-x-circle"></i> Kanselahin</button>';

  return buttons;
}

async function updateOrderStatus(orderId, newStatus) {
  var statusLabels = {
    'preparing': 'Inihahanda',
    'ready': 'Handa na para sa Pickup',
    'completed': 'Tapos na',
    'cancelled': 'Kinansela'
  };

  if (!confirm('Palitan ang status ng order sa "' + statusLabels[newStatus] + '"?')) return;

  var { error } = await supabase
    .from('orders')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', orderId);

  if (error) {
    showToast('Error: ' + error.message, 'error');
    return;
  }

  // When order is completed, record as sales and deduct inventory
  if (newStatus === 'completed') {
    await recordOrderAsSale(orderId);
  }

  showToast('Na-update ang status ng order: ' + statusLabels[newStatus] + '!');
  await loadOrders();
}

async function recordOrderAsSale(orderId) {
  // Get the order details
  var { data: order, error: fetchError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (fetchError || !order) return;

  var items = order.items || [];

  // Insert each item as a sale record
  var salesData = items.map(function(item) {
    return {
      product_id: item.product_id,
      product_name: item.name,
      quantity: item.qty,
      unit_price: item.price,
      total: item.subtotal,
      payment_type: 'cash',
      customer_id: null
    };
  });

  if (salesData.length > 0) {
    await supabase.from('sales').insert(salesData);
  }

  // Deduct inventory for each item
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    var { data: product } = await supabase
      .from('products')
      .select('quantity')
      .eq('id', item.product_id)
      .single();

    if (product) {
      var newQty = Math.max(0, product.quantity - item.qty);
      await supabase.from('products')
        .update({ quantity: newQty, updated_at: new Date().toISOString() })
        .eq('id', item.product_id);
    }
  }
}
