$(document).ready(function() {
    loadProductsToPOS();
});

function loadProductsToPOS() {
    console.log("Fetching products...");
    
    $.ajax({
        url: "http://localhost:8080/api/v1/inventory/all",
        method: "GET",
        success: function(products) {
            // clean up the grid before adding new items
            $('#pos-item-grid').html('<p class="text-slate-500 italic">Calculating prices...</p>');

            if (products.length === 0) {
                $('#pos-item-grid').html('<p class="text-slate-500 italic">No items found in inventory.</p>');
                return;
            }

            let allCardsHtml = ""; // added to the all cards

            products.forEach((item, index) => {
                $.ajax({
                    url: "http://localhost:8080/api/v1/gold-rates/calculate/" + item.id,
                    method: "GET",
                    success: function(finalPrice) {
                        let card = `
                            <div class="card-bg p-6 rounded-[2rem] flex justify-between items-center group hover:border-yellow-600/50 transition cursor-pointer">
                                <div class="flex items-center gap-5">
                                    <div class="w-16 h-16 bg-slate-900 rounded-2xl border border-slate-800 flex items-center justify-center">
                                        <img src="https://img.icons8.com/color/96/diamond-ring.png" class="w-10 h-10">
                                    </div>
                                    <div>
                                        <h4 class="font-bold text-white group-hover:gold-text transition">${item.name}</h4>
                                        <p class="text-[10px] text-slate-500 uppercase font-bold tracking-wider mt-1">${item.weight}g | 22K Gold</p>
                                        <p class="text-lg font-bold mt-1 gold-text">Rs. ${finalPrice.toLocaleString()}</p>
                                    </div>
                                </div>
                                <button onclick="addItemToBill(${item.id}, '${item.name}', ${finalPrice})" 
                                        class="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center hover:gold-bg hover:text-black transition">
                                    <i class="fas fa-plus"></i>
                                </button>
                            </div>`;
                        
                        if (index === 0) $('#pos-item-grid').empty();
                        $('#pos-item-grid').append(card);
                    },
                    error: function() {
                        console.error("Could not calculate price for item: " + item.id);
                    }
                });
            });
        },
        error: function(err) {
            console.error("Error loading products", err);
            $('#pos-item-grid').html('<p class="text-red-500 italic">Failed to load items. Is the Backend running?</p>');
        }
    });
}