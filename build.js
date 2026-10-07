const fs = require('fs');
const fsAsync = require('fs').promises;
const path = require('path');

const SUPABASE_URL = "https://cncahdezxttujjzihozt.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNuY2FoZGV6eHR0dWpqemlob3p0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkzOTI2MjgsImV4cCI6MjEwNDk2ODYyOH0.69WvQ73HHJvTiKlRkMdACgxMVLj4prcLMhRhRfTfW_0";
const SITE_BASE_URL = "https://www.wedugo.com"; 
const ADSENSE_CLIENT_ID = "ca-pub-5947676189341600";
const CACHE_BUSTER = Date.now(); 

const CATEGORY_LIST = [
    "Indian Geography","World Organisations","Inventions","Physics","Indian Economy","Days and Years","Technology","Chemistry","Honours and Awards","General Science","General Knowledge","Reasoning","Civil Engineering","Hindi","Sports","Computer","Biology","World Geography","Famous Personalities","Aptitude","Madhya Pradesh GK","Solar System","English","Series","Average","Sets","Percentage","Simple Interest","Surds and Indices","Ratio and Proportion","Time and Work","Trains Time","Age","Area","Profit and Loss","Calendar","Simplification","Indian Polity and Constitution","Indian History","World History","History","Environmental Science and Ecology","Blood Relation","Biochemistry","Fats and Fatty Acid Metabolism","Vitamins","Enzymes","Mineral Metabolism","Hormone Metabolism","Distance and Direction","Nucleic Acids","Water and Electrolyte Balance","History of Microbiology","Microbiology","Bacteria and Gram Staining","Agriculture","Solid Mechanics","Child Development and Pedagogy","Virus","Pharmacology","Anatomy","Psychology","Indian General Knowledge"
];

function getAdBannerHtml(label) {
    return `<div class="ad-banner-wrapper my-4 text-center"><span class="text-muted d-block small mb-1" style="font-size: 0.70rem; letter-spacing: 0.5px; text-transform: uppercase;">${label}</span><div class="ad-container shadow-sm border-0 mb-0" style="min-height: 100px; background: #fafafa; border-radius: 8px;"><ins class="adsbygoogle" style="display:block" data-ad-client="${ADSENSE_CLIENT_ID}" data-ad-slot="1234567890" data-ad-format="auto" data-full-width-responsive="true"></ins><script>try { (adsbygoogle = window.adsbygoogle || []).push({}); } catch(e) {}</script></div></div>`;
}

function getAdSidebar() {
    return `<div class="col-lg-4 d-none d-lg-block"><div class="sticky-desktop-sidebar" style="position: sticky; top: 90px;"><div class="card shadow-sm border-0 rounded-4 bg-white p-3 mb-4 text-center"><span class="text-muted small fw-bold text-uppercase mb-2 d-block" style="font-size: 0.75rem;">Sponsored</span><div class="ad-container shadow-none border-0 mb-0" style="min-height: 280px; background: #f8fafc;"><ins class="adsbygoogle" style="display:block" data-ad-client="${ADSENSE_CLIENT_ID}" data-ad-slot="0987654321" data-ad-format="auto" data-full-width-responsive="true"></ins><script>try { (adsbygoogle = window.adsbygoogle || []).push({}); } catch(e) {}</script></div></div><div class="card shadow-sm border-0 rounded-4 bg-white p-4"><h5 class="fw-bold text-dark mb-3"><i class="bi bi-gear-wide-connected text-primary me-2"></i>Custom Exam</h5><p class="text-secondary small mb-3 lh-lg">Create your own test environment. Choose categories and set negative marking.</p><a href="/custom-exam.html" class="btn btn-outline-primary btn-sm w-100 rounded-pill fw-bold">Build Custom Test</a></div></div></div>`;
}

