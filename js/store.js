// ============================================================
// CUSTOMER STOREFRONT - Browse, Cart, Pickup Order
// ============================================================

var storeProducts = [];
var storeCart = [];
var selectedCategory = '';
var customerInfo = null;
var pendingProductId = null;

document.addEventListener('DOMContentLoaded', async function() {
  loadCustomerFromStorage();
  await loadStoreProducts();
});

// ---- Customer Verification ----

function loadCustomerFromStorage() {
  var saved = localStorage.getItem('storeCustomerInfo');
  if (saved) {
    customerInfo = JSON.parse(saved);
    showCustomerBar();
  }
}

function showCustomerBar() {
  if (!customerInfo) return;
  document.getElementById('customerDisplayName').textContent = customerInfo.name;
  document.getElementById('customerDisplayPhone').textContent = customerInfo.phone;
  document.getElementById('customerInfoBar').style.display = 'block';
}

function requireCustomerInfo(productId) {
  pendingProductId = productId;
  var saved = localStorage.getItem('storeCustomerInfo');
  if (saved) {
    var info = JSON.parse(saved);
    document.getElementById('verifyName').value = info.name;
    document.getElementById('verifyPhone').value = info.phone;
  }
  var modal = new bootstrap.Modal(document.getElementById('customerVerifyModal'));
  modal.show();
}

function saveCustomerInfo() {
  var name = document.getElementById('verifyName').value.trim();
  var phone = document.getElementById('verifyPhone').value.trim();

  if (!name) {
    showStoreToast('Pakilagay ang pangalan mo!');
    return;
  }
  if (!phone) {
    showStoreToast('Pakilagay ang phone number mo!');
    return;
  }

  customerInfo = { name: name, phone: phone };
  localStorage.setItem('storeCustomerInfo', JSON.stringify(customerInfo));
  showCustomerBar();

  bootstrap.Modal.getInstance(document.getElementById('customerVerifyModal')).hide();
  showStoreToast('Salamat, ' + name + '!');

  if (pendingProductId) {
    var pid = pendingProductId;
    pendingProductId = null;
    addToStoreCart(pid);
  }
}

function clearCustomerInfo() {
  customerInfo = null;
  localStorage.removeItem('storeCustomerInfo');
  document.getElementById('customerInfoBar').style.display = 'none';
  storeCart = [];
  updateCartUI();
  showStoreToast('Na-logout ka na.');
}

// ---- Load Products ----

async function loadStoreProducts() {
  var { data, error } = await supabase
    .from('products')
    .select('*')
    .gt('quantity', -1)
    .order('category', { ascending: true })
    .order('name', { ascending: true });

  if (error) {
    showStoreToast('May error sa pag-load ng produkto');
    return;
  }

  storeProducts = data || [];
  buildCategoryPills();
  renderStoreGrid(storeProducts);
}

// ---- Categories ----

function buildCategoryPills() {
  var categories = [...new Set(storeProducts.map(function(p) { return p.category; }))].sort();
  var container = document.getElementById('categoryPills');
  container.innerHTML = '<button class="cat-pill active" onclick="selectCategory(this, \'\')">Lahat</button>';

  var categoryLabels = {
    'Noodles': 'Noodles',
    'Canned Goods': 'De Lata',
    'Beverages': 'Inumin',
    'Coffee & Drinks': 'Kape',
    'Snacks': 'Meryenda',
    'Household': 'Gamit Bahay',
    'Cigarettes': 'Sigarilyo',
    'Condiments': 'Sangkap',
    'Rice & Essentials': 'Bigas',
    'Bread & Pastries': 'Tinapay',
    'Frozen': 'Frozen',
    'General': 'Iba Pa'
  };

  categories.forEach(function(cat) {
    var label = categoryLabels[cat] || cat;
    container.innerHTML += '<button class="cat-pill" onclick="selectCategory(this, \'' + cat + '\')">' + label + '</button>';
  });
}

function selectCategory(btn, category) {
  document.querySelectorAll('.cat-pill').forEach(function(p) { p.classList.remove('active'); });
  btn.classList.add('active');
  selectedCategory = category;
  filterStoreProducts();
}

function filterStoreProducts() {
  var search = document.getElementById('searchInput').value.toLowerCase();
  var filtered = storeProducts.filter(function(p) {
    var matchSearch = p.name.toLowerCase().includes(search) || p.category.toLowerCase().includes(search);
    var matchCategory = !selectedCategory || p.category === selectedCategory;
    return matchSearch && matchCategory;
  });
  renderStoreGrid(filtered);
}

