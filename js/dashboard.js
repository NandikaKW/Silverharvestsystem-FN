const body = document.querySelector("body"),
    modeToggle = body.querySelector(".mode-toggle");
sidebar = body.querySelector("nav");
sidebarToggle = body.querySelector(".sidebar-toggle");

// Get mode from localStorage
let getMode = localStorage.getItem("mode");
if(getMode && getMode === "dark"){
    body.classList.add("dark");
}

// Get sidebar status from localStorage
let getStatus = localStorage.getItem("status");
if(getStatus && getStatus === "close"){
    sidebar.classList.add("close");
}

// Toggle dark/light mode
modeToggle.addEventListener("click", () => {
    body.classList.toggle("dark");

    if(body.classList.contains("dark")){
        localStorage.setItem("mode", "dark");
    } else {
        localStorage.setItem("mode", "light");
    }
});

// Toggle sidebar
sidebarToggle.addEventListener("click", () => {
    sidebar.classList.toggle("close");

    if(sidebar.classList.contains("close")){
        localStorage.setItem("status", "close");
    } else {
        localStorage.setItem("status", "open");
    }
});

// Set active menu item
document.addEventListener("DOMContentLoaded", function() {
    const navLinks = document.querySelectorAll(".nav-links li a");

    navLinks.forEach(link => {
        link.addEventListener("click", function() {
            navLinks.forEach(item => item.classList.remove("active"));
            this.classList.add("active");
        });
    });

    // Set dashboard as active by default
    const currentPath = window.location.pathname;
    if(currentPath.endsWith("index.html") || currentPath.endsWith("/")) {
        navLinks[0].classList.add("active");
    }
});

// Simulate data loading
document.addEventListener("DOMContentLoaded", function() {
    setTimeout(() => {
        const loadingElements = document.querySelectorAll(".skeleton");
        loadingElements.forEach(el => {
            el.classList.remove("skeleton");
        });
    }, 1500);
});