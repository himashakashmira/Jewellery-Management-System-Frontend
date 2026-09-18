// js/repairs.js — Live API integration for AURUM Repair Lounge

$(document).ready(function () {
    guardAuth();
    fetchRepairStats();
    loadRepairs();
});

// ─── 1. Repair Stats (Metric Cards) ──────────────────────────────────────────

function fetchRepairStats() {
    apiFetch("/repairs/stats")
        .done(function (res) {
            $('#stat-repairs').text((res.totalRepairs || 0) + ' Orders');
            $('#stat-repairs-ready').text((res.readyCount || 0) + ' Masterpieces');
            $('#stat-repairs-crafting').text((res.craftingCount || 0) + ' on Bench');
            $('#stat-repairs-revenue').text(formatLKR(res.totalRevenue || 0));
        })
        .fail(function (err) {
            console.error("Failed to fetch repair stats:", err.status, err.statusText);
        });
}

// ─── 2. Load & Render Repair Cards ───────────────────────────────────────────

function loadRepairs() {
    const container = $('#repairs-list-container');
    // Remove static placeholder cards (keep the hidden table stub)
    container.find('article.repair-card-horizontal').remove();
    container.find('.repairs-loading').remove();

    // Show loading state inside container
    container.append('<div class="repairs-loading" style="text-align:center;padding:60px 0;color:var(--text-muted);"><i class="fa-solid fa-spinner fa-spin" style="font-size:28px;color:var(--gold-primary);margin-bottom:12px;"></i><br>Loading Atelier Repair Dockets...</div>');

    apiFetch("/repairs/all")
        .done(function (repairs) {
            container.find('.repairs-loading').remove();

            if (!repairs || repairs.length === 0) {
                container.append('<div style="text-align:center;padding:60px 0;color:var(--text-muted);">No active repair dockets found.</div>');
                return;
            }

            repairs.forEach(function (r) {
                container.append(buildRepairCard(r));
            });
        })
        .fail(function (err) {
            console.error("Failed to load repairs:", err.status, err.statusText);
            container.find('.repairs-loading').remove();
            container.append('<div style="text-align:center;padding:60px 0;color:#ef4444;"><i class="fa-solid fa-triangle-exclamation" style="font-size:28px;margin-bottom:12px;"></i><br>Failed to load repairs. Is the backend running?</div>');
        });
}

// ─── 3. Build Repair Card HTML ────────────────────────────────────────────────

const STATUS_STAGES = ['Received', 'Melting', 'Crafting', 'Ready'];
const STATUS_ICONS  = {
    'Received': 'fa-box-archive',
    'Melting':  'fa-fire-burner',
    'Crafting': 'fa-gem',
    'Ready':    'fa-bell-concierge'
};
const STATUS_FILL = {
    'Received': '0%',
    'Melting':  '33%',
    'Crafting': '66%',
    'Ready':    '100%'
};