// ---- Product Grid ----

function getCategoryIcon(category) {
  var icons = {
    'Noodles': 'bi-cup-hot-fill',
    'Canned Goods': 'bi-archive-fill',
    'Beverages': 'bi-cup-straw',
    'Coffee & Drinks': 'bi-cup-fill',
    'Snacks': 'bi-cookie',
    'Household': 'bi-house-heart-fill',
    'Cigarettes': 'bi-wind',
    'Condiments': 'bi-droplet-fill',
    'Rice & Essentials': 'bi-basket3-fill',
    'Bread & Pastries': 'bi-egg-fried',
    'Frozen': 'bi-snow',
    'General': 'bi-bag-fill',
    'School Supplies': 'bi-pencil-fill',
    'Personal Care': 'bi-heart-pulse-fill',
    'Sweets': 'bi-stars'
  };
  return icons[category] || 'bi-bag-fill';
}

function getCategoryClass(category) {
  var classes = {
    'Noodles': 'cat-noodles',
    'Canned Goods': 'cat-canned',
    'Beverages': 'cat-beverages',
    'Coffee & Drinks': 'cat-coffee',
    'Snacks': 'cat-snacks',
    'Household': 'cat-household',
    'Cigarettes': 'cat-cigarettes',
    'Condiments': 'cat-condiments',
    'Rice & Essentials': 'cat-rice'
  };
  return classes[category] || 'cat-default';
}

function renderStoreGrid(products) {
  var grid = document.getElementById('storeGrid');

  if (products.length === 0) {
    grid.innerHTML = '<div class="store-empty"><i class="bi bi-search"></i><p>Walang nakitang produkto</p></div>';
    return;
  }

  // Group by category
  var grouped = {};
  products.forEach(function(p) {
    if (!grouped[p.category]) grouped[p.category] = [];
    grouped[p.category].push(p);
  });

  var categoryLabels = {
    'Noodles': 'Noodles', 'Canned Goods': 'De Lata', 'Beverages': 'Inumin',
    'Coffee & Drinks': 'Kape', 'Snacks': 'Meryenda', 'Household': 'Gamit Bahay',
    'Cigarettes': 'Sigarilyo', 'Condiments': 'Sangkap', 'Rice & Essentials': 'Bigas',
    'Bread & Pastries': 'Tinapay', 'Frozen': 'Frozen', 'General': 'Iba Pa',
    'School Supplies': 'Gamit Pang-Eskwela', 'Personal Care': 'Pangangalaga',
    'Sweets': 'Matamis'
  };

  var categoryIcons = {
    'Noodles': 'bi-cup-hot-fill', 'Canned Goods': 'bi-archive-fill', 'Beverages': 'bi-cup-straw',
    'Coffee & Drinks': 'bi-cup-fill', 'Snacks': 'bi-cookie', 'Household': 'bi-house-heart-fill',
    'Cigarettes': 'bi-wind', 'Condiments': 'bi-droplet-fill', 'Rice & Essentials': 'bi-basket3-fill',
    'Bread & Pastries': 'bi-egg-fried', 'Frozen': 'bi-snow', 'General': 'bi-bag-fill',
    'School Supplies': 'bi-pencil-fill', 'Personal Care': 'bi-heart-pulse-fill',
    'Sweets': 'bi-stars'
  };

  var categories = Object.keys(grouped).sort();
  var html = '';

  categories.forEach(function(cat) {
    var label = categoryLabels[cat] || cat;
    var icon = categoryIcons[cat] || 'bi-bag-fill';
    html += '<div class="category-section">' +
      '<h3 class="category-title"><i class="bi ' + icon + '"></i> ' + label + ' <span class="category-count">' + grouped[cat].length + '</span></h3>' +
      '<div class="product-grid">';

    grouped[cat].forEach(function(p) {
      html += renderProductCard(p);
    });

    html += '</div></div>';
  });

  grid.innerHTML = html;
}

