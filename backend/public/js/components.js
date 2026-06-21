// ===================================
// Reusable Layout Components
// ===================================

// Generate sidebar HTML
function generateSidebar() {
  return `
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-header">
        <div class="sidebar-logo">
          <i class="fas fa-graduation-cap"></i>
        </div>
        <div class="sidebar-title">AI Learning</div>
      </div>
      
      <nav class="sidebar-nav">
        <div class="nav-section">
          <div class="nav-section-title">Main</div>
          <a href="dashboard.html" class="nav-item" data-page="dashboard">
            <i class="fas fa-home"></i>
            <span>Dashboard</span>
          </a>
          <a href="audio-learning.html" class="nav-item" data-page="audio-learning">
            <i class="fas fa-microphone"></i>
            <span>Audio Learning</span>
          </a>
          <a href="discussions.html" class="nav-item" data-page="discussions">
            <i class="fas fa-comments"></i>
            <span>Discussions</span>
          </a>
        </div>
        
        <div class="nav-section">
          <div class="nav-section-title">Progress</div>
          <a href="progress.html" class="nav-item" data-page="progress">
            <i class="fas fa-chart-line"></i>
            <span>My Progress</span>
          </a>
          <a href="analytics.html" class="nav-item" data-page="analytics">
            <i class="fas fa-chart-pie"></i>
            <span>Analytics</span>
          </a>
          <a href="leaderboard.html" class="nav-item" data-page="leaderboard">
            <i class="fas fa-trophy"></i>
            <span>Leaderboard</span>
          </a>
        </div>
        
        <div class="nav-section">
          <div class="nav-section-title">Account</div>
          <a href="profile.html" class="nav-item" data-page="profile">
            <i class="fas fa-user"></i>
            <span>Profile</span>
          </a>
          <a href="settings.html" class="nav-item" data-page="settings">
            <i class="fas fa-cog"></i>
            <span>Settings</span>
          </a>
          <a href="#" class="nav-item" id="logout-btn">
            <i class="fas fa-sign-out-alt"></i>
            <span>Logout</span>
          </a>
        </div>
      </nav>
    </aside>
  `;
}

// Generate header HTML
function generateHeader() {
  const user = Auth.getUser();
  const userName = user ? user.name : 'User';
  const userClass = user ? `Class ${user.class}` : '';
  const userInitials = UI.getUserInitials(userName);
  
  return `
    <header class="header">
      <div class="header-left">
        <button class="menu-toggle" id="menu-toggle">
          <i class="fas fa-bars"></i>
        </button>
        <div class="search-bar">
          <i class="fas fa-search"></i>
          <input type="text" placeholder="Search...">
        </div>
      </div>
      
      <div class="header-right">
        <button class="header-icon-btn" id="notifications-btn">
          <i class="fas fa-bell"></i>
          <span class="badge">3</span>
        </button>
        
        <div class="user-menu" id="user-menu">
          <div class="user-avatar">${userInitials}</div>
          <div class="user-info">
            <div class="user-name">${userName}</div>
            <div class="user-role">${userClass}</div>
          </div>
          <i class="fas fa-chevron-down"></i>
        </div>
      </div>
    </header>
  `;
}

// Initialize app layout
function initializeAppLayout(pageName) {
  // Check authentication
  if (!requireAuth()) return;
  
  // Check setup completion (except for setup wizard page)
  if (pageName !== 'setup-wizard' && !requireSetup()) return;
  
  // Generate layout
  const appContainer = document.querySelector('.app-container');
  if (!appContainer) {
    console.error('App container not found');
    return;
  }
  
  // Insert sidebar
  appContainer.insertAdjacentHTML('afterbegin', generateSidebar());
  
  // Insert header into main content
  const mainContent = document.querySelector('.main-content');
  if (mainContent) {
    mainContent.insertAdjacentHTML('afterbegin', generateHeader());
  }
  
  // Initialize components
  initializeUserMenu();
  initializeSidebar();
  initializeSearch();
  
  // Highlight active nav item
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    const page = item.getAttribute('data-page');
    if (page === pageName) {
      item.classList.add('active');
    }
  });
}

// Export functions
window.generateSidebar = generateSidebar;
window.generateHeader = generateHeader;
window.initializeAppLayout = initializeAppLayout;
