const fs = require('fs');
const fsAsync = require('fs').promises;
const path = require('path');

// ==========================================
// CONFIGURATION & SUPABASE ENV VARS
// ==========================================
const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_KEY = process.env.SUPABASE_KEY || "";
const SITE_BASE_URL = "https://www.wedugo.com"; 
const ADSENSE_CLIENT_ID = "ca-pub-5947676189341600";
const CACHE_BUSTER = Date.now(); 

const CATEGORY_LIST = [
    "Indian Geography","World Organisations","Inventions","Physics","Indian Economy","Days and Years","Technology","Chemistry","Honours and Awards","General Science","General Knowledge","Reasoning","Civil Engineering","Hindi","Sports","Computer","Biology","World Geography","Famous Personalities","Aptitude","Madhya Pradesh GK","Solar System","English","Series","Average","Sets","Percentage","Simple Interest","Surds and Indices","Ratio and Proportion","Time and Work","Trains Time","Age","Area","Profit and Loss","Calendar","Simplification","Indian Polity and Constitution","Indian History","World History","History","Environmental Science and Ecology","Blood Relation","Biochemistry","Fats and Fatty Acid Metabolism","Vitamins","Enzymes","Mineral Metabolism","Hormone Metabolism","Distance and Direction","Nucleic Acids","Water and Electrolyte Balance","History of Microbiology","Microbiology","Bacteria and Gram Staining","Agriculture","Solid Mechanics","Child Development and Pedagogy","Virus","Pharmacology","Anatomy","Psychology","Indian General Knowledge"
];

// ==========================================
// ADVERTISEMENT UI COMPONENTS
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
            <div class="sticky-desktop-sidebar" style="position: sticky; top: 90px;">
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
                    <a href="/custom-exam.html" class="btn btn-outline-primary btn-sm w-100 rounded-pill fw-bold">Build Custom Test</a>
                </div>
            </div>
        </div>
    `;
}

// 🟢 UNIVERSAL NAVBAR WITH DYNAMIC AUTH
function getNavbar() {
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
                    <li class="nav-item"><a class="nav-link text-dark px-3 rounded-pill hover-bg-light" href="/tools.html"><i class="bi bi-tools me-1"></i>Tools</a></li>
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

// 🟢 MASTER HTML SHELL (SUPABASE GLOBAL INIT INCLUDED)
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
    </style>
</head>
<body>
    ${getNavbar()}

    <!-- Auth Modal -->
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
        // GLOBAL SUPABASE INIT (Injected via Environment Variables safely)
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
                        <li><a class="dropdown-item fw-medium py-2" href="/admin.html"><i class="bi bi-speedometer2 me-2"></i>Dashboard</a></li>
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

            let { data, error } = await supabaseClient.auth.signInWithPassword({ email, password: pass });
            
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
            btn.innerHTML = 'Login / Register'; btn.disabled = false;
        }

        async function checkModuleLock() {
            if(!supabaseClient) return;
            const isProtected = window.location.href.includes('mock.html') || window.location.href.includes('custom-exam.html');
            if(!isProtected) return;

            const { data } = await supabaseClient.from('dynamic_components').select('*').eq('component_name', 'LOCK_MOCK_TESTS').single();
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

        document.addEventListener("DOMContentLoaded", initAuth);
    </script>
</body>
</html>`;
}

