/**
 * account.js - Handles User Account & Order History
 */

document.addEventListener('DOMContentLoaded', () => {
    const ordersList = document.getElementById('orders-list');

    // Auth is global from auth.js
    const currentUser = Auth.getCurrentUser();

    if (!currentUser) {
        // Redirect to login if not logged in
        window.location.href = 'login.html';
        return;
    }

    const renderOrders = async () => {
        if (!ordersList) return;
        ordersList.innerHTML = '<div style="text-align:center; padding:40px; color:#aaa;">กำลังโหลดข้อมูล... / Loading...</div>';

        let userOrders = [];

        console.log('🔍 [Order History Debug] Starting order fetch...');
        console.log('👤 Current User ID:', currentUser.id);
        console.log('🔥 Firestore Available:', typeof window.db !== 'undefined');

        try {
            // 1. Try fetching from Firestore
            if (typeof window.db !== 'undefined') {
                console.log('📡 Fetching from Firestore...');
                const snapshot = await window.db.collection('orders')
                    .where('userId', '==', currentUser.id)
                    .orderBy('createdAt', 'desc') // Ensure indexing or use date
                    .get();

                console.log('📦 Firestore snapshot size:', snapshot.size);

                if (!snapshot.empty) {
                    userOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    console.log('✅ Orders fetched from Firestore:', userOrders.length);
                } else {
                    console.log('⚠️ Firestore returned empty - no orders found for this user');
                }
            } else {
                // Fallback to LocalStorage
                console.log('💾 Firestore not available, using LocalStorage...');
                const allOrders = JSON.parse(localStorage.getItem('otop_orders')) || [];
                userOrders = allOrders.filter(order => order.userId === currentUser.id);
                console.log('📋 Orders from LocalStorage:', userOrders.length);
            }
        } catch (error) {
            console.error("❌ Error fetching orders:", error);
            // Fallback on error (e.g. index missing)
            try {
                console.log('🔄 Retrying without orderBy...');
                const snapshot = await window.db.collection('orders').where('userId', '==', currentUser.id).get();
                userOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                // Client-side sort
                userOrders.sort((a, b) => new Date(b.date) - new Date(a.date));
                console.log('✅ Orders fetched (retry):', userOrders.length);
            } catch (innerError) {
                console.error("❌ Retry failed, falling back to LocalStorage:", innerError);
                const allOrders = JSON.parse(localStorage.getItem('otop_orders')) || [];
                userOrders = allOrders.filter(order => order.userId === currentUser.id);
                console.log('💾 Final fallback - LocalStorage orders:', userOrders.length);
            }
        }

        if (userOrders.length === 0) {
            ordersList.innerHTML = `
                <div style="text-align: center; color: #666; padding: 40px;">
                    <i class="fas fa-box-open" style="font-size: 3rem; margin-bottom: 15px;"></i>
                    <p>ไม่พบรายการสั่งซื้อของคุณ / No order history found.</p>
                    <a href="index.html#products" class="btn-primary" style="margin-top: 15px; display: inline-block;">เลือกซื้อสินค้า / Shop Now</a>
                </div>
            `;
            return;
        }

        ordersList.innerHTML = userOrders.map(order => `
            <div class="order-card">
                <div class="order-header">
                    <div>
                        <h3>คำสั่งซื้อ #${order.id.slice(0, 8)}...</h3>
                        <span class="order-date">${order.displayDate || order.date}</span>
                    </div>
                    <div class="order-status ${order.status}">${getStatusText(order.status)}</div>
                </div>
                <div class="order-items">
                    ${order.items.map(item => `
                        <div class="order-item">
                            <span>${(item.title || item.titleEn) || 'Item'} x ${item.quantity}</span>
                            <span>฿${((item.price || 0) * item.quantity).toLocaleString()}</span>
                        </div>
                    `).join('')}
                </div>
                <div class="order-footer">
                    <div class="order-total-row" style="display:flex; justify-content:space-between; width:100%;">
                         <span style="margin-left: 20px;">ยอดสุทธิ / Total</span>
                         <span style="color: var(--primary-color); font-weight:bold;">฿${(order.total || 0).toLocaleString()}</span>
                    </div>
                </div>
                ${order.trackingNumber ? `
                    <div style="margin-top:15px; padding-top:15px; border-top:1px solid rgba(255,255,255,0.1); text-align:right;">
                        <div style="font-size:0.9rem; margin-bottom:10px; color:#aaa;">
                            เลขพัสดุ (Flash Express): <strong style="color:#fff;">${order.trackingNumber}</strong>
                        </div>
                        <a href="https://www.flashexpress.co.th/tracking/?se=${order.trackingNumber}" target="_blank" class="btn-flash-tracking">
                            <i class="fas fa-bolt"></i> เช็คสถานะ Flash Express
                        </a>
                    </div>
                ` : ''}
            </div>
        `).join('');
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'pending': return 'กำลังตรวจสอบ / Pending';
            case 'paid': return 'ชำระเงินแล้ว / Paid';
            case 'shipped': return 'จัดส่งแล้ว / Shipped';
            case 'completed': return 'สำเร็จ / Completed';
            case 'cancelled': return 'ยกเลิก / Cancelled';
            default: return status;
        }
    };

    renderOrders();

    // PASSWORD CHANGE LOGIC
    const passwordForm = document.getElementById('change-password-form');
    if (passwordForm) {
        // Display user info
        document.getElementById('profile-name').textContent = currentUser.username;
        document.getElementById('profile-email').textContent = currentUser.email;
        document.getElementById('edit-username').value = currentUser.username;
        document.getElementById('edit-email').value = currentUser.email;

        // Display discount if user has one
        if (typeof window.db !== 'undefined') {
            window.db.collection('users').doc(currentUser.id).get().then(userDoc => {
                if (userDoc.exists) {
                    const fullUserData = userDoc.data();
                    if (fullUserData && fullUserData.discount && fullUserData.discount > 0) {
                        const discountSection = document.getElementById('discount-display-section');
                        const discountPercentage = document.getElementById('discount-percentage');

                        if (discountSection && discountPercentage) {
                            discountSection.style.display = 'block';
                            discountPercentage.textContent = `${fullUserData.discount}%`;
                        }
                    }
                }
            }).catch(error => console.error("Error fetching user discount:", error));
        }

        // Tab Switching Logic
        const menuLinks = document.querySelectorAll('.account-menu a[data-section]');

        passwordForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const currentPass = document.getElementById('current-password').value;
            const newPass = document.getElementById('new-user-password').value;
            const confirmPass = document.getElementById('confirm-user-password').value;
            
            if (typeof window.db === 'undefined') {
                 alert('ระบบฐานข้อมูลขัดข้อง / Database connection error');
                 return;
            }

            try {
                // 1. Verify Current Password by fetching user from Firestore
                const userDoc = await window.db.collection('users').doc(currentUser.id).get();
                
                if (!userDoc.exists) {
                    alert('ไม่พบข้อมูลผู้ใช้ / User not found');
                    return;
                }

                const storedUser = userDoc.data();

                if (storedUser.password !== currentPass) {
                    alert('รหัสผ่านปัจจุบันไม่ถูกต้อง / Incorrect current password');
                    return;
                }

                // 2. Verify New Password
                if (newPass.length < 4) {
                    alert('รหัสผ่านใหม่ต้องมีอย่างน้อย 4 ตัวอักษร');
                    return;
                }

                if (newPass !== confirmPass) {
                    alert('รหัสผ่านใหม่ไม่ตรงกัน / Passwords do not match');
                    return;
                }

                // 3. Save New Password to Firestore
                await window.db.collection('users').doc(currentUser.id).update({
                    password: newPass
                });

                alert('เปลี่ยนรหัสผ่านเรียบร้อยแล้ว / Password changed successfully');
                passwordForm.reset();
            } catch (error) {
                console.error("Change Password Error:", error);
                alert('เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน / Failed to change password');
            }
        });
    }
});
