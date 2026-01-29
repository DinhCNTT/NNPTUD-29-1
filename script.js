// ========================================
// Configuration & State
// ========================================

// GitHub Raw URL for db.json - Update this with your GitHub repo URL
// Format: https://raw.githubusercontent.com/USERNAME/REPO/BRANCH/db.json
const GITHUB_DB_URL = 'https://raw.githubusercontent.com/DinhCNTT/NNPTUD-29-1/main/db.json';

// Fallback to local file if GitHub fails
const LOCAL_DB_URL = './db.json';

// Application State
let allProducts = [];
let filteredProducts = [];
let categories = [];
let currentCategory = 'all';
let currentSearchTerm = '';
let currentSort = 'default';

// ========================================
// DOM Elements
// ========================================
const elements = {
    searchInput: document.getElementById('searchInput'),
    categoryFilters: document.getElementById('categoryFilters'),
    productsGrid: document.getElementById('productsGrid'),
    productsStats: document.getElementById('productsStats'),
    loadingContainer: document.getElementById('loadingContainer'),
    emptyState: document.getElementById('emptyState'),
    sortSelect: document.getElementById('sortSelect'),
    modalOverlay: document.getElementById('modalOverlay'),
    modalContent: document.getElementById('modalContent'),
    modalClose: document.getElementById('modalClose'),
    backToTop: document.getElementById('backToTop'),
    totalProducts: document.getElementById('totalProducts'),
    totalCategories: document.getElementById('totalCategories')
};

// ========================================
// Category Icons Mapping
// ========================================
const categoryIcons = {
    'clothes': '👕',
    'electronics': '📱',
    'shoes': '👟',
    'furniture': '🛋️',
    'miscellaneous': '📦',
    'default': '🏷️'
};

// ========================================
// Data Fetching
// ========================================
async function fetchProducts() {
    try {
        showLoading(true);

        // Try fetching from GitHub first
        let response = await fetch(GITHUB_DB_URL);

        if (!response.ok) {
            console.log('GitHub fetch failed, trying local file...');
            response = await fetch(LOCAL_DB_URL);
        }

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        allProducts = data;
        filteredProducts = [...allProducts];

        // Extract unique categories
        extractCategories();

        // Update UI
        renderCategoryFilters();
        renderProducts();
        updateStats();

        showLoading(false);

    } catch (error) {
        console.error('Error fetching products:', error);
        showLoading(false);
        showError('Failed to load products. Please check your connection and try again.');
    }
}

function extractCategories() {
    const categoryMap = new Map();

    allProducts.forEach(product => {
        if (product.category && !categoryMap.has(product.category.id)) {
            categoryMap.set(product.category.id, product.category);
        }
    });

    categories = Array.from(categoryMap.values());
}

// ========================================
// Rendering Functions
// ========================================
function renderCategoryFilters() {
    // Keep the "All Products" button
    let html = `
        <button class="category-btn active" data-category="all">
            <span class="category-icon">🌟</span>
            <span>All Products</span>
        </button>
    `;

    categories.forEach(category => {
        const icon = categoryIcons[category.slug] || categoryIcons.default;
        html += `
            <button class="category-btn" data-category="${category.id}">
                <span class="category-icon">${icon}</span>
                <span>${category.name}</span>
            </button>
        `;
    });

    elements.categoryFilters.innerHTML = html;

    // Add event listeners
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', handleCategoryClick);
    });
}

function renderProducts() {
    if (filteredProducts.length === 0) {
        elements.productsGrid.innerHTML = '';
        elements.emptyState.style.display = 'block';
        return;
    }

    elements.emptyState.style.display = 'none';

    const html = filteredProducts.map((product, index) => {
        const image = product.images && product.images[0]
            ? product.images[0]
            : 'https://placehold.co/600x400/1a1a2e/667eea?text=No+Image';

        const categoryName = product.category?.name || 'Uncategorized';
        const description = product.description || 'No description available';

        return `
            <article class="product-card" 
                     data-product-id="${product.id}" 
                     style="animation-delay: ${index * 0.05}s">
                <div class="product-image-container">
                    <img src="${image}" 
                         alt="${escapeHtml(product.title)}" 
                         class="product-image"
                         loading="lazy"
                         onerror="this.src='https://placehold.co/600x400/1a1a2e/667eea?text=No+Image'">
                    <span class="product-category-badge">${escapeHtml(categoryName)}</span>
                </div>
                <div class="product-content">
                    <h3 class="product-title">${escapeHtml(product.title)}</h3>
                    <p class="product-description">${escapeHtml(description)}</p>
                    <div class="product-footer">
                        <span class="product-price">$${formatPrice(product.price)}</span>
                        <button class="product-btn" onclick="openProductModal(${product.id})">
                            View Details
                        </button>
                    </div>
                </div>
            </article>
        `;
    }).join('');

    elements.productsGrid.innerHTML = html;

    // Add click event to cards
    document.querySelectorAll('.product-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (!e.target.classList.contains('product-btn')) {
                const productId = parseInt(card.dataset.productId);
                openProductModal(productId);
            }
        });
    });
}

