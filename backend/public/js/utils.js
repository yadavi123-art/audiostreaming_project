// ===================================
// Utility Functions
// ===================================

const API_BASE_URL = window.location.origin + '/api';

// ===================================
// Authentication Utilities
// ===================================

const Auth = {
  // Get token from localStorage
  getToken() {
    return localStorage.getItem('token');
  },

  // Set token in localStorage
  setToken(token) {
    localStorage.setItem('token', token);
  },

  // Remove token from localStorage
  removeToken() {
    localStorage.removeItem('token');
  },

  // Get user data from localStorage
  getUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // Set user data in localStorage
  setUser(user) {
    localStorage.setItem('user', JSON.stringify(user));
  },

  // Remove user data from localStorage
  removeUser() {
    localStorage.removeItem('user');
  },

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.getToken();
  },

  // Logout user
  logout() {
    this.removeToken();
    this.removeUser();
    window.location.href = '/public/pages/login.html';
  },

  // Check if setup is complete
  isSetupComplete() {
    const user = this.getUser();
    return user && user.setupComplete;
  }
};

// ===================================
// API Request Utilities
// ===================================

const API = {
  // Make authenticated request
  async request(endpoint, options = {}) {
    const token = Auth.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  // GET request
  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  },

  // POST request
  async post(endpoint, body) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  },

  // PUT request
  async put(endpoint, body) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body)
    });
  },

  // DELETE request
  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
};

// ===================================
// Form Validation Utilities
// ===================================

const Validator = {
  // Validate email
  isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  },

  // Validate password (min 6 characters)
  isValidPassword(password) {
    return password && password.length >= 6;
  },

  // Validate required field
  isRequired(value) {
    return value && value.trim() !== '';
  },

  // Show error message
  showError(inputElement, message) {
    const formGroup = inputElement.closest('.form-group');
    const errorElement = formGroup.querySelector('.form-error') || document.createElement('div');
    
    errorElement.className = 'form-error';
    errorElement.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
    
    inputElement.classList.add('error');
    
    if (!formGroup.querySelector('.form-error')) {
      inputElement.parentNode.insertBefore(errorElement, inputElement.nextSibling);
    }
  },

  // Clear error message
  clearError(inputElement) {
    const formGroup = inputElement.closest('.form-group');
    const errorElement = formGroup.querySelector('.form-error');
    
    if (errorElement) {
      errorElement.remove();
    }
    
    inputElement.classList.remove('error');
  },

  // Clear all errors in form
  clearAllErrors(formElement) {
    const errorElements = formElement.querySelectorAll('.form-error');
    errorElements.forEach(el => el.remove());
    
    const errorInputs = formElement.querySelectorAll('.error');
    errorInputs.forEach(input => input.classList.remove('error'));
  }
};

// ===================================
// UI Utilities
// ===================================