function getNavbar() {
    return `<nav class="navbar navbar-expand-lg navbar-light bg-white mb-4 shadow-sm py-3 border-bottom sticky-top"><div class="container"><a class="navbar-brand d-flex align-items-center" href="/index.html"><img src="/main_images/logo.png?v=${CACHE_BUSTER}" alt="Logo" height="40" onerror="this.style.display='none'"></a><button class="navbar-toggler border-0 shadow-none" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav"><span class="navbar-toggler-icon"></span></button><div class="collapse navbar-collapse" id="navbarNav"><ul class="navbar-nav ms-auto fw-semibold fs-6 gap-2 align-items-lg-center"><li class="nav-item"><a class="nav-link text-dark px-3 rounded-pill hover-bg-light" href="/index.html"><i class="bi bi-house-door me-1"></i>Home</a></li><li class="nav-item"><a class="nav-link text-dark px-3 rounded-pill hover-bg-light" href="/categories.html"><i class="bi bi-grid me-1"></i>Categories</a></li><li class="nav-item"><a class="nav-link text-primary px-3 rounded-pill bg-primary bg-opacity-10 fw-bold border border-primary-subtle" href="/custom-exam.html"><i class="bi bi-gear-wide-connected me-1"></i>Custom Exam</a></li><li class="nav-item"><a class="nav-link text-dark px-3 rounded-pill hover-bg-light" href="/tools.html"><i class="bi bi-tools me-1"></i>Tools</a></li><li class="nav-item"><a class="nav-link text-dark px-3 rounded-pill hover-bg-light" href="/blogs.html"><i class="bi bi-journal-text me-1"></i>Blog</a></li><li class="nav-item ms-lg-2" id="auth-nav-container"><button class="btn btn-outline-dark btn-sm rounded-pill px-4 fw-bold" data-bs-toggle="modal" data-bs-target="#authModal">Login / Join</button></li></ul></div></div></nav>`;
}

function getFooter() {
    return `<footer class="bg-white border-top py-5 mt-auto"><div class="container"><div class="row text-center text-md-start align-items-center"><div class="col-md-6 mb-3 mb-md-0"><p class="mb-0 text-muted small fw-medium">© ${new Date().getFullYear()} Wedugo Education. All Rights Reserved.</p></div><div class="col-md-6 text-md-end"><a href="/tools.html" class="text-secondary text-decoration-none small me-3 hover-text-primary">Study Tools</a><a href="/about.html" class="text-secondary text-decoration-none small me-3 hover-text-primary">About Us</a><a href="/privacy.html" class="text-secondary text-decoration-none small me-3 hover-text-primary">Privacy Policy</a><a href="/terms.html" class="text-secondary text-decoration-none small hover-text-primary">Terms of Service</a></div></div></div></footer>`;
}