function renderProductModal(product) {
    const image = product.images && product.images[0]
        ? product.images[0]
        : 'https://placehold.co/800x400/1a1a2e/667eea?text=No+Image';

    const categoryName = product.category?.name || 'Uncategorized';
    const description = product.description || 'No description available';
    const createdAt = product.creationAt ? new Date(product.creationAt).toLocaleDateString() : 'N/A';
    const updatedAt = product.updatedAt ? new Date(product.updatedAt).toLocaleDateString() : 'N/A';

    const html = `
        <img src="${image}" 
             alt="${escapeHtml(product.title)}" 
             class="modal-image"
             onerror="this.src='https://placehold.co/800x400/1a1a2e/667eea?text=No+Image'">
        <div class="modal-body">
            <span class="modal-category">${escapeHtml(categoryName)}</span>
            <h2 class="modal-title">${escapeHtml(product.title)}</h2>
            <p class="modal-description">${escapeHtml(description)}</p>
            <div class="modal-price">$${formatPrice(product.price)}</div>
            <div class="modal-meta">
                <div class="meta-item">
                    <span class="meta-label">Product ID</span>
                    <span class="meta-value">#${product.id}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">Slug</span>
                    <span class="meta-value">${product.slug || 'N/A'}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">Created</span>
                    <span class="meta-value">${createdAt}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">Updated</span>
                    <span class="meta-value">${updatedAt}</span>
                </div>
            </div>
        </div>
    `;

    elements.modalContent.innerHTML = html;
}

function updateStats() {
    const count = filteredProducts.length;
    const total = allProducts.length;

    if (count === total) {
        elements.productsStats.innerHTML = `<span class="stats-count">Showing all ${count} products</span>`;
    } else {
        elements.productsStats.innerHTML = `<span class="stats-count">Showing ${count} of ${total} products</span>`;
    }

    // Update footer stats
    elements.totalProducts.textContent = total;
    elements.totalCategories.textContent = categories.length;
}

// ========================================
// Filtering & Sorting
// ========================================
function filterProducts() {
    filteredProducts = allProducts.filter(product => {
        // Category filter
        const matchCategory = currentCategory === 'all' ||
            (product.category && product.category.id === parseInt(currentCategory));

        // Search filter
        const searchLower = currentSearchTerm.toLowerCase();
        const matchSearch = !currentSearchTerm ||
            product.title.toLowerCase().includes(searchLower) ||
            (product.description && product.description.toLowerCase().includes(searchLower)) ||
            (product.category && product.category.name.toLowerCase().includes(searchLower));

        return matchCategory && matchSearch;
    });

    sortProducts();
    renderProducts();
    updateStats();
}

function sortProducts() {
    switch (currentSort) {
        case 'price-low':
            filteredProducts.sort((a, b) => a.price - b.price);
            break;
        case 'price-high':
            filteredProducts.sort((a, b) => b.price - a.price);
            break;
        case 'name-asc':
            filteredProducts.sort((a, b) => a.title.localeCompare(b.title));
            break;
        case 'name-desc':
            filteredProducts.sort((a, b) => b.title.localeCompare(a.title));
            break;
        default:
            // Keep original order
            break;
    }
}

// ========================================
// Event Handlers
// ========================================
function handleCategoryClick(e) {
    const btn = e.currentTarget;

    // Update active state
    document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    currentCategory = btn.dataset.category;
    filterProducts();
}

function handleSearchInput(e) {
    currentSearchTerm = e.target.value.trim();

    // Debounce search
    clearTimeout(window.searchTimeout);
    window.searchTimeout = setTimeout(() => {
        filterProducts();
    }, 300);
}

function handleSortChange(e) {
    currentSort = e.target.value;
    filterProducts();
}

function openProductModal(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;

    renderProductModal(product);
    elements.modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    elements.modalOverlay.classList.remove('active');
    document.body.style.overflow = '';
}

function handleScroll() {
    if (window.scrollY > 500) {
        elements.backToTop.classList.add('visible');
    } else {
        elements.backToTop.classList.remove('visible');
    }
}

function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// ========================================
// Utility Functions
// ========================================
function showLoading(show) {
    elements.loadingContainer.style.display = show ? 'flex' : 'none';
    elements.productsGrid.style.display = show ? 'none' : 'grid';
}

function showError(message) {
    elements.productsGrid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
            <div class="empty-icon">❌</div>
            <h3>Oops! Something went wrong</h3>
            <p>${message}</p>
            <button class="product-btn" style="margin-top: 20px;" onclick="fetchProducts()">
                Try Again
            </button>
        </div>
    `;
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatPrice(price) {
    return Number(price).toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    });
}

// ========================================
// Initialize Application
// ========================================
function init() {
    // Fetch products
    fetchProducts();

    // Event Listeners
    elements.searchInput.addEventListener('change', handleSearchInput);
    // Also add input event for better UX (real-time search)
    elements.searchInput.addEventListener('input', handleSearchInput);
    elements.sortSelect.addEventListener('change', handleSortChange);
    elements.modalClose.addEventListener('click', closeModal);
    elements.modalOverlay.addEventListener('click', (e) => {
        if (e.target === elements.modalOverlay) {
            closeModal();
        }
    });
    elements.backToTop.addEventListener('click', scrollToTop);

    // Scroll event for back to top button
    window.addEventListener('scroll', handleScroll);

    // Keyboard events
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
        }
    });
}

// Start the application
document.addEventListener('DOMContentLoaded', init);

// Make openProductModal globally accessible
window.openProductModal = openProductModal;
