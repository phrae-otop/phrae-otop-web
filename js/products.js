// products.js - Refactored for Compat SDK

const COLLECTION_NAME = 'products';

// Initial Products Data (Fallback / Seed)
const initialProducts = [
    {
        id: "1",
        title: "เสื้อหม้อห้อม",
        titleEn: "Mo Hom Shirt",
        desc: "ผ้าฝ้ายย้อมสีธรรมชาติ ใส่สบาย ดีไซน์ทันสมัย",
        descEn: "Natural dyed cotton, comfortable, modern design",
        price: 450,
        stock: 100,
        isBestSeller: true,
        category: "textile",
        image: "assets/images/mohom-shirt-3.jpg"
    },
    {
        id: "2",
        title: "ไม้สักแกะสลัก",
        titleEn: "Teak Wood Carving",
        desc: "ของแต่งบ้านมงคล จากไม้สักทองแท้",
        descEn: "Auspicious home decor from genuine golden teak",
        price: 1200,
        stock: 100,
        category: "woodwork",
        image: "assets/images/teak-carving.jpg"
    },
    {
        id: "3",
        title: "กระเป๋าผ้าด้นมือ",
        titleEn: "Hand-stitched Cloth Bag",
        desc: "งานฝีมือละเอียด เอกลักษณ์เฉพาะตัว",
        descEn: "Detailed craftsmanship, unique identity",
        price: 350,
        stock: 100,
        category: "handicraft",
        image: "assets/images/stitched-bag.jpg"
    },
    {
        id: "4",
        title: "ผ้าพันคอย้อมคราม",
        titleEn: "Indigo Dyed Scarf",
        desc: "นุ่มนวล อ่อนโยน ปลอดภัยไร้สารเคมี",
        descEn: "Soft, gentle, safe without chemicals",
        price: 250,
        stock: 100,
        category: "textile",
        image: "assets/images/indigo-scarf.png"
    },
    {
        id: "5",
        title: "น้ำผึ้งป่าเดือนห้า",
        titleEn: "Wild Forest Honey",
        price: 280,
        desc: "น้ำผึ้งแท้จากธรรมชาติ พรีเมียม ออร์แกนิก รสชาติหวานกลมกล่อม",
        descEn: "Pure natural honey, premium organic quality with rich smooth taste.",
        image: "assets/images/wild-honey.png",
        stock: 50,
        category: "herbal"
    },
    {
        id: "6",
        title: "กระเป๋าสานจากไม้ไผ่",
        titleEn: "Bamboo Woven Bag",
        price: 380,
        desc: "งานสานประณีต ดีไซน์ทันสมัย ใช้งานทนทาน ผลิตจากไม้ไผ่ธรรมชาติ",
        descEn: "Exquisite weaving, modern design, durable, made from natural bamboo.",
        image: "assets/images/bamboo-bag.png",
        stock: 30,
        category: "handicraft"
    },
    {
        id: "7",
        title: "แซคหม้อห้อม",
        titleEn: "Mo Hom Dress",
        price: 550,
        desc: "ชุดแซคยอดฮิต ผ้าหม้อห้อมแท้ ใส่สวย ระบายอากาศดี",
        descEn: "Popular Mo Hom dress, authentic fabric, beautiful fit, and breathable.",
        image: "assets/images/แซคหม้อห้อม-2.jpg",
        stock: 25,
        category: "textile"
    },
    {
        id: "8",
        title: "ผ้าไหมมัดหมี่",
        titleEn: "Mudmee Silk",
        price: 1200,
        desc: "ผ้าไหมมัดหมี่ทอมือ ลวดลายโบราณอันวิจิตรบรรจง",
        descEn: "Handwoven Mudmee silk with exquisite ancient patterns.",
        image: "assets/images/mudmee-silk.jpg",
        stock: 15,
        category: "textile"
    }
];

// Check if Firestore is usable
window.isFirestoreEnabled = false;

// Global fetch function (Moved UP to prevent hoisting issues)
window.getProducts = async () => {
    // Try Firestore first
    if (window.db) {
        try {
            const snapshot = await window.db.collection(COLLECTION_NAME).orderBy("updatedAt", "desc").get().catch(async (err) => {
                console.warn("Sorting failed, trying without order:", err);
                return await window.db.collection(COLLECTION_NAME).get();
            });

            const products = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                // REFINED SANITY CHECK: Only apply fallback if image is TRULY missing or broken
                const isImageInvalid = !data.image || data.image === "" || data.image === "undefined" || data.image.includes('undefined');

                if (isImageInvalid) {
                    const fallback = initialProducts.find(p => p.id === doc.id);
                    data.image = fallback ? fallback.image : 'assets/images/placeholder.png';
                }

                products.push({ id: doc.id, ...data });
            });

            if (products.length > 0) {
                try {
                    localStorage.setItem('otop_products_cache', JSON.stringify(products));
                } catch (cacheError) {
                    console.warn("LocalStorage Quota Exceeded. Clearing old cache...", cacheError);
                    try {
                        localStorage.clear();
                        localStorage.setItem('otop_products_cache', JSON.stringify(products));
                    } catch (retryError) {
                        console.error("Failed to cache products even after clear:", retryError);
                    }
                }
                return products;
            }
        } catch (error) {
            console.error("Firestore Fetch Error:", error);
            if (!window.hasAlertedFirestoreError) {
                alert(`ไม่สามารถเชื่อมต่อฐานข้อมูลได้ (Using Offline Data)\nError: ${error.message}\n\nกรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต หรือ API Key`);
                window.hasAlertedFirestoreError = true;
            }
        }
    } else {
        console.warn("window.db is undefined");
        // Don't alert here to avoid noise if just loading offline
    }

    // Fallback to cache or hardcoded initial products
    const cached = localStorage.getItem('otop_products_cache');
    if (cached) {
        try {
            return JSON.parse(cached);
        } catch (e) {
            localStorage.removeItem('otop_products_cache');
        }
    }

    return initialProducts;
};

