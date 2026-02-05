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
        image: "assets/images/indigo-scarf.png"
    },
    {
        id: "5",
        desc: 'ผ้าหม้อห้อมแท้จากแพร่ ย้อมสีธรรมชาติ ลวดลายเป็นเอกลักษณ์ เนื้อผ้านุ่มระบายอากาศได้ดี เหมาะสำหรับตัดเสื้อผ้าหรือทำของที่ระลึก',
        descEn: 'Authentic Mo Hom fabric from Phrae, natural indigo dyed with unique patterns. Soft & breathable, perfect for clothing.',
        image: 'assets/images/products/phrae-indigo-fabric-1769412290960.png',
        category: 'textile',
        rating: 5,
        stock: 50
    },
    {
        id: '6',
        title: 'เซรามิกศิลาดล',
        titleEn: 'Celadon Ceramic Set',
        price: 2500,
        desc: 'ชุดน้ำชาเซรามิกเคลือบเขียวไข่กา (Celadon) ฝีมือช่างแพร่ ลวดลายแตกลายงาตามธรรมชาติ สวยงามและทนทาน',
        descEn: 'Exquisite Celadon tea set with signaturecrackled glaze. Handcrafted by master artisans in Phrae.',
        image: 'assets/images/products/lanna-ceramic.png',
        category: 'ceramic',
        rating: 4.8,
        stock: 20
    },
    {
        id: '7',
        title: 'ตะกร้าหวายสานละเอียด',
        titleEn: 'Fine Woven Rattan Basket',
        price: 850,
        desc: 'งานจักสานหวายคุณภาพสูง ลวดลายละเอียด แข็งแรง ทนทาน ใบใหญ่เหมาะสำหรับใส่ของหรือตกแต่งบ้าน',
        descEn: 'High-quality finely woven rattan basket. Durable and stylish, great for storage or home decor.',
        image: 'assets/images/products/rattan-basket.png',
        category: 'craft',
        rating: 4.7,
        stock: 35
    },
    {
        id: '8',
        title: 'ยาสระผมสมุนไพรอัญชัน',
        titleEn: 'Butterfly Pea Herbal Shampoo',
        price: 150,
        desc: 'แชมพูสมุนไพรสูตรโบราณ ผสมดอกอัญชัน ช่วยให้ผมดกดำ เงางาม ลดผมร่วง ปราศจากสารเคมี',
        descEn: 'Traditional herbal shampoo ensuring healthy, shiny, and black hair. Chemical-free.',
        image: 'assets/images/products/butterfly-shampoo.png',
        category: 'herbal',
        rating: 4.5,
        stock: 100
    },
    {
        id: '9',
        title: 'แคบหมูเมืองแพร่',
        titleEn: 'Phrae Crispy Pork Rinds',
        price: 100,
        desc: 'แคบหมูสูตรเด็ด กรอบอร่อย ไม่อมน้ำมัน ทานคู่กับน้ำพริกหนุ่มเข้ากันสุดๆ ของฝากยอดฮิต',
        descEn: 'Famous crispy pork rinds from Phrae. Perfect snack or side dish with chili paste.',
        image: 'assets/images/products/crispy-pork.jpg',
        category: 'food',
        rating: 4.9,
        stock: 200
    },
    {
        id: '10',
        title: 'ผ้าไหมมัดหมี่',
        titleEn: 'Mudmee Silk Fabric',
        price: 3500,
        desc: 'ผ้าไหมมัดหมี่ทอมือ ลวดลายวิจิตรบรรจง สะท้อนวัฒนธรรมล้านนา เหมาะสำหรับงานพิธีการ',
        descEn: 'Handwoven Mudmee silk with intricate patterns reflecting Lanna culture. Ideal for formal wear.',
        image: 'assets/images/products/mudmee-silk.jpg',
        category: 'textile',
        rating: 5,
        stock: 15
    }
];

// Check if Firestore is usable
// Wait for window.db to be initialized in firebase-config.js
window.isFirestoreEnabled = false;

// Function to check DB readiness
const checkDB = () => {
    if (typeof window.db !== 'undefined') {
        window.isFirestoreEnabled = true;
        // Try caching products immediately
        window.getProducts();
    }
};

// Seed Data Logic
const seedProducts = async () => {
    if (!window.isFirestoreEnabled) return;

    try {
        const snapshot = await window.db.collection(COLLECTION_NAME).get();
        if (snapshot.empty) {
            console.log('Seeding initial products to Firestore...');
            const batch = window.db.batch();

            initialProducts.forEach(product => {
                const docRef = window.db.collection(COLLECTION_NAME).doc();
                batch.set(docRef, {
                    ...product,
                    createdAt: new Date().toISOString()
                });
            });

            await batch.commit();
            console.log('Seeding complete!');
            window.location.reload();
        }
    } catch (error) {
        console.error("Error seeding products: ", error);
    }
};

// Retry initialization
const initProducts = () => {
    checkDB();
    if (window.isFirestoreEnabled) {
        seedProducts();
    } else {
        setTimeout(initProducts, 500);
    }
};

// Start init
initProducts();

// Global fetch function
window.getProducts = async () => {
    // Try Firestore first
    if (window.isFirestoreEnabled && window.db) {
        try {
            const snapshot = await window.db.collection(COLLECTION_NAME).get();
            const products = [];
            snapshot.forEach(doc => {
                products.push({ id: doc.id, ...doc.data() });
            });

            // Cache
            localStorage.setItem('otop_products_cache', JSON.stringify(products));

            return products.length > 0 ? products : initialProducts;
        } catch (error) {
            console.error("Firestore Fetch Error:", error);
        }
    }

    // Fallback to cache
    const cached = localStorage.getItem('otop_products_cache');
    if (cached) return JSON.parse(cached);

    return initialProducts;
};

// Save Products (Admin helper, mostly unused now as we write direct)
window.saveProducts = async (products) => {
    console.warn("saveProducts called but we are on Firestore. Should update docs individually.");
};
