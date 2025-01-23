document.addEventListener('DOMContentLoaded', function() {
    // Get the elements
    const newMenuLink = document.getElementById('newMenuLink');
    const menuPopup = document.getElementById('menuPopup');

    if (newMenuLink && menuPopup) {
        // Show popup when clicking the link
        newMenuLink.addEventListener('click', function(e) {
            e.preventDefault();
            menuPopup.classList.add('active');
            console.log('Popup should be visible now');
        });

        // Hide popup when clicking anywhere on the overlay
        menuPopup.addEventListener('click', function() {
            menuPopup.classList.remove('active');
            console.log('Popup should be hidden now');
        });
    } else {
        console.error('Required elements not found');
    }
});