function buildRepairCard(r) {
    const currentStageIndex = STATUS_STAGES.indexOf(r.status);
    const fillPct = STATUS_FILL[r.status] || '0%';

    const stepsHtml = STATUS_STAGES.map(function (stage, i) {
        let nodeClass, nodeContent;
        if (i < currentStageIndex) {
            nodeClass   = 'step-node completed';
            nodeContent = '<i class="fa-solid fa-check"></i>';
        } else if (i === currentStageIndex) {
            nodeClass   = 'step-node active-glow';
            nodeContent = `<i class="fa-solid ${STATUS_ICONS[stage] || 'fa-circle'}"></i>`;
        } else {
            nodeClass   = 'step-node';
            nodeContent = (i + 1).toString();
        }
        const labelClass = (i === currentStageIndex) ? 'step-label active' : 'step-label';
        const subStyle   = (i === currentStageIndex) ? 'style="color:var(--gold-deep);font-weight:700;"' : '';
        const subText    = (i === currentStageIndex) ? r.status : (i < currentStageIndex ? '✓' : 'Pending');

        return `
            <div class="pipeline-step-col">
                <div class="${nodeClass}">${nodeContent}</div>
                <span class="${labelClass}">${stage}</span>
                <span class="step-subtext" ${subStyle}>${subText}</span>
            </div>`;
    }).join('');

    // Next status for the Advance button
    const nextStage = STATUS_STAGES[currentStageIndex + 1];
    const actionBtn = nextStage
        ? `<button class="btn-white-outline" style="font-size:11.5px;padding:7px 14px;" onclick="advanceRepairStatus(${r.id}, '${nextStage}')">
               <i class="fa-solid fa-forward"></i> Advance to ${nextStage}
           </button>`
        : `<button class="btn-gold-primary" style="font-size:11.5px;padding:7px 14px;" onclick="notifyCustomer(${r.id})">
               <i class="fa-solid fa-paper-plane"></i> Notify
           </button>`;

    const receivedDate = r.receivedDate ? new Date(r.receivedDate).toLocaleDateString('en-LK', { day: 'numeric', month: 'short' }) : '—';
    const docketTag = `#REP-${String(r.id).padStart(4, '0')} &bull; ${r.status.toUpperCase()}`;

    return `
    <article class="repair-card-horizontal" id="repair-card-${r.id}">
        <div class="repair-item-meta">
            <div class="repair-thumb-box" style="display:flex;align-items:center;justify-content:center;background:#FAF9F6;">
                <i class="fa-solid fa-screwdriver-wrench" style="font-size:28px;color:var(--gold-primary);opacity:0.5;"></i>
            </div>
            <div>
                <div class="repair-docket-tag">${docketTag}</div>
                <h4 class="repair-piece-name font-serif">${r.itemName || 'Unnamed Item'}</h4>
                <p class="repair-client-sub">
                    <i class="fa-regular fa-user" style="color:var(--gold-primary);"></i>
                    Customer #${r.customerId} &bull; Received: ${receivedDate}
                </p>
                ${r.description ? `<span style="font-size:11px;color:var(--text-muted);margin-top:4px;display:block;">${r.description}</span>` : ''}
            </div>
        </div>

        <div class="repair-pipeline-wrapper">
            <div class="pipeline-track">
                <div class="pipeline-track-fill" style="width:${fillPct};"></div>
            </div>
            <div class="pipeline-steps-row">
                ${stepsHtml}
            </div>
        </div>

        <div class="repair-actions-col">
            <span style="font-size:10.5px;text-transform:uppercase;color:var(--text-muted);font-weight:600;">Service Cost</span>
            <div class="repair-cost-bold">${formatLKR(r.estimatedCost || 0)}</div>
            <div style="display:flex;gap:8px;margin-top:4px;">
                ${actionBtn}
                <button class="btn-white-outline" style="font-size:11.5px;padding:7px 12px;" title="Print Docket" onclick="window.print()">
                    <i class="fa-solid fa-print"></i>
                </button>
            </div>
        </div>
    </article>`;
}

// ─── 4. Advance Repair Status (PATCH) ────────────────────────────────────────

function advanceRepairStatus(id, newStatus) {
    apiFetch("/repairs/update-status/" + id + "?status=" + encodeURIComponent(newStatus), {
        method: "PATCH"
    })
    .done(function () {
        // Reload the card with new status
        loadRepairs();
        fetchRepairStats();
    })
    .fail(function (err) {
        console.error("Failed to update repair status:", err.status, err.responseText);
        alert("Could not update status. Please try again.");
    });
}

// ─── 5. Notify Customer ───────────────────────────────────────────────────────

function notifyCustomer(id) {
    alert("Customer notified: Piece #REP-" + String(id).padStart(4, '0') + " is ready for collection!");
}

// ─── 6. Register New Repair Docket (Modal Form) ───────────────────────────────

function registerRepair() {
    const data = {
        itemName:      $('#item-name').val().trim(),
        description:   $('#repair-description') ? $('#repair-description').val().trim() : '',
        estimatedCost: parseFloat($('#service-fee').val()) || 0,
        customerId:    parseInt($('#repair-customer-id').val()) || null
    };

    if (!data.itemName) {
        alert("Please enter an item description.");
        return;
    }
    if (!data.customerId) {
        alert("Please provide a Customer ID.");
        return;
    }

    apiFetch("/repairs/register", {
        method: "POST",
        data:   JSON.stringify(data)
    })
    .done(function () {
        closeNewRepairModal();
        $('#form-repair-docket')[0].reset();
        loadRepairs();
        fetchRepairStats();
    })
    .fail(function (err) {
        console.error("Failed to register repair:", err.status, err.responseText);
        alert("Failed to register repair. Check console for details.");
    });
}