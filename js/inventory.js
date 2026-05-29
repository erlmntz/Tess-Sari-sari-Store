// ============================================================
// INVENTORY PAGE
// ============================================================

var allProducts = [];

document.addEventListener('DOMContentLoaded', async function() {
  if (!isConfigured()) return;
  await loadProducts();
  loadCategories();
});

async function loadProducts() {
  var { data, error } = await supabase
    .from('products')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    showToast('Error loading products: ' + error.message, 'error');
    return;
  }

  allProducts = data || [];
  renderProducts(allProducts);
}

function loadCategories() {
  var categories = [...new Set(allProducts.map(function(p) { return p.category; }))].sort();
  var select = document.getElementById('filterCategory');
  select.innerHTML = '<option value="">Lahat ng Kategorya</option>';
  categories.forEach(function(cat) {
    select.innerHTML += '<option value="' + cat + '">' + cat + '</option>';
  });
}

function filterProducts() {
  var search = document.getElementById('searchProduct').value.toLowerCase();
  var category = document.getElementById('filterCategory').value;
  var stock = document.getElementById('filterStock').value;

  var filtered = allProducts.filter(function(p) {
    var matchSearch = p.name.toLowerCase().includes(search);
    var matchCategory = !category || p.category === category;
    var matchStock = true;
    if (stock === 'low') matchStock = p.quantity > 0 && p.quantity <= p.low_stock_threshold;
    else if (stock === 'out') matchStock = p.quantity === 0;
    else if (stock === 'ok') matchStock = p.quantity > p.low_stock_threshold;
    return matchSearch && matchCategory && matchStock;
  });

  renderProducts(filtered);
}

function renderProducts(products) {
  var tbody = document.getElementById('productsTable');

  if (products.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" class="empty-state"><i class="bi bi-box-seam"></i><p>Walang produkto na nahanap</p></td></tr>';
    return;
  }

  // Group by category and sort
  var grouped = {};
  products.forEach(function(p) {
    if (!grouped[p.category]) grouped[p.category] = [];
    grouped[p.category].push(p);
  });

  var categories = Object.keys(grouped).sort();
  var html = '';

  categories.forEach(function(cat) {
    var catProducts = grouped[cat];
    var count = catProducts.length;
    html += '<tr class="category-header-row"><td colspan="9"><i class="bi bi-tag-fill"></i> ' + cat + ' <span class="badge bg-secondary ms-2">' + count + '</span></td></tr>';

    catProducts.forEach(function(p) {
      var statusClass, statusText;
      if (p.quantity === 0) {
        statusClass = 'badge-stock-out';
        statusText = 'Ubos na';
      } else if (p.quantity <= p.low_stock_threshold) {
        statusClass = 'badge-stock-low';
        statusText = 'Mababang Stock';
      } else {
        statusClass = 'badge-stock-ok';
        statusText = 'May Stock';
      }

      var imgCell = p.image_url
        ? '<img src="' + p.image_url + '" alt="' + escapeHtml(p.name) + '" style="width:40px;height:40px;object-fit:contain;border-radius:6px;background:#fff;border:1px solid #e2e8f0" onerror="this.style.display=\'none\';">'
        : '<i class="bi bi-image text-muted"></i>';

      html += '<tr>' +
        '<td class="text-center">' + imgCell + '</td>' +
        '<td class="fw-semibold">' + p.name + '</td>' +
        '<td>' + p.category + '</td>' +
        '<td>' + formatCurrency(p.price) + '</td>' +
        '<td class="text-muted">' + formatCurrency(p.cost) + '</td>' +
        '<td class="fw-bold">' + p.quantity + '</td>' +
        '<td>' + p.unit + '</td>' +
        '<td><span class="' + statusClass + '">' + statusText + '</span></td>' +
        '<td class="text-center">' +
          '<button class="action-btn action-btn-restock" title="Dagdagan" onclick="openRestock(\'' + p.id + '\', \'' + escapeHtml(p.name) + '\', ' + p.quantity + ')"><i class="bi bi-plus-lg"></i></button>' +
          '<button class="action-btn action-btn-edit" title="I-edit" onclick="openEditProduct(\'' + p.id + '\')"><i class="bi bi-pencil"></i></button>' +
          '<button class="action-btn action-btn-delete" title="I-delete" onclick="deleteProduct(\'' + p.id + '\', \'' + escapeHtml(p.name) + '\')"><i class="bi bi-trash"></i></button>' +
        '</td>' +
        '</tr>';
    });
  });

  tbody.innerHTML = html;
}

