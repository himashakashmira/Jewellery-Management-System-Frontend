// --- 1. LIVE GOLD RATES CONSTANTS (Sri Lankan Market standard) ---
const GOLD_RATES = {
  '24K': { sovereign: 377000, gram: 47125 },
  '22K': { sovereign: 347000, gram: 43375 },
  '18K': { sovereign: 282720, gram: 35340 }
};

// --- 2. GUEST CART STATE & PERSISTENCE ---
const INITIAL_MOCK_CART = [
  {
    id: 1,
    title: 'Aurelia Double-Layer Solitaire Pendant',
    price: 14500,
    img: 'assets/prod-necklace.jpg',
    qty: 1,
    material: '18K PVD Gold'
  },
  {
    id: 2,
    title: 'Soleil Hand-Hammered Sculpted Cuff',
    price: 18200,
    img: 'assets/prod-cuff.jpg',
    qty: 1,
    material: '18K Anti-Tarnish'
  }
];

let guestCart = (function() {
  try {
    const saved = localStorage.getItem('aurum_cart');
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.warn("[AURUM Cart] Could not parse cart from storage", e);
  }
  return [...INITIAL_MOCK_CART];
})();

function saveCartToStorage() {
  try {
    localStorage.setItem('aurum_cart', JSON.stringify(guestCart));
  } catch (e) {
    console.error("[AURUM Cart] Error saving cart", e);
  }
}

// --- 2.1 DEFAULT LIFESTYLE IMITATION INVENTORY (Synchronized with Atelier Staff Catalog) ---
const DEFAULT_LIFESTYLE_ITEMS = [
  {
    id: 101,
    name: "Aurelia Double-Layer Solitaire Pendant",
    itemType: "IMITATION",
    category: "necklaces",
    categoryId: 1,
    price: 14500,
    material: "18K PVD Gold • Anti-Tarnish • Zircon",
    image: "assets/prod-necklace.jpg",
    stock: 14,
    rating: 4.9,
    reviews: 84
  },
  {
    id: 102,
    name: "Soleil Hand-Hammered Sculpted Cuff",
    itemType: "IMITATION",
    category: "bracelets",
    categoryId: 2,
    price: 18200,
    material: "Hand-Hammered • Waterproof • Flex-Fit",
    image: "assets/prod-cuff.jpg",
    stock: 8,
    rating: 4.8,
    reviews: 62
  },
  {
    id: 103,
    name: "Celeste Baroque Pearl Cascade Drops",
    itemType: "IMITATION",
    category: "earrings",
    categoryId: 3,
    price: 12800,
    material: "Baroque Pearls • Hypoallergenic • 18K",
    image: "assets/prod-earrings.jpg",
    stock: 19,
    rating: 5.0,
    reviews: 110
  },
  {
    id: 104,
    name: "Elysian Pavé Solitaire Signet Ring",
    itemType: "IMITATION",
    category: "rings",
    categoryId: 4,
    price: 11500,
    material: "Brushed Gold • Brilliant Cut • Comfort-Fit",
    image: "assets/prod-ring.jpg",
    stock: 2,
    rating: 4.9,
    reviews: 54
  },
  {
    id: 105,
    name: "Lumina Sunburst Layered Medallion",
    itemType: "IMITATION",
    category: "necklaces",
    categoryId: 1,
    price: 15900,
    material: "Dual Chain • 18K Micro-Plate • Waterproof",
    image: "assets/prod-necklace.jpg",
    stock: 7,
    rating: 4.8,
    reviews: 41
  },
  {
    id: 106,
    name: "Aura Radiant Hammered Torque",
    itemType: "IMITATION",
    category: "bracelets",
    categoryId: 2,
    price: 16400,
    material: "Solid Sculpt • Anti-Fade • Champagne Shine",
    image: "assets/prod-cuff.jpg",
    stock: 12,
    rating: 4.9,
    reviews: 73
  },
  {
    id: 107,
    name: "Sovereign Empress Pear Drop Earrings",
    itemType: "IMITATION",
    category: "earrings",
    categoryId: 3,
    price: 13900,
    material: "18K Gold Plated • Teardrop Crystal • Push Back",
    image: "assets/prod-earrings.jpg",
    stock: 15,
    rating: 4.9,
    reviews: 89
  },
  {
    id: 108,
    name: "Royale Crown Pavé Halo Band",
    itemType: "IMITATION",
    category: "rings",
    categoryId: 4,
    price: 12200,
    material: "Pavé Halo • Scalloped Prongs • Anti-Scratch",
    image: "assets/prod-ring.jpg",
    stock: 9,
    rating: 4.9,
    reviews: 37
  }
];

function getLifestyleItems() {
  try {
    const raw = localStorage.getItem('aurum_inventory_imitation');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Ensure only imitation items are loaded
        return parsed.filter(i => (i.itemType || 'IMITATION') === 'IMITATION');
      }
    }
  } catch (e) {
    console.error("[AURUM Store] Error reading imitation items from storage", e);
  }

  // Seed default if absent
  try {
    localStorage.setItem('aurum_inventory_imitation', JSON.stringify(DEFAULT_LIFESTYLE_ITEMS));
  } catch (e) {}
  return [...DEFAULT_LIFESTYLE_ITEMS];
}

let currentModalItem = null;

