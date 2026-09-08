// inventory.js

$(document).ready(function () {
    loadAllProducts(); // page එක load වෙද්දී බඩු ටික පෙන්වන්න
});

// 1. Save Product Logic
$('#btn-save-item').click(function () {
    // get data from form fields
    const name = $('#item-name').val();
    const weight = $('#item-weight').val();
    const wastage = $('#item-wastage').val();
    const labour = $('#item-labour').val();
    const categoryId = $('#item-category').val();

    // validation
    if (!name || !weight) {
        alert("Please fill required fields");
        return;
    }

    const productDTO = {
        name: name,
        weight: parseFloat(weight),
        wastage: parseFloat(wastage),
        labourCost: parseFloat(labour),
        categoryId: parseInt(categoryId)
    };

    $.ajax({
        url: "http://localhost:8080/api/v1/inventory/save",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(productDTO),
        success: function (res) {
            alert("Item Saved Successfully!");
            loadAllProducts(); // table එක refresh කරන්න
            $('#itemModal').addClass('hidden'); // modal එක වහන්න
        },
        error: function (err) {
            console.error("Save failed", err);
        }
    });
});

// 2. Load All Products into Table
function loadAllProducts() {
    $.ajax({
        url: "http://localhost:8080/api/v1/inventory/all",
        method: "GET",
        success: function (data) {
            $('#inventory-table-body').empty(); // පරණ ඩේටා අයින් කරන්න

            data.forEach(p => {
                let row = `
                    <tr class="hover:bg-slate-800/30 transition group">
                        <td class="p-8 gold-text font-bold uppercase tracking-widest text-sm">AUR-J-${p.id}</td>
                        <td class="p-8">
                             <div class="w-16 h-16 bg-slate-900 rounded-2xl border border-slate-800 flex items-center justify-center mx-auto overflow-hidden">
                                <img src="https://img.icons8.com/color/96/diamond-ring.png" class="w-10 h-10 object-contain">
                            </div>
                        </td>
                        <td class="p-8">
                            <p class="text-sm font-bold text-white">${p.name}</p>
                            <span class="bg-yellow-500/10 text-yellow-500 text-[9px] font-bold px-2 py-0.5 rounded border border-yellow-500/20 mt-1 inline-block">22K GOLD</span>
                        </td>
                        <td class="p-8 text-right text-sm font-bold text-slate-300">${p.weight.toFixed(2)} g</td>
                        <td class="p-8 text-center">
                            <button class="text-slate-500 hover:text-white transition mx-2"><i class="fas fa-edit"></i></button>
                            <button class="text-slate-500 hover:text-red-500 transition mx-2"><i class="fas fa-trash"></i></button>
                        </td>
                    </tr>`;
                $('#inventory-table-body').append(row);
            });
        }
    });
}