const fs = require('fs');
const fsAsync = require('fs').promises;
const path = require('path');
const https = require('https');

// ==========================================
// CONFIGURATION & SUPABASE KEYS
// ==========================================
const SUPABASE_URL = "https://cncahdezxttujjzihozt.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNuY2FoZGV6eHR0dWpqemlob3p0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkzOTI2MjgsImV4cCI6MjEwNDk2ODYyOH0.69WvQ73HHJvTiKlRkMdACgxMVLj4prcLMhRhRfTfW_0";
const SITE_BASE_URL = "https://www.wedugo.com"; 
const ADSENSE_CLIENT_ID = "ca-pub-5947676189341600";
const CACHE_BUSTER = Date.now(); 

// Global Variables for Dynamic Code Snippets
let AFFILIATE_SNIPPET_BANNER = "";
let AFFILIATE_SNIPPET_SIDEBAR = "";
let CUSTOM_HEAD_CODE = "";
let CUSTOM_BODY_BOTTOM_CODE = "";
let BLOG_BOTTOM_CODE = "";
let MCQ_BOTTOM_CODE = "";

// Global Variables for Dynamic Module Toggles
let TOOL_PDF_READER = true;
let TOOL_SCORE_ESTIMATOR = true;

const CATEGORY_LIST = [
    "Indian Geography","World Organisations","Inventions","Physics","Indian Economy","Days and Years","Technology","Chemistry","Honours and Awards","General Science","General Knowledge","Reasoning","Civil Engineering","Hindi","Sports","Computer","Biology","World Geography","Famous Personalities","Aptitude","Madhya Pradesh GK","Solar System","English","Series","Average","Sets","Percentage","Simple Interest","Surds and Indices","Ratio and Proportion","Time and Work","Trains Time","Age","Area","Profit and Loss","Calendar","Simplification","Indian Polity and Constitution","Indian History","World History","History","Environmental Science and Ecology","Blood Relation","Biochemistry","Fats and Fatty Acid Metabolism","Vitamins","Enzymes","Mineral Metabolism","Hormone Metabolism","Distance and Direction","Nucleic Acids","Water and Electrolyte Balance","History of Microbiology","Microbiology","Bacteria and Gram Staining","Agriculture","Solid Mechanics","Child Development and Pedagogy","Virus","Pharmacology","Anatomy","Psychology","Indian General Knowledge"
];

// ==========================================
// ADVERTISEMENT & AFFILIATE UI COMPONENTS
// ==========================================
function getAdBannerHtml(label) {
    return `
        <div class="ad-banner-wrapper my-4 text-center">
            <span class="text-muted d-block small mb-1" style="font-size: 0.70rem; letter-spacing: 0.5px; text-transform: uppercase;">${label}</span>
            ${AFFILIATE_SNIPPET_BANNER ? `<div class="affiliate-banner-container mb-3">${AFFILIATE_SNIPPET_BANNER}</div>` : ''}
            <div class="ad-container shadow-sm border-0 mb-0" style="min-height: 100px; background: #fafafa; border-radius: 8px;">
                <ins class="adsbygoogle" style="display:block" data-ad-client="${ADSENSE_CLIENT_ID}" data-ad-slot="1234567890" data-ad-format="auto" data-full-width-responsive="true"></ins>
                <script>try { (adsbygoogle = window.adsbygoogle || []).push({}); } catch(e) {}</script>
            </div>
        </div>
    `;
}

function getAdSidebar() {
    return `
        <div class="col-lg-4 d-none d-lg-block">
            <div class="sticky-desktop-sidebar" style="position: sticky; top: 90px;">
                <div class="card shadow-sm border-0 rounded-4 bg-white p-3 mb-4 text-center">
                    <span class="text-muted small fw-bold text-uppercase mb-2 d-block" style="font-size: 0.75rem;">Sponsored</span>
                    ${AFFILIATE_SNIPPET_SIDEBAR ? `<div class="affiliate-sidebar-container mb-3">${AFFILIATE_SNIPPET_SIDEBAR}</div>` : ''}
                    <div class="ad-container shadow-none border-0 mb-0" style="min-height: 280px; background: #f8fafc;">
                        <ins class="adsbygoogle" style="display:block" data-ad-client="${ADSENSE_CLIENT_ID}" data-ad-slot="0987654321" data-ad-format="auto" data-full-width-responsive="true"></ins>
                        <script>try { (adsbygoogle = window.adsbygoogle || []).push({}); } catch(e) {}</script>
                    </div>
                </div>
                <div class="card shadow-sm border-0 rounded-4 bg-white p-4">
                    <h5 class="fw-bold text-dark mb-3"><i class="bi bi-gear-wide-connected text-primary me-2"></i>Custom Exam</h5>
                    <p class="text-secondary small mb-3 lh-lg">Create your own test environment. Choose categories, set negative marking, and practice like the real exam.</p>
                    <a href="/custom-exam.html" class="btn btn-outline-primary btn-sm w-100 rounded-pill fw-bold">Build Custom Test</a>
                </div>
            </div>
        </div>
    `;
}

function getNavbar() {
    let toolsDropdownList = `<li><a class="dropdown-item fw-medium py-2" href="/tools.html"><i class="bi bi-collection me-2 text-secondary"></i>All Tools Explorer</a></li><li><hr class="dropdown-divider"></li>`;
    
    if(TOOL_SCORE_ESTIMATOR) {
        toolsDropdownList += `<li><a class="dropdown-item fw-medium py-2" href="/tools.html#estimator"><i class="bi bi-calculator me-2 text-primary"></i>Score Estimator</a></li>`;
    }
    if(TOOL_PDF_READER) {
        toolsDropdownList += `<li><a class="dropdown-item fw-medium py-2" href="/pdf-reader.html"><i class="bi bi-file-earmark-pdf-fill me-2 text-danger"></i>PDF Reader</a></li>`;
    }

    return `
    <nav class="navbar navbar-expand-lg navbar-light bg-white mb-4 shadow-sm py-3 border-bottom sticky-top">
        <div class="container">
            <a class="navbar-brand d-flex align-items-center" href="/index.html">
                <img src="/main_images/logo.png?v=${CACHE_BUSTER}" alt="Wedugo Logo" height="40" onerror="this.style.display='none'">
            </a>
            <button class="navbar-toggler border-0 shadow-none" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav ms-auto fw-semibold fs-6 gap-2 align-items-lg-center">
                    <li class="nav-item"><a class="nav-link text-dark px-3 rounded-pill hover-bg-light" href="/index.html"><i class="bi bi-house-door me-1"></i>Home</a></li>
                    <li class="nav-item"><a class="nav-link text-dark px-3 rounded-pill hover-bg-light" href="/categories.html"><i class="bi bi-grid me-1"></i>Categories</a></li>
                    <li class="nav-item"><a class="nav-link text-primary px-3 rounded-pill bg-primary bg-opacity-10 fw-bold border border-primary-subtle" href="/custom-exam.html"><i class="bi bi-gear-wide-connected me-1"></i>Custom Exam</a></li>
                    <li class="nav-item dropdown">
                        <a class="nav-link dropdown-toggle text-dark px-3 rounded-pill hover-bg-light" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                            <i class="bi bi-tools me-1"></i>Tools
                        </a>
                        <ul class="dropdown-menu border-0 shadow-sm mt-2 rounded-4">
                            ${toolsDropdownList}
                        </ul>
                    </li>
                    <li class="nav-item"><a class="nav-link text-dark px-3 rounded-pill hover-bg-light" href="/blogs.html"><i class="bi bi-journal-text me-1"></i>Blog</a></li>
                    <li class="nav-item ms-lg-2" id="auth-nav-container">
                        <button class="btn btn-outline-dark btn-sm rounded-pill px-4 fw-bold" data-bs-toggle="modal" data-bs-target="#authModal">Login / Join</button>
                    </li>
                </ul>
            </div>
        </div>
    </nav>`;
}

function getFooter() {
    return `
    <footer class="bg-white border-top py-5 mt-auto">
        <div class="container">
            <div class="row text-center text-md-start align-items-center">
                <div class="col-md-6 mb-3 mb-md-0">
                    <p class="mb-0 text-muted small fw-medium">© ${new Date().getFullYear()} Wedugo Education. All Rights Reserved.</p>
                </div>
                <div class="col-md-6 text-md-end">
                    <a href="/tools.html" class="text-secondary text-decoration-none small me-3 hover-text-primary">Study Tools</a>
                    <a href="/about.html" class="text-secondary text-decoration-none small me-3 hover-text-primary">About Us</a>
                    <a href="/privacy.html" class="text-secondary text-decoration-none small me-3 hover-text-primary">Privacy Policy</a>
                    <a href="/terms.html" class="text-secondary text-decoration-none small hover-text-primary">Terms of Service</a>
                </div>
            </div>
        </div>
    </footer>`;
}

