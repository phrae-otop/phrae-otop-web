const AUTH_VERSION = "v2.0.0-firestore";
console.log(`[Auth System] Version: ${AUTH_VERSION}`);

const AUTH_CONFIG = {
    USER_KEY: 'phrae_otop_currentUser',
    USERS_LIST_KEY: 'phrae_otop_users',
};

const Auth = {
    getCurrentUser() {
        const userJson = localStorage.getItem(AUTH_CONFIG.USER_KEY);
        return userJson ? JSON.parse(userJson) : null;
    },

    async register(username, email, password) {
        console.log(`🚀 [Registration] Attempting: ${email}`);
        let db = window.db;
        if (!db) {
            for (let i = 0; i < 30; i++) {
                await new Promise(r => setTimeout(r, 100));
                if (window.db) { db = window.db; break; }
            }
        }
        if (!db) return { success: false, message: 'ระบบฐานข้อมูลขัดข้อง' };

        try {
            const newUserRef = window.db.collection('users').doc();
            const newUser = { id: newUserRef.id, username, email, password, createdAt: new Date().toISOString(), source: 'online_registration' };
            await newUserRef.set(newUser);
            console.log('✅ User saved to Firestore:', newUserRef.id);
            const sessionUser = { ...newUser };
            delete sessionUser.password;
            localStorage.setItem(AUTH_CONFIG.USER_KEY, JSON.stringify(sessionUser));
            return { success: true };
        } catch (error) {
            console.error('Register Error:', error);
            return { success: false, message: 'เกิดข้อผิดพลาด: ' + error.message };
        }
    },

    async login(email, password) {
        if (!window.db) return { success: false, message: 'ระบบฐานข้อมูลขัดข้อง' };
        try {
            const snapshot = await window.db.collection('users').where('email', '==', email).where('password', '==', password).get();
            if (!snapshot.empty) {
                const user = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
                const sessionUser = { ...user };
                delete sessionUser.password;
                localStorage.setItem(AUTH_CONFIG.USER_KEY, JSON.stringify(sessionUser));
                return { success: true };
            }
            return { success: false, message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' };
        } catch (error) {
            return { success: false, message: 'เกิดข้อผิดพลาด: ' + error.message };
        }
    },

    logout() {
        localStorage.removeItem(AUTH_CONFIG.USER_KEY);
        window.location.href = 'index.html';
    },

    updateNavbar() {
        const user = this.getCurrentUser();
        const navActions = document.querySelector('.nav-actions');
        if (!navActions) return;
        const existingAuth = document.querySelector('.auth-nav-item');
        if (existingAuth) existingAuth.remove();
        const authItem = document.createElement('div');
        authItem.className = 'auth-nav-item';
        if (user) {
            authItem.innerHTML = `<div class="user-menu"><a href="account.html?tab=orders" class="history-btn" style="margin-right:5px;"><i class="fas fa-history"></i></a><a href="account.html" class="user-btn"><i class="fas fa-user-circle"></i><span>${user.username}</span></a><button onclick="Auth.logout()" class="logout-btn"><i class="fas fa-sign-out-alt"></i></button></div>`;
        } else {
            authItem.innerHTML = `<a href="login.html" class="btn-login" data-i18n="nav_register">สมัครเข้าใช้งาน</a>`;
        }
        const cartAction = document.querySelector('.cart-action');
        if (cartAction) { if (!document.querySelector('.auth-nav-item')) { cartAction.after(authItem); const lang = localStorage.getItem('preferredLang') || 'th'; if (window.updateLanguage) window.updateLanguage(lang); } }
        else { navActions.appendChild(authItem); }
    }
};

window.Auth = Auth;
document.addEventListener('DOMContentLoaded', () => { Auth.updateNavbar(); });