// ==========================================
// DYNAMIC PAGE TEMPLATES (CLIENT-SIDE FETCH)
// ==========================================

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
                if(!supabaseClient) return;
                
                // Fetch Blogs
                const { data: blogs } = await supabaseClient.from('blog_posts').select('slug, title, category, content, created_at').order('created_at', { ascending: false }).limit(6);
                let blogHtml = '';
                if(blogs) {
                    blogs.forEach((b, i) => {
                        const date = new Date(b.created_at).toLocaleDateString();
                        if(i===0) blogHtml += \`<div class="col-12 mb-2"><a href="/blog.html?slug=\${b.slug}" class="card shadow border-0 rounded-4 overflow-hidden text-decoration-none bg-dark text-white card-hover p-4 p-md-5"><span class="badge bg-primary w-auto align-self-start mb-3 px-3 py-2 text-uppercase fw-bold">\${b.category}</span><h2 class="display-5 fw-bold mb-3 lh-sm text-white">\${b.title}</h2><div class="small fw-medium text-white-50"><i class="bi bi-clock me-1"></i>\${date}</div></a></div>\`;
                        else blogHtml += \`<div class="col-md-6 col-lg-4"><a href="/blog.html?slug=\${b.slug}" class="card h-100 p-4 shadow-sm border border-light text-decoration-none card-hover bg-white d-flex flex-column"><span class="text-primary small fw-bold text-uppercase mb-2">\${b.category}</span><h3 class="h5 fw-bold text-dark mb-3 lh-base">\${b.title}</h3><small class="text-muted mt-auto"><i class="bi bi-calendar3 me-1"></i>\${date}</small></a></div>\`;
                    });
                    document.getElementById('home-blogs').innerHTML = blogHtml;
                }

                // Fetch Random Quizzes (PostgreSQL RANDOM trick)
                const { data: qData } = await supabaseClient.from('questions').select('id, qcategory, question, answer1, answer2, answer3, answer4, mainanswer, answerdetail').limit(5);
                let qHtml = '';
                if(qData) {
                    qData.forEach(q => {
                        qHtml += \`<div class="col-12"><div class="card p-4 p-md-5 bg-white shadow-sm border border-light rounded-4 card-hover"><div class="mb-4"><span class="badge bg-primary bg-opacity-10 text-primary border px-3 py-2 rounded-pill">\${q.qcategory}</span></div><h3 class="h4 fw-bold text-dark mb-4 lh-base">\${q.question}</h3><a href="/mcq.html?id=\${q.id}" class="btn btn-outline-primary fw-bold px-4 rounded-pill">Solve Question <i class="bi bi-arrow-right"></i></a></div></div>\`;
                    });
                    document.getElementById('home-quizzes').innerHTML = qHtml;
                }

                document.getElementById('home-loader').classList.add('d-none');
                document.getElementById('home-content').classList.remove('d-none');
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
                    <header class="mb-4 border-bottom pb-4">
                        <a id="mcq-cat-link" href="#" class="badge bg-primary text-decoration-none px-3 py-2 rounded-pill mb-3">Category</a>
                        <h1 class="h4 fw-bold text-dark lh-base mt-3" id="mcq-qtext"></h1>
                    </header>
                    <div class="d-grid gap-3 mb-4" id="mcq-options"></div>
                    <div id="mcq-exp-box" class="alert mt-4 d-none p-4 rounded-4 border">
                        <h5 class="alert-heading fw-bold mb-3" id="mcq-res-title"></h5>
                        <hr class="opacity-25">
                        <h6 class="fw-bold text-dark mb-2"><i class="bi bi-lightbulb-fill text-warning me-2"></i>Detailed Solution:</h6>
                        <p class="mb-0 text-dark lh-lg" id="mcq-exp-text"></p>
                    </div>
                    <div class="d-flex justify-content-between align-items-center mt-5 pt-4 border-top">
                        <button class="btn btn-outline-secondary fw-bold px-4 rounded-pill" id="btn-prev">Prev Question</button>
                        <button class="btn btn-primary fw-bold px-4 rounded-pill shadow-sm" id="btn-next">Next Question</button>
                    </div>
                </article>
                <div class="mt-5 pt-5 border-top">
                    <h3 class="fw-bold mb-4">Discussion</h3>
                    <div id="disqus-container"></div>
                </div>
            </div>
            ${getAdSidebar()}
        </div>

        <script>
            let currentQ = null;
            let hasAnswered = false;

            document.addEventListener('DOMContentLoaded', async () => {
                if(!supabaseClient) return;
                const urlParams = new URLSearchParams(window.location.search);
                const id = urlParams.get('id');
                if(!id) return document.getElementById('mcq-content').innerHTML = "Invalid ID";

                const { data } = await supabaseClient.from('questions').select('*').eq('id', id).single();
                if(data) {
                    currentQ = data;
                    document.getElementById('mcq-cat-link').innerText = data.qcategory;
                    document.getElementById('mcq-cat-link').href = "/category.html?name=" + encodeURIComponent(data.qcategory);
                    document.getElementById('mcq-qtext').innerText = data.question;
                    document.title = "Q" + data.id + ": " + data.question.substring(0, 40) + " | Wedugo";
                    
                    const opts = { 'A': data.answer1, 'B': data.answer2, 'C': data.answer3, 'D': data.answer4 };
                    let optHtml = '';
                    for(let k in opts) {
                        optHtml += \`<button class="btn option-btn" onclick="checkAns(this, '\${k}')">\${k}) \${opts[k]}</button>\`;
                    }
                    document.getElementById('mcq-options').innerHTML = optHtml;
                    
                    document.getElementById('btn-prev').onclick = () => window.location.href = "/mcq.html?id=" + (parseInt(id)-1);
                    document.getElementById('btn-next').onclick = () => window.location.href = "/mcq.html?id=" + (parseInt(id)+1);

                    // Setup Disqus
                    document.getElementById('disqus-container').innerHTML = \`
                        <div id="disqus_thread"></div>
                        <script>
                            var disqus_config = function () { this.page.url = window.location.href; this.page.identifier = 'mcq_\${data.id}'; };
                            (function() { var d = document, s = d.createElement('script'); s.src = 'https://wedugo.disqus.com/embed.js'; s.setAttribute('data-timestamp', +new Date()); (d.head || d.body).appendChild(s); })();
                        <\/script>
                    \`;

                    document.getElementById('mcq-loader').classList.add('d-none');
                    document.getElementById('mcq-content').classList.remove('d-none');
                }
            });

            function checkAns(btn, selected) {
                if(hasAnswered) return; hasAnswered = true;
                const correct = currentQ.mainanswer.replace(/[^A-D]/gi, '').toUpperCase();
                const expBox = document.getElementById('mcq-exp-box');
                document.querySelectorAll('.option-btn').forEach(b => b.disabled = true);
                
                expBox.classList.remove('d-none');
                if(selected === correct) {
                    btn.classList.add('correct-show');
                    expBox.classList.add('alert-success', 'border-success');
                    document.getElementById('mcq-res-title').innerText = "✨ Correct Answer!";
                } else {
                    btn.classList.add('incorrect-show');
                    expBox.classList.add('alert-danger', 'border-danger');
                    document.getElementById('mcq-res-title').innerText = "❌ Incorrect. Right answer is " + correct;
                }
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
            <div class="row mb-5 text-center g-4">
                <div class="col-md-6">
                    <div class="card bg-light border-0 p-4 h-100 rounded-4">
                        <h3 class="fw-bold mb-3"><i class="bi bi-stopwatch text-primary me-2"></i>Timed Mock Tests</h3>
                        <a id="btn-start-mock" href="#" class="btn btn-primary rounded-pill fw-bold px-4">Start 10-Q Mock Test</a>
                    </div>
                </div>
            </div>
            ${getAdBannerHtml("Sponsored")}
            <h3 class="fw-bold mb-4 mt-5">Question Bank</h3>
            <div id="mcq-list" class="list-group shadow-sm border-0 rounded-4 mb-5"></div>
            <div class="text-center"><button class="btn btn-outline-dark fw-bold rounded-pill px-4" id="btn-load-more">Load More</button></div>
        </div>

        <script>
            let currentOffset = 0;
            const limit = 20;
            const urlParams = new URLSearchParams(window.location.search);
            const catName = urlParams.get('name');

            document.addEventListener('DOMContentLoaded', async () => {
                if(!supabaseClient || !catName) return;
                document.getElementById('cat-title').innerText = catName + " - Study Hub";
                document.title = catName + " MCQs & Mock Tests | Wedugo";
                document.getElementById('btn-start-mock').href = "/mock.html?cat=" + encodeURIComponent(catName);
                
                await loadMore();
                document.getElementById('cat-loader').classList.add('d-none');
                document.getElementById('cat-content').classList.remove('d-none');
            });

            document.getElementById('btn-load-more').onclick = loadMore;

            async function loadMore() {
                const { data } = await supabaseClient.from('questions').select('id, question').eq('qcategory', catName).range(currentOffset, currentOffset + limit - 1);
                if(data && data.length > 0) {
                    let html = '';
                    data.forEach((q, i) => {
                        html += \`<a href="/mcq.html?id=\${q.id}" class="list-group-item list-group-item-action p-4 border-light"><strong>Q\${currentOffset+i+1}.</strong> \${q.question.substring(0, 80)}...</a>\`;
                    });
                    document.getElementById('mcq-list').innerHTML += html;
                    currentOffset += limit;
                } else {
                    document.getElementById('btn-load-more').style.display = 'none';
                }
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
                <div class="timer-header p-4 shadow-sm d-flex flex-wrap gap-3 justify-content-between align-items-center mb-5 rounded-4 border">
                    <div><h1 class="h4 fw-bold text-dark mb-1" id="mock-title">Mock Test</h1><p class="text-muted small mb-0">10 Questions</p></div>
                    <div class="text-center ms-auto bg-light px-4 py-2 rounded-3 border"><div class="fs-4 fw-bold font-monospace text-danger" id="timer-display">10:00</div></div>
                </div>
                
                <div id="score-board" class="card shadow-lg border-success d-none mb-5 text-center p-5 rounded-4 bg-success bg-opacity-10">
                    <h2 class="text-success fw-bold display-6 mb-3">Test Completed!</h2>
                    <div class="display-2 fw-bold text-success mb-4" id="final-score">0 / 10</div>
                    <a id="btn-back-cat" href="#" class="btn btn-success rounded-pill px-5 fw-bold">Back to Hub</a>
                </div>

                <div id="q-container"></div>
                
                <div class="text-center mt-5 mb-5" id="submit-container">
                    <button class="btn btn-primary btn-lg px-5 py-3 fw-bold shadow rounded-pill w-100" onclick="submitTest()">Submit Test & View Results</button>
                </div>
            </div>
            ${getAdSidebar()}
        </div>

        <script>
            let mockData = [];
            let userAnswers = {};
            let timeLeft = 600, timerInterval, testSubmitted = false;

            document.addEventListener('DOMContentLoaded', async () => {
                if(!supabaseClient) return;
                const urlParams = new URLSearchParams(window.location.search);
                const catName = urlParams.get('cat');
                if(!catName) return;

                document.getElementById('mock-title').innerText = catName + " Mock Test";
                document.getElementById('btn-back-cat').href = "/category.html?name=" + encodeURIComponent(catName);
                
                // Fetch 10 random questions from category
                const { data } = await supabaseClient.from('questions').select('*').eq('qcategory', catName).limit(50);
                if(data) {
                    mockData = data.sort(() => 0.5 - Math.random()).slice(0, 10);
                    renderQuestions();
                    document.getElementById('mock-loader').classList.add('d-none');
                    document.getElementById('mock-content').classList.remove('d-none');
                    
                    timerInterval = setInterval(() => {
                        if(testSubmitted) return;
                        timeLeft--;
                        let m = Math.floor(timeLeft / 60), s = timeLeft % 60;
                        document.getElementById('timer-display').innerText = (m<10?'0':'')+m + ':' + (s<10?'0':'')+s;
                        if (timeLeft <= 0) { clearInterval(timerInterval); submitTest(); }
                    }, 1000);
                }
            });

            function renderQuestions() {
                let html = '';
                mockData.forEach((q, i) => {
                    html += \`
                        <article class="card p-4 p-md-5 mb-5 bg-white border border-light rounded-4" id="quiz-block-\${q.id}">
                            <div class="mb-4 pb-3 border-bottom"><span class="badge bg-dark rounded-pill px-3 py-2 fs-6">Question \${i+1}</span></div>
                            <h3 class="h4 fw-bold text-dark mb-4 lh-base">\${q.question}</h3>
                            <div class="d-grid gap-3 mb-4">
                                <button class="btn option-btn" data-letter="A" onclick="selOpt('\${q.id}', 'A', this)">A) \${q.answer1}</button>
                                <button class="btn option-btn" data-letter="B" onclick="selOpt('\${q.id}', 'B', this)">B) \${q.answer2}</button>
                                <button class="btn option-btn" data-letter="C" onclick="selOpt('\${q.id}', 'C', this)">C) \${q.answer3}</button>
                                <button class="btn option-btn" data-letter="D" onclick="selOpt('\${q.id}', 'D', this)">D) \${q.answer4}</button>
                            </div>
                            <div id="exp-\${q.id}" class="alert mt-4 d-none p-4 border bg-light rounded-4">
                                <h5 class="alert-heading fw-bold fs-5 mb-3" id="res-\${q.id}"></h5>
                                <hr class="opacity-25 mb-3">
                                <p class="mb-0 text-dark">\${q.answerdetail || ''}</p>
                            </div>
                        </article>
                    \`;
                });
                document.getElementById('q-container').innerHTML = html;
            }

            function selOpt(qId, letter, btn) {
                if(testSubmitted) return;
                const container = document.getElementById('quiz-block-' + qId);
                container.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected'); userAnswers[qId] = letter;
            }

            function submitTest() {
                if(testSubmitted) return;
                testSubmitted = true; clearInterval(timerInterval);
                document.getElementById('submit-container').style.display = 'none';
                let score = 0;
                
                mockData.forEach(q => {
                    const correct = q.mainanswer.replace(/[^A-D]/gi, '').toUpperCase();
                    const user = userAnswers[q.id];
                    const container = document.getElementById('quiz-block-' + q.id);
                    const exp = document.getElementById('exp-' + q.id);
                    const title = document.getElementById('res-' + q.id);
                    
                    container.querySelectorAll('.option-btn').forEach(btn => {
                        btn.disabled = true; btn.classList.remove('selected');
                        const bL = btn.getAttribute('data-letter');
                        if (bL === correct) btn.classList.add('correct-show');
                        else if (bL === user && user !== correct) btn.classList.add('incorrect-show');
                    });
                    
                    exp.classList.remove('d-none');
                    if(user === correct) { score++; exp.classList.add('alert-success', 'border-success'); title.innerText = "Correct!"; }
                    else if(!user) { exp.classList.add('alert-warning', 'border-warning'); title.innerText = "Unanswered. Correct: " + correct; }
                    else { exp.classList.add('alert-danger', 'border-danger'); title.innerText = "Incorrect. Correct: " + correct; }
                });

                document.getElementById('score-board').classList.remove('d-none');
                document.getElementById('final-score').innerText = score + " / 10";
                window.scrollTo(0,0);
            }
        </script>
    `);
}

function getAdminTemplate() {
    // Keeping exactly the same WYSIWYG Admin panel string as previous step.
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
                <div class="alert alert-success border-0 shadow-sm"><i class="bi bi-rocket-takeoff-fill me-2"></i>Dynamic Client-Side Rendering is Active. Changes here appear on the website instantly. No GitHub rebuilds required.</div>
            </div>
            
            <div id="tab-questions" class="admin-tab d-none">
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h2 class="fw-bold mb-0">Manage Questions</h2>
                    <button class="btn btn-primary fw-bold" onclick="openMcqModal()"><i class="bi bi-plus-lg me-2"></i>Add Question</button>
                </div>
                <div class="card p-0 overflow-hidden"><table class="table table-hover mb-0 align-middle"><thead class="table-light"><tr><th>ID</th><th>Category</th><th>Question</th><th>Actions</th></tr></thead><tbody id="mcq-tbody"><tr><td colspan="4" class="text-center py-4">Loading...</td></tr></tbody></table></div>
            </div>

            <div id="tab-blogs" class="admin-tab d-none">
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h2 class="fw-bold mb-0">Manage Editorial Blogs</h2>
                    <button class="btn btn-primary fw-bold" onclick="openBlogModal()"><i class="bi bi-pen-fill me-2"></i>Write New Blog</button>
                </div>
                <div class="card p-0 overflow-hidden"><table class="table table-hover mb-0 align-middle"><thead class="table-light"><tr><th>Title</th><th>Category</th><th>Date</th><th>Actions</th></tr></thead><tbody id="blog-tbody"><tr><td colspan="4" class="text-center py-4">Loading...</td></tr></tbody></table></div>
            </div>

            <div id="tab-users" class="admin-tab d-none">
                <h2 class="fw-bold mb-4">User Administration</h2>
                <div class="card p-0 overflow-hidden"><table class="table table-hover mb-0 align-middle"><thead class="table-light"><tr><th>Email/ID</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead><tbody id="users-tbody"><tr><td colspan="4" class="text-center py-4">Loading...</td></tr></tbody></table></div>
            </div>

            <div id="tab-settings" class="admin-tab d-none">
                <h2 class="fw-bold mb-4">System Settings</h2>
                <div class="card p-4"><h5 class="fw-bold mb-3 border-bottom pb-2">Module Access Control</h5><div class="form-check form-switch mb-3"><input class="form-check-input" type="checkbox" role="switch" id="toggle-mock-lock" onchange="toggleModuleLock(this.checked)" style="width:40px;height:20px;"><label class="form-check-label ms-2 fw-medium pt-1" for="toggle-mock-lock">Require Login for Mock Tests</label></div><p class="text-muted small">Locks tests for unregistered users.</p></div>
            </div>
        </div>
    </div>
    
    <!-- Modal for Blogs -->
    <div class="modal fade" id="blogModal" tabindex="-1"><div class="modal-dialog modal-xl modal-dialog-centered"><div class="modal-content border-0 shadow-lg"><div class="modal-header border-0 bg-light"><h5 class="fw-bold mb-0">Write Blog</h5><button type="button" class="btn-close" data-bs-dismiss="modal"></button></div><div class="modal-body p-4"><input type="hidden" id="b-id"><div class="row g-3 mb-3"><div class="col-md-6"><input type="text" id="b-title" class="form-control" placeholder="Title"></div><div class="col-md-6"><input type="text" id="b-cat" class="form-control" placeholder="Category"></div></div><div id="quill-editor" style="height:300px;background:white;"></div></div><div class="modal-footer border-0"><button class="btn btn-primary px-4 fw-bold" onclick="saveBlog()">Save Article</button></div></div></div></div>

    <!-- Modal for MCQs -->
    <div class="modal fade" id="mcqModal" tabindex="-1"><div class="modal-dialog modal-lg modal-dialog-centered"><div class="modal-content border-0 shadow-lg"><div class="modal-header border-0 bg-light"><h5 class="fw-bold mb-0">Add Question</h5><button type="button" class="btn-close" data-bs-dismiss="modal"></button></div><div class="modal-body p-4"><input type="hidden" id="q-id"><div class="mb-3"><textarea id="q-text" class="form-control" rows="2" placeholder="Question Text"></textarea></div><div class="row g-3 mb-3"><div class="col-md-6"><input type="text" id="q-optA" class="form-control" placeholder="Option A"></div><div class="col-md-6"><input type="text" id="q-optB" class="form-control" placeholder="Option B"></div><div class="col-md-6"><input type="text" id="q-optC" class="form-control" placeholder="Option C"></div><div class="col-md-6"><input type="text" id="q-optD" class="form-control" placeholder="Option D"></div></div><div class="row g-3"><div class="col-md-6"><input type="text" id="q-ans" class="form-control text-uppercase" placeholder="Correct (A/B/C/D)" maxlength="1"></div><div class="col-md-6"><input type="text" id="q-cat" class="form-control" placeholder="Category"></div><div class="col-12"><textarea id="q-exp" class="form-control" rows="2" placeholder="Explanation"></textarea></div></div></div><div class="modal-footer border-0"><button class="btn btn-primary px-4 fw-bold" onclick="saveMcq()">Save Question</button></div></div></div></div>

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
            const { data: { session } } = await supabaseClient.auth.getSession();
            if(session?.user) {
                const { data } = await supabaseClient.from('profiles').select('role').eq('id', session.user.id).single();
                if(data?.role === 'admin') {
                    document.getElementById('auth-screen').classList.add('d-none'); document.getElementById('dashboard-screen').classList.remove('d-none');
                    loadDashboardStats(); loadModuleConfig();
                } else { alert("Access Denied"); await supabaseClient.auth.signOut(); }
            }
        }
        async function adminLogin() {
            const email = document.getElementById('admin-email').value, password = document.getElementById('admin-pass').value;
            const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
            if(error) { document.getElementById('admin-alert').className="alert alert-danger small fw-bold"; document.getElementById('admin-alert').innerText = error.message; document.getElementById('admin-alert').classList.remove('d-none'); }
            else checkAdminSession();
        }
        function switchTab(id, el) { document.querySelectorAll('.admin-tab').forEach(t=>t.classList.add('d-none')); document.getElementById('tab-'+id).classList.remove('d-none'); document.querySelectorAll('.sidebar .nav-link').forEach(l=>l.classList.remove('active')); el.classList.add('active'); if(id==='questions') loadMcqs(); if(id==='blogs') loadBlogs(); if(id==='users') loadUsers(); }
        async function loadDashboardStats() {
            const { count: c1 } = await supabaseClient.from('questions').select('*', { count: 'exact', head: true });
            const { count: c2 } = await supabaseClient.from('blog_posts').select('*', { count: 'exact', head: true });
            const { count: c3 } = await supabaseClient.from('profiles').select('*', { count: 'exact', head: true });
            document.getElementById('stat-mcq').innerText = c1||0; document.getElementById('stat-blog').innerText = c2||0; document.getElementById('stat-user').innerText = c3||0;
        }
        async function loadModuleConfig() { const { data } = await supabaseClient.from('dynamic_components').select('*').eq('component_name', 'LOCK_MOCK_TESTS').single(); if(data) document.getElementById('toggle-mock-lock').checked = data.is_active; }
        async function toggleModuleLock(v) { await supabaseClient.from('dynamic_components').upsert({ component_name: 'LOCK_MOCK_TESTS', is_active: v }); }
        
        async function loadMcqs() { const { data } = await supabaseClient.from('questions').select('id, qcategory, question').order('id',{ascending:false}).limit(20); const tb = document.getElementById('mcq-tbody'); tb.innerHTML = data.map(q=>\`<tr><td>#\${q.id}</td><td>\${q.qcategory}</td><td>\${q.question.substring(0,50)}</td><td><button class="btn btn-sm btn-danger" onclick="deleteMcq(\${q.id})"><i class="bi bi-trash"></i></button></td></tr>\`).join(''); }
        function openMcqModal() { new bootstrap.Modal(document.getElementById('mcqModal')).show(); }
        async function saveMcq() {
            const obj = { question: document.getElementById('q-text').value, answer1: document.getElementById('q-optA').value, answer2: document.getElementById('q-optB').value, answer3: document.getElementById('q-optC').value, answer4: document.getElementById('q-optD').value, mainanswer: document.getElementById('q-ans').value.toUpperCase(), qcategory: document.getElementById('q-cat').value, answerdetail: document.getElementById('q-exp').value };
            await supabaseClient.from('questions').insert([obj]); bootstrap.Modal.getInstance(document.getElementById('mcqModal')).hide(); loadMcqs();
        }
        async function deleteMcq(id) { if(confirm("Delete?")) { await supabaseClient.from('questions').delete().eq('id', id); loadMcqs(); } }
        
        async function loadBlogs() { const { data } = await supabaseClient.from('blog_posts').select('*').order('created_at',{ascending:false}); const tb = document.getElementById('blog-tbody'); tb.innerHTML = data.map(b=>\`<tr><td>\${b.title}</td><td>\${b.category}</td><td>\${new Date(b.created_at).toLocaleDateString()}</td><td><button class="btn btn-sm btn-danger" onclick="deleteBlog('\${b.id}')"><i class="bi bi-trash"></i></button></td></tr>\`).join(''); }
        function openBlogModal() { new bootstrap.Modal(document.getElementById('blogModal')).show(); }
        async function saveBlog() {
            const t = document.getElementById('b-title').value, c = document.getElementById('b-cat').value, body = quill.root.innerHTML;
            await supabaseClient.from('blog_posts').insert([{ title: t, slug: t.toLowerCase().replace(/[^a-z0-9]+/g, '-'), category: c, content: body }]); bootstrap.Modal.getInstance(document.getElementById('blogModal')).hide(); loadBlogs();
        }
        async function deleteBlog(id) { if(confirm("Delete?")) { await supabaseClient.from('blog_posts').delete().eq('id', id); loadBlogs(); } }
        
        async function loadUsers() { const { data } = await supabaseClient.from('profiles').select('*').order('created_at',{ascending:false}); const tb = document.getElementById('users-tbody'); tb.innerHTML = data.map(u=>\`<tr><td>\${u.id.substring(0,8)}</td><td>\${u.role}</td><td>Active</td><td><button class="btn btn-sm btn-outline-dark" onclick="toggleRole('\${u.id}','\${u.role}')">Toggle</button></td></tr>\`).join(''); }
        async function toggleRole(id, role) { const nr = role==='admin'?'student':'admin'; if(confirm("Change to "+nr+"?")) { await supabaseClient.from('profiles').update({ role: nr }).eq('id', id); loadUsers(); } }
    </script>
</body>
</html>`;
}

// ==========================================
// STATIC BUILD PROCESS (Generates ONLY 10 Templates)
// ==========================================
async function buildCSRSite() {
    try {
        const distDir = path.join(__dirname, 'public');
        if (fs.existsSync(distDir)) fs.rmSync(distDir, { recursive: true, force: true });
        fs.mkdirSync(distDir, { recursive: true });
        
        console.log("1. Generating Client-Side Application Templates...");
        
        // Output Index (Fetches dynamically on load)
        await fsAsync.writeFile(path.join(distDir, 'index.html'), getIndexTemplate(), 'utf8');
        
        // Output Single MCQ Page
        await fsAsync.writeFile(path.join(distDir, 'mcq.html'), getMcqTemplate(), 'utf8');

        // Output Category Hub
        await fsAsync.writeFile(path.join(distDir, 'category.html'), getCategoryTemplate(), 'utf8');

        // Output Mock Test
        await fsAsync.writeFile(path.join(distDir, 'mock.html'), getMockTemplate(), 'utf8');

        // Output Admin
        const adminDir = path.join(distDir, 'admin');
        fs.mkdirSync(adminDir, { recursive: true });
        await fsAsync.writeFile(path.join(adminDir, 'index.html'), getAdminTemplate(), 'utf8');

        // Copy Assets
        ['main_images'].forEach(dir => { const s = path.join(__dirname, dir); if (fs.existsSync(s)) fs.cpSync(s, path.join(distDir, dir), { recursive: true }); });
        ['Ads.txt', 'CNAME', '404.html'].forEach(f => { const s = path.join(__dirname, f); if (fs.existsSync(s)) fs.copyFileSync(s, path.join(distDir, f === 'Ads.txt' ? 'ads.txt' : f)); });

        console.log("2. Generating SEO Sitemap...");
        // Fetch only IDs for Sitemap to keep it fast
        let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
        xml += `<url><loc>${SITE_BASE_URL}/</loc><priority>1.0</priority></url>\n`;
        xml += `<url><loc>${SITE_BASE_URL}/categories.html</loc><priority>0.9</priority></url>\n`;
        
        if(SUPABASE_URL && SUPABASE_KEY) {
            const { createClient } = require('@supabase/supabase-js');
            const sup = createClient(SUPABASE_URL, SUPABASE_KEY);
            const { data: qData } = await sup.from('questions').select('id');
            if(qData) qData.forEach(q => xml += `<url><loc>${SITE_BASE_URL}/mcq.html?id=${q.id}</loc><priority>0.6</priority></url>\n`);
        }
        xml += `</urlset>`;
        
        await fsAsync.writeFile(path.join(distDir, 'sitemap.xml'), xml, 'utf8');
        await fsAsync.writeFile(path.join(distDir, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE_BASE_URL}/sitemap.xml\n`, 'utf8');

        console.log("✅ BUILD COMPLETE (CSR Mode - 5 Seconds!)");
    } catch(e) { console.error("Build failed:", e); }
}

buildCSRSite();
