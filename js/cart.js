document.addEventListener('DOMContentLoaded', () => {
    let cart = JSON.parse(localStorage.getItem('otop_cart')) || [];
    const cartBadge = document.querySelector('.cart-badge');

    // Update Badge
    const updateBadge = () => {
        if (cartBadge) {
            const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
            cartBadge.textContent = totalItems;
            cartBadge.style.display = totalItems > 0 ? 'flex' : 'none';
        }
    };

    updateBadge();

    // AUTO-FILL CUSTOMER INFO
    const loadCustomerInfo = () => {
        const savedInfo = JSON.parse(localStorage.getItem('phrae_otop_cust_info'));
        if (savedInfo) {
            if (document.getElementById('cust-name')) document.getElementById('cust-name').value = savedInfo.name || '';
            if (document.getElementById('cust-phone')) document.getElementById('cust-phone').value = savedInfo.tel || '';
            if (document.getElementById('cust-address')) document.getElementById('cust-address').value = savedInfo.address || ''; // Corrected ID
        } else {
            // Try Auth User
            const currentUser = JSON.parse(localStorage.getItem('phrae_otop_currentUser'));
            if (currentUser) {
                if (document.getElementById('cust-name')) document.getElementById('cust-name').value = currentUser.name || '';
                if (document.getElementById('cust-phone')) document.getElementById('cust-phone').value = currentUser.tel || '';
            }
        }
    };

    // Load info immediately if we are on cart page
    if (document.querySelector('.cart-page')) {
        loadCustomerInfo();
    }

    // Add to Cart Logic
    const bindCartEvents = () => {
        const addToCartBtns = document.querySelectorAll('.add-to-cart-btn');
        addToCartBtns.forEach(btn => {
            btn.onclick = async () => { // Async for getProducts
                const productId = btn.getAttribute('data-product-id');
                const productPrice = parseFloat(btn.getAttribute('data-product-price'));

                // Fetch products (now async)
                const products = window.getProducts ? await window.getProducts() : [];
                const product = products.find(p => p.id === productId);

                if (!product) return;

                // Check stock availability
                const currentStock = product.stock || 0;
                const existingItem = cart.find(item => item.id === productId);
                const currentCartQty = existingItem ? existingItem.quantity : 0;

                if (currentStock <= 0) {
                    alert('สินค้าหมดแล้ว / Out of stock');
                    return;
                }

                if (currentCartQty >= currentStock) {
                    alert(`สินค้าเหลือเพียง ${currentStock} ชิ้น / Only ${currentStock} items available`);
                    return;
                }

                if (existingItem) {
                    existingItem.quantity += 1;
                } else {
                    cart.push({
                        id: productId,
                        title: product.title,
                        titleEn: product.titleEn,
                        price: productPrice,
                        image: product.image,
                        quantity: 1
                    });
                }

                localStorage.setItem('otop_cart', JSON.stringify(cart));
                updateBadge();

                // Subtle feedback
                btn.classList.add('added');
                const originalText = btn.innerHTML;
                btn.innerHTML = '<i class="fas fa-check"></i>';
                setTimeout(() => {
                    btn.classList.remove('added');
                    btn.innerHTML = originalText;
                }, 1000);
            };
        });
    };

    window.bindCartEvents = bindCartEvents;
    bindCartEvents();

    // Slip Upload & Preview Logic
    const slipInput = document.getElementById('payment-slip'); // Corrected ID
    const slipPreviewContainer = document.getElementById('slip-preview');
    let currentSlipBase64 = null;

    if (slipInput) {
        slipInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            if (file.size > 2 * 1024 * 1024) { // 2MB limit
                alert('ไฟล์มีขนาดใหญ่เกินไป (Max 2MB) / File too large');
                slipInput.value = '';
                return;
            }

            const reader = new FileReader();
            reader.onload = (event) => {
                currentSlipBase64 = event.target.result;
                // Show preview
                slipPreviewContainer.innerHTML = `<img src="${currentSlipBase64}" alt="Slip Preview" style="width:100%; border-radius:8px; border:1px solid #444; margin-top:10px;">`;
            };
            reader.readAsDataURL(file);
        });
    }

    // Real-time Checkout to Firestore
    const checkoutBtn = document.querySelector('.checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();

            if (cart.length === 0) return;

            const custName = document.getElementById('cust-name').value.trim(); // Corrected from 'name'
            const custPhone = document.getElementById('cust-phone').value.trim(); // Corrected from 'tel'
            const custAddress = document.getElementById('cust-address').value.trim(); // Corrected ID
            const slipFile = slipInput ? slipInput.files[0] : null;

            if (!custName || !custPhone || !custAddress) {
                alert('กรุณากรอกข้อมูลให้ครบถ้วน / Please enter all required information.');
                return;
            }

            if (!slipFile && !currentSlipBase64) {
                if (!confirm('คุณยังไม่ได้แนบสลิปการโอนเงิน ต้องการดำเนินการต่อหรือไม่? / No slip attached. Continue?')) return;
            }

            // Show Loading State
            const originalText = checkoutBtn.innerHTML;
            checkoutBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
            checkoutBtn.disabled = true;

            try {
                const currentUser = JSON.parse(localStorage.getItem('phrae_otop_currentUser'));

                // Calculate discount if applicable
                const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                let discountInfo = null;
                let finalTotal = subtotal;

                if (currentUser) {
                    const allUsers = JSON.parse(localStorage.getItem('phrae_otop_users')) || [];
                    const fullUserData = allUsers.find(u => u.id === currentUser.id);

                    if (fullUserData && fullUserData.discount && fullUserData.discount > 0) {
                        const discountPercentage = fullUserData.discount;
                        const discountAmount = Math.round(subtotal * (discountPercentage / 100));
                        finalTotal = subtotal - discountAmount;

                        discountInfo = {
                            percentage: discountPercentage,
                            amount: discountAmount,
                            originalTotal: subtotal
                        };
                    }
                }

                const newOrder = {
                    userId: currentUser ? currentUser.id : 'guest',
                    date: new Date().toISOString(),
                    displayDate: new Date().toLocaleString(),
                    customer: {
                        name: custName,
                        phone: custPhone,
                        address: custAddress
                    },
                    items: [...cart],
                    total: finalTotal,
                    discount: discountInfo, // Save discount info
                    status: 'pending',
                    slip: currentSlipBase64, // Use the base64 string
                    createdAt: new Date()
                };

                // WRITE TO FIRESTORE
                if (typeof window.db !== 'undefined') {
                    await window.db.collection('orders').add(newOrder);

                    // Reduce stock logic (same as before)
                    const products = window.getProducts ? await window.getProducts() : [];
                    const batch = window.db.batch();

                    for (const cartItem of cart) {
                        const product = products.find(p => p.id === cartItem.id);
                        if (product) {
                            const productRef = window.db.collection('products').doc(product.id);
                            const newStock = Math.max(0, (product.stock || 0) - cartItem.quantity);
                            batch.update(productRef, { stock: newStock });
                        }
                    }
                    await batch.commit();
                } else {
                    // Fallback
                    let orders = JSON.parse(localStorage.getItem('otop_orders')) || [];
                    orders.push(newOrder);
                    localStorage.setItem('otop_orders', JSON.stringify(orders));
                }

                // SAVE ADDRESS
                localStorage.setItem('phrae_otop_cust_info', JSON.stringify({
                    name: custName,
                    tel: custPhone,
                    address: custAddress
                }));

                // Clear cart
                cart = [];
                localStorage.setItem('otop_cart', JSON.stringify(cart));
                updateBadge();

                alert('✅ สั่งซื้อสำเร็จ! ข้อมูลถูกส่งไปยังแอดมินเรียบร้อยแล้ว\nOrder confirmed!');
                window.location.href = 'account.html?tab=orders';

            } catch (error) {
                console.error("Error creating order:", error);
                alert('เกิดข้อผิดพลาดในการสั่งซื้อ กรุณาลองใหม่อีกครั้ง\nError placing order: ' + error.message);
                checkoutBtn.innerHTML = originalText;
                checkoutBtn.disabled = false;
            }
        });
    }

    // Cart Page Logic
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotalAmount = document.getElementById('cart-total-amount'); // Corrected ID

    const renderCart = () => {
        if (!cartItemsContainer) return;

        const lang = localStorage.getItem('preferredLang') || 'th';

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = `<div class="empty-cart-message">
                <i class="fas fa-shopping-basket"></i>
                <p data-i18n="cart_empty">${lang === 'th' ? 'ตะกร้าของคุณยังว่างอยู่' : 'Your cart is empty'}</p>
                <a href="index.html#products" class="btn-primary" data-i18n="continue_shopping">${lang === 'th' ? 'เลือกซื้อสินค้าต่อ' : 'Continue Shopping'}</a>
            </div>`;
            if (cartTotalAmount) cartTotalAmount.textContent = '฿0';
            // Also hide checkout form if empty? 
            const cartContent = document.getElementById('cart-content');
            if (cartContent) cartContent.style.display = 'none';
            return;
        }

        // Ensure content is visible
        const cartContent = document.getElementById('cart-content');
        if (cartContent) cartContent.style.display = 'block';

        cartItemsContainer.innerHTML = cart.map((item, index) => `
            <div class="cart-item">
                <div class="cart-item-img">
                    <img src="${item.image}" alt="">
                </div>
                <div class="cart-item-info">
                    <h3>${lang === 'th' ? item.title : item.titleEn}</h3>
                    <!-- <p>${lang === 'th' ? 'รหัสสินค้า' : 'ID'}: ${item.id}</p> -->
                </div>
                <div class="cart-item-price">
                    ฿${item.price.toLocaleString()}
                </div>
                <div class="cart-item-qty">
                    <button class="qty-btn" onclick="updateQty('${item.id}', -1)">-</button>
                    <span>${item.quantity}</span>
                    <button class="qty-btn" onclick="updateQty('${item.id}', 1)">+</button>
                </div>
                <button class="remove-item-btn" onclick="removeItem('${item.id}')" title="${lang === 'th' ? 'ลบสินค้า' : 'Remove'}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');

        // Calculate total and apply discount if user is logged in
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        // Check if user has discount
        const currentUser = JSON.parse(localStorage.getItem('phrae_otop_currentUser'));
        let discountPercentage = 0;
        let discountAmount = 0;
        let finalTotal = subtotal;

        if (currentUser) {
            const allUsers = JSON.parse(localStorage.getItem('phrae_otop_users')) || [];
            const fullUserData = allUsers.find(u => u.id === currentUser.id);

            if (fullUserData && fullUserData.discount && fullUserData.discount > 0) {
                discountPercentage = fullUserData.discount;
                discountAmount = Math.round(subtotal * (discountPercentage / 100));
                finalTotal = subtotal - discountAmount;
            }
        }

        // Update total display with discount breakdown
        if (cartTotalAmount) {
            if (discountAmount > 0) {
                cartTotalAmount.innerHTML = `
                    <div style="text-align: right;">
                        <div style="color: #888; font-size: 0.9rem; margin-bottom: 5px;">
                            ยอดรวม: <span style="text-decoration: line-through;">฿${subtotal.toLocaleString()}</span>
                        </div>
                        <div style="color: #4CAF50; font-size: 0.9rem; margin-bottom: 5px;">
                            <i class="fas fa-gift"></i> ส่วนลด ${discountPercentage}%: -฿${discountAmount.toLocaleString()}
                        </div>
                        <div style="color: var(--primary-color); font-size: 1.2rem; font-weight: bold;">
                            ยอดสุทธิ: ฿${finalTotal.toLocaleString()}
                        </div>
                    </div>
                `;
            } else {
                cartTotalAmount.textContent = `฿${subtotal.toLocaleString()}`;
            }
        }
    };

    window.updateQty = (id, change) => {
        const item = cart.find(i => i.id === id);
        if (item) {
            item.quantity += change;
            if (item.quantity <= 0) {
                cart = cart.filter(i => i.id !== id);
            }
            localStorage.setItem('otop_cart', JSON.stringify(cart));
            renderCart();
            updateBadge();
        }
    };

    window.removeItem = (id) => {
        cart = cart.filter(i => i.id !== id);
        localStorage.setItem('otop_cart', JSON.stringify(cart));
        renderCart();
        updateBadge();
    };

    renderCart();
});
