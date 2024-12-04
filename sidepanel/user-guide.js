// user-guide.js
document.addEventListener('DOMContentLoaded', function() {
    // Handle feedback button click
    const feedbackBtn = document.getElementById('feedback-email');
    if (feedbackBtn) {
        feedbackBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const mailtoLink = this.href;
            window.location.href = mailtoLink;
        });
    }

    // Handle navigation
    const navLinks = document.querySelectorAll('.nav-links a');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const sectionId = this.getAttribute('href').substring(1); // Get the section ID from href
            const section = document.getElementById(sectionId);
            if (section) {
                section.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
});