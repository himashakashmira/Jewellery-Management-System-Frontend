$(document).ready(function() {
    loadProductsForPOS(); // බඩු ටික පෙන්වන්න
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