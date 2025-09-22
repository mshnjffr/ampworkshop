// Intentionally poor JavaScript for workshop exercise
// No modern JS features, poor error handling, no keyboard shortcuts

var products = [
    {
        id: 1,
        name: "Laptop Computer",
        price: 999.99,
        image: "https://via.placeholder.com/150/0000FF/FFFFFF?text=Laptop",
        category: "electronics"
    },
    {
        id: 2,
        name: "Wireless Mouse",
        price: 29.99,
        image: "https://via.placeholder.com/150/FF0000/FFFFFF?text=Mouse",
        category: "electronics"
    },
    {
        id: 3,
        name: "USB Keyboard",
        price: 49.99,
        image: "https://via.placeholder.com/150/00FF00/FFFFFF?text=Keyboard",
        category: "electronics"
    },
    {
        id: 4,
        name: "Monitor 24 inch",
        price: 299.99,
        image: "https://via.placeholder.com/150/FFFF00/000000?text=Monitor",
        category: "electronics"
    },
    {
        id: 5,
        name: "Webcam HD",
        price: 79.99,
        image: "https://via.placeholder.com/150/FF00FF/FFFFFF?text=Webcam",
        category: "electronics"
    },
    {
        id: 6,
        name: "Headphones",
        price: 89.99,
        image: "https://via.placeholder.com/150/00FFFF/000000?text=Headphones",
        category: "electronics"
    }
];

var cart = [];

// Poor practice: using global functions
function displayProducts() {
    var productsDiv = document.getElementById('products');
    var html = '';
    
    for (var i = 0; i < products.length; i++) {
        html += '<div class="product-card">';
        html += '<img src="' + products[i].image + '" alt="Product Image">';
        html += '<h3>' + products[i].name + '</h3>';
        html += '<p>Price: $' + products[i].price + '</p>';
        html += '<input type="button" class="add-to-cart-btn" value="Add to Cart" onclick="addToCart(' + products[i].id + ')">';
        html += '</div>';
    }
    
    productsDiv.innerHTML = html;
    
    // Clear float (old-school method)
    productsDiv.innerHTML += '<br style="clear: both;">';
}

function addToCart(productId) {
    var product = null;
    
    // Inefficient search
    for (var i = 0; i < products.length; i++) {
        if (products[i].id == productId) {
            product = products[i];
            break;
        }
    }
    
    if (product) {
        // Check if product already in cart
        var found = false;
        for (var j = 0; j < cart.length; j++) {
            if (cart[j].product.id == productId) {
                cart[j].quantity++;
                found = true;
                break;
            }
        }
        
        if (!found) {
            cart.push({
                product: product,
                quantity: 1
            });
        }
        
        updateCart();
        alert('Product added to cart!'); // Poor UX
    }
}

function updateCart() {
    var cartItems = document.getElementById('cart-items');
    var total = 0;
    var html = '';
    
    if (cart.length == 0) {
        html = '<tr><td colspan="5" align="center">Your cart is empty</td></tr>';
    } else {
        for (var i = 0; i < cart.length; i++) {
            var item = cart[i];
            var itemTotal = item.product.price * item.quantity;
            total += itemTotal;
            
            html += '<tr>';
            html += '<td>' + item.product.name + '</td>';
            html += '<td>$' + item.product.price.toFixed(2) + '</td>';
            html += '<td>';
            html += '<input type="number" value="' + item.quantity + '" min="1" onchange="updateQuantity(' + i + ', this.value)" style="width: 50px;">';
            html += '</td>';
            html += '<td>$' + itemTotal.toFixed(2) + '</td>';
            html += '<td><input type="button" value="X" onclick="removeFromCart(' + i + ')"></td>';
            html += '</tr>';
        }
    }
    
    cartItems.innerHTML = html;
    document.getElementById('cart-total').innerHTML = '$' + total.toFixed(2);
}

function updateQuantity(index, newQuantity) {
    if (newQuantity < 1) {
        alert('Quantity must be at least 1');
        return;
    }
    cart[index].quantity = parseInt(newQuantity);
    updateCart();
}

function removeFromCart(index) {
    if (confirm('Are you sure you want to remove this item?')) {
        cart.splice(index, 1);
        updateCart();
    }
}

function showCheckout() {
    if (cart.length == 0) {
        alert('Your cart is empty!');
        return;
    }
    document.getElementById('checkout-modal').style.display = 'block';
}

function hideCheckout() {
    document.getElementById('checkout-modal').style.display = 'none';
}

function placeOrder() {
    var form = document.getElementById('checkout-form');
    
    // Poor validation - checking each field individually
    if (form.fullname.value == '') {
        alert('Please enter your full name');
        return;
    }
    
    if (form.email.value == '') {
        alert('Please enter your email');
        return;
    }
    
    // No email validation
    
    if (form.phone.value == '') {
        alert('Please enter your phone number');
        return;
    }
    
    if (form.address.value == '') {
        alert('Please enter your address');
        return;
    }
    
    if (form.city.value == '') {
        alert('Please enter your city');
        return;
    }
    
    if (form.state.value == '') {
        alert('Please select your state');
        return;
    }
    
    if (form.zip.value == '') {
        alert('Please enter your ZIP code');
        return;
    }
    
    if (form.cardnumber.value == '') {
        alert('Please enter your card number');
        return;
    }
    
    // No card number validation
    
    if (form.expmonth.value == '' || form.expyear.value == '') {
        alert('Please select expiry date');
        return;
    }
    
    if (form.cvv.value == '') {
        alert('Please enter CVV');
        return;
    }
    
    if (!form.terms.checked) {
        alert('Please agree to terms and conditions');
        return;
    }
    
    // Simulate order processing
    alert('Processing your order...');
    
    setTimeout(function() {
        alert('Order placed successfully! Order ID: ' + Math.floor(Math.random() * 1000000));
        cart = [];
        updateCart();
        hideCheckout();
        form.reset();
    }, 2000);
}

// Initialize on page load
window.onload = function() {
    displayProducts();
    updateCart();
};

// No keyboard shortcuts implemented
// No accessibility features
// No error boundaries
// No loading states
// No proper form validation
// No data persistence
// No responsive behavior handlers
