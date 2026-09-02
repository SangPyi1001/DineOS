/* =========================================================
   DINEOS USER CONFIG & DATA
   ========================================================= */
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

// =========================================================
// SYSTEM INITIALIZATION & OTA UPDATE CHECKER
// =========================================================
document.addEventListener("DOMContentLoaded", () => {
    checkOTAUpdate();
    fetchMenuData();
});

/* --- OTA UPDATE SYSTEM --- */
async function checkOTAUpdate() {
    try {
        const currentVersion = localStorage.getItem("dineos_app_version") || "v1.0.0";
        const res = await fetch(`https://api.github.com/repos/${CONFIG.GITHUB_USER}/${CONFIG.GITHUB_REPO}/releases/latest`);
        
        if (!res.ok) return;
        const data = await res.json();
        const latestVersion = data.tag_name;

        // လက်ရှိ Version နဲ့ GitHub ပေါ်က နောက်ဆုံး Version မတူရင် Update တောင်းမည်
        if (latestVersion && latestVersion !== currentVersion) {
            
            document.getElementById("newVersionTag").innerText = latestVersion;
            window.pendingUpdateVersion = latestVersion; // Temporarily Store

            // Release Notes ကို ဖတ်ပြီး Bullet Format ဖြင့် ခွဲထုတ်မည် (New Line ပေါ်မူတည်၍)
            const rawNotes = data.body || "• Performance improvements\n• Bug fixes";
            const notesArray = rawNotes.split('\n').filter(note => note.trim() !== "");
            
            // List Items အဖြစ် ပြောင်းခြင်း
            const listHtml = notesArray.map(note => {
                // အရှေ့မှာ -, *, • ပါရင်ဖျက်ပြီး သန့်စင်မည် (CSS က Auto တပ်ပေးမည်)
                let cleanText = note.replace(/^[-*•]\s*/, '').trim(); 
                return `<li>${cleanText}</li>`;
            }).join('');

            document.getElementById("whatsNewList").innerHTML = listHtml;
            
            // Show Modal (Mini Window)
            setTimeout(() => {
                document.getElementById("updateModal").classList.remove("hidden");
            }, 1000);
        }
    } catch (error) {
        console.log("OTA Update check failed:", error);
    }
}

function closeUpdateModal() {
    document.getElementById("updateModal").classList.add("hidden");
}

function applyUpdate() {
    // Version သစ်ကို LocalStorage တွင် မှတ်ပြီး Refresh လုပ်ပေးမည်
    if (window.pendingUpdateVersion) {
        localStorage.setItem("dineos_app_version", window.pendingUpdateVersion);
    }
    document.getElementById("updateModal").classList.add("hidden");
    
    // Cache ရှင်းပြီး Page အသစ်ကနေ ပြန်ဆွဲတင်မည် (Force Reload)
    window.location.reload(true);
}

// =========================================================
// FETCH MENU FROM TELEGRAM & RENDER
// =========================================================
function formatRM(val) {
    const num = parseFloat(val) || 0;
    return `${num.toFixed(2)} RM`;
}

async function fetchMenuData() {
    const grid = document.getElementById("foodGrid");
    try {
        const chatRes = await fetch(`https://api.telegram.org/bot${CONFIG.BOT_TOKEN}/getChat?chat_id=${CONFIG.CHANNEL_ID}`);
        const chatData = await chatRes.json();

        if (chatData.ok && chatData.result.pinned_message && chatData.result.pinned_message.document) {
            const doc = chatData.result.pinned_message.document;
            const fileRes = await fetch(`https://api.telegram.org/bot${CONFIG.BOT_TOKEN}/getFile?file_id=${doc.file_id}`);
            const fileData = await fileRes.json();

            const jsonRes = await fetch(`https://api.telegram.org/file/bot${CONFIG.BOT_TOKEN}/${fileData.result.file_path}`);
            const remoteData = await jsonRes.json();

            if (remoteData) {
                categories = remoteData.categories ? remoteData.categories.map(c => typeof c === 'object' ? c.name : c) : [];
                menuItems = remoteData.items || [];
                renderCategoryChips();
                renderMenuGrid();
            }
        } else {
            grid.innerHTML = "<p style='text-align:center; grid-column: 1/-1;'>⚠️ Menu မရှိသေးပါ။ (Admin မှ Publish လုပ်ရန်လိုအပ်ပါသည်)</p>";
        }
    } catch (e) {
        grid.innerHTML = `<p style='color:red; text-align:center; grid-column: 1/-1;'>❌ Data ရယူရာတွင် အခက်အခဲရှိနေပါသည်</p>`;
    }
}

