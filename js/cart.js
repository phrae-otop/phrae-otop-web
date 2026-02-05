import { db, collection, addDoc, getDocs, doc, updateDoc } from './firebase-config.js';

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
            const nameInput = document.getElementById('cust-name');
            const phoneInput = document.getElementById('cust-phone');
            const addrInput = document.getElementById('cust-address');

            if (nameInput) nameInput.value = savedInfo.name || '';
            if (phoneInput) phoneInput.value = savedInfo.phone || '';
            if (addrInput) addrInput.value = savedInfo.address || '';
        } else {
            // If no saved info, try to fill from logged in user
            // Assuming Auth is global or we fetch from storage
            const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
            if (currentUser) {
                const nameInput = document.getElementById('cust-name');
                if (nameInput) nameInput.value = currentUser.username || '';
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

    // Slip Upload Handling
    const slipInput = document.getElementById('payment-slip');
    const slipPreview = document.getElementById('slip-preview');
    let slipData = null;

    if (slipInput) {
        slipInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    slipData = event.target.result;
                    if (slipPreview) {
                        slipPreview.innerHTML = `<img src="${slipData}" alt="Slip Preview">`;
                    }
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Real-time Checkout to Firestore
    const checkoutBtn = document.querySelector('.checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', async () => {
            if (cart.length === 0) return;

            const custName = document.getElementById('cust-name').value.trim();
            const custPhone = document.getElementById('cust-phone').value.trim();
            const custAddress = document.getElementById('cust-address').value.trim();


            if (!custName || !custPhone || !custAddress) {
                alert('กรุณากรอกข้อมูลให้ครบถ้วน / Please enter all required information.');
                return;
            }

            // Optional: Warn if slip not uploaded
            if (!slipData) {
                const confirmWithoutSlip = confirm('คุณยังไม่ได้แนบสลิปการโอนเงิน ต้องการดำเนินการต่อหรือไม่? / You haven\'t uploaded a payment slip. Continue anyway?');
                if (!confirmWithoutSlip) return;
            }

            // Show Loading State
            checkoutBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
            checkoutBtn.disabled = true;

            try {
                const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
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
                    createdAt: new Date() // Server timestamp would be better but Date is fine for test mode
                };

                // WRITE TO FIRESTORE
                await addDoc(collection(db, 'orders'), newOrder);

                // Reduce stock for ordered items (Optimistic update)
                // ideally this should be a transaction but simple update is fine for now
                const products = window.getProducts ? await window.getProducts() : [];
                for (const cartItem of cart) {
                    // Note: Because we don't have the Firestore Doc ID in the cart item easily (we used custom ID '1', '2'), 
                    // we need to find the Doc ID first.
                    // IMPORTANT: In seedProducts, we let Firestore generate IDs? No, we need to check products.js logic.
                    // The getProducts function returns objects that HAVE the doc id attached as 'id' if we refactored it correctly.
                    // Let's assume getProducts returns the Firestore ID as 'id'.

                    // Wait, in products.js we did: products.push({ id: doc.id, ...doc.data() });
                    // So the 'id' in the product object IS the Firestore Document ID.
                    // The cart item 'id' comes from the product 'id'.
                    // So we can update directly.

                    const product = products.find(p => p.id === cartItem.id);
                    if (product) {
                        const newStock = Math.max(0, (product.stock || 0) - cartItem.quantity);
                        const productRef = doc(db, 'products', product.id);
                        await updateDoc(productRef, { stock: newStock });
                    }
                }

                // SAVE ADDRESS FOR NEXT TIME
                localStorage.setItem('phrae_otop_cust_info', JSON.stringify({
                    name: custName,
                    phone: custPhone,
                    address: custAddress
                }));

                // Clear cart
                cart = [];
                localStorage.setItem('otop_cart', JSON.stringify(cart));

                alert('✅ สั่งซื้อสำเร็จ! ข้อมูลถูกส่งไปยังแอดมินเรียบร้อยแล้ว\nOrder confirmed!');
                window.location.href = 'index.html'; // Go back to home

            } catch (error) {
                console.error("Error creating order:", error);
                alert('เกิดข้อผิดพลาดในการสั่งซื้อ กรุณาลองใหม่อีกครั้ง\nError placing order: ' + error.message);
                checkoutBtn.innerHTML = 'Proceed to Checkout';
                checkoutBtn.disabled = false;
            }
        });
    }

    // Cart Page Logic
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotalAmount = document.getElementById('cart-total-amount');

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
            return;
        }

        cartItemsContainer.innerHTML = cart.map(item => `
            <div class="cart-item" data-id="${item.id}">
                <div class="cart-item-img">
                    <img src="${item.image}" alt="">
                </div>
                <div class="cart-item-info">
                    <h3>${lang === 'th' ? item.title : item.titleEn}</h3>
                    <p class="cart-item-price">฿${item.price.toLocaleString()}</p>
                </div>
                <div class="cart-item-qty">
                    <button class="qty-btn minus" onclick="updateQty('${item.id}', -1)">-</button>
                    <span>${item.quantity}</span>
                    <button class="qty-btn plus" onclick="updateQty('${item.id}', 1)">+</button>
                </div>
                <div class="cart-item-total">
                    ฿${(item.price * item.quantity).toLocaleString()}
                </div>
                <button class="remove-item-btn" onclick="removeItem('${item.id}')">
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