function renderProductCard(p) {
    var isOut = p.quantity <= 0;
    var isLow = p.quantity > 0 && p.quantity <= p.low_stock_threshold;
    var outClass = isOut ? ' out-of-stock' : '';
    var stockText = isOut ? '' : (isLow ? 'Konti na lang!' : p.quantity + ' ' + p.unit + ' available');
    var stockClass = isLow ? ' low' : '';
    var outTag = isOut ? '<div class="out-of-stock-tag">Ubos Na!</div>' : '';

    var imgContent = p.image_url
      ? '<img src="' + p.image_url + '" alt="' + p.name + '" loading="lazy" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'block\'">' +
        '<i class="bi ' + getCategoryIcon(p.category) + ' fallback-icon" style="display:none"></i>'
      : '<i class="bi ' + getCategoryIcon(p.category) + ' fallback-icon"></i>';

    return '<div class="product-card' + outClass + '" id="card-' + p.id + '">' +
      '<div class="product-img ' + getCategoryClass(p.category) + '">' +
        imgContent +
        '<span class="product-category-tag">' + p.category + '</span>' +
        outTag +
      '</div>' +
      '<div class="product-info">' +
        '<div class="product-name">' + p.name + '</div>' +
        '<div class="product-unit">per ' + p.unit + '</div>' +
        '<div class="product-bottom">' +
          '<span class="product-price">' + formatPeso(p.price) + '</span>' +
          (isOut ? '' : '<button class="add-cart-btn" onclick="addToStoreCart(\'' + p.id + '\')" title="Idagdag sa cart"><i class="bi bi-plus"></i></button>') +
        '</div>' +
        '<div class="stock-info' + stockClass + '">' + stockText + '</div>' +
      '</div>' +
    '</div>';
}

// ---- Cart ----

function addToStoreCart(productId) {
  if (!customerInfo) {
    requireCustomerInfo(productId);
    return;
  }

  var product = storeProducts.find(function(p) { return p.id === productId; });
  if (!product || product.quantity <= 0) return;

  var existing = storeCart.find(function(item) { return item.id === productId; });
  if (existing) {
    if (existing.qty >= product.quantity) {
      showStoreToast('Pasensya, ' + product.quantity + ' na lang ang stock!');
      return;
    }
    existing.qty++;
    existing.subtotal = existing.qty * existing.price;
  } else {
    storeCart.push({
      id: productId,
      name: product.name,
      price: parseFloat(product.price),
      qty: 1,
      subtotal: parseFloat(product.price),
      maxQty: product.quantity,
      unit: product.unit,
      category: product.category
    });
  }

  // Bounce animation
  var card = document.getElementById('card-' + productId);
  if (card) {
    card.classList.add('adding');
    setTimeout(function() { card.classList.remove('adding'); }, 300);
  }

  updateCartUI();
  showStoreToast(product.name + ' naidagdag sa cart!');
}

function updateCartQtyStore(productId, delta) {
  var item = storeCart.find(function(i) { return i.id === productId; });
  if (!item) return;

  var newQty = item.qty + delta;
  if (newQty <= 0) {
    storeCart = storeCart.filter(function(i) { return i.id !== productId; });
  } else if (newQty > item.maxQty) {
    showStoreToast('Pasensya, ' + item.maxQty + ' na lang ang stock!');
    return;
  } else {
    item.qty = newQty;
    item.subtotal = item.qty * item.price;
  }

  updateCartUI();
}

function removeFromStoreCart(productId) {
  storeCart = storeCart.filter(function(i) { return i.id !== productId; });
  updateCartUI();
}

function updateCartUI() {
  var totalItems = storeCart.reduce(function(sum, i) { return sum + i.qty; }, 0);
  var totalAmount = storeCart.reduce(function(sum, i) { return sum + i.subtotal; }, 0);

  // Badge
  document.getElementById('cartBadge').textContent = totalItems;

  // Floating cart
  var floating = document.getElementById('floatingCart');
  var floatingBadge = document.getElementById('floatingBadge');
  var floatingTotal = document.getElementById('floatingTotal');
  if (totalItems > 0) {
    floating.style.display = 'flex';
    floatingBadge.textContent = totalItems;
    floatingTotal.textContent = formatPeso(totalAmount);
  } else {
    floating.style.display = 'none';
  }

  // Cart body
  var body = document.getElementById('cartBody');
  var footer = document.getElementById('cartFooter');

  if (storeCart.length === 0) {
    body.innerHTML = '<div class="cart-empty"><i class="bi bi-cart-x"></i><p>Wala pang laman ang cart mo!</p><small>Pumili ng mga produkto sa tindahan</small></div>';
    footer.style.display = 'none';
    return;
  }

  footer.style.display = 'block';
  document.getElementById('cartTotalAmount').textContent = formatPeso(totalAmount);

  body.innerHTML = storeCart.map(function(item) {
    return '<div class="cart-item">' +
      '<div class="cart-item-icon ' + getCategoryClass(item.category) + '">' +
        '<i class="bi ' + getCategoryIcon(item.category) + '"></i>' +
      '</div>' +
      '<div class="cart-item-details">' +
        '<div class="cart-item-name">' + item.name + '</div>' +
        '<div class="cart-item-price">' + formatPeso(item.price) + ' / ' + item.unit + '</div>' +
      '</div>' +
      '<div class="cart-item-controls">' +
        '<button class="qty-btn" onclick="updateCartQtyStore(\'' + item.id + '\', -1)">-</button>' +
        '<span class="qty-count">' + item.qty + '</span>' +
        '<button class="qty-btn" onclick="updateCartQtyStore(\'' + item.id + '\', 1)">+</button>' +
      '</div>' +
      '<div class="cart-item-total">' + formatPeso(item.subtotal) + '</div>' +
      '<i class="bi bi-x-circle-fill cart-item-remove" onclick="removeFromStoreCart(\'' + item.id + '\')"></i>' +
    '</div>';
  }).join('');
}

