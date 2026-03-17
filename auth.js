const AUTH_VERSION = "v1.1.2-sync-debug";
console.log(`[Auth System] Version: ${AUTH_VERSION}`);

const AUTH_CONFIG = {
    USER_KEY: 'phrae_otop_currentUser',
    USERS_LIST_KEY: 'phrae_otop_users',
};

const Auth = {
    // Get currently logged in user
    getCurrentUser() {
        const userJson = localStorage.getItem(AUTH_CONFIG.USER_KEY);
        return userJson ? JSON.parse(userJson) : null;
    },

    // Register a new user
    async register(username, email, password) {
        console.log(`🚀 [Registration] Attempting to register ${email}...`);
        
        // Robust DB check
        let db = window.db;
        if (!db) {
            console.log("📡 DB not ready, waiting for initialization...");
            for (let i = 0; i < 30; i++) {
                await new Promise(r => setTimeout(r, 100));
                if (window.db) {
                    db = window.db;
                    console.log("✅ DB Connected!");
                    break;
                }
            }
        }

        if (!db) {
            console.error("❌ DB connection timed out in Auth.register");
            return { success: false, message: 'ระบบฐานข้อมูลขัดข้อง (Timeout) / Database connection error' };
        }

        try {
            const newUserRef = window.db.collection('users').doc();
            const newUser = {
                id: newUserRef.id,
                username,
                email,
                password, // Note: In a real app this should be hashed
                createdAt: new Date().toISOString(),
                source: 'online_registration'
            };

            console.log("📡 Firestore: Saving new user document to 'users' collection...");
            await newUserRef.set(newUser);
            console.log("✅ User document saved successfully in Firestore ID:", newUserRef.id);
            alert('สมัครสมาชิกสำเร็จ! ข้อมูลถูกบันทึกลงฐานข้อมูลออนไลน์แล้ว / Registration Successful!');

            // Auto login after register
            const sessionUser = { ...newUser };
            delete sessionUser.password;
            localStorage.setItem(AUTH_CONFIG.USER_KEY, JSON.stringify(sessionUser));
            
            return { success: true };
        } catch (error) {
            console.error("Register Error:", error);
            return { success: false, message: 'เกิดข้อผิดพลาดในการสมัครสมาชิก / Registration failed' };
        }
    },

    // Login
    async login(email, password) {
         if (typeof window.db === 'undefined') {
             return { success: false, message: 'ระบบฐานข้อมูลขัดข้อง กรุณาลองใหม่ภายหลัง / Database connection error' };
         }

         try {
             const userSnapshot = await window.db.collection('users')
                .where('email', '==', email)
                .where('password', '==', password)
                .get();

             if (!userSnapshot.empty) {
                 const doc = userSnapshot.docs[0];
                 const user = { id: doc.id, ...doc.data() };
                 
                 const sessionUser = { ...user };
                 delete sessionUser.password;
                 localStorage.setItem(AUTH_CONFIG.USER_KEY, JSON.stringify(sessionUser));
                 return { success: true };
             }

             return { success: false, message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง / Invalid email or password' };
         } catch (error) {
             console.error("Login Error:", error);
             return { success: false, message: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ / Login failed' };
         }
    },

    // Logout
    logout() {
        localStorage.removeItem(AUTH_CONFIG.USER_KEY);
        window.location.href = 'index.html';
    },

    // Update navbar state
    updateNavbar() {
        const user = this.getCurrentUser();
        const navActions = document.querySelector('.nav-actions');

        if (!navActions) return;

        // Remove existing auth links if any
        const existingAuth = document.querySelector('.auth-nav-item');
        if (existingAuth) existingAuth.remove();

        const authItem = document.createElement('div');
        authItem.className = 'auth-nav-item';

        if (user) {
            authItem.innerHTML = `
                <div class="user-menu">
                    <a href="account.html?tab=orders" class="history-btn" title="ประวัติการสั่งซื้อ (Order History)" style="margin-right:5px;">
                        <i class="fas fa-history"></i>
                    </a>
                    <a href="account.html" class="user-btn">
                        <i class="fas fa-user-circle"></i>
                        <span>${user.username}</span>
                    </a>
                    <button onclick="Auth.logout()" class="logout-btn" title="Logout">
                        <i class="fas fa-sign-out-alt"></i>
                    </button>
                </div>
            `;
        } else {
            authItem.innerHTML = `
                <a href="login.html" class="btn-login" data-i18n="nav_register">สมัครเข้าใช้งาน</a>
            `;
        }

        // Insert after cart
        const cartAction = document.querySelector('.cart-action');
        if (cartAction) {
            // Check if auth item already exists to prevent duplication on re-runs
            if (!document.querySelector('.auth-nav-item')) {
                cartAction.after(authItem);

                // Trigger translation update for the new element
                const currentLang = localStorage.getItem('preferredLang') || 'th';
                if (window.updateLanguage) {
                    window.updateLanguage(currentLang);
                }
            }
        } else {
            navActions.appendChild(authItem);
        }
    }
};

// Global for inline onclick
window.Auth = Auth;

document.addEventListener('DOMContentLoaded', () => {
    Auth.updateNavbar();
});
