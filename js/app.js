// ============================================================
// SHARED APP UTILITIES
// ============================================================

function toggleSidebar() {
  var sidebar = document.getElementById('sidebar');
  var main = document.querySelector('.main-content');
  var overlay = document.getElementById('sidebarOverlay');
  var isMobile = window.innerWidth < 768;

  if (isMobile) {
    sidebar.classList.toggle('active');
    if (overlay) overlay.classList.toggle('active');
  } else {
    sidebar.classList.toggle('collapsed');
    if (main) main.classList.toggle('sidebar-collapsed');
    localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
  }
}

document.addEventListener('DOMContentLoaded', function() {
  var saved = localStorage.getItem('sidebarCollapsed');
  if (saved === 'true' && window.innerWidth >= 768) {
    var sidebar = document.getElementById('sidebar');
    var main = document.querySelector('.main-content');
    if (sidebar) sidebar.classList.add('collapsed');
    if (main) main.classList.add('sidebar-collapsed');
  }
});

function formatCurrency(amount) {
  return '₱' + parseFloat(amount || 0).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateTime(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-PH', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true
  });
}

function setCurrentDate() {
  const el = document.getElementById('currentDate');
  if (el) {
    el.textContent = new Date().toLocaleDateString('en-PH', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
    });
  }
}

function showToast(message, type) {
  type = type || 'success';
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const typeClass = type === 'error' ? 'toast-error' : type === 'warning' ? 'toast-warning' : '';
  const icon = type === 'error' ? 'bi-x-circle-fill' : type === 'warning' ? 'bi-exclamation-triangle-fill' : 'bi-check-circle-fill';
  const iconColor = type === 'error' ? 'var(--seven-red)' : type === 'warning' ? 'var(--seven-orange)' : 'var(--seven-green)';

  const toast = document.createElement('div');
  toast.className = 'toast-seven ' + typeClass;
  toast.innerHTML = '<i class="bi ' + icon + '" style="color:' + iconColor + ';font-size:1.2rem"></i><span>' + message + '</span>';
  container.appendChild(toast);

  setTimeout(function() {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(function() { toast.remove(); }, 300);
  }, 3000);
}

function showConfigBanner() {
  const main = document.querySelector('.main-content');
  if (!main) return;

  const topbar = main.querySelector('.topbar');
  const banner = document.createElement('div');
  banner.className = 'config-banner';
  banner.innerHTML =
    '<h5><i class="bi bi-gear-fill"></i> Supabase Not Configured</h5>' +
    '<p>Open <code>js/supabase-config.js</code> and replace <code>YOUR_SUPABASE_URL</code> and <code>YOUR_SUPABASE_ANON_KEY</code> with your Supabase project credentials.</p>' +
    '<p class="mb-0 mt-2"><small>Then run the SQL from <code>supabase-schema.sql</code> in your Supabase SQL Editor.</small></p>';

  if (topbar && topbar.nextSibling) {
    main.insertBefore(banner, topbar.nextSibling);
  } else {
    main.appendChild(banner);
  }
}

document.addEventListener('DOMContentLoaded', function() {
  setCurrentDate();
  if (!isConfigured()) {
    showConfigBanner();
  }
});