var pendingImageFile = null;

function switchImageTab(tab) {
  var uploadTab = document.getElementById('uploadTab');
  var urlTab = document.getElementById('urlTab');
  var btnUpload = document.getElementById('btnUploadTab');
  var btnUrl = document.getElementById('btnUrlTab');
  if (tab === 'upload') {
    uploadTab.style.display = 'block';
    urlTab.style.display = 'none';
    btnUpload.className = 'btn btn-sm btn-outline-primary active';
    btnUrl.className = 'btn btn-sm btn-outline-secondary';
  } else {
    uploadTab.style.display = 'none';
    urlTab.style.display = 'block';
    btnUpload.className = 'btn btn-sm btn-outline-secondary';
    btnUrl.className = 'btn btn-sm btn-outline-primary active';
  }
}

function previewFileImage(input) {
  var preview = document.getElementById('imagePreview');
  var img = document.getElementById('imagePreviewImg');
  if (input.files && input.files[0]) {
    pendingImageFile = input.files[0];
    var reader = new FileReader();
    reader.onload = function(e) {
      img.src = e.target.result;
      preview.style.display = 'flex';
    };
    reader.readAsDataURL(input.files[0]);
  }
}

function clearImagePreview() {
  document.getElementById('imagePreview').style.display = 'none';
  document.getElementById('imagePreviewImg').src = '';
  document.getElementById('productImageUrl').value = '';
  document.getElementById('productImageFile').value = '';
  pendingImageFile = null;
}

async function uploadImageToStorage(file) {
  var ext = file.name.split('.').pop().toLowerCase();
  var fileName = Date.now() + '-' + Math.random().toString(36).substring(2, 8) + '.' + ext;

  var { data, error } = await supabase.storage
    .from('product-images')
    .upload(fileName, file, { cacheControl: '3600', upsert: false });

  if (error) {
    throw new Error('Hindi na-upload: ' + error.message);
  }

  var { data: urlData } = supabase.storage
    .from('product-images')
    .getPublicUrl(fileName);

  return urlData.publicUrl;
}

function setupImagePreview() {
  var input = document.getElementById('productImageUrl');
  if (!input) return;
  input.addEventListener('input', function() {
    var url = input.value.trim();
    var preview = document.getElementById('imagePreview');
    var img = document.getElementById('imagePreviewImg');
    if (url) {
      img.src = url;
      img.onload = function() { preview.style.display = 'flex'; };
      img.onerror = function() { preview.style.display = 'none'; };
    } else {
      preview.style.display = 'none';
    }
  });
}

document.addEventListener('DOMContentLoaded', function() {
  setupImagePreview();
});