// 🟢 MASTER HTML SHELL WITH INJECTIONS
function getHtmlShell(title, content, seoDescription = "") {
    const cleanDesc = (seoDescription || 'In-depth educational articles, study guides, and free custom MCQ mock tests to master your competitive exams at Wedugo Education.').replace(/"/g, '&quot;').substring(0, 160);
    const displayTitle = title.includes("Wedugo Education") ? title : `${title} | Wedugo Education`;

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>${displayTitle}</title>
    <meta name="description" content="${cleanDesc}">
    <link rel="icon" href="/main_images/icon.png" type="image/png">

    <!-- Google Tag -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-G3TY8XCR55"></script>
    <script>window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', 'G-G3TY8XCR55');</script>

    <!-- CSS & Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Merriweather:wght@400;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">

    <!-- External Scripts -->
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}" crossorigin="anonymous"></script>

    <!-- CUSTOM HEAD INJECTION CODE -->
    ${CUSTOM_HEAD_CODE}

    <style>
        body { background-color: #f8fafc; font-family: 'Inter', sans-serif; color: #334155; display: flex; flex-direction: column; min-height: 100vh; }
        .hover-bg-light:hover { background-color: #f1f5f9; color: #0d6efd !important; }
        .hover-text-primary:hover { color: #0d6efd !important; }
        .card { border: none; border-radius: 16px; box-shadow: 0 4px 15px rgba(0,0,0,0.03); transition: transform 0.3s ease; }
        .card-hover:hover { transform: translateY(-5px); box-shadow: 0 15px 30px rgba(0,0,0,0.08) !important; }
        .blog-title { font-family: 'Inter', sans-serif; font-weight: 800; letter-spacing: -0.5px; line-height: 1.2; }
        .article-content { font-family: 'Merriweather', serif; font-size: 1.15rem; color: #1e293b; line-height: 1.9; }
        .article-content img { max-width: 100%; height: auto; border-radius: 12px; margin: 2rem 0; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
        .badge-cat { font-size: 0.75rem; padding: 0.5em 1em; letter-spacing: 0.5px; border-radius: 6px; text-transform: uppercase; font-weight: 700;}
        .option-btn { text-align: left; padding: 16px 24px; font-weight: 500; font-size: 1.05rem; border-radius: 12px; border: 2px solid #e2e8f0; background: #ffffff; transition: all 0.2s; color: #475569; margin-bottom: 8px;}
        .option-btn:hover:not(:disabled) { background-color: #f8fafc; border-color: #cbd5e1; transform: translateX(5px); }
        .option-btn.selected { background-color: #eff6ff; border-color: #3b82f6; color: #1d4ed8; }
        .option-btn.correct-show { background-color: #f0fdf4 !important; border-color: #22c55e !important; color: #15803d !important; font-weight: 600; }
        .option-btn.incorrect-show { background-color: #fef2f2 !important; border-color: #ef4444 !important; color: #b91c1c !important; }
        .timer-header { position: sticky; top: 70px; z-index: 1020; border-bottom: 4px solid #3b82f6; background: rgba(255,255,255,0.95); backdrop-filter: blur(8px); }
        .module-locked-overlay { position: absolute; top:0; left:0; right:0; bottom:0; background: rgba(255,255,255,0.9); backdrop-filter: blur(5px); z-index: 1000; display: flex; align-items: center; justify-content: center; border-radius: 16px; }

        /* Custom Exam Portal CSS */
        .app-header { background-color: #1e293b; color: #fff; padding: 12px 15px; display: flex; align-items: center; justify-content: space-between; }
        .app-subheader { background-color: #f8fafc; padding: 10px 15px; display: flex; align-items: center; gap: 12px; border-bottom: 1px solid #e2e8f0; font-size: 0.9rem; color: #64748b; }
        .q-circle { width: 28px; height: 28px; background-color: #94a3b8; color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; }
        .opt-card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin-bottom: 10px; cursor: pointer; display: flex; align-items: center; gap: 15px; background: #fff; transition: all 0.2s; font-size: 1.05rem; }
        .opt-card:hover { border-color: #cbd5e1; background-color: #f8fafc; }
        .opt-card.selected { border-color: #3b82f6; background-color: #eff6ff; color: #1d4ed8;}
        .opt-card input { display: none; }
        .opt-num { font-weight: bold; color: #94a3b8; }
        .bottom-action-bar { padding: 12px 15px; background: #fff; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; gap: 10px; }
        .q-palette-btn { width: 35px; height: 35px; border-radius: 8px; font-weight: 600; display: inline-flex; align-items: center; justify-content: center; margin: 4px; border: 1px solid #cbd5e1; cursor: pointer; color: #333; background: #fff;}
        .q-palette-btn.answered { background: #22c55e; color: #fff; border-color: #22c55e; }
        .q-palette-btn.not-answered { background: #ef4444; color: #fff; border-color: #ef4444; }
        .q-palette-btn.marked { background: #a855f7; color: #fff; border-color: #a855f7; }
        .q-palette-btn.marked-answered { background: #a855f7; color: #fff; border-color: #a855f7; position: relative; }
        .q-palette-btn.marked-answered::after { content: '✔'; position: absolute; bottom: -4px; right: -2px; color: #22c55e; font-size: 10px; background: #fff; border-radius: 50%; width: 12px; height: 12px; display: flex; align-items: center; justify-content: center; border: 1px solid #22c55e;}
        .q-palette-btn.active-q { border: 2px solid #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2); }
        .exam-sidebar { background: #f8fafc; border-left: 1px solid #e2e8f0; height: 100%; display: flex; flex-direction: column; }
        @media (max-width: 991px) {
            #exam-panel .row.g-0 { flex-direction: column; }
            .bottom-action-bar { position: fixed; bottom: 0; left: 0; right: 0; z-index: 1050; box-shadow: 0 -2px 10px rgba(0,0,0,0.05); }
            .mobile-content-area { padding-bottom: 80px; }
            .exam-sidebar { display: none; }
            .exam-sidebar.show-mobile { display: flex; position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 2000; background: #fff; border-left: none;}
        }
    </style>
</head>
<body>
    ${getNavbar()}

    <div class="modal fade" id="authModal" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content rounded-4 border-0 shadow-lg p-3">
                <div class="modal-header border-0 pb-0">
                    <h5 class="modal-title fw-bold">Join Wedugo</h5>
                    <button type="button" class="btn-close shadow-none" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div id="auth-alert" class="alert d-none small fw-bold"></div>
                    <form id="auth-form" onsubmit="handleAuth(event)">
                        <div class="mb-3">
                            <label class="form-label small fw-bold text-muted">Email Address</label>
                            <input type="email" id="auth-email" class="form-control form-control-lg bg-light border-0" required>
                        </div>
                        <div class="mb-4">
                            <label class="form-label small fw-bold text-muted">Password</label>
                            <input type="password" id="auth-password" class="form-control form-control-lg bg-light border-0" required>
                        </div>
                        <button type="submit" class="btn btn-primary w-100 py-3 rounded-pill fw-bold shadow-sm" id="auth-submit-btn">Login / Register</button>
                    </form>
                </div>
            </div>
        </div>
    </div>

    <div class="container flex-grow-1 pb-5 position-relative" id="main-content-area">
        ${content}
    </div>

    ${getFooter()}

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script>
        const _SU_URL = "${SUPABASE_URL}";
        const _SU_KEY = "${SUPABASE_KEY}";
        let supabaseClient = window.supabase.createClient(_SU_URL, _SU_KEY);
        let currentUser = null;

        // FETCH LIVE MODULE SETTINGS (No Build Required for ON/OFF)
        async function fetchLiveModuleSettings() {
            try {
                const { data } = await supabaseClient.from('dynamic_components').select('*');
                if(data) {
                    const getVal = (name) => { const obj = data.find(s => s.component_name === name); return obj ? obj.is_active : true; };
                    
                    // Live UI Updates for Toggles
                    if(getVal('TOOL_PDF_READER')) {
                        if(document.getElementById('nav-tool-pdf')) document.getElementById('nav-tool-pdf').classList.remove('d-none');
                        if(document.getElementById('tool-card-pdf')) document.getElementById('tool-card-pdf').classList.remove('d-none');
                    } else {
                        if(window.location.pathname.includes('pdf-reader')) window.location.href = '/tools.html';
                    }

                    if(getVal('TOOL_SCORE_ESTIMATOR')) {
                        if(document.getElementById('nav-tool-score')) document.getElementById('nav-tool-score').classList.remove('d-none');
                        if(document.getElementById('tool-card-score')) document.getElementById('tool-card-score').classList.remove('d-none');
                    }
                }
            } catch(e) { console.error("Error fetching live settings."); }
        }

        async function initAuth() {
            const { data: { session } } = await supabaseClient.auth.getSession();
            updateNavUI(session?.user);
            checkModuleLock();

            supabaseClient.auth.onAuthStateChange((_event, session) => {
                updateNavUI(session?.user);
                checkModuleLock();
            });
        }

        function updateNavUI(user) {
            currentUser = user;
            const navContainer = document.getElementById('auth-nav-container');
            if(user) {
                navContainer.innerHTML = \`<div class="dropdown">
                    <button class="btn btn-dark btn-sm rounded-pill px-4 fw-bold dropdown-toggle" type="button" data-bs-toggle="dropdown">\${user.email.split('@')[0]}</button>
                    <ul class="dropdown-menu dropdown-menu-end border-0 shadow mt-2 rounded-4">
                        <li><a class="dropdown-item fw-medium py-2" href="/admin/index.html"><i class="bi bi-speedometer2 me-2"></i>Dashboard</a></li>
                        <li><hr class="dropdown-divider"></li>
                        <li><a class="dropdown-item fw-bold text-danger py-2" href="#" onclick="supabaseClient.auth.signOut()"><i class="bi bi-box-arrow-right me-2"></i>Logout</a></li>
                    </ul>
                </div>\`;
                const authModal = bootstrap.Modal.getInstance(document.getElementById('authModal'));
                if(authModal) authModal.hide();
            } else {
                navContainer.innerHTML = \`<button class="btn btn-outline-dark btn-sm rounded-pill px-4 fw-bold" data-bs-toggle="modal" data-bs-target="#authModal">Login / Join</button>\`;
            }
        }

        async function handleAuth(e) {
            e.preventDefault();
            const email = document.getElementById('auth-email').value;
            const pass = document.getElementById('auth-password').value;
            const alertBox = document.getElementById('auth-alert');
            const btn = document.getElementById('auth-submit-btn');

            btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Processing...';
            btn.disabled = true;
            alertBox.classList.add('d-none');

            let { data, error } = await supabaseClient.auth.signInWithPassword({ email, password: pass });

            if(error && error.message.includes("Invalid login")) {
                const reg = await supabaseClient.auth.signUp({ email, password: pass });
                data = reg.data; 
                error = reg.error;

                if(!error && data.user && data.user.identities && data.user.identities.length === 0) {
                    error = { message: "Account already exists but invalid credentials provided." };
                } else if(!error) {
                    alertBox.className = "alert alert-success small fw-bold mb-3";
                    alertBox.innerText = "Registration successful! You are now logged in.";
                    alertBox.classList.remove('d-none');
                }
            }

            if(error) {
                alertBox.className = "alert alert-danger small fw-bold mb-3";
                alertBox.innerText = error.message;
                alertBox.classList.remove('d-none');
            }
            btn.innerHTML = 'Login / Register'; 
            btn.disabled = false;
        }

        async function checkModuleLock() {
            const isProtected = window.location.href.includes('mock.html') || window.location.href.includes('custom-exam.html');
            if(!isProtected) return;

            const { data } = await supabaseClient.from('dynamic_components').select('*').eq('component_name', 'LOCK_MOCK_TESTS').maybeSingle();

            if(data && data.is_active && !currentUser) {
                const area = document.getElementById('main-content-area');
                if(!document.getElementById('lock-overlay')) {
                    const overlay = document.createElement('div');
                    overlay.id = 'lock-overlay';
                    overlay.className = 'module-locked-overlay flex-column text-center p-4';
                    overlay.innerHTML = \`
                        <i class="bi bi-lock-fill text-primary" style="font-size: 4rem;"></i>
                        <h2 class="fw-bold mt-3 text-dark">Premium Module Locked</h2>
                        <p class="text-secondary fs-5 mb-4">Please login or register to access mock tests and custom exams.</p>
                        <button class="btn btn-primary btn-lg rounded-pill px-5 fw-bold shadow" data-bs-toggle="modal" data-bs-target="#authModal">Login Now to Unlock</button>
                    \`;
                    area.appendChild(overlay);
                }
            } else {
                const overlay = document.getElementById('lock-overlay');
                if(overlay) overlay.remove();
            }
        }

        document.addEventListener("DOMContentLoaded", () => {
            initAuth();
            fetchLiveModuleSettings();
        });
    </script>
    
    <!-- CUSTOM BODY BOTTOM INJECTION CODE -->
    ${CUSTOM_BODY_BOTTOM_CODE}
</body>
</html>`;
}

function getBreadcrumbs(pathArray) {
    let list = `<li class="breadcrumb-item"><a href="/index.html" class="text-decoration-none text-primary fw-medium"><i class="bi bi-house-door-fill me-1"></i>Home</a></li>`;
    pathArray.forEach((item, index) => {
        if(index === pathArray.length - 1) {
            list += `<li class="breadcrumb-item active text-truncate fw-medium" aria-current="page" style="max-width: 250px;">${item.name}</li>`;
        } else {
            list += `<li class="breadcrumb-item"><a href="${item.url}" class="text-decoration-none text-primary fw-medium">${item.name}</a></li>`;
        }
    });
    return `<nav aria-label="breadcrumb" class="mb-4 mt-2"><ol class="breadcrumb bg-transparent p-0 mb-0">${list}</ol></nav>`;
}

function getIndexTemplate() {
    return getHtmlShell("Wedugo Education: Master Your Exams", `
        <div class="mt-4 mb-5 text-center">
            <h1 class="display-3 blog-title text-dark mb-3">Learn & Master Your Exams</h1>
            <p class="lead text-secondary col-md-8 mx-auto">High-quality editorial guides, deep concepts, and extensive practice tools for modern competitive examinations.</p>
        </div>
        <div id="home-loader" class="text-center py-5"><div class="spinner-border text-primary"></div><p class="mt-2 text-muted">Fetching live data...</p></div>
        <div id="home-content" class="d-none">
            <div class="row g-4 mb-5" id="home-blogs"></div>
            <div class="text-center mt-4 mb-5"><a href="/blogs.html" class="btn btn-outline-dark btn-lg rounded-pill px-5 fw-bold">View All Articles</a></div>
            ${getAdBannerHtml("Advertisement")}
            <div class="mt-5 pt-5 border-top">
                <h2 class="blog-title text-dark mb-4"><i class="bi bi-lightning-fill text-warning me-2"></i>Quick Knowledge Check</h2>
                <div class="row g-4" id="home-quizzes"></div>
            </div>
            <div class="mt-5 pt-5 border-top">
                <h2 class="blog-title text-dark mb-4">Explore Platforms</h2>
                <div class="row g-3 text-center">
                    <div class="col-md-4"><a href="/custom-exam.html" class="card bg-dark text-white border-0 p-4 text-decoration-none card-hover rounded-4 h-100"><h4 class="fw-bold mb-0"><i class="bi bi-gear-wide-connected me-2"></i>Custom Exam</h4></a></div>
                    <div class="col-md-4"><a href="/categories.html" class="card bg-primary text-white border-0 p-4 text-decoration-none card-hover rounded-4 h-100"><h4 class="fw-bold mb-0"><i class="bi bi-grid me-2"></i>Categories</h4></a></div>
                    <div class="col-md-4"><a href="/tools.html" class="card bg-success text-white border-0 p-4 text-decoration-none card-hover rounded-4 h-100"><h4 class="fw-bold mb-0"><i class="bi bi-tools me-2"></i>Study Tools</h4></a></div>
                </div>
            </div>
        </div>
        <script>
            document.addEventListener('DOMContentLoaded', async () => {
                const { data: blogs } = await supabaseClient.from('blog_posts').select('slug, title, category, created_at').order('created_at', { ascending: false }).limit(6);
                if(blogs) {
                    let blogHtml = '';
                    blogs.forEach((b, i) => {
                        const date = new Date(b.created_at).toLocaleDateString();
                        if(i===0) blogHtml += \`<div class="col-12 mb-2"><a href="/blog.html?slug=\${b.slug}" class="card shadow border-0 rounded-4 overflow-hidden text-decoration-none bg-dark text-white card-hover p-4 p-md-5"><span class="badge bg-primary w-auto align-self-start mb-3 px-3 py-2 text-uppercase fw-bold">\${b.category}</span><h2 class="display-5 fw-bold mb-3 lh-sm text-white">\${b.title}</h2><div class="small fw-medium text-white-50"><i class="bi bi-clock me-1"></i>\${date}</div></a></div>\`;
                        else blogHtml += \`<div class="col-md-6 col-lg-4"><a href="/blog.html?slug=\${b.slug}" class="card h-100 p-4 shadow-sm border border-light text-decoration-none card-hover bg-white d-flex flex-column"><span class="text-primary small fw-bold text-uppercase mb-2">\${b.category}</span><h3 class="h5 fw-bold text-dark mb-3 lh-base">\${b.title}</h3><small class="text-muted mt-auto"><i class="bi bi-calendar3 me-1"></i>\${date}</small></a></div>\`;
                    });
                    document.getElementById('home-blogs').innerHTML = blogHtml;
                }
                const { data: qData } = await supabaseClient.from('questions').select('id, qcategory, question').limit(5);
                if(qData) {
                    let qHtml = '';
                    qData.forEach(q => {
                        qHtml += \`<div class="col-12"><div class="card p-4 p-md-5 bg-white shadow-sm border border-light rounded-4 card-hover"><div class="mb-4"><span class="badge bg-primary bg-opacity-10 text-primary border px-3 py-2 rounded-pill">\${q.qcategory}</span></div><h3 class="h4 fw-bold text-dark mb-4 lh-base">\${q.question}</h3><a href="/mcq.html?id=\${q.id}" class="btn btn-outline-primary fw-bold px-4 rounded-pill">Solve Question <i class="bi bi-arrow-right"></i></a></div></div>\`;
                    });
                    document.getElementById('home-quizzes').innerHTML = qHtml;
                }
                document.getElementById('home-loader').classList.add('d-none'); document.getElementById('home-content').classList.remove('d-none');
            });
        </script>
    `);
}

function getCategoriesTemplate() {
    let catsHtml = CATEGORY_LIST.map(cat => `
        <div class="col-md-6 col-lg-4">
            <a href="/category.html?name=${encodeURIComponent(cat)}" class="card shadow-sm h-100 card-hover border-light rounded-4 bg-white text-decoration-none p-4 text-center d-flex flex-column justify-content-center">
                <h3 class="h5 fw-bold mb-2 text-dark">${cat}</h3>
                <p class="text-secondary small mb-0">Explore MCQs & Mocks</p>
            </a>
        </div>
    `).join('');

    return getHtmlShell("All MCQ Categories", `
        ${getBreadcrumbs([{name: 'Categories', url: '/categories.html'}])}
        <h1 class="display-6 blog-title mb-4 text-dark mt-3">All MCQ Categories</h1>
        <p class="text-secondary mb-5">Select a subject to access mock tests and individual questions.</p>
        ${getAdBannerHtml("Sponsored")}
        <div class="row g-4">${catsHtml}</div>
    `);
}

function getCustomExamTemplate() {
    const catsOptions = CATEGORY_LIST.map((cat, i) => `
        <div class="form-check"><input class="form-check-input cat-checkbox" type="checkbox" value="${cat}" id="cat${i}" checked><label class="form-check-label" for="cat${i}">${cat}</label></div>
    `).join('');

    return getHtmlShell("Custom Exam Builder", `
        ${getBreadcrumbs([{name: 'Custom Exam', url: '/custom-exam.html'}])}
        <div id="loader-panel" class="text-center py-5 d-none"><div class="spinner-border text-primary"></div><h3 class="mt-3 text-secondary">Loading Database...</h3></div>
        <div id="setup-panel">
            <div class="card shadow-sm border-0 rounded-4 bg-white p-4 p-md-5 mb-5">
                <div class="text-center mb-5"><h1 class="blog-title display-5 text-dark mb-3"><i class="bi bi-gear-wide-connected text-primary me-2"></i>Custom Exam Builder</h1></div>
                <div class="row g-4">
                    <div class="col-12"><div class="d-flex justify-content-between mb-2 gap-2"><label class="form-label fw-bold">1. Select Categories</label><div><button class="btn btn-sm btn-primary rounded-pill px-3 me-2 fw-bold" onclick="document.querySelectorAll('.cat-checkbox').forEach(cb=>cb.checked=true)">Select All</button></div></div><div class="border rounded p-3 bg-light" style="max-height: 250px; overflow-y: auto;">${catsOptions}</div></div>
                    <div class="col-md-6 col-lg-3"><label class="form-label fw-bold">2. No. of Questions</label><input type="number" id="ce-qcount" class="form-control form-control-lg fw-bold" value="20" min="5" max="100"></div>
                    <div class="col-md-6 col-lg-3"><label class="form-label fw-bold">3. Time (Mins)</label><input type="number" id="ce-time" class="form-control form-control-lg fw-bold" value="20" min="1" max="180"></div>
                    <div class="col-md-6 col-lg-3"><label class="form-label fw-bold text-success">4. Plus Marking (+)</label><input type="number" id="ce-pos-mark" class="form-control form-control-lg fw-bold text-success" value="1" step="0.5"></div>
                    <div class="col-md-6 col-lg-3"><label class="form-label fw-bold text-danger">5. Negative Marking (-)</label><input type="number" id="ce-neg-mark" class="form-control form-control-lg fw-bold text-danger" value="0.33" step="0.01"></div>
                </div>
                <div class="text-center mt-5"><button id="start-exam-btn" class="btn btn-primary btn-lg px-5 py-3 rounded-pill fw-bold shadow"><i class="bi bi-play-circle-fill me-2"></i>Start Portal</button></div>
            </div>
        </div>
        <div id="exam-panel" class="d-none w-100 position-absolute top-0 start-0 bg-white" style="min-height: 100vh; z-index: 2000;">
            <div class="app-header shadow-sm"><div class="d-flex align-items-center gap-2"><i class="bi bi-pause-circle fs-3 cursor-pointer" onclick="location.reload();"></i><div class="fw-bold fs-5 font-monospace" id="ui-timer">00:00:00</div></div><div class="fw-bold text-truncate px-2">Custom Exam Portal</div><i class="bi bi-list fs-1 cursor-pointer" onclick="document.getElementById('mobile-sidebar').classList.toggle('show-mobile')"></i></div>
            <div class="app-subheader"><div class="q-circle" id="ui-q-circle">1</div><div class="text-success fw-bold ms-auto ms-sm-0" id="ui-pos-m">+1.0</div><div class="text-danger fw-bold me-auto me-sm-0" id="ui-neg-m">-0.33</div></div>
            <div class="row g-0">
                <div class="col-lg-8 col-xl-9 mobile-content-area">
                    <div class="p-3 p-md-5 overflow-auto" style="height: calc(100vh - 180px);"><div class="mb-2 text-muted fw-bold small" id="ui-q-cat">Category</div><h4 class="mb-4 text-dark lh-base fw-bold" id="ui-q-text">Loading...</h4><div class="d-flex flex-column gap-2" id="ui-options"><label class="opt-card" id="card-opt-A"><span class="opt-num">1.</span><input type="radio" name="opt" value="A" class="exam-radio"> <span id="ui-opt-a" class="flex-grow-1"></span></label><label class="opt-card" id="card-opt-B"><span class="opt-num">2.</span><input type="radio" name="opt" value="B" class="exam-radio"> <span id="ui-opt-b" class="flex-grow-1"></span></label><label class="opt-card" id="card-opt-C"><span class="opt-num">3.</span><input type="radio" name="opt" value="C" class="exam-radio"> <span id="ui-opt-c" class="flex-grow-1"></span></label><label class="opt-card" id="card-opt-D"><span class="opt-num">4.</span><input type="radio" name="opt" value="D" class="exam-radio"> <span id="ui-opt-d" class="flex-grow-1"></span></label></div></div>
                    <div class="bottom-action-bar flex-wrap align-items-center"><div class="d-flex gap-2"><button class="btn btn-outline-secondary px-3 py-2 fw-bold" id="btn-mark-next">Mark & Next</button><button class="btn btn-outline-secondary px-3 py-2 fw-bold" id="btn-clear">Clear</button></div><button class="btn btn-primary px-4 py-2 fw-bold" id="btn-save-next">Save & Next</button></div>
                </div>
                <div class="col-lg-4 col-xl-3 exam-sidebar shadow-lg" id="mobile-sidebar"><div class="p-3 border-bottom bg-white small fw-bold"><div class="row g-2 text-center mb-2"><div class="col-6"><span class="q-palette-btn answered" id="count-ans">0</span> Answered</div><div class="col-6"><span class="q-palette-btn not-answered" id="count-not-ans">0</span> Not Answered</div></div></div><div class="p-3 flex-grow-1 overflow-auto bg-light"><div class="fw-bold mb-3 text-secondary border-bottom pb-2">Questions Palette</div><div id="ui-palette" class="d-flex flex-wrap"></div></div><div class="p-3 bg-white border-top text-center mt-auto"><button class="btn btn-primary w-100 fw-bold py-3 shadow-sm" id="btn-submit-exam">Submit Final Exam</button></div></div>
            </div>
        </div>
        <div id="result-panel" class="d-none">
            <div class="card shadow-lg border-success text-center p-4 p-md-5 rounded-4 bg-success bg-opacity-10 border-2"><h2 class="text-success fw-bold display-6 mb-4">Exam Submitted!</h2><div class="row justify-content-center mb-5 mt-4"><div class="col-md-8"><div class="card border-0 shadow-sm bg-white p-4"><div class="d-flex justify-content-between mb-2 fs-5"><span>Total Questions:</span> <strong id="res-total">0</strong></div><div class="d-flex justify-content-between mb-2 fs-5 text-success"><span>Correct:</span> <strong id="res-correct">0</strong></div><div class="d-flex justify-content-between mb-2 fs-5 text-danger"><span>Incorrect:</span> <strong id="res-incorrect">0</strong></div><div class="d-flex justify-content-between fs-3 fw-bold text-primary mt-3 border-top pt-2"><span>Final Marks:</span> <span id="res-marks">0</span></div></div></div></div><button class="btn btn-primary btn-lg rounded-pill px-5 fw-bold" onclick="location.reload()">Create New Custom Exam</button></div>
            <div class="mt-5" id="solution-container"><h3 class="fw-bold border-bottom pb-3 mb-4">Detailed Solutions</h3><div id="solution-list"></div></div>
        </div>
        <script>
            let examData = [], userState = [], currentQ = 0, pMarks = 1, nMarks = 0.33, timerInterval, timeLeft = 0;
            document.getElementById('start-exam-btn').addEventListener('click', async () => {
                const cats = Array.from(document.querySelectorAll('.cat-checkbox:checked')).map(cb => cb.value);
                if(cats.length === 0) return alert("Select at least one category.");
                document.getElementById('setup-panel').classList.add('d-none'); document.getElementById('loader-panel').classList.remove('d-none');
                const reqQCount = parseInt(document.getElementById('ce-qcount').value) || 20; pMarks = parseFloat(document.getElementById('ce-pos-mark').value) || 1; nMarks = parseFloat(document.getElementById('ce-neg-mark').value) || 0.33;
                const { data, error } = await supabaseClient.from('questions').select('*').in('qcategory', cats).limit(300);
                if(error || !data || data.length === 0) { alert("No questions found."); location.reload(); return; }
                examData = data.sort(() => 0.5 - Math.random()).slice(0, Math.min(reqQCount, data.length));
                userState = examData.map(() => ({ status: 'not-visited', selected: null })); userState[0].status = 'not-answered';
                document.getElementById('ui-pos-m').innerText = '+' + pMarks; document.getElementById('ui-neg-m').innerText = '-' + nMarks;
                document.getElementById('loader-panel').classList.add('d-none'); document.getElementById('exam-panel').classList.remove('d-none');
                document.querySelector('nav.navbar').style.display = 'none'; document.querySelector('footer').style.display = 'none';
                buildPalette(); renderQ(0);
                timeLeft = (parseInt(document.getElementById('ce-time').value) || 20) * 60; updateTimerUI();
                timerInterval = setInterval(() => { timeLeft--; updateTimerUI(); if(timeLeft <= 0) submitExam(); }, 1000);
            });
            function updateTimerUI() { if(timeLeft < 0) return; let h = Math.floor(timeLeft / 3600), m = Math.floor((timeLeft % 3600) / 60), s = timeLeft % 60; document.getElementById('ui-timer').innerText = (h<10?'0':'')+h+':'+(m<10?'0':'')+m+':'+(s<10?'0':'')+s; }
            function buildPalette() { const pal = document.getElementById('ui-palette'); pal.innerHTML = ''; examData.forEach((_, i) => { const btn = document.createElement('div'); btn.className = 'q-palette-btn not-visited'; btn.id = 'pal-' + i; btn.innerText = i + 1; btn.onclick = () => { jumpToQ(i); if(window.innerWidth < 991) document.getElementById('mobile-sidebar').classList.remove('show-mobile'); }; pal.appendChild(btn); }); updatePaletteStats(); }
            function updatePaletteStats() { let ans=0, notAns=0; userState.forEach((st, i) => { const btn = document.getElementById('pal-'+i); btn.className = 'q-palette-btn ' + st.status; if(i === currentQ) btn.classList.add('active-q'); if(st.status === 'answered') ans++; else if(st.status === 'not-answered') notAns++; }); document.getElementById('count-ans').innerText = ans; document.getElementById('count-not-ans').innerText = notAns; }
            function renderQ(idx) { currentQ = idx; const q = examData[idx]; document.getElementById('ui-q-circle').innerText = (idx + 1); document.getElementById('ui-q-cat').innerText = q.qcategory; document.getElementById('ui-q-text').innerText = q.question; const opts = ['A', 'B', 'C', 'D']; const texts = [q.answer1, q.answer2, q.answer3, q.answer4]; document.querySelectorAll('.opt-card').forEach(c => c.classList.remove('selected')); document.querySelectorAll('.exam-radio').forEach(r => r.checked = false); opts.forEach((letter, i) => { document.getElementById('ui-opt-' + letter.toLowerCase()).innerText = texts[i]; if(userState[idx].selected === letter) { document.querySelectorAll('.exam-radio')[i].checked = true; document.getElementById('card-opt-' + letter).classList.add('selected'); } }); updatePaletteStats(); }
            function jumpToQ(idx) { if(userState[currentQ].status === 'not-visited') userState[currentQ].status = 'not-answered'; renderQ(idx); if(userState[idx].status === 'not-visited') userState[idx].status = 'not-answered'; updatePaletteStats(); }
            document.querySelectorAll('.opt-card').forEach(card => { card.addEventListener('click', function() { document.querySelectorAll('.opt-card').forEach(c => c.classList.remove('selected')); this.classList.add('selected'); this.querySelector('input').checked = true; }); });
            function getSelectedOption() { const selected = document.querySelector('.exam-radio:checked'); return selected ? selected.value : null; }
            document.getElementById('btn-save-next').addEventListener('click', () => { const sel = getSelectedOption(); userState[currentQ].selected = sel; userState[currentQ].status = sel ? 'answered' : 'not-answered'; if(currentQ < examData.length - 1) jumpToQ(currentQ + 1); else updatePaletteStats(); });
            document.getElementById('btn-mark-next').addEventListener('click', () => { const sel = getSelectedOption(); userState[currentQ].selected = sel; userState[currentQ].status = sel ? 'marked-answered' : 'marked'; if(currentQ < examData.length - 1) jumpToQ(currentQ + 1); else updatePaletteStats(); });
            document.getElementById('btn-clear').addEventListener('click', () => { document.querySelectorAll('.exam-radio').forEach(r => r.checked = false); document.querySelectorAll('.opt-card').forEach(c => c.classList.remove('selected')); userState[currentQ].selected = null; });
            document.getElementById('btn-submit-exam').addEventListener('click', () => { if(confirm("Submit the exam?")) submitExam(); });
            function submitExam() { clearInterval(timerInterval); document.querySelector('nav.navbar').style.display = 'block'; document.querySelector('footer').style.display = 'block'; document.getElementById('exam-panel').classList.add('d-none'); document.getElementById('exam-panel').classList.remove('position-absolute'); document.getElementById('result-panel').classList.remove('d-none'); let c=0, ic=0, ua=0, solHtml = ''; examData.forEach((q, i) => { const uAns = userState[i].selected, correct = (q.mainanswer||'').replace(/[^A-D]/gi, '').toUpperCase(), isCorrect = uAns === correct; if(!uAns) ua++; else if(isCorrect) c++; else ic++; let bgClass = !uAns ? 'bg-warning bg-opacity-10 border-warning' : (isCorrect ? 'bg-success bg-opacity-10 border-success' : 'bg-danger bg-opacity-10 border-danger'); let statusIco = !uAns ? '⚠️ Unattempted' : (isCorrect ? '✅ Correct' : '❌ Incorrect'); solHtml += \`<div class="card mb-4 p-4 \${bgClass}"><h5 class="fw-bold mb-3">Q\${i+1}. \${q.question}</h5><p class="mb-2 fw-bold \${!uAns ? 'text-warning' : (isCorrect ? 'text-success' : 'text-danger')}">\${statusIco} (Your Answer: \${uAns || 'None'})</p><p class="mb-3 text-dark fw-bold">Right Answer: \${correct}</p><div class="p-3 bg-white border rounded shadow-sm small text-secondary"><strong>Explanation:</strong> \${q.answerdetail || ''}</div></div>\`; }); document.getElementById('res-total').innerText = examData.length; document.getElementById('res-correct').innerText = c; document.getElementById('res-incorrect').innerText = ic; document.getElementById('res-marks').innerText = ((c * pMarks) - (ic * nMarks)).toFixed(2); document.getElementById('solution-list').innerHTML = solHtml; window.scrollTo(0,0); }
        </script>
    `);
}

function getToolsTemplate(pluginHTML = "") {
    const toolsHTML = `
        <div class="row g-4 mt-3 mb-5">
            <div class="col-md-6 d-none" id="tool-card-score">
                <div class="card bg-white shadow-sm border-0 h-100 p-4 rounded-4" id="estimator">
                    <h4 class="fw-bold text-primary mb-3"><i class="bi bi-calculator me-2"></i>Exam Score Estimator</h4>
                    <p class="text-muted small mb-3">Calculate your expected score with negative marking.</p>
                    <div class="mb-2"><label class="form-label small fw-bold">Total Correct</label><input type="number" id="tool-c" class="form-control" value="0"></div>
                    <div class="mb-2"><label class="form-label small fw-bold">Total Incorrect</label><input type="number" id="tool-w" class="form-control" value="0"></div>
                    <div class="mb-3"><label class="form-label small fw-bold">Negative Marking</label><input type="number" id="tool-n" class="form-control" value="0.25" step="0.01"></div>
                    <button class="btn btn-primary w-100 fw-bold" onclick="calcScore()">Calculate Score</button>
                    <div class="mt-3 text-center d-none" id="tool-res-box"><h5 class="fw-bold text-success mb-0">Estimated Score: <span id="tool-score"></span></h5></div>
                    <script>function calcScore(){ document.getElementById('tool-score').innerText = ((parseFloat(document.getElementById('tool-c').value)||0) - ((parseFloat(document.getElementById('tool-w').value)||0) * (parseFloat(document.getElementById('tool-n').value)||0))).toFixed(2); document.getElementById('tool-res-box').classList.remove('d-none'); }</script>
                </div>
            </div>

            <div class="col-md-6 d-none" id="tool-card-pdf">
                <div class="card bg-white shadow-sm border-0 h-100 p-4 rounded-4 text-center d-flex flex-column justify-content-center">
                    <h4 class="fw-bold text-danger mb-3"><i class="bi bi-file-earmark-pdf-fill me-2"></i>PDF Reader</h4>
                    <p class="text-muted small mb-4">Read your study PDFs instantly without uploading to any server. Fast and secure.</p>
                    <a href="/pdf-reader.html" class="btn btn-outline-danger fw-bold rounded-pill w-100 mt-auto">Open PDF Reader</a>
                </div>
            </div>

            ${pluginHTML}
        </div>
    `;

    return getHtmlShell("Study Tools", `
        ${getBreadcrumbs([{name: 'Tools', url: '/tools.html'}])}
        <div class="mb-4 text-center mt-3">
            <h1 class="display-5 blog-title text-dark mb-3"><i class="bi bi-tools text-primary me-2"></i>Advanced Study Tools</h1>
            <p class="lead text-secondary">Free interactive utilities to optimize your competitive exam preparation.</p>
        </div>
        ${toolsHTML}
    `);
}

function getPdfReaderTemplate() {
    return getHtmlShell("Free PDF Reader Tool", `
        ${getBreadcrumbs([{name: 'Tools', url: '/tools.html'}, {name: 'PDF Reader', url: '/pdf-reader.html'}])}
        <div class="card shadow-sm p-4 p-md-5 border-0 rounded-4 bg-white mt-4 text-center">
            <h1 class="blog-title text-dark mb-3"><i class="bi bi-file-earmark-pdf-fill text-danger me-2"></i>Online PDF Reader</h1>
            <p class="text-secondary mb-4">Read your study materials, ebooks, and PDF notes directly in your browser. Files are processed locally on your device for 100% privacy.</p>
            
            <div class="mb-4 p-4 bg-light rounded-4 border border-light shadow-sm">
                <label class="form-label fw-bold mb-3 d-block">Select a PDF File from your device:</label>
                <input type="file" id="pdf-upload" class="form-control form-control-lg w-75 mx-auto" accept="application/pdf">
            </div>
            
            <div id="pdf-viewer-container" class="d-none mt-4 shadow-sm" style="height: 85vh; border: 2px solid #e2e8f0; border-radius: 12px; overflow: hidden; background: #f8fafc;">
                <div class="p-2 bg-dark text-white text-end">
                    <button class="btn btn-sm btn-outline-light" onclick="document.getElementById('pdf-upload').click()"><i class="bi bi-arrow-repeat me-1"></i>Change File</button>
                </div>
                <iframe id="pdf-iframe" style="width: 100%; height: calc(100% - 40px); border: none;"></iframe>
            </div>
        </div>
        <script>
            document.getElementById('pdf-upload').addEventListener('change', function(e) {
                const file = e.target.files[0];
                if(file && file.type === 'application/pdf') {
                    const fileURL = URL.createObjectURL(file);
                    document.getElementById('pdf-iframe').src = fileURL + '#toolbar=0';
                    document.getElementById('pdf-viewer-container').classList.remove('d-none');
                } else {
                    alert('Please select a valid PDF file.');
                }
            });
        </script>
    `);
}

function getBlogsTemplate() {
    return getHtmlShell("Educational Blogs & Guides", `
        ${getBreadcrumbs([{name: 'Blogs', url: '/blogs.html'}])}
        <h2 class="display-6 blog-title mb-4 text-dark mt-3">Latest Educational Guides</h2>
        ${getAdBannerHtml("Sponsored")}
        <div id="blogs-loader" class="text-center py-5"><div class="spinner-border text-primary"></div></div>
        <div class="row g-4 mb-5" id="blogs-container"></div>
        <script>
            document.addEventListener('DOMContentLoaded', async () => {
                const { data } = await supabaseClient.from('blog_posts').select('*').order('created_at', { ascending: false }).limit(50);
                if(data) {
                    let html = '';
                    data.forEach(post => {
                        html += \`<div class="col-md-6"><a href="/blog.html?slug=\${post.slug}" class="card h-100 p-4 shadow-sm text-decoration-none card-hover border border-light bg-white"><span class="badge bg-light text-secondary border mb-3 w-auto align-self-start">\${post.category}</span><h3 class="h5 fw-bold mb-3 text-dark lh-base">\${post.title}</h3><p class="text-muted small mb-0 mt-auto"><i class="bi bi-clock me-1"></i>\${new Date(post.created_at).toLocaleDateString()}</p></a></div>\`;
                    });
                    document.getElementById('blogs-container').innerHTML = html;
                    document.getElementById('blogs-loader').classList.add('d-none');
                }
            });
        </script>
    `);
}

function getSingleBlogTemplate() {
    return getHtmlShell("Read Article", `
        <div id="blog-loader" class="text-center py-5"><div class="spinner-border text-primary"></div></div>
        <div id="blog-content" class="row justify-content-center mt-3 d-none">
            <div class="col-lg-8">
                <div class="mb-4 text-center">
                    <span id="blog-cat" class="badge bg-primary bg-opacity-10 text-primary badge-cat text-decoration-none mb-3 border border-primary-subtle">Category</span>
                    <h1 class="blog-title text-dark display-5 mb-4" id="blog-title">Title</h1>
                    <div class="d-flex justify-content-center align-items-center text-muted small fw-medium"><span><i class="bi bi-calendar3 me-1"></i><span id="blog-date">Date</span></span></div>
                </div>
                ${getAdBannerHtml("Sponsored")}
                <div class="card p-4 p-md-5 mb-5 shadow-sm border-0 bg-white"><article class="article-content" id="blog-body"></article></div>
                
                <!-- DYNAMIC BLOG POST BOTTOM INJECTION CODE -->
                ${BLOG_BOTTOM_CODE ? `<div class="mt-4">${BLOG_BOTTOM_CODE}</div>` : ''}

            </div>
            ${getAdSidebar()}
        </div>
        <script>
            document.addEventListener('DOMContentLoaded', async () => {
                const slug = new URLSearchParams(window.location.search).get('slug');
                const { data } = await supabaseClient.from('blog_posts').select('*').eq('slug', slug).single();
                if(data) {
                    // --- DYNAMIC SEO UPDATES ---
                    document.title = data.title + " | Wedugo";
                    let metaDesc = document.querySelector('meta[name="description"]');
                    let plainText = data.content.replace(/<[^>]*>?/gm, '').replace(/\\s+/g, ' ').trim().substring(0, 150);
                    if(metaDesc) metaDesc.setAttribute("content", plainText + "...");
                    // ---------------------------

                    document.getElementById('blog-title').innerText = data.title;
                    document.getElementById('blog-cat').innerText = data.category;
                    document.getElementById('blog-date').innerText = new Date(data.created_at).toLocaleDateString();
                    document.getElementById('blog-body').innerHTML = data.content;
                    document.getElementById('blog-loader').classList.add('d-none'); document.getElementById('blog-content').classList.remove('d-none');
                }
            });
        </script>
    `);
}

function getMcqTemplate() {
    return getHtmlShell("View MCQ", `
        <div id="mcq-loader" class="text-center py-5"><div class="spinner-border text-primary"></div></div>
        <div id="mcq-content" class="row d-none">
            <div class="col-lg-8">
                ${getAdBannerHtml("Sponsored")}
                <article class="card p-4 p-md-5 mb-4 bg-white shadow-sm border-0 rounded-4">
                    <header class="mb-4 border-bottom pb-4"><a id="mcq-cat-link" href="#" class="badge bg-primary text-decoration-none px-3 py-2 rounded-pill mb-3">Category</a><h1 class="h4 fw-bold text-dark lh-base mt-3" id="mcq-qtext"></h1></header>
                    <div class="d-grid gap-3 mb-4" id="mcq-options"></div>
                    <div id="mcq-exp-box" class="alert mt-4 d-none p-4 rounded-4 border"><h5 class="alert-heading fw-bold mb-3" id="mcq-res-title"></h5><hr class="opacity-25"><h6 class="fw-bold text-dark mb-2"><i class="bi bi-lightbulb-fill text-warning me-2"></i>Detailed Solution:</h6><p class="mb-0 text-dark lh-lg" id="mcq-exp-text"></p></div>
                    <div class="d-flex justify-content-between align-items-center mt-5 pt-4 border-top"><button class="btn btn-outline-secondary fw-bold px-4 rounded-pill" id="btn-prev">Prev</button><button class="btn btn-primary fw-bold px-4 rounded-pill shadow-sm" id="btn-next">Next</button></div>
                </article>
                
                <!-- DYNAMIC MCQ BOTTOM INJECTION CODE -->
                ${MCQ_BOTTOM_CODE ? `<div class="mt-4 mb-5">${MCQ_BOTTOM_CODE}</div>` : ''}
            </div>
            ${getAdSidebar()}
        </div>
        <script>
            let currentQ = null; let hasAnswered = false;
            document.addEventListener('DOMContentLoaded', async () => {
                const id = new URLSearchParams(window.location.search).get('id');
                const { data } = await supabaseClient.from('questions').select('*').eq('id', id).single();
                if(data) {
                    currentQ = data;
                    document.getElementById('mcq-cat-link').innerText = data.qcategory;
                    document.getElementById('mcq-cat-link').href = "/category.html?name=" + encodeURIComponent(data.qcategory);
                    document.getElementById('mcq-qtext').innerText = data.question;
                    
                    // --- DYNAMIC SEO & URL UPDATES ---
                    const cleanQ = data.question.replace(/<[^>]*>?/gm, '').trim();
                    document.title = cleanQ.substring(0, 60) + " | Wedugo";
                    let metaDesc = document.querySelector('meta[name="description"]');
                    if(metaDesc) metaDesc.setAttribute("content", cleanQ.substring(0, 150) + " - Find the correct answer and detailed explanation on Wedugo.");
                    
                    const urlSlug = cleanQ.substring(0, 60).replace(/[^\\w\\u0900-\\u097F]+/g, '-').toLowerCase().replace(/^-+|-+$/g, '');
                    window.history.replaceState(null, '', '/mcq.html?id=' + data.id + '&q=' + urlSlug);
                    // ---------------------------------

                    const opts = { 'A': data.answer1, 'B': data.answer2, 'C': data.answer3, 'D': data.answer4 };
                    let optHtml = ''; for(let k in opts) { optHtml += \`<button class="btn option-btn" onclick="checkAns(this, '\${k}')">\${k}) \${opts[k]}</button>\`; }
                    document.getElementById('mcq-options').innerHTML = optHtml;
                    document.getElementById('btn-prev').onclick = () => window.location.href = "/mcq.html?id=" + (parseInt(id)-1);
                    document.getElementById('btn-next').onclick = () => window.location.href = "/mcq.html?id=" + (parseInt(id)+1);
                    document.getElementById('mcq-loader').classList.add('d-none'); document.getElementById('mcq-content').classList.remove('d-none');
                }
            });
            function checkAns(btn, selected) {
                if(hasAnswered) return; hasAnswered = true;
                const correct = (currentQ.mainanswer||'').replace(/[^A-D]/gi, '').toUpperCase();
                const expBox = document.getElementById('mcq-exp-box');
                document.querySelectorAll('.option-btn').forEach(b => b.disabled = true);
                expBox.classList.remove('d-none');
                if(selected === correct) { btn.classList.add('correct-show'); expBox.classList.add('alert-success', 'border-success'); document.getElementById('mcq-res-title').innerText = "✨ Correct Answer!"; }
                else { btn.classList.add('incorrect-show'); expBox.classList.add('alert-danger', 'border-danger'); document.getElementById('mcq-res-title').innerText = "❌ Incorrect. Right answer is " + correct; }
                document.getElementById('mcq-exp-text').innerText = currentQ.answerdetail || "Practice makes perfect.";
            }
        </script>
    `);
}

function getCategoryTemplate() {
    return getHtmlShell("Category Viewer", `
        <div id="cat-loader" class="text-center py-5"><div class="spinner-border text-primary"></div></div>
        <div id="cat-content" class="d-none">
            <h1 class="display-6 blog-title mb-4 text-dark mt-3" id="cat-title">Category Hub</h1>

            <div class="card shadow-sm border-0 bg-white p-4 rounded-4 mb-5">
                <h3 class="fw-bold mb-3"><i class="bi bi-stopwatch text-primary me-2"></i>Mock Test Sets</h3>
                <p class="text-secondary small mb-3">10 Questions per set.</p>
                <div id="mock-sets-container" class="d-flex flex-wrap gap-2">
                    <span class="text-muted small">Loading sets...</span>
                </div>
            </div>

            ${getAdBannerHtml("Sponsored")}
            <h3 class="fw-bold mb-4 mt-5">Question Bank</h3>
            <div id="mcq-list" class="list-group shadow-sm border-0 rounded-4 mb-4"></div>

            <!-- Load More / Pagination Wrapper -->
            <div class="text-center mb-5" id="pagination-wrapper">
                <button class="btn btn-outline-dark fw-bold rounded-pill px-4 d-none" id="btn-load-more" onclick="loadMoreQuestions()">Load More</button>
                <div id="pagination-controls" class="d-none mt-4"></div>
            </div>
        </div>
        <script>
            let currentOffset = 0; 
            const limit = 10; 
            const catName = new URLSearchParams(window.location.search).get('name');
            let usePagination = true; // DEFAULT ON
            let totalQuestions = 0;

            document.addEventListener('DOMContentLoaded', async () => {
                if(!catName) return;
                document.getElementById('cat-title').innerText = catName + " - Study Hub"; 

                // --- DYNAMIC SEO & URL UPDATES ---
                document.title = catName + " Important MCQs & Mock Tests | Wedugo";
                let metaDesc = document.querySelector('meta[name="description"]');
                if(metaDesc) metaDesc.setAttribute("content", "Practice top " + catName + " objective questions, mock tests, and previous year MCQs online for free.");
                
                const urlSlug = catName.replace(/[^\\w\\u0900-\\u097F]+/g, '-').toLowerCase().replace(/^-+|-+$/g, '');
                window.history.replaceState(null, '', '/category.html?name=' + encodeURIComponent(catName) + '&topic=' + urlSlug);
                // ---------------------------------

                // Fetch Pagination Settings
                const { data: prefData } = await supabaseClient.from('dynamic_components').select('is_active').eq('component_name', 'USE_PAGINATION').maybeSingle();
                if(prefData) usePagination = prefData.is_active;

                if (usePagination) {
                    document.getElementById('btn-load-more').classList.add('d-none');
                    document.getElementById('pagination-controls').classList.remove('d-none');
                } else {
                    document.getElementById('pagination-controls').classList.add('d-none');
                }

                const { count } = await supabaseClient.from('questions').select('*', { count: 'exact', head: true }).eq('qcategory', catName);
                totalQuestions = count || 0;

                const totalSets = Math.ceil(totalQuestions / 10);
                let setsHtml = '';
                for(let i=1; i<=totalSets; i++) {
                    setsHtml += \`<a href="/mock.html?cat=\${encodeURIComponent(catName)}&set=\${i}" class="btn btn-outline-primary fw-bold px-4 rounded-pill m-1">Set \${i}</a>\`;
                }
                document.getElementById('mock-sets-container').innerHTML = setsHtml || '<p class="text-muted mb-0">Not enough questions.</p>';

                await loadQuestionsData();
                document.getElementById('cat-loader').classList.add('d-none'); document.getElementById('cat-content').classList.remove('d-none');
            });

            window.changePage = async function(newPage) {
                currentOffset = (newPage - 1) * limit;
                document.getElementById('mcq-list').innerHTML = '<div class="text-center py-4"><div class="spinner-border text-primary"></div></div>';
                await loadQuestionsData();
                window.scrollTo(0, document.getElementById('mcq-list').offsetTop - 100);
            };

            window.loadMoreQuestions = async function() {
                await loadQuestionsData();
            };

            async function loadQuestionsData() {
                const { data } = await supabaseClient.from('questions').select('id, question').eq('qcategory', catName).range(currentOffset, currentOffset + limit - 1).order('id', {ascending: true});

                if(data && data.length > 0) {
                    let html = ''; 
                    data.forEach((q, i) => { 
                        html += \`<a href="/mcq.html?id=\${q.id}" class="list-group-item list-group-item-action p-4 border-light"><strong>Q\${currentOffset+i+1}.</strong> \${q.question.substring(0, 100)}...</a>\`; 
                    });

                    if (usePagination) {
                        document.getElementById('mcq-list').innerHTML = html;
                        renderPaginationHTML();
                    } else {
                        const tempEl = document.getElementById('mcq-list').innerHTML;
                        document.getElementById('mcq-list').innerHTML = (tempEl.includes('spinner') ? '' : tempEl) + html;
                        currentOffset += limit;
                        document.getElementById('btn-load-more').classList.remove('d-none');
                    }
                } else { 
                    if(!usePagination) document.getElementById('btn-load-more').classList.add('d-none'); 
                }
            }

            function renderPaginationHTML() {
                const totalPages = Math.ceil(totalQuestions / limit);
                const currentPage = Math.floor(currentOffset / limit) + 1;
                let pHTML = \`<nav><ul class="pagination justify-content-center border-0 shadow-sm rounded-pill overflow-hidden">\`;
                pHTML += \`<li class="page-item \${currentPage === 1 ? 'disabled' : ''}"><a class="page-link px-4 py-2 fw-bold text-dark" href="#" onclick="changePage(\${currentPage - 1}); return false;">Previous</a></li>\`;
                pHTML += \`<li class="page-item disabled"><span class="page-link px-4 py-2 text-muted fw-medium">Page \${currentPage} of \${totalPages}</span></li>\`;
                pHTML += \`<li class="page-item \${currentPage === totalPages || totalPages === 0 ? 'disabled' : ''}"><a class="page-link px-4 py-2 fw-bold text-dark" href="#" onclick="changePage(\${currentPage + 1}); return false;">Next</a></li>\`;
                pHTML += \`</ul></nav>\`;
                document.getElementById('pagination-controls').innerHTML = pHTML;
            }
        </script>
    `);
}

function getMockTemplate() {
    return getHtmlShell("Live Mock Test", `
        <div id="mock-loader" class="text-center py-5"><div class="spinner-border text-primary"></div></div>
        <div id="mock-content" class="row d-none">
            <div class="col-lg-8">
                ${getAdBannerHtml("Sponsored")}
                <div class="timer-header p-4 shadow-sm d-flex flex-wrap gap-3 justify-content-between align-items-center mb-5 rounded-4 border"><div><h1 class="h4 fw-bold text-dark mb-1" id="mock-title">Mock Test</h1><p class="text-muted small mb-0" id="mock-subtitle">10 Questions</p></div><div class="text-center ms-auto bg-light px-4 py-2 rounded-3 border"><div class="fs-4 fw-bold font-monospace text-danger" id="timer-display">10:00</div></div></div>
                <div id="score-board" class="card shadow-lg border-success d-none mb-5 text-center p-5 rounded-4 bg-success bg-opacity-10"><h2 class="text-success fw-bold display-6 mb-3">Test Completed!</h2><div class="display-2 fw-bold text-success mb-4" id="final-score">0 / 10</div><a id="btn-back-cat" href="#" class="btn btn-success rounded-pill px-5 fw-bold">Back to Hub</a></div>
                <div id="q-container"></div>
                <div class="text-center mt-5 mb-5" id="submit-container"><button class="btn btn-primary btn-lg px-5 py-3 fw-bold shadow rounded-pill w-100" onclick="submitTest()">Submit Test & View Results</button></div>
            </div>
            ${getAdSidebar()}
        </div>
        <script>
            let mockData = []; let userAnswers = {}; let timeLeft = 600, timerInterval, testSubmitted = false;
            document.addEventListener('DOMContentLoaded', async () => {
                const catName = new URLSearchParams(window.location.search).get('cat');
                const setNum = parseInt(new URLSearchParams(window.location.search).get('set'));

                if(!catName) return;

                let pageTitle = catName + " Mock Test";
                if(setNum) pageTitle += " (Set " + setNum + ")";

                // --- DYNAMIC SEO UPDATES ---
                document.title = pageTitle + " | Wedugo";
                let metaDesc = document.querySelector('meta[name="description"]');
                if(metaDesc) metaDesc.setAttribute("content", "Attempt live " + pageTitle + " with timer and negative marking to evaluate your preparation.");
                // ---------------------------

                document.getElementById('mock-title').innerText = pageTitle; 
                document.getElementById('btn-back-cat').href = "/category.html?name=" + encodeURIComponent(catName);

                let query = supabaseClient.from('questions').select('*').eq('qcategory', catName).order('id', {ascending: true});

                if (setNum) {
                    const offset = (setNum - 1) * 10;
                    query = query.range(offset, offset + 9);
                } else {
                    query = query.limit(50); // Fallback for random
                }

                const { data } = await query;

                if(data && data.length > 0) {
                    if (setNum) {
                        mockData = data; 
                    } else {
                        mockData = data.sort(() => 0.5 - Math.random()).slice(0, 10);
                    }

                    document.getElementById('mock-subtitle').innerText = mockData.length + " Questions";
                    renderQuestions();

                    document.getElementById('mock-loader').classList.add('d-none'); document.getElementById('mock-content').classList.remove('d-none');
                    timerInterval = setInterval(() => { if(testSubmitted) return; timeLeft--; let m = Math.floor(timeLeft / 60), s = timeLeft % 60; document.getElementById('timer-display').innerText = (m<10?'0':'')+m + ':' + (s<10?'0':'')+s; if (timeLeft <= 0) { clearInterval(timerInterval); submitTest(); } }, 1000);
                } else {
                    alert("No questions found for this set.");
                    window.location.href = "/category.html?name=" + encodeURIComponent(catName);
                }
            });
            function renderQuestions() {
                let html = ''; mockData.forEach((q, i) => { html += \`<article class="card p-4 p-md-5 mb-5 bg-white border border-light rounded-4" id="quiz-block-\${q.id}"><div class="mb-4 pb-3 border-bottom"><span class="badge bg-dark rounded-pill px-3 py-2 fs-6">Question \${i+1}</span></div><h3 class="h4 fw-bold text-dark mb-4 lh-base">\${q.question}</h3><div class="d-grid gap-3 mb-4"><button class="btn option-btn" data-letter="A" onclick="selOpt('\${q.id}', 'A', this)">A) \${q.answer1}</button><button class="btn option-btn" data-letter="B" onclick="selOpt('\${q.id}', 'B', this)">B) \${q.answer2}</button><button class="btn option-btn" data-letter="C" onclick="selOpt('\${q.id}', 'C', this)">C) \${q.answer3}</button><button class="btn option-btn" data-letter="D" onclick="selOpt('\${q.id}', 'D', this)">D) \${q.answer4}</button></div><div id="exp-\${q.id}" class="alert mt-4 d-none p-4 border bg-light rounded-4"><h5 class="alert-heading fw-bold fs-5 mb-3" id="res-\${q.id}"></h5><hr class="opacity-25 mb-3"><p class="mb-0 text-dark">\${q.answerdetail || ''}</p></div></article>\`; });
                document.getElementById('q-container').innerHTML = html;
            }
            function selOpt(qId, letter, btn) { if(testSubmitted) return; document.getElementById('quiz-block-' + qId).querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected')); btn.classList.add('selected'); userAnswers[qId] = letter; }
            function submitTest() {
                if(testSubmitted) return; testSubmitted = true; clearInterval(timerInterval); document.getElementById('submit-container').style.display = 'none'; let score = 0;
                mockData.forEach(q => {
                    const correct = (q.mainanswer||'').replace(/[^A-D]/gi, '').toUpperCase(); const user = userAnswers[q.id]; const container = document.getElementById('quiz-block-' + q.id); const exp = document.getElementById('exp-' + q.id); const title = document.getElementById('res-' + q.id);
                    container.querySelectorAll('.option-btn').forEach(btn => { btn.disabled = true; btn.classList.remove('selected'); const bL = btn.getAttribute('data-letter'); if (bL === correct) btn.classList.add('correct-show'); else if (bL === user && user !== correct) btn.classList.add('incorrect-show'); });
                    exp.classList.remove('d-none'); if(user === correct) { score++; exp.classList.add('alert-success', 'border-success'); title.innerText = "Correct!"; } else if(!user) { exp.classList.add('alert-warning', 'border-warning'); title.innerText = "Unanswered. Correct: " + correct; } else { exp.classList.add('alert-danger', 'border-danger'); title.innerText = "Incorrect. Correct: " + correct; }
                });
                document.getElementById('score-board').classList.remove('d-none'); document.getElementById('final-score').innerText = score + " / " + mockData.length; window.scrollTo(0,0);
            }
        </script>
    `);
}

function getStaticPageTemplate(title, contentHtml) {
    return getHtmlShell(title, `
        ${getBreadcrumbs([{name: title, url: '#'}])}
        <div class="card shadow-sm p-4 p-md-5 border-0 rounded-4 bg-white mt-4">
            <h1 class="blog-title text-dark mb-4 display-5">${title}</h1>
            ${contentHtml}
        </div>
    `);
}

function getAdminTemplate(pluginAdminHTML = "") {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Wedugo Admin Portal</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css">
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <link href="https://cdn.quilljs.com/1.3.6/quill.snow.css" rel="stylesheet">
    <script src="https://cdn.quilljs.com/1.3.6/quill.js"></script>
    <style>body { font-family: 'Inter', sans-serif; background: #f1f5f9; } .sidebar { min-height: 100vh; background: #1e293b; color: white; } .sidebar .nav-link { color: #cbd5e1; border-radius: 8px; margin-bottom: 5px; font-weight: 500; } .sidebar .nav-link:hover, .sidebar .nav-link.active { background: #334155; color: white; } .card { border-radius: 12px; border: none; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); } #auth-screen { height: 100vh; display: flex; align-items: center; justify-content: center; background: #0f172a; position: fixed; top:0; left:0; right:0; z-index: 9999; }</style>
</head>
<body>
    <div id="auth-screen">
        <div class="card p-5 shadow-lg" style="width: 100%; max-width: 400px;">
            <div class="text-center mb-4"><img src="/main_images/logo.png" height="50" alt="Logo" class="mb-3"><h3 class="fw-bold">Admin Login</h3></div>
            <div id="admin-alert" class="alert d-none small fw-bold"></div>
            <input type="email" id="admin-email" class="form-control mb-3 py-2 bg-light" placeholder="Admin Email">
            <input type="password" id="admin-pass" class="form-control mb-4 py-2 bg-light" placeholder="Password">
            <button class="btn btn-primary w-100 fw-bold py-2" onclick="adminLogin()">Login to Dashboard</button>
            <a href="/index.html" class="btn btn-link w-100 mt-2 text-decoration-none text-muted">Back to Website</a>
        </div>
    </div>
    <div id="dashboard-screen" class="d-none d-flex">
        <div class="sidebar p-3" style="width: 260px;">
            <h4 class="text-white fw-bold mb-4 mt-2 px-2"><i class="bi bi-shield-lock-fill text-primary me-2"></i>Admin Panel</h4>
            <ul class="nav flex-column gap-1">
                <li class="nav-item"><a href="#" class="nav-link active" onclick="switchTab('dashboard', this)"><i class="bi bi-speedometer2 me-2"></i>Overview</a></li>
                <li class="nav-item"><a href="#" class="nav-link" onclick="switchTab('questions', this)"><i class="bi bi-list-check me-2"></i>Manage Questions</a></li>
                <li class="nav-item"><a href="#" class="nav-link" onclick="switchTab('blogs', this)"><i class="bi bi-journal-richtext me-2"></i>Manage Blogs</a></li>
                <li class="nav-item"><a href="#" class="nav-link" onclick="switchTab('users', this)"><i class="bi bi-people-fill me-2"></i>Manage Users</a></li>
                <li class="nav-item"><a href="#" class="nav-link" onclick="switchTab('ads', this)"><i class="bi bi-code-square me-2"></i>Ads & Snippets</a></li>
                <li class="nav-item"><a href="#" class="nav-link" onclick="switchTab('settings', this)"><i class="bi bi-gear-fill me-2"></i>System Modules</a></li>
            </ul>
            <div class="mt-auto pt-5"><button class="btn btn-outline-danger w-100 fw-bold" onclick="supabaseClient.auth.signOut()"><i class="bi bi-box-arrow-right me-2"></i>Logout</button></div>
        </div>
        <div class="flex-grow-1 p-4 p-md-5 overflow-auto" style="height: 100vh;">
            <div id="tab-dashboard" class="admin-tab">
                <h2 class="fw-bold mb-4">Dashboard Overview</h2>
                <div class="row g-4 mb-4">
                    <div class="col-md-3"><div class="card p-4 bg-primary text-white text-center"><h1 id="stat-mcq">...</h1><p class="mb-0 fw-medium">Total MCQs</p></div></div>
                    <div class="col-md-3"><div class="card p-4 bg-success text-white text-center"><h1 id="stat-blog">...</h1><p class="mb-0 fw-medium">Published Blogs</p></div></div>
                    <div class="col-md-3"><div class="card p-4 bg-warning text-dark text-center"><h1 id="stat-user">...</h1><p class="mb-0 fw-medium">Registered Users</p></div></div>
                </div>
            </div>

            <!-- MANAGE QUESTIONS TAB -->
            <div id="tab-questions" class="admin-tab d-none">
                <div class="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
                    <h2 class="fw-bold mb-0">Manage Questions</h2>
                    <div class="d-flex flex-wrap gap-2 align-items-center">
                        <div class="input-group input-group-sm" style="width: 200px;">
                            <input type="number" id="search-q-id" class="form-control" placeholder="Search by ID...">
                            <button class="btn btn-dark fw-bold" onclick="searchMcqById()"><i class="bi bi-search"></i></button>
                        </div>
                        <button class="btn btn-warning btn-sm fw-bold shadow-sm" onclick="loadGibberishMCQs()"><i class="bi bi-funnel-fill"></i></button>
                        <button class="btn btn-success btn-sm fw-bold shadow-sm" onclick="autoFixAllGibberish()"><i class="bi bi-magic"></i> Auto Fix</button>
                        <button class="btn btn-primary btn-sm fw-bold shadow-sm" onclick="openMcqModal()"><i class="bi bi-plus-lg"></i> Add</button>
                    </div>
                </div>
                <div class="card p-0 overflow-hidden">
                    <table class="table table-hover mb-0 align-middle">
                        <thead class="table-light"><tr><th>ID</th><th>Category</th><th>Question</th><th>Actions</th></tr></thead>
                        <tbody id="mcq-tbody"><tr><td colspan="4" class="text-center py-4">Loading...</td></tr></tbody>
                    </table>
                    <div class="d-flex justify-content-between align-items-center p-3 border-top bg-light">
                        <button class="btn btn-sm btn-outline-secondary fw-bold px-3" onclick="prevMcqPage()"><i class="bi bi-chevron-left me-1"></i>Previous</button>
                        <span class="small fw-bold text-muted" id="mcq-page-indicator">Page 1</span>
                        <button class="btn btn-sm btn-outline-secondary fw-bold px-3" onclick="nextMcqPage()">Next<i class="bi bi-chevron-right ms-1"></i></button>
                    </div>
                </div>
            </div>

            <div id="tab-blogs" class="admin-tab d-none">
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h2 class="fw-bold mb-0">Manage Editorial Blogs</h2>
                    <button class="btn btn-primary fw-bold shadow-sm" onclick="openBlogModal()"><i class="bi bi-pen-fill me-2"></i>Write New Blog</button>
                </div>
                <div class="card p-0 overflow-hidden"><table class="table table-hover mb-0 align-middle"><thead class="table-light"><tr><th>Title</th><th>Category</th><th>Date</th><th>Actions</th></tr></thead><tbody id="blog-tbody"><tr><td colspan="4" class="text-center py-4">Loading...</td></tr></tbody></table></div>
            </div>

            <div id="tab-users" class="admin-tab d-none">
                <h2 class="fw-bold mb-4">User Administration</h2>
                <div class="card p-0 overflow-hidden"><table class="table table-hover mb-0 align-middle"><thead class="table-light"><tr><th>Email/ID</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead><tbody id="users-tbody"><tr><td colspan="4" class="text-center py-4">Loading...</td></tr></tbody></table></div>
            </div>

            <div id="tab-ads" class="admin-tab d-none">
                <h2 class="fw-bold mb-4">Ads & Custom Snippets</h2>
                <div class="alert alert-info small fw-medium">Paste your raw HTML/JS snippets here (e.g., Google Analytics, Disqus, Affiliates). <strong>Note:</strong> Re-run the <code>build.js</code> script on your server after saving to apply changes.</div>
                
                <div class="row g-4 mb-4">
                    <!-- Standard Affiliates/Banners -->
                    <div class="col-md-6">
                        <div class="card shadow-sm border-0 bg-white p-4 h-100">
                            <h5 class="fw-bold mb-3"><i class="bi bi-image me-2 text-primary"></i>Standard Banner (Header/Content)</h5>
                            <textarea id="ad-banner-input" class="form-control font-monospace mb-4 bg-light" rows="4" placeholder="<!-- e.g., 728x90 Banner -->"></textarea>
                            
                            <h5 class="fw-bold mb-3 border-top pt-3"><i class="bi bi-layout-sidebar me-2 text-primary"></i>Sidebar Widget (Square)</h5>
                            <textarea id="ad-sidebar-input" class="form-control font-monospace bg-light" rows="4" placeholder="<!-- e.g., 300x250 Banner -->"></textarea>
                        </div>
                    </div>
                    
                    <!-- Advanced Injection Points -->
                    <div class="col-md-6">
                        <div class="card shadow-sm border-0 bg-white p-4 h-100">
                            <h5 class="fw-bold mb-3"><i class="bi bi-code-slash me-2 text-warning"></i>&lt;head&gt; Injection (Global)</h5>
                            <textarea id="head-code-input" class="form-control font-monospace mb-4 bg-light" rows="3" placeholder="<!-- e.g., gtag, Meta Tags -->"></textarea>
                            
                            <h5 class="fw-bold mb-3 border-top pt-3"><i class="bi bi-body-text me-2 text-warning"></i>&lt;body&gt; Bottom (Global)</h5>
                            <textarea id="body-code-input" class="form-control font-monospace bg-light" rows="3" placeholder="<!-- e.g., Chatbots, deferred scripts -->"></textarea>
                        </div>
                    </div>

                    <!-- Component Injection Points -->
                    <div class="col-md-6">
                        <div class="card shadow-sm border-0 bg-white p-4 h-100">
                            <h5 class="fw-bold mb-3"><i class="bi bi-chat-text me-2 text-success"></i>Below Blog Posts</h5>
                            <p class="small text-muted mb-2">Ideal for Comments (Disqus, FB) or Content Recs.</p>
                            <textarea id="blog-code-input" class="form-control font-monospace bg-light" rows="4" placeholder="<!-- Blog Bottom HTML -->"></textarea>
                        </div>
                    </div>

                    <div class="col-md-6">
                        <div class="card shadow-sm border-0 bg-white p-4 h-100">
                            <h5 class="fw-bold mb-3"><i class="bi bi-ui-checks me-2 text-success"></i>Below MCQ Questions</h5>
                            <p class="small text-muted mb-2">Ideal for Ads, Native Banners, or Discussion Plugins.</p>
                            <textarea id="mcq-code-input" class="form-control font-monospace bg-light" rows="4" placeholder="<!-- MCQ Bottom HTML -->"></textarea>
                        </div>
                    </div>
                </div>

                <div class="text-center">
                    <button class="btn btn-success btn-lg fw-bold px-5 py-3 shadow" onclick="saveAdSettings()"><i class="bi bi-save me-2"></i>Save All Snippets</button>
                </div>
            </div>

            <div id="tab-settings" class="admin-tab d-none">
                <h2 class="fw-bold mb-4">System Settings & Plugins</h2>
                <div class="row g-4 mb-4">
                    <div class="col-md-6">
                        <div class="card p-4 h-100 shadow-sm border-0">
                            <h5 class="fw-bold mb-3 border-bottom pb-2 text-primary"><i class="bi bi-shield-lock me-2"></i>Module Access Control</h5>
                            <div class="form-check form-switch mb-3">
                                <input class="form-check-input" type="checkbox" role="switch" id="toggle-mock-lock" onchange="toggleModuleStatus('LOCK_MOCK_TESTS', this.checked)" style="width:40px;height:20px;">
                                <label class="form-check-label ms-2 fw-medium pt-1" for="toggle-mock-lock">Require Login for Mock Tests</label>
                            </div>
                            <div class="form-check form-switch mb-3">
                                <input class="form-check-input" type="checkbox" role="switch" id="toggle-pagination" onchange="toggleModuleStatus('USE_PAGINATION', this.checked)" style="width:40px;height:20px;">
                                <label class="form-check-label ms-2 fw-medium pt-1" for="toggle-pagination">Use Pagination style for Questions (Default ON)</label>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-md-6">
                        <div class="card p-4 h-100 shadow-sm border-0">
                            <h5 class="fw-bold mb-3 border-bottom pb-2 text-success"><i class="bi bi-tools me-2"></i>Enable / Disable Study Tools</h5>
                            <div class="form-check form-switch mb-3">
                                <input class="form-check-input" type="checkbox" role="switch" id="toggle-pdf-reader" onchange="toggleModuleStatus('TOOL_PDF_READER', this.checked)" style="width:40px;height:20px;">
                                <label class="form-check-label ms-2 fw-medium pt-1" for="toggle-pdf-reader">Enable PDF Reader Tool</label>
                            </div>
                            <div class="form-check form-switch mb-3">
                                <input class="form-check-input" type="checkbox" role="switch" id="toggle-score-est" onchange="toggleModuleStatus('TOOL_SCORE_ESTIMATOR', this.checked)" style="width:40px;height:20px;">
                                <label class="form-check-label ms-2 fw-medium pt-1" for="toggle-score-est">Enable Score Estimator Tool</label>
                            </div>
                            <div class="alert alert-info small mt-3 mb-0"><i class="bi bi-info-circle-fill me-1"></i>Tools toggle in real-time on live site.</div>
                        </div>
                    </div>
                </div>
                ${pluginAdminHTML}
            </div>
        </div>
    </div>

    <!-- Modal for Blogs -->
    <div class="modal fade" id="blogModal" tabindex="-1"><div class="modal-dialog modal-xl modal-dialog-centered"><div class="modal-content border-0 shadow-lg"><div class="modal-header border-0 bg-light"><h5 class="fw-bold mb-0">Write / Edit Blog</h5><button type="button" class="btn-close" data-bs-dismiss="modal"></button></div><div class="modal-body p-4"><input type="hidden" id="b-id"><div class="row g-3 mb-3"><div class="col-md-6"><input type="text" id="b-title" class="form-control" placeholder="Title"></div><div class="col-md-6"><input type="text" id="b-cat" class="form-control" placeholder="Category"></div></div><div id="quill-editor" style="height:300px;background:white;"></div></div><div class="modal-footer border-0"><button class="btn btn-primary px-4 fw-bold" onclick="saveBlog()">Save Article</button></div></div></div></div>

    <!-- Modal for MCQs -->
    <div class="modal fade" id="mcqModal" tabindex="-1"><div class="modal-dialog modal-lg modal-dialog-centered"><div class="modal-content border-0 shadow-lg"><div class="modal-header border-0 bg-light"><h5 class="fw-bold mb-0">Add / Edit Question</h5><button type="button" class="btn-close" data-bs-dismiss="modal"></button></div><div class="modal-body p-4"><input type="hidden" id="q-id"><div class="mb-3"><textarea id="q-text" class="form-control" rows="2" placeholder="Question Text"></textarea></div><div class="row g-3 mb-3"><div class="col-md-6"><input type="text" id="q-optA" class="form-control" placeholder="Option A"></div><div class="col-md-6"><input type="text" id="q-optB" class="form-control" placeholder="Option B"></div><div class="col-md-6"><input type="text" id="q-optC" class="form-control" placeholder="Option C"></div><div class="col-md-6"><input type="text" id="q-optD" class="form-control" placeholder="Option D"></div></div><div class="row g-3"><div class="col-md-6"><input type="text" id="q-ans" class="form-control text-uppercase" placeholder="Correct (A/B/C/D)" maxlength="1"></div><div class="col-md-6"><input type="text" id="q-cat" class="form-control" placeholder="Category"></div><div class="col-12"><textarea id="q-exp" class="form-control" rows="2" placeholder="Explanation"></textarea></div></div></div><div class="modal-footer border-0 justify-content-between"><button type="button" class="btn btn-warning fw-bold" onclick="fixCurrentModalEncoding()"><i class="bi bi-magic me-1"></i> Fix Text Encoding</button><button class="btn btn-primary px-4 fw-bold" onclick="saveMcq()">Save Question</button></div></div></div></div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script>
        const _SU_URL = "${SUPABASE_URL}"; const _SU_KEY = "${SUPABASE_KEY}";
        const supabaseClient = window.supabase.createClient(_SU_URL, _SU_KEY);
        let quill;
        document.addEventListener("DOMContentLoaded", () => {
            quill = new Quill('#quill-editor', { theme: 'snow' }); checkAdminSession();
            supabaseClient.auth.onAuthStateChange((event) => { if(event === 'SIGNED_OUT') window.location.reload(); });
        });

        async function checkAdminSession() {
            const { data: { session }, error } = await supabaseClient.auth.getSession();
            if(session?.user) {
                const adminEmail = "wedugo.com@gmail.com"; 

                if(session.user.email === adminEmail) {
                    document.getElementById('auth-screen').classList.add('d-none'); 
                    document.getElementById('dashboard-screen').classList.remove('d-none');
                    loadDashboardStats(); 
                    loadModuleConfig();
                } else {
                    alert("Access Denied. Admin privileges required."); 
                    await supabaseClient.auth.signOut();
                    window.location.reload();
                }
            } else {
                document.getElementById('auth-screen').classList.remove('d-none');
            }
        }

        async function adminLogin() {
            const email = document.getElementById('admin-email').value, password = document.getElementById('admin-pass').value;
            const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
            if(error) { document.getElementById('admin-alert').className="alert alert-danger small fw-bold"; document.getElementById('admin-alert').innerText = error.message; document.getElementById('admin-alert').classList.remove('d-none'); }
            else checkAdminSession();
        }

        function switchTab(id, el) { 
            document.querySelectorAll('.admin-tab').forEach(t=>t.classList.add('d-none')); 
            document.getElementById('tab-'+id).classList.remove('d-none'); 
            document.querySelectorAll('.sidebar .nav-link').forEach(l=>l.classList.remove('active')); 
            el.classList.add('active'); 
            
            if(id==='questions') { currentMcqOffset = 0; loadMcqs(); }
            if(id==='blogs') loadBlogs(); 
            if(id==='users') loadUsers(); 
            if(id==='ads') loadAds(); 
        }

        async function loadDashboardStats() {
            const { count: c1 } = await supabaseClient.from('questions').select('*', { count: 'exact', head: true });
            const { count: c2 } = await supabaseClient.from('blog_posts').select('*', { count: 'exact', head: true });
            const { count: c3 } = await supabaseClient.from('profiles').select('*', { count: 'exact', head: true });
            document.getElementById('stat-mcq').innerText = c1||0; document.getElementById('stat-blog').innerText = c2||0; document.getElementById('stat-user').innerText = c3||0;
        }

        async function loadModuleConfig() { 
            const { data } = await supabaseClient.from('dynamic_components').select('*'); 
            if(data) {
                const getVal = (key) => {
                    const obj = data.find(s => s.component_name === key);
                    return obj ? obj.is_active : false;
                };
                document.getElementById('toggle-mock-lock').checked = getVal('LOCK_MOCK_TESTS'); 
                
                const pgObj = data.find(s => s.component_name === 'USE_PAGINATION');
                document.getElementById('toggle-pagination').checked = pgObj ? pgObj.is_active : true; 
                
                document.getElementById('toggle-pdf-reader').checked = getVal('TOOL_PDF_READER'); 
                document.getElementById('toggle-score-est').checked = getVal('TOOL_SCORE_ESTIMATOR'); 
            }
        }

        async function toggleModuleStatus(compName, isActive) { 
            await supabaseClient.from('dynamic_components').upsert({ component_name: compName, is_active: isActive }); 
        }

        // --- MANAGE SNIPPETS & ADS LOGIC ---
        async function loadAds() {
            const { data, error } = await supabaseClient.from('site_settings').select('*');
            if (data && !error) {
                const getVal = (key) => {
                    const obj = data.find(s => s.setting_key === key);
                    return obj ? obj.setting_value : '';
                };
                
                document.getElementById('ad-banner-input').value = getVal('affiliate_banner');
                document.getElementById('ad-sidebar-input').value = getVal('affiliate_sidebar');
                document.getElementById('head-code-input').value = getVal('custom_head_code');
                document.getElementById('body-code-input').value = getVal('custom_body_bottom_code');
                document.getElementById('blog-code-input').value = getVal('blog_bottom_code');
                document.getElementById('mcq-code-input').value = getVal('mcq_bottom_code');
            }
        }
        
        async function saveAdSettings() {
            const banner = document.getElementById('ad-banner-input').value;
            const sidebar = document.getElementById('ad-sidebar-input').value;
            const headCode = document.getElementById('head-code-input').value;
            const bodyCode = document.getElementById('body-code-input').value;
            const blogCode = document.getElementById('blog-code-input').value;
            const mcqCode = document.getElementById('mcq-code-input').value;
            
            await supabaseClient.from('site_settings').upsert([
                { setting_key: 'affiliate_banner', setting_value: banner },
                { setting_key: 'affiliate_sidebar', setting_value: sidebar },
                { setting_key: 'custom_head_code', setting_value: headCode },
                { setting_key: 'custom_body_bottom_code', setting_value: bodyCode },
                { setting_key: 'blog_bottom_code', setting_value: blogCode },
                { setting_key: 'mcq_bottom_code', setting_value: mcqCode }
            ]);
            alert("Snippets saved successfully! Please re-run build.js to apply these changes to the static website.");
        }

        // --- MANAGE QUESTIONS LOGIC ---
        let currentMcqOffset = 0;
        const MCQ_LIMIT = 20;

        async function loadMcqs() { 
            const tb = document.getElementById('mcq-tbody'); 
            tb.innerHTML = '<tr><td colspan="4" class="text-center py-4"><div class="spinner-border spinner-border-sm text-primary"></div> Loading...</td></tr>';
            
            const { data, error } = await supabaseClient.from('questions').select('id, qcategory, question')
                .order('id', {ascending: false})
                .range(currentMcqOffset, currentMcqOffset + MCQ_LIMIT - 1); 
            
            if (error || !data) {
                tb.innerHTML = \`<tr><td colspan="4" class="text-center py-4 text-danger fw-bold">Error loading questions.</td></tr>\`;
                return;
            }
            if (data.length === 0) {
                tb.innerHTML = \`<tr><td colspan="4" class="text-center py-4 text-muted">No questions found.</td></tr>\`;
                return;
            }

            tb.innerHTML = data.map(q=>\`<tr><td>#\${q.id}</td><td>\${q.qcategory}</td><td>\${q.question.substring(0,50)}</td><td><button class="btn btn-sm btn-primary shadow-sm me-1" onclick="editMcq('\${q.id}')"><i class="bi bi-pencil"></i></button><button class="btn btn-sm btn-danger shadow-sm" onclick="deleteMcq(\${q.id})"><i class="bi bi-trash"></i></button></td></tr>\`).join(''); 
            
            document.getElementById('mcq-page-indicator').innerText = \`Page \${Math.floor(currentMcqOffset/MCQ_LIMIT) + 1}\`;
        }

        function nextMcqPage() { currentMcqOffset += MCQ_LIMIT; loadMcqs(); }
        function prevMcqPage() { if (currentMcqOffset >= MCQ_LIMIT) { currentMcqOffset -= MCQ_LIMIT; loadMcqs(); } }

        async function searchMcqById() {
            const id = document.getElementById('search-q-id').value;
            if (!id) {
                currentMcqOffset = 0;
                return loadMcqs();
            }
            
            const tb = document.getElementById('mcq-tbody'); 
            tb.innerHTML = '<tr><td colspan="4" class="text-center py-4"><div class="spinner-border spinner-border-sm text-primary"></div> Searching...</td></tr>';
            
            const { data, error } = await supabaseClient.from('questions').select('id, qcategory, question').eq('id', id);
            
            if (error || !data || data.length === 0) {
                tb.innerHTML = \`<tr><td colspan="4" class="text-center py-4 text-danger fw-bold">No question found with ID #\${id}</td></tr>\`;
                return;
            }
            
            tb.innerHTML = data.map(q=>\`<tr><td>#\${q.id}</td><td>\${q.qcategory}</td><td>\${q.question.substring(0,50)}</td><td><button class="btn btn-sm btn-primary shadow-sm me-1" onclick="editMcq('\${q.id}')"><i class="bi bi-pencil"></i></button><button class="btn btn-sm btn-danger shadow-sm" onclick="deleteMcq(\${q.id})"><i class="bi bi-trash"></i></button></td></tr>\`).join('');
            document.getElementById('mcq-page-indicator').innerText = 'Search Result';
        }

        function decodeMojibake(str) {
            if (!str || typeof str !== 'string') return str;
            try { return decodeURIComponent(escape(str)); } 
            catch (e) { return str; }
        }

        function fixCurrentModalEncoding() {
            const fields = ['q-text', 'q-optA', 'q-optB', 'q-optC', 'q-optD', 'q-cat', 'q-exp'];
            fields.forEach(id => {
                const el = document.getElementById(id);
                if (el && el.value) { el.value = decodeMojibake(el.value); }
            });
        }

        async function autoFixAllGibberish() {
            if (!confirm("Are you sure you want to scan and automatically fix all Gibberish/Corrupted questions in the database?")) return;
            
            const tb = document.getElementById('mcq-tbody');
            tb.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-primary fw-bold"><div class="spinner-border spinner-border-sm me-2"></div> Fixing records in Supabase... Please wait.</td></tr>';
            
            const { data, error } = await supabaseClient.from('questions').select('*').limit(3000);
            if (error || !data) return alert("Error fetching questions: " + (error?.message || ''));

            let fixedCount = 0;
            const badRegex = /[à-ÿÃ-Ý]/;

            for (const q of data) {
                const needsFix = badRegex.test(q.question || '') || 
                                 badRegex.test(q.answer1 || '') || 
                                 badRegex.test(q.answer2 || '') || 
                                 badRegex.test(q.answer3 || '') || 
                                 badRegex.test(q.answer4 || '') || 
                                 badRegex.test(q.answerdetail || '') ||
                                 badRegex.test(q.qcategory || '');

                if (needsFix) {
                    const updatedObj = {
                        question: decodeMojibake(q.question),
                        answer1: decodeMojibake(q.answer1),
                        answer2: decodeMojibake(q.answer2),
                        answer3: decodeMojibake(q.answer3),
                        answer4: decodeMojibake(q.answer4),
                        answerdetail: decodeMojibake(q.answerdetail),
                        qcategory: decodeMojibake(q.qcategory)
                    };
                    await supabaseClient.from('questions').update(updatedObj).eq('id', q.id);
                    fixedCount++;
                }
            }

            alert("Successfully fixed " + fixedCount + " corrupted questions!");
            loadMcqs();
        }

        async function loadGibberishMCQs() {
            const tb = document.getElementById('mcq-tbody');
            tb.innerHTML = '<tr><td colspan="4" class="text-center py-4"><div class="spinner-border text-warning"></div> Finding corrupted questions...</td></tr>';
            const { data, error } = await supabaseClient.from('questions').select('id, qcategory, question').order('id',{ascending:false}).limit(1000);
            if(error || !data) return;
            const badChars = ['Ã', 'â', '€', '™', 'Â', 'œ', '”', 'à'];
            const gibberish = data.filter(q => badChars.some(char => q.question.includes(char)));
            
            if(gibberish.length === 0) {
                tb.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-success fw-bold">No gibberish/corrupted questions found!</td></tr>';
                return;
            }
            tb.innerHTML = gibberish.map(q=>\`<tr><td>#\${q.id}</td><td>\${q.qcategory}</td><td class="text-danger fw-medium">\${q.question.substring(0,60)}...</td><td><button class="btn btn-sm btn-primary shadow-sm me-1" onclick="editMcq('\${q.id}')"><i class="bi bi-pencil"></i></button><button class="btn btn-sm btn-danger shadow-sm" onclick="deleteMcq(\${q.id})"><i class="bi bi-trash"></i></button></td></tr>\`).join('');
        }

        function openMcqModal() { 
            document.getElementById('q-id').value = '';
            document.getElementById('q-text').value = '';
            document.getElementById('q-optA').value = '';
            document.getElementById('q-optB').value = '';
            document.getElementById('q-optC').value = '';
            document.getElementById('q-optD').value = '';
            document.getElementById('q-ans').value = '';
            document.getElementById('q-cat').value = '';
            document.getElementById('q-exp').value = '';
            new bootstrap.Modal(document.getElementById('mcqModal')).show(); 
        }

        async function editMcq(id) {
            const { data, error } = await supabaseClient.from('questions').select('*').eq('id', id).single();
            if(data && !error) {
                document.getElementById('q-id').value = data.id;
                document.getElementById('q-text').value = data.question;
                document.getElementById('q-optA').value = data.answer1;
                document.getElementById('q-optB').value = data.answer2;
                document.getElementById('q-optC').value = data.answer3;
                document.getElementById('q-optD').value = data.answer4;
                document.getElementById('q-ans').value = data.mainanswer ? data.mainanswer.replace(/[^A-D]/gi, '').toUpperCase() : '';
                document.getElementById('q-cat').value = data.qcategory;
                document.getElementById('q-exp').value = data.answerdetail || '';
                new bootstrap.Modal(document.getElementById('mcqModal')).show();
            }
        }

        async function saveMcq() {
            const id = document.getElementById('q-id').value;
            const obj = { question: document.getElementById('q-text').value, answer1: document.getElementById('q-optA').value, answer2: document.getElementById('q-optB').value, answer3: document.getElementById('q-optC').value, answer4: document.getElementById('q-optD').value, mainanswer: document.getElementById('q-ans').value.toUpperCase(), qcategory: document.getElementById('q-cat').value, answerdetail: document.getElementById('q-exp').value };
            
            if (id) {
                await supabaseClient.from('questions').update(obj).eq('id', id);
            } else {
                await supabaseClient.from('questions').insert([obj]); 
            }
            
            bootstrap.Modal.getInstance(document.getElementById('mcqModal')).hide(); 
            loadMcqs();
        }
        async function deleteMcq(id) { if(confirm("Delete this question?")) { await supabaseClient.from('questions').delete().eq('id', id); loadMcqs(); } }

        // --- MANAGE BLOG LOGIC ---
        async function loadBlogs() { 
            const tb = document.getElementById('blog-tbody'); 
            const { data, error } = await supabaseClient.from('blog_posts').select('*').order('created_at',{ascending:false}); 
            if(error || !data) { tb.innerHTML = \`<tr><td colspan="4" class="text-center text-danger py-4 fw-bold">Error loading blogs.</td></tr>\`; return; }
            if(data.length === 0) { tb.innerHTML = \`<tr><td colspan="4" class="text-center text-muted py-4">No blogs found.</td></tr>\`; return; }
            tb.innerHTML = data.map(b=>\`<tr><td>\${b.title}</td><td>\${b.category}</td><td>\${new Date(b.created_at).toLocaleDateString()}</td><td><button class="btn btn-sm btn-primary shadow-sm me-1" onclick="editBlog('\${b.id}')"><i class="bi bi-pencil"></i></button><button class="btn btn-sm btn-danger shadow-sm" onclick="deleteBlog('\${b.id}')"><i class="bi bi-trash"></i></button></td></tr>\`).join(''); 
        }
        
        function openBlogModal() { 
            document.getElementById('b-id').value = '';
            document.getElementById('b-title').value = '';
            document.getElementById('b-cat').value = '';
            quill.root.innerHTML = '';
            new bootstrap.Modal(document.getElementById('blogModal')).show(); 
        }

        async function editBlog(id) {
            const { data, error } = await supabaseClient.from('blog_posts').select('*').eq('id', id).single();
            if(data && !error) {
                document.getElementById('b-id').value = data.id;
                document.getElementById('b-title').value = data.title;
                document.getElementById('b-cat').value = data.category;
                quill.root.innerHTML = data.content;
                new bootstrap.Modal(document.getElementById('blogModal')).show();
            }
        }

        async function saveBlog() {
            const id = document.getElementById('b-id').value;
            const t = document.getElementById('b-title').value, c = document.getElementById('b-cat').value, body = quill.root.innerHTML;
            const obj = { title: t, slug: t.toLowerCase().replace(/[^a-z0-9]+/g, '-'), category: c, content: body };
            
            if (id) {
                await supabaseClient.from('blog_posts').update(obj).eq('id', id);
            } else {
                await supabaseClient.from('blog_posts').insert([obj]); 
            }
            
            bootstrap.Modal.getInstance(document.getElementById('blogModal')).hide(); 
            loadBlogs();
        }
        async function deleteBlog(id) { if(confirm("Delete this blog?")) { await supabaseClient.from('blog_posts').delete().eq('id', id); loadBlogs(); } }

        // --- USER MGMT LOGIC ---
        async function loadUsers() { 
            const tb = document.getElementById('users-tbody'); 
            const { data, error } = await supabaseClient.from('profiles').select('*').order('created_at',{ascending:false}); 
            if(error || !data) { tb.innerHTML = \`<tr><td colspan="4" class="text-center text-danger py-4 fw-bold">Error loading users. (Check RLS Policies)</td></tr>\`; return; }
            if(data.length === 0) { tb.innerHTML = \`<tr><td colspan="4" class="text-center text-muted py-4">No users found.</td></tr>\`; return; }
            tb.innerHTML = data.map(u=>\`<tr><td>\${u.id.substring(0,8)}</td><td>\${u.role}</td><td>Active</td><td><button class="btn btn-sm btn-outline-dark" onclick="toggleRole('\${u.id}','\${u.role}')">Toggle</button></td></tr>\`).join(''); 
        }
        async function toggleRole(id, role) { const nr = role==='admin'?'student':'admin'; if(confirm("Change role to "+nr+"?")) { await supabaseClient.from('profiles').update({ role: nr }).eq('id', id); loadUsers(); } }
    </script>
</body>
</html>`;
}

// ==========================================
// FETCH SETTINGS/SNIPPETS FROM DB AT BUILD TIME
// ==========================================
async function fetchSiteSettings() {
    try {
        console.log("-> Fetching Dynamic Settings & Snippets from Supabase...");
        const res = await fetch(`${SUPABASE_URL}/rest/v1/site_settings?select=*`, {
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`
            }
        });
        
        if(res.ok) {
            const data = await res.json();
            if (Array.isArray(data)) {
                const getVal = (key) => {
                    const obj = data.find(s => s.setting_key === key);
                    return obj ? obj.setting_value : '';
                };

                AFFILIATE_SNIPPET_BANNER = getVal('affiliate_banner');
                AFFILIATE_SNIPPET_SIDEBAR = getVal('affiliate_sidebar');
                CUSTOM_HEAD_CODE = getVal('custom_head_code');
                CUSTOM_BODY_BOTTOM_CODE = getVal('custom_body_bottom_code');
                BLOG_BOTTOM_CODE = getVal('blog_bottom_code');
                MCQ_BOTTOM_CODE = getVal('mcq_bottom_code');
            }
            console.log("   -> Success: All Custom Snippets loaded.");
        }
    } catch(e) { 
        console.log("   -> Warning: Could not fetch site settings", e.message); 
    }
}

async function fetchDynamicComponents() {
    try {
        console.log("-> Fetching ON/OFF Module States from Supabase...");
        const res = await fetch(`${SUPABASE_URL}/rest/v1/dynamic_components?select=*`, {
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`
            }
        });
        
        if(res.ok) {
            const data = await res.json();
            if (Array.isArray(data)) {
                const getVal = (name) => {
                    const obj = data.find(s => s.component_name === name);
                    return obj ? obj.is_active : true;
                };

                TOOL_PDF_READER = getVal('TOOL_PDF_READER');
                TOOL_SCORE_ESTIMATOR = getVal('TOOL_SCORE_ESTIMATOR');
            }
            console.log(`   -> Success: PDF Reader Tool is ${TOOL_PDF_READER ? 'ON' : 'OFF'}`);
            console.log(`   -> Success: Score Estimator Tool is ${TOOL_SCORE_ESTIMATOR ? 'ON' : 'OFF'}`);
        }
    } catch(e) { 
        console.log("   -> Warning: Could not fetch dynamic components", e.message); 
    }
}

// ==========================================
// BUILD SCRIPT WITH PLUGIN SCANNER
// ==========================================
async function buildCSRSite() {
    try {
        const rootDir = __dirname;

        // Fetch configs from DB before building pages
        await fetchSiteSettings();
        await fetchDynamicComponents();

        console.log("1. Scanning for Dynamic Plugins (Modules)...");
        let loadedPluginsTools = "";
        let loadedPluginsAdmin = "";
        const modulesDir = path.join(rootDir, 'modules');

        if (fs.existsSync(modulesDir)) {
            const folders = fs.readdirSync(modulesDir, { withFileTypes: true }).filter(dirent => dirent.isDirectory()).map(dirent => dirent.name);
            for (const folder of folders) {
                const configPath = path.join(modulesDir, folder, 'config.json');
                const uiPath = path.join(modulesDir, folder, 'ui.html');
                const adminPath = path.join(modulesDir, folder, 'admin.html');

                if (fs.existsSync(configPath)) {
                    try {
                        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

                        if (fs.existsSync(uiPath) && config.category === 'tools') {
                            const uiCode = fs.readFileSync(uiPath, 'utf8');
                            loadedPluginsTools += `
                            <div class="col-md-6" id="plugin-${config.id}">
                                <div class="card bg-white shadow-sm border-0 h-100 p-4 rounded-4">
                                    <h4 class="fw-bold text-dark mb-3"><i class="bi ${config.icon || 'bi-plug'} text-primary me-2"></i>${config.name}</h4>
                                    <p class="text-muted small mb-3">${config.desc}</p>
                                    ${uiCode}
                                </div>
                            </div>`;
                            console.log(`   -> Plugin Tool Loaded: ${config.name}`);
                        }

                        if (fs.existsSync(adminPath)) {
                            const adminCode = fs.readFileSync(adminPath, 'utf8');
                            loadedPluginsAdmin += `
                            <div class="card p-4 mb-4 border-0 shadow-sm" id="admin-plugin-${config.id}">
                                <h5 class="fw-bold mb-3 border-bottom pb-2"><i class="bi ${config.icon || 'bi-gear'} me-2"></i>${config.name} (Plugin Settings)</h5>
                                ${adminCode}
                            </div>`;
                            console.log(`   -> Plugin Admin Hook Loaded: ${config.name}`);
                        }
                    } catch(e) {
                        console.error(`   -> Error loading plugin ${folder}:`, e.message);
                    }
                }
            }
        }

        console.log("2. Generating Full Client-Side Application Templates in ROOT...");

        await fsAsync.writeFile(path.join(rootDir, 'index.html'), getIndexTemplate(), 'utf8');
        await fsAsync.writeFile(path.join(rootDir, 'categories.html'), getCategoriesTemplate(), 'utf8');
        await fsAsync.writeFile(path.join(rootDir, 'tools.html'), getToolsTemplate(loadedPluginsTools), 'utf8');
        await fsAsync.writeFile(path.join(rootDir, 'blogs.html'), getBlogsTemplate(), 'utf8');
        await fsAsync.writeFile(path.join(rootDir, 'custom-exam.html'), getCustomExamTemplate(), 'utf8');
        await fsAsync.writeFile(path.join(rootDir, 'mcq.html'), getMcqTemplate(), 'utf8');
        await fsAsync.writeFile(path.join(rootDir, 'category.html'), getCategoryTemplate(), 'utf8');
        await fsAsync.writeFile(path.join(rootDir, 'mock.html'), getMockTemplate(), 'utf8');
        await fsAsync.writeFile(path.join(rootDir, 'blog.html'), getSingleBlogTemplate(), 'utf8');
        await fsAsync.writeFile(path.join(rootDir, 'pdf-reader.html'), getPdfReaderTemplate(), 'utf8');

        const aboutContent = `<p class="fs-5 text-secondary lh-lg mb-5">Wedugo Education is an authoritative editorial platform dedicated to providing students with high-quality study materials, in-depth conceptual guides, and robust examination practice tools.</p><div class="row g-5"><div class="col-md-6"><h3 class="h4 fw-bold mb-3 text-dark">Our Editorial Standard</h3><p class="text-secondary lh-lg">Every article and mock test on Wedugo is designed to meet strict educational standards, ensuring you receive factual, up-to-date, and highly relevant content to boost your competitive edge.</p></div><div class="col-md-6"><h3 class="h4 fw-bold mb-3 text-dark">Custom Practice Engine</h3><p class="text-secondary lh-lg">We introduced the Custom Mock Test builder to allow aspirants to simulate exact real-world portal environments, featuring adjustable negative marking, category mixes, and timers.</p></div></div>`;
        await fsAsync.writeFile(path.join(rootDir, 'about.html'), getStaticPageTemplate('About Us', aboutContent), 'utf8');

        const privacyContent = `<p class="text-secondary lh-lg">At Wedugo Education, accessible from wedugo.com, one of our main priorities is the privacy of our visitors. This Privacy Policy document contains types of information that is collected and recorded by Wedugo Education and how we use it.</p>`;
        await fsAsync.writeFile(path.join(rootDir, 'privacy.html'), getStaticPageTemplate('Privacy Policy', privacyContent), 'utf8');

        const termsContent = `<p class="text-secondary lh-lg">These terms and conditions outline the rules and regulations for the use of Wedugo Education's Website.</p>`;
        await fsAsync.writeFile(path.join(rootDir, 'terms.html'), getStaticPageTemplate('Terms & Conditions', termsContent), 'utf8');

        const adminDir = path.join(rootDir, 'admin');
        if (!fs.existsSync(adminDir)) fs.mkdirSync(adminDir, { recursive: true });
        await fsAsync.writeFile(path.join(adminDir, 'index.html'), getAdminTemplate(loadedPluginsAdmin), 'utf8');

        await fsAsync.writeFile(path.join(rootDir, '404.html'), getStaticPageTemplate('404 - Page Not Found', '<p class="lead">Oops! The page you are looking for does not exist.</p><a href="/index.html" class="btn btn-primary fw-bold mt-3 px-4 py-2 rounded-pill">Go back to homepage</a>'), 'utf8');

        console.log("3. Generating SEO Sitemap...");
        let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
        xml += `<url><loc>${SITE_BASE_URL}/</loc><priority>1.0</priority></url>\n`;
        xml += `<url><loc>${SITE_BASE_URL}/categories.html</loc><priority>0.9</priority></url>\n`;
        xml += `<url><loc>${SITE_BASE_URL}/tools.html</loc><priority>0.9</priority></url>\n`;
        xml += `<url><loc>${SITE_BASE_URL}/blogs.html</loc><priority>0.9</priority></url>\n`;
        xml += `<url><loc>${SITE_BASE_URL}/custom-exam.html</loc><priority>0.9</priority></url>\n`;
        if(TOOL_PDF_READER) xml += `<url><loc>${SITE_BASE_URL}/pdf-reader.html</loc><priority>0.8</priority></url>\n`;
        xml += `</urlset>`;

        await fsAsync.writeFile(path.join(rootDir, 'sitemap.xml'), xml, 'utf8');
        await fsAsync.writeFile(path.join(rootDir, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE_BASE_URL}/sitemap.xml\n`, 'utf8');

        console.log("✅ BUILD COMPLETE (Dynamic SEO Titles, Clean URLs, Default Pagination ON, 100% Functions Kept)");
    } catch(e) { console.error("Build failed:", e); }
}

buildCSRSite();
