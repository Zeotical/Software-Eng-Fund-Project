// Run when the home page finishes loading
document.addEventListener('DOMContentLoaded', () => {
    // Simple check to confirm script is working
    console.log("Academic Publication System - Home Loaded");

    // Get all landing page cards
    const cards = document.querySelectorAll('.landing-card');

    // Add click interaction to each card
    cards.forEach(card => {
        card.addEventListener('mousedown', function(e) {
            const x = e.clientX - e.target.offsetLeft;
            const y = e.clientY - e.target.offsetTop;
            
            // Placeholder for visual feedback (e.g., ripple effect)
            console.log(`Navigating to: ${this.getAttribute('href')}`);
        });
    });
});
