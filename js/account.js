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

    const renderOrders = () => {
        if (!ordersList) return;

        const allOrders = JSON.parse(localStorage.getItem('otop_orders')) || [];

        // Filter orders for current user by ID
        // Also support potential backward compatibility or simple matching if needed, but ID is best
        const userOrders = allOrders.filter(order => order.userId === currentUser.id);

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

        // Sort by date new to old (assuming order in array is already new-to-old due to unshift, but good to be sure if date logic changes)
        // Since we split by unshift in cart.js, index 0 is newest.

        ordersList.innerHTML = userOrders.map(order => `
            <div class="order-card">
                <div class="order-header">
                    <div>
                        <h3>คำสั่งซื้อ #${order.id.slice(-6)}</h3>
                        <span class="order-date">${order.date}</span>
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
                <div class="order-total">
                    <span>ยอดสุทธิ / Total</span>
                    <span>฿${(order.total || 0).toLocaleString()}</span>
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
        passwordForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const currentPass = document.getElementById('current-password').value;
            const newPass = document.getElementById('new-user-password').value;
            const confirmPass = document.getElementById('confirm-user-password').value;

            // 1. Verify Current Password
            // Note: In a real app we would hash, here we check plain text against current session user (or refetch from list)
            // But session user usually doesn't store pwd for security. We must check against `phrae_otop_users`.
            const allUsers = JSON.parse(localStorage.getItem('phrae_otop_users')) || [];
            const userIndex = allUsers.findIndex(u => u.id === currentUser.id);

            if (userIndex === -1) {
                alert('ไม่พบข้อมูลผู้ใช้ / User not found');
                return;
            }

            const storedUser = allUsers[userIndex];

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

            // 3. Save New Password
            storedUser.password = newPass;
            allUsers[userIndex] = storedUser;
            localStorage.setItem('phrae_otop_users', JSON.stringify(allUsers));

            // Also verify if current session needs update? Session usually excludes password.
            // If storedUser in session had password, update it. But Auth logic removes it.

            alert('เปลี่ยนรหัสผ่านเรียบร้อยแล้ว / Password changed successfully');
            passwordForm.reset();
        });
    }
});
