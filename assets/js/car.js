document.addEventListener('DOMContentLoaded', async () => {
    // DOM Elements
    const loadingEl = document.getElementById('car-loading');
    const contentEl = document.getElementById('car-content');

    const titleEl = document.getElementById('car-title');
    const priceEl = document.getElementById('car-price');
    const categoryBadge = document.getElementById('car-category-badge');
    const hotDealBadge = document.getElementById('car-hot-deal-badge');
    const descEl = document.getElementById('car-description');

    const mainImage = document.getElementById('main-image');
    const thumbContainer = document.getElementById('thumbnail-container');
    const galleryPrev = document.getElementById('gallery-prev');
    const galleryNext = document.getElementById('gallery-next');

    // Get ID from URL
    const params = new URLSearchParams(window.location.search);
    const carId = params.get('id');

    if (!carId) {
        loadingEl.innerHTML = '<p class="text-red-500 font-sans text-center">No vehicle specified.</p>';
        return;
    }

    try {
        const { data: car, error } = await supabaseClient
            .from('cars')
            .select('*')
            .eq('id', carId)
            .single();

        if (error || !car) {
            loadingEl.innerHTML = '<p class="text-red-500 font-sans text-center">Vehicle not found.</p>';
            return;
        }

        // Hide loading, show content
        loadingEl.classList.add('opacity-0', 'pointer-events-none');
        setTimeout(() => loadingEl.classList.add('hidden'), 500);
        contentEl.classList.remove('blur-md', 'pointer-events-none');

        // Populate Text Data
        titleEl.textContent = `${car.brand} ${car.model}`;
        categoryBadge.textContent = car.category;

        if (car.is_hot_deal) {
            hotDealBadge.classList.remove('hidden');
        }

        if (car.requires_contact) {
            priceEl.textContent = 'Contact Dealer';
        } else {
            priceEl.textContent = '₦' + Number(car.price).toLocaleString();
        }

        descEl.textContent = car.description || "No description provided.";

        // WhatsApp Logic
        const whatsappBtn = document.getElementById('whatsapp-btn');
        if (whatsappBtn) {
            const pageUrl = window.location.href;
            const message = `Hi, I am interested in the ${car.brand} ${car.model} listed on your website. Here is the link: ${pageUrl}`;
            const phoneNumber = "2349058476476"; // Replace with actual WhatsApp number
            whatsappBtn.href = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
            whatsappBtn.target = "_blank";
        }

        // Populate Images
        if (car.images && car.images.length > 0) {
            let currentIndex = 0;
            const imagesArray = car.images;
            let autoAdvanceTimer = null;

            // Show buttons if multiple images
            if (imagesArray.length > 1) {
                galleryPrev.classList.remove('hidden');
                galleryNext.classList.remove('hidden');
            }

            function startTimer() {
                if (autoAdvanceTimer) clearInterval(autoAdvanceTimer);
                if (imagesArray.length > 1) {
                    autoAdvanceTimer = setInterval(() => {
                        updateGallery((currentIndex + 1) % imagesArray.length);
                    }, 4000); // 4 seconds
                }
            }

            function updateGallery(index) {
                currentIndex = index;
                mainImage.style.opacity = 0; // Fade out

                setTimeout(() => {
                    mainImage.src = imagesArray[currentIndex];
                    mainImage.style.opacity = 1; // Fade in
                }, 300); // Match CSS transition duration

                // Update thumbs
                Array.from(thumbContainer.children).forEach((child, idx) => {
                    if (idx === currentIndex) {
                        child.classList.add('border-primary', 'opacity-100');
                        child.classList.remove('border-transparent', 'opacity-60');
                        // Scroll to view
                        child.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                    } else {
                        child.classList.remove('border-primary', 'opacity-100');
                        child.classList.add('border-transparent', 'opacity-60');
                    }
                });
            }

            // Build thumbnails
            imagesArray.forEach((imgSrc, idx) => {
                const thumb = document.createElement('img');
                thumb.src = imgSrc;
                thumb.alt = `Thumbnail ${idx + 1}`;

                // Styling
                thumb.className = "w-24 h-16 md:w-32 md:h-20 object-cover rounded-lg cursor-pointer opacity-60 hover:opacity-100 transition-opacity snap-start border-2 border-transparent flex-shrink-0";

                // Click event
                thumb.addEventListener('click', () => {
                    updateGallery(idx);
                    startTimer(); // Reset timer on manual click
                });

                thumbContainer.appendChild(thumb);
            });

            // Button events
            galleryPrev.addEventListener('click', () => {
                const newIndex = currentIndex === 0 ? imagesArray.length - 1 : currentIndex - 1;
                updateGallery(newIndex);
                startTimer();
            });

            galleryNext.addEventListener('click', () => {
                const newIndex = (currentIndex + 1) % imagesArray.length;
                updateGallery(newIndex);
                startTimer();
            });

            // Initial load
            updateGallery(0);
            startTimer();

        } else {
            mainImage.src = 'https://placehold.co/1200x800?text=No+Image';
        }

    } catch (err) {
        console.error(err);
        loadingEl.innerHTML = '<p class="text-red-500 font-sans text-center">Failed to load vehicle details.</p>';
    }

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


