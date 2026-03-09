document.addEventListener('DOMContentLoaded', () => {
    const reviewForm = document.getElementById('review-form');
    const reviewsContainer = document.querySelector('.reviews-container');

    // Load saved reviews from localStorage
    const loadReviews = () => {
        const savedReviews = JSON.parse(localStorage.getItem('otop_reviews')) || [];
        // Insert saved reviews after the mock ones (or we could clear and render all, but keeping mocks for demo)
        // Let's prepend saved reviews so they appear first!
        savedReviews.forEach(review => {
            renderReviewCard(review);
        });
    };

    const renderReviewCard = (review) => {
        const card = document.createElement('div');
        card.className = 'review-card reveal active'; // Add active to show immediately

        // Generate stars HTML
        let starsHtml = '';
        for (let i = 0; i < 5; i++) {
            if (i < review.rating) {
                starsHtml += '<i class="fas fa-star"></i>';
            } else {
                starsHtml += '<i class="far fa-star"></i>';
            }
        }

        card.innerHTML = `
            <i class="fas fa-quote-right quote-icon"></i>
            <div class="review-header">
                <img src="${review.avatar}" alt="User" class="reviewer-avatar">
                <div class="reviewer-info">
                    <h3>${review.name}</h3>
                    <div class="stars">
                        ${starsHtml}
                    </div>
                </div>
            </div>
            <div class="review-text">
                "${review.message}"
            </div>
            <div style="margin-top: 15px; font-size: 0.8rem; color: #666; text-align: right;">
                ${new Date(review.date).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
        `;

        // Prepend to container (insert after the first child if we want to keep structure, or just prepend)
        // We want new reviews to show at the top
        reviewsContainer.insertBefore(card, reviewsContainer.firstChild);
    };

    if (reviewForm) {
        reviewForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const name = document.getElementById('review-name').value;
            const rating = parseInt(document.getElementById('review-rating').value);
            const message = document.getElementById('review-message').value;

            if (name && message) {
                const newReview = {
                    id: Date.now(),
                    name: name,
                    rating: rating,
                    message: message,
                    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=E62129&color=fff`,
                    date: new Date().toISOString()
                };

                // Save to localStorage
                const reviews = JSON.parse(localStorage.getItem('otop_reviews')) || [];
                reviews.push(newReview);
                localStorage.setItem('otop_reviews', JSON.stringify(reviews));

                // Render immediately
                renderReviewCard(newReview);

                // Reset form
                reviewForm.reset();
                alert('ขอบคุณสำหรับรีวิวของคุณ! / Thank you for your review!');
            }
        });
    }

    loadReviews();
});
