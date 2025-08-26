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
                
                // Reinitialize navigation permissions
                if (window.app && typeof window.app.reinitializeNavigation === 'function') {
                    window.app.reinitializeNavigation();
                }
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
    }

    updateNavigationPermissions(role, subteam) {
        const navItems = document.querySelectorAll('.nav-item');
        
        navItems.forEach(item => {
            const pageId = this.getPageIdFromNavItem(item);
            
            if (this.canAccessPage(pageId, role, subteam)) {
                item.classList.remove('restricted');
                // Don't set onclick here - let app.js handle the event listeners
            } else {
                item.classList.add('restricted');
            }
        });
    }

    resetPermissions() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.classList.remove('restricted');
        });
    }

    getPageIdFromNavItem(navItem) {
        // Use the same logic as in app.js
        if (window.app && typeof window.app.getPageIdFromNavItem === 'function') {
            return window.app.getPageIdFromNavItem(navItem);
        }
        
        // Fallback logic
        const text = navItem.textContent.toLowerCase().trim();
        const sectionElement = navItem.closest('.nav-section');
        
        if (!sectionElement) return text;
        
        const sectionHeader = sectionElement.querySelector('.nav-header span');
        if (!sectionHeader) return text;
        
        const sectionText = sectionHeader.textContent;
        
        // Map section emojis to section IDs
        const sectionMap = {
            '🏢': 'management',
            '🛩️': 'aero', 
            '🏗️': 'chassis',
            '⚡': 'electrical',
            '🔋': 'powertrain',
            '🚗': 'vd',
            '💼': 'business'
        };
        
        // Find the emoji in the section text
        let sectionId = null;
        for (const [emoji, id] of Object.entries(sectionMap)) {
            if (sectionText.includes(emoji)) {
                sectionId = id;
                break;
            }
        }
        
        if (sectionId) {
            return `${sectionId}-${text}`;
        }
        
        return text;
    }

    canAccessPage(pageId, role, subteam) {
        // Guest can only access overview and learning pages
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
        
        // Member can edit their subteam pages (not just overviews/learning)
        if (role === 'member') {
            if (pageId.includes('-overview') || pageId.includes('-learning')) {
                return false; // Members cannot edit overview/learning pages
            }
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
        // Remove any existing notifications
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notif => notif.remove());
        
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
            animation: slideInRight 0.3s ease;
            max-width: 300px;
            word-wrap: break-word;
            border: 1px solid ${type === 'success' ? '#c3e6cb' : '#f5c6cb'};
        `;
        
        // Add animation if not already added
        if (!document.querySelector('#notificationStyles')) {
            const style = document.createElement('style');
            style.id = 'notificationStyles';
            style.textContent = `
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOutRight {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(notification);
        
        // Auto-remove after 4 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 300);
        }, 4000);
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
    if (window.auth) {
        window.auth.closeModal(modalId);
    }
}

// Initialize authentication
const auth = new Auth();

// Export for use in other modules
window.auth = auth;