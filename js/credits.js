// ============================================================
// CREDITS / UTANG PAGE
// ============================================================

var allCustomers = [];
var allCredits = [];

document.addEventListener('DOMContentLoaded', async function() {
  if (!isConfigured()) return;
  await loadAllData();
});

async function loadAllData() {
  await Promise.all([loadCustomers(), loadCredits()]);
  renderCreditsList();
  updateCreditStats();
  populateCustomerDropdown();
}

async function loadCustomers() {
  var { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    showToast('Error loading customers: ' + error.message, 'error');
    return;
  }
  allCustomers = data || [];
}

async function loadCredits() {
  var { data, error } = await supabase
    .from('credits')
    .select('*, customers(name, address, phone)')
    .order('credit_date', { ascending: false });

  if (error) {
    showToast('Error loading credits: ' + error.message, 'error');
    return;
  }
  allCredits = data || [];
}

function updateCreditStats() {
  var totalUnpaid = 0;
  var totalPaid = 0;
  var customersWithUtang = new Set();

  allCredits.forEach(function(c) {
    var remaining = parseFloat(c.amount) - parseFloat(c.paid_amount || 0);
    if (c.is_paid) {
      totalPaid += parseFloat(c.amount);
    } else {
      totalUnpaid += remaining;
      customersWithUtang.add(c.customer_id);
    }
  });

  document.getElementById('totalUnpaid').textContent = formatCurrency(totalUnpaid);
  document.getElementById('totalPaid').textContent = formatCurrency(totalPaid);
  document.getElementById('totalCustomers').textContent = allCustomers.length;
  document.getElementById('withUtang').textContent = customersWithUtang.size;
}

function populateCustomerDropdown() {
  var select = document.getElementById('creditCustomer');
  select.innerHTML = '<option value="">Pumili ng customer...</option>';
  allCustomers.forEach(function(c) {
    select.innerHTML += '<option value="' + c.id + '">' + c.name + '</option>';
  });
}

function filterCredits() {
  renderCreditsList();
}

