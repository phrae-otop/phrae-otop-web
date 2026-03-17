// Newsletter subscription - Firestore-based v2.0
class NewsletterManager {
    static async subscribe(email) {
        // ตรวจสอบว่า Login อยู่ไหม
        const currentUser = JSON.parse(localStorage.getItem('phrae_otop_currentUser'));

        if (!currentUser) {
            alert('กรุณาเข้าสู่ระบบก่อนสมัครรับข่าวสาร เพื่อรับส่วนลด 10%\n\nPlease login first to receive 10% discount');
            window.location.href = 'login.html';
            return;
        }

        // ตรวจสอบว่าสมัครแล้วหรือยัง (จาก session)
        if (currentUser.newsletter) {
            alert('✅ คุณได้สมัครรับข่าวสารแล้ว\n\nส่วนลดของคุณ: ' + (currentUser.discount || 10) + '%\n\nYou are already subscribed!\nYour discount: ' + (currentUser.discount || 10) + '%');
            return;
        }

        // รอให้ Firestore พร้อม
        let db = window.db;
        if (!db) {
            for (let i = 0; i < 20; i++) {
                await new Promise(r => setTimeout(r, 100));
                if (window.db) { db = window.db; break; }
            }
        }

        if (!db) {
            alert('ระบบฐานข้อมูลขัดข้อง กรุณาลองใหม่ภายหลัง');
            return;
        }

        try {
            // อัปเดตใน Firestore
            await db.collection('users').doc(currentUser.id).update({
                newsletter: true,
                newsletterEmail: email,
                discount: 10,
                newsletterDate: new Date().toISOString()
            });

            // อัปเดต session ในเครื่อง
            currentUser.newsletter = true;
            currentUser.discount = 10;
            localStorage.setItem('phrae_otop_currentUser', JSON.stringify(currentUser));

            alert('✅ สมัครรับข่าวสารสำเร็จ!\n\nคุณได้รับส่วนลด 10% สำหรับการสั่งซื้อทุกครั้ง\nส่วนลดจะถูกนำไปใช้อัตโนมัติเมื่อชำระเงิน\n\n✅ Subscribed successfully!\nYou received 10% discount on all purchases!');

            // ล้าง input
            const newsletterInput = document.querySelector('.newsletter-section input[type="email"]');
            if (newsletterInput) newsletterInput.value = '';

        } catch (error) {
            console.error('Newsletter subscribe error:', error);
            // ถ้า document ไม่มีใน Firestore (อาจเป็นสมาชิกเก่าจาก localStorage) ให้บันทึกใหม่
            if (error.code === 'not-found') {
                alert('ไม่พบข้อมูลบัญชีใน Firestore กรุณาสมัครสมาชิกใหม่');
            } else {
                alert('เกิดข้อผิดพลาด: ' + error.message);
            }
        }
    }
}

// Initialize newsletter form handler
document.addEventListener('DOMContentLoaded', () => {
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

        // Handle Enter key
        newsletterInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                newsletterBtn.click();
            }
        });
    }
});
