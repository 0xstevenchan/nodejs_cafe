console.log('Test script loaded!');

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded in test.js');
    const button = document.getElementById('testButton');
    if (button) {
        console.log('Button found');
        button.addEventListener('click', function() {
            console.log('Button clicked');
            alert('Button clicked from test.js!');
        });
    } else {
        console.error('Button not found in test.js');
    }
});