// ---- Cart Sidebar Toggle ----

function toggleCart() {
  document.getElementById('cartSidebar').classList.toggle('active');
  document.getElementById('cartOverlay').classList.toggle('active');
}

// ---- Checkout ----

function openCheckout() {
  if (storeCart.length === 0) return;

  // Close cart sidebar
  toggleCart();

  // Auto-fill customer info from verification
  if (customerInfo) {
    document.getElementById('checkoutName').value = customerInfo.name;
    document.getElementById('checkoutPhone').value = customerInfo.phone;
  }

  // Build order summary
  var summary = document.getElementById('orderSummary');
  var totalAmount = storeCart.reduce(function(sum, i) { return sum + i.subtotal; }, 0);

  summary.innerHTML = storeCart.map(function(item) {
    return '<div class="order-summary-item">' +
      '<span>' + item.qty + 'x ' + item.name + '</span>' +
      '<span>' + formatPeso(item.subtotal) + '</span>' +
    '</div>';
  }).join('') +
  '<div class="order-summary-total">' +
    '<span>Kabuuan:</span>' +
    '<span class="total-amount">' + formatPeso(totalAmount) + '</span>' +
  '</div>';

  var modal = new bootstrap.Modal(document.getElementById('checkoutModal'));
  modal.show();
}

async function placeOrder() {
  var name = document.getElementById('checkoutName').value.trim();
  var phone = document.getElementById('checkoutPhone').value.trim();
  var pickupTime = document.getElementById('checkoutPickup').value;
  var notes = document.getElementById('checkoutNotes').value.trim();

  if (!name) {
    showStoreToast('Pakilagay ang pangalan mo!');
    return;
  }
  if (!phone) {
    showStoreToast('Pakilagay ang phone number mo!');
    return;
  }

  var totalAmount = storeCart.reduce(function(sum, i) { return sum + i.subtotal; }, 0);
  var items = storeCart.map(function(item) {
    return {
      product_id: item.id,
      name: item.name,
      qty: item.qty,
      price: item.price,
      subtotal: item.subtotal
    };
  });

  var orderData = {
    customer_name: name,
    phone: phone,
    items: items,
    total: totalAmount,
    status: 'pending',
    pickup_time: pickupTime,
    notes: notes || null
  };

  var { data, error } = await supabase.from('orders').insert(orderData).select();

  if (error) {
    showStoreToast('May error sa pag-order. Subukan ulit!');
    return;
  }

  // Close checkout modal
  bootstrap.Modal.getInstance(document.getElementById('checkoutModal')).hide();

  // Show success
  var orderId = data && data[0] ? data[0].id.substring(0, 8).toUpperCase() : '';
  document.getElementById('successOrderId').textContent = 'Order #' + orderId;

  setTimeout(function() {
    var successModal = new bootstrap.Modal(document.getElementById('successModal'));
    successModal.show();
  }, 400);
}

function resetAfterOrder() {
  storeCart = [];
  updateCartUI();
  document.getElementById('checkoutForm').reset();
}

// ---- Helpers ----

function formatPeso(amount) {
  return '₱' + parseFloat(amount || 0).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function showStoreToast(message) {
  var container = document.querySelector('.store-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'store-toast-container';
    document.body.appendChild(container);
  }

  var toast = document.createElement('div');
  toast.className = 'store-toast';
  toast.innerHTML = '<i class="bi bi-check-circle-fill" style="color:var(--pinoy-green);font-size:1.1rem"></i><span>' + message + '</span>';
  container.appendChild(toast);

  setTimeout(function() {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(function() { toast.remove(); }, 300);
  }, 2500);
}
