// Main Application Initialization
class App {
    constructor() {
        this.init();
    }

    init() {
        // Wait for DOM to be fully loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.initializeApp();
            });
        } else {
            this.initializeApp();
        }
    }

    initializeApp() {
        // Initialize navigation click handlers
        this.setupNavigationHandlers();
        
        // Setup collapsible sections
        this.setupSectionToggles();
        
        // Setup modal close handlers
        this.setupModalHandlers();
        
        // Setup keyboard shortcuts
        this.setupKeyboardShortcuts();
        
        // Setup global Edit action
        this.setupEditAction();
        
        console.log('UWA Motorsport Wiki initialized successfully');
    }

    setupNavigationHandlers() {
        // Get all navigation items and set up click handlers
        const navItems = document.querySelectorAll('.nav-item');
        
        navItems.forEach(item => {
            const pageId = this.getPageIdFromNavItem(item);
            
            item.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Don't navigate if item is restricted
                if (item.classList.contains('restricted')) {
                    auth.showError('You do not have permission to access this page.');
                    return;
                }
                
                // Show the page
                if (wiki && typeof wiki.showPage === 'function') {
                    wiki.showPage(pageId);
                } else {
                    console.error('Wiki module not available');
                }
            });
        });
    }

    getPageIdFromNavItem(navItem) {
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

    setupSectionToggles() {
        const sectionHeaders = document.querySelectorAll('.nav-header');
        
        sectionHeaders.forEach(header => {
            header.addEventListener('click', (e) => {
                e.preventDefault();
                
                const sectionElement = header.nextElementSibling;
                if (!sectionElement) return;
                
                const sectionId = sectionElement.id;
                if (sectionId && wiki && typeof wiki.toggleSection === 'function') {
                    wiki.toggleSection(sectionId);
                }
            });
        });
    }

    setupModalHandlers() {
        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                const modalId = e.target.id;
                if (auth && typeof auth.closeModal === 'function') {
                    auth.closeModal(modalId);
                }
            }
        });

        // Close modal with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const openModal = document.querySelector('.modal[style*="block"]');
                if (openModal && auth && typeof auth.closeModal === 'function') {
                    auth.closeModal(openModal.id);
                }
            }
        });

        // Setup close buttons
        const closeButtons = document.querySelectorAll('.modal .close');
        closeButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal && auth && typeof auth.closeModal === 'function') {
                    auth.closeModal(modal.id);
                }
            });
        });
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + K to focus search
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                if (search && typeof search.focusSearch === 'function') {
                    search.focusSearch();
                }
            }
            
            // Ctrl/Cmd + E to edit current page (if allowed)
            if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
                e.preventDefault();
                if (wiki && wiki.currentPage && auth) {
                    const currentPage = wiki.getCurrentPage();
                    const role = auth.getCurrentRole();
                    const subteam = auth.getCurrentSubteam();
                    
                    if (currentPage && auth.canEditPage(currentPage, role, subteam)) {
                        wiki.editPage(currentPage);
                    } else {
                        auth.showError('You do not have permission to edit this page.');
                    }
                }
            }
        });
    }

    setupEditAction() {
        const editBtn = document.getElementById('editActionBtn');
        if (!editBtn) return;

        // Click opens options modal
        editBtn.addEventListener('click', () => {
            const modal = document.getElementById('editOptionsModal');
            if (modal) modal.style.display = 'block';
        });

        // Wire option buttons
        const optEditText = document.getElementById('optEditText');
        const optUploadImage = document.getElementById('optUploadImage');
        const optEmbedDoc = document.getElementById('optEmbedDoc');
        const optViewRevisions = document.getElementById('optViewRevisions');

        const getCurrentPage = () => (window.wiki ? window.wiki.getCurrentPage() : null);

        if (optEditText) {
            optEditText.addEventListener('click', () => {
                const page = getCurrentPage();
                if (!page) return;
                // Open existing edit modal flow
                if (window.wiki) window.wiki.editPage(page);
                closeModal('editOptionsModal');
            });
        }

        if (optUploadImage) {
            optUploadImage.addEventListener('click', () => {
                const page = getCurrentPage();
                if (!page) return;
                if (window.uploads) window.uploads.showUploadModal(page);
                closeModal('editOptionsModal');
            });
        }

        if (optEmbedDoc) {
            optEmbedDoc.addEventListener('click', () => {
                const page = getCurrentPage();
                if (!page) return;
                // Reuse upload modal but preset to document mode
                const uploadType = document.getElementById('uploadType');
                if (window.uploads) {
                    window.uploads.showUploadModal(page);
                    if (uploadType) {
                        uploadType.value = 'document';
                        if (typeof window.uploads.updateFileInputAccept === 'function') {
                            window.uploads.updateFileInputAccept('document');
                        }
                    }
                }
                closeModal('editOptionsModal');
            });
        }

        if (optViewRevisions) {
            optViewRevisions.addEventListener('click', () => {
                const page = getCurrentPage();
                if (!page) return;
                if (window.editor) window.editor.showRevisions(page);
                closeModal('editOptionsModal');
            });
        }

        // Initial visibility and on page change we may update it
        this.updateEditButtonVisibility();
    }

    updateEditButtonVisibility() {
        const editBtn = document.getElementById('editActionBtn');
        if (!editBtn || !window.auth || !window.wiki) return;
        const pageId = window.wiki.getCurrentPage();
        const canEdit = pageId ? window.auth.canEditPage(pageId, window.auth.getCurrentRole(), window.auth.getCurrentSubteam()) : false;
        editBtn.style.display = canEdit ? 'inline-block' : 'none';
    }

    // Utility methods
    showNotification(message, type = 'info') {
        if (auth && typeof auth.showNotification === 'function') {
            auth.showNotification(message, type);
        } else {
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    }

    // Public methods for debugging
    getModuleStatus() {
        return {
            auth: typeof auth !== 'undefined',
            wiki: typeof wiki !== 'undefined', 
            search: typeof search !== 'undefined',
            app: true
        };
    }

    // Reinitialize navigation (useful after auth changes)
    reinitializeNavigation() {
        this.setupNavigationHandlers();
    }
}

// Initialize the application
const app = new App();

// Export for use in other modules and debugging
window.app = app;

// Global utility functions for backward compatibility
function showPage(pageId) {
    if (wiki && typeof wiki.showPage === 'function') {
        wiki.showPage(pageId);
    } else {
        console.error('Wiki module not available');
    }
}

function toggleSection(sectionName) {
    if (wiki && typeof wiki.toggleSection === 'function') {
        wiki.toggleSection(sectionName);
    } else {
        console.error('Wiki module not available');
    }
}

function closeModal(modalId) {
    if (auth && typeof auth.closeModal === 'function') {
        auth.closeModal(modalId);
    } else {
        console.error('Auth module not available');
    }
}

// Debug function
function debugApp() {
    console.log('App Status:', app.getModuleStatus());
    console.log('Current User:', auth ? auth.getCurrentUser() : 'Auth not available');
    console.log('Current Page:', wiki ? wiki.getCurrentPage() : 'Wiki not available');
}

// Make debug function globally available
window.debugApp = debugApp;