function renderCreditsList() {
  var search = document.getElementById('searchCustomer').value.toLowerCase();
  var filterPaid = document.getElementById('filterPaid').value;
  var container = document.getElementById('customerCreditsList');

  // Group credits by customer
  var grouped = {};
  allCredits.forEach(function(c) {
    var custName = c.customers ? c.customers.name : 'Unknown';
    var custId = c.customer_id;

    // Apply search filter
    if (search && !custName.toLowerCase().includes(search)) return;

    // Apply paid filter
    if (filterPaid === 'paid' && !c.is_paid) return;
    if (filterPaid === 'unpaid' && c.is_paid) return;

    if (!grouped[custId]) {
      grouped[custId] = {
        name: custName,
        address: c.customers ? c.customers.address : '',
        phone: c.customers ? c.customers.phone : '',
        credits: [],
        totalUnpaid: 0
      };
    }
    grouped[custId].credits.push(c);
    if (!c.is_paid) {
      grouped[custId].totalUnpaid += parseFloat(c.amount) - parseFloat(c.paid_amount || 0);
    }
  });

  // Also show customers without credits if no filter
  if (!search && !filterPaid) {
    allCustomers.forEach(function(cust) {
      if (!grouped[cust.id]) {
        grouped[cust.id] = {
          name: cust.name,
          address: cust.address || '',
          phone: cust.phone || '',
          credits: [],
          totalUnpaid: 0
        };
      }
    });
  }

  var entries = Object.entries(grouped).sort(function(a, b) {
    return b[1].totalUnpaid - a[1].totalUnpaid;
  });

  if (entries.length === 0) {
    container.innerHTML = '<div class="empty-state"><i class="bi bi-people"></i><p>Walang customer na nahanap</p></div>';
    return;
  }

  container.innerHTML = entries.map(function(entry) {
    var custId = entry[0];
    var cust = entry[1];

    var creditRows = '';
    if (cust.credits.length === 0) {
      creditRows = '<tr><td colspan="6" class="text-center text-muted py-2">Walang utang</td></tr>';
    } else {
      creditRows = cust.credits.map(function(c) {
        var remaining = parseFloat(c.amount) - parseFloat(c.paid_amount || 0);
        var statusBadge = c.is_paid ? '<span class="badge-paid">Bayad na</span>' : '<span class="badge-unpaid">₱' + remaining.toFixed(2) + ' natitira</span>';
        var actions = '';
        if (!c.is_paid) {
          actions = '<button class="action-btn action-btn-pay" title="Irekord ang Bayad" onclick="openPayment(\'' + c.id + '\', \'' + escapeHtmlCredits(c.description || 'Utang') + '\', ' + c.amount + ', ' + (c.paid_amount || 0) + ')"><i class="bi bi-cash"></i></button>';
        }
        actions += '<button class="action-btn action-btn-delete" title="I-delete" onclick="deleteCredit(\'' + c.id + '\')"><i class="bi bi-trash"></i></button>';

        return '<tr>' +
          '<td>' + (c.description || '-') + '</td>' +
          '<td class="fw-bold">' + formatCurrency(c.amount) + '</td>' +
          '<td>' + formatCurrency(c.paid_amount || 0) + '</td>' +
          '<td>' + formatDate(c.credit_date) + '</td>' +
          '<td>' + statusBadge + '</td>' +
          '<td class="text-center">' + actions + '</td>' +
          '</tr>';
      }).join('');
    }

    return '<div class="customer-credit-card">' +
      '<div class="customer-credit-header">' +
        '<div>' +
          '<div class="customer-name"><i class="bi bi-person-fill me-1"></i>' + cust.name + '</div>' +
          '<div class="customer-address">' + (cust.address || '') + (cust.phone ? ' | ' + cust.phone : '') + '</div>' +
        '</div>' +
        '<div class="text-end">' +
          '<div class="total-utang">' + formatCurrency(cust.totalUnpaid) + '</div>' +
          '<small style="color:rgba(255,255,255,0.5)">Kabuuang Utang</small>' +
        '</div>' +
      '</div>' +
      '<div class="customer-credit-body">' +
        '<div class="table-responsive">' +
          '<table class="table table-hover mb-0">' +
            '<thead><tr>' +
              '<th>Deskripsyon</th><th>Halaga</th><th>Bayad</th><th>Petsa</th><th>Kalagayan</th><th class="text-center">Aksyon</th>' +
            '</tr></thead>' +
            '<tbody>' + creditRows + '</tbody>' +
          '</table>' +
        '</div>' +
      '</div>' +
    '</div>';
  }).join('');
}

