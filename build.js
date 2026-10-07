const fs = require('fs');
const fsAsync = require('fs').promises;
const path = require('path');

// ==========================================
// CONFIGURATION & GITHUB SECRETS (ENV VARS)
// ==========================================
// CSV Fallbacks (purana logic safe rakhne ke liye)
const QUIZ_SHEET_CSV_URL = process.env.QUIZURL || "";
const BLOG_SHEET_CSV_URL = process.env.BLOGURL || "";

// Supabase Environment Variables (GitHub Secrets mein add karne hain)
const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_KEY = process.env.SUPABASE_KEY || "";

const SITE_BASE_URL = "https://www.wedugo.com"; 
const ADSENSE_CLIENT_ID = "ca-pub-5947676189341600";
const POSTS_PER_PAGE = 10;
const CACHE_BUSTER = Date.now(); 

const CATEGORY_LIST = [
    "Indian Geography","World Organisations","Inventions","Physics","Indian Economy","Days and Years","Technology","Chemistry","Honours and Awards","General Science","General Knowledge","Reasoning","Civil Engineering","Hindi","Sports","Computer","Biology","World Geography","Famous Personalities","Aptitude","Madhya Pradesh GK","Solar System","English","Series","Average","Sets","Percentage","Simple Interest","Surds and Indices","Ratio and Proportion","Time and Work","Trains Time","Age","Area","Profit and Loss","Calendar","Simplification","Indian Polity and Constitution","Indian History","World History","History","Environmental Science and Ecology","Blood Relation","Biochemistry","Fats and Fatty Acid Metabolism","Vitamins","Enzymes","Mineral Metabolism","Hormone Metabolism","Distance and Direction","Nucleic Acids","Water and Electrolyte Balance","History of Microbiology","Microbiology","Bacteria and Gram Staining","Agriculture","Solid Mechanics","Child Development and Pedagogy","Virus","Pharmacology","Anatomy","Psychology","Indian General Knowledge"
];

// PRE-CALCULATED AD BLOCKS
const AD_BANNER_SPONSORED = getAdBannerHtml("Sponsored");
const AD_BANNER_TOP = getAdBannerHtml("Advertisement");
const AD_SIDEBAR_HTML = getAdSidebar();

// ==========================================
// ADVANCED CSV PARSER & SUPABASE FETCHER
// ==========================================
function parseFullCSV(text) {
    if(!text) return [];
    const rows = [];
    let curRow = [], curCell = '', inQuotes = false;
    for (let i = 0; i < text.length; i++) {
        const char = text[i], nextChar = text[i + 1];
        if (char === '"') {
            if (inQuotes && nextChar === '"') { curCell += '"'; i++; } 
            else { inQuotes = !inQuotes; }
        } else if (char === ',' && !inQuotes) {
            curRow.push(curCell.trim()); curCell = '';
        } else if ((char === '\n' || char === '\r') && !inQuotes) {
            if (char === '\r' && nextChar === '\n') i++; 
            curRow.push(curCell.trim());
            if (curRow.join('').length > 0) rows.push(curRow);
            curRow = []; curCell = '';
        } else {
            curCell += char;
        }
    }
    if (curCell || curRow.length > 0) {
        curRow.push(curCell.trim());
        if (curRow.join('').length > 0) rows.push(curRow);
    }
    return rows;
}