function renderCategoryChips() {
    const container = document.getElementById("categoryContainer");
    let html = `<div class="cat-chip active" onclick="filterMenu('All')">All</div>`;
    categories.forEach(cat => {
        html += `<div class="cat-chip" onclick="filterMenu('${cat}')">${cat}</div>`;
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

function renderMenuGrid() {
    const grid = document.getElementById("foodGrid");
    grid.innerHTML = "";

    const filtered = currentCategory === "All" ? menuItems : menuItems.filter(i => i.category === currentCategory);

    if (filtered.length === 0) {
        grid.innerHTML = "<p style='text-align:center; grid-column: 1/-1; color: gray;'>ဤ Category တွင် ဟင်းပွဲမရှိသေးပါ။</p>";
        return;
    }

    filtered.forEach(item => {
        const imgHtml = item.fileId 
            ? `<img src="https://via.placeholder.com/150" class="food-img" alt="${item.name}">` // In real app, fetch TG photo path
            : `<div class="food-img-placeholder">🍽️</div>`;
            
        const isAvail = item.isAvailable;
        const btnText = isAvail ? "➕ Add to Cart" : "Sold Out";
        
        grid.innerHTML += `
            <div class="food-card">
                <div>
                    ${imgHtml}
                    <h3 class="food-name">${item.name}</h3>
                    <div class="food-price">${formatRM(item.price)}</div>
                </div>
                <button class="btn btn-add" ${!isAvail ? 'disabled' : ''} onclick="addToCart('${item.id}')">${btnText}</button>
            </div>
        `;
    });
}

// =========================================================
// CART SYSTEM (Add, Remove, Total)
// =========================================================
function toggleCart() {
    document.getElementById("cartSidebar").classList.toggle("open");
    document.getElementById("cartOverlay").classList.toggle("active");
}

function addToCart(itemId) {
    const item = menuItems.find(i => i.id === itemId);
    if (!item || !item.isAvailable) return;

    const exist = cart.find(c => c.id === itemId);
    if (exist) {
        exist.qty += 1;
    } else {
        cart.push({ id: item.id, name: item.name, price: item.price, qty: 1 });
    }
    
    updateCartUI();
    // Notification အသေးစား (Optional)
    const countBadge = document.getElementById("cartCount");
    countBadge.style.transform = "scale(1.5)";
    setTimeout(() => countBadge.style.transform = "scale(1)", 200);
}

function updateQty(itemId, change) {
    const itemIndex = cart.findIndex(c => c.id === itemId);
    if (itemIndex > -1) {
        cart[itemIndex].qty += change;
        if (cart[itemIndex].qty <= 0) {
            cart.splice(itemIndex, 1);
        }
        updateCartUI();
    }
}

function updateCartUI() {
    const container = document.getElementById("cartItemsContainer");
    const countBadge = document.getElementById("cartCount");
    const totalAmt = document.getElementById("cartTotalAmt");

    let totalQty = 0;
    let totalPrice = 0;
    let html = "";

    cart.forEach(c => {
        totalQty += c.qty;
        totalPrice += (c.price * c.qty);
        html += `
            <div class="cart-item">
                <div class="cart-item-info">
                    <strong>${c.name}</strong>
                    <small>${formatRM(c.price)} x ${c.qty}</small>
                </div>
                <div class="cart-qty-controls">
                    <button class="qty-btn" onclick="updateQty('${c.id}', -1)">-</button>
                    <span>${c.qty}</span>
                    <button class="qty-btn" onclick="updateQty('${c.id}', 1)">+</button>
                </div>
            </div>
        `;
    });

    if (cart.length === 0) {
        html = `<p style="text-align:center; color:gray; margin-top: 50px;">ခြင်းတောင်းထဲတွင် ဘာမှမရှိသေးပါ။</p>`;
    }

    container.innerHTML = html;
    countBadge.innerText = totalQty;
    totalAmt.innerText = formatRM(totalPrice);
}

function checkout() {
    if (cart.length === 0) return alert("ကျေးဇူးပြု၍ ဟင်းပွဲရွေးချယ်ပါ။");
    alert("✅ သင်၏ Order တင်ခြင်း အောင်မြင်ပါသည်။ (Telegram သို့ပို့မည့် System ဆက်ရေးရန်)");
    cart = [];
    updateCartUI();
    toggleCart();
}
