// =========================================
// SIDEBAR TOGGLE LOGIC
// =========================================
function openSidebar() {
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("sidebarOverlay");
    
    if (sidebar && overlay) {
        sidebar.classList.add("open");
        overlay.classList.add("active");
    }
}

function closeSidebar() {
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("sidebarOverlay");
    
    if (sidebar && overlay) {
        sidebar.classList.remove("open");
        overlay.classList.remove("active");
    }
}
