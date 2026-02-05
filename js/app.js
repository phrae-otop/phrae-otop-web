// Hide Preloader
window.addEventListener('load', () => {
    const preloader = document.getElementById('preloader');
    if (preloader) {
        setTimeout(() => {
            preloader.style.opacity = '0';
            setTimeout(() => {
                preloader.style.display = 'none';
            }, 500);
        }, 800);
    }
});

document.addEventListener('DOMContentLoaded', async () => {
    // Translations Data
    const translations = {
        th: {
            nav_home: 'หน้าแรก',
            nav_about: 'เรื่องราวของเรา',
            nav_products: 'รายการสินค้า',
            nav_reviews: 'รีวิวสินค้า',
            nav_howto: 'วิธีการสั่งซื้อ',
            nav_contact: 'ติดต่อเรา',
            hero_title: 'สินค้า OTOP<br><span class="highlight">จังหวัดแพร่</span>',
            hero_subtitle: 'สัมผัสเสน่ห์ผ้าหม้อห้อม งานไม้สัก และหัตถกรรมพื้นบ้านอันเลื่องชื่อ',
            hero_btn: 'ชมสินค้า',
            about_title: 'มนต์เสน่ห์แห่งล้านนาตะวันออก',
            about_desc: 'จังหวัดแพร่ ดินแดนแห่งขุนเขาและป่าไม้สักทอง แหล่งกำเนิด "ผ้าหม้อห้อม" ภูมิปัญญาการย้อมผ้าสีครามจากธรรมชาติ และงานแกะสลักไม้ที่วิจิตรบรรจง สินค้าโอทอปของเราเปี่ยมไปด้วยจิตวิญญาณแห่งวัฒนธรรมที่สืบทอดกันมายาวนาน',
            section_products: 'รายการสินค้า',
            reviews_title: 'เสียงตอบรับจากลูกค้า',
            reviews_subtitle: 'ความประทับใจจริงจากผู้ที่ได้สัมผัสสินค้า OTOP เมืองแพร่',
            write_review: 'เขียนรีวิวของคุณ',
            form_name: 'ชื่อของคุณ',
            form_rating: 'ความพึงพอใจ',
            form_message: 'ข้อความรีวิว',
            howto_title: 'วิธีการสั่งซื้อสินค้า',
            howto_subtitle: 'ขั้นตอนง่ายๆ ในการสั่งซื้อสินค้า OTOP ส่งตรงถึงหน้าบ้านคุณ',
            step1_title: 'เลือกสินค้า',
            step1_desc: 'เลือกดูสินค้าที่คุณถูกใจจากหน้ารายการสินค้าของเรา',
            step2_title: 'หยิบใส่ตะกร้า',
            step2_desc: 'กดปุ่ม "เพิ่มลงตะกร้า" เพื่อรวบรวมสินค้าที่คุณต้องการ',
            step3_title: 'ชำระเงิน',
            step3_desc: 'ตรวจสอบรายการและโอนเงินผ่านบัญชีธนาคาร',
            step4_title: 'แจ้งชำระเงิน',
            step4_desc: 'กรอกชื่อ-ที่อยู่จัดส่ง และแนบหลักฐานการโอนเงิน',
            bank_info_title: 'บัญชีธนาคารสำหรับโอนเงิน',
            p1_title: 'เสื้อหม้อห้อม',
            p1_desc: 'ผ้าฝ้ายย้อมสีธรรมชาติ ใส่สบาย ดีไซน์ทันสมัย',
            p2_title: 'ไม้สักแกะสลัก',
            p2_desc: 'ของแต่งบ้านมงคล จากไม้สักทองแท้',
            p3_title: 'กระเป๋าผ้าด้นมือ',
            p3_desc: 'งานฝีมือละเอียด เอกลักษณ์เฉพาะตัว',
            p4_title: 'ผ้าพันคอย้อมคราม',
            p4_desc: 'นุ่มนวล อ่อนโยน ปลอดภัยไร้สารเคมี',
            p5_title: 'น้ำผึ้งป่าเดือนห้า',
            p5_desc: 'น้ำผึ้งแท้จากธรรมชาติ พรีเมียม ออร์แกนิก',
            p6_title: 'กระเป๋าสานไม้ไผ่',
            p6_desc: 'งานสานประณีต ดีไซน์ทันสมัย ใช้งานทนทาน',
            footer_contact: 'ติดต่อเรา',
            footer_addr: 'ศูนย์จำหน่ายสินค้า OTOP จังหวัดแพร่',
            footer_tel: 'โทร',
            footer_follow: 'ติดตามข่าวสาร',
            search_placeholder: 'ค้นหาสินค้า...',
            add_to_cart: 'เพิ่มลงตะกร้า',
            cart_title: 'ตะกร้าสินค้าของคุณ',
            cart_empty: 'ตะกร้าของคุณยังว่างอยู่',
            cart_total: 'ยอดรวมทั้งหมด',
            checkout_btn: 'ดำเนินการชำระเงิน',
            continue_shopping: 'เลือกซื้อสินค้าต่อ',
            remove_item: 'ลบออก',
            banner_title: 'ภูมิปัญญาที่สืบทอดจากรุ่นสู่รุ่น',
            banner_subtitle: 'สัมผัสวิถีชีวิตและความประณีตของช่างฝีมือชาวแพร่',
            heritage_title: 'ภูมิปัญญาแห่งวิถีแพร่',
            heritage_mohom_title: 'ผ้าหม้อห้อมแพร่',
            heritage_mohom_desc: 'ย้อมด้วยครามธรรมชาติ เอกลักษณ์สีน้ำเงินครามที่สะท้อนถึงวิถีชุมชนและความภูมิใจของชาวกอฮะ',
            heritage_teak_title: 'งานไม้สักทอง',
            heritage_teak_desc: 'ประณีตศิลป์จากการแกะสลักไม้สักทอง แหล่งไม้คุณภาพอันดับหนึ่งที่สร้างชื่อเสียงให้จังหวัดแพร่',
            heritage_weaving_title: 'เครื่องจักสานพื้นบ้าน',
            heritage_weaving_desc: 'ถักทอด้วยมือจากวัสดุธรรมชาติ คงทนและดีไซน์ร่วมสมัย ผสานเสน่ห์หัตถกรรมไทย',
            history_title: 'ความเป็นมาและความสำคัญ',
            history_text: 'แพร่คือหัวใจแห่งลุ่มน้ำยม ดินแดนที่รุ่มรวยไปด้วยทรัพยากรธรรมชาติและประวัติศาสตร์ที่ยาวนานกว่าพันปี จากความสำคัญในฐานะ "นครแห่งไม้สักทอง" สู่การเป็นแหล่งบ่มเพาะปราชญ์ชาวบ้านผู้เชี่ยวชาญในงานหัตถศิลป์ ทุกชิ้นงาน OTOP ของเราคือการหลอมรวมจิตวิญญาณแห่งล้านนาตะวันออกและความมุ่งมั่นที่จะรักษาภูมิปัญญาโบราณให้ดำรงอยู่ท่ามกลางยุคสมัยที่เปลี่ยนแปลง',
            gallery_title: 'คอลเลกชันธรรมชาติเมืองแพร่',
            gallery_1: 'มนต์เสน่ห์ใบสักทอง',
            gallery_2: 'สวนสวรรค์ล้านนา',
            gallery_3: 'ภูมิปัญญาจากผืนป่า',
            journey_title: 'ท่องเที่ยวนครแพร่',
            journey_1_title: 'วัดพระธาตุช่อแฮ',
            journey_1_desc: 'ปูชนียสถานคู่บ้านคู่เมืองแพร่',
            journey_2_title: 'แพะเมืองผี',
            journey_2_desc: 'ปรากฏการณ์ธรรมชาติสุดมหัศจรรย์',
            journey_3_title: 'คุ้มเจ้าหลวง',
            journey_3_desc: 'สถาปัตยกรรมไทย-ยุโรปที่งดงาม',
            journey_3_desc: 'สถาปัตยกรรมไทย-ยุโรปที่งดงาม',
            journey_btn: 'ซื้อของฝากเมืองแพร่',
            nav_register: 'สมัครเข้าใช้งาน'
        },
        en: {
            nav_home: 'Home',
            nav_about: 'About',
            nav_products: 'Products',
            nav_reviews: 'Reviews',
            nav_howto: 'How to Order',
            nav_contact: 'Contact',
            hero_title: 'OTOP Products<br><span class="highlight">Phrae Province</span>',
            hero_subtitle: 'Experience the charm of Mo Hom cloth, teak wood, and famous local handicrafts.',
            hero_btn: 'View Products',
            about_title: 'Charm of Eastern Lanna',
            about_desc: 'Phrae, the land of mountains and golden teak forests, the birthplace of "Mo Hom cloth," the wisdom of natural indigo dyeing and exquisite wood carving. Our OTOP products are filled with the soul of a long-inherited culture.',
            section_products: 'Recommended Products',
            reviews_title: 'Customer Reviews',
            reviews_subtitle: 'Real impressions from people who experienced Phrae OTOP products',
            write_review: 'Write a Review',
            form_name: 'Your Name',
            form_rating: 'Satisfaction',
            form_message: 'Review Message',
            howto_title: 'How to Order',
            howto_subtitle: 'Simple steps to order OTOP products directly to your home',
            step1_title: 'Select Products',
            step1_desc: 'Browse and select the products you like from our catalog.',
            step2_title: 'Add to Cart',
            step2_desc: 'Click "Add to Cart" to gather your desired items.',
            step3_title: 'Payment',
            step3_desc: 'Check your order and transfer money via bank account.',
            step4_title: 'Confirm Order',
            step4_desc: 'Fill in shipping details and attach payment slip.',
            bank_info_title: 'Bank Account for Payment',
            p1_title: 'Mo Hom Shirt',
            p1_desc: 'Natural dyed cotton, comfortable, modern design',
            p2_title: 'Teak Wood Carving',
            p2_desc: 'Auspicious home decor from genuine golden teak',
            p3_title: 'Hand-stitched Cloth Bag',
            p3_desc: 'Detailed craftsmanship, unique identity',
            p4_title: 'Indigo Dyed Scarf',
            p4_desc: 'Soft, gentle, safe without chemicals',
            p5_title: 'Wild Forest Honey',
            p5_desc: 'Pure natural honey, premium organic quality',
            p6_title: 'Bamboo Woven Bag',
            p6_desc: 'Exquisite weaving, modern design, durable',
            footer_contact: 'Contact Us',
            footer_addr: 'Phrae OTOP Service Center',
            footer_tel: 'Tel',
            footer_follow: 'Follow Us',
            search_placeholder: 'Search products...',
            add_to_cart: 'Add to Cart',
            cart_title: 'Your Shopping Cart',
            cart_empty: 'Your cart is empty',
            cart_total: 'Total Amount',
            checkout_btn: 'Proceed to Checkout',
            continue_shopping: 'Continue Shopping',
            remove_item: 'Remove',
            banner_title: 'Wisdom Passed Through Generations',
            banner_subtitle: 'Experience the lifestyle and exquisite craftsmanship of Phrae artisans',
            heritage_title: 'Heritage of Phrae Lifestyle',
            heritage_mohom_title: 'Phrae Mo Hom Fabric',
            heritage_mohom_desc: 'Natural indigo dyeing, a deep blue identity reflecting community lifestyle and local pride.',
            heritage_teak_title: 'Golden Teak Artistry',
            heritage_teak_desc: 'Exquisite carving from golden teak, the nation\'s top quality source that defines Phrae\'s fame.',
            heritage_weaving_title: 'Traditional Weaving',
            heritage_weaving_desc: 'Handcrafted from natural materials, durable and contemporary designs blending Thai craft charm.',
            history_title: 'History and Significance',
            history_text: 'Phrae is the heart of the Yom River basin, a land rich in natural resources and over a thousand years of history. From its importance as the "City of Golden Teak" to becoming a nurturing ground for master artisans, every OTOP product we offer is a fusion of the East Lanna spirit and a commitment to preserving ancient wisdom amidst changing times.',
            gallery_title: 'Phrae Nature Collection',
            gallery_1: 'Teak Leaf Majesty',
            gallery_2: 'Lanna Sanctuary',
            gallery_3: 'Forest Wisdom',
            journey_title: 'Journey Through Phrae',
            journey_1_title: 'Wat Phra That Cho Hae',
            journey_1_desc: 'Phrae\'s Most Sacred Temple',
            journey_2_title: 'Phae Mueang Phi',
            journey_2_desc: 'Amazing Natural Phenomenon',
            journey_3_title: 'Khum Chao Luang',
            journey_3_desc: 'Beautiful Thai-European Architecture',
            journey_3_desc: 'Beautiful Thai-European Architecture',
            journey_btn: 'Shop Phrae Souvenirs',
            nav_register: 'Register'
        }
    };

    // Language Toggle Logic
    const langBtns = document.querySelectorAll('[data-lang-switch]');
    const translatableElements = document.querySelectorAll('[data-i18n]');

    // PRODUCT RENDERING LOGIC
    const productGrid = document.getElementById('main-product-grid');

    const renderProducts = async (searchTerm = '') => {
        if (!productGrid) return;

        let products = window.getProducts ? await window.getProducts() : [];
        if (!Array.isArray(products)) products = [];

        const lang = localStorage.getItem('preferredLang') || 'th';

        const filteredProducts = products.filter(p => {
            const title = (lang === 'th' ? p.title : p.titleEn).toLowerCase();
            const desc = (lang === 'th' ? p.desc : p.descEn).toLowerCase();
            const term = searchTerm.toLowerCase().trim();
            return title.includes(term) || desc.includes(term);
        });

        if (filteredProducts.length === 0) {
            productGrid.innerHTML = `<div class="no-products" style="grid-column: 1/-1; text-align: center; padding: 50px;">
                ${lang === 'th' ? 'ไม่พบสินค้าที่ตรงกับคำค้นหา' : 'No products found matching your search.'}
            </div>`;
            return;
        }

        productGrid.innerHTML = filteredProducts.map(p => {
            const stock = p.stock || 0;
            const isOutOfStock = stock === 0;
            const isLowStock = stock > 0 && stock < 10;

            return `
            <div class="product-card reveal">
                <div class="product-img">
                    <img src="${p.image}" alt="${lang === 'th' ? p.title : p.titleEn}">
                    ${p.isBestSeller ? '<div class="best-seller-badge">ขายดี (Best Seller)</div>' : ''}
                    ${isOutOfStock ? '<div class="out-of-stock-badge">สินค้าหมด</div>' : ''}
                    ${isLowStock ? `<div class="stock-badge low-stock">เหลือ ${stock} ชิ้น</div>` : ''}
                    ${!isOutOfStock && !isLowStock && stock < 50 ? `<div class="stock-badge">เหลือ ${stock} ชิ้น</div>` : ''}
                </div>
                <div class="product-info">
                    <h3>${lang === 'th' ? p.title : p.titleEn}</h3>
                    <p>${lang === 'th' ? p.desc : p.descEn}</p>
                    <div class="product-bottom">
                        <span class="price">฿${p.price.toLocaleString()}</span>
                        <button class="add-to-cart-btn ${isOutOfStock ? 'disabled' : ''}" 
                                data-product-id="${p.id}" 
                                data-product-price="${p.price}"
                                ${isOutOfStock ? 'disabled' : ''}
                                data-i18n="add_to_cart">${isOutOfStock ? (lang === 'th' ? 'สินค้าหมด' : 'Out of Stock') : translations[lang].add_to_cart}</button>
                    </div>
                </div>
            </div>
        `}).join('');

        // Re-bind cart events since buttons are new
        if (window.bindCartEvents) window.bindCartEvents();

        // Re-init scroll reveal for new elements
        if (window.initScrollReveal) window.initScrollReveal();
    };

    // SEARCH LOGIC
    const searchInput = document.getElementById('product-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            renderProducts(e.target.value);

            // Auto-scroll to products section when searching
            if (e.target.value.trim() !== '') {
                const productsSection = document.getElementById('products');
                if (productsSection) {
                    const offset = productsSection.getBoundingClientRect().top + window.scrollY - 80;
                    window.scrollTo({
                        top: offset,
                        behavior: 'smooth'
                    });
                }
            }
        });
    }

    // Initialize Products
    renderProducts();

    const updateLanguage = (lang) => {
        // Update active class on buttons
        langBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.langSwitch === lang);
        });

        // Update texts
        translatableElements.forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (translations[lang][key]) {
                if (el.tagName === 'INPUT' && el.hasAttribute('placeholder')) {
                    el.placeholder = translations[lang][key];
                } else {
                    el.innerHTML = translations[lang][key];
                }
            }
        });

        // Update placeholders separately if needed (using data-i18n-placeholder)
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            if (translations[lang][key]) {
                el.placeholder = translations[lang][key];
            }
        });

        localStorage.setItem('preferredLang', lang);
        // Dispatch event for other scripts (like cart.js)
        window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));

        renderProducts(searchInput ? searchInput.value : '');
    };

    // Event Listeners for Lang Buttons
    langBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const lang = btn.getAttribute('data-lang-switch');
            updateLanguage(lang);
        });
    });

    // Initialize Language
    const savedLang = localStorage.getItem('preferredLang') || 'th';
    // Initial Language Setup
    updateLanguage(savedLang);



    // Smooth Scroll for Nav Links
    const links = document.querySelectorAll('a[href^="#"]');
    links.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            const targetElement = document.querySelector(targetId);

            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // Mobile Navbar Toggle
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');

    // Luxury Preloader Removal
    const preloader = document.getElementById('preloader');
    window.addEventListener('load', () => {
        setTimeout(() => {
            if (preloader) {
                preloader.classList.add('fade-out');
                // Allow scrolling after preloader is gone
                document.documentElement.style.cursor = 'none';
                document.body.style.cursor = 'none';
            }
        }, 1500); // Elegant delay for branding
    });

    // Custom Luxury Cursor Logic
    const dot = document.querySelector('.cursor-dot');
    const outline = document.querySelector('.cursor-outline');

    window.addEventListener('mousemove', (e) => {
        const posX = e.clientX;
        const posY = e.clientY;

        // Instant dot movement
        if (dot) {
            dot.style.left = `${posX}px`;
            dot.style.top = `${posY}px`;
        }

        // Smooth outline trailing
        if (outline) {
            outline.animate({
                left: `${posX}px`,
                top: `${posY}px`
            }, { duration: 500, fill: "forwards" });
        }
    });

    // Cursor Interactions
    const interactiveElements = document.querySelectorAll('a, button, .product-card, .heritage-card, .logo');
    interactiveElements.forEach(el => {
        el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
        el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
    });

    // Luxury Leaf Particles Logic
    const createLeafParticles = () => {
        const container = document.getElementById('products-particles');
        if (!container) return;

        for (let i = 0; i < 15; i++) {
            const leaf = document.createElement('div');
            leaf.className = 'leaf-particle';
            leaf.style.left = Math.random() * 100 + '%';
            leaf.style.top = Math.random() * 100 + '%';
            leaf.style.animationDelay = Math.random() * 20 + 's';
            leaf.style.width = (10 + Math.random() * 15) + 'px';
            leaf.style.height = (leaf.offsetWidth / 2) + 'px';
            container.appendChild(leaf);
        }
    };
    createLeafParticles();

    // Hero Leaf Particles (Dense & Luxurious)
    const createHeroLeafParticles = () => {
        const hero = document.querySelector('.hero');
        if (!hero) return;

        for (let i = 0; i < 25; i++) {
            const leaf = document.createElement('div');
            leaf.className = 'leaf-particle';
            leaf.style.position = 'absolute';
            leaf.style.left = Math.random() * 100 + '%';
            leaf.style.top = Math.random() * 100 + '%';
            leaf.style.animationDelay = Math.random() * 20 + 's';
            leaf.style.width = (12 + Math.random() * 18) + 'px';
            leaf.style.height = (leaf.offsetWidth / 2) + 'px';
            leaf.style.zIndex = '2';
            hero.appendChild(leaf);
        }
    };
    createHeroLeafParticles();

    if (hamburger) {
        hamburger.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            hamburger.classList.toggle('active');
        });
    }

    // Scroll Effect on Navbar
    const navbar = document.querySelector('.navbar');
    const navItems = document.querySelectorAll('.nav-links a');
    const sections = document.querySelectorAll('section[id]');

    let isScrolling = false;
    // Cache section boundaries for performance
    let sectionData = [];
    const updateSectionData = () => {
        sectionData = Array.from(sections).map(section => ({
            id: section.getAttribute('id'),
            top: section.offsetTop,
            height: section.clientHeight
        }));
    };
    updateSectionData();
    window.addEventListener('resize', updateSectionData);

    window.addEventListener('scroll', () => {
        if (!isScrolling) {
            window.requestAnimationFrame(() => {
                const scrollY = window.scrollY;
                // Scrolled background Change
                if (scrollY > 50) {
                    navbar.classList.add('scrolled');
                } else {
                    navbar.classList.remove('scrolled');
                }

                // Active Link Highlight
                let current = '';
                sectionData.forEach(data => {
                    if (scrollY >= data.top - 150) {
                        current = data.id;
                    }
                });

                navItems.forEach(link => {
                    if (link.getAttribute('href').includes(current) && current !== '') {
                        link.classList.add('active');
                    } else {
                        link.classList.remove('active');
                    }
                });

                isScrolling = false;
            });
            isScrolling = true;
        }
    });

    // Dynamic Particles Generator
    window.initParticles = (containerId, count = 20) => {
        const container = document.getElementById(containerId);
        if (!container) return;

        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';

            const posX = Math.random() * 100;
            const posY = Math.random() * 100;
            const size = Math.random() * 10 + 5;
            const delay = Math.random() * 15;
            const duration = Math.random() * 10 + 10;

            particle.style.left = posX + '%';
            particle.style.top = posY + '%';
            particle.style.width = size + 'px';
            particle.style.height = size + 'px';
            particle.style.animationDelay = delay + 's';
            particle.style.animationDuration = duration + 's';

            container.appendChild(particle);
        }
    };

    // Scroll Reveal Animation Logic
    const initScrollReveal = () => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                    observer.unobserve(entry.target); // Animate only once
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: "0px 0px -50px 0px"
        });

        document.querySelectorAll('.reveal').forEach(el => {
            observer.observe(el);
        });
    };

    // Initial call for static elements
    initScrollReveal();

    // Export for use in other scripts if needed
    window.initScrollReveal = initScrollReveal;
});

/* =========================================
   Global Text Animation Observer
   ========================================= */
document.addEventListener('DOMContentLoaded', () => {
    // 1. Setup Intersection Observer
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15
    };

    const textObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target); // Animate once
            }
        });
    }, observerOptions);

    // 2. Select Elements to Animate
    // Target common text elements, excluding those in Hero/Navbar which have their own animations
    const targetSelectors = 'h1, h2, h3, h4, h5, p, .btn, .color-card, .footer-col';
    const elements = document.querySelectorAll(targetSelectors);

    elements.forEach(el => {
        // Filter out elements that shouldn't be overridden
        if (!el.closest('.hero-content') && !el.closest('.navbar') && !el.classList.contains('no-animate')) {
            el.classList.add('animate-on-scroll');
            textObserver.observe(el);
        }
    });

    // 3. Add Hover Sound/Effect (Optional - Visual only requested)
    // Adding a subtle tilt effect to buttons could be a nice 'bonus' playfulness
    const buttons = document.querySelectorAll('.btn-primary, .btn-login');
    buttons.forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // Simple spotlight effect using --x and --y variables if supported in CSS
            // btn.style.setProperty('--x', \\px\);
            // btn.style.setProperty('--y', \\px\);
        });
    });
});