// Supabase se 50k+ data paginated form mein lane ka function
async function fetchAllSupabase(table) {
    if(!SUPABASE_URL || !SUPABASE_KEY) return [];
    let allData = [];
    let offset = 0;
    const limit = 1000;
    while(true) {
        try {
            const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*&limit=${limit}&offset=${offset}`, {
                headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
            });
            const data = await res.json();
            if(!data || data.length === 0 || data.error) break;
            allData = allData.concat(data);
            if(data.length < limit) break;
            offset += limit;
        } catch (e) {
            console.error(`Supabase fetch error for ${table}:`, e);
            break;
        }
    }
    return allData;
}

function chunkArray(array, size) {
    const chunked = [];
    for (let i = 0; i < array.length; i += size) chunked.push(array.slice(i, i + size));
    return chunked;
}

function getDifficultyData(questionStr) {
    const len = (questionStr || "").length;
    if (len < 50) return { label: 'Easy', time: '30 sec', color: 'success' };
    if (len > 120) return { label: 'Hard', time: '90 sec', color: 'danger' };
    return { label: 'Medium', time: '60 sec', color: 'warning' };
}

function getRandomItems(arr, count) {
    const shuffled = arr.slice().sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

// ==========================================
// ADVERTISEMENT & UI COMPONENTS
// ==========================================
function getAdBannerHtml(label) {
    return `
        <div class="ad-banner-wrapper my-4 text-center">
            <span class="text-muted d-block small mb-1" style="font-size: 0.70rem; letter-spacing: 0.5px; text-transform: uppercase;">${label}</span>
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
            <div class="sticky-desktop-sidebar">
                <div class="card shadow-sm border-0 rounded-4 bg-white p-3 mb-4 text-center">
                    <span class="text-muted small fw-bold text-uppercase mb-2 d-block" style="font-size: 0.75rem;">Sponsored</span>
                    <div class="ad-container shadow-none border-0 mb-0" style="min-height: 280px; background: #f8fafc;">
                        <ins class="adsbygoogle" style="display:block" data-ad-client="${ADSENSE_CLIENT_ID}" data-ad-slot="0987654321" data-ad-format="auto" data-full-width-responsive="true"></ins>
                        <script>try { (adsbygoogle = window.adsbygoogle || []).push({}); } catch(e) {}</script>
                    </div>
                </div>
                <div class="card shadow-sm border-0 rounded-4 bg-white p-4">
                    <h5 class="fw-bold text-dark mb-3"><i class="bi bi-gear-wide-connected text-primary me-2"></i>Custom Exam</h5>
                    <p class="text-secondary small mb-3 lh-lg">Create your own test environment. Choose categories, set negative marking, and practice like the real exam.</p>
                    <a href="/custom-exam/index.html" class="btn btn-outline-primary btn-sm w-100 rounded-pill fw-bold">Build Custom Test</a>
                </div>
            </div>
        </div>
    `;
}

function getDisqusEmbed(identifierId, prefix) {
    return `
        <div id="disqus_thread"></div>
        <script>
            var disqus_config = function () { this.page.url = '${SITE_BASE_URL}/${prefix}'; this.page.identifier = '${identifierId}'; };
            (function() { var d = document, s = d.createElement('script'); s.src = 'https://wedugo.disqus.com/embed.js'; s.setAttribute('data-timestamp', +new Date()); (d.head || d.body).appendChild(s); })();
        </script>
        <noscript>Please enable JavaScript to view comments.</noscript>
    `;
}

// 🟢 UNIVERSAL NAVBAR WITH AUTH UI
function getNavbar(depth) {
    const prefix = depth === 0 ? '.' : '../'.repeat(depth).slice(0, -1);
    return `
    <nav class="navbar navbar-expand-lg navbar-light bg-white mb-4 shadow-sm py-3 border-bottom sticky-top">
        <div class="container">
            <a class="navbar-brand d-flex align-items-center" href="${prefix}/index.html">
                <img src="${prefix}/main_images/logo.png?v=${CACHE_BUSTER}" alt="Wedugo Logo" height="40" onerror="this.style.display='none'">
            </a>
            <button class="navbar-toggler border-0 shadow-none" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav ms-auto fw-semibold fs-6 gap-2 align-items-lg-center">
                    <li class="nav-item"><a class="nav-link text-dark px-3 rounded-pill hover-bg-light" href="${prefix}/index.html"><i class="bi bi-house-door me-1"></i>Home</a></li>
                    <li class="nav-item"><a class="nav-link text-dark px-3 rounded-pill hover-bg-light" href="${prefix}/categories/index.html"><i class="bi bi-grid me-1"></i>Categories</a></li>
                    <li class="nav-item"><a class="nav-link text-dark px-3 rounded-pill hover-bg-light" href="${prefix}/mock-tests/index.html"><i class="bi bi-stopwatch me-1"></i>Mock Tests</a></li>
                    <li class="nav-item"><a class="nav-link text-primary px-3 rounded-pill bg-primary bg-opacity-10 fw-bold border border-primary-subtle" href="${prefix}/custom-exam/index.html"><i class="bi bi-gear-wide-connected me-1"></i>Custom Exam</a></li>
                    <li class="nav-item"><a class="nav-link text-dark px-3 rounded-pill hover-bg-light" href="${prefix}/tools/index.html"><i class="bi bi-tools me-1"></i>Tools</a></li>
                    <li class="nav-item"><a class="nav-link text-dark px-3 rounded-pill hover-bg-light" href="${prefix}/topic/index.html"><i class="bi bi-journal-text me-1"></i>Blog</a></li>
                    <li class="nav-item ms-lg-2" id="auth-nav-container">
                        <button class="btn btn-outline-dark btn-sm rounded-pill px-4 fw-bold" data-bs-toggle="modal" data-bs-target="#authModal">Login / Join</button>
                    </li>
                </ul>
            </div>
        </div>
    </nav>`;
}

function getFooter(depth) {
    const prefix = depth === 0 ? '.' : '../'.repeat(depth).slice(0, -1);
    return `
    <footer class="bg-white border-top py-5 mt-auto">
        <div class="container">
            <div class="row text-center text-md-start align-items-center">
                <div class="col-md-6 mb-3 mb-md-0">
                    <p class="mb-0 text-muted small fw-medium">© ${new Date().getFullYear()} Wedugo Education. All Rights Reserved.</p>
                </div>
                <div class="col-md-6 text-md-end">
                    <a href="${prefix}/tools/index.html" class="text-secondary text-decoration-none small me-3 hover-text-primary">Study Tools</a>
                    <a href="${prefix}/about/index.html" class="text-secondary text-decoration-none small me-3 hover-text-primary">About Us</a>
                    <a href="${prefix}/privacy.html" class="text-secondary text-decoration-none small me-3 hover-text-primary">Privacy Policy</a>
                    <a href="${prefix}/terms.html" class="text-secondary text-decoration-none small hover-text-primary">Terms of Service</a>
                </div>
            </div>
        </div>
    </footer>`;
}

// 🟢 THIN CONTENT MITIGATION, HTML SHELL & FRONTEND AUTH LOGIC
function getHtmlShell(title, content, depth, seoDescription = "", isThinPage = false) {
    const cleanDesc = (seoDescription || 'In-depth educational articles, study guides, and free custom MCQ mock tests to master your competitive exams at Wedugo Education.').replace(/"/g, '&quot;').substring(0, 160);
    const prefix = depth === 0 ? '.' : '../'.repeat(depth).slice(0, -1);
    const metaRobots = isThinPage ? `<meta name="robots" content="noindex, follow">` : `<meta name="robots" content="index, follow">`;
    const displayTitle = title.includes("Wedugo Education") ? title : `${title} | Wedugo Education`;

    return `<!DOCTYPE html>
<html lang="hi">
<head>
    <meta charset="UTF-8">
    ${metaRobots}
    <!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-G3TY8XCR55"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-G3TY8XCR55');
    </script>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>${displayTitle}</title>
    <meta name="description" content="${cleanDesc}">
    <link rel="icon" href="${prefix}/main_images/icon.png" type="image/png">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Merriweather:wght@400;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    
    <!-- Supabase JS CDN -->
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}" crossorigin="anonymous"></script>
    <script type='text/javascript' src='https://platform-api.sharethis.com/js/sharethis.js#property=5c5059d8c9830d001319b017&product=inline-share-buttons' async='async'></script>
    <style>
        body { background-color: #f8fafc; font-family: 'Inter', sans-serif; color: #334155; display: flex; flex-direction: column; min-height: 100vh; }
        .hover-bg-light:hover { background-color: #f1f5f9; color: #0d6efd !important; }
        .hover-text-primary:hover { color: #0d6efd !important; }
        .card { border: none; border-radius: 16px; box-shadow: 0 4px 15px rgba(0,0,0,0.03); transition: transform 0.3s ease, box-shadow 0.3s ease; }
        .card-hover:hover { transform: translateY(-5px); box-shadow: 0 15px 30px rgba(0,0,0,0.08) !important; }
        
        .blog-title { font-family: 'Inter', sans-serif; font-weight: 800; letter-spacing: -0.5px; line-height: 1.2; }
        .article-content { font-family: 'Merriweather', serif; font-size: 1.15rem; color: #1e293b; line-height: 1.9; }
        .article-content img { max-width: 100%; height: auto; border-radius: 12px; margin: 2rem 0; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
        .badge-cat { font-size: 0.75rem; padding: 0.5em 1em; letter-spacing: 0.5px; border-radius: 6px; text-transform: uppercase; font-weight: 700;}
        
        .option-btn { text-align: left; padding: 16px 24px; font-weight: 500; font-size: 1.05rem; border-radius: 12px; border: 2px solid #e2e8f0; background: #ffffff; transition: all 0.2s; color: #475569; }
        .option-btn:hover:not(:disabled) { background-color: #f8fafc; border-color: #cbd5e1; transform: translateX(5px); }
        .option-btn.selected { background-color: #eff6ff; border-color: #3b82f6; color: #1d4ed8; }
        .option-btn.correct-show { background-color: #f0fdf4 !important; border-color: #22c55e !important; color: #15803d !important; font-weight: 600; }
        .option-btn.incorrect-show { background-color: #fef2f2 !important; border-color: #ef4444 !important; color: #b91c1c !important; }
        .timer-header { position: sticky; top: 70px; z-index: 1020; border-bottom: 4px solid #3b82f6; background: rgba(255,255,255,0.95); backdrop-filter: blur(8px); }

        /* Module Lock Styles */
        .module-locked-overlay { position: absolute; top:0; left:0; right:0; bottom:0; background: rgba(255,255,255,0.8); backdrop-filter: blur(5px); z-index: 1000; display: flex; align-items: center; justify-content: center; border-radius: 16px; }
    </style>
</head>
<body>
    ${getNavbar(depth)}

    <!-- Auth Modal -->
    <div class="modal fade" id="authModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content rounded-4 border-0 shadow-lg p-3">
                <div class="modal-header border-0 pb-0">
                    <h5 class="modal-title fw-bold" id="authModalLabel">Join Wedugo</h5>
                    <button type="button" class="btn-close shadow-none" data-bs-dismiss="modal" aria-label="Close"></button>
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
                    <div class="text-center mt-4">
                        <button class="btn btn-outline-dark w-100 py-2 rounded-pill fw-bold mb-2" onclick="signInWithProvider('google')"><i class="bi bi-google me-2 text-danger"></i>Continue with Google</button>
                        <button class="btn btn-outline-primary w-100 py-2 rounded-pill fw-bold" onclick="signInWithProvider('facebook')"><i class="bi bi-facebook me-2"></i>Continue with Facebook</button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="container flex-grow-1 pb-5 position-relative" id="main-content-area">
        ${content}
    </div>
    
    ${getFooter(depth)}
    
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script>
        // GLOBAL SUPABASE INIT
        const _SU_URL = "${SUPABASE_URL}";
        const _SU_KEY = "${SUPABASE_KEY}";
        let supabaseClient = null;
        let currentUser = null;

        if(_SU_URL && _SU_KEY) {
            supabaseClient = window.supabase.createClient(_SU_URL, _SU_KEY);
        }

        async function initAuth() {
            if(!supabaseClient) return;
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
                        <li><a class="dropdown-item fw-medium py-2" href="${prefix}/admin/index.html"><i class="bi bi-speedometer2 me-2"></i>Dashboard</a></li>
                        <li><hr class="dropdown-divider"></li>
                        <li><a class="dropdown-item fw-bold text-danger py-2" href="#" onclick="supabaseClient.auth.signOut()"><i class="bi bi-box-arrow-right me-2"></i>Logout</a></li>
                    </ul>
                </div>\`;
                const authModal = bootstrap.Modal.getInstance(document.getElementById('authModal'));
                if(authModal) authModal.hide();
            } else {
                navContainer.innerHTML = \`<button class="btn btn-outline-dark btn-sm rounded-pill px-4 fw-bold" data-bs-toggle="dropdown" data-bs-target="#authModal" data-bs-toggle="modal">Login / Join</button>\`;
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

            // Try login first
            let { data, error } = await supabaseClient.auth.signInWithPassword({ email, password: pass });
            
            // If user not found, try register implicitly
            if(error && error.message.includes("Invalid login")) {
                const reg = await supabaseClient.auth.signUp({ email, password: pass });
                data = reg.data; error = reg.error;
                if(!error && data.user && data.user.identities.length === 0) {
                    error = { message: "Account exists but invalid credentials." };
                } else if(!error) {
                    alertBox.className = "alert alert-success small fw-bold mb-3";
                    alertBox.innerText = "Registration successful! Please login.";
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

        async function signInWithProvider(provider) {
            await supabaseClient.auth.signInWithOAuth({ provider: provider });
        }

        // Global Module Locker Logic
        async function checkModuleLock() {
            if(!supabaseClient) return;
            // Get page context from URL
            const isMockTest = window.location.href.includes('/mock-tests/') || window.location.href.includes('/custom-exam/');
            if(!isMockTest) return;

            // Fetch app_config from DB to see if lock is enabled
            const { data } = await supabaseClient.from('dynamic_components').select('*').eq('component_name', 'LOCK_MOCK_TESTS').single();
            if(data && data.is_active && !currentUser) {
                // Apply overlay if locked and not logged in
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
                    area.style.position = 'relative';
                    area.appendChild(overlay);
                }
            } else {
                const overlay = document.getElementById('lock-overlay');
                if(overlay) overlay.remove();
            }
        }

        document.addEventListener("DOMContentLoaded", initAuth);
    </script>
</body>
</html>`;
}

function getBreadcrumbs(depth, category, safeName, currentTitle, type = 'blog') {
    const prefix = depth === 0 ? '.' : '../'.repeat(depth).slice(0, -1);
    let pathList = ``;
    if (type === 'blog') {
        if (category) pathList += `<li class="breadcrumb-item"><a href="${prefix}/topic/${safeName}/index.html" class="text-decoration-none text-primary fw-medium">${category}</a></li>`;
    } else if (type === 'cat') {
        pathList += `<li class="breadcrumb-item"><a href="${prefix}/categories/index.html" class="text-decoration-none text-primary fw-medium">Categories</a></li>`;
    } else if (type === 'mock') {
        pathList += `<li class="breadcrumb-item"><a href="${prefix}/mock-tests/index.html" class="text-decoration-none text-primary fw-medium">Mock Tests</a></li>`;
        if (category) pathList += `<li class="breadcrumb-item"><a href="${prefix}/categories/${safeName}/index.html" class="text-decoration-none text-primary fw-medium">${category}</a></li>`;
    } else if (type === 'mcq') {
        pathList += `<li class="breadcrumb-item"><a href="${prefix}/mcqs/index.html" class="text-decoration-none text-primary fw-medium">MCQs</a></li>`;
        if (category) pathList += `<li class="breadcrumb-item"><a href="${prefix}/categories/${safeName}/index.html" class="text-decoration-none text-primary fw-medium">${category}</a></li>`;
    } else if (type === 'custom') {
        pathList += `<li class="breadcrumb-item"><a href="${prefix}/custom-exam/index.html" class="text-decoration-none text-primary fw-medium">Custom Exam</a></li>`;
    } else if (type === 'tools') {
        pathList += `<li class="breadcrumb-item"><a href="${prefix}/tools/index.html" class="text-decoration-none text-primary fw-medium">Tools</a></li>`;
    }
    return `
        <nav aria-label="breadcrumb" class="mb-4 mt-2">
            <ol class="breadcrumb bg-transparent p-0 mb-0">
                <li class="breadcrumb-item"><a href="${prefix}/index.html" class="text-decoration-none text-primary fw-medium"><i class="bi bi-house-door-fill me-1"></i>Home</a></li>
                ${pathList}
                ${currentTitle ? `<li class="breadcrumb-item active text-truncate fw-medium" aria-current="page" style="max-width: 250px;">${currentTitle}</li>` : ''}
            </ol>
        </nav>
    `;
}

// 🟢 ADMIN PORTAL GENERATOR (HTML/JS String)
function generateAdminPortalHtml() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Wedugo Admin Portal</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css">
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <link href="https://cdn.quilljs.com/1.3.6/quill.snow.css" rel="stylesheet">
    <script src="https://cdn.quilljs.com/1.3.6/quill.js"></script>
    <style>
        body { font-family: 'Inter', sans-serif; background: #f1f5f9; }
        .sidebar { min-height: 100vh; background: #1e293b; color: white; }
        .sidebar .nav-link { color: #cbd5e1; border-radius: 8px; margin-bottom: 5px; font-weight: 500; }
        .sidebar .nav-link:hover, .sidebar .nav-link.active { background: #334155; color: white; }
        .card { border-radius: 12px; border: none; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        #auth-screen { height: 100vh; display: flex; align-items: center; justify-content: center; background: #0f172a; position: fixed; top:0; left:0; right:0; z-index: 9999; }
    </style>
</head>
<body>

    <!-- Admin Login Screen -->
    <div id="auth-screen">
        <div class="card p-5 shadow-lg" style="width: 100%; max-width: 400px;">
            <div class="text-center mb-4">
                <img src="../main_images/logo.png" height="50" alt="Logo" class="mb-3">
                <h3 class="fw-bold">Admin Login</h3>
            </div>
            <div id="admin-alert" class="alert d-none small fw-bold"></div>
            <input type="email" id="admin-email" class="form-control mb-3 py-2 bg-light" placeholder="Admin Email">
            <input type="password" id="admin-pass" class="form-control mb-4 py-2 bg-light" placeholder="Password">
            <button class="btn btn-primary w-100 fw-bold py-2" onclick="adminLogin()">Login to Dashboard</button>
            <a href="../index.html" class="btn btn-link w-100 mt-2 text-decoration-none text-muted">Back to Website</a>
        </div>
    </div>

    <!-- Admin Dashboard UI -->
    <div id="dashboard-screen" class="d-none d-flex">
        <!-- Sidebar -->
        <div class="sidebar p-3" style="width: 260px;">
            <h4 class="text-white fw-bold mb-4 mt-2 px-2"><i class="bi bi-shield-lock-fill text-primary me-2"></i>Admin Panel</h4>
            <ul class="nav flex-column gap-1">
                <li class="nav-item"><a href="#" class="nav-link active" onclick="switchTab('dashboard', this)"><i class="bi bi-speedometer2 me-2"></i>Overview</a></li>
                <li class="nav-item"><a href="#" class="nav-link" onclick="switchTab('questions', this)"><i class="bi bi-list-check me-2"></i>Manage Questions</a></li>
                <li class="nav-item"><a href="#" class="nav-link" onclick="switchTab('blogs', this)"><i class="bi bi-journal-richtext me-2"></i>Manage Blogs</a></li>
                <li class="nav-item"><a href="#" class="nav-link" onclick="switchTab('users', this)"><i class="bi bi-people-fill me-2"></i>Manage Users</a></li>
                <li class="nav-item"><a href="#" class="nav-link" onclick="switchTab('settings', this)"><i class="bi bi-gear-fill me-2"></i>System Modules</a></li>
            </ul>
            <div class="mt-auto pt-5">
                <button class="btn btn-outline-danger w-100 fw-bold" onclick="supabaseClient.auth.signOut()"><i class="bi bi-box-arrow-right me-2"></i>Logout</button>
            </div>
        </div>

        <!-- Main Content Area -->
        <div class="flex-grow-1 p-4 p-md-5 overflow-auto" style="height: 100vh;">
            
            <!-- Tab: Dashboard -->
            <div id="tab-dashboard" class="admin-tab">
                <h2 class="fw-bold mb-4">Dashboard Overview</h2>
                <div class="row g-4">
                    <div class="col-md-3"><div class="card p-4 bg-primary text-white text-center"><h1 id="stat-mcq">...</h1><p class="mb-0 fw-medium">Total MCQs</p></div></div>
                    <div class="col-md-3"><div class="card p-4 bg-success text-white text-center"><h1 id="stat-blog">...</h1><p class="mb-0 fw-medium">Published Blogs</p></div></div>
                    <div class="col-md-3"><div class="card p-4 bg-warning text-dark text-center"><h1 id="stat-user">...</h1><p class="mb-0 fw-medium">Registered Users</p></div></div>
                </div>
                <div class="alert alert-info mt-5 border-0 shadow-sm"><i class="bi bi-info-circle-fill me-2"></i>Any changes made here directly update the Supabase database in real-time. GitHub rebuild is only required if you want static SEO pages to reflect new URLs.</div>
            </div>

            <!-- Tab: Questions -->
            <div id="tab-questions" class="admin-tab d-none">
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h2 class="fw-bold mb-0">Manage Questions</h2>
                    <button class="btn btn-primary fw-bold" onclick="openMcqModal()"><i class="bi bi-plus-lg me-2"></i>Add New Question</button>
                </div>
                <div class="card p-0 overflow-hidden">
                    <table class="table table-hover mb-0 align-middle">
                        <thead class="table-light"><tr><th>ID</th><th>Category</th><th>Question</th><th>Actions</th></tr></thead>
                        <tbody id="mcq-tbody"><tr><td colspan="4" class="text-center py-4">Loading...</td></tr></tbody>
                    </table>
                </div>
            </div>

            <!-- Tab: Blogs (WYSIWYG) -->
            <div id="tab-blogs" class="admin-tab d-none">
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h2 class="fw-bold mb-0">Manage Editorial Blogs</h2>
                    <button class="btn btn-primary fw-bold" onclick="openBlogModal()"><i class="bi bi-pen-fill me-2"></i>Write New Blog</button>
                </div>
                <div class="card p-0 overflow-hidden">
                    <table class="table table-hover mb-0 align-middle">
                        <thead class="table-light"><tr><th>Title</th><th>Category</th><th>Date</th><th>Actions</th></tr></thead>
                        <tbody id="blog-tbody"><tr><td colspan="4" class="text-center py-4">Loading...</td></tr></tbody>
                    </table>
                </div>
            </div>

            <!-- Tab: Users -->
            <div id="tab-users" class="admin-tab d-none">
                <h2 class="fw-bold mb-4">User Administration</h2>
                <div class="card p-0 overflow-hidden">
                    <table class="table table-hover mb-0 align-middle">
                        <thead class="table-light"><tr><th>Email/ID</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
                        <tbody id="users-tbody"><tr><td colspan="4" class="text-center py-4">Loading...</td></tr></tbody>
                    </table>
                </div>
            </div>

            <!-- Tab: Settings (Module Lock) -->
            <div id="tab-settings" class="admin-tab d-none">
                <h2 class="fw-bold mb-4">System Settings & Modules</h2>
                <div class="card p-4">
                    <h5 class="fw-bold mb-3 border-bottom pb-2">Module Access Control</h5>
                    <div class="form-check form-switch mb-3">
                        <input class="form-check-input" type="checkbox" role="switch" id="toggle-mock-lock" onchange="toggleModuleLock(this.checked)" style="width:40px;height:20px;">
                        <label class="form-check-label ms-2 fw-medium pt-1" for="toggle-mock-lock">Require Login for Mock Tests & Custom Exams</label>
                    </div>
                    <p class="text-muted small">If enabled, unregistered users will see a locked screen on exam pages.</p>
                </div>
            </div>

        </div>
    </div>

    <!-- Add/Edit Blog Modal -->
    <div class="modal fade" id="blogModal" tabindex="-1">
        <div class="modal-dialog modal-xl modal-dialog-centered">
            <div class="modal-content border-0 shadow-lg">
                <div class="modal-header border-0 bg-light"><h5 class="fw-bold mb-0" id="blogModalTitle">Write Blog</h5><button type="button" class="btn-close" data-bs-dismiss="modal"></button></div>
                <div class="modal-body p-4">
                    <input type="hidden" id="b-id">
                    <div class="row g-3 mb-3">
                        <div class="col-md-6"><label class="form-label fw-bold small">Title</label><input type="text" id="b-title" class="form-control fw-medium"></div>
                        <div class="col-md-6"><label class="form-label fw-bold small">Category</label><input type="text" id="b-cat" class="form-control fw-medium" placeholder="e.g. History"></div>
                    </div>
                    <label class="form-label fw-bold small">Article Content (WYSIWYG)</label>
                    <div id="quill-editor" style="height: 300px; background: white;"></div>
                </div>
                <div class="modal-footer border-0"><button class="btn btn-primary px-4 fw-bold" onclick="saveBlog()">Save Article</button></div>
            </div>
        </div>
    </div>

    <!-- Add/Edit MCQ Modal -->
    <div class="modal fade" id="mcqModal" tabindex="-1">
        <div class="modal-dialog modal-lg modal-dialog-centered">
            <div class="modal-content border-0 shadow-lg">
                <div class="modal-header border-0 bg-light"><h5 class="fw-bold mb-0" id="mcqModalTitle">Add Question</h5><button type="button" class="btn-close" data-bs-dismiss="modal"></button></div>
                <div class="modal-body p-4">
                    <input type="hidden" id="q-id">
                    <div class="mb-3"><label class="form-label fw-bold small">Question Text</label><textarea id="q-text" class="form-control" rows="2"></textarea></div>
                    <div class="row g-3 mb-3">
                        <div class="col-md-6"><input type="text" id="q-optA" class="form-control" placeholder="Option A"></div>
                        <div class="col-md-6"><input type="text" id="q-optB" class="form-control" placeholder="Option B"></div>
                        <div class="col-md-6"><input type="text" id="q-optC" class="form-control" placeholder="Option C"></div>
                        <div class="col-md-6"><input type="text" id="q-optD" class="form-control" placeholder="Option D"></div>
                    </div>
                    <div class="row g-3">
                        <div class="col-md-6"><label class="form-label fw-bold small">Correct Answer (A/B/C/D)</label><input type="text" id="q-ans" class="form-control text-uppercase" maxlength="1"></div>
                        <div class="col-md-6"><label class="form-label fw-bold small">Category</label><input type="text" id="q-cat" class="form-control"></div>
                        <div class="col-12"><label class="form-label fw-bold small">Explanation</label><textarea id="q-exp" class="form-control" rows="2"></textarea></div>
                    </div>
                </div>
                <div class="modal-footer border-0"><button class="btn btn-primary px-4 fw-bold" onclick="saveMcq()">Save Question</button></div>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script>
        const _SU_URL = "${SUPABASE_URL}";
        const _SU_KEY = "${SUPABASE_KEY}";
        const supabaseClient = window.supabase.createClient(_SU_URL, _SU_KEY);
        
        let quill;
        let adminUser = null;

        document.addEventListener("DOMContentLoaded", () => {
            quill = new Quill('#quill-editor', { theme: 'snow' });
            checkAdminSession();
            
            supabaseClient.auth.onAuthStateChange((event, session) => {
                if (event === 'SIGNED_OUT') window.location.reload();
            });
        });

        async function checkAdminSession() {
            const { data: { session } } = await supabaseClient.auth.getSession();
            if(session && session.user) {
                // Verify Admin role from profiles
                const { data } = await supabaseClient.from('profiles').select('role').eq('id', session.user.id).single();
                if(data && data.role === 'admin') {
                    adminUser = session.user;
                    document.getElementById('auth-screen').classList.add('d-none');
                    document.getElementById('dashboard-screen').classList.remove('d-none');
                    loadDashboardStats();
                    loadModuleConfig();
                } else {
                    alert("Access Denied: You are not an Administrator.");
                    await supabaseClient.auth.signOut();
                }
            }
        }

        async function adminLogin() {
            const email = document.getElementById('admin-email').value;
            const password = document.getElementById('admin-pass').value;
            const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
            if(error) {
                document.getElementById('admin-alert').className = "alert alert-danger small fw-bold";
                document.getElementById('admin-alert').innerText = error.message;
                document.getElementById('admin-alert').classList.remove('d-none');
            } else {
                checkAdminSession();
            }
        }

        function switchTab(tabId, linkElem) {
            document.querySelectorAll('.admin-tab').forEach(t => t.classList.add('d-none'));
            document.getElementById('tab-' + tabId).classList.remove('d-none');
            document.querySelectorAll('.sidebar .nav-link').forEach(l => l.classList.remove('active'));
            linkElem.classList.add('active');

            if(tabId === 'questions') loadMcqs();
            if(tabId === 'blogs') loadBlogs();
            if(tabId === 'users') loadUsers();
        }

        // Stats
        async function loadDashboardStats() {
            const { count: mcqCount } = await supabaseClient.from('questions').select('*', { count: 'exact', head: true });
            const { count: blogCount } = await supabaseClient.from('blog_posts').select('*', { count: 'exact', head: true });
            const { count: userCount } = await supabaseClient.from('profiles').select('*', { count: 'exact', head: true });
            document.getElementById('stat-mcq').innerText = mcqCount || 0;
            document.getElementById('stat-blog').innerText = blogCount || 0;
            document.getElementById('stat-user').innerText = userCount || 0;
        }

        // Settings / Modules
        async function loadModuleConfig() {
            const { data } = await supabaseClient.from('dynamic_components').select('*').eq('component_name', 'LOCK_MOCK_TESTS').single();
            if(data) document.getElementById('toggle-mock-lock').checked = data.is_active;
        }
        async function toggleModuleLock(isActive) {
            const { error } = await supabaseClient.from('dynamic_components').upsert({ component_name: 'LOCK_MOCK_TESTS', is_active: isActive });
            if(error) alert("Failed to update module settings.");
        }

        // MCQs CRUD (Using the exact imported table 'questions')
        async function loadMcqs() {
            const { data, error } = await supabaseClient.from('questions').select('id, qcategory, question').order('id', { ascending: false }).limit(20);
            const tbody = document.getElementById('mcq-tbody');
            if(error || !data) { tbody.innerHTML = "<tr><td colspan='4'>Error loading data</td></tr>"; return; }
            tbody.innerHTML = data.map(q => \`
                <tr>
                    <td class="fw-bold text-muted">#\${q.id}</td>
                    <td><span class="badge bg-light text-dark border">\${q.qcategory}</span></td>
                    <td><div class="text-truncate" style="max-width:300px;">\${q.question}</div></td>
                    <td>
                        <button class="btn btn-sm btn-danger rounded-pill" onclick="deleteMcq(\${q.id})"><i class="bi bi-trash"></i></button>
                    </td>
                </tr>
            \`).join('');
        }
        function openMcqModal() { 
            document.getElementById('q-id').value = '';
            document.getElementById('q-text').value = '';
            ['A','B','C','D'].forEach(l => document.getElementById('q-opt'+l).value = '');
            document.getElementById('q-ans').value = '';
            document.getElementById('q-cat').value = '';
            document.getElementById('q-exp').value = '';
            new bootstrap.Modal(document.getElementById('mcqModal')).show(); 
        }
        async function saveMcq() {
            // Generates a random id for manual entry if none exists (since it's a bigserial in db)
            const obj = {
                question: document.getElementById('q-text').value,
                answer1: document.getElementById('q-optA').value,
                answer2: document.getElementById('q-optB').value,
                answer3: document.getElementById('q-optC').value,
                answer4: document.getElementById('q-optD').value,
                mainanswer: document.getElementById('q-ans').value.toUpperCase(),
                qcategory: document.getElementById('q-cat').value,
                answerdetail: document.getElementById('q-exp').value
            };
            const { error } = await supabaseClient.from('questions').insert([obj]);
            if(error) alert("Error saving: " + error.message);
            else { bootstrap.Modal.getInstance(document.getElementById('mcqModal')).hide(); loadMcqs(); }
        }
        async function deleteMcq(id) {
            if(!confirm("Delete this question forever?")) return;
            await supabaseClient.from('questions').delete().eq('id', id);
            loadMcqs();
        }

        // Blogs CRUD
        async function loadBlogs() {
            const { data } = await supabaseClient.from('blog_posts').select('id, title, category, created_at').order('created_at', { ascending: false });
            const tbody = document.getElementById('blog-tbody');
            if(!data) return;
            tbody.innerHTML = data.map(b => \`
                <tr>
                    <td class="fw-bold">\${b.title}</td>
                    <td><span class="badge bg-primary bg-opacity-10 text-primary border">\${b.category}</span></td>
                    <td class="small text-muted">\${new Date(b.created_at).toLocaleDateString()}</td>
                    <td><button class="btn btn-sm btn-danger rounded-pill" onclick="deleteBlog('\${b.id}')"><i class="bi bi-trash"></i></button></td>
                </tr>
            \`).join('');
        }
        function openBlogModal() {
            document.getElementById('b-id').value = '';
            document.getElementById('b-title').value = '';
            document.getElementById('b-cat').value = '';
            quill.root.innerHTML = '';
            new bootstrap.Modal(document.getElementById('blogModal')).show();
        }
        async function saveBlog() {
            const title = document.getElementById('b-title').value;
            const category = document.getElementById('b-cat').value;
            const content = quill.root.innerHTML;
            const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
            
            const { error } = await supabaseClient.from('blog_posts').insert([{ title, slug, category, content }]);
            if(error) alert("Error saving blog: " + error.message);
            else { bootstrap.Modal.getInstance(document.getElementById('blogModal')).hide(); loadBlogs(); }
        }
        async function deleteBlog(id) {
            if(!confirm("Delete this blog forever?")) return;
            await supabaseClient.from('blog_posts').delete().eq('id', id);
            loadBlogs();
        }

        // Users CRUD
        async function loadUsers() {
            const { data } = await supabaseClient.from('profiles').select('*').order('created_at', { ascending: false });
            const tbody = document.getElementById('users-tbody');
            if(!data) return;
            tbody.innerHTML = data.map(u => \`
                <tr>
                    <td class="small fw-medium">\${u.id.substring(0,8)}...</td>
                    <td>\${u.role === 'admin' ? '<span class="badge bg-danger">Admin</span>' : '<span class="badge bg-secondary">Student</span>'}</td>
                    <td><span class="badge bg-success">Active</span></td>
                    <td>
                        <button class="btn btn-sm btn-outline-dark rounded-pill" onclick="toggleUserRole('\${u.id}', '\${u.role}')">Toggle Role</button>
                    </td>
                </tr>
            \`).join('');
        }
        async function toggleUserRole(id, currentRole) {
            const newRole = currentRole === 'admin' ? 'student' : 'admin';
            if(!confirm("Change user role to " + newRole + "?")) return;
            await supabaseClient.from('profiles').update({ role: newRole }).eq('id', id);
            loadUsers();
        }
    </script>
</body>
</html>`;
}

// 🟢 SITEMAP GENERATOR
async function generateSitemapAndRobots(distDir, quizCategoriesMap, blogPosts, blogCategoriesMap) {
    const today = new Date().toISOString().split('T')[0];
    const urls = [];

    urls.push({ loc: `${SITE_BASE_URL}/`, priority: '1.0', changefreq: 'daily' }); 
    urls.push({ loc: `${SITE_BASE_URL}/categories/index.html`, priority: '0.9', changefreq: 'weekly' });
    urls.push({ loc: `${SITE_BASE_URL}/mock-tests/index.html`, priority: '0.9', changefreq: 'weekly' });
    urls.push({ loc: `${SITE_BASE_URL}/mcqs/index.html`, priority: '0.9', changefreq: 'weekly' });
    urls.push({ loc: `${SITE_BASE_URL}/topic/index.html`, priority: '0.9', changefreq: 'weekly' });
    urls.push({ loc: `${SITE_BASE_URL}/custom-exam/index.html`, priority: '0.9', changefreq: 'weekly' });
    urls.push({ loc: `${SITE_BASE_URL}/tools/index.html`, priority: '0.8', changefreq: 'monthly' });
    urls.push({ loc: `${SITE_BASE_URL}/about/index.html`, priority: '0.5', changefreq: 'monthly' });

    for (const [catName] of Object.entries(blogCategoriesMap)) {
        const safeName = catName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        urls.push({ loc: `${SITE_BASE_URL}/topic/${safeName}/index.html`, priority: '0.8', changefreq: 'weekly' });
    }
    blogPosts.forEach(post => {
        urls.push({ loc: `${SITE_BASE_URL}/post/${post.urlSlug}/index.html`, priority: '0.9', changefreq: 'monthly' });
    });

    const QUESTIONS_PER_PAGE = 10;
    for (const [cat, quizzes] of Object.entries(quizCategoriesMap)) {
        if (!quizzes || quizzes.length === 0) continue;
        const safeName = cat.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        urls.push({ loc: `${SITE_BASE_URL}/categories/${safeName}/index.html`, priority: '0.8', changefreq: 'weekly' });

        const totalSets = Math.ceil(quizzes.length / QUESTIONS_PER_PAGE);
        for (let s = 1; s <= totalSets; s++) {
            urls.push({ loc: `${SITE_BASE_URL}/mock-tests/${safeName}/set-${s}.html`, priority: '0.6', changefreq: 'monthly' });
        }
        for (let p = 1; p <= totalSets; p++) {
            urls.push({ loc: `${SITE_BASE_URL}/mcqs/${safeName}/page-${p}.html`, priority: '0.6', changefreq: 'monthly' });
        }
    }

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
    for (const u of urls) xml += `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>\n`;
    xml += `</urlset>`;

    await fsAsync.writeFile(path.join(distDir, 'sitemap.xml'), xml, 'utf8');
    const robotsTxt = `User-agent: *\nAllow: /\n\n# Unified Fast Indexing Sitemap\nSitemap: ${SITE_BASE_URL}/sitemap.xml\n`;
    await fsAsync.writeFile(path.join(distDir, 'robots.txt'), robotsTxt, 'utf8');
}

// ⚡ HIGH SPEED BATCH EXECUTION
async function executeTasksInBatches(tasks, batchSize = 500) {
    for (let i = 0; i < tasks.length; i += batchSize) {
        const batch = tasks.slice(i, i + batchSize);
        await Promise.all(batch.map(async task => { try { await task(); } catch (err) { console.error("Task error:", err.message); } }));
    }
}

// ==========================================
// MAIN BUILDER
// ==========================================
async function buildUnifiedSite() {
    try {
        const distDir = path.join(__dirname, 'public');
        if (fs.existsSync(distDir)) fs.rmSync(distDir, { recursive: true, force: true });
        fs.mkdirSync(distDir, { recursive: true });
        
        console.log("1. Fetching Data...");
        // Fallback architecture: Try Supabase first, fallback to Google Sheets CSV if failing
        let allQuizRowsData = [];
        let allBlogRowsData = [];

        if(SUPABASE_URL && SUPABASE_KEY) {
            console.log("   -> Pulling data live from Supabase Database...");
            const spQuizzes = await fetchAllSupabase('questions');
            const spBlogs = await fetchAllSupabase('blog_posts');
            
            if(spQuizzes.length > 0) {
                // Map Supabase rows to logic format
                allQuizRowsData = spQuizzes;
            }
            if(spBlogs.length > 0) {
                allBlogRowsData = spBlogs.map(b => ({
                    title: b.title, slug: b.slug, category: b.category, content: b.content, date: new Date(b.created_at).toLocaleDateString()
                }));
            }
        }
        
        // CSV Fallback if Supabase fetch is empty (safeguards old logic)
        if(allQuizRowsData.length === 0 && QUIZ_SHEET_CSV_URL) {
            console.log("   -> Falling back to CSV Quiz Data...");
            const quizRes = await fetch(QUIZ_SHEET_CSV_URL);
            const rawCsv = parseFullCSV(await quizRes.text());
            const headers = rawCsv[0].map(h => h.toLowerCase());
            rawCsv.slice(1).reverse().forEach(v => {
                const q = {}; headers.forEach((h, i) => q[h] = v[i]);
                allQuizRowsData.push(q);
            });
        }

        if(allBlogRowsData.length === 0 && BLOG_SHEET_CSV_URL) {
            console.log("   -> Falling back to CSV Blog Data...");
            const blogRes = await fetch(BLOG_SHEET_CSV_URL);
            const rawCsv = parseFullCSV(await blogRes.text());
            const headers = rawCsv[0].map(h => h.toLowerCase());
            rawCsv.slice(1).reverse().forEach(v => {
                const post = {}; headers.forEach((h, i) => post[h] = v[i]);
                allBlogRowsData.push(post);
            });
        }

        const quizCategoriesMap = {};
        CATEGORY_LIST.forEach(cat => quizCategoriesMap[cat] = []);
        quizCategoriesMap['Uncategorized'] = [];

        const globalQuizDataForEngine = [];
        const allValidQuizzesForRandomizer = [];

        allQuizRowsData.forEach((q, index) => {
            if (!q.question || q.question.includes('à¤')) return;
            let matchedCat = 'Uncategorized';
            const sheetCat = (q.qcategory || '').trim().toLowerCase();
            for (const officialCat of CATEGORY_LIST) {
                if (officialCat.toLowerCase() === sheetCat) { matchedCat = officialCat; break; }
            }
            q.quizId = q.id || index; q.matchedCategory = matchedCat;
            quizCategoriesMap[matchedCat].push(q);
            allValidQuizzesForRandomizer.push(q);

            globalQuizDataForEngine.push({
                c: matchedCat,
                q: q.question,
                o: [q.answer1, q.answer2, q.answer3, q.answer4],
                a: (q.mainanswer||'').toString().replace(/[^A-D]/gi, '').toUpperCase(),
                d: q.answerdetail
            });
        });

        const blogPosts = []; 
        const blogCategoriesMap = {};

        allBlogRowsData.forEach((post, index) => {
            if (!post.title || !post.content) return; 
            post.postId = post.id || index; post.cat = post.category || post.cat || 'General';
            post.urlSlug = (post.slug || post.title || post.postId).toString().trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
            if (!blogCategoriesMap[post.cat]) blogCategoriesMap[post.cat] = [];
            blogCategoriesMap[post.cat].push(post); blogPosts.push(post);
        });

        const masterPageTasks = [];

        // ======================================
        // GENERATE ADMIN PORTAL (/admin/index.html)
        // ======================================
        console.log("-> Generating Admin Backend Portal...");
        const adminDir = path.join(distDir, 'admin');
        fs.mkdirSync(adminDir, { recursive: true });
        masterPageTasks.push(async () => {
            await fsAsync.writeFile(path.join(adminDir, 'index.html'), generateAdminPortalHtml(), 'utf8');
        });

        // ======================================
        // 2. GENERATE CUSTOM EXAM ENGINE
        // ======================================
        console.log("2. Generating Custom Mock Test Engine...");
        const customExamDir = path.join(distDir, 'custom-exam');
        fs.mkdirSync(customExamDir, { recursive: true });
        
        fs.writeFileSync(path.join(customExamDir, 'quiz-data.json'), JSON.stringify(globalQuizDataForEngine));

        masterPageTasks.push(async () => {
            const customExamHTML = `
                ${getBreadcrumbs(1, '', '', 'Custom Mock Test Builder', 'custom')}
                
                <div id="loader-panel" class="text-center py-5">
                    <div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem;"></div>
                    <h3 class="mt-3 text-secondary">Loading Question Database...</h3>
                </div>

                <div id="setup-panel" class="d-none">
                    <div class="card shadow-sm border-0 rounded-4 bg-white p-4 p-md-5 mb-5">
                        <div class="text-center mb-5">
                            <h1 class="blog-title display-5 text-dark mb-3"><i class="bi bi-gear-wide-connected text-primary me-2"></i>Custom Exam Builder</h1>
                            <p class="text-muted fs-5">Configure your own live mock test portal.</p>
                        </div>
                        
                        <div class="row g-4">
                            <div class="col-12">
                                <div class="d-flex flex-wrap justify-content-between align-items-center mb-2 gap-2">
                                    <label class="form-label fw-bold mb-0">1. Select Categories (Multiple allowed)</label>
                                    <div>
                                        <button type="button" class="btn btn-sm btn-primary rounded-pill px-3 me-2 fw-bold" onclick="document.querySelectorAll('.cat-checkbox').forEach(cb => cb.checked = true)"><i class="bi bi-check-all me-1"></i>Select All</button>
                                    </div>
                                </div>
                                <div class="border rounded p-3 bg-light" style="max-height: 250px; overflow-y: auto;">
                                    ${CATEGORY_LIST.map((cat, i) => `
                                        <div class="form-check">
                                            <input class="form-check-input cat-checkbox" type="checkbox" value="${cat}" id="cat${i}" checked>
                                            <label class="form-check-label" for="cat${i}">${cat}</label>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                            
                            <div class="col-md-6 col-lg-3"><label class="form-label fw-bold">2. No. of Questions</label><input type="number" id="ce-qcount" class="form-control form-control-lg fw-bold" value="20" min="5" max="100"></div>
                            <div class="col-md-6 col-lg-3"><label class="form-label fw-bold">3. Time (Mins)</label><input type="number" id="ce-time" class="form-control form-control-lg fw-bold" value="20" min="1" max="180"></div>
                            <div class="col-md-6 col-lg-3"><label class="form-label fw-bold text-success">4. Plus Marking (+)</label><input type="number" id="ce-pos-mark" class="form-control form-control-lg fw-bold text-success" value="1" step="0.5"></div>
                            <div class="col-md-6 col-lg-3"><label class="form-label fw-bold text-danger">5. Negative Marking (-)</label><input type="number" id="ce-neg-mark" class="form-control form-control-lg fw-bold text-danger" value="0.33" step="0.01"></div>
                        </div>

                        <div class="text-center mt-5"><button id="start-exam-btn" class="btn btn-primary btn-lg px-5 py-3 rounded-pill fw-bold shadow"><i class="bi bi-play-circle-fill me-2"></i>Start Custom Test Portal</button></div>
                    </div>
                </div>

                <div id="exam-panel" class="d-none w-100 position-absolute top-0 start-0 bg-white" style="min-height: 100vh; z-index: 2000;">
                    <div class="app-header shadow-sm">
                        <div class="d-flex align-items-center gap-2"><i class="bi bi-pause-circle fs-3" style="cursor:pointer;" onclick="if(confirm('Quit Exam?')) location.reload();"></i><div class="fw-bold fs-5 font-monospace" id="ui-timer">00:00:00</div></div>
                        <div class="fw-bold text-truncate px-2" style="max-width: 50%;">Custom Exam Portal</div>
                        <i class="bi bi-list fs-1 cursor-pointer" onclick="document.getElementById('mobile-sidebar').classList.toggle('show-mobile')"></i>
                    </div>

                    <div class="app-subheader">
                        <div class="q-circle" id="ui-q-circle">1</div>
                        <div class="text-muted fw-medium d-none d-sm-block"><i class="bi bi-stopwatch"></i> <span id="ui-q-time">00:00</span></div>
                        <div class="text-success fw-bold ms-auto ms-sm-0" id="ui-pos-m">+1.0</div>
                        <div class="text-danger fw-bold me-auto me-sm-0" id="ui-neg-m">-0.33</div>
                    </div>
                    
                    <div class="row g-0">
                        <div class="col-lg-8 col-xl-9 mobile-content-area">
                            <div class="p-3 p-md-5 overflow-auto" style="height: calc(100vh - 180px);">
                                <div class="mb-2 text-muted fw-bold small" id="ui-q-cat">Category</div>
                                <h4 class="mb-4 text-dark lh-base fw-bold" style="line-height: 1.6 !important;" id="ui-q-text">Question loading...</h4>
                                <div class="d-flex flex-column gap-2" id="ui-options">
                                    <label class="opt-card" id="card-opt-A"><span class="opt-num">1.</span><input type="radio" name="opt" value="A" class="exam-radio"> <span id="ui-opt-a" class="flex-grow-1"></span></label>
                                    <label class="opt-card" id="card-opt-B"><span class="opt-num">2.</span><input type="radio" name="opt" value="B" class="exam-radio"> <span id="ui-opt-b" class="flex-grow-1"></span></label>
                                    <label class="opt-card" id="card-opt-C"><span class="opt-num">3.</span><input type="radio" name="opt" value="C" class="exam-radio"> <span id="ui-opt-c" class="flex-grow-1"></span></label>
                                    <label class="opt-card" id="card-opt-D"><span class="opt-num">4.</span><input type="radio" name="opt" value="D" class="exam-radio"> <span id="ui-opt-d" class="flex-grow-1"></span></label>
                                </div>
                            </div>
                            <div class="bottom-action-bar flex-wrap align-items-center">
                                <div class="d-flex gap-2 mb-2 mb-sm-0">
                                    <button class="btn btn-outline-secondary px-3 py-2 fw-bold bg-white" id="btn-mark-next" style="font-size: 0.85rem;">Mark & Next</button>
                                    <button class="btn btn-outline-secondary px-3 py-2 fw-bold bg-white" id="btn-clear" style="font-size: 0.85rem;">Clear Response</button>
                                </div>
                                <button class="btn btn-primary px-4 py-2 fw-bold" id="btn-save-next" style="font-size: 0.95rem; width: 140px;">Save & Next</button>
                            </div>
                        </div>

                        <div class="col-lg-4 col-xl-3 exam-sidebar shadow-lg" id="mobile-sidebar">
                            <div class="p-3 border-bottom bg-white small fw-bold">
                                <div class="row g-2 text-center mb-2">
                                    <div class="col-6"><span class="q-palette-btn answered" style="width:25px;height:25px;font-size:12px;" id="count-ans">0</span> Answered</div>
                                    <div class="col-6"><span class="q-palette-btn not-answered" style="width:25px;height:25px;font-size:12px;" id="count-not-ans">0</span> Not Answered</div>
                                </div>
                            </div>
                            <div class="p-3 flex-grow-1 overflow-auto bg-light">
                                <div class="fw-bold mb-3 text-secondary border-bottom pb-2">Questions Palette</div>
                                <div id="ui-palette" class="d-flex flex-wrap"></div>
                            </div>
                            <div class="p-3 bg-white border-top text-center mt-auto"><button class="btn btn-primary w-100 fw-bold py-3 shadow-sm" id="btn-submit-exam">Submit Final Exam</button></div>
                        </div>
                    </div>
                </div>

                <div id="result-panel" class="d-none">
                    <div class="card shadow-lg border-success text-center p-4 p-md-5 rounded-4 bg-success bg-opacity-10 border-2">
                        <h2 class="text-success fw-bold display-6 mb-4"><i class="bi bi-check-circle-fill me-3"></i>Exam Submitted!</h2>
                        <div class="row justify-content-center mb-5 mt-4">
                            <div class="col-md-8">
                                <div class="card border-0 shadow-sm bg-white p-4">
                                    <div class="d-flex justify-content-between mb-2 fs-5"><span>Total Questions:</span> <strong id="res-total">0</strong></div>
                                    <div class="d-flex justify-content-between mb-2 fs-5 text-success"><span>Correct Attempts:</span> <strong id="res-correct">0</strong></div>
                                    <div class="d-flex justify-content-between mb-2 fs-5 text-danger"><span>Incorrect Attempts:</span> <strong id="res-incorrect">0</strong></div>
                                    <hr>
                                    <div class="d-flex justify-content-between fs-3 fw-bold text-primary mt-3"><span>Final Marks:</span> <span id="res-marks">0</span></div>
                                </div>
                            </div>
                        </div>
                        <button class="btn btn-primary btn-lg rounded-pill px-5 fw-bold" onclick="location.reload()">Create New Custom Exam</button>
                    </div>
                    <div class="mt-5" id="solution-container">
                        <h3 class="fw-bold border-bottom pb-3 mb-4">Detailed Solutions</h3>
                        <div id="solution-list"></div>
                    </div>
                </div>

                <script>
                    let allDB = [], examData = [], userState = [], currentQ = 0, pMarks = 1, nMarks = 0.33, timerInterval, timeLeft = 0;
                    
                    fetch('quiz-data.json').then(r=>r.json()).then(data => {
                        allDB = data;
                        document.getElementById('loader-panel').classList.add('d-none');
                        document.getElementById('setup-panel').classList.remove('d-none');
                    }).catch(err => {
                        document.getElementById('loader-panel').innerHTML = "<h3 class='text-danger'>Error loading database. Please refresh.</h3>";
                    });

                    document.getElementById('start-exam-btn').addEventListener('click', () => {
                        const selectedCats = Array.from(document.querySelectorAll('.cat-checkbox:checked')).map(cb => cb.value);
                        if(selectedCats.length === 0) return alert("Select at least one category.");
                        let filteredDB = allDB.filter(q => selectedCats.includes(q.c));
                        if(filteredDB.length === 0) return alert("No questions found.");
                        
                        const reqQCount = parseInt(document.getElementById('ce-qcount').value) || 20;
                        pMarks = parseFloat(document.getElementById('ce-pos-mark').value) || 1;
                        nMarks = parseFloat(document.getElementById('ce-neg-mark').value) || 0.33;
                        
                        filteredDB.sort(() => 0.5 - Math.random());
                        examData = filteredDB.slice(0, Math.min(reqQCount, filteredDB.length));
                        
                        userState = examData.map(() => ({ status: 'not-visited', selected: null }));
                        userState[0].status = 'not-answered';
                        
                        document.getElementById('ui-pos-m').innerText = '+' + pMarks;
                        document.getElementById('ui-neg-m').innerText = '-' + nMarks;
                        document.getElementById('setup-panel').classList.add('d-none');
                        document.getElementById('exam-panel').classList.remove('d-none');
                        
                        document.querySelector('nav.navbar').style.display = 'none';
                        document.querySelector('footer').style.display = 'none';
                        
                        buildPalette(); renderQ(0);
                        
                        timeLeft = (parseInt(document.getElementById('ce-time').value) || 20) * 60;
                        updateTimerUI();
                        timerInterval = setInterval(() => { timeLeft--; updateTimerUI(); if(timeLeft <= 0) submitExam(); }, 1000);
                    });

                    function updateTimerUI() {
                        if(timeLeft < 0) return;
                        let h = Math.floor(timeLeft / 3600), m = Math.floor((timeLeft % 3600) / 60), s = timeLeft % 60;
                        document.getElementById('ui-timer').innerText = (h<10?'0':'')+h+':'+(m<10?'0':'')+m+':'+(s<10?'0':'')+s;
                    }

                    function buildPalette() {
                        const pal = document.getElementById('ui-palette');
                        pal.innerHTML = '';
                        examData.forEach((_, i) => {
                            const btn = document.createElement('div');
                            btn.className = 'q-palette-btn not-visited'; btn.id = 'pal-' + i; btn.innerText = i + 1;
                            btn.onclick = () => { jumpToQ(i); if(window.innerWidth < 991) document.getElementById('mobile-sidebar').classList.remove('show-mobile'); };
                            pal.appendChild(btn);
                        });
                        updatePaletteStats();
                    }

                    function updatePaletteStats() {
                        let ans=0, notAns=0;
                        userState.forEach((st, i) => {
                            const btn = document.getElementById('pal-'+i);
                            btn.className = 'q-palette-btn ' + st.status;
                            if(i === currentQ) btn.classList.add('active-q');
                            if(st.status === 'answered') ans++;
                            else if(st.status === 'not-answered') notAns++;
                        });
                        document.getElementById('count-ans').innerText = ans;
                        document.getElementById('count-not-ans').innerText = notAns;
                    }

                    function renderQ(idx) {
                        currentQ = idx; const q = examData[idx];
                        document.getElementById('ui-q-circle').innerText = (idx + 1);
                        document.getElementById('ui-q-cat').innerText = q.c;
                        document.getElementById('ui-q-text').innerText = q.q;
                        
                        const opts = ['A', 'B', 'C', 'D'], radios = document.querySelectorAll('.exam-radio');
                        document.querySelectorAll('.opt-card').forEach(c => c.classList.remove('selected'));
                        radios.forEach(r => r.checked = false);
                        
                        opts.forEach((letter, i) => {
                            document.getElementById('ui-opt-' + letter.toLowerCase()).innerText = q.o[i];
                            if(userState[idx].selected === letter) { radios[i].checked = true; document.getElementById('card-opt-' + letter).classList.add('selected'); }
                        });
                        updatePaletteStats();
                    }

                    function jumpToQ(idx) {
                        if(userState[currentQ].status === 'not-visited') userState[currentQ].status = 'not-answered';
                        renderQ(idx);
                        if(userState[idx].status === 'not-visited') userState[idx].status = 'not-answered';
                        updatePaletteStats();
                    }

                    document.querySelectorAll('.opt-card').forEach(card => {
                        card.addEventListener('click', function() {
                            document.querySelectorAll('.opt-card').forEach(c => c.classList.remove('selected'));
                            this.classList.add('selected'); this.querySelector('input').checked = true;
                        });
                    });

                    function getSelectedOption() { const selected = document.querySelector('.exam-radio:checked'); return selected ? selected.value : null; }

                    document.getElementById('btn-save-next').addEventListener('click', () => {
                        const sel = getSelectedOption();
                        userState[currentQ].selected = sel; userState[currentQ].status = sel ? 'answered' : 'not-answered';
                        if(currentQ < examData.length - 1) jumpToQ(currentQ + 1); else updatePaletteStats();
                    });

                    document.getElementById('btn-mark-next').addEventListener('click', () => {
                        const sel = getSelectedOption();
                        userState[currentQ].selected = sel; userState[currentQ].status = sel ? 'marked-answered' : 'marked';
                        if(currentQ < examData.length - 1) jumpToQ(currentQ + 1); else updatePaletteStats();
                    });

                    document.getElementById('btn-clear').addEventListener('click', () => {
                        document.querySelectorAll('.exam-radio').forEach(r => r.checked = false);
                        document.querySelectorAll('.opt-card').forEach(c => c.classList.remove('selected'));
                        userState[currentQ].selected = null;
                    });

                    document.getElementById('btn-submit-exam').addEventListener('click', () => { if(confirm("Submit the exam?")) submitExam(); });

                    function submitExam() {
                        clearInterval(timerInterval);
                        document.querySelector('nav.navbar').style.display = 'block'; document.querySelector('footer').style.display = 'block';
                        document.getElementById('exam-panel').classList.add('d-none'); document.getElementById('exam-panel').classList.remove('position-absolute'); 
                        document.getElementById('result-panel').classList.remove('d-none');
                        
                        let c=0, ic=0, ua=0, solHtml = '';

                        examData.forEach((q, i) => {
                            const uAns = userState[i].selected, isCorrect = uAns === q.a;
                            if(!uAns) ua++; else if(isCorrect) c++; else ic++;

                            let bgClass = !uAns ? 'bg-warning bg-opacity-10 border-warning' : (isCorrect ? 'bg-success bg-opacity-10 border-success' : 'bg-danger bg-opacity-10 border-danger');
                            let statusIco = !uAns ? '⚠️ Unattempted' : (isCorrect ? '✅ Correct' : '❌ Incorrect');

                            solHtml += \`
                                <div class="card mb-4 p-4 \${bgClass}">
                                    <h5 class="fw-bold mb-3">Q\${i+1}. \${q.q}</h5>
                                    <p class="mb-2 fw-bold \${!uAns ? 'text-warning' : (isCorrect ? 'text-success' : 'text-danger')}">\${statusIco} (Your Answer: \${uAns || 'None'})</p>
                                    <p class="mb-3 text-dark fw-bold">Right Answer: \${q.a}</p>
                                    <div class="p-3 bg-white border rounded shadow-sm small text-secondary"><strong>Explanation:</strong> \${q.d || 'Refer to standard textbooks for this concept.'}</div>
                                </div>
                            \`;
                        });

                        document.getElementById('res-total').innerText = examData.length;
                        document.getElementById('res-correct').innerText = c;
                        document.getElementById('res-incorrect').innerText = ic;
                        document.getElementById('res-unatt').innerText = ua;
                        document.getElementById('res-marks').innerText = ((c * pMarks) - (ic * nMarks)).toFixed(2);
                        
                        document.getElementById('solution-list').innerHTML = solHtml;
                        window.scrollTo(0,0);
                    }
                </script>
            `;
            await fsAsync.writeFile(path.join(customExamDir, 'index.html'), getHtmlShell('Custom Exam Builder', customExamHTML, 1, "", false));
        });

        // ======================================
        // 3. GENERATE BLOG & INJECT RANDOM QUIZZES
        // ======================================
        console.log("3. Generating Editorial Blog Content...");
        const postMainDir = path.join(distDir, 'post');
        fs.mkdirSync(postMainDir, { recursive: true });

        blogPosts.forEach((post) => {
            const postDir = path.join(postMainDir, post.urlSlug);
            fs.mkdirSync(postDir, { recursive: true });

            const randomQuizBlocks = getRandomQuizBlockHtml(getRandomItems(allValidQuizzesForRandomizer, 3));

            const articleContent = `
                ${getBreadcrumbs(2, post.cat, post.cat.toLowerCase().replace(/[^a-z0-9]+/g, '-'), post.title, 'blog')}
                <div class="row justify-content-center mt-3">
                    <div class="col-lg-8">
                        <div class="mb-4 text-center">
                            <a href="../../topic/${post.cat.toLowerCase().replace(/[^a-z0-9]+/g, '-')}/index.html" class="badge bg-primary bg-opacity-10 text-primary badge-cat text-decoration-none mb-3 border border-primary-subtle">${post.cat}</a>
                            <h1 class="blog-title text-dark display-5 mb-4">${post.title}</h1>
                            <div class="d-flex justify-content-center align-items-center text-muted small fw-medium">
                                <span><i class="bi bi-person-circle me-1"></i>${post.author || 'Wedugo Editorial'}</span>
                                <span class="mx-3">&bull;</span>
                                <span><i class="bi bi-calendar3 me-1"></i>${post.date || 'Recently Updated'}</span>
                            </div>
                        </div>
                        ${AD_BANNER_SPONSORED}
                        <div class="card p-4 p-md-5 mb-5 shadow-sm border-0 bg-white">
                            <article class="article-content">${post.content}</article>
                        </div>
                        
                        <div class="mt-5 mb-5 pt-4 border-top">
                            <h3 class="fw-bold mb-4"><i class="bi bi-lightning-fill text-warning me-2"></i>Quick Revision Quiz</h3>
                            ${randomQuizBlocks}
                        </div>

                        ${AD_BANNER_SPONSORED}
                        <div class="card shadow-sm p-4 bg-light text-center mb-5 border-0 rounded-4">
                            <h3 class="h5 fw-bold text-dark text-uppercase mb-3">Share & Discuss</h3>
                            <div class="sharethis-inline-reaction-buttons mb-4"></div>
                            <div class="text-start border-top pt-4 border-secondary border-opacity-25">
                                ${getDisqusEmbed(`blog_${post.postId}`, `post/${post.urlSlug}/index.html`)}
                            </div>
                        </div>
                    </div>
                    ${AD_SIDEBAR_HTML}
                </div>
            `;
            masterPageTasks.push(async () => { await fsAsync.writeFile(path.join(postDir, 'index.html'), getHtmlShell(post.title, articleContent, 2, post.seo_description || post.title, false)); });
        });

        const blogPageDir = path.join(distDir, 'page');
        fs.mkdirSync(blogPageDir, { recursive: true });
        const totalBlogPages = Math.ceil(blogPosts.length / POSTS_PER_PAGE);

        for (let i = 1; i <= totalBlogPages; i++) {
            const pageDir = path.join(blogPageDir, String(i));
            fs.mkdirSync(pageDir, { recursive: true });
            const startIndex = (i - 1) * POSTS_PER_PAGE;
            const pagePosts = blogPosts.slice(startIndex, startIndex + POSTS_PER_PAGE);

            let pageContent = `
                ${getBreadcrumbs(2, '', '', `Articles - Page ${i}`, 'blog')}
                <h2 class="display-6 blog-title mb-4 text-dark mt-3">Latest Educational Guides</h2>
                <div class="row g-4 mb-5">
            `;
            pagePosts.forEach(post => {
                pageContent += `
                    <div class="col-md-6">
                        <a href="../../post/${post.urlSlug}/index.html" class="card h-100 p-4 shadow-sm text-decoration-none card-hover border border-light bg-white">
                            <span class="badge bg-light text-secondary border mb-3 w-auto align-self-start">${post.cat}</span>
                            <h3 class="h5 fw-bold mb-3 text-dark lh-base">${post.title}</h3>
                            <p class="text-muted small mb-0 mt-auto"><i class="bi bi-clock me-1"></i>${post.date || 'Updated recently'}</p>
                        </a>
                    </div>
                `;
            });
            pageContent += `</div><nav><ul class="pagination justify-content-center pagination-lg">`;
            if (i > 1) pageContent += `<li class="page-item"><a class="page-link" href="../${i - 1}/index.html">Prev</a></li>`;
            for (let p = 1; p <= totalBlogPages; p++) {
                pageContent += `<li class="page-item ${p === i ? 'active' : ''}"><a class="page-link" href="../${p}/index.html">${p}</a></li>`;
            }
            if (i < totalBlogPages) pageContent += `<li class="page-item"><a class="page-link" href="../${i + 1}/index.html">Next</a></li>`;
            pageContent += `</ul></nav>`;

            masterPageTasks.push(async () => { await fsAsync.writeFile(path.join(pageDir, 'index.html'), getHtmlShell(`Study Guides - Page ${i}`, pageContent, 2, "", false)); });
        }

        const blogCatMainDir = path.join(distDir, 'topic');
        fs.mkdirSync(blogCatMainDir, { recursive: true });
        let blogCatGridHtml = '<div class="row g-4">';
        
        for (const [catName, catPosts] of Object.entries(blogCategoriesMap)) {
            const safeName = catName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            const specificCatDir = path.join(blogCatMainDir, safeName);
            fs.mkdirSync(specificCatDir, { recursive: true });

            let catPageHtml = `
                ${getBreadcrumbs(2, '', '', `Topic: ${catName}`, 'blog')}
                <h2 class="blog-title mb-4 display-6 text-dark mt-3">Topic: ${catName}</h2>
                <div class="row g-4 mb-5">
            `;
            catPosts.forEach(post => {
                catPageHtml += `
                    <div class="col-md-6">
                        <a href="../../post/${post.urlSlug}/index.html" class="card h-100 p-4 shadow-sm border border-light text-decoration-none card-hover bg-white">
                            <h5 class="mb-3 fw-bold text-dark lh-base">${post.title}</h5>
                            <small class="text-muted mt-auto"><i class="bi bi-calendar3 me-1"></i>${post.date || ''}</small>
                        </a>
                    </div>`;
            });
            catPageHtml += '</div>';
            masterPageTasks.push(async () => { await fsAsync.writeFile(path.join(specificCatDir, 'index.html'), getHtmlShell(`${catName} Guides`, catPageHtml, 2, "", false)); });

            blogCatGridHtml += `
                <div class="col-md-4 col-sm-6">
                    <a href="./${safeName}/index.html" class="card text-center p-4 h-100 shadow-sm border-0 card-hover text-decoration-none bg-white">
                        <h4 class="fw-bold text-dark mb-2">${catName}</h4>
                        <p class="text-muted small mb-0">${catPosts.length} Editorial Guides</p>
                    </a>
                </div>
            `;
        }
        blogCatGridHtml += '</div>';

        masterPageTasks.push(async () => {
            await fsAsync.writeFile(path.join(blogCatMainDir, 'index.html'), getHtmlShell('Explore Study Topics', `
                ${getBreadcrumbs(1, '', '', 'All Study Topics', 'blog')}
                <h2 class="display-6 blog-title mb-4 text-dark mt-3">Explore Editorial Topics</h2>
                ${blogCatGridHtml}
            `, 1, "", false));
        });

        // ======================================
        // 4. GENERATE CATEGORIES, MOCK TESTS & MCQs
        // ======================================
        console.log("4. Generating Categories, Mock Tests, and Paginated MCQs...");
        
        const catMainDir = path.join(distDir, 'categories');
        const mockTestsDir = path.join(distDir, 'mock-tests');
        const mcqsMainDir = path.join(distDir, 'mcqs');
        
        fs.mkdirSync(catMainDir, { recursive: true });
        fs.mkdirSync(mockTestsDir, { recursive: true });
        fs.mkdirSync(mcqsMainDir, { recursive: true });

        let allCategoriesGridHtml = '<div class="row g-4">';

        for (const [cat, quizzes] of Object.entries(quizCategoriesMap)) {
            if (!quizzes || quizzes.length === 0) continue; 
            const safeName = cat.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            
            const catSubjectDir = path.join(catMainDir, safeName);
            const mockSubjectDir = path.join(mockTestsDir, safeName);
            const mcqSubjectDir = path.join(mcqsMainDir, safeName);
            
            fs.mkdirSync(catSubjectDir, { recursive: true });
            fs.mkdirSync(mockSubjectDir, { recursive: true });
            fs.mkdirSync(mcqSubjectDir, { recursive: true });

            // A) Mock Test Sets
            const sets = chunkArray(quizzes, 10);
            let practiceSetsHtml = '<div class="row g-4 mb-4">';

            sets.forEach((setQuizzes, setIndex) => {
                const setNumber = setIndex + 1;
                const setFileName = `set-${setNumber}.html`;

                masterPageTasks.push(async () => {
                    let setQuestionsHtml = ''; let answersMapScript = [];
                    setQuizzes.forEach((q, qIndex) => {
                        const correctLetter = (q.mainanswer || '').toString().replace(/[^A-D]/gi, '').toUpperCase();
                        answersMapScript.push(`'${q.quizId}': '${correctLetter}'`);
                        setQuestionsHtml += `
                            <article class="card p-4 p-md-5 mb-5 bg-white border border-light rounded-4" id="quiz-block-${q.quizId}">
                                <div class="mb-4 pb-3 border-bottom"><span class="badge bg-dark rounded-pill px-3 py-2 fs-6">Question ${(setIndex * 10) + qIndex + 1}</span></div>
                                <h3 class="h4 fw-bold text-dark mb-4 lh-base">${q.question}</h3>
                                <div class="d-grid gap-3 mb-4">
                                    <button class="btn option-btn" data-letter="A" onclick="selectOption('${q.quizId}', 'A', this)">A) ${q.answer1}</button>
                                    <button class="btn option-btn" data-letter="B" onclick="selectOption('${q.quizId}', 'B', this)">B) ${q.answer2}</button>
                                    <button class="btn option-btn" data-letter="C" onclick="selectOption('${q.quizId}', 'C', this)">C) ${q.answer3}</button>
                                    <button class="btn option-btn" data-letter="D" onclick="selectOption('${q.quizId}', 'D', this)">D) ${q.answer4}</button>
                                </div>
                                <div id="explanation-${q.quizId}" class="alert mt-4 d-none p-4 border bg-light rounded-4">
                                    <h5 class="alert-heading fw-bold fs-5 mb-3" id="result-title-${q.quizId}"></h5>
                                    <hr class="opacity-25 mb-3">
                                    <p class="mb-0 text-dark">${q.answerdetail || 'Consistent practice is key for mastering this concept.'}</p>
                                </div>
                            </article>
                        `;
                    });

                    const setPageContent = `
                        ${getBreadcrumbs(2, cat, safeName, `Mock Test ${setNumber}`, 'mock')}
                        <div class="row mt-3">
                            <div class="col-lg-8">
                                ${AD_BANNER_SPONSORED}
                                <div class="timer-header p-4 shadow-sm d-flex flex-wrap gap-3 justify-content-between align-items-center mb-5 rounded-4 border">
                                    <div><h1 class="h4 fw-bold text-dark mb-1">${cat} - Mock Test ${setNumber}</h1><p class="text-muted small mb-0">10 Questions</p></div>
                                    <div class="text-center ms-auto bg-light px-4 py-2 rounded-3 border"><div class="fs-4 fw-bold font-monospace text-danger" id="timer-display">10:00</div></div>
                                </div>
                                <div id="score-board" class="card shadow-lg border-success d-none mb-5 text-center p-5 rounded-4 bg-success bg-opacity-10">
                                    <h2 class="text-success fw-bold display-6 mb-3">Test Completed!</h2>
                                    <div class="display-2 fw-bold text-success mb-4" id="final-score">0 / 10</div>
                                    <a href="../../categories/${safeName}/index.html" class="btn btn-success rounded-pill px-5 fw-bold">Back to ${cat} Hub</a>
                                </div>
                                <div class="practice-set-container">${setQuestionsHtml}</div>
                                <div class="text-center mt-5 mb-5" id="submit-container">
                                    <button class="btn btn-primary btn-lg px-5 py-3 fw-bold shadow rounded-pill w-100" onclick="submitTest()">Submit Test & View Results</button>
                                </div>
                            </div>
                            ${AD_SIDEBAR_HTML}
                        </div>
                        <script>
                            const correctAnswers = { ${answersMapScript.join(', ')} };
                            const userAnswers = {};
                            let timeLeft = 600, timerInterval, testSubmitted = false;
                            function startTimer() {
                                timerInterval = setInterval(() => {
                                    if(testSubmitted) return;
                                    timeLeft--;
                                    let m = Math.floor(timeLeft / 60), s = timeLeft % 60;
                                    document.getElementById('timer-display').innerText = (m<10?'0':'')+m + ':' + (s<10?'0':'')+s;
                                    if (timeLeft <= 0) { clearInterval(timerInterval); submitTest(); }
                                }, 1000);
                            }
                            function selectOption(quizId, letter, btn) {
                                if(testSubmitted) return;
                                const container = document.getElementById('quiz-block-' + quizId);
                                container.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
                                btn.classList.add('selected'); userAnswers[quizId] = letter;
                            }
                            function submitTest() {
                                if(testSubmitted) return;
                                testSubmitted = true; clearInterval(timerInterval);
                                document.getElementById('submit-container').style.display = 'none';
                                let score = 0, total = Object.keys(correctAnswers).length;
                                for (let quizId in correctAnswers) {
                                    const correct = correctAnswers[quizId], user = userAnswers[quizId];
                                    const container = document.getElementById('quiz-block-' + quizId);
                                    const explanation = document.getElementById('explanation-' + quizId);
                                    const title = document.getElementById('result-title-' + quizId);
                                    container.querySelectorAll('.option-btn').forEach(btn => {
                                        btn.disabled = true; btn.classList.remove('selected');
                                        const btnLetter = btn.getAttribute('data-letter');
                                        if (btnLetter === correct) btn.classList.add('correct-show');
                                        else if (btnLetter === user && user !== correct) btn.classList.add('incorrect-show');
                                    });
                                    explanation.classList.remove('d-none');
                                    if (user === correct) { score++; explanation.classList.add('alert-success', 'border-success'); title.innerText = "Correct!"; }
                                    else if (!user) { explanation.classList.add('alert-warning', 'border-warning'); title.innerText = "Unanswered. Correct: " + correct; }
                                    else { explanation.classList.add('alert-danger', 'border-danger'); title.innerText = "Incorrect. Correct: " + correct; }
                                }
                                document.getElementById('score-board').classList.remove('d-none');
                                document.getElementById('final-score').innerText = score + " / " + total;
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }
                            window.onload = startTimer;
                        </script>
                    `;
                    await fsAsync.writeFile(path.join(mockSubjectDir, setFileName), getHtmlShell(`${cat} Mock Test Set ${setNumber}`, setPageContent, 2, "", false));
                });

                practiceSetsHtml += `
                    <div class="col-sm-6 col-lg-4">
                        <a href="../../mock-tests/${safeName}/${setFileName}" class="card shadow-sm text-decoration-none card-hover h-100 p-4 border border-light rounded-4 bg-white d-block">
                            <h5 class="fw-bold text-dark mb-0"><i class="bi bi-stopwatch text-danger me-2"></i>Mock Set ${setNumber}</h5>
                            <p class="text-muted small mt-2 mb-0">10 Questions &bull; 10 Mins</p>
                        </a>
                    </div>`;
            });
            practiceSetsHtml += '</div>';

            // B) Single MCQs Generation (Thin content noindex)
            quizzes.forEach((q, i) => {
                const singleMcqDir = path.join(mcqSubjectDir, String(q.quizId));
                masterPageTasks.push(async () => {
                    await fsAsync.mkdir(singleMcqDir, { recursive: true });
                    const prevQ = quizzes[i - 1]; const nextQ = quizzes[i + 1];
                    const navButtonsHtml = `
                        <div class="d-flex justify-content-between align-items-center mt-5 pt-4 border-top">
                            ${prevQ ? `<a href="../${prevQ.quizId}/index.html" class="btn btn-outline-secondary fw-bold px-4 rounded-pill"><i class="bi bi-arrow-left me-2"></i>Prev</a>` : `<button class="btn btn-outline-secondary fw-bold px-4 rounded-pill" disabled><i class="bi bi-arrow-left me-2"></i>Prev</button>`}
                            ${nextQ ? `<a href="../${nextQ.quizId}/index.html" class="btn btn-primary fw-bold px-4 rounded-pill shadow-sm">Next<i class="bi bi-arrow-right ms-2"></i></a>` : `<button class="btn btn-primary fw-bold px-4 rounded-pill shadow-sm" disabled>Next<i class="bi bi-arrow-right ms-2"></i></button>`}
                        </div>
                    `;
                    
                    const randomQuizBlocks = getRandomQuizBlockHtml(getRandomItems(allValidQuizzesForRandomizer, 3));

                    const mcqContent = `
                        ${getBreadcrumbs(3, cat, safeName, 'Question ' + q.quizId, 'mcq')}
                        <div class="row">
                            <div class="col-lg-8">
                                ${AD_BANNER_SPONSORED}
                                <article class="card p-4 p-md-5 mb-4 bg-white shadow-sm border-0 rounded-4">
                                    <header class="mb-4 border-bottom pb-4">
                                        <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
                                            <a href="../../${safeName}/index.html" class="badge bg-primary text-decoration-none px-3 py-2 rounded-pill"><i class="bi bi-folder2-open me-1"></i>${cat}</a>
                                        </div>
                                        <h1 class="h4 fw-bold text-dark lh-base mt-3">${q.question}</h1>
                                    </header>
                                    <div class="d-grid gap-3 mb-4" id="options-container">
                                        <button class="btn option-btn" onclick="checkAnswer(this, 'A')">A) ${q.answer1 || ''}</button>
                                        <button class="btn option-btn" onclick="checkAnswer(this, 'B')">B) ${q.answer2 || ''}</button>
                                        <button class="btn option-btn" onclick="checkAnswer(this, 'C')">C) ${q.answer3 || ''}</button>
                                        <button class="btn option-btn" onclick="checkAnswer(this, 'D')">D) ${q.answer4 || ''}</button>
                                    </div>
                                    <div id="explanation-box" class="alert mt-4 d-none p-4 rounded-4 border">
                                        <h5 class="alert-heading fw-bold mb-3" id="result-title"></h5>
                                        <hr class="opacity-25">
                                        <h6 class="fw-bold text-dark mb-2"><i class="bi bi-lightbulb-fill text-warning me-2"></i>Detailed Solution:</h6>
                                        <p class="mb-0 text-dark lh-lg">${q.answerdetail || 'Understand the core concept to solve this easily.'}</p>
                                    </div>
                                    ${navButtonsHtml}
                                </article>
                                
                                <div class="mt-5 mb-5 pt-4 border-top">
                                    <h3 class="fw-bold mb-4"><i class="bi bi-shuffle text-primary me-2"></i>More Practice Questions</h3>
                                    ${randomQuizBlocks}
                                </div>
                            </div>
                            ${AD_SIDEBAR_HTML}
                        </div>
                        <script>
                            let hasAnswered = false;
                            function checkAnswer(btnElement, selectedLetter) {
                                if(hasAnswered) return;
                                hasAnswered = true;
                                const correctLetter = "${(q.mainanswer || '').toString().replace(/[^A-D]/gi, '').toUpperCase()}";
                                const answerTexts = { 'A': "${(q.answer1 || '').replace(/'/g, "\\'")}", 'B': "${(q.answer2 || '').replace(/'/g, "\\'")}", 'C': "${(q.answer3 || '').replace(/'/g, "\\'")}", 'D': "${(q.answer4 || '').replace(/'/g, "\\'")}" };
                                const explanationBox = document.getElementById('explanation-box');
                                const resultTitle = document.getElementById('result-title');
                                document.querySelectorAll('.option-btn').forEach(btn => btn.disabled = true);
                                explanationBox.classList.remove('d-none', 'alert-success', 'alert-danger');
                                if(selectedLetter === correctLetter) {
                                    btnElement.classList.add('correct-show');
                                    explanationBox.classList.add('alert-success', 'border-success');
                                    resultTitle.innerHTML = "✨ Correct Answer!";
                                } else {
                                    btnElement.classList.add('incorrect-show');
                                    explanationBox.classList.add('alert-danger', 'border-danger');
                                    resultTitle.innerHTML = "❌ Incorrect. The right answer is " + correctLetter + ") " + answerTexts[correctLetter];
                                }
                            }
                        </script>
                    `;
                    await fsAsync.writeFile(path.join(singleMcqDir, 'index.html'), getHtmlShell(`Q${q.quizId}: ${cat} MCQ`, mcqContent, 3, q.question, true));
                });
            });

            // C) SMART PAGINATION FOR MCQs LIST
            const QUESTIONS_PER_MCQ_PAGE = 10;
            const mcqPages = chunkArray(quizzes, QUESTIONS_PER_MCQ_PAGE);
            
            mcqPages.forEach((pageQuizzes, pageIndex) => {
                const pageNumber = pageIndex + 1;
                masterPageTasks.push(async () => {
                    let mcqListHtml = '<div class="list-group shadow-sm border-0 rounded-4 mb-5">';
                    pageQuizzes.forEach((q, idx) => {
                        const overallIndex = (pageIndex * QUESTIONS_PER_MCQ_PAGE) + idx + 1;
                        mcqListHtml += `<a href="./${q.quizId}/index.html" class="list-group-item list-group-item-action p-4 border-light"><strong>Q${overallIndex}.</strong> ${q.question.substring(0, 80)}...</a>`;
                    });
                    mcqListHtml += '</div>';

                    let paginationHtml = '<nav><ul class="pagination justify-content-center pagination-lg flex-wrap">';
                    if (pageNumber > 1) { paginationHtml += `<li class="page-item"><a class="page-link" href="page-${pageNumber - 1}.html">Prev</a></li>`; }
                    let startPage = Math.max(1, pageNumber - 2);
                    let endPage = Math.min(mcqPages.length, pageNumber + 2);
                    if(startPage > 1) {
                        paginationHtml += `<li class="page-item"><a class="page-link" href="page-1.html">1</a></li>`;
                        if(startPage > 2) paginationHtml += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
                    }
                    for (let p = startPage; p <= endPage; p++) {
                        paginationHtml += `<li class="page-item ${p === pageNumber ? 'active' : ''}"><a class="page-link" href="page-${p}.html">${p}</a></li>`;
                    }
                    if(endPage < mcqPages.length) {
                        if(endPage < mcqPages.length - 1) paginationHtml += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
                        paginationHtml += `<li class="page-item"><a class="page-link" href="page-${mcqPages.length}.html">${mcqPages.length}</a></li>`;
                    }
                    if (pageNumber < mcqPages.length) { paginationHtml += `<li class="page-item"><a class="page-link" href="page-${pageNumber + 1}.html">Next</a></li>`; }
                    paginationHtml += '</ul></nav>';

                    const mcqCatPageContent = `
                        ${getBreadcrumbs(2, cat, safeName, '', 'mcq')}
                        <h1 class="display-6 blog-title mb-4 text-dark mt-3">${cat} - Single MCQs (Page ${pageNumber})</h1>
                        ${AD_BANNER_SPONSORED}
                        ${mcqListHtml}
                        ${paginationHtml}
                    `;
                    
                    await fsAsync.writeFile(path.join(mcqSubjectDir, `page-${pageNumber}.html`), getHtmlShell(`${cat} Single MCQs - Page ${pageNumber}`, mcqCatPageContent, 2, "", false));
                    if (pageNumber === 1) { await fsAsync.writeFile(path.join(mcqSubjectDir, 'index.html'), getHtmlShell(`${cat} Single MCQs`, mcqCatPageContent, 2, "", false)); }
                });
            });

            // D) Category Study Hub (/categories/[cat]/index.html)
            masterPageTasks.push(async () => {
                const catPageContent = `
                    ${getBreadcrumbs(2, cat, safeName, '', 'cat')}
                    <h1 class="display-6 blog-title mb-4 text-dark mt-3">${cat} Study Hub</h1>
                    <p class="text-secondary fs-5 mb-5">Choose how you want to prepare for ${cat}. Take timed mock tests or browse individual questions.</p>
                    
                    <div class="row mb-5 text-center g-4">
                        <div class="col-md-6">
                            <div class="card bg-light border-0 p-4 h-100 rounded-4">
                                <h3 class="fw-bold mb-3"><i class="bi bi-stopwatch text-primary me-2"></i>Timed Mock Tests</h3>
                                <p class="text-muted mb-4">Practice in sets of 10 questions with a 10-minute timer.</p>
                                <a href="#mock-sets" class="btn btn-primary rounded-pill fw-bold px-4">View Test Sets</a>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="card bg-light border-0 p-4 h-100 rounded-4">
                                <h3 class="fw-bold mb-3"><i class="bi bi-list-check text-success me-2"></i>Single Questions</h3>
                                <p class="text-muted mb-4">Read and practice all ${quizzes.length} questions one by one.</p>
                                <a href="../../mcqs/${safeName}/index.html" class="btn btn-success rounded-pill fw-bold px-4">Browse Single MCQs</a>
                            </div>
                        </div>
                    </div>

                    ${AD_BANNER_SPONSORED}

                    <h3 class="fw-bold mb-4 mt-5" id="mock-sets">Available Mock Test Sets</h3>
                    ${practiceSetsHtml}
                `;
                await fsAsync.writeFile(path.join(catSubjectDir, 'index.html'), getHtmlShell(`${cat} MCQs & Mock Tests`, catPageContent, 2, "", false));
            });

            allCategoriesGridHtml += `
                <div class="col-md-6 col-lg-4">
                    <a href="./${safeName}/index.html" class="card shadow-sm h-100 card-hover border-light rounded-4 bg-white text-decoration-none p-4 text-center d-flex flex-column justify-content-center">
                        <h3 class="h5 fw-bold mb-2 text-dark">${cat}</h3>
                        <p class="text-secondary small mb-0">${quizzes.length} Questions</p>
                    </a>
                </div>
            `;
        }
        allCategoriesGridHtml += '</div>';

        // Root Pages for the 3 Hubs
        masterPageTasks.push(async () => {
            await fsAsync.writeFile(path.join(catMainDir, 'index.html'), getHtmlShell('All MCQ Categories', `
                ${getBreadcrumbs(1, '', '', 'Categories Hub', 'cat')}
                <h1 class="display-6 blog-title mb-4 text-dark mt-3">All MCQ Categories</h1>
                <p class="text-secondary mb-5">Select a subject to access mock tests and individual questions.</p>
                ${AD_BANNER_SPONSORED}
                ${allCategoriesGridHtml}
            `, 1, "", false));
            
            await fsAsync.writeFile(path.join(mockTestsDir, 'index.html'), getHtmlShell('Mock Tests Hub', `
                ${getBreadcrumbs(1, '', '', 'Mock Tests Hub', 'mock')}
                <h1 class="display-6 blog-title mb-4 text-dark mt-3">Mock Test Subjects</h1>
                <p class="text-secondary mb-5">Select a subject to access timed practice tests.</p>
                ${AD_BANNER_SPONSORED}
                ${allCategoriesGridHtml.replace(/\.\/([\w-]+)\/index\.html/g, '../categories/$1/index.html')}
            `, 1, "", false));

            await fsAsync.writeFile(path.join(mcqsMainDir, 'index.html'), getHtmlShell('Browse All MCQs', `
                ${getBreadcrumbs(1, '', '', 'MCQs Hub', 'mcq')}
                <h1 class="display-6 blog-title mb-4 text-dark mt-3">Browse MCQs by Topic</h1>
                <p class="text-secondary mb-5">Select a subject to practice questions one by one.</p>
                ${AD_BANNER_SPONSORED}
                ${allCategoriesGridHtml.replace(/\.\/([\w-]+)\/index\.html/g, '../categories/$1/index.html')}
            `, 1, "", false));
        });

        // ======================================
        // 5. GENERATE ADVANCED TOOLS PAGE
        // ======================================
        console.log("5. Generating Advanced Tools...");
        const toolsDir = path.join(distDir, 'tools');
        fs.mkdirSync(toolsDir, { recursive: true });
        masterPageTasks.push(async () => {
            const toolsContent = `
                ${getBreadcrumbs(1, '', '', 'Study Tools', 'tools')}
                <div class="mb-4 text-center mt-3">
                    <h1 class="display-5 blog-title text-dark mb-3"><i class="bi bi-tools text-primary me-2"></i>Advanced Study Tools</h1>
                    <p class="lead text-secondary">Free interactive utilities to optimize your competitive exam preparation.</p>
                </div>
                ${getToolsHtml(1)}
            `;
            await fsAsync.writeFile(path.join(toolsDir, 'index.html'), getHtmlShell('Free Study Tools & Calculators', toolsContent, 1, "", false));
        });

        // ======================================
        // 6. HOMEPAGE (/index.html)
        // ======================================
        console.log("6. Generating Homepage...");
        masterPageTasks.push(async () => {
            let topBlogHtml = '<div class="row g-4 mb-5">';
            blogPosts.slice(0, 6).forEach((post, index) => {
                if(index === 0) {
                    topBlogHtml += `
                        <div class="col-12 mb-2">
                            <a href="./post/${post.urlSlug}/index.html" class="card shadow border-0 rounded-4 overflow-hidden text-decoration-none bg-dark text-white card-hover p-4 p-md-5">
                                <span class="badge bg-primary w-auto align-self-start mb-3 px-3 py-2 text-uppercase fw-bold">${post.cat}</span>
                                <h2 class="display-5 fw-bold mb-3 lh-sm text-white">${post.title}</h2>
                                <p class="lead text-white-50 mb-4 d-none d-md-block">${(post.content.replace(/<[^>]+>/g, '').substring(0, 150))}...</p>
                                <div class="small fw-medium text-white-50"><i class="bi bi-clock me-1"></i>${post.date || 'Read Featured Article'}</div>
                            </a>
                        </div>
                    `;
                } else {
                    topBlogHtml += `
                        <div class="col-md-6 col-lg-4">
                            <a href="./post/${post.urlSlug}/index.html" class="card h-100 p-4 shadow-sm border border-light text-decoration-none card-hover bg-white d-flex flex-column">
                                <span class="text-primary small fw-bold text-uppercase mb-2">${post.cat}</span>
                                <h3 class="h5 fw-bold text-dark mb-3 lh-base">${post.title}</h3>
                                <small class="text-muted mt-auto"><i class="bi bi-calendar3 me-1"></i>${post.date || ''}</small>
                            </a>
                        </div>
                    `;
                }
            });
            topBlogHtml += '</div>';

            const homeRandomQsHtml = getRandomQuizBlockHtml(getRandomItems(allValidQuizzesForRandomizer, 5));

            const homeContent = `
                <div class="mt-4 mb-5 text-center">
                    <h1 class="display-3 blog-title text-dark mb-3">Learn & Master Your Exams</h1>
                    <p class="lead text-secondary col-md-8 mx-auto">High-quality editorial guides, deep concepts, and extensive practice tools for modern competitive examinations.</p>
                </div>
                ${topBlogHtml}
                <div class="text-center mt-4 mb-5">
                    <a href="./page/1/index.html" class="btn btn-outline-dark btn-lg rounded-pill px-5 fw-bold">View All Articles</a>
                </div>
                
                ${AD_BANNER_TOP}
                
                <div class="mt-5 pt-5 border-top">
                    <div class="d-flex justify-content-between align-items-end mb-4">
                        <h2 class="blog-title text-dark mb-0"><i class="bi bi-lightning-fill text-warning me-2"></i>Quick Knowledge Check</h2>
                    </div>
                    ${homeRandomQsHtml}
                </div>
                
                <div class="mt-5 pt-5 border-top">
                    <div class="d-flex justify-content-between align-items-end mb-4">
                        <h2 class="blog-title text-dark mb-0">Explore Platforms</h2>
                    </div>
                    <div class="row g-3 text-center">
                        <div class="col-md-4">
                            <a href="./custom-exam/index.html" class="card bg-dark text-white border-0 p-4 text-decoration-none card-hover rounded-4 h-100">
                                <h4 class="fw-bold mb-0"><i class="bi bi-gear-wide-connected me-2"></i>Custom Exam</h4>
                            </a>
                        </div>
                        <div class="col-md-4">
                            <a href="./categories/index.html" class="card bg-primary text-white border-0 p-4 text-decoration-none card-hover rounded-4 h-100">
                                <h4 class="fw-bold mb-0"><i class="bi bi-grid me-2"></i>Categories</h4>
                            </a>
                        </div>
                        <div class="col-md-4">
                            <a href="./tools/index.html" class="card bg-success text-white border-0 p-4 text-decoration-none card-hover rounded-4 h-100">
                                <h4 class="fw-bold mb-0"><i class="bi bi-tools me-2"></i>Study Tools</h4>
                            </a>
                        </div>
                    </div>
                </div>
            `;
            await fsAsync.writeFile(path.join(distDir, 'index.html'), getHtmlShell('Wedugo Education: Expert Exam Guides & Mock Tests', homeContent, 0, "", false));
        });

        // ======================================
        // 7. POLICIES & ABOUT
        // ======================================
        console.log("7. Generating Legal Policies & About...");
        const aboutDir = path.join(distDir, 'about');
        fs.mkdirSync(aboutDir, { recursive: true });
        masterPageTasks.push(async () => {
            const aboutContent = `
                ${getBreadcrumbs(1, '', '', 'About Us', 'blog')}
                <div class="card shadow-sm p-4 p-md-5 border-0 rounded-4 bg-white mt-4">
                    <h1 class="blog-title text-dark mb-4 display-5">About Wedugo Education</h1>
                    <p class="fs-5 text-secondary lh-lg mb-5">Wedugo Education is an authoritative editorial platform dedicated to providing students with high-quality study materials, in-depth conceptual guides, and robust examination practice tools.</p>
                </div>
            `;
            await fsAsync.writeFile(path.join(aboutDir, 'index.html'), getHtmlShell('About Us: Editorial Mission', aboutContent, 1, "", false));
        });

        masterPageTasks.push(async () => {
            const privacyContent = `
                ${getBreadcrumbs(0, '', '', 'Privacy Policy', 'blog')}
                <div class="card shadow-sm p-4 p-md-5 border-0 rounded-4 bg-white mt-4">
                    <h1 class="blog-title mb-4">Privacy Policy for Wedugo Education</h1>
                    <p class="text-secondary lh-lg">At Wedugo Education, accessible from wedugo.com, one of our main priorities is the privacy of our visitors.</p>
                </div>
            `;
            await fsAsync.writeFile(path.join(distDir, 'privacy.html'), getHtmlShell('Privacy Policy', privacyContent, 0, "", false));
            
            const termsContent = `
                ${getBreadcrumbs(0, '', '', 'Terms and Conditions', 'blog')}
                <div class="card shadow-sm p-4 p-md-5 border-0 rounded-4 bg-white mt-4">
                    <h1 class="blog-title mb-4">Terms and Conditions</h1>
                    <p class="text-secondary lh-lg">Welcome to Wedugo Education!</p>
                </div>
            `;
            await fsAsync.writeFile(path.join(distDir, 'terms.html'), getHtmlShell('Terms and Conditions', termsContent, 0, "", false));
        });

        await executeTasksInBatches(masterPageTasks, 500); 

        console.log("8. Finalizing Build & Assets...");
        ['tools', 'main_images'].forEach(dir => { const s = path.join(__dirname, dir); if (fs.existsSync(s)) fs.cpSync(s, path.join(distDir, dir), { recursive: true }); });
        ['Ads.txt', 'CNAME', '404.html'].forEach(f => { const s = path.join(__dirname, f); if (fs.existsSync(s)) fs.copyFileSync(s, path.join(distDir, f === 'Ads.txt' ? 'ads.txt' : f)); });

        await generateSitemapAndRobots(distDir, quizCategoriesMap, blogPosts, blogCategoriesMap);

        console.log("✅ BUILD COMPLETE (Supabase Backend + Admin Panel + Full Frontend Auth)");
    } catch (error) { console.error("Build failed:", error); }
}

buildUnifiedSite();
