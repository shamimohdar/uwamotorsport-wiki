// Editor Module - Rich text editing and revision management
class Editor {
    constructor() {
        this.currentPageId = null;
        this.isEditing = false;
        this.autoSaveInterval = null;
        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        // Enhanced edit form handling
        const editForm = document.getElementById('editForm');
        if (editForm) {
            editForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveCurrentEdit();
            });
        }

        // Auto-save functionality
        const pageContent = document.getElementById('pageContent');
        if (pageContent) {
            pageContent.addEventListener('input', () => {
                this.scheduleAutoSave();
            });
        }

        // Keyboard shortcuts for editing
        document.addEventListener('keydown', (e) => {
            if (this.isEditing) {
                this.handleEditorKeyboard(e);
            }
        });
    }

    async showRevisions(pageId) {
        if (!auth.isUserAuthenticated()) {
            auth.showError('Please log in to view revisions.');
            return;
        }

        this.currentPageId = pageId;

        try {
            // Fetch revisions from server
            const response = await fetch(`/api/pages/${pageId}/revisions`);
            
            if (response.ok) {
                const revisions = await response.json();
                this.displayRevisions(revisions);
            } else {
                const error = await response.json();
                auth.showError(error.error || 'Failed to load revisions');
            }
        } catch (error) {
            console.error('Error loading revisions:', error);
            auth.showError('Network error. Please try again.');
        }
    }

    displayRevisions(revisions) {
        const revisionsList = document.getElementById('revisionsList');
        if (!revisionsList) return;

        if (!revisions || revisions.length === 0) {
            revisionsList.innerHTML = `
                <div class="text-center" style="padding: 2rem; color: #666;">
                    <p>📝 No revisions found for this page.</p>
                    <p style="font-size: 0.9rem;">Revisions will appear here after you make edits.</p>
                </div>
            `;
        } else {
            let html = '<div class="revisions-list">';
            
            revisions.forEach((revision, index) => {
                const date = new Date(revision.edited_at).toLocaleString();
                const isLatest = index === 0;
                
                html += `
                    <div class="revision-item" style="
                        border: 1px solid #e1e5e9;
                        border-radius: 8px;
                        margin-bottom: 1rem;
                        ${isLatest ? 'border-color: #667eea; background: rgba(102, 126, 234, 0.02);' : ''}
                    ">
                        <div class="revision-header" style="
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                            padding: 1rem;
                            border-bottom: 1px solid #e1e5e9;
                            background: ${isLatest ? 'rgba(102, 126, 234, 0.05)' : '#f8f9fa'};
                        ">
                            <div>
                                <strong style="color: #333;">
                                    ${isLatest ? '🌟 ' : ''}Revision by ${revision.username}
                                </strong>
                                <div style="font-size: 0.85rem; color: #666; margin-top: 0.2rem;">
                                    ${date} ${isLatest ? '(Latest)' : ''}
                                </div>
                            </div>
                            <div class="revision-actions" style="display: flex; gap: 0.5rem;">
                                <button class="btn btn-small btn-secondary" 
                                        onclick="editor.previewRevision(${revision.id})"
                                        style="padding: 0.4rem 0.8rem; font-size: 0.8rem;">
                                    👁️ Preview
                                </button>
                                ${!isLatest ? `
                                <button class="btn btn-small btn-primary" 
                                        onclick="editor.restoreRevision(${revision.id})"
                                        style="padding: 0.4rem 0.8rem; font-size: 0.8rem;">
                                    🔄 Restore
                                </button>
                                ` : ''}
                            </div>
                        </div>
                        <div class="revision-preview" id="revision-${revision.id}" style="
                            padding: 1rem;
                            max-height: 200px;
                            overflow-y: auto;
                            display: none;
                            font-size: 0.9rem;
                            line-height: 1.4;
                            background: white;
                        ">
                            <div style="white-space: pre-wrap;">${this.truncateContent(revision.content, 500)}</div>
                        </div>
                    </div>
                `;
            });
            
            html += '</div>';
            revisionsList.innerHTML = html;
        }

        // Show the revisions modal
        document.getElementById('revisionsModal').style.display = 'block';
    }

    previewRevision(revisionId) {
        const previewElement = document.getElementById(`revision-${revisionId}`);
        if (previewElement) {
            if (previewElement.style.display === 'none') {
                previewElement.style.display = 'block';
            } else {
                previewElement.style.display = 'none';
            }
        }
    }

    async restoreRevision(revisionId) {
        if (!confirm('Are you sure you want to restore this revision? This will overwrite the current content.')) {
            return;
        }

        try {
            const response = await fetch(`/api/revisions/${revisionId}/restore`, {
                method: 'POST'
            });

            if (response.ok) {
                auth.showSuccess('Revision restored successfully!');
                auth.closeModal('revisionsModal');
                
                // Refresh the current page
                if (wiki && this.currentPageId) {
                    wiki.showPage(this.currentPageId);
                }
            } else {
                const error = await response.json();
                auth.showError(error.error || 'Failed to restore revision');
            }
        } catch (error) {
            console.error('Error restoring revision:', error);
            auth.showError('Network error. Please try again.');
        }
    }

    truncateContent(content, maxLength) {
        if (!content) return 'No content';
        
        if (content.length <= maxLength) {
            return content;
        }
        
        return content.substring(0, maxLength) + '...';
    }

    async saveCurrentEdit() {
        const title = document.getElementById('pageTitle').value;
        const content = document.getElementById('pageContent').value;
        
        if (!title || !content) {
            auth.showError('Title and content are required.');
            return;
        }

        if (!this.currentPageId) {
            this.currentPageId = wiki ? wiki.getCurrentPage() : null;
        }

        if (!this.currentPageId) {
            auth.showError('No page selected for editing.');
            return;
        }

        try {
            this.showSaveProgress(true);

            const response = await fetch(`/api/pages/${this.currentPageId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ title, content }),
            });

            if (response.ok) {
                auth.showSuccess('Page saved successfully!');
                auth.closeModal('editModal');
                
                // Refresh the current page
                if (wiki) {
                    wiki.showPage(this.currentPageId);
                }
                
                this.isEditing = false;
                this.clearAutoSave();
            } else {
                const error = await response.json();
                auth.showError(error.error || 'Failed to save page');
            }
        } catch (error) {
            console.error('Error saving page:', error);
            auth.showError('Network error. Please try again.');
        } finally {
            this.showSaveProgress(false);
        }
    }

    showSaveProgress(show) {
        const saveBtn = document.querySelector('#editForm button[type="submit"]');
        const titleInput = document.getElementById('pageTitle');
        const contentInput = document.getElementById('pageContent');
        
        if (show) {
            saveBtn.disabled = true;
            saveBtn.textContent = 'Saving...';
            titleInput.disabled = true;
            contentInput.disabled = true;
        } else {
            saveBtn.disabled = false;
            saveBtn.textContent = 'Save Changes';
            titleInput.disabled = false;
            contentInput.disabled = false;
        }
    }

    scheduleAutoSave() {
        if (this.autoSaveInterval) {
            clearTimeout(this.autoSaveInterval);
        }

        this.autoSaveInterval = setTimeout(() => {
            this.performAutoSave();
        }, 2000); // Auto-save after 2 seconds of inactivity
    }

    async performAutoSave() {
        if (!this.isEditing) return;

        const title = document.getElementById('pageTitle').value;
        const content = document.getElementById('pageContent').value;

        if (!title || !content || !this.currentPageId) return;

        try {
            // Save as draft (you could implement a separate draft endpoint)
            localStorage.setItem(`draft_${this.currentPageId}`, JSON.stringify({
                title,
                content,
                timestamp: new Date().toISOString()
            }));

            this.showAutoSaveIndicator('saved');
        } catch (error) {
            console.error('Auto-save error:', error);
            this.showAutoSaveIndicator('error');
        }
    }

    showAutoSaveIndicator(status) {
        let indicator = document.querySelector('.auto-save-indicator');
        
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.className = 'auto-save-indicator';
            document.body.appendChild(indicator);
        }

        indicator.classList.remove('show', 'saving', 'error');
        
        switch (status) {
            case 'saving':
                indicator.textContent = '💾 Saving draft...';
                indicator.classList.add('saving');
                break;
            case 'saved':
                indicator.textContent = '✅ Draft saved';
                break;
            case 'error':
                indicator.textContent = '❌ Save failed';
                indicator.classList.add('error');
                break;
        }

        indicator.classList.add('show');

        setTimeout(() => {
            indicator.classList.remove('show');
        }, 2000);
    }

    loadDraft(pageId) {
        try {
            const draftData = localStorage.getItem(`draft_${pageId}`);
            if (draftData) {
                const draft = JSON.parse(draftData);
                const draftAge = new Date() - new Date(draft.timestamp);
                
                // Only load drafts newer than 1 hour
                if (draftAge < 60 * 60 * 1000) {
                    return draft;
                } else {
                    // Remove old draft
                    localStorage.removeItem(`draft_${pageId}`);
                }
            }
        } catch (error) {
            console.error('Error loading draft:', error);
        }
        return null;
    }

    clearAutoSave() {
        if (this.autoSaveInterval) {
            clearTimeout(this.autoSaveInterval);
            this.autoSaveInterval = null;
        }
    }

    clearDraft(pageId) {
        try {
            localStorage.removeItem(`draft_${pageId}`);
        } catch (error) {
            console.error('Error clearing draft:', error);
        }
    }

    handleEditorKeyboard(e) {
        // Ctrl/Cmd + S to save
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            this.saveCurrentEdit();
        }
        
        // Escape to cancel
        if (e.key === 'Escape') {
            if (confirm('Are you sure you want to cancel editing? Unsaved changes will be lost.')) {
                auth.closeModal('editModal');
                this.isEditing = false;
                this.clearAutoSave();
            }
        }
    }

    // Enhanced edit functionality for wiki
    startEdit(pageId) {
        this.currentPageId = pageId;
        this.isEditing = true;
        
        // Load draft if available
        const draft = this.loadDraft(pageId);
        if (draft && confirm('A draft was found for this page. Would you like to restore it?')) {
            document.getElementById('pageTitle').value = draft.title;
            document.getElementById('pageContent').value = draft.content;
        }
    }

    // Text formatting functions (can be extended with a rich text editor)
    insertText(textarea, textToInsert) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        
        textarea.value = text.substring(0, start) + textToInsert + text.substring(end);
        textarea.setSelectionRange(start + textToInsert.length, start + textToInsert.length);
        textarea.focus();
    }

    wrapSelection(textarea, prefix, suffix = '') {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = textarea.value.substring(start, end);
        const replacement = prefix + selectedText + suffix;
        
        textarea.setRangeText(replacement);
        textarea.setSelectionRange(start + prefix.length, start + prefix.length + selectedText.length);
        textarea.focus();
    }

    // Formatting toolbar functions
    makeBold() {
        const textarea = document.getElementById('pageContent');
        this.wrapSelection(textarea, '**', '**');
    }

    makeItalic() {
        const textarea = document.getElementById('pageContent');
        this.wrapSelection(textarea, '*', '*');
    }

    insertLink() {
        const textarea = document.getElementById('pageContent');
        const url = prompt('Enter URL:');
        if (url) {
            const text = prompt('Enter link text:', url);
            this.insertText(textarea, `[${text || url}](${url})`);
        }
    }

    insertHeading(level = 2) {
        const textarea = document.getElementById('pageContent');
        const prefix = '#'.repeat(level) + ' ';
        this.insertText(textarea, prefix);
    }

    // Public methods
    getCurrentPageId() {
        return this.currentPageId;
    }

    setCurrentPageId(pageId) {
        this.currentPageId = pageId;
    }

    getIsEditing() {
        return this.isEditing;
    }
}

// Initialize editor module
const editor = new Editor();

// Export for use in other modules
window.editor = editor;