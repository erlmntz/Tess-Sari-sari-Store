// ============================================================
// SALES / POS PAGE
// ============================================================

var saleProducts = [];
var saleCustomers = [];
var cart = [];

document.addEventListener('DOMContentLoaded', async function() {
  setCurrentDate();
  if (!isConfigured()) return;
  await loadSaleData();

  // Toggle customer select for credit payment
  document.querySelectorAll('input[name="paymentType"]').forEach(function(radio) {
    radio.addEventListener('change', function() {
      var creditDiv = document.getElementById('creditCustomerSelect');
      if (this.value === 'credit') {
        creditDiv.classList.remove('d-none');
      } else {
        creditDiv.classList.add('d-none');
      }
    });
  });
});

async function loadSaleData() {
  var [productsRes, customersRes] = await Promise.all([
    supabase.from('products').select('*').order('name', { ascending: true }),
    supabase.from('customers').select('*').order('name', { ascending: true })
  ]);

  saleProducts = productsRes.data || [];
  saleCustomers = customersRes.data || [];

  renderProductGrid(saleProducts);
  loadCustomerSelect();
}

function loadCustomerSelect() {
  var select = document.getElementById('saleCustomer');
  select.innerHTML = '<option value="">Select customer...</option>';
  saleCustomers.forEach(function(c) {
    select.innerHTML += '<option value="' + c.id + '">' + c.name + '</option>';
  });
}

function searchProducts() {
  var query = document.getElementById('searchSaleProduct').value.toLowerCase();
  var filtered = saleProducts.filter(function(p) {
    return p.name.toLowerCase().includes(query) || p.category.toLowerCase().includes(query);
  });
  renderProductGrid(filtered);
}

function renderProductGrid(products) {
  var grid = document.getElementById('productGrid');

  if (products.length === 0) {
    grid.innerHTML = '<div class="empty-state"><i class="bi bi-search"></i><p>No products found</p></div>';
    return;
  }

  grid.innerHTML = products.map(function(p) {
    var outClass = p.quantity <= 0 ? ' out-of-stock' : '';
    var stockText = p.quantity <= 0 ? 'Out of stock' : p.quantity + ' ' + p.unit + ' left';
    return '<div class="product-tile' + outClass + '" onclick="addToCart(\'' + p.id + '\')">' +
      '<div class="product-tile-name">' + p.name + '</div>' +
      '<div class="product-tile-price">' + formatCurrency(p.price) + '</div>' +
      '<div class="product-tile-stock">' + stockText + '</div>' +
    '</div>';
  }).join('');
}

function addToCart(productId) {
  var product = saleProducts.find(function(p) { return p.id === productId; });
  if (!product || product.quantity <= 0) return;

  var existing = cart.find(function(item) { return item.product_id === productId; });
  if (existing) {
    if (existing.quantity >= product.quantity) {
      showToast('Not enough stock for ' + product.name, 'warning');
      return;
    }
    existing.quantity++;
    existing.total = existing.quantity * existing.unit_price;
  } else {
    cart.push({
      product_id: productId,
      product_name: product.name,
      unit_price: parseFloat(product.price),
      quantity: 1,
      total: parseFloat(product.price),
      max_qty: product.quantity
    });
  }

  renderCart();
  showToast(product.name + ' added to cart');
}

function updateCartQty(productId, delta) {
  var item = cart.find(function(i) { return i.product_id === productId; });
  if (!item) return;

  var newQty = item.quantity + delta;
  if (newQty <= 0) {
    removeFromCart(productId);
    return;
  }
  if (newQty > item.max_qty) {
    showToast('Not enough stock', 'warning');
    return;
  }

  item.quantity = newQty;
  item.total = item.quantity * item.unit_price;
  renderCart();
}

function removeFromCart(productId) {
  cart = cart.filter(function(i) { return i.product_id !== productId; });
  renderCart();
}

function renderCart() {
  var container = document.getElementById('cartItems');
  var totalEl = document.getElementById('cartTotal');
  var btn = document.getElementById('completeSaleBtn');

  if (cart.length === 0) {
    container.innerHTML = '<div class="text-center text-muted py-3">No items in cart</div>';
    totalEl.textContent = '₱0.00';
    btn.disabled = true;
    return;
  }

  btn.disabled = false;

  var total = cart.reduce(function(sum, item) { return sum + item.total; }, 0);
  totalEl.textContent = formatCurrency(total);

  container.innerHTML = cart.map(function(item) {
    return '<div class="cart-item">' +
      '<div class="cart-item-info">' +
        '<div class="cart-item-name">' + item.product_name + '</div>' +
        '<div class="cart-item-price">' + formatCurrency(item.unit_price) + ' each</div>' +
      '</div>' +
      '<div class="cart-item-qty">' +
        '<button onclick="updateCartQty(\'' + item.product_id + '\', -1)">-</button>' +
        '<span>' + item.quantity + '</span>' +
        '<button onclick="updateCartQty(\'' + item.product_id + '\', 1)">+</button>' +
      '</div>' +
      '<div class="cart-item-total">' + formatCurrency(item.total) + '</div>' +
      '<i class="bi bi-x-circle cart-item-remove" onclick="removeFromCart(\'' + item.product_id + '\')"></i>' +
    '</div>';
  }).join('');
}

async function completeSale() {
  if (cart.length === 0) return;

  var paymentType = document.querySelector('input[name="paymentType"]:checked').value;
  var customerId = null;

  if (paymentType === 'credit') {
    customerId = document.getElementById('saleCustomer').value;
    if (!customerId) {
      showToast('Please select a customer for credit/utang', 'error');
      return;
    }
  }

  // Insert sale records
  var salesData = cart.map(function(item) {
    return {
      product_id: item.product_id,
      product_name: item.product_name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total: item.total,
      payment_type: paymentType,
      customer_id: customerId
    };
  });

  var { error: salesError } = await supabase.from('sales').insert(salesData);
  if (salesError) {
    showToast('Error recording sale: ' + salesError.message, 'error');
    return;
  }

  // Update product quantities
  for (var i = 0; i < cart.length; i++) {
    var item = cart[i];
    var product = saleProducts.find(function(p) { return p.id === item.product_id; });
    if (product) {
      var newQty = product.quantity - item.quantity;
      await supabase.from('products')
        .update({ quantity: newQty, updated_at: new Date().toISOString() })
        .eq('id', item.product_id);
    }
  }

  // If credit, add to credits table
  if (paymentType === 'credit' && customerId) {
    var totalAmount = cart.reduce(function(sum, item) { return sum + item.total; }, 0);
    var desc = cart.map(function(item) {
      return item.quantity + 'x ' + item.product_name;
    }).join(', ');

    await supabase.from('credits').insert({
      customer_id: customerId,
      amount: totalAmount,
      description: desc,
      credit_date: new Date().toISOString().split('T')[0],
      is_paid: false,
      paid_amount: 0
    });
  }

  showToast('Sale completed! ' + (paymentType === 'credit' ? '(Utang recorded)' : '(Cash)'));
  cart = [];
  renderCart();
  await loadSaleData();
}
