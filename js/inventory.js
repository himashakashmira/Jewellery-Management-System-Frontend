$(document).ready(function() {
    loadInventory();
});

function loadInventory() {
    $.ajax({
        url: BASE_URL + "/inventory/all",
        method: "GET",
        success: function(products) {
            let tableBody = $('#inventory-table-body');
            tableBody.empty();

            products.forEach(p => {
                tableBody.append(`
                    <tr class="hover:bg-gray-50 transition">
                        <td class="p-6">#JWL-${p.id}</td>
                        <td class="p-6 font-serif">${p.name}</td>
                        <td class="p-6">${p.weight}g</td>
                        <td class="p-6 text-right font-bold">Rs. ${p.labourCost.toLocaleString()}</td>
                    </tr>
                `);
            });
        }
    });
}

// Function to save new item from Modal
function saveItem() {
    const data = {
        name: $('#item-name').val(),
        weight: $('#item-weight').val(),
        wastage: $('#item-wastage').val(),
        labourCost: $('#item-labour').val(),
        categoryId: $('#item-category').val()
    };

    $.ajax({
        url: BASE_URL + "/inventory/save",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(data),
        success: function() {
            alert("Success!");
            loadInventory();
            toggleModal(); // close modal
        }
    });
}