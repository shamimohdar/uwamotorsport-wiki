// Search Module - Real-time search functionality with result highlighting
class Search {
    constructor() {
        this.searchBox = null;
        this.searchResults = null;
        this.searchTimeout = null;
        this.currentQuery = '';
        this.init();
    }

    init() {
        this.searchBox = document.getElementById('searchBox');
        this.searchResults = document.getElementById('searchResults');
        this.bindEvents();
    }

    bindEvents() {
        // Search input events
        this.searchBox.addEventListener('input', (e) => {
            this.handleSearchInput(e.target.value);
        });

        // Search box focus
        this.searchBox.addEventListener('focus', () => {
            if (this.currentQuery && this.currentQuery.length >= 2) {
                this.showSearchResults();
            }
        });

        // Search box blur
        this.searchBox.addEventListener('blur', () => {
            // Delay hiding results to allow clicking on them
            setTimeout(() => {
                this.hideSearchResults();
            }, 200);
        });

        // Keyboard navigation
        this.searchBox.addEventListener('keydown', (e) => {
            this.handleKeyboardNavigation(e);
        });

        // Click outside to close results
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-container')) {
                this.hideSearchResults();
            }
        });
    }

    handleSearchInput(query) {
        this.currentQuery = query.trim();
        
        // Clear previous timeout
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }

        // Hide results if query is too short
        if (this.currentQuery.length < 2) {
            this.hideSearchResults();
            return;
        }

        // Debounce search requests
        this.searchTimeout = setTimeout(() => {
            this.performSearch(this.currentQuery);
        }, 300);
    }

    async performSearch(query) {
        if (!auth.isUserAuthenticated()) {
            return;
        }

        try {
            // Show loading state
            this.showLoadingState();

            const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
            
            if (response.ok) {
                const results = await response.json();
                this.displaySearchResults(results, query);
            } else {
                this.showErrorState('Search failed');
            }
        } catch (error) {
            console.error('Search error:', error);
            this.showErrorState('Network error');
        }
    }

    displaySearchResults(results, query) {
        if (results.length === 0) {
            this.showNoResultsState();
            return;
        }

        let html = '';
        
        results.forEach(result => {
            const highlightedTitle = this.highlightText(result.title, query);
            const highlightedSnippet = this.highlightText(result.snippet, query);
            
            html += `
                <div class="search-result-item" onclick="search.navigateToResult('${result.pageId}', '${query}')">
                    <div class="search-result-title">${highlightedTitle}</div>
                    <div class="search-result-snippet">${highlightedSnippet}</div>
                    <div class="search-result-meta">
                        <span class="search-result-page-id">${result.pageId}</span>
                        <span class="search-result-date">${this.formatDate(result.updatedAt)}</span>
                    </div>
                </div>
            `;
        });

        this.searchResults.innerHTML = html;
        this.showSearchResults();
    }

    highlightText(text, query) {
        if (!text || !query) return text;
        
        const regex = new RegExp(`(${this.escapeRegex(query)})`, 'gi');
        return text.replace(regex, '<span class="search-highlight">$1</span>');
    }

    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    formatDate(dateString) {
        if (!dateString) return 'Unknown';
        
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) return 'Today';
        if (diffDays === 2) return 'Yesterday';
        if (diffDays <= 7) return `${diffDays - 1} days ago`;
        if (diffDays <= 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        if (diffDays <= 365) return `${Math.floor(diffDays / 30)} months ago`;
        
        return date.toLocaleDateString();
    }

    showLoadingState() {
        this.searchResults.innerHTML = `
            <div class="search-loading">
                Searching...
            </div>
        `;
        this.showSearchResults();
    }

    showErrorState(message) {
        this.searchResults.innerHTML = `
            <div class="search-no-results">
                <div class="search-no-results-icon">⚠️</div>
                <div>${message}</div>
            </div>
        `;
        this.showSearchResults();
    }

    showNoResultsState() {
        this.searchResults.innerHTML = `
            <div class="search-no-results">
                <div class="search-no-results-icon">🔍</div>
                <div>No results found for "${this.currentQuery}"</div>
                <div style="font-size: 0.8rem; margin-top: 0.5rem; color: #999;">
                    Try different keywords or check spelling
                </div>
            </div>
        `;
        this.showSearchResults();
    }

    showSearchResults() {
        this.searchResults.classList.add('active');
    }

    hideSearchResults() {
        this.searchResults.classList.remove('active');
    }

    handleKeyboardNavigation(e) {
        const resultItems = this.searchResults.querySelectorAll('.search-result-item');
        const currentIndex = Array.from(resultItems).findIndex(item => 
            item.classList.contains('highlighted')
        );

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.navigateResults(resultItems, currentIndex, 1);
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.navigateResults(resultItems, currentIndex, -1);
                break;
            case 'Enter':
                e.preventDefault();
                if (currentIndex >= 0 && resultItems[currentIndex]) {
                    resultItems[currentIndex].click();
                }
                break;
            case 'Escape':
                this.hideSearchResults();
                this.searchBox.blur();
                break;
        }
    }

    navigateResults(resultItems, currentIndex, direction) {
        // Remove current highlight
        if (currentIndex >= 0 && resultItems[currentIndex]) {
            resultItems[currentIndex].classList.remove('highlighted');
        }

        // Calculate new index
        let newIndex = currentIndex + direction;
        if (newIndex < 0) newIndex = resultItems.length - 1;
        if (newIndex >= resultItems.length) newIndex = 0;

        // Add highlight to new item
        if (resultItems[newIndex]) {
            resultItems[newIndex].classList.add('highlighted');
            resultItems[newIndex].scrollIntoView({ 
                block: 'nearest',
                behavior: 'smooth'
            });
        }
    }

    navigateToResult(pageId, query) {
        // Navigate to the page
        if (wiki && typeof wiki.showPage === 'function') {
            wiki.showPage(pageId);
        }

        // Clear search
        this.searchBox.value = '';
        this.currentQuery = '';
        this.hideSearchResults();

        // Highlight the search term on the page
        this.highlightSearchTermOnPage(query);
    }

    highlightSearchTermOnPage(query) {
        if (!query || query.length < 2) return;

        // Remove existing highlights
        this.removeExistingHighlights();

        // Find and highlight text in the page content
        const pageContent = document.querySelector('.page-content');
        if (!pageContent) return;

        this.highlightTextInElement(pageContent, query);
    }

    highlightTextInElement(element, query) {
        const walker = document.createTreeWalker(
            element,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );

        const textNodes = [];
        let node;
        while (node = walker.nextNode()) {
            textNodes.push(node);
        }

        textNodes.forEach(textNode => {
            const text = textNode.textContent;
            const regex = new RegExp(`(${this.escapeRegex(query)})`, 'gi');
            
            if (regex.test(text)) {
                const highlightedText = text.replace(regex, '<span class="search-highlight">$1</span>');
                const span = document.createElement('span');
                span.innerHTML = highlightedText;
                textNode.parentNode.replaceChild(span, textNode);
            }
        });
    }

    removeExistingHighlights() {
        const existingHighlights = document.querySelectorAll('.search-highlight');
        existingHighlights.forEach(highlight => {
            const parent = highlight.parentNode;
            parent.replaceChild(document.createTextNode(highlight.textContent), highlight);
            parent.normalize(); // Merge adjacent text nodes
        });
    }

    // Public methods
    getCurrentQuery() {
        return this.currentQuery;
    }

    clearSearch() {
        this.searchBox.value = '';
        this.currentQuery = '';
        this.hideSearchResults();
        this.removeExistingHighlights();
    }

    focusSearch() {
        this.searchBox.focus();
    }

    // Search suggestions (can be extended later)
    getSearchSuggestions(query) {
        const suggestions = [
            'aerodynamics',
            'chassis design',
            'electrical systems',
            'powertrain',
            'vehicle dynamics',
            'business plan',
            'management',
            'testing procedures',
            'safety protocols',
            'manufacturing'
        ];

        return suggestions.filter(suggestion => 
            suggestion.toLowerCase().includes(query.toLowerCase())
        );
    }

    // Search history (can be implemented later)
    addToSearchHistory(query) {
        if (!query || query.length < 2) return;
        
        let history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
        history = history.filter(item => item !== query);
        history.unshift(query);
        history = history.slice(0, 10); // Keep only last 10 searches
        
        localStorage.setItem('searchHistory', JSON.stringify(history));
    }

    getSearchHistory() {
        return JSON.parse(localStorage.getItem('searchHistory') || '[]');
    }

    clearSearchHistory() {
        localStorage.removeItem('searchHistory');
    }
}

// Initialize search
const search = new Search();

// Export for use in other modules
window.search = search;