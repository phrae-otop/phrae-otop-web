// Newsletter subscription with automatic discount
class NewsletterManager {
    static async subscribe(email) {
        const currentUser = JSON.parse(localStorage.getItem('phrae_otop_currentUser'));

        if (!currentUser) {
            alert('กรุณาเข้าสู่ระบบก่อนสมัครรับข่าวสาร เพื่อรับส่วนลด 10%\n\nPlease login first to subscribe and receive 10% discount');
            window.location.href = 'login.html';
            return;
        }

        // Check if user already has newsletter subscription
        const users = JSON.parse(localStorage.getItem('phrae_otop_users')) || [];
        const userIndex = users.findIndex(u => u.id === currentUser.id);

        if (userIndex === -1) {
            alert('ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบใหม่');
            return;
        }

        const user = users[userIndex];

        // Check if already subscribed
        if (user.newsletter) {
            alert('✅ คุณได้สมัครรับข่าวสารแล้ว\n\nส่วนลดของคุณ: ' + (user.discount || 0) + '%\n\nYou are already subscribed!\nYour discount: ' + (user.discount || 0) + '%');
            return;
        }

        // Subscribe and apply 10% discount
        users[userIndex].newsletter = true;
        users[userIndex].newsletterEmail = email;
        users[userIndex].discount = 10; // Auto-apply 10% discount
        users[userIndex].newsletterDate = new Date().toISOString();

        // Save to localStorage
        localStorage.setItem('phrae_otop_users', JSON.stringify(users));

        // Update current user session
        currentUser.newsletter = true;
        currentUser.discount = 10;
        localStorage.setItem('phrae_otop_currentUser', JSON.stringify(currentUser));

        // Save to Firestore if available
        if (typeof window.db !== 'undefined') {
            try {
                await window.db.collection('users').doc(user.id).update({
                    newsletter: true,
                    newsletterEmail: email,
                    discount: 10,
                    newsletterDate: new Date()
                });
            } catch (error) {
                console.error('Firestore update failed:', error);
            }
        }

        alert('✅ สมัครรับข่าวสารสำเร็จ!\n\nคุณได้รับส่วนลด 10% สำหรับการสั่งซื้อทุกครั้ง\nส่วนลดจะถูกนำไปใช้อัตโนมัติเมื่อชำระเงิน\n\n✅ Newsletter subscription successful!\n\nYou received 10% discount for all purchases\nDiscount will be applied automatically at checkout');

        // Clear input
        const newsletterInput = document.querySelector('.newsletter-section input[type="email"]');
        if (newsletterInput) newsletterInput.value = '';
    }
}

// Initialize newsletter form handler
document.addEventListener('DOMContentLoaded', () => {
    const newsletterForm = document.querySelector('.newsletter-section form');
    const newsletterBtn = document.querySelector('.newsletter-section button');
    const newsletterInput = document.querySelector('.newsletter-section input[type="email"]');

    if (newsletterBtn && newsletterInput) {
        newsletterBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const email = newsletterInput.value.trim();

            if (!email) {
                alert('กรุณากรอกอีเมล / Please enter your email');
                return;
            }

            if (!email.includes('@') || !email.includes('.')) {
                alert('กรุณากรอกอีเมลที่ถูกต้อง / Please enter a valid email');
                return;
            }

            NewsletterManager.subscribe(email);
        });

        // Also handle Enter key
        newsletterInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                newsletterBtn.click();
            }
        });
    }
});