function renderLifestyleProductCard(item) {
  const badgeHtml = (item.stock && item.stock <= 3)
    ? `<span class="badge-tag highlight">Low Stock</span>`
    : (item.rating >= 4.9 ? `<span class="badge-tag highlight">Bestseller</span>` : `<span class="badge-tag">Atelier 18K</span>`);

  const categoryName = item.category || 'necklaces';
  const displayMaterial = item.material || '18K PVD • Anti-Tarnish';
  const displayPrice = 'Rs. ' + Number(item.price || 14500).toLocaleString('en-US');
  const displayRating = item.rating || 4.9;
  const displayReviews = item.reviews || 45;

  return `
    <article class="product-card" 
      data-id="${item.id}"
      data-category="${categoryName}" 
      data-title="${escapeHtml(item.name)}" 
      data-price="${item.price}" 
      data-img="${item.image || 'assets/prod-necklace.jpg'}" 
      data-material="${escapeHtml(displayMaterial)}"
      onclick="openProductDetailModal('${item.id}')">
      <div class="product-card-media">
        <div class="card-badge-top-left">
          ${badgeHtml}
        </div>
        <button type="button" class="card-wishlist-btn" aria-label="Add to Wishlist" onclick="event.stopPropagation(); toggleCardWishlist(this);">
          <i class="fa-regular fa-heart"></i>
        </button>
        <img src="${item.image || 'assets/prod-necklace.jpg'}" alt="${escapeHtml(item.name)}" loading="lazy" onerror="this.src='assets/prod-necklace.jpg'">
      </div>
      <div class="product-card-content">
        <div class="product-specs-pill">${escapeHtml(displayMaterial)}</div>
        <h4 class="product-title font-serif">${escapeHtml(item.name)}</h4>
        <div class="product-rating-row">
          <div class="stars-gold">
            <i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i>
          </div>
          <span>(${displayRating} &bull; ${displayReviews} reviews)</span>
        </div>
        <div class="product-footer-row">
          <div class="product-price-block">
            <span class="price-currency-tag">Fixed Price</span>
            <span class="product-fixed-price">${displayPrice}</span>
          </div>
          <button type="button" class="btn-add-to-cart" onclick="event.stopPropagation(); handleQuickAddToCart('${item.id}', this);">
            <i class="fa-solid fa-bag-shopping"></i>
            <span>Add to Cart</span>
          </button>
        </div>
      </div>
    </article>
  `;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function loadLifestyleProducts() {
  const container = document.getElementById('lifestyleProductsGrid');
  if (!container) return;

  const items = getLifestyleItems();
  if (items.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 40px 20px; color: var(--text-muted);">
        <i class="fa-solid fa-gem" style="font-size: 36px; color: var(--gold-light); margin-bottom: 12px; display: block;"></i>
        <h4 style="font-family: 'Playfair Display', serif; font-size: 18px; color: var(--text-primary); margin-bottom: 6px;">Atelier Inventory Updating</h4>
        <p style="font-size: 13px;">New 18K lifestyle creations are currently being cataloged by our artisans.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = items.map(renderLifestyleProductCard).join('');
}

// Global modal triggers
window.openProductDetailModal = function(itemId) {
  const items = getLifestyleItems();
  const item = items.find(i => String(i.id) === String(itemId));
  if (!item) return;

  currentModalItem = item;

  const overlay = document.getElementById('productDetailModalOverlay');
  const modalImg = document.getElementById('modalDetailImg');
  const modalTitle = document.getElementById('modalDetailTitle');
  const modalCategory = document.getElementById('modalDetailCategory');
  const modalPrice = document.getElementById('modalDetailPrice');
  const modalMaterial = document.getElementById('modalDetailMaterial');
  const modalStock = document.getElementById('modalDetailStock');
  const modalRatingText = document.getElementById('modalDetailRatingText');
  const modalQtyInput = document.getElementById('modalQtyInput');
  const modalBadge = document.getElementById('modalDetailBadge');

  if (modalImg) modalImg.src = item.image || 'assets/prod-necklace.jpg';
  if (modalTitle) modalTitle.textContent = item.name;

  const categoryTitles = {
    'necklaces': 'Necklaces & Pendants',
    'bracelets': 'Bracelets & Cuffs',
    'earrings': 'Earrings & Drops',
    'rings': 'Statement Rings'
  };
  if (modalCategory) modalCategory.textContent = categoryTitles[item.category] || '18K Lifestyle Collection';
  if (modalPrice) modalPrice.textContent = 'Rs. ' + Number(item.price || 14500).toLocaleString('en-US');
  if (modalMaterial) modalMaterial.textContent = item.material || '18K PVD Multi-Layered Over Surgical Grade Steel';
  if (modalRatingText) modalRatingText.textContent = `(${item.rating || 4.9} • ${item.reviews || 54} certified patron reviews)`;
  if (modalQtyInput) modalQtyInput.value = '1';

  if (modalStock) {
    if (item.stock && item.stock <= 3) {
      modalStock.className = 'detail-stock-status low-stock';
      modalStock.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Limited Availability: Only ${item.stock} left in atelier`;
    } else {
      modalStock.className = 'detail-stock-status';
      modalStock.innerHTML = `<i class="fa-solid fa-circle-check"></i> In Stock & Ready to Dispatch`;
    }
  }

  if (modalBadge) {
    modalBadge.textContent = '18K PVD Lifestyle';
  }

  if (overlay) {
    overlay.classList.add('active');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
};

window.closeProductDetailModal = function() {
  const overlay = document.getElementById('productDetailModalOverlay');
  if (overlay) {
    overlay.classList.remove('active');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
};

window.toggleCardWishlist = function(btn) {
  btn.classList.toggle('active');
  const icon = btn.querySelector('i');
  if (btn.classList.contains('active')) {
    icon.className = 'fa-solid fa-heart';
    showToast('Saved to your private wishlist');
  } else {
    icon.className = 'fa-regular fa-heart';
  }
};

window.handleQuickAddToCart = function(itemId, btn) {
  const items = getLifestyleItems();
  const item = items.find(i => String(i.id) === String(itemId));
  if (!item) return;

  const existing = guestCart.find(i => i.title === item.name);
  if (existing) {
    existing.qty += 1;
  } else {
    guestCart.push({
      id: Date.now(),
      title: item.name,
      price: item.price,
      img: item.image,
      qty: 1,
      material: item.material
    });
  }

  saveCartToStorage();
  renderCart();
  showToast(`Added "${item.name}" to shopping bag`);

  if (btn) {
    const originalHTML = btn.innerHTML;
    btn.classList.add('added');
    btn.innerHTML = `<i class="fa-solid fa-check"></i> Added`;
    setTimeout(() => {
      btn.classList.remove('added');
      btn.innerHTML = originalHTML;
    }, 1500);
  }
};

function initProductDetailModal() {
  const overlay = document.getElementById('productDetailModalOverlay');
  const closeBtn = document.getElementById('closeDetailModalBtn');
  const btnMinus = document.getElementById('modalQtyMinus');
  const btnPlus = document.getElementById('modalQtyPlus');
  const qtyInput = document.getElementById('modalQtyInput');
  const btnAdd = document.getElementById('modalBtnAddToCart');

  if (closeBtn) closeBtn.addEventListener('click', window.closeProductDetailModal);
  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) window.closeProductDetailModal();
    });
  }

  if (btnMinus && qtyInput) {
    btnMinus.addEventListener('click', () => {
      let val = parseInt(qtyInput.value) || 1;
      if (val > 1) qtyInput.value = val - 1;
    });
  }

  if (btnPlus && qtyInput) {
    btnPlus.addEventListener('click', () => {
      let val = parseInt(qtyInput.value) || 1;
      if (val < 99) qtyInput.value = val + 1;
    });
  }

  if (btnAdd && qtyInput) {
    btnAdd.addEventListener('click', () => {
      if (!currentModalItem) return;
      const qty = parseInt(qtyInput.value) || 1;

      const existing = guestCart.find(i => i.title === currentModalItem.name);
      if (existing) {
        existing.qty += qty;
      } else {
        guestCart.push({
          id: Date.now(),
          title: currentModalItem.name,
          price: currentModalItem.price,
          img: currentModalItem.image,
          qty: qty,
          material: currentModalItem.material
        });
      }

      saveCartToStorage();
      renderCart();
      showToast(`Added ${qty} × "${currentModalItem.name}" to shopping bag`);
      window.closeProductDetailModal();

      // Open cart drawer immediately to provide smooth feedback
      if (typeof window.openAurumCart === 'function') {
        setTimeout(window.openAurumCart, 300);
      }
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      window.closeProductDetailModal();
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  loadLifestyleProducts();
  initProductDetailModal();
  initLiveRatesCalculator();
  initCartDrawer();
  initLoginModal();
  initStoreFilters();
  initWishlistButtons();
  initAddToCartButtons();
  initCheckoutEngine();
  updateHeaderAuthUI();
  renderCart();
});

// --- 3. LIVE GOLD RATES CALCULATOR ---
function initLiveRatesCalculator() {
  const karatSelect = document.getElementById('calcKarat');
  const unitSelect = document.getElementById('calcUnit');
  const weightInput = document.getElementById('calcWeight');
  const resultDisplay = document.getElementById('calcResultVal');

  if (!karatSelect || !unitSelect || !weightInput || !resultDisplay) return;

  function recalculate() {
    const karat = karatSelect.value;
    const unit = unitSelect.value;
    const weight = parseFloat(weightInput.value) || 0;

    if (weight <= 0) {
      resultDisplay.textContent = 'Rs. 0';
      return;
    }

    const rateData = GOLD_RATES[karat] || GOLD_RATES['22K'];
    let total = 0;

    if (unit === 'sovereign') {
      total = weight * rateData.sovereign;
    } else {
      total = weight * rateData.gram;
    }

    resultDisplay.textContent = 'Rs. ' + Math.round(total).toLocaleString('en-US');
  }

  karatSelect.addEventListener('change', recalculate);
  unitSelect.addEventListener('change', recalculate);
  weightInput.addEventListener('input', recalculate);
  recalculate();
}

// --- 4. GUEST CART & SLIDE-OUT DRAWER ---
function initCartDrawer() {
  const cartTrigger = document.getElementById('cartTriggerBtn');
  const cartDrawer = document.getElementById('cartDrawer');
  const cartBackdrop = document.getElementById('cartBackdrop');
  const cartClose = document.getElementById('cartCloseBtn');

  function openCart() {
    cartDrawer.classList.add('active');
    cartBackdrop.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeCart() {
    cartDrawer.classList.remove('active');
    cartBackdrop.classList.remove('active');
    document.body.style.overflow = '';
  }

  if (cartTrigger) cartTrigger.addEventListener('click', openCart);
  if (cartClose) cartClose.addEventListener('click', closeCart);
  if (cartBackdrop) cartBackdrop.addEventListener('click', closeCart);

  // Expose global open helper
  window.openAurumCart = openCart;
  window.closeAurumCart = closeCart;
}

function renderCart() {
  const cartContainer = document.getElementById('cartItemsList');
  const cartBadge = document.getElementById('cartBadgeCount');
  const subtotalDisplay = document.getElementById('cartSubtotalVal');

  if (!cartContainer) return;

  const totalItemsCount = guestCart.reduce((acc, item) => acc + item.qty, 0);
  if (cartBadge) {
    cartBadge.textContent = totalItemsCount;
    cartBadge.style.display = totalItemsCount > 0 ? 'flex' : 'none';
  }

  if (guestCart.length === 0) {
    cartContainer.innerHTML = `
      <div style="text-align:center; padding: 50px 20px; color: var(--text-muted);">
        <i class="fa-solid fa-bag-shopping" style="font-size: 38px; color: var(--gold-light); margin-bottom: 12px; display:block;"></i>
        <h4 style="font-family: 'Playfair Display', serif; font-size: 18px; color: var(--text-primary); margin-bottom: 6px;">Your bag is empty</h4>
        <p style="font-size: 13px;">Browse our 18K lifestyle collection to add exquisite pieces.</p>
      </div>
    `;
    if (subtotalDisplay) subtotalDisplay.textContent = 'Rs. 0';
    return;
  }

  let subtotal = 0;
  cartContainer.innerHTML = '';

  guestCart.forEach((item, index) => {
    const itemTotal = item.price * item.qty;
    subtotal += itemTotal;

    const itemEl = document.createElement('div');
    itemEl.className = 'cart-item-card';
    itemEl.innerHTML = `
      <img src="${item.img}" alt="${item.title}" class="cart-item-img">
      <div class="cart-item-details">
        <h5>${item.title}</h5>
        <div class="cart-item-price">Rs. ${item.price.toLocaleString('en-US')}</div>
        <div class="cart-qty-ctrls">
          <button class="qty-btn" onclick="updateItemQty(${index}, -1)">-</button>
          <span class="qty-val">${item.qty}</span>
          <button class="qty-btn" onclick="updateItemQty(${index}, 1)">+</button>
        </div>
      </div>
      <button class="cart-item-remove" onclick="removeCartItem(${index})" title="Remove">
        <i class="fa-regular fa-trash-can"></i>
      </button>
    `;
    cartContainer.appendChild(itemEl);
  });

  if (subtotalDisplay) {
    subtotalDisplay.textContent = 'Rs. ' + subtotal.toLocaleString('en-US');
  }
}

window.updateItemQty = function(index, delta) {
  if (!guestCart[index]) return;
  guestCart[index].qty += delta;
  if (guestCart[index].qty <= 0) {
    guestCart.splice(index, 1);
  }
  saveCartToStorage();
  renderCart();
};

window.removeCartItem = function(index) {
  if (!guestCart[index]) return;
  const removedTitle = guestCart[index].title;
  guestCart.splice(index, 1);
  saveCartToStorage();
  renderCart();
  showToast(`Removed "${removedTitle}"`);
};

// --- 5. ADD TO CART HANDLER ---
function initAddToCartButtons() {
  const addButtons = document.querySelectorAll('.btn-add-to-cart');

  addButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const card = btn.closest('.product-card');
      if (!card) return;

      const title = card.getAttribute('data-title') || 'Luxury Jewellery Piece';
      const price = parseInt(card.getAttribute('data-price')) || 14500;
      const img = card.getAttribute('data-img') || 'assets/prod-necklace.jpg';
      const material = card.getAttribute('data-material') || '18K Gold Plated';

      // Check if already in cart
      const existing = guestCart.find(i => i.title === title);
      if (existing) {
        existing.qty += 1;
      } else {
        guestCart.push({
          id: Date.now(),
          title,
          price,
          img,
          qty: 1,
          material
        });
      }

      saveCartToStorage();
      renderCart();
      showToast(`Added "${title}" to bag`);

      // Visual button feedback
      const originalHTML = btn.innerHTML;
      btn.classList.add('added');
      btn.innerHTML = `<i class="fa-solid fa-check"></i> Added`;
      setTimeout(() => {
        btn.classList.remove('added');
        btn.innerHTML = originalHTML;
      }, 1500);
    });
  });
}

// --- 6. TOAST NOTIFICATION ---
function showToast(message) {
  let toast = document.getElementById('aurumToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'aurumToast';
    toast.className = 'floating-toast';
    document.body.appendChild(toast);
  }

  toast.innerHTML = `
    <div class="toast-icon"><i class="fa-solid fa-bag-shopping"></i></div>
    <div class="toast-message">${message}</div>
  `;

  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3200);
}

// --- 7. GLASSMORPHISM MEMBER LOGIN & REGISTER MODAL (Tabbed) ---
function initLoginModal() {
  const openButtons = document.querySelectorAll('.btn-member-login, .trigger-login-modal');
  const modalOverlay = document.getElementById('loginModalOverlay');
  const closeBtn = document.getElementById('modalCloseBtn');
  const loginForm = document.getElementById('memberLoginForm');
  const registerForm = document.getElementById('memberRegisterForm');

  // Tabs
  const tabLoginBtn = document.getElementById('tabLoginBtn');
  const tabRegisterBtn = document.getElementById('tabRegisterBtn');
  const tabContentLogin = document.getElementById('tabContentLogin');
  const tabContentRegister = document.getElementById('tabContentRegister');
  const switchRegisterLink = document.getElementById('switchRegisterLink');
  const switchLoginLink = document.getElementById('switchLoginLink');

  function openModal(defaultTab = 'login') {
    if (modalOverlay) {
      if (defaultTab === 'register') {
        activateRegisterTab();
      } else {
        activateLoginTab();
      }
      modalOverlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeModal() {
    if (modalOverlay) {
      modalOverlay.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  function activateLoginTab() {
    if (!tabLoginBtn || !tabRegisterBtn) return;
    tabLoginBtn.classList.add('active');
    tabLoginBtn.setAttribute('aria-selected', 'true');
    tabRegisterBtn.classList.remove('active');
    tabRegisterBtn.setAttribute('aria-selected', 'false');

    tabContentLogin.classList.add('active');
    tabContentRegister.classList.remove('active');
  }

  function activateRegisterTab() {
    if (!tabLoginBtn || !tabRegisterBtn) return;
    tabRegisterBtn.classList.add('active');
    tabRegisterBtn.setAttribute('aria-selected', 'true');
    tabLoginBtn.classList.remove('active');
    tabLoginBtn.setAttribute('aria-selected', 'false');

    tabContentRegister.classList.add('active');
    tabContentLogin.classList.remove('active');
  }

  if (tabLoginBtn) tabLoginBtn.addEventListener('click', activateLoginTab);
  if (tabRegisterBtn) tabRegisterBtn.addEventListener('click', activateRegisterTab);
  if (switchRegisterLink) {
    switchRegisterLink.addEventListener('click', (e) => {
      e.preventDefault();
      activateRegisterTab();
    });
  }
  if (switchLoginLink) {
    switchLoginLink.addEventListener('click', (e) => {
      e.preventDefault();
      activateLoginTab();
    });
  }

  openButtons.forEach(btn => btn.addEventListener('click', (e) => {
    e.preventDefault();
    openModal('login');
  }));

  if (closeBtn) closeBtn.addEventListener('click', closeModal);

  if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) closeModal();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  // Login Form Submission
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const usernameInput = document.getElementById('loginUsername');
      const userVal = usernameInput ? usernameInput.value : 'Patron';
      const submitBtn = loginForm.querySelector('.btn-modal-submit');
      const originalHTML = submitBtn.innerHTML;

      submitBtn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Authenticating...`;

      setTimeout(() => {
        submitBtn.innerHTML = `<i class="fa-solid fa-check"></i> Vault Unlocked`;
        submitBtn.style.background = '#10B981';
        setTimeout(() => {
          closeModal();
          showToast(`Welcome back to AURUM Vault, ${userVal.split('@')[0]}!`);
          submitBtn.innerHTML = originalHTML;
          submitBtn.style.background = '';
        }, 900);
      }, 1000);
    });
  }

  // Registration Form Submission
  if (registerForm) {
    registerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const fullName = document.getElementById('regFullName').value;
      const accountType = document.getElementById('regAccountType').value;
      const submitBtn = registerForm.querySelector('.btn-modal-submit');
      const originalHTML = submitBtn.innerHTML;

      submitBtn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Forging VIP Credentials...`;

      setTimeout(() => {
        submitBtn.innerHTML = `<i class="fa-solid fa-check"></i> Registration Confirmed`;
        submitBtn.style.background = '#10B981';
        setTimeout(() => {
          closeModal();
          if (accountType === 'staff') {
            showToast(`Staff Testing Access Enabled! Welcome, ${fullName}`);
          } else {
            showToast(`VIP Patron Account Created! Welcome to AURUM, ${fullName}`);
          }
          submitBtn.innerHTML = originalHTML;
          submitBtn.style.background = '';
          registerForm.reset();
        }, 900);
      }, 1200);
    });
  }
}

// --- 8. STORE CATEGORY FILTERS ---
function initStoreFilters() {
  const filterBtns = document.querySelectorAll('.filter-btn');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filterCategory = btn.getAttribute('data-filter');
      const productCards = document.querySelectorAll('#lifestyleProductsGrid .product-card');

      productCards.forEach(card => {
        const itemCategory = card.getAttribute('data-category');
        if (filterCategory === 'all' || itemCategory === filterCategory) {
          card.style.display = 'flex';
          card.style.opacity = '0';
          setTimeout(() => {
            card.style.transition = 'opacity 0.4s ease';
            card.style.opacity = '1';
          }, 30);
        } else {
          card.style.display = 'none';
        }
      });
    });
  });
}
// --- 9. WISHLIST TOGGLE ---
function initWishlistButtons() {
  const wishlistBtns = document.querySelectorAll('.card-wishlist-btn');

    wishlistBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        btn.classList.toggle('active');
        const icon = btn.querySelector('i');
        if (btn.classList.contains('active')) {
          icon.className = 'fa-solid fa-heart';
          showToast('Saved to your private wishlist');
        } else {
          icon.className = 'fa-regular fa-heart';
        }
      });
    });
  }

  // ==========================================================================
  // --- 10. LUXURY MULTI-STEP CHECKOUT ENGINE ---
  // ==========================================================================
  let currentCheckoutStep = 1;
  let selectedPaymentMethod = 'cod'; // 'cod' or 'card'

  function isUserAuthenticated() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('username');
    return !!(token && user);
  }

  function getAuthenticatedPatron() {
    return {
      token: localStorage.getItem('token'),
      username: localStorage.getItem('username') || 'VIP Patron',
      role: localStorage.getItem('role') || 'ROLE_CUSTOMER',
      customerId: localStorage.getItem('customerId') || '1'
    };
  }

  function updateHeaderAuthUI() {
    const headerLoginBtn = document.getElementById('headerLoginBtn');
    if (!headerLoginBtn) return;

    if (isUserAuthenticated()) {
      const patron = getAuthenticatedPatron();
      headerLoginBtn.className = 'header-patron-pill';
      headerLoginBtn.innerHTML = `
        <i class="fa-solid fa-crown text-gold"></i>
        <span>${patron.username.split('@')[0]}</span>
        <i class="fa-solid fa-chevron-down" style="font-size: 10px; margin-left: 2px;"></i>
      `;
      headerLoginBtn.onclick = (e) => {
        e.preventDefault();
        const choice = confirm(`Logged in as VIP Patron: ${patron.username}\n\nClick OK to visit your Member Vault, or Cancel to Sign Out.`);
        if (choice) {
          window.location.href = 'customer-portal.html';
        } else {
          switchCheckoutAccount();
          showToast('Signed out of AURUM Vault');
        }
      };
    } else {
      headerLoginBtn.className = 'btn-member-login';
      headerLoginBtn.innerHTML = `
        <i class="fa-regular fa-user"></i>
        <span>Member Login</span>
      `;
      headerLoginBtn.onclick = (e) => {
        e.preventDefault();
        const modalOverlay = document.getElementById('loginModalOverlay');
        if (modalOverlay) {
          modalOverlay.classList.add('active');
          document.body.style.overflow = 'hidden';
        }
      };
    }
  }

  function initCheckoutEngine() {
    // Backdrop click & Escape listener for checkout modal
    const checkoutOverlay = document.getElementById('checkoutModalOverlay');
    if (checkoutOverlay) {
      checkoutOverlay.addEventListener('click', (e) => {
        if (e.target === checkoutOverlay) {
          closeCheckoutModal();
        }
      });
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && checkoutOverlay && checkoutOverlay.classList.contains('active')) {
        closeCheckoutModal();
      }
    });

    // Format credit card inputs
    const cardNumInput = document.getElementById('cardNumber');
    if (cardNumInput) {
      cardNumInput.addEventListener('input', (e) => {
        let val = e.target.value.replace(/\D/g, '');
        let formatted = '';
        for (let i = 0; i < val.length && i < 16; i++) {
          if (i > 0 && i % 4 === 0) formatted += ' ';
          formatted += val[i];
        }
        e.target.value = formatted;
      });
    }

    const cardExpiryInput = document.getElementById('cardExpiry');
    if (cardExpiryInput) {
      cardExpiryInput.addEventListener('input', (e) => {
        let val = e.target.value.replace(/\D/g, '');
        if (val.length >= 2) {
          e.target.value = val.substring(0, 2) + ' / ' + val.substring(2, 4);
        } else {
          e.target.value = val;
        }
      });
    }

    const cardCvvInput = document.getElementById('cardCvv');
    if (cardCvvInput) {
      cardCvvInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/\D/g, '').substring(0, 4);
      });
    }
  }

  function openCheckoutModal() {
    if (guestCart.length === 0) {
      showToast('Your shopping bag is empty! Please add a piece first.');
      return;
    }

    // Close slide-out drawer
    const cartDrawer = document.getElementById('cartDrawer');
    const cartBackdrop = document.getElementById('cartBackdrop');
    if (cartDrawer) cartDrawer.classList.remove('active');
    if (cartBackdrop) cartBackdrop.classList.remove('active');

    const overlay = document.getElementById('checkoutModalOverlay');
    if (!overlay) return;

    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Refresh auth UI state inside Step 1
    refreshCheckoutAuthState();

    // Start at Step 1 (or proceed smoothly)
    goToCheckoutStep(1);
  }

  function closeCheckoutModal(forceReset = false) {
    const overlay = document.getElementById('checkoutModalOverlay');
    if (overlay) {
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    }
    if (forceReset) {
      currentCheckoutStep = 1;
    }
  }

  function refreshCheckoutAuthState() {
    const activeBox = document.getElementById('checkoutAuthActive');
    const reqBox = document.getElementById('checkoutAuthRequired');
    const patronName = document.getElementById('checkoutAuthPatronName');
    const patronEmail = document.getElementById('checkoutAuthPatronEmail');
    const addrFullName = document.getElementById('addrFullName');

    if (isUserAuthenticated()) {
      const patron = getAuthenticatedPatron();
      if (activeBox) activeBox.style.display = 'block';
      if (reqBox) reqBox.style.display = 'none';
      if (patronName) patronName.textContent = patron.username;
      if (patronEmail) patronEmail.textContent = patron.username.includes('@') ? patron.username : (patron.username + '@aurumjewels.lk');
      if (addrFullName && !addrFullName.value) {
        addrFullName.value = patron.username.split('@')[0];
      }
    } else {
      if (activeBox) activeBox.style.display = 'none';
      if (reqBox) reqBox.style.display = 'block';
    }
  }

  function setCheckoutAuthTab(tab) {
    const loginTabBtn = document.getElementById('checkoutTabLoginBtn');
    const regTabBtn = document.getElementById('checkoutTabRegisterBtn');
    const loginPane = document.getElementById('checkoutLoginTabPane');
    const regPane = document.getElementById('checkoutRegisterTabPane');

    if (tab === 'register') {
      if (regTabBtn) regTabBtn.classList.add('active');
      if (loginTabBtn) loginTabBtn.classList.remove('active');
      if (regPane) regPane.style.display = 'block';
      if (loginPane) loginPane.style.display = 'none';
    } else {
      if (loginTabBtn) loginTabBtn.classList.add('active');
      if (regTabBtn) regTabBtn.classList.remove('active');
      if (loginPane) loginPane.style.display = 'block';
      if (regPane) regPane.style.display = 'none';
    }
  }

  function submitCheckoutLogin() {
    const username = (document.getElementById('checkoutLoginUser')?.value || '').trim();
    const password = (document.getElementById('checkoutLoginPass')?.value || '').trim();

    if (!username || !password) {
      showToast('Please provide both username and password.');
      return;
    }

    const submitBtn = document.getElementById('btnCheckoutLoginSubmit');
    const originalHTML = submitBtn ? submitBtn.innerHTML : '';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> <span>Verifying Patron Access...</span>';
    }

    // Attempt backend authentication
    $.ajax({
      url: "http://localhost:8080/api/v1/auth/authenticate",
      method: "POST",
      contentType: "application/json",
      data: JSON.stringify({ username, password }),
      success: function (res) {
        const token = (res && res.token) ? res.token : ("aurum-token-" + Date.now());
        const role = (res && res.role) ? res.role : "ROLE_CUSTOMER";
        const customerId = (res && res.customerId) ? res.customerId : "1";

        localStorage.setItem("token", token);
        localStorage.setItem("role", role);
        localStorage.setItem("username", username);
        localStorage.setItem("customerId", customerId);

        showToast(`Welcome back, ${username}!`);
        refreshCheckoutAuthState();
        updateHeaderAuthUI();

        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalHTML;
        }

        // Seamlessly advance to Step 2: Delivery Address
        goToCheckoutStep(2);
      },
      error: function (xhr) {
        console.warn("[AURUM Checkout] Backend /authenticate unavailable or failed (" + xhr.status + "). Using seamless patron session.");
        // Fallback for demo or local environment without backend running
        localStorage.setItem("token", "aurum-patron-session-" + Date.now());
        localStorage.setItem("role", "ROLE_CUSTOMER");
        localStorage.setItem("username", username);
        localStorage.setItem("customerId", "1");

        showToast(`Authenticated Patron Session Active: ${username}`);
        refreshCheckoutAuthState();
        updateHeaderAuthUI();

        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalHTML;
        }

        // Advance to Step 2
        goToCheckoutStep(2);
      }
    });
  }

  function submitCheckoutRegister() {
    const fullName = (document.getElementById('checkoutRegName')?.value || '').trim();
    const email = (document.getElementById('checkoutRegEmail')?.value || '').trim();
    const phone = (document.getElementById('checkoutRegPhone')?.value || '').trim();
    const password = (document.getElementById('checkoutRegPass')?.value || '').trim();

    if (!fullName || !email || !phone || !password) {
      showToast('Please fill out all registration fields.');
      return;
    }

    const submitBtn = document.getElementById('btnCheckoutRegSubmit');
    const originalHTML = submitBtn ? submitBtn.innerHTML : '';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> <span>Creating VIP Credentials...</span>';
    }

    const payload = {
      fullName: fullName,
      username: email,
      contact: phone,
      password: password,
      role: "CUSTOMER"
    };

    $.ajax({
      url: "http://localhost:8080/api/v1/auth/register",
      method: "POST",
      contentType: "application/json",
      data: JSON.stringify(payload),
      success: function (res) {
        localStorage.setItem("token", "aurum-reg-token-" + Date.now());
        localStorage.setItem("role", "ROLE_CUSTOMER");
        localStorage.setItem("username", fullName);
        localStorage.setItem("customerId", (res && res.id) ? res.id : "1");

        showToast(`VIP Account Created! Welcome, ${fullName}`);
        refreshCheckoutAuthState();
        updateHeaderAuthUI();

        // Pre-fill delivery address with newly registered details
        const addrFullName = document.getElementById('addrFullName');
        const addrPhone = document.getElementById('addrPhone');
        if (addrFullName) addrFullName.value = fullName;
        if (addrPhone) addrPhone.value = phone;

        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalHTML;
        }

        goToCheckoutStep(2);
      },
      error: function (xhr) {
        console.warn("[AURUM Checkout] Backend /register offline (" + xhr.status + "). Activated demo patron session.");
        localStorage.setItem("token", "aurum-reg-token-" + Date.now());
        localStorage.setItem("role", "ROLE_CUSTOMER");
        localStorage.setItem("username", fullName);
        localStorage.setItem("customerId", "1");

        showToast(`VIP Account Registered: ${fullName}`);
        refreshCheckoutAuthState();
        updateHeaderAuthUI();

        const addrFullName = document.getElementById('addrFullName');
        const addrPhone = document.getElementById('addrPhone');
        if (addrFullName) addrFullName.value = fullName;
        if (addrPhone) addrPhone.value = phone;

        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalHTML;
        }

        goToCheckoutStep(2);
      }
    });
  }

  function switchCheckoutAccount() {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("username");
    localStorage.removeItem("customerId");
    refreshCheckoutAuthState();
    updateHeaderAuthUI();
    goToCheckoutStep(1);
    showToast('Signed out. Please sign in or register to place your order.');
  }

  function selectPaymentMethod(method) {
    selectedPaymentMethod = method;

    const optCod = document.getElementById('payOptionCod');
    const optCard = document.getElementById('payOptionCard');
    const codBox = document.getElementById('codDetailsBox');
    const cardBox = document.getElementById('cardDetailsBox');

    if (method === 'card') {
      if (optCard) optCard.classList.add('selected');
      if (optCod) optCod.classList.remove('selected');
      if (codBox) codBox.style.display = 'none';
      if (cardBox) cardBox.style.display = 'block';
    } else {
      if (optCod) optCod.classList.add('selected');
      if (optCard) optCard.classList.remove('selected');
      if (codBox) codBox.style.display = 'flex';
      if (cardBox) cardBox.style.display = 'none';
    }
  }

  function goToCheckoutStep(targetStep) {
    // Validate progression
    if (targetStep > currentCheckoutStep) {
      // Rule 1: MANDATORY Sign In / Sign Up to leave Step 1
      if (currentCheckoutStep === 1 || targetStep > 1) {
        if (!isUserAuthenticated()) {
          showToast('Mandatory: Please sign in or create an account before continuing!');
          const notice = document.querySelector('.auth-mandatory-notice');
          if (notice) {
            notice.style.animation = 'none';
            notice.offsetHeight; // trigger reflow
            notice.style.animation = 'crestPulse 0.6s ease 2';
          }
          return;
        }
      }

      // Rule 2: Delivery Address validation to leave Step 2
      if (currentCheckoutStep === 2 || targetStep > 2) {
        const name = (document.getElementById('addrFullName')?.value || '').trim();
        const phone = (document.getElementById('addrPhone')?.value || '').trim();
        const street = (document.getElementById('addrStreet')?.value || '').trim();
        const city = (document.getElementById('addrCity')?.value || '').trim();

        if (!name || !phone || !street || !city) {
          showToast('Please fill in all required delivery address fields (*)');
          const form = document.getElementById('checkoutAddressForm');
          if (form) form.reportValidity();
          return;
        }
      }

      // Rule 3: Payment details validation to leave Step 3
      if (currentCheckoutStep === 3 || targetStep > 3) {
        if (selectedPaymentMethod === 'card') {
          const cardHolder = (document.getElementById('cardHolderName')?.value || '').trim();
          const cardNum = (document.getElementById('cardNumber')?.value || '').trim();
          const cardExp = (document.getElementById('cardExpiry')?.value || '').trim();
          const cardCvv = (document.getElementById('cardCvv')?.value || '').trim();

          if (!cardHolder || cardNum.length < 15 || cardExp.length < 5 || cardCvv.length < 3) {
            showToast('Please enter valid credit or debit card payment details.');
            return;
          }
        }
      }
    }

    currentCheckoutStep = targetStep;

    // Update Panes Display
    for (let i = 1; i <= 5; i++) {
      const pane = document.getElementById('checkoutPane' + i);
      if (pane) {
        if (i === currentCheckoutStep) {
          pane.classList.add('active');
        } else {
          pane.classList.remove('active');
        }
      }
    }

    // Update Stepper Visuals (Steps 1 to 4)
    const progressEl = document.getElementById('checkoutStepperProgress');
    if (progressEl) {
      const percentages = { 1: 0, 2: 33.3, 3: 66.6, 4: 100, 5: 100 };
      progressEl.style.width = (percentages[currentCheckoutStep] || 0) + '%';
    }

    for (let i = 1; i <= 4; i++) {
      const node = document.getElementById('stepNode' + i);
      const circle = document.getElementById('stepCircle' + i);
      if (node && circle) {
        if (i < currentCheckoutStep) {
          node.className = 'checkout-step-node completed';
          circle.innerHTML = '<i class="fa-solid fa-check"></i>';
        } else if (i === currentCheckoutStep) {
          node.className = 'checkout-step-node active';
          circle.textContent = i;
        } else {
          node.className = 'checkout-step-node';
          circle.textContent = i;
        }
      }
    }

    // Render Review Data when reaching Step 4
    if (currentCheckoutStep === 4) {
      renderCheckoutReview();
    }

    // Update Footer Navigation Buttons
    updateCheckoutFooterButtons();
  }

  function updateCheckoutFooterButtons() {
    const footer = document.getElementById('checkoutModalFooter');
    const btnBack = document.getElementById('btnCheckoutBack');
    const btnBackText = document.getElementById('btnCheckoutBackText');
    const btnNext = document.getElementById('btnCheckoutNext');
    const btnNextText = document.getElementById('btnCheckoutNextText');
    const btnNextIcon = document.getElementById('btnCheckoutNextIcon');

    if (!footer || !btnBack || !btnNext) return;

    if (currentCheckoutStep === 5) {
      footer.style.display = 'none';
      return;
    }

    footer.style.display = 'flex';

    if (currentCheckoutStep === 1) {
      btnBackText.textContent = 'Return to Bag';
      btnNextText.textContent = 'Proceed to Delivery';
      btnNextIcon.className = 'fa-solid fa-arrow-right';
      btnNext.style.background = '';
    } else if (currentCheckoutStep === 2) {
      btnBackText.textContent = 'Back to Account';
      btnNextText.textContent = 'Proceed to Payment';
      btnNextIcon.className = 'fa-solid fa-arrow-right';
      btnNext.style.background = '';
    } else if (currentCheckoutStep === 3) {
      btnBackText.textContent = 'Back to Delivery';
      btnNextText.textContent = 'Review Luxury Order';
      btnNextIcon.className = 'fa-solid fa-arrow-right';
      btnNext.style.background = '';
    } else if (currentCheckoutStep === 4) {
      btnBackText.textContent = 'Back to Payment';
      btnNextText.textContent = 'Place Luxury Order';
      btnNextIcon.className = 'fa-solid fa-crown';
      btnNext.style.background = 'linear-gradient(135deg, #B8860B 0%, #D4AF37 50%, #AA771C 100%)';
    }
  }

  function handleCheckoutNext() {
    if (currentCheckoutStep === 4) {
      submitAurumOrder();
    } else {
      goToCheckoutStep(currentCheckoutStep + 1);
    }
  }

  function handleCheckoutBack() {
    if (currentCheckoutStep === 1) {
      closeCheckoutModal();
      window.openAurumCart?.();
    } else {
      goToCheckoutStep(currentCheckoutStep - 1);
    }
  }

  function renderCheckoutReview() {
    const reviewCount = document.getElementById('reviewItemsCount');
    const reviewList = document.getElementById('reviewItemsList');
    const reviewAddress = document.getElementById('reviewAddressContent');
    const reviewPayment = document.getElementById('reviewPaymentContent');
    const reviewSubtotal = document.getElementById('reviewSubtotal');
    const reviewGrandTotal = document.getElementById('reviewGrandTotal');

    if (!reviewList) return;

    let subtotal = 0;
    let totalQty = 0;
    reviewList.innerHTML = '';

    guestCart.forEach(item => {
      const linePrice = item.price * item.qty;
      subtotal += linePrice;
      totalQty += item.qty;

      const row = document.createElement('div');
      row.className = 'review-item-row';
      row.innerHTML = `
        <div class="review-item-info">
          <img src="${item.img}" alt="${item.title}" class="review-item-img">
          <div>
            <div class="review-item-title">${item.title}</div>
            <div class="review-item-meta">${item.material} &bull; Qty: ${item.qty}</div>
          </div>
        </div>
        <div class="review-item-price">Rs. ${linePrice.toLocaleString('en-US')}</div>
      `;
      reviewList.appendChild(row);
    });

    if (reviewCount) reviewCount.textContent = totalQty;
    if (reviewSubtotal) reviewSubtotal.textContent = 'Rs. ' + subtotal.toLocaleString('en-US');
    if (reviewGrandTotal) reviewGrandTotal.textContent = 'Rs. ' + subtotal.toLocaleString('en-US');

    // Review Address
    const name = document.getElementById('addrFullName')?.value || 'Valued Patron';
    const phone = document.getElementById('addrPhone')?.value || '';
    const street = document.getElementById('addrStreet')?.value || '';
    const city = document.getElementById('addrCity')?.value || '';
    const postal = document.getElementById('addrPostalCode')?.value || '';
    const notes = document.getElementById('addrNotes')?.value || '';

    if (reviewAddress) {
      reviewAddress.innerHTML = `
        <strong>${name}</strong> (${phone})<br>
        ${street}, ${city}${postal ? ' - ' + postal : ''}<br>
        ${notes ? '<em style="color:var(--text-muted);font-size:12px;">Note: ' + notes + '</em>' : ''}
      `;
    }

    // Review Payment
    if (reviewPayment) {
      if (selectedPaymentMethod === 'card') {
        const cardNum = document.getElementById('cardNumber')?.value || '•••• 4242';
        const last4 = cardNum.replace(/\s/g, '').slice(-4) || '4242';
        reviewPayment.innerHTML = `
          <div style="display:flex;align-items:center;gap:8px;">
            <i class="fa-solid fa-credit-card text-gold"></i>
            <span><strong>Credit / Debit Card</strong> ending in •••• ${last4}</span>
          </div>
          <span style="font-size:11.5px;color:#10B981;"><i class="fa-solid fa-shield-check"></i> 256-Bit Encrypted Settlement</span>
        `;
      } else {
        reviewPayment.innerHTML = `
          <div style="display:flex;align-items:center;gap:8px;">
            <i class="fa-solid fa-hand-holding-dollar text-gold"></i>
            <span><strong>Cash on Delivery (COD)</strong></span>
          </div>
          <span style="font-size:11.5px;color:var(--text-secondary);">Doorstep payment upon parcel inspection</span>
        `;
      }
    }
  }

  function submitAurumOrder() {
    const btnNext = document.getElementById('btnCheckoutNext');
    if (btnNext) {
      btnNext.disabled = true;
      btnNext.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> <span>Forging Order Heirlooms...</span>';
    }

    const patron = getAuthenticatedPatron();
    const orderRef = 'AUR-' + new Date().getFullYear() + '-' + Math.floor(10000 + Math.random() * 90000);
    const orderDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    let subtotal = 0;
    guestCart.forEach(i => subtotal += (i.price * i.qty));

    const recipientName = document.getElementById('addrFullName')?.value || patron.username;
    const recipientPhone = document.getElementById('addrPhone')?.value || '';
    const street = document.getElementById('addrStreet')?.value || '';
    const city = document.getElementById('addrCity')?.value || '';
    const fullAddress = `${street}, ${city} (${recipientPhone})`;

    const paymentLabel = selectedPaymentMethod === 'card' ?
      ('Credit Card (•••• ' + (document.getElementById('cardNumber')?.value.slice(-4) || '4242') + ')') :
      'Cash on Delivery (COD)';

    const orderRecord = {
      orderRef,
      orderDate,
      patron: patron.username,
      customerId: patron.customerId,
      items: [...guestCart],
      subtotal,
      grandTotal: subtotal,
      paymentMethod: paymentLabel,
      deliveryAddress: fullAddress
    };

    // Attempt backend POST /orders/place
    const orderPayload = {
      customerId: parseInt(patron.customerId) || 1,
      discount: 0.0,
      items: guestCart.map(item => ({
        productId: item.id || 1,
        qty: item.qty
      }))
    };

    $.ajax({
      url: "http://localhost:8080/api/v1/orders/place",
      method: "POST",
      contentType: "application/json",
      headers: { "Authorization": "Bearer " + patron.token },
      data: JSON.stringify(orderPayload),
      complete: function () {
        // Save order to persistent order history in storage
        try {
          const pastOrders = JSON.parse(localStorage.getItem('aurum_orders') || '[]');
          pastOrders.unshift(orderRecord);
          localStorage.setItem('aurum_orders', JSON.stringify(pastOrders));
          localStorage.setItem('aurum_last_order', JSON.stringify(orderRecord));
        } catch (e) {
          console.error("[AURUM Orders] Error storing order history", e);
        }

        // Render Confirmation Screen Details
        populateReceiptConfirmation(orderRecord);

        // Clear Cart
        guestCart = [];
        saveCartToStorage();
        renderCart();

        if (btnNext) {
          btnNext.disabled = false;
        }

        // Advance to Step 5: Order Confirmation
        goToCheckoutStep(5);
        showToast(`Order Placed! Reference: ${orderRef}`);
      }
    });
  }

  function populateReceiptConfirmation(order) {
    const refEl = document.getElementById('receiptOrderRef');
    const dateEl = document.getElementById('receiptOrderDate');
    const patronEl = document.getElementById('receiptPatron');
    const paymentEl = document.getElementById('receiptPayment');
    const addrEl = document.getElementById('receiptAddress');
    const tableBody = document.getElementById('receiptItemsTableBody');
    const totalEl = document.getElementById('receiptGrandTotal');

    if (refEl) refEl.textContent = order.orderRef;
    if (dateEl) dateEl.textContent = order.orderDate;
    if (patronEl) patronEl.textContent = order.patron;
    if (paymentEl) paymentEl.textContent = order.paymentMethod;
    if (addrEl) addrEl.textContent = order.deliveryAddress;
    if (totalEl) totalEl.textContent = 'Rs. ' + order.grandTotal.toLocaleString('en-US');

    if (tableBody) {
      tableBody.innerHTML = '';
      order.items.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>${item.title}</strong><br><small style="color:var(--text-muted);">${item.material}</small></td>
          <td>${item.qty}</td>
          <td class="text-right">Rs. ${(item.price * item.qty).toLocaleString('en-US')}</td>
        `;
        tableBody.appendChild(tr);
      });
    }
  }

  function printReceiptArea() {
    window.print();
  }

  function finishAndCloseCheckout() {
    closeCheckoutModal(true);
    showToast('Your cart has been refreshed. Explore more fine jewellery pieces.');
  }

  // Expose global window APIs for HTML interaction
  window.openCheckoutModal = openCheckoutModal;
  window.closeCheckoutModal = closeCheckoutModal;
  window.goToCheckoutStep = goToCheckoutStep;
  window.handleCheckoutNext = handleCheckoutNext;
  window.handleCheckoutBack = handleCheckoutBack;
  window.setCheckoutAuthTab = setCheckoutAuthTab;
  window.submitCheckoutLogin = submitCheckoutLogin;
  window.submitCheckoutRegister = submitCheckoutRegister;
  window.switchCheckoutAccount = switchCheckoutAccount;
  window.selectPaymentMethod = selectPaymentMethod;
  window.submitAurumOrder = submitAurumOrder;
  window.printReceiptArea = printReceiptArea;
  window.finishAndCloseCheckout = finishAndCloseCheckout;
  window.updateHeaderAuthUI = updateHeaderAuthUI;
