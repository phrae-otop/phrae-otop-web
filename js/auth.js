/**
 * auth.js - Handles User Authentication and Session Management
 */

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
    register(username, email, password) {
        const users = JSON.parse(localStorage.getItem(AUTH_CONFIG.USERS_LIST_KEY)) || [];

        // Check if user already exists
        if (users.find(u => u.email === email)) {
            return { success: false, message: 'อีเมลนี้ถูกใช้งานแล้ว / Email already registered' };
        }

        const newUser = {
            id: Date.now(),
            username,
            email,
            password, // In a real app, this would be hashed
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        localStorage.setItem(AUTH_CONFIG.USERS_LIST_KEY, JSON.stringify(users));

        // Auto login after register
        this.login(email, password);
        return { success: true };
    },

    // Login
    login(email, password) {
        const users = JSON.parse(localStorage.getItem(AUTH_CONFIG.USERS_LIST_KEY)) || [];
        const user = users.find(u => u.email === email && u.password === password);

        if (user) {
            const sessionUser = { ...user };
            delete sessionUser.password; // Don't store password in session
            localStorage.setItem(AUTH_CONFIG.USER_KEY, JSON.stringify(sessionUser));
            return { success: true };
        }

        return { success: false, message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง / Invalid email or password' };
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
