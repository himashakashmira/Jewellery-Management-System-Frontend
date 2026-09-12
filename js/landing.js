// --- 1. LIVE GOLD RATES CONSTANTS (Sri Lankan Market standard) ---
const GOLD_RATES = {
  '24K': { sovereign: 377000, gram: 47125 },
  '22K': { sovereign: 347000, gram: 43375 },
  '18K': { sovereign: 282720, gram: 35340 }
};

// --- 2. GUEST CART STATE ---
let guestCart = [
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

document.addEventListener('DOMContentLoaded', () => {
  initLiveRatesCalculator();
  initCartDrawer();
  initLoginModal();
  initStoreFilters();
  initWishlistButtons();
  initAddToCartButtons();
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
  renderCart();
};

window.removeCartItem = function(index) {
  if (!guestCart[index]) return;
  const removedTitle = guestCart[index].title;
  guestCart.splice(index, 1);
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
  const productCards = document.querySelectorAll('.product-card');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filterCategory = btn.getAttribute('data-filter');

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
