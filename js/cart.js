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
            if (document.getElementById('name')) document.getElementById('name').value = savedInfo.name || '';
            if (document.getElementById('tel')) document.getElementById('tel').value = savedInfo.tel || '';
            if (document.getElementById('address')) document.getElementById('address').value = savedInfo.address || '';
        } else {
            // Try Auth User
            const currentUser = JSON.parse(localStorage.getItem('phrae_otop_currentUser'));
            if (currentUser) {
                if (document.getElementById('name')) document.getElementById('name').value = currentUser.name || '';
                if (document.getElementById('tel')) document.getElementById('tel').value = currentUser.tel || '';
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

    // Real-time Checkout to Firestore
    const checkoutBtn = document.querySelector('.checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', async (e) => {
            // Prevent default form submission if it's a button inside form, though usually type="button" is safer
            // But here it seems attached to .checkout-btn which might be outside or explicitly handled.
            e.preventDefault();

            if (cart.length === 0) return;

            const custName = document.getElementById('name').value.trim();
            const custPhone = document.getElementById('tel').value.trim();
            const custAddress = document.getElementById('address').value.trim();


            if (!custName || !custPhone || !custAddress) {
                alert('กรุณากรอกข้อมูลให้ครบถ้วน / Please enter all required information.');
                return;
            }

            // Slip handling currently simplified or removed in this view
            const slipInput = document.getElementById('slip');
            let slipData = null;
            if (slipInput && slipInput.files[0]) {
                // simple verify
            } else {
                if (!confirm('คุณยังไม่ได้แนบสลิปการโอนเงิน ต้องการดำเนินการต่อหรือไม่?')) return;
            }

            // Show Loading State
            const originalText = checkoutBtn.innerHTML;
            checkoutBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
            checkoutBtn.disabled = true;

            try {
                const currentUser = JSON.parse(localStorage.getItem('phrae_otop_currentUser'));
                const newOrder = {
                    userId: currentUser ? currentUser.id : 'guest',
                    date: new Date().toISOString(), // Use ISO for better sorting
                    displayDate: new Date().toLocaleString(),
                    customer: {
                        name: custName,
                        phone: custPhone,
                        address: custAddress
                    },
                    items: [...cart],
                    total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
                    status: 'pending',
                    slip: slipData,
                    createdAt: new Date()
                };

                // WRITE TO FIRESTORE
                if (typeof window.db !== 'undefined') {
                    await window.db.collection('orders').add(newOrder);

                    // Reduce stock for ordered items (Optimistic update)
                    const products = window.getProducts ? await window.getProducts() : [];

                    const batch = window.db.batch();

                    for (const cartItem of cart) {
                        const product = products.find(p => p.id === cartItem.id);
                        if (product) {
                            const productRef = window.db.collection('products').doc(product.id);
                            // Decrement stock
                            // For compat SDK, we might need firebase.firestore.FieldValue.increment(-cartItem.quantity)
                            // But for safety in simple mode, we just write new stock
                            const newStock = Math.max(0, (product.stock || 0) - cartItem.quantity);
                            batch.update(productRef, { stock: newStock });
                        }
                    }
                    await batch.commit();
                } else {
                    // Fallback incase DB is down
                    let orders = JSON.parse(localStorage.getItem('otop_orders')) || [];
                    orders.push(newOrder);
                    localStorage.setItem('otop_orders', JSON.stringify(orders));
                }

                // SAVE ADDRESS FOR NEXT TIME
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
                window.location.href = 'index.html'; // Go back to home

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
    const cartTotalAmount = document.getElementById('final-price'); // Adjusted ID based on earlier context

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
                 <img src="${item.image}" alt="">
                <div class="cart-item-details">
                    <h4>${lang === 'th' ? item.title : item.titleEn}</h4>
                    <p>฿${item.price.toLocaleString()}</p>
                     <div class="qty-controls">
                        <button onclick="updateQty('${item.id}', -1)">-</button>
                        <span>${item.quantity}</span>
                        <button onclick="updateQty('${item.id}', 1)">+</button>
                    </div>
                </div>
                <button class="remove-btn" onclick="removeItem('${item.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');

        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        if (cartTotalAmount) cartTotalAmount.textContent = `฿${total.toLocaleString()}`;
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
