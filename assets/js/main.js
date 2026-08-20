// Simple scroll listener to manage nav background transparency
const nav = document.getElementById('main-nav');
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        nav.classList.add('shadow-sm', 'bg-black/80', 'backdrop-blur-xl', 'border-b', 'border-outline-variant/30');
        nav.classList.remove('bg-transparent');
    } else {
        nav.classList.remove('shadow-sm', 'bg-black/80', 'backdrop-blur-xl', 'border-b', 'border-outline-variant/30');
        nav.classList.add('bg-transparent');
    }
});

// Brand Logos Marquee
const brands = [
    { name: 'Mercedes-Benz', src: 'https://cdn.worldvectorlogo.com/logos/mercedes-benz-9.svg' },
    { name: 'Porsche', src: 'https://cdn.worldvectorlogo.com/logos/porsche-6.svg' },
    { name: 'Toyota', src: 'https://cdn.worldvectorlogo.com/logos/toyota-1.svg' },
    { name: 'Lexus', src: 'https://cdn.worldvectorlogo.com/logos/lexus-2.svg' },
    { name: 'BMW', src: 'https://cdn.worldvectorlogo.com/logos/bmw-2.svg' },
    { name: 'Honda', src: 'https://cdn.worldvectorlogo.com/logos/honda-4.svg' }
];

const marqueeContainer = document.getElementById('brand-marquee');

if (marqueeContainer) {
    // Generate the HTML for one set of logos
    const logoSet = brands.map(brand =>
        `<img src="${brand.src}" alt="${brand.name} logo" class="h-16 md:h-24 w-auto object-contain transition-all duration-300 mx-8">`
    ).join('');

    // To ensure seamless infinite scrolling, we append the logo set multiple times
    marqueeContainer.innerHTML = logoSet + logoSet + logoSet;
}

// Mobile Menu Toggle
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
        link.addEventListener('click', toggleMenu);
    });
}

// --- Supabase Inventory Logic --- //
document.addEventListener('DOMContentLoaded', async () => {
    const inventoryGrid = document.getElementById('inventory-grid');
    if (!inventoryGrid || !window.supabase) return;

    let allCars = [];

    // Fetch all cars
    async function fetchInventory() {
        try {
            const { data, error } = await supabaseClient
                .from('cars')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            allCars = data;
            renderInventory('ALL');

            const globalLoader = document.getElementById('global-loading');
            const mainContent = document.getElementById('main-content');
            if (globalLoader && mainContent) {
                globalLoader.classList.add('opacity-0', 'pointer-events-none');
                setTimeout(() => globalLoader.classList.add('hidden'), 500);
                mainContent.classList.remove('blur-md', 'pointer-events-none');
            }
        } catch (error) {
            console.error('Error fetching inventory:', error);
            inventoryGrid.innerHTML = '<p class="col-span-full text-center text-red-500 py-12">Failed to load inventory. Please try again later.</p>';
        }
    }

    // Render cars based on filter
    function renderInventory(filter) {
        inventoryGrid.innerHTML = '';

        let filteredCars = allCars;
        if (filter !== 'ALL') {
            filteredCars = allCars.filter(car =>
                car.category.toUpperCase() === filter.toUpperCase() ||
                car.brand.toUpperCase() === filter.toUpperCase()
            );
        }

        if (filteredCars.length === 0) {
            inventoryGrid.innerHTML = '<p class="col-span-full text-center text-gray-500 py-12 font-sans">No vehicles found for this category.</p>';
            return;
        }

        filteredCars.forEach(car => {
            const coverImage = (car.images && car.images.length > 0) ? car.images[0] : 'https://placehold.co/800x600?text=No+Image';
            const isHotDeal = car.is_hot_deal;

            // Col span: Hot Deals take 6 cols, regular take 4 cols (or 6 on md)
            const colSpanClass = isHotDeal
                ? 'col-span-1 md:col-span-6 lg:col-span-6'
                : 'col-span-1 md:col-span-6 lg:col-span-4';

            const hotDealBadge = isHotDeal
                ? '<div class="absolute top-6 left-6 bg-error text-white px-3 py-1 font-label-caps text-[12px] rounded-DEFAULT shadow-lg tracking-widest font-bold z-10">?? HOT DEAL</div>'
                : '';

            const priceDisplay = car.requires_contact
                ? 'Contact Dealer'
                : '$' + Number(car.price).toLocaleString();

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
    }

    // Filter Buttons Logic
    const filterButtons = document.querySelectorAll('#inventory .flex-wrap button');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Reset all buttons style
            filterButtons.forEach(b => {
                b.classList.remove('bg-surface-container-high', 'text-primary', 'border-transparent');
                b.classList.add('bg-white', 'text-secondary', 'border-surface-variant');
            });

            // Set active style to clicked button
            e.target.classList.remove('bg-white', 'text-secondary', 'border-surface-variant');
            e.target.classList.add('bg-surface-container-high', 'text-primary', 'border-transparent');

            // Render
            const filter = e.target.textContent.trim();
            renderInventory(filter);
        });
    });

    // Initial Fetch
    fetchInventory();
});