function escapeHtmlCredits(text) {
  var div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML.replace(/'/g, "\\'");
}

// ---- Customer CRUD ----

function openAddCustomer() {
  document.getElementById('customerModalTitle').textContent = 'Dagdag Customer';
  document.getElementById('customerForm').reset();
  document.getElementById('customerId').value = '';
}

async function saveCustomer() {
  var id = document.getElementById('customerId').value;
  var data = {
    name: document.getElementById('customerName').value.trim(),
    address: document.getElementById('customerAddress').value.trim(),
    phone: document.getElementById('customerPhone').value.trim(),
    notes: document.getElementById('customerNotes').value.trim(),
    updated_at: new Date().toISOString()
  };

  if (!data.name) {
    showToast('Pakilagay ang pangalan ng customer', 'error');
    return;
  }

  var result;
  if (id) {
    result = await supabase.from('customers').update(data).eq('id', id);
  } else {
    result = await supabase.from('customers').insert(data);
  }

  if (result.error) {
    showToast('Error: ' + result.error.message, 'error');
    return;
  }

  bootstrap.Modal.getInstance(document.getElementById('customerModal')).hide();
  showToast(id ? 'Na-update ang customer!' : 'Naidagdag ang customer!');
  await loadAllData();
}

// ---- Credit CRUD ----

function openAddCredit() {
  document.getElementById('creditModalTitle').textContent = 'Dagdag Utang';
  document.getElementById('creditForm').reset();
  document.getElementById('creditId').value = '';
  document.getElementById('creditDate').value = new Date().toISOString().split('T')[0];
  populateCustomerDropdown();
}

async function saveCredit() {
  var data = {
    customer_id: document.getElementById('creditCustomer').value,
    amount: parseFloat(document.getElementById('creditAmount').value) || 0,
    description: document.getElementById('creditDescription').value.trim(),
    credit_date: document.getElementById('creditDate').value,
    due_date: document.getElementById('creditDueDate').value || null,
    is_paid: false,
    paid_amount: 0,
    updated_at: new Date().toISOString()
  };

  if (!data.customer_id) {
    showToast('Pumili muna ng customer', 'error');
    return;
  }

  if (data.amount <= 0) {
    showToast('Pakilagay ang tamang halaga', 'error');
    return;
  }

  var id = document.getElementById('creditId').value;
  var result;
  if (id) {
    result = await supabase.from('credits').update(data).eq('id', id);
  } else {
    result = await supabase.from('credits').insert(data);
  }

  if (result.error) {
    showToast('Error: ' + result.error.message, 'error');
    return;
  }

  bootstrap.Modal.getInstance(document.getElementById('creditModal')).hide();
  showToast('Nairekord ang utang!');
  await loadAllData();
}

async function deleteCredit(id) {
  if (!confirm('I-delete ang utang na ito?')) return;

  var { error } = await supabase.from('credits').delete().eq('id', id);
  if (error) {
    showToast('Error: ' + error.message, 'error');
    return;
  }

  showToast('Na-delete ang utang!');
  await loadAllData();
}

// ---- Payment ----

function openPayment(creditId, desc, totalAmount, paidSoFar) {
  var remaining = parseFloat(totalAmount) - parseFloat(paidSoFar || 0);
  document.getElementById('paymentCreditId').value = creditId;
  document.getElementById('paymentCreditDesc').textContent = desc;
  document.getElementById('paymentRemaining').textContent = formatCurrency(remaining);
  document.getElementById('paymentCreditTotal').value = totalAmount;
  document.getElementById('paymentPaidSoFar').value = paidSoFar || 0;
  document.getElementById('paymentAmount').value = '';
  document.getElementById('paymentAmount').max = remaining;
  document.getElementById('payFullCheck').checked = false;

  var modal = new bootstrap.Modal(document.getElementById('paymentModal'));
  modal.show();
}

function togglePayFull() {
  var checked = document.getElementById('payFullCheck').checked;
  var total = parseFloat(document.getElementById('paymentCreditTotal').value);
  var paid = parseFloat(document.getElementById('paymentPaidSoFar').value);
  var remaining = total - paid;

  if (checked) {
    document.getElementById('paymentAmount').value = remaining.toFixed(2);
    document.getElementById('paymentAmount').readOnly = true;
  } else {
    document.getElementById('paymentAmount').value = '';
    document.getElementById('paymentAmount').readOnly = false;
  }
}

async function recordPayment() {
  var creditId = document.getElementById('paymentCreditId').value;
  var payAmount = parseFloat(document.getElementById('paymentAmount').value) || 0;
  var totalAmount = parseFloat(document.getElementById('paymentCreditTotal').value);
  var paidSoFar = parseFloat(document.getElementById('paymentPaidSoFar').value);
  var remaining = totalAmount - paidSoFar;

  if (payAmount <= 0) {
    showToast('Pakilagay ang tamang halaga ng bayad', 'error');
    return;
  }

  if (payAmount > remaining) {
    showToast('Lampas sa natitirang utang ang bayad', 'error');
    return;
  }

  var newPaid = paidSoFar + payAmount;
  var isPaid = newPaid >= totalAmount;

  var updateData = {
    paid_amount: newPaid,
    is_paid: isPaid,
    updated_at: new Date().toISOString()
  };

  if (isPaid) {
    updateData.paid_date = new Date().toISOString().split('T')[0];
  }

  var { error } = await supabase.from('credits').update(updateData).eq('id', creditId);

  if (error) {
    showToast('Error: ' + error.message, 'error');
    return;
  }

  bootstrap.Modal.getInstance(document.getElementById('paymentModal')).hide();
  showToast(isPaid ? 'Fully paid! Salamat!' : 'Nabayaran ang ' + formatCurrency(payAmount) + '!');
  await loadAllData();
}
