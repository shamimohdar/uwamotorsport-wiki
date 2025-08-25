// Wiki Module - Main functionality for page management and navigation
class Wiki {
    constructor() {
        this.currentPage = null;
        this.pages = new Map();
        this.init();
    }

    init() {
        this.bindEvents();
        this.initializeDefaultPages();
    }

    bindEvents() {
        // Navigation section toggles
        document.querySelectorAll('.nav-header').forEach(header => {
            header.addEventListener('click', (e) => {
                const sectionId = e.currentTarget.textContent.match(/[🏢🛩️🏗️⚡🔋🚗💼]/)[0];
                const section = this.getSectionFromEmoji(sectionId);
                this.toggleSection(section);
            });
        });

        // Edit form submission
        document.getElementById('editForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.savePage();
        });
    }

    getSectionFromEmoji(emoji) {
        const emojiMap = {
            '🏢': 'management',
            '🛩️': 'aero',
            '🏗️': 'chassis',
            '⚡': 'electrical',
            '🔋': 'powertrain',
            '🚗': 'vd',
            '💼': 'business'
        };
        return emojiMap[emoji] || 'management';
    }

    toggleSection(sectionName) {
        const section = document.getElementById(sectionName);
        const header = section.previousElementSibling;
        
        if (section.classList.contains('hidden')) {
            section.classList.remove('hidden');
            header.classList.remove('collapsed');
        } else {
            section.classList.add('hidden');
            header.classList.add('collapsed');
        }
    }

    initializeDefaultPages() {
        // Initialize with some default content for demo purposes
        const defaultPages = {
            'management-overview': {
                title: 'Management Overview',
                content: this.generateOverviewContent('management'),
                type: 'overview'
            },
            'aero-overview': {
                title: 'Aerodynamics Overview',
                content: this.generateOverviewContent('aero'),
                type: 'overview'
            },
            'chassis-overview': {
                title: 'Chassis Overview',
                content: this.generateOverviewContent('chassis'),
                type: 'overview'
            },
            'electrical-overview': {
                title: 'Electrical Overview',
                content: this.generateOverviewContent('electrical'),
                type: 'overview'
            },
            'powertrain-overview': {
                title: 'Powertrain Overview',
                content: this.generateOverviewContent('powertrain'),
                type: 'overview'
            },
            'vd-overview': {
                title: 'Vehicle Dynamics Overview',
                content: this.generateOverviewContent('vd'),
                type: 'overview'
            },
            'business-overview': {
                title: 'Business Overview',
                content: this.generateOverviewContent('business'),
                type: 'overview'
            }
        };

        // Store default pages
        Object.entries(defaultPages).forEach(([pageId, pageData]) => {
            this.pages.set(pageId, pageData);
        });
    }

    async showPage(pageId) {
        if (!auth.isUserAuthenticated()) {
            return;
        }

        const currentUser = auth.getCurrentUser();
        const role = currentUser.role;
        const subteam = currentUser.subteam;

        // Check if user can access this page
        if (!auth.canAccessPage(pageId, role, subteam)) {
            this.showPermissionDenied();
            return;
        }

        this.currentPage = pageId;
        this.updateNavigationActiveState(pageId);

        try {
            // Try to fetch from server first
            const response = await fetch(`/api/pages/${pageId}`);
            let pageData;

            if (response.ok) {
                pageData = await response.json();
            } else {
                // Fall back to default content
                pageData = this.pages.get(pageId) || this.generateDefaultPage(pageId);
            }

            this.displayPage(pageId, pageData);
        } catch (error) {
            console.error('Error loading page:', error);
            // Fall back to default content
            const pageData = this.pages.get(pageId) || this.generateDefaultPage(pageId);
            this.displayPage(pageId, pageData);
        }
    }

    displayPage(pageId, pageData) {
        const contentArea = document.getElementById('contentArea');
        
        let content = `
            <div class="page-header">
                <h1 class="page-title">${pageData.title}</h1>
                <p class="page-subtitle">Last updated: ${pageData.updated_at || 'Never'}</p>
            </div>
        `;

        // Add edit controls if user can edit
        if (auth.canEditPage(pageId, auth.getCurrentRole(), auth.getCurrentSubteam())) {
            content += `
                <div class="edit-controls">
                    <button class="btn btn-primary" onclick="wiki.editPage('${pageId}')">Edit Page</button>
                    <button class="btn btn-secondary" onclick="wiki.showUploadModal('${pageId}')">Upload File</button>
                    <button class="btn btn-secondary" onclick="wiki.showRevisions('${pageId}')">View Revisions</button>
                </div>
            `;
        }

        // Add page content
        if (pageData.content) {
            content += `<div class="page-content">${pageData.content}</div>`;
        } else {
            content += this.generateTemplateContent(pageId);
        }

        // Add uploads if any, then comments
        this.loadPageUploads(pageId).then(uploads => {
            if (uploads.length > 0) {
                content += this.generateUploadsSection(uploads);
            }
            // Append comments container
            content += `
                <div id="commentsSection" class="comments-section" style="margin-top: 2rem;">
                    <h2>💬 Comments</h2>
                    <div id="commentsList" class="comments-list" style="margin: 1rem 0;"></div>
                    ${auth.isUserAuthenticated() ? `
                    <form id="commentForm" class="comment-form" style="display: flex; gap: 0.5rem; align-items: flex-start;">
                        <textarea id="commentInput" rows="3" placeholder="Write a comment..." style="flex:1; padding: 0.6rem; border: 1px solid #e1e5e9; border-radius: 6px;"></textarea>
                        <button type="submit" class="btn btn-primary btn-small">Post</button>
                    </form>
                    ` : `<div class="error-message">Please log in to comment.</div>`}
                </div>
            `;
            contentArea.innerHTML = content;
            // Load and render comments, wire form
            this.refreshComments(pageId);
            const form = document.getElementById('commentForm');
            if (form) {
                form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.submitComment(pageId);
                });
            }
        }).catch(() => {
            contentArea.innerHTML = content;
        });
    }

    generateTemplateContent(pageId) {
        const section = pageId.split('-')[0];
        const pageType = pageId.split('-')[1];
        
        let content = `
            <div class="template-card">
                <div class="template-title">📋 Documentation Template</div>
                <p>This page is ready for content! Use the edit button above to add:</p>
                <ul style="margin: 1rem 0; padding-left: 2rem;">
                    <li><strong>Overview:</strong> Purpose and scope of this documentation</li>
                    <li><strong>Procedures:</strong> Step-by-step guides and best practices</li>
                    <li><strong>References:</strong> External resources and standards</li>
                    <li><strong>Updates:</strong> Version history and change logs</li>
                </ul>
            </div>
        `;

        // Generic starter content with random image and simple SVG graph
        const sampleImages = [
            'https://images.unsplash.com/photo-1520975922284-5f7f4f3c4f87?q=80&w=1200&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1518306727298-4c17e1bf6948?q=80&w=1200&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1200&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1556125578-0919013d0532?q=80&w=1200&auto=format&fit=crop'
        ];
        const randomImg = sampleImages[Math.floor(Math.random() * sampleImages.length)];
        content += `
            <div class="template-card">
                <div class="template-title">🖼️ Sample Image</div>
                <img src="${randomImg}" alt="Sample" />
            </div>
            <div class="template-card">
                <div class="template-title">📈 Sample Performance Graph</div>
                <svg viewBox="0 0 300 120" width="100%" height="120" xmlns="http://www.w3.org/2000/svg" style="background:#fafbfc;border:1px solid #e1e5e9;border-radius:6px;">
                    <polyline fill="none" stroke="#667eea" stroke-width="3" points="0,90 40,80 80,70 120,60 160,50 200,40 240,35 280,30" />
                    <line x1="0" y1="100" x2="300" y2="100" stroke="#e1e5e9" />
                    <line x1="0" y1="0" x2="0" y2="100" stroke="#e1e5e9" />
                </svg>
                <p style="color:#666;font-size:0.9rem;">Example trend line for initial documentation.</p>
            </div>
        `;

        // Add section-specific content
        if (pageType === 'learning') {
            content += this.generateLearningResources(section);
        } else if (pageType === 'overview') {
            content += this.generateOverviewContent(section);
        }

        return content;
    }

    generateOverviewContent(section) {
        const contentMap = {
            'aero': `
                <div class="template-card">
                    <div class="template-title">🛩️ Aerodynamics Team</div>
                    <p>Our aerodynamics team focuses on optimizing the car's aerodynamic performance through:</p>
                    <ul style="margin: 1rem 0; padding-left: 2rem;">
                        <li>CFD analysis and simulation</li>
                        <li>Wind tunnel testing</li>
                        <li>Wing and body design</li>
                        <li>Drag reduction strategies</li>
                    </ul>
                </div>
            `,
            'chassis': `
                <div class="template-card">
                    <div class="template-title">🏗️ Chassis Team</div>
                    <p>Our chassis team handles the structural integrity and manufacturing of the car:</p>
                    <ul style="margin: 1rem 0; padding-left: 2rem;">
                        <li>Monocoque design and analysis</li>
                        <li>Composite material selection</li>
                        <li>Safety regulations compliance</li>
                        <li>Manufacturing processes</li>
                    </ul>
                </div>
            `,
            'electrical': `
                <div class="template-card">
                    <div class="template-title">⚡ Electrical Team</div>
                    <p>Our electrical team manages all electronic systems and safety:</p>
                    <ul style="margin: 1rem 0; padding-left: 2rem;">
                        <li>Battery management systems</li>
                        <li>Motor controllers</li>
                        <li>Data acquisition</li>
                        <li>Safety systems and interlocks</li>
                    </ul>
                </div>
            `,
            'powertrain': `
                <div class="template-card">
                    <div class="template-title">🔋 Powertrain Team</div>
                    <p>Our powertrain team optimizes the electric drive system:</p>
                    <ul style="margin: 1rem 0; padding-left: 2rem;">
                        <li>Electric motor selection and optimization</li>
                        <li>Battery pack design and management</li>
                        <li>Thermal management systems</li>
                        <li>Power electronics and control</li>
                    </ul>
                </div>
            `,
            'vd': `
                <div class="template-card">
                    <div class="template-title">🚗 Vehicle Dynamics Team</div>
                    <p>Our vehicle dynamics team ensures optimal handling and performance:</p>
                    <ul style="margin: 1rem 0; padding-left: 2rem;">
                        <li>Suspension geometry and kinematics</li>
                        <li>Brake system design</li>
                        <li>Tire selection and optimization</li>
                        <li>Vehicle simulation and testing</li>
                    </ul>
                </div>
            `,
            'business': `
                <div class="template-card">
                    <div class="template-title">💼 Business Team</div>
                    <p>Our business team manages team operations and outreach:</p>
                    <ul style="margin: 1rem 0; padding-left: 2rem;">
                        <li>Sponsorship and fundraising</li>
                        <li>Social media and marketing</li>
                        <li>Event planning and coordination</li>
                        <li>Team outreach and recruitment</li>
                    </ul>
                </div>
            `,
            'management': `
                <div class="template-card">
                    <div class="template-title">🏢 Management Team</div>
                    <p>Our management team coordinates all aspects of the project:</p>
                    <ul style="margin: 1rem 0; padding-left: 2rem;">
                        <li>Project planning and scheduling</li>
                        <li>Budget management</li>
                        <li>Team coordination</li>
                        <li>Competition preparation</li>
                    </ul>
                </div>
            `
        };

        return contentMap[section] || '';
    }

    generateLearningResources(section) {
        const resources = {
            'aero': [
                { title: 'Introduction to CFD Analysis', difficulty: 'beginner', prereqs: 'Basic fluid mechanics' },
                { title: 'Advanced Wing Design Principles', difficulty: 'advanced', prereqs: 'CFD basics, aerodynamics theory' },
                { title: 'Manufacturing Carbon Fiber Components', difficulty: 'intermediate', prereqs: 'Basic composites knowledge' }
            ],
            'chassis': [
                { title: 'Composite Monocoque Design', difficulty: 'advanced', prereqs: 'Structural analysis, CAD proficiency' },
                { title: 'FEA for Crashworthiness', difficulty: 'advanced', prereqs: 'FEA fundamentals, safety regulations' },
                { title: 'CAD Best Practices', difficulty: 'beginner', prereqs: 'Basic CAD knowledge' }
            ],
            'electrical': [
                { title: 'High Voltage Safety Training', difficulty: 'beginner', prereqs: 'None - Required for all' },
                { title: 'PCB Design Fundamentals', difficulty: 'intermediate', prereqs: 'Circuit analysis' },
                { title: 'Embedded Systems Programming', difficulty: 'advanced', prereqs: 'C programming, microcontrollers' }
            ],
            'powertrain': [
                { title: 'Electric Motor Principles', difficulty: 'beginner', prereqs: 'Basic physics, electromagnetics' },
                { title: 'Thermal Management Systems', difficulty: 'intermediate', prereqs: 'Heat transfer fundamentals' },
                { title: 'Dyno Testing Procedures', difficulty: 'advanced', prereqs: 'Motor theory, data analysis' }
            ],
            'vd': [
                { title: 'Suspension Kinematics', difficulty: 'intermediate', prereqs: 'Mechanics, linear algebra' },
                { title: 'Vehicle Simulation Software', difficulty: 'advanced', prereqs: 'Vehicle dynamics theory' },
                { title: 'Data Acquisition Basics', difficulty: 'beginner', prereqs: 'Basic electronics' }
            ],
            'business': [
                { title: 'Sponsorship Proposal Writing', difficulty: 'beginner', prereqs: 'None' },
                { title: 'Cost Report Analysis', difficulty: 'intermediate', prereqs: 'Basic accounting' },
                { title: 'Social Media Strategy for STEM', difficulty: 'beginner', prereqs: 'Basic marketing knowledge' }
            ]
        };

        const sectionResources = resources[section] || [];
        
        let content = '<h2>📚 Learning Resources</h2>';
        
        sectionResources.forEach(resource => {
            content += `
                <div class="learning-resource">
                    <div style="flex: 1;">
                        <h4 style="margin: 0 0 0.5rem 0; color: #667eea;">${resource.title}</h4>
                        <p style="margin: 0; font-size: 0.9rem; color: #666;">Prerequisites: ${resource.prereqs}</p>
                    </div>
                    <div class="difficulty-badge difficulty-${resource.difficulty}">
                        ${resource.difficulty.charAt(0).toUpperCase() + resource.difficulty.slice(1)}
                    </div>
                </div>
            `;
        });

        return content;
    }

    updateNavigationActiveState(pageId) {
        // Remove active class from all nav items
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });

        // Add active class to current page nav item
        const navItem = this.findNavItemByPageId(pageId);
        if (navItem) {
            navItem.classList.add('active');
        }
    }

    findNavItemByPageId(pageId) {
        const navItems = document.querySelectorAll('.nav-item');
        for (let item of navItems) {
            const itemPageId = this.getPageIdFromNavItem(item);
            if (itemPageId === pageId) {
                return item;
            }
        }
        return null;
    }

    getPageIdFromNavItem(navItem) {
        const text = navItem.textContent.toLowerCase();
        const section = navItem.closest('.nav-section').querySelector('.nav-header span').textContent;
        
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

    showPermissionDenied() {
        const contentArea = document.getElementById('contentArea');
        contentArea.innerHTML = `
            <div class="permission-denied">
                <h2>Access Restricted</h2>
                <p>You don't have permission to view this content.</p>
                <p>Current role: <strong>${auth.getCurrentRole()}</strong></p>
                ${auth.getCurrentRole() === 'member' ? `<p>Subteam: <strong>${auth.getCurrentSubteam() || 'Not selected'}</strong></p>` : ''}
            </div>
        `;
    }

    editPage(pageId) {
        if (!auth.canEditPage(pageId, auth.getCurrentRole(), auth.getCurrentSubteam())) {
            auth.showError('You do not have permission to edit this page.');
            return;
        }

        // Get current page data
        const pageData = this.pages.get(pageId) || { title: '', content: '' };
        
        // Populate edit form
        document.getElementById('pageTitle').value = pageData.title || '';
        document.getElementById('pageContent').value = pageData.content || '';
        
        // Show edit modal
        document.getElementById('editModal').style.display = 'block';
    }

    async savePage() {
        const title = document.getElementById('pageTitle').value;
        const content = document.getElementById('pageContent').value;
        
        if (!title || !content) {
            auth.showError('Title and content are required.');
            return;
        }

        try {
            const response = await fetch(`/api/pages/${this.currentPage}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ title, content }),
            });

            if (response.ok) {
                // Update local cache
                this.pages.set(this.currentPage, { title, content });
                
                // Close modal and refresh page
                auth.closeModal('editModal');
                this.showPage(this.currentPage);
                
                auth.showSuccess('Page updated successfully!');
            } else {
                const error = await response.json();
                auth.showError(error.error || 'Failed to save page');
            }
        } catch (error) {
            console.error('Error saving page:', error);
            auth.showError('Network error. Please try again.');
        }
    }

    showUploadModal(pageId) {
        // This will be implemented in uploads.js
        if (window.uploads) {
            window.uploads.showUploadModal(pageId);
        }
    }

    showRevisions(pageId) {
        // This will be implemented in editor.js
        if (window.editor) {
            window.editor.showRevisions(pageId);
        }
    }

    async loadPageUploads(pageId) {
        try {
            const response = await fetch(`/api/pages/${pageId}/uploads`);
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.error('Error loading uploads:', error);
        }
        return [];
    }

    generateUploadsSection(uploads) {
        let content = '<h2>📎 Attachments</h2>';
        
        uploads.forEach(upload => {
            const fileIcon = upload.file_type === 'image' ? '🖼️' : '📄';
            const fileSize = this.formatFileSize(upload.file_size);
            
            content += `
                <div class="upload-item" style="display: flex; align-items: center; gap: 1rem; padding: 0.5rem; background: #f8f9fa; border-radius: 6px; margin: 0.5rem 0;">
                    <span style="font-size: 1.5rem;">${fileIcon}</span>
                    <div style="flex: 1;">
                        <div style="font-weight: 600;">${upload.original_name}</div>
                        <div style="font-size: 0.85rem; color: #666;">${fileSize} • Uploaded ${new Date(upload.uploaded_at).toLocaleDateString()}</div>
                    </div>
                    <a href="/uploads/${upload.filename}" target="_blank" class="btn btn-small btn-secondary">View</a>
                </div>
            `;
        });

        return content;
    }

    async refreshComments(pageId) {
        try {
            const res = await fetch(`/api/pages/${pageId}/comments`);
            const comments = res.ok ? await res.json() : [];
            this.renderComments(comments);
        } catch (e) {
            console.error('Comments load error', e);
            this.renderComments([]);
        }
    }

    renderComments(comments) {
        const list = document.getElementById('commentsList');
        if (!list) return;
        if (!comments || comments.length === 0) {
            list.innerHTML = '<div class="text-center" style="color:#666;">No comments yet. Be the first to comment.</div>';
            return;
        }
        let html = '';
        comments.forEach(c => {
            html += `
                <div class="comment-item" style="display:flex; gap:0.8rem; margin:0.6rem 0;">
                    <div class="avatar" style="width:36px;height:36px;border-radius:50%;background:#667eea22;display:flex;align-items:center;justify-content:center;color:#667eea;font-weight:700;">
                        ${c.username ? c.username.charAt(0).toUpperCase() : '?'}
                    </div>
                    <div style="flex:1;">
                        <div style="display:flex;justify-content:space-between;align-items:center;">
                            <strong>${c.username}</strong>
                            <span style="font-size:0.8rem;color:#999;">${new Date(c.created_at).toLocaleString()}</span>
                        </div>
                        <div style="margin-top:0.2rem;">${this.escapeHtml(c.comment)}</div>
                    </div>
                </div>
            `;
        });
        list.innerHTML = html;
    }

    async submitComment(pageId) {
        const input = document.getElementById('commentInput');
        if (!input) return;
        const text = input.value.trim();
        if (text.length === 0) return;
        try {
            const res = await fetch(`/api/pages/${pageId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ comment: text })
            });
            if (res.ok) {
                input.value = '';
                this.refreshComments(pageId);
            } else {
                const err = await res.json();
                auth.showError(err.error || 'Failed to post comment');
            }
        } catch (e) {
            console.error('Comment post error', e);
            auth.showError('Network error');
        }
    }

    escapeHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    generateDefaultPage(pageId) {
        const section = pageId.split('-')[0];
        const pageType = pageId.split('-')[1];
        
        return {
            title: `${section.charAt(0).toUpperCase() + section.slice(1)} ${pageType.charAt(0).toUpperCase() + pageType.slice(1)}`,
            content: this.generateTemplateContent(pageId),
            type: pageType
        };
    }

    // Public methods
    getCurrentPage() {
        return this.currentPage;
    }

    getPageData(pageId) {
        return this.pages.get(pageId);
    }
}

// Global functions for HTML onclick handlers
function showPage(pageId) {
    wiki.showPage(pageId);
}

function toggleSection(sectionName) {
    wiki.toggleSection(sectionName);
}

// Initialize wiki
const wiki = new Wiki();

// Export for use in other modules
window.wiki = wiki;