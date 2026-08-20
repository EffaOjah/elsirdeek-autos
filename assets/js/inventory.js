document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const inventoryGrid = document.getElementById('inventory-grid');
    const searchInput = document.getElementById('search-input');
    const filterBrand = document.getElementById('filter-brand');
    const filterCategory = document.getElementById('filter-category');
    const sortSelect = document.getElementById('sort-select');
    const paginationControls = document.getElementById('pagination-controls');

    let allCars = [];
    let uniqueBrands = new Set();
    let uniqueCategories = new Set();
    
    // Pagination state
    let currentPage = 1;
    const itemsPerPage = 20;

    // Fetch all cars
    async function fetchInventory() {
        try {
            const { data, error } = await supabaseClient
                .from('cars')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error("Error fetching cars:", error);
                inventoryGrid.innerHTML = '<p class="text-red-500 font-sans col-span-12">Failed to load inventory.</p>';
                return;
            }

            allCars = data;
            
            // Extract unique brands and categories for dropdowns
            allCars.forEach(car => {
                if(car.brand) uniqueBrands.add(car.brand.toUpperCase());
                if(car.category) uniqueCategories.add(car.category.toUpperCase());
            });

            populateDropdowns();
            renderInventory(); // Initial render
            const globalLoader = document.getElementById('global-loading');
            const mainContent = document.getElementById('main-content');
            if (globalLoader && mainContent) {
                globalLoader.classList.add('opacity-0', 'pointer-events-none');
                setTimeout(() => globalLoader.classList.add('hidden'), 500);
                mainContent.classList.remove('blur-md', 'pointer-events-none');
            }
        } catch (err) {
            console.error("Unexpected error:", err);
            inventoryGrid.innerHTML = '<p class="text-red-500 font-sans col-span-12">An unexpected error occurred.</p>';
        }
    }

    function populateDropdowns() {
        // Populate Brands
        uniqueBrands.forEach(brand => {
            const option = document.createElement('option');
            option.value = brand;
            option.textContent = brand;
            filterBrand.appendChild(option);
        });

        // Populate Categories
        uniqueCategories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            filterCategory.appendChild(option);
        });
    }

    // Render cars based on current filters, search, and pagination
    function renderInventory() {
        inventoryGrid.innerHTML = '';
        if(paginationControls) paginationControls.innerHTML = '';
        
        const searchTerm = searchInput.value.toLowerCase().trim();
        const selectedBrand = filterBrand.value;
        const selectedCategory = filterCategory.value;
        const sortBy = sortSelect.value;

        // 1. Filter
        let filteredCars = allCars.filter(car => {
            const matchesSearch = !searchTerm || 
                (car.brand && car.brand.toLowerCase().includes(searchTerm)) || 
                (car.model && car.model.toLowerCase().includes(searchTerm));
                
            const matchesBrand = selectedBrand === 'ALL' || 
                (car.brand && car.brand.toUpperCase() === selectedBrand);
                
            const matchesCategory = selectedCategory === 'ALL' || 
                (car.category && car.category.toUpperCase() === selectedCategory);

            return matchesSearch && matchesBrand && matchesCategory;
        });

        // 2. Sort
        filteredCars.sort((a, b) => {
            if (sortBy === 'price-low') {
                return Number(a.price || 0) - Number(b.price || 0);
            } else if (sortBy === 'price-high') {
                return Number(b.price || 0) - Number(a.price || 0);
            } else {
                return new Date(b.created_at) - new Date(a.created_at);
            }
        });

        if (filteredCars.length === 0) {
            inventoryGrid.innerHTML = '<div class="col-span-12 text-center py-12"><p class="font-sans text-secondary text-lg">No vehicles found matching your criteria.</p></div>';
            return;
        }

        // 3. Paginate
        const totalPages = Math.ceil(filteredCars.length / itemsPerPage);
        if (currentPage > totalPages) currentPage = 1; // Safeguard
        
        const startIndex = (currentPage - 1) * itemsPerPage;
        const paginatedCars = filteredCars.slice(startIndex, startIndex + itemsPerPage);

        // 4. Render Grid
        paginatedCars.forEach(car => {
            const coverImage = (car.images && car.images.length > 0) ? car.images[0] : 'https://placehold.co/800x600?text=No+Image';
            const isHotDeal = car.is_hot_deal;

            const colSpanClass = 'col-span-1 md:col-span-6 lg:col-span-4';
            
            const hotDealBadge = isHotDeal
                ? '<div class="absolute top-6 left-6 bg-error text-white px-3 py-1 font-label-caps text-[12px] rounded-DEFAULT shadow-lg tracking-widest font-bold z-10">🔥 HOT DEAL</div>'
                : '';

            const priceDisplay = car.requires_contact
                ? 'Contact Dealer'
                : '₦' + Number(car.price).toLocaleString();

            const buttonText = car.requires_contact ? 'Contact Us' : 'View Details';

            const carHtml = `
                <a class="${colSpanClass} group block border border-surface-variant hover:border-primary transition-colors duration-500 overflow-hidden bg-white flex flex-col" href="car.html?id=${car.id}">
                    <div class="h-[300px] md:h-[400px] w-full overflow-hidden bg-surface-container-low relative shrink-0">
                        <img alt="${car.brand} ${car.model}" class="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700" src="${coverImage}" />
                        ${hotDealBadge}
                    </div>
                    <div class="p-6 md:p-8 flex flex-col flex-grow justify-between">
                        <div class="mb-6">
                            <h3 class="font-sans text-xl md:text-2xl font-bold text-primary mb-2">${car.brand} ${car.model}</h3>
                            <p class="font-sans text-sm md:text-base text-secondary line-clamp-2">${car.description || car.category}</p>
                        </div>
                        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-auto gap-4">
                            <div class="font-sans text-xl font-bold text-primary">${priceDisplay}</div>
                            <button class="bg-primary text-white px-6 py-3 rounded-full text-sm font-semibold hover:bg-black transition-colors shadow-md w-full sm:w-auto">${buttonText}</button>
                        </div>
                    </div>
                </a>
            `;
            
            inventoryGrid.insertAdjacentHTML('beforeend', carHtml);
        });

        // 5. Render Pagination Controls
        if (totalPages > 1 && paginationControls) {
            
            // Prev Button
            const prevBtn = document.createElement('button');
            prevBtn.className = `px-4 py-2 rounded-lg font-sans font-bold transition-colors ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white border border-surface-variant text-primary hover:bg-gray-50'}`;
            prevBtn.textContent = 'Previous';
            prevBtn.disabled = currentPage === 1;
            prevBtn.addEventListener('click', () => {
                currentPage--;
                renderInventory();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
            paginationControls.appendChild(prevBtn);

            // Page Numbers
            for (let i = 1; i <= totalPages; i++) {
                const pageBtn = document.createElement('button');
                pageBtn.className = `w-10 h-10 rounded-lg font-sans font-bold transition-colors ${currentPage === i ? 'bg-primary text-white' : 'bg-white border border-surface-variant text-primary hover:bg-gray-50'}`;
                pageBtn.textContent = i;
                pageBtn.addEventListener('click', () => {
                    currentPage = i;
                    renderInventory();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                });
                paginationControls.appendChild(pageBtn);
            }

            // Next Button
            const nextBtn = document.createElement('button');
            nextBtn.className = `px-4 py-2 rounded-lg font-sans font-bold transition-colors ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white border border-surface-variant text-primary hover:bg-gray-50'}`;
            nextBtn.textContent = 'Next';
            nextBtn.disabled = currentPage === totalPages;
            nextBtn.addEventListener('click', () => {
                currentPage++;
                renderInventory();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
            paginationControls.appendChild(nextBtn);
        }
    }

    // Event Listeners for Filters (Reset to page 1 on filter change)
    function onFilterChange() {
        currentPage = 1;
        renderInventory();
    }

    if(searchInput) searchInput.addEventListener('input', onFilterChange);
    if(filterBrand) filterBrand.addEventListener('change', onFilterChange);
    if(filterCategory) filterCategory.addEventListener('change', onFilterChange);
    if(sortSelect) sortSelect.addEventListener('change', onFilterChange);

    // Initial Fetch
    fetchInventory();

    // Mobile Menu Logic
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const menuIcon = document.getElementById('menu-icon');
    const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');
    let isMenuOpen = false;

    if (mobileMenuBtn && mobileMenu) {
        const toggleMenu = () => {
            isMenuOpen = !isMenuOpen;
            if (isMenuOpen) {
                mobileMenu.classList.remove('opacity-0', 'pointer-events-none');
                mobileMenu.classList.add('opacity-100', 'pointer-events-auto');
                menuIcon.textContent = 'close';
                document.body.style.overflow = 'hidden';
            } else {
                mobileMenu.classList.remove('opacity-100', 'pointer-events-auto');
                mobileMenu.classList.add('opacity-0', 'pointer-events-none');
                menuIcon.textContent = 'menu';
                document.body.style.overflow = '';
            }
        };

        mobileMenuBtn.addEventListener('click', toggleMenu);

        mobileNavLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (isMenuOpen) toggleMenu();
            });
        });
    }
});

