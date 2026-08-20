// admin.js

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // DOM Elements
        const loginSection = document.getElementById('login-section');
        const dashboardSection = document.getElementById('dashboard-section');
        const navUserInfo = document.getElementById('nav-user-info');
        const userEmailEl = document.getElementById('user-email');
        
        const loginForm = document.getElementById('login-form');
        if (!loginForm) throw new Error("login-form not found");
        
        const loginEmailInput = document.getElementById('login-email');
        const loginPasswordInput = document.getElementById('login-password');
        const loginSpinner = document.getElementById('login-spinner');
        const logoutBtn = document.getElementById('logout-btn');

        const addCarBtn = document.getElementById('add-car-btn');
        const carModal = document.getElementById('car-modal');
        const closeModalBtn = document.getElementById('close-modal-btn');
        const cancelModalBtn = document.getElementById('cancel-modal-btn');
        const saveCarBtn = document.getElementById('save-car-btn');
        const saveSpinner = document.getElementById('save-spinner');
        
        const inventoryTbody = document.getElementById('inventory-tbody');
        
        // Form Inputs
        const formId = document.getElementById('car-id');
        const formBrand = document.getElementById('car-brand');
        const formModel = document.getElementById('car-model');
        const formCategory = document.getElementById('car-category');
        const formPrice = document.getElementById('car-price');
        const formDesc = document.getElementById('car-description');
        const formContact = document.getElementById('car-contact');
        const formHotDeal = document.getElementById('car-hot-deal');
        const formImages = document.getElementById('car-images');
        const formError = document.getElementById('form-error');

        // Dynamic Modal Elements
        const modalTitle = document.getElementById('modal-title');
        
        // Image Preview Elements
        const imagePreviewContainer = document.getElementById('image-preview');

        // Mobile Menu Elements
        const mobileMenuBtn = document.getElementById('admin-mobile-menu-btn');
        const mobileMenu = document.getElementById('admin-mobile-menu');
        const closeMobileMenuBtn = document.getElementById('close-admin-menu-btn');
        const mobileUserEmail = document.getElementById('mobile-user-email');
        const mobileLogoutBtn = document.getElementById('mobile-logout-btn');

        let currentUser = null;
        let globalCarsData = []; // Store fetched cars for editing
        
        // Image Management State
        let currentPreviewImages = []; // Array of objects: { url: string, file: File|null }
        let selectedCoverIndex = 0;

        // --- Toast Notifications --- //
        function showToast(message, type = 'error') {
            const container = document.getElementById('toast-container');
            if (!container) return;
            
            const toast = document.createElement('div');
            const bgColor = type === 'error' ? 'bg-red-500' : (type === 'success' ? 'bg-green-500' : 'bg-gray-800');
            const icon = type === 'error' ? 'error' : (type === 'success' ? 'check_circle' : 'info');
            
            toast.className = `${bgColor} text-white px-6 py-4 rounded-lg shadow-xl font-sans text-sm flex items-center transform transition-all duration-300 translate-y-full opacity-0`;
            toast.innerHTML = `<span class="material-symbols-outlined mr-3">${icon}</span> ${message}`;
            
            container.appendChild(toast);
            
            setTimeout(() => {
                toast.classList.remove('translate-y-full', 'opacity-0');
            }, 10);
            
            setTimeout(() => {
                toast.classList.add('translate-y-full', 'opacity-0');
                setTimeout(() => {
                    toast.remove();
                }, 300);
            }, 4000);
        }

        // --- Authentication --- //

        try {
            const { data: { session } } = await supabaseClient.auth.getSession();
            if (session) {
                currentUser = session.user;
                showDashboard();
            } else {
                showLogin();
            }
        } catch (err) {
            console.error("Supabase getSession error:", err);
            showLogin();
        }

        supabaseClient.auth.onAuthStateChange((_event, session) => {
            if (session) {
                currentUser = session.user;
                showDashboard();
            } else {
                currentUser = null;
                showLogin();
            }
        });

        // Login Form Submit
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            loginSpinner.classList.remove('hidden');

            try {
                const { error } = await supabaseClient.auth.signInWithPassword({
                    email: loginEmailInput.value,
                    password: loginPasswordInput.value,
                });

                if (error) {
                    loginSpinner.classList.add('hidden');
                    if (error.message.includes("Email not confirmed")) {
                        showToast("Please check your email to confirm your account.", 'error');
                    } else {
                        showToast(error.message, 'error');
                    }
                }
            } catch (err) {
                loginSpinner.classList.add('hidden');
                showToast("Network error or Supabase not reachable.", 'error');
            }
        });

        // Logout
        const handleLogout = async () => {
            await supabaseClient.auth.signOut();
            closeMobileMenu();
        };
        logoutBtn.addEventListener('click', handleLogout);
        if(mobileLogoutBtn) mobileLogoutBtn.addEventListener('click', handleLogout);

        // Mobile Menu Logic
        if (mobileMenuBtn && mobileMenu && closeMobileMenuBtn) {
            mobileMenuBtn.addEventListener('click', () => {
                mobileMenu.classList.remove('opacity-0', 'pointer-events-none');
                mobileMenu.classList.add('opacity-100', 'pointer-events-auto');
            });
            closeMobileMenuBtn.addEventListener('click', closeMobileMenu);
        }

        function closeMobileMenu() {
            if(mobileMenu) {
                mobileMenu.classList.remove('opacity-100', 'pointer-events-auto');
                mobileMenu.classList.add('opacity-0', 'pointer-events-none');
            }
        }

        function showLogin() {
            loginSection.classList.remove('hidden');
            loginSection.classList.add('flex');
            dashboardSection.classList.add('hidden');
            dashboardSection.classList.remove('flex');
            navUserInfo.className = 'hidden';
            if(mobileMenuBtn) mobileMenuBtn.classList.add('hidden');
            loginSpinner.classList.add('hidden');
        }

        function showDashboard() {
            loginSection.classList.add('hidden');
            loginSection.classList.remove('flex');
            dashboardSection.classList.remove('hidden');
            dashboardSection.classList.add('flex');
            navUserInfo.className = 'hidden md:flex items-center space-x-4';
            if(mobileMenuBtn) mobileMenuBtn.classList.remove('hidden');
            userEmailEl.textContent = currentUser.email;
            if(mobileUserEmail) mobileUserEmail.textContent = currentUser.email;
            loadInventory();
        }

        // --- Inventory Management --- //

        async function loadInventory() {
            const { data, error } = await supabaseClient
                .from('cars')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching inventory:', error);
                inventoryTbody.innerHTML = `<tr><td colspan="6" class="p-8 text-center text-red-500">Failed to load inventory.</td></tr>`;
                return;
            }

            globalCarsData = data; // Cache data for editing
            inventoryTbody.innerHTML = '';

            if (data.length === 0) {
                inventoryTbody.innerHTML = `<tr><td colspan="6" class="p-8 text-center text-gray-500">No vehicles found. Add one to get started!</td></tr>`;
            } else {
                data.forEach(car => {
                    const tr = document.createElement('tr');
                    tr.className = 'hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0';
                    
                    const coverImage = (car.images && car.images.length > 0) ? car.images[0] : 'https://placehold.co/400x300?text=No+Image';
                    const priceDisplay = car.requires_contact ? 'Contact Dealer' : `₦${Number(car.price).toLocaleString()}`;
                    const hotDealBadge = car.is_hot_deal ? `<span class="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full font-bold ml-2">HOT DEAL</span>` : '';

                    tr.innerHTML = `
                        <td class="p-4 w-24">
                            <img src="${coverImage}" alt="${car.brand}" class="w-20 h-14 object-cover rounded-md shadow-sm">
                        </td>
                        <td class="p-4">
                            <div class="font-bold text-gray-900">${car.brand}</div>
                            <div class="text-sm text-gray-500">${car.model}</div>
                        </td>
                        <td class="p-4">
                            <span class="bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded-full font-semibold uppercase tracking-wider">${car.category}</span>
                        </td>
                        <td class="p-4 font-semibold font-sans min-w-[120px]">
                            ${priceDisplay}
                        </td>
                        <td class="p-4 min-w-[120px]">
                            ${hotDealBadge}
                        </td>
                        <td class="p-4 text-right">
                            <div class="flex justify-end space-x-2">
                                <button onclick="editCar('${car.id}')" class="text-blue-500 hover:text-blue-700 transition-colors bg-blue-50 p-2 rounded-full" title="Edit Vehicle">
                                    <span class="material-symbols-outlined text-lg block">edit</span>
                                </button>
                                <button onclick="deleteCar('${car.id}')" class="text-red-500 hover:text-red-700 transition-colors bg-red-50 p-2 rounded-full" title="Delete Vehicle">
                                    <span class="material-symbols-outlined text-lg block">delete</span>
                                </button>
                            </div>
                        </td>
                    `;
                    inventoryTbody.appendChild(tr);
                });
            }

            // Remove global loader
            const globalLoader = document.getElementById('global-loading');
            const mainContent = document.getElementById('main-content');
            if (globalLoader && mainContent) {
                globalLoader.classList.add('opacity-0', 'pointer-events-none');
                setTimeout(() => globalLoader.classList.add('hidden'), 500);
                mainContent.classList.remove('blur-md', 'pointer-events-none');
            }
        }

        // --- Image Preview & Selection Logic --- //
        
        function renderImagePreview() {
            if (!imagePreviewContainer) return;
            imagePreviewContainer.innerHTML = '';
            
            if (currentPreviewImages.length === 0) {
                imagePreviewContainer.classList.add('hidden');
                return;
            }
            
            imagePreviewContainer.classList.remove('hidden');
            
            currentPreviewImages.forEach((imgObj, index) => {
                const div = document.createElement('div');
                div.className = 'relative shrink-0 group cursor-pointer';
                div.onclick = () => {
                    selectedCoverIndex = index;
                    renderImagePreview();
                };
                
                const isCover = index === selectedCoverIndex;
                
                let badge = '';
                if (isCover) {
                    badge = '<span class="absolute top-1 left-1 bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm z-10 uppercase">Cover</span>';
                } else {
                    badge = `
                        <div class="absolute inset-0 bg-black/40 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                            <span class="text-white text-xs font-bold uppercase bg-black/60 px-2 py-1 rounded">Set Cover</span>
                        </div>
                        <span class="absolute top-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded shadow-sm z-10">${index + 1}</span>
                    `;
                }

                div.innerHTML = `
                    ${badge}
                    <img src="${imgObj.url}" class="w-24 h-24 object-cover rounded-lg shadow-sm border ${isCover ? 'border-primary border-2' : 'border-gray-200'}">
                `;
                imagePreviewContainer.appendChild(div);
            });
        }

        if (formImages) {
            formImages.addEventListener('change', (e) => {
                const files = e.target.files;
                if (files && files.length > 0) {
                    currentPreviewImages = Array.from(files).map(file => ({
                        url: URL.createObjectURL(file),
                        file: file
                    }));
                    selectedCoverIndex = 0;
                    renderImagePreview();
                } else {
                    // If they cleared the file input while editing, maybe we should revert to existing images?
                    // For now, let's just clear it. They can cancel and re-edit.
                    currentPreviewImages = [];
                    selectedCoverIndex = 0;
                    renderImagePreview();
                }
            });
        }

        // --- Modal Logic --- //

        function openModal(isEdit = false) {
            if (!isEdit) {
                document.getElementById('car-form').reset();
                formId.value = '';
                if(modalTitle) modalTitle.textContent = "Add New Vehicle";
                if(saveCarBtn) saveCarBtn.innerHTML = '<span id="save-spinner" class="material-symbols-outlined animate-spin hidden mr-2" style="font-size:18px;">progress_activity</span>Save Vehicle';
                
                currentPreviewImages = [];
                selectedCoverIndex = 0;
                renderImagePreview();
            } else {
                if(modalTitle) modalTitle.textContent = "Edit Vehicle";
                if(saveCarBtn) saveCarBtn.innerHTML = '<span id="save-spinner" class="material-symbols-outlined animate-spin hidden mr-2" style="font-size:18px;">progress_activity</span>Update Vehicle';
            }
            
            formError.classList.add('hidden');
            carModal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        }

        function closeModal() {
            carModal.classList.add('hidden');
            document.body.style.overflow = '';
        }

        addCarBtn.addEventListener('click', () => openModal(false));
        closeModalBtn.addEventListener('click', closeModal);
        cancelModalBtn.addEventListener('click', closeModal);

        // Edit Car (Expose to global scope)
        window.editCar = (id) => {
            const car = globalCarsData.find(c => c.id === id);
            if (!car) return;

            formId.value = car.id;
            formBrand.value = car.brand || '';
            formModel.value = car.model || '';
            formCategory.value = car.category || '';
            formPrice.value = car.price || '';
            formDesc.value = car.description || '';
            formContact.checked = car.requires_contact || false;
            formHotDeal.checked = car.is_hot_deal || false;
            
            if (formImages) formImages.value = ''; // Clear any previously selected files
            
            // Load existing images into preview
            currentPreviewImages = (car.images || []).map(url => ({
                url: url,
                file: null // Null indicates it's already uploaded
            }));
            selectedCoverIndex = 0;
            renderImagePreview();

            openModal(true);
        };

        // Save Car Logic
        saveCarBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            formError.classList.add('hidden');
            
            // Basic Validation
            if (!formBrand.value || !formModel.value || !formCategory.value) {
                showToast("Brand, Model, and Category are required.", 'error');
                return;
            }

            const currentSaveSpinner = document.getElementById('save-spinner');
            if(currentSaveSpinner) currentSaveSpinner.classList.remove('hidden');
            saveCarBtn.disabled = true;

            try {
                const isEditMode = !!formId.value;
                
                // 1. Reorder currentPreviewImages based on selectedCoverIndex
                if (currentPreviewImages.length > 0 && selectedCoverIndex > 0 && selectedCoverIndex < currentPreviewImages.length) {
                    const coverImg = currentPreviewImages.splice(selectedCoverIndex, 1)[0];
                    currentPreviewImages.unshift(coverImg); // Move to index 0
                }

                // 2. Process images (Upload new ones, keep existing ones)
                let imageUrls = [];
                for (let i = 0; i < currentPreviewImages.length; i++) {
                    const imgObj = currentPreviewImages[i];
                    
                    if (imgObj.file) {
                        // Needs upload
                        const file = imgObj.file;
                        const fileExt = file.name.split('.').pop();
                        const fileName = `${Math.random()}.${fileExt}`;
                        const filePath = `${fileName}`;

                        const { error: uploadError } = await supabaseClient.storage
                            .from('car_images')
                            .upload(filePath, file);

                        if (uploadError) throw uploadError;

                        const { data: { publicUrl } } = supabaseClient.storage
                            .from('car_images')
                            .getPublicUrl(filePath);
                        
                        imageUrls.push(publicUrl);
                    } else {
                        // Already a public URL from existing DB entry
                        imageUrls.push(imgObj.url);
                    }
                }

                // 3. Prepare Data
                const carData = {
                    brand: formBrand.value,
                    model: formModel.value,
                    category: formCategory.value,
                    price: formPrice.value ? parseFloat(formPrice.value) : null,
                    description: formDesc.value,
                    requires_contact: formContact.checked,
                    is_hot_deal: formHotDeal.checked,
                    images: imageUrls
                };

                // 4. Upsert into DB
                let dbError;
                if (isEditMode) {
                    const res = await supabaseClient
                        .from('cars')
                        .update(carData)
                        .eq('id', formId.value);
                    dbError = res.error;
                } else {
                    const res = await supabaseClient
                        .from('cars')
                        .insert([carData]);
                    dbError = res.error;
                }

                if (dbError) throw dbError;

                // Success
                showToast(`Vehicle ${isEditMode ? 'updated' : 'added'} successfully!`, 'success');
                closeModal();
                loadInventory();

            } catch (error) {
                console.error(error);
                showToast(error.message || "An error occurred while saving.", 'error');
            } finally {
                const currentSaveSpinner = document.getElementById('save-spinner');
                if(currentSaveSpinner) currentSaveSpinner.classList.add('hidden');
                saveCarBtn.disabled = false;
            }
        });

        // Delete Car (Expose to global scope)
        window.deleteCar = async (id) => {
            if (confirm('Are you sure you want to delete this vehicle?')) {
                const { error } = await supabaseClient
                    .from('cars')
                    .delete()
                    .eq('id', id);
                
                if (error) {
                    showToast('Error deleting vehicle: ' + error.message, 'error');
                } else {
                    showToast('Vehicle deleted.', 'success');
                    loadInventory();
                }
            }
        };

    } catch (globalError) { 
        alert('Fatal Error: ' + globalError.message); 
        console.error(globalError); 
    }
});
