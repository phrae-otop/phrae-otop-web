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
