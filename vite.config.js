import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    root: './',
    base: './',
    server: {
        port: 3000,
        open: true,
    },
    build: {
        outDir: 'dist',
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                cart: resolve(__dirname, 'cart.html'),
                reviews: resolve(__dirname, 'reviews.html'),
                howto: resolve(__dirname, 'how-to-order.html'),
                admin: resolve(__dirname, 'admin-login.html'),
                dashboard: resolve(__dirname, 'admin-dashboard.html'),
            },
        },
    },
});