// Debug Helper
window.debugFirestore = async () => {
    if (!window.db) {
        alert("Firestore (window.db) is not initialized!");
        return;
    }
    try {
        console.log("Attempting to connect to 'products'...");
        const snapshot = await window.db.collection('products').limit(1).get();
        alert(`Connection Successful! Found ${snapshot.size} docs in 'products'.`);
    } catch (e) {
        alert(`Connection Failed: ${e.message}`);
    }
};


// Seed Data Logic (Also moved up)
const seedProducts = async () => {
    if (!window.isFirestoreEnabled) return;

    try {
        const snapshot = await window.db.collection(COLLECTION_NAME).get();
        if (snapshot.empty) {
            console.log('Seeding initial products to Firestore...');
            const batch = window.db.batch();

            initialProducts.forEach(product => {
                // Use product ID as document ID to prevent duplicates
                const docRef = window.db.collection(COLLECTION_NAME).doc(product.id);
                batch.set(docRef, {
                    ...product,
                    createdAt: new Date().toISOString()
                });
            });

            await batch.commit();
            console.log('Initial seeding complete!');
            // Removed reload to prevent infinite loops, UI will refresh on next interaction or manual reload
        } else {
            console.log('Firestore already contains data. Skipping overwrite to prevent losing updates.');
        }
    } catch (error) {
        console.error("Error checking/seeding products: ", error);
    }
};

// Database Cleanup & Factory Reset Tool
window.fixDatabase = async () => {
    if (!window.isFirestoreEnabled) return;

    console.log('Running Hard Factory Reset...');
    try {
        const snapshot = await window.db.collection(COLLECTION_NAME).get();
        const batch = window.db.batch();
        let changeCount = 0;

        // 1. Force overwrite IDs 1-8 with initialProducts to ensure CATEGORIES are set
        initialProducts.forEach(product => {
            const docRef = window.db.collection(COLLECTION_NAME).doc(product.id);
            batch.set({
                ...product,
                updatedAt: new Date().toISOString(),
                isFactoryReset: true // Metadata to track reset
            }, { merge: true }); // Use merge to avoid wiping other potential fields
            changeCount++;
        });

        // 2. EXTRAS PRESERVATION: We no longer delete products with ID > 8 
        // to allow the user to add new products as requested.
        /*
        snapshot.forEach(doc => {
            const id = doc.id;
            const numericId = parseInt(id);
            if (isNaN(numericId) || numericId > 8) {
                batch.delete(doc.ref);
                changeCount++;
            }
        });
        */

        if (changeCount > 0) {
            await batch.commit();
            console.log(`Successfully updated 8 original products with categories.`);
            localStorage.removeItem('otop_products_cache');

            // Show success message before reload
            alert('อัปเดตหมวดหมู่สินค้าสำเร็จ! / Categories Updated! Reloading...');
            window.location.reload();
        } else {
            console.log('Database already matches initial state.');
        }
    } catch (error) {
        console.error("Factory Reset Error:", error);
    }
};

// Auto-trigger disabled to prevent infinite loops. 
// Run window.fixDatabase() manually in console if a reset is needed.
/*
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (window.isFirestoreEnabled) {
            window.fixDatabase();
        }
    }, 2000);
});
*/

// Check DB Readiness
const checkDB = () => {
    if (retryCount >= MAX_RETRIES) return; // Stop checking if max retries reached

    if (typeof window.db !== 'undefined') {
        window.isFirestoreEnabled = true;
        // Try caching products immediately
        window.getProducts().then(() => {
            // RE-ENABLED SEED: Safe as it only triggers if snapshot.empty is true.
            seedProducts();
        });
    } else {
        retryCount++;
        setTimeout(checkDB, 500);
    }
};

// Retry initialization with timeout limit
let retryCount = 0;
const MAX_RETRIES = 5; // Only retry 5 times (2.5 seconds total)

const initProducts = () => {
    checkDB();
    if (!window.isFirestoreEnabled && retryCount < MAX_RETRIES) {
        retryCount++;
        setTimeout(initProducts, 500);
    } else if (retryCount >= MAX_RETRIES) {
        // Firestore not available, use fallback
        console.warn('Firestore not available after retries. Using initialProducts fallback.');
        window.isFirestoreEnabled = false;
        // Cache initial products for immediate use
        localStorage.setItem('otop_products_cache', JSON.stringify(initialProducts));
    }
};

// Start init
initProducts();

// Save Products (Admin helper)
window.saveProducts = async (products) => {
    console.warn("saveProducts called but we are on Firestore. Should update docs individually.");
};