function escapeHtml(text) {
  var div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML.replace(/'/g, "\\'");
}

function openAddProduct() {
  document.getElementById('productModalTitle').textContent = 'Dagdag Produkto';
  document.getElementById('productForm').reset();
  document.getElementById('productId').value = '';
  document.getElementById('productThreshold').value = 5;
  document.getElementById('productImageUrl').value = '';
  document.getElementById('productImageFile').value = '';
  document.getElementById('imagePreview').style.display = 'none';
  document.getElementById('uploadProgress').style.display = 'none';
  pendingImageFile = null;
  switchImageTab('upload');
}

function openEditProduct(id) {
  var product = allProducts.find(function(p) { return p.id === id; });
  if (!product) return;

  document.getElementById('productModalTitle').textContent = 'I-edit ang Produkto';
  document.getElementById('productId').value = product.id;
  document.getElementById('productName').value = product.name;
  document.getElementById('productCategory').value = product.category;
  document.getElementById('productUnit').value = product.unit;
  document.getElementById('productPrice').value = product.price;
  document.getElementById('productCost').value = product.cost;
  document.getElementById('productQuantity').value = product.quantity;
  document.getElementById('productThreshold').value = product.low_stock_threshold;
  document.getElementById('productImageUrl').value = product.image_url || '';
  document.getElementById('productImageFile').value = '';
  document.getElementById('uploadProgress').style.display = 'none';
  pendingImageFile = null;
  var preview = document.getElementById('imagePreview');
  var img = document.getElementById('imagePreviewImg');
  if (product.image_url) {
    img.src = product.image_url;
    preview.style.display = 'flex';
    switchImageTab('url');
  } else {
    preview.style.display = 'none';
    switchImageTab('upload');
  }

  var modal = new bootstrap.Modal(document.getElementById('productModal'));
  modal.show();
}

async function saveProduct() {
  var id = document.getElementById('productId').value;
  var imageUrl = document.getElementById('productImageUrl').value.trim() || null;

  // Handle file upload if a file was selected
  if (pendingImageFile) {
    try {
      document.getElementById('uploadProgress').style.display = 'block';
      imageUrl = await uploadImageToStorage(pendingImageFile);
      document.getElementById('uploadProgress').style.display = 'none';
    } catch (err) {
      document.getElementById('uploadProgress').style.display = 'none';
      showToast(err.message, 'error');
      return;
    }
  }

  var productData = {
    name: document.getElementById('productName').value.trim(),
    category: document.getElementById('productCategory').value,
    unit: document.getElementById('productUnit').value,
    price: parseFloat(document.getElementById('productPrice').value) || 0,
    cost: parseFloat(document.getElementById('productCost').value) || 0,
    quantity: parseInt(document.getElementById('productQuantity').value) || 0,
    low_stock_threshold: parseInt(document.getElementById('productThreshold').value) || 5,
    image_url: imageUrl,
    updated_at: new Date().toISOString()
  };

  if (!productData.name) {
    showToast('Pakilagay ang pangalan ng produkto', 'error');
    return;
  }

  var result;
  if (id) {
    result = await supabase.from('products').update(productData).eq('id', id);
  } else {
    result = await supabase.from('products').insert(productData);
  }

  if (result.error) {
    showToast('Error: ' + result.error.message, 'error');
    return;
  }

  pendingImageFile = null;
  bootstrap.Modal.getInstance(document.getElementById('productModal')).hide();
  showToast(id ? 'Na-update ang produkto!' : 'Naidagdag ang produkto!');
  await loadProducts();
  loadCategories();
}

async function deleteProduct(id, name) {
  if (!confirm('I-delete ang "' + name + '"? Hindi na ito maibabalik.')) return;

  var { error } = await supabase.from('products').delete().eq('id', id);
  if (error) {
    showToast('Error: ' + error.message, 'error');
    return;
  }

  showToast('Na-delete ang produkto!');
  await loadProducts();
  loadCategories();
}

function openRestock(id, name, currentQty) {
  document.getElementById('restockProductId').value = id;
  document.getElementById('restockProductName').textContent = name;
  document.getElementById('restockCurrentQty').textContent = currentQty;
  document.getElementById('restockQty').value = 1;

  var modal = new bootstrap.Modal(document.getElementById('restockModal'));
  modal.show();
}

async function restockProduct() {
  var id = document.getElementById('restockProductId').value;
  var addQty = parseInt(document.getElementById('restockQty').value) || 0;

  if (addQty <= 0) {
    showToast('Pakilagay ang tamang dami', 'error');
    return;
  }

  var product = allProducts.find(function(p) { return p.id === id; });
  if (!product) return;

  var newQty = product.quantity + addQty;
  var { error } = await supabase
    .from('products')
    .update({ quantity: newQty, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    showToast('Error: ' + error.message, 'error');
    return;
  }

  bootstrap.Modal.getInstance(document.getElementById('restockModal')).hide();
  showToast('Na-restock! Bagong dami: ' + newQty);
  await loadProducts();
}
