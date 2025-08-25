// Authentication Module
class Auth {
    constructor() {
        this.currentUser = null;
        this.isAuthenticated = false;
        this.init();
    }

    init() {
        this.checkAuthStatus();
        this.bindEvents();
    }

    bindEvents() {
        // Login form submission
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.login();
        });

        // Logout button
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.logout();
        });

        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal(e.target.id);
            }
        });
    }

    async checkAuthStatus() {
        try {
            const response = await fetch('/api/auth/me');
            if (response.ok) {
                const user = await response.json();
                this.setCurrentUser(user);
                this.showApp();
            } else {
                this.showLoginModal();
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            this.showLoginModal();
        }
    }

    async login() {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        if (!username || !password) {
            this.showError('Please enter both username and password');
            return;
        }

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                this.setCurrentUser(data.user);
                this.closeModal('loginModal');
                this.showApp();
                this.showSuccess('Login successful!');
                
                // Clear form
                document.getElementById('loginForm').reset();
            } else {
                this.showError(data.error || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showError('Network error. Please try again.');
        }
    }

    async logout() {
        try {
            const response = await fetch('/api/auth/logout', {
                method: 'POST',
            });

            if (response.ok) {
                this.clearCurrentUser();
                this.showLoginModal();
                this.showSuccess('Logged out successfully');
            } else {
                this.showError('Logout failed');
            }
        } catch (error) {
            console.error('Logout error:', error);
            this.showError('Network error during logout');
        }
    }

    setCurrentUser(user) {
        this.currentUser = user;
        this.isAuthenticated = true;
        
        // Update UI
        document.getElementById('userInfo').textContent = `${user.username} (${user.role})`;
        
        // Store in session storage for persistence
        sessionStorage.setItem('currentUser', JSON.stringify(user));
        
        // Update permissions
        this.updatePermissions();
    }

    clearCurrentUser() {
        this.currentUser = null;
        this.isAuthenticated = false;
        
        // Clear UI
        document.getElementById('userInfo').textContent = '';
        
        // Clear session storage
        sessionStorage.removeItem('currentUser');
        
        // Reset permissions
        this.resetPermissions();
    }

    updatePermissions() {
        const role = this.currentUser.role;
        const subteam = this.currentUser.subteam;
        
        // Update navigation items based on role
        this.updateNavigationPermissions(role, subteam);
        
        // Update edit controls visibility
        this.updateEditControlsVisibility(role, subteam);
    }

    updateNavigationPermissions(role, subteam) {
        const navItems = document.querySelectorAll('.nav-item');
        
        navItems.forEach(item => {
            const pageId = this.getPageIdFromNavItem(item);
            
            if (this.canAccessPage(pageId, role, subteam)) {
                item.classList.remove('restricted');
                item.onclick = () => showPage(pageId);
            } else {
                item.classList.add('restricted');
                item.onclick = null;
            }
        });
    }

    updateEditControlsVisibility(role, subteam) {
        // This will be called when showing pages to determine edit button visibility
        // Implementation in wiki.js
    }

    resetPermissions() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.classList.remove('restricted');
            item.onclick = null;
        });
    }

    getPageIdFromNavItem(navItem) {
        // Extract page ID from navigation item text or data attribute
        const text = navItem.textContent.toLowerCase();
        const section = navItem.closest('.nav-section').querySelector('.nav-header span').textContent;
        
        // Map section names to page IDs
        const sectionMap = {
            '🏢 management': 'management',
            '🛩️ aerodynamics': 'aero',
            '🏗️ chassis': 'chassis',
            '⚡ electrical': 'electrical',
            '🔋 powertrain': 'powertrain',
            '🚗 vehicle dynamics': 'vd',
            '💼 business': 'business'
        };
        
        const sectionKey = Object.keys(sectionMap).find(key => section.includes(sectionMap[key]));
        if (sectionKey) {
            const sectionId = sectionMap[sectionKey];
            return `${sectionId}-${text}`;
        }
        
        return text;
    }

    canAccessPage(pageId, role, subteam) {
        // Guest can only access overview pages
        if (role === 'guest') {
            return pageId.includes('-overview') || pageId.includes('-learning');
        }
        
        // Member can access their subteam pages and overviews
        if (role === 'member') {
            if (pageId.includes('-overview') || pageId.includes('-learning')) {
                return true;
            }
            return pageId.startsWith(subteam + '-');
        }
        
        // Manager can access everything
        if (role === 'manager') {
            return true;
        }
        
        return false;
    }

    canEditPage(pageId, role, subteam) {
        // Guest cannot edit anything
        if (role === 'guest') {
            return false;
        }
        
        // Member can edit their subteam pages
        if (role === 'member') {
            return pageId.startsWith(subteam + '-');
        }
        
        // Manager can edit everything
        if (role === 'manager') {
            return true;
        }
        
        return false;
    }

    showLoginModal() {
        document.getElementById('loginModal').style.display = 'block';
        document.getElementById('app').style.display = 'none';
    }

    showApp() {
        document.getElementById('loginModal').style.display = 'none';
        document.getElementById('app').style.display = 'block';
    }

    closeModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Style the notification
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: ${type === 'success' ? '#d4edda' : '#f8d7da'};
            color: ${type === 'success' ? '#155724' : '#721c24'};
            padding: 1rem 2rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            z-index: 3000;
            animation: slideIn 0.3s ease;
            max-width: 300px;
            word-wrap: break-word;
        `;
        
        // Add animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(notification);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            notification.remove();
            style.remove();
        }, 3000);
    }

    // Public methods for other modules
    getCurrentUser() {
        return this.currentUser;
    }

    getCurrentRole() {
        return this.currentUser ? this.currentUser.role : null;
    }

    getCurrentSubteam() {
        return this.currentUser ? this.currentUser.subteam : null;
    }

    isUserAuthenticated() {
        return this.isAuthenticated;
    }
}

// Global functions for HTML onclick handlers
function closeModal(modalId) {
    auth.closeModal(modalId);
}

// Initialize authentication
const auth = new Auth();

// Export for use in other modules
window.auth = auth;