const UI = {
  // Show loading spinner
  showLoading() {
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.id = 'loading-overlay';
    overlay.innerHTML = '<div class="spinner"></div>';
    document.body.appendChild(overlay);
  },

  // Hide loading spinner
  hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
      overlay.remove();
    }
  },

  // Show notification (new toast-style)
  showNotification(title, message, type = 'info', duration = 5000) {
    // Create notification container if it doesn't exist
    let container = document.querySelector('.notification-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'notification-container';
      document.body.appendChild(container);
    }

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
      <div class="notification-icon">
        <i class="fas fa-${this.getNotificationIcon(type)}"></i>
      </div>
      <div class="notification-content">
        <div class="notification-title">${title}</div>
        <div class="notification-message">${message}</div>
      </div>
      <button class="notification-close">
        <i class="fas fa-times"></i>
      </button>
    `;

    // Add close handler
    notification.querySelector('.notification-close').addEventListener('click', () => {
      this.removeNotification(notification);
    });

    // Add to container
    container.appendChild(notification);

    // Auto remove after duration
    if (duration > 0) {
      setTimeout(() => {
        this.removeNotification(notification);
      }, duration);
    }

    return notification;
  },

  // Remove notification with animation
  removeNotification(notification) {
    notification.classList.add('removing');
    setTimeout(() => {
      notification.remove();
    }, 300);
  },

  // Show alert message (legacy support)
  showAlert(message, type = 'info') {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.innerHTML = `
      <i class="fas fa-${this.getAlertIcon(type)}"></i>
      <div>${message}</div>
    `;
    
    const container = document.querySelector('.content') || document.body;
    container.insertBefore(alert, container.firstChild);
    
    // Auto remove after 5 seconds
    setTimeout(() => alert.remove(), 5000);
  },

  // Get notification icon based on type
  getNotificationIcon(type) {
    const icons = {
      success: 'check-circle',
      error: 'exclamation-circle',
      warning: 'exclamation-triangle',
      info: 'info-circle'
    };
    return icons[type] || 'info-circle';
  },

  // Get alert icon based on type
  getAlertIcon(type) {
    const icons = {
      success: 'check-circle',
      error: 'exclamation-circle',
      warning: 'exclamation-triangle',
      info: 'info-circle'
    };
    return icons[type] || 'info-circle';
  },

  // Show modal
  showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.style.display = 'flex';
    }
  },

  // Hide modal
  hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.style.display = 'none';
    }
  },

  // Toggle sidebar (mobile)
  toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
      sidebar.classList.toggle('open');
    }
  },

  // Format date
  formatDate(dateString) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  },

  // Format time
  formatTime(dateString) {
    const date = new Date(dateString);
    const options = { hour: '2-digit', minute: '2-digit' };
    return date.toLocaleTimeString('en-US', options);
  },

  // Format relative time (e.g., "2 hours ago")
  formatRelativeTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return this.formatDate(dateString);
  },

  // Get user initials for avatar
  getUserInitials(name) {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  },

  // Truncate text
  truncate(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  },

  // Show empty state
  showEmptyState(container, icon, title, message, actionText = null, actionCallback = null) {
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state';
    emptyState.innerHTML = `
      <div class="empty-state-icon">
        <i class="fas fa-${icon}"></i>
      </div>
      <div class="empty-state-title">${title}</div>
      <div class="empty-state-message">${message}</div>
      ${actionText ? `
        <div class="empty-state-action">
          <button class="btn btn-primary empty-state-btn">${actionText}</button>
        </div>
      ` : ''}
    `;

    if (actionText && actionCallback) {
      emptyState.querySelector('.empty-state-btn').addEventListener('click', actionCallback);
    }

    container.innerHTML = '';
    container.appendChild(emptyState);
  },

  // Show skeleton loader
  showSkeleton(container, type = 'card', count = 3) {
    const skeletons = [];
    for (let i = 0; i < count; i++) {
      const skeleton = document.createElement('div');
      skeleton.className = `skeleton skeleton-${type}`;
      skeletons.push(skeleton);
    }

    container.innerHTML = '';
    skeletons.forEach(skeleton => container.appendChild(skeleton));
  },

  // Create progress bar
  createProgressBar(percentage) {
    const progressBar = document.createElement('div');
    progressBar.className = 'progress-bar';
    progressBar.innerHTML = `
      <div class="progress-bar-fill" style="width: ${percentage}%"></div>
    `;
    return progressBar;
  },

  // Update progress bar
  updateProgressBar(progressBar, percentage) {
    const fill = progressBar.querySelector('.progress-bar-fill');
    if (fill) {
      fill.style.width = `${percentage}%`;
    }
  },

  // Confirm dialog
  async confirm(title, message, confirmText = 'Confirm', cancelText = 'Cancel') {
    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.className = 'modal-overlay';
      overlay.innerHTML = `
        <div class="modal animate-scale-in">
          <div class="modal-header">
            <h3 class="modal-title">${title}</h3>
          </div>
          <div class="modal-body">
            <p>${message}</p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost cancel-btn">${cancelText}</button>
            <button class="btn btn-primary confirm-btn">${confirmText}</button>
          </div>
        </div>
      `;

      document.body.appendChild(overlay);

      overlay.querySelector('.cancel-btn').addEventListener('click', () => {
        overlay.remove();
        resolve(false);
      });

      overlay.querySelector('.confirm-btn').addEventListener('click', () => {
        overlay.remove();
        resolve(true);
      });

      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          overlay.remove();
          resolve(false);
        }
      });
    });
  },

  // Copy to clipboard
  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      this.showNotification('Copied!', 'Text copied to clipboard', 'success', 2000);
      return true;
    } catch (error) {
      console.error('Failed to copy:', error);
      this.showNotification('Error', 'Failed to copy to clipboard', 'error', 3000);
      return false;
    }
  },

  // Debounce function
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // Throttle function
  throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
};

// ===================================
// Route Protection
// ===================================

function requireAuth() {
  if (!Auth.isAuthenticated()) {
    window.location.href = '/public/pages/login.html';
    return false;
  }
  return true;
}

function requireSetup() {
  if (!Auth.isSetupComplete()) {
    window.location.href = '/public/pages/setup-wizard.html';
    return false;
  }
  return true;
}

// ===================================
// Initialize User Menu
// ===================================

function initializeUserMenu() {
  const user = Auth.getUser();
  if (!user) return;

  // Update user info in header
  const userNameElement = document.querySelector('.user-name');
  const userRoleElement = document.querySelector('.user-role');
  const userAvatarElement = document.querySelector('.user-avatar');

  if (userNameElement) userNameElement.textContent = user.name;
  if (userRoleElement) userRoleElement.textContent = `Class ${user.class}`;
  if (userAvatarElement) userAvatarElement.textContent = UI.getUserInitials(user.name);

  // Add logout handler
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      Auth.logout();
    });
  }
}

// ===================================
// Initialize Sidebar Navigation
// ===================================

function initializeSidebar() {
  // Highlight active nav item based on current page
  const currentPage = window.location.pathname.split('/').pop();
  const navItems = document.querySelectorAll('.nav-item');
  
  navItems.forEach(item => {
    const href = item.getAttribute('href');
    if (href && href.includes(currentPage)) {
      item.classList.add('active');
    }
  });

  // Mobile menu toggle
  const menuToggle = document.querySelector('.menu-toggle');
  if (menuToggle) {
    menuToggle.addEventListener('click', UI.toggleSidebar);
  }

  // Close sidebar when clicking outside on mobile
  document.addEventListener('click', (e) => {
    const sidebar = document.querySelector('.sidebar');
    const menuToggle = document.querySelector('.menu-toggle');
    
    if (window.innerWidth <= 768 && 
        sidebar && 
        sidebar.classList.contains('open') &&
        !sidebar.contains(e.target) && 
        !menuToggle.contains(e.target)) {
      sidebar.classList.remove('open');
    }
  });
}

// ===================================
// Initialize Search
// ===================================

function initializeSearch() {
  const searchInput = document.querySelector('.search-bar input');
  if (searchInput) {
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const query = searchInput.value.trim();
        if (query) {
          // Implement search functionality
          console.log('Search:', query);
        }
      }
    });
  }
}

// ===================================
// Export for use in other files
// ===================================

window.Auth = Auth;
window.API = API;
window.Validator = Validator;
window.UI = UI;
window.requireAuth = requireAuth;
window.requireSetup = requireSetup;
window.initializeUserMenu = initializeUserMenu;
window.initializeSidebar = initializeSidebar;
window.initializeSearch = initializeSearch;
