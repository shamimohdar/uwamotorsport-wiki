// Uploads Module - File upload functionality
class Uploads {
    constructor() {
        this.currentPageId = null;
        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        // Upload form submission
        const uploadForm = document.getElementById('uploadForm');
        if (uploadForm) {
            uploadForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleUpload();
            });
        }

        // File input change event for validation and preview
        const fileInput = document.getElementById('uploadFile');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    this.validateFile(file);
                    this.previewFile(file);
                }
            });
        }

        // Upload type change event
        const uploadType = document.getElementById('uploadType');
        if (uploadType) {
            uploadType.addEventListener('change', (e) => {
                this.updateFileInputAccept(e.target.value);
            });
        }
    }

    showUploadModal(pageId) {
        if (!auth.isUserAuthenticated()) {
            auth.showError('Please log in to upload files.');
            return;
        }

        const role = auth.getCurrentRole();
        const subteam = auth.getCurrentSubteam();

        if (!auth.canEditPage(pageId, role, subteam)) {
            auth.showError('You do not have permission to upload files to this page.');
            return;
        }

        this.currentPageId = pageId;
        
        // Reset form
        document.getElementById('uploadForm').reset();
        this.updateFileInputAccept('image'); // Default to image
        
        // Show modal
        document.getElementById('uploadModal').style.display = 'block';
        
        // Focus on file input
        setTimeout(() => {
            document.getElementById('uploadFile').focus();
        }, 100);
    }

    updateFileInputAccept(type) {
        const fileInput = document.getElementById('uploadFile');
        if (!fileInput) return;

        if (type === 'image') {
            fileInput.accept = 'image/*';
        } else if (type === 'document') {
            fileInput.accept = '.pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain';
        } else {
            fileInput.accept = '';
        }
    }

    validateFile(file) {
        if (!file) return true;

        const uploadType = document.getElementById('uploadType').value;
        const maxSize = 10 * 1024 * 1024; // 10MB

        // Check file size
        if (file.size > maxSize) {
            this.showError('File size must be less than 10MB');
            return false;
        }

        // Check file type
        if (uploadType === 'image') {
            if (!file.type.startsWith('image/')) {
                this.showError('Please select an image file');
                return false;
            }
        } else if (uploadType === 'document') {
            const allowedTypes = [
                'application/pdf',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'text/plain'
            ];
            if (!allowedTypes.includes(file.type)) {
                this.showError('Please select a PDF, DOCX, or TXT file');
                return false;
            }
        }

        this.clearError();
        return true;
    }

    async handleUpload() {
        const fileInput = document.getElementById('uploadFile');
        const uploadType = document.getElementById('uploadType').value;
        const file = fileInput.files[0];

        if (!file) {
            this.showError('Please select a file to upload');
            return;
        }

        if (!this.validateFile(file)) {
            return;
        }

        if (!this.currentPageId) {
            this.showError('No page selected for upload');
            return;
        }

        try {
            // Show loading state
            this.showUploadProgress(true);

            const formData = new FormData();
            formData.append('file', file);
            formData.append('pageId', this.currentPageId);
            
            // Set the correct field name based on upload type
            if (uploadType === 'image') {
                // Remove the file and re-add it with the correct field name
                formData.delete('file');
                formData.append('image', file);
            } else if (uploadType === 'document') {
                formData.delete('file');
                formData.append('document', file);
            }

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (response.ok && result.success) {
                auth.showSuccess(`File "${file.name}" uploaded successfully!`);
                
                // Close modal
                auth.closeModal('uploadModal');
                
                // Refresh the current page to show the new upload
                if (wiki && wiki.getCurrentPage() === this.currentPageId) {
                    wiki.showPage(this.currentPageId);
                }
            } else {
                this.showError(result.error || 'Upload failed');
            }
        } catch (error) {
            console.error('Upload error:', error);
            this.showError('Network error. Please try again.');
        } finally {
            this.showUploadProgress(false);
        }
    }

    showUploadProgress(show) {
        const submitBtn = document.querySelector('#uploadForm button[type="submit"]');
        const fileInput = document.getElementById('uploadFile');
        
        if (show) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Uploading...';
            fileInput.disabled = true;
        } else {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Upload';
            fileInput.disabled = false;
        }
    }

    showError(message) {
        this.clearError();
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'upload-error';
        errorDiv.style.cssText = `
            background: #f8d7da;
            color: #721c24;
            padding: 0.5rem;
            border-radius: 4px;
            margin-top: 0.5rem;
            font-size: 0.9rem;
            border: 1px solid #f5c6cb;
        `;
        errorDiv.textContent = message;
        
        const uploadForm = document.getElementById('uploadForm');
        if (uploadForm) {
            uploadForm.appendChild(errorDiv);
        }
    }

    clearError() {
        const existingError = document.querySelector('.upload-error');
        if (existingError) {
            existingError.remove();
        }
    }

    // Get uploads for a specific page
    async getUploadsForPage(pageId) {
        try {
            const response = await fetch(`/api/pages/${pageId}/uploads`);
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.error('Error fetching uploads:', error);
        }
        return [];
    }

    // Delete upload (if implemented server-side)
    async deleteUpload(uploadId) {
        if (!confirm('Are you sure you want to delete this file?')) {
            return;
        }

        try {
            const response = await fetch(`/api/uploads/${uploadId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                auth.showSuccess('File deleted successfully');
                
                // Refresh current page if it matches
                if (wiki && this.currentPageId) {
                    wiki.showPage(this.currentPageId);
                }
            } else {
                const error = await response.json();
                auth.showError(error.error || 'Failed to delete file');
            }
        } catch (error) {
            console.error('Delete error:', error);
            auth.showError('Network error. Please try again.');
        }
    }

    // Format file size for display
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Get file icon based on type
    getFileIcon(fileType, mimeType) {
        if (fileType === 'image' || (mimeType && mimeType.startsWith('image/'))) {
            return '🖼️';
        } else if (mimeType) {
            if (mimeType === 'application/pdf') return '📄';
            if (mimeType.includes('word')) return '📝';
            if (mimeType === 'text/plain') return '📃';
        }
        return '📄';
    }

    // Preview file before upload (for images)
    previewFile(file) {
        if (!file || !file.type.startsWith('image/')) {
            this.clearPreview();
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            let previewContainer = document.querySelector('.upload-preview');
            if (!previewContainer) {
                previewContainer = document.createElement('div');
                previewContainer.className = 'upload-preview';
                previewContainer.style.cssText = `
                    margin-top: 1rem;
                    text-align: center;
                `;
                document.getElementById('uploadForm').appendChild(previewContainer);
            }

            previewContainer.innerHTML = `
                <img src="${e.target.result}" alt="Preview" style="
                    max-width: 200px;
                    max-height: 200px;
                    border-radius: 4px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                ">
                <p style="margin-top: 0.5rem; font-size: 0.8rem; color: #666;">
                    ${file.name} (${this.formatFileSize(file.size)})
                </p>
            `;
        };
        reader.readAsDataURL(file);
    }

    clearPreview() {
        const previewContainer = document.querySelector('.upload-preview');
        if (previewContainer) {
            previewContainer.remove();
        }
    }

    // Public methods
    getCurrentPageId() {
        return this.currentPageId;
    }

    setCurrentPageId(pageId) {
        this.currentPageId = pageId;
    }
}

// Initialize uploads module
const uploads = new Uploads();

// Export for use in other modules
window.uploads = uploads;