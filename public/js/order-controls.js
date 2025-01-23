function incrementQuantity(id) {
    const input = document.getElementById(id);
    const currentValue = parseInt(input.value) || 0;
    if (currentValue < parseInt(input.max)) {
        input.value = currentValue + 1;
        input.dispatchEvent(new Event('change'));
    }
}

function decrementQuantity(id) {
    const input = document.getElementById(id);
    const currentValue = parseInt(input.value) || 0;
    if (currentValue > parseInt(input.min)) {
        input.value = currentValue - 1;
        input.dispatchEvent(new Event('change'));
    }
}

function validateQuantity(input) {
    let value = parseInt(input.value) || 0;
    const min = parseInt(input.min);
    const max = parseInt(input.max);
    
    if (value < min) value = min;
    if (value > max) value = max;
    
    input.value = value;
}
