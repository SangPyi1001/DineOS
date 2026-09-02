const CONFIG = {
    BOT_TOKEN: "8910477506:AAEdznW12hy61FRoqOSU19m7XaOV7d2u4fA",
    CHANNEL_ID: "-1003954446258",
    GITHUB_USER: "SangPyi1001",
    GITHUB_REPO: "DineOS"
};

let menuItems = [];
let categories = [];
let currentCategory = "All";
let cart = [];

// ==========================================
// SYSTEM INIT & THEME
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    fetchMenuData();
    checkOTAUpdate();
});

function initTheme() {
    const savedTheme = localStorage.getItem("dineos_theme") || "light";
    document.documentElement.setAttribute("data-theme", savedTheme);
    document.getElementById("themeToggle").checked = (savedTheme === "dark");
}

function toggleTheme() {
    const isDark = document.getElementById("themeToggle").checked;
    const newTheme = isDark ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("dineos_theme", newTheme);
}

// ==========================================
// SIDEBARS & OVERLAYS
// ==========================================
function toggleNav() {
    document.getElementById("navSidebar").classList.toggle("open");
    toggleOverlay();
}

function toggleCart() {
    document.getElementById("cartSidebar").classList.toggle("open");
    toggleOverlay();
}

function closeAllSidebars() {
    document.getElementById("navSidebar").classList.remove("open");
    document.getElementById("cartSidebar").classList.remove("open");
    document.getElementById("mainOverlay").classList.remove("active");
}

function toggleOverlay() {
    const navOpen = document.getElementById("navSidebar").classList.contains("open");
    const cartOpen = document.getElementById("cartSidebar").classList.contains("open");
    if (navOpen || cartOpen) {
        document.getElementById("mainOverlay").classList.add("active");
    } else {
        document.getElementById("mainOverlay").classList.remove("active");
    }
}

// ==========================================
// RM CURRENCY FORMAT
// ==========================================
function formatRM(val) {
    const num = parseFloat(val) || 0;
    return `${num.toFixed(2)} RM`; // MMK အစား RM ကိုသာ တပ်ပေးပါမည်
}

// ==========================================
// FETCH & RENDER MENU
// ==========================================
async function fetchMenuData() {
    // Artificial Mock Data For Demo (Replace with your Telegram Fetch logic if needed)
    menuItems = [
        { id: '1', name: 'Nasi Lemak', price: 8.50, category: 'Food', isAvailable: true },
        { id: '2', name: 'Teh Tarik', price: 3.00, category: 'Drinks', isAvailable: true },
        { id: '3', name: 'Mee Goreng', price: 7.00, category: 'Food', isAvailable: false }
    ];
    categories = ['Food', 'Drinks'];
    
    renderCategoryChips();
    renderMenuGrid();
}

function renderCategoryChips() {
    const container = document.getElementById("categoryContainer");
    let html = `<div class="cat-chip glass-panel active" onclick="filterMenu('All')">All</div>`;
    categories.forEach(cat => {
        html += `<div class="cat-chip glass-panel" onclick="filterMenu('${cat}')">${cat}</div>`;
    });
    container.innerHTML = html;
}

function filterMenu(catName) {
    currentCategory = catName;
    document.querySelectorAll(".cat-chip").forEach(el => {
        el.classList.toggle("active", el.innerText === catName);
    });
    renderMenuGrid();
}

function searchMenu() {
    renderMenuGrid();
}

function renderMenuGrid() {
    const grid = document.getElementById("foodGrid");
    const searchVal = document.getElementById("searchInput").value.toLowerCase();
    grid.innerHTML = "";

    let filtered = currentCategory === "All" ? menuItems : menuItems.filter(i => i.category === currentCategory);
    
    if(searchVal) {
        filtered = filtered.filter(i => i.name.toLowerCase().includes(searchVal));
    }

    if (filtered.length === 0) {
        grid.innerHTML = "<p style='text-align:center; grid-column: 1/-1; color: var(--text-muted);'>ဟင်းပွဲမတွေ့ရှိပါ။</p>";
        return;
    }

    filtered.forEach(item => {
        const isAvail = item.isAvailable;
        const btnText = isAvail ? "➕ Add to Cart" : "Sold Out";
        
        grid.innerHTML += `
            <div class="food-card glass-panel">
                <img src="https://via.placeholder.com/150" class="food-img" alt="${item.name}">
                <h3 class="food-name">${item.name}</h3>
                <div class="food-price">${formatRM(item.price)}</div>
                <button class="btn btn-add ${isAvail ? 'btn-primary' : 'glass-panel'}" 
                    ${!isAvail ? 'disabled' : ''} onclick="addToCart('${item.id}')">${btnText}</button>
            </div>
        `;
    });
}

// ==========================================
// CART LOGIC
// ==========================================
function addToCart(itemId) {
    const item = menuItems.find(i => i.id === itemId);
    if (!item || !item.isAvailable) return;

    const exist = cart.find(c => c.id === itemId);
    if (exist) exist.qty += 1;
    else cart.push({ ...item, qty: 1 });
    
    updateCartUI();
    
    const countBadge = document.getElementById("cartCount");
    countBadge.style.transform = "scale(1.5)";
    setTimeout(() => countBadge.style.transform = "scale(1)", 200);
}

function updateCartUI() {
    const container = document.getElementById("cartItemsContainer");
    const countBadge = document.getElementById("cartCount");
    const totalAmt = document.getElementById("cartTotalAmt");

    let totalQty = 0, totalPrice = 0, html = "";

    cart.forEach((c, index) => {
        totalQty += c.qty;
        totalPrice += (c.price * c.qty);
        html += `
            <div style="display:flex; justify-content:space-between; margin-bottom:15px; border-bottom:1px solid var(--glass-border); padding-bottom:10px;">
                <div>
                    <strong>${c.name}</strong><br>
                    <small style="color:var(--text-muted)">${formatRM(c.price)} x ${c.qty}</small>
                </div>
                <div>
                    <button onclick="cart[${index}].qty--; if(cart[${index}].qty==0) cart.splice(${index},1); updateCartUI();" style="padding:5px 10px; border:none; border-radius:5px; background:var(--glass-bg); color:var(--text-main);">-</button>
                    <span style="margin:0 5px;">${c.qty}</span>
                    <button onclick="cart[${index}].qty++; updateCartUI();" style="padding:5px 10px; border:none; border-radius:5px; background:var(--glass-bg); color:var(--text-main);">+</button>
                </div>
            </div>
        `;
    });

    if (cart.length === 0) html = `<p style="text-align:center; color:var(--text-muted); margin-top:50px;">ခြင်းတောင်းထဲတွင် ဘာမှမရှိသေးပါ။</p>`;
    
    container.innerHTML = html;
    countBadge.innerText = totalQty;
    totalAmt.innerText = formatRM(totalPrice);
}

function checkout() {
    if (cart.length === 0) return alert("ကျေးဇူးပြု၍ ဟင်းပွဲရွေးချယ်ပါ။");
    alert(`✅ ${formatRM(cart.reduce((sum, i)=>sum+(i.price*i.qty),0))} ဖိုး Order တင်ခြင်း အောင်မြင်ပါသည်။`);
    cart = []; updateCartUI(); closeAllSidebars();
}

// ==========================================
// OTA UPDATE (Mini Window)
// ==========================================
async function checkOTAUpdate() {
    // ဤနေရာတွင် မူလအတိုင်း GitHub Version တိုက်စစ်မည့် Code ရှိပါသည်။
}
function closeUpdateModal() {
    document.getElementById("updateModal").classList.add("hidden");
}
