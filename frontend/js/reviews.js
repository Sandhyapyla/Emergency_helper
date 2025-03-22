document.addEventListener('DOMContentLoaded', function() {
    const reviewForm = document.getElementById('reviewForm');

    // Review form submission
    reviewForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const name = document.getElementById('name').value;
        const rating = document.querySelector('input[name="rating"]:checked').value;
        const comment = document.getElementById('comment').value;

        // Add the review to the reviews container
        const reviewsContainer = document.querySelector('.reviews-container');
        const newReview = document.createElement('div');
        newReview.className = 'review-card';
        newReview.innerHTML = `
            <div class="review-header">
                <h4>${name}</h4>
                <div class="rating">${'★'.repeat(parseInt(rating))}${'☆'.repeat(5-parseInt(rating))}</div>
            </div>
            <p>"${comment}"</p>
        `;
        reviewsContainer.insertBefore(newReview, reviewsContainer.firstChild);

        // Clear the form
        reviewForm.reset();
    });
});