function getHtmlShell(title, content, seoDescription = "") {
    const cleanDesc = (seoDescription || 'In-depth educational articles, study guides, and free custom MCQ mock tests to master your competitive exams at Wedugo Education.').replace(/"/g, '&quot;').substring(0, 160);
    return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${title} | Wedugo Education</title><meta name="description" content="${cleanDesc}"><link rel="icon" href="/main_images/icon.png" type="image/png"><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Merriweather:wght@400;700&display=swap" rel="stylesheet"><link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css"><link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet"><script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script><style>body { background-color: #f8fafc; font-family: 'Inter', sans-serif; color: #334155; display: flex; flex-direction: column; min-height: 100vh; }.card { border: none; border-radius: 16px; box-shadow: 0 4px 15px rgba(0,0,0,0.03); }.option-btn { text-align: left; padding: 16px 24px; font-weight: 500; font-size: 1.05rem; border-radius: 12px; border: 2px solid #e2e8f0; background: #ffffff; margin-bottom: 8px; color: #475569; }.option-btn.correct-show { background-color: #f0fdf4 !important; border-color: #22c55e !important; color: #15803d !important; }.option-btn.incorrect-show { background-color: #fef2f2 !important; border-color: #ef4444 !important; color: #b91c1c !important; }.timer-header { position: sticky; top: 70px; z-index: 1020; border-bottom: 4px solid #3b82f6; background: rgba(255,255,255,0.95); }</style></head><body>${getNavbar()}<div class="container flex-grow-1 pb-5 position-relative" id="main-content-area">${content}</div>${getFooter()}<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script><script>const _SU_URL = "${SUPABASE_URL}"; const _SU_KEY = "${SUPABASE_KEY}"; window.supabaseClient = window.supabase.createClient(_SU_URL, _SU_KEY);</script></body></html>`;
}

function getBreadcrumbs(pathArray) {
    let list = `<li class="breadcrumb-item"><a href="/index.html" class="text-decoration-none text-primary fw-medium"><i class="bi bi-house-door-fill me-1"></i>Home</a></li>`;
    pathArray.forEach((item, index) => {
        if(index === pathArray.length - 1) list += `<li class="breadcrumb-item active text-truncate fw-medium" aria-current="page">${item.name}</li>`;
        else list += `<li class="breadcrumb-item"><a href="${item.url}" class="text-decoration-none text-primary fw-medium">${item.name}</a></li>`;
    });
    return `<nav aria-label="breadcrumb" class="mb-4 mt-2"><ol class="breadcrumb bg-transparent p-0 mb-0">${list}</ol></nav>`;
}

function getIndexTemplate() {
    return getHtmlShell("Wedugo Education", `
        <div class="mt-4 mb-5 text-center"><h1 class="display-3 fw-bold text-dark mb-3">Learn & Master Your Exams</h1><p class="lead text-secondary col-md-8 mx-auto">High-quality editorial guides and practice tools for competitive exams.</p></div>
        <div id="home-loader" class="text-center py-5"><div class="spinner-border text-primary"></div></div>
        <div id="home-content" class="d-none"><div class="row g-4 mb-5" id="home-blogs"></div><div class="row g-4 mt-4" id="home-quizzes"></div></div>
        <script>
            document.addEventListener('DOMContentLoaded', async () => {
                const { data: blogs } = await window.supabaseClient.from('blog_posts').select('slug, title, category, created_at').order('created_at', { ascending: false }).limit(6);
                if(blogs) {
                    let html = ''; blogs.forEach(b => { html += \`<div class="col-md-4"><a href="/blog.html?slug=\${b.slug}" class="card h-100 p-4 shadow-sm text-decoration-none bg-white"><span class="text-primary small fw-bold mb-2">\${b.category}</span><h3 class="h5 fw-bold text-dark">\${b.title}</h3></a></div>\`; });
                    document.getElementById('home-blogs').innerHTML = html;
                }
                const { data: qData } = await window.supabaseClient.from('questions').select('id, qcategory, question').limit(4);
                if(qData) {
                    let qHtml = ''; qData.forEach(q => { qHtml += \`<div class="col-md-6"><div class="card p-4 bg-white shadow-sm"><span class="badge bg-light text-dark mb-2">\${q.qcategory}</span><h5 class="fw-bold text-dark mb-3">\${q.question}</h5><a href="/mcq.html?id=\${q.id}" class="btn btn-sm btn-outline-primary fw-bold">Solve Question</a></div></div>\`; });
                    document.getElementById('home-quizzes').innerHTML = qHtml;
                }
                document.getElementById('home-loader').classList.add('d-none'); document.getElementById('home-content').classList.remove('d-none');
            });
        </script>
    `);
}

function getCategoriesTemplate() {
    let catsHtml = CATEGORY_LIST.map(cat => `<div class="col-md-4"><a href="/category.html?name=${encodeURIComponent(cat)}" class="card shadow-sm h-100 bg-white text-decoration-none p-4 text-center"><h3 class="h5 fw-bold text-dark">${cat}</h3></a></div>`).join('');
    return getHtmlShell("Categories", `${getBreadcrumbs([{name: 'Categories', url: '/categories.html'}])}<h1 class="display-6 fw-bold mb-4">All MCQ Categories</h1><div class="row g-4">${catsHtml}</div>`);
}

function getCategoryTemplate() {
    return getHtmlShell("Study Hub", `
        <h1 class="display-6 fw-bold mb-4" id="cat-title">Study Hub</h1>
        <div class="mb-4"><a id="btn-start-mock" href="#" class="btn btn-primary btn-lg fw-bold rounded-pill px-5">Start 10-Q Timed Mock Test</a></div>
        <h3 class="fw-bold mb-3">Question Bank</h3>
        <div id="mcq-list" class="list-group shadow-sm mb-4"></div>
        <script>
            const catName = new URLSearchParams(window.location.search).get('name');
            document.addEventListener('DOMContentLoaded', async () => {
                if(!catName) return;
                document.getElementById('cat-title').innerText = catName + " - Study Hub";
                document.getElementById('btn-start-mock').href = "/mock.html?cat=" + encodeURIComponent(catName);
                const { data } = await window.supabaseClient.from('questions').select('id, question').eq('qcategory', catName).limit(30);
                if(data) {
                    let html = ''; data.forEach((q, i) => { html += \`<a href="/mcq.html?id=\${q.id}" class="list-group-item list-group-item-action p-3"><strong>Q\${i+1}.</strong> \${q.question}</a>\`; });
                    document.getElementById('mcq-list').innerHTML = html;
                }
            });
        </script>
    `);
}

function getMcqTemplate() {
    return getHtmlShell("View MCQ", `
        <div id="mcq-content" class="card p-5 bg-white shadow-sm">
            <h3 class="fw-bold text-dark mb-4" id="q-text">Loading...</h3>
            <div class="d-grid gap-3 mb-4" id="q-opts"></div>
            <div id="q-exp" class="alert alert-success d-none p-4"></div>
        </div>
        <script>
            document.addEventListener('DOMContentLoaded', async () => {
                const id = new URLSearchParams(window.location.search).get('id');
                const { data } = await window.supabaseClient.from('questions').select('*').eq('id', id).single();
                if(data) {
                    document.getElementById('q-text').innerText = data.question;
                    const opts = { 'A': data.answer1, 'B': data.answer2, 'C': data.answer3, 'D': data.answer4 };
                    let html = ''; for(let k in opts) { html += \`<button class="btn option-btn" onclick="checkAns(this, '\${k}', '\${data.mainanswer}', \` + JSON.stringify(data.answerdetail || '') + \`)">\${k}) \${opts[k]}</button>\`; }
                    document.getElementById('q-opts').innerHTML = html;
                }
            });
            function checkAns(btn, selected, correctAns, expText) {
                const correct = (correctAns || '').replace(/[^A-D]/gi, '').toUpperCase();
                document.querySelectorAll('.option-btn').forEach(b => b.disabled = true);
                if(selected === correct) { btn.classList.add('correct-show'); } else { btn.classList.add('incorrect-show'); }
                const exp = document.getElementById('q-exp'); exp.innerText = "Solution: " + expText; exp.classList.remove('d-none');
            }
        </script>
    `);
}

function getMockTemplate() {
    return getHtmlShell("Mock Test", `
        <div class="card p-5 bg-white shadow-sm">
            <h2 class="fw-bold mb-4" id="mock-heading">Timed Mock Test</h2>
            <div id="mock-body">Loading questions...</div>
            <button class="btn btn-primary mt-4 fw-bold px-4 py-2" id="sub-btn" onclick="submitMock()">Submit Test</button>
            <div id="score-box" class="mt-4 fw-bold fs-4 text-success"></div>
        </div>
        <script>
            let mData = [];
            document.addEventListener('DOMContentLoaded', async () => {
                const cat = new URLSearchParams(window.location.search).get('cat');
                const { data } = await window.supabaseClient.from('questions').select('*').eq('qcategory', cat).limit(40);
                if(data) {
                    mData = data.sort(() => 0.5 - Math.random()).slice(0, 10);
                    let html = ''; mData.forEach((q, i) => {
                        html += \`<div class="mb-4 pb-3 border-bottom"><h5 class="fw-bold">Q\${i+1}. \${q.question}</h5><div class="d-grid gap-2 mt-2"><button class="btn option-btn py-2" onclick="sel(\${i}, 'A', this)">A) \${q.answer1}</button><button class="btn option-btn py-2" onclick="sel(\${i}, 'B', this)">B) \${q.answer2}</button><button class="btn option-btn py-2" onclick="sel(\${i}, 'C', this)">C) \${q.answer3}</button><button class="btn option-btn py-2" onclick="sel(\${i}, 'D', this)">D) \${q.answer4}</button></div></div>\`;
                    });
                    document.getElementById('mock-body').innerHTML = html;
                }
            });
            const uAns = {};
            function sel(qIdx, opt, btn) {
                btn.parentElement.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected'); uAns[qIdx] = opt;
            }
            function submitMock() {
                let score = 0;
                mData.forEach((q, i) => {
                    const corr = (q.mainanswer||'').replace(/[^A-D]/gi, '').toUpperCase();
                    if(uAns[i] === corr) score++;
                });
                document.getElementById('score-box.innerText = "Final Score: " + score + " / 10";
                window.scrollTo(0,0);
            }
        </script>
    `);
}

function getToolsTemplate() {
    return getHtmlShell("Study Tools", `${getBreadcrumbs([{name: 'Tools', url: '/tools.html'}])}<h1 class="display-6 fw-bold mb-4">Study Tools</h1><div class="card p-4 bg-white"><h4>Exam Score Estimator</h4><input type="number" id="c" class="form-control mb-2" placeholder="Correct"><input type="number" id="w" class="form-control mb-2" placeholder="Incorrect"><button class="btn btn-primary" onclick="alert(((document.getElementById('c').value||0) - (document.getElementById('w').value||0)*0.25).toFixed(2))">Calculate</button></div>`);
}

function getBlogsTemplate() {
    return getHtmlShell("Blogs", `${getBreadcrumbs([{name: 'Blogs', url: '/blogs.html'}])}<h1 class="display-6 fw-bold mb-4">Guides</h1><div id="b-list"></div><script>document.addEventListener('DOMContentLoaded', async()=>{const {data}=await window.supabaseClient.from('blog_posts').select('*');if(data){let h='';data.forEach(b=>{h+=\`<div class="card p-3 mb-3"><a href="/blog.html?slug=\${b.slug}" class="fw-bold text-decoration-none">\${b.title}</a></div>\`;});document.getElementById('b-list').innerHTML=h;}});</script>`);
}

function getSingleBlogTemplate() {
    return getHtmlShell("Article", `<div class="card p-5 bg-white"><h1 class="fw-bold mb-4" id="btitle"></h1><div id="bbody"></div></div><script>document.addEventListener('DOMContentLoaded', async()=>{const s=new URLSearchParams(window.location.search).get('slug');const {data}=await window.supabaseClient.from('blog_posts').select('*').eq('slug', s).single();if(data){document.getElementById('btitle').innerText=data.title;document.getElementById('bbody').innerHTML=data.content;}});</script>`);
}

function getStaticPageTemplate(title, body) {
    return getHtmlShell(title, `<div class="card p-5 bg-white"><h1 class="fw-bold mb-4">${title}</h1>${body}</div>`);
}

async function buildSite() {
    const root = __dirname;
    await fsAsync.writeFile(path.join(root, 'index.html'), getIndexTemplate());
    await fsAsync.writeFile(path.join(root, 'categories.html'), getCategoriesTemplate());
    await fsAsync.writeFile(path.join(root, 'tools.html'), getToolsTemplate());
    await fsAsync.writeFile(path.join(root, 'blogs.html'), getBlogsTemplate());
    await fsAsync.writeFile(path.join(root, 'custom-exam.html'), getCategoriesTemplate());
    await fsAsync.writeFile(path.join(root, 'mcq.html'), getMcqTemplate());
    await fsAsync.writeFile(path.join(root, 'category.html'), getCategoryTemplate());
    await fsAsync.writeFile(path.join(root, 'mock.html'), getMockTemplate());
    await fsAsync.writeFile(path.join(root, 'blog.html'), getSingleBlogTemplate());
    await fsAsync.writeFile(path.join(root, 'about.html'), getStaticPageTemplate('About Us', '<p>Wedugo Education portal.</p>'));
    await fsAsync.writeFile(path.join(root, 'privacy.html'), getStaticPageTemplate('Privacy Policy', '<p>Privacy terms.</p>'));
    await fsAsync.writeFile(path.join(root, 'terms.html'), getStaticPageTemplate('Terms', '<p>Terms and conditions.</p>'));
    await fsAsync.writeFile(path.join(root, '404.html'), getStaticPageTemplate('404', '<p>Page not found.</p><a href="/">Home</a>'));
    console.log("Build complete.");
}
buildSite();
