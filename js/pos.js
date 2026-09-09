$(document).ready(function() {
    loadProductsForPOS(); // seen the product
});

// fetch items to the selection grid
function loadProductsForPOS() {
    $.ajax({
        url: "http://localhost:8080/api/v1/inventory/all",
        method: "GET",
        success: function(res) {
            $('#pos-item-grid').empty();
            res.forEach(item => {
                let card = `
                    <div class="card-bg p-6 rounded-[2rem] flex justify-between items-center group hover:border-yellow-600/50 transition cursor-pointer" 
                         onclick="calculateBillItem(${item.id})">
                        <div class="flex items-center gap-5">
                            <img src="https://img.icons8.com/color/96/diamond-ring.png" class="w-12 h-12">
                            <div>
                                <h4 class="font-bold text-white">${item.name}</h4>
                                <p class="text-[10px] text-slate-500 uppercase">${item.weight}g | 22K</p>
                            </div>
                        </div>
                        <button class="w-10 h-10 bg-slate-800 rounded-xl">+</button>
                    </div>`;
                $('#pos-item-grid').append(card);
            });
        }
    });
}

// this function calls the backend calculation logic we wrote earlier
function calculateBillItem(productId) {
    $.ajax({
        url: "http://localhost:8080/api/v1/gold-rates/calculate/" + productId,
        method: "GET",
        success: function(finalPrice) {
            // add this price to the right-side bill summary
            updateBillSummary(finalPrice);
        }
    });
}

// collect items in an array
let cart = [];

function addToCart(id, name, price) {
    cart.push({ productId: id, qty: 1, name: name, price: price });
    renderCart();
}

function completeSale() {
    if (cart.length === 0) {
        alert("Cart is empty!");
        return;
    }

    // create the data object for backend
    const orderData = {
        customerId: 1, // temporary static ID, later get from input
        discount: 500.0,
        items: cart.map(item => ({
            productId: item.productId,
            qty: item.qty
        }))
    };

    // AJAX call to place order
    $.ajax({
        url: "http://localhost:8080/api/v1/orders/place",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(orderData),
        success: function(res) {
            alert(res);
            cart = []; // clear cart after success
            renderCart();
        },
        error: function(err) {
            alert("Order Failed!");
        }
    });
}