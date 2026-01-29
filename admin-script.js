// ========================================
// Configuration & State
// ========================================

// GitHub Raw URL for db.json
const GITHUB_DB_URL = 'https://raw.githubusercontent.com/DinhCNTT/NNPTUD-29-1/main/db.json';
const LOCAL_DB_URL = './db.json';

// Application State
let allProducts = [];
let filteredProducts = [];
let currentSearchTerm = '';
let currentSort = 'default';

// ========================================
// DOM Elements
// ========================================
const elements = {
    searchInput: document.getElementById('searchInput'),
    productTableBody: document.getElementById('productTableBody'),
    loadingState: document.getElementById('loadingState'),
    tableContainer: document.getElementById('tableContainer'),
    emptyState: document.getElementById('emptyState'),
    totalProducts: document.getElementById('totalProducts'),
    showingProducts: document.getElementById('showingProducts'),
    totalCategories: document.getElementById('totalCategories')
};

// ========================================
// Data Fetching
// ========================================
async function fetchProducts() {
    try {
        showLoading(true);

        // Try GitHub first, fallback to local
        let response = await fetch(GITHUB_DB_URL);
        if (!response.ok) {
            console.log('GitHub fetch failed, trying local...');
            response = await fetch(LOCAL_DB_URL);
        }

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        allProducts = data;
        filteredProducts = [...allProducts];

        renderTable();
        updateStats();
        showLoading(false);

    } catch (error) {
        console.error('Error fetching products:', error);
        showLoading(false);
        showError('Failed to load products. Please check your connection and try again.');
    }
}

// ========================================
// Search Function (using onChange)
// ========================================
function handleSearch(searchValue) {
    currentSearchTerm = searchValue.trim().toLowerCase();
    filterProducts();
}

function filterProducts() {
    filteredProducts = allProducts.filter(product => {
        if (!currentSearchTerm) return true;

        const titleMatch = product.title.toLowerCase().includes(currentSearchTerm);
        const descMatch = product.description && product.description.toLowerCase().includes(currentSearchTerm);
        const categoryMatch = product.category && product.category.name.toLowerCase().includes(currentSearchTerm);

        return titleMatch || descMatch || categoryMatch;
    });

    applySorting();
    renderTable();
    updateStats();
}

// ========================================
// Sort Functions
// ========================================
function sortProducts(sortType) {
    currentSort = sortType;
    applySorting();
    renderTable();

    // Update active button state
    document.querySelectorAll('.btn-group .btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
}

function applySorting() {
    switch (currentSort) {
        case 'name-asc':
            filteredProducts.sort((a, b) => a.title.localeCompare(b.title));
            break;
        case 'name-desc':
            filteredProducts.sort((a, b) => b.title.localeCompare(a.title));
            break;
        case 'price-low':
            filteredProducts.sort((a, b) => a.price - b.price);
            break;
        case 'price-high':
            filteredProducts.sort((a, b) => b.price - a.price);
            break;
        default:
            // Keep original order
            break;
    }
}

// ========================================
// Rendering Functions
// ========================================
function renderTable() {
    if (filteredProducts.length === 0) {
        elements.tableContainer.style.display = 'none';
        elements.emptyState.style.display = 'block';
        return;
    }

    elements.tableContainer.style.display = 'block';
    elements.emptyState.style.display = 'none';

    const html = filteredProducts.map(product => {
        const image = product.images && product.images[0]
            ? product.images[0]
            : 'https://placehold.co/60x60/1a1a2e/667eea?text=No+Image';

        const categoryName = product.category?.name || 'N/A';
        const categoryClass = getCategoryBadgeClass(categoryName);
        const description = product.description || 'No description';
        const truncatedDesc = description.length > 100
            ? description.substring(0, 100) + '...'
            : description;

        return `
            <tr>
                <td class="text-center fw-bold">${product.id}</td>
                <td class="text-center">
                    <img src="${image}" 
                         alt="${escapeHtml(product.title)}" 
                         class="product-img"
                         onerror="this.src='https://placehold.co/60x60/1a1a2e/667eea?text=No+Image'">
                </td>
                <td class="fw-semibold">${escapeHtml(product.title)}</td>
                <td class="text-muted small">${escapeHtml(truncatedDesc)}</td>
                <td>
                    <span class="price-badge">$${formatPrice(product.price)}</span>
                </td>
                <td>
                    <span class="badge ${categoryClass}">${escapeHtml(categoryName)}</span>
                </td>
                <td class="text-center">
                    <button class="btn btn-sm btn-primary" onclick="viewProduct(${product.id})" title="View Details">
                        <i class="bi bi-eye"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');

    elements.productTableBody.innerHTML = html;
}

function updateStats() {
    const uniqueCategories = new Set(
        allProducts
            .filter(p => p.category)
            .map(p => p.category.id)
    ).size;

    elements.totalProducts.textContent = allProducts.length;
    elements.showingProducts.textContent = filteredProducts.length;
    elements.totalCategories.textContent = uniqueCategories;
}

// ========================================
// Utility Functions
// ========================================
function showLoading(show) {
    elements.loadingState.style.display = show ? 'block' : 'none';
    elements.tableContainer.style.display = show ? 'none' : 'block';
}

function showError(message) {
    elements.loadingState.innerHTML = `
        <div class="alert alert-danger" role="alert">
            <i class="bi bi-exclamation-triangle-fill"></i>
            ${message}
            <button class="btn btn-sm btn-danger mt-2" onclick="fetchProducts()">
                <i class="bi bi-arrow-clockwise"></i> Retry
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

function getCategoryBadgeClass(categoryName) {
    const classes = {
        'Clothes': 'bg-primary',
        'Electronics': 'bg-success',
        'Shoes': 'bg-warning text-dark',
        'Furniture': 'bg-info',
        'Miscellaneous': 'bg-secondary'
    };
    return classes[categoryName] || 'bg-dark';
}

function viewProduct(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;

    alert(`Product Details:\n\nID: ${product.id}\nName: ${product.title}\nPrice: $${formatPrice(product.price)}\nCategory: ${product.category?.name || 'N/A'}\nDescription: ${product.description || 'N/A'}`);
}

// ========================================
// Initialize Application
// ========================================
function init() {
    fetchProducts();
}

// Start the application
document.addEventListener('DOMContentLoaded', init);

// Make functions globally accessible for onclick handlers
window.handleSearch = handleSearch;
window.sortProducts = sortProducts;
window.viewProduct = viewProduct;
