const fs = require('fs');
const fsAsync = require('fs').promises;
const path = require('path');

// ==========================================
// CONFIGURATION & URLS
// ==========================================
const QUIZ_SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQSnJP6ImRuS24j_tOTKA_i1QG_K-DKutrWxjjSbi4WszrZxR90g_1uNaXQqOjnxR2tX9flEFXy7qfY/pub?gid=0&single=true&output=csv";
const BLOG_SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQrpdugY1OXmb7Pzer-sjOixONsm2wix3Xg29fl6WGVEaNmvL_U0aKv21RKpZRtedHHpqp4l7C-Mk7m/pub?output=csv";
const SITE_BASE_URL = "https://www.wedugo.com"; 
const ADSENSE_CLIENT_ID = "ca-pub-5947676189341600";
const POSTS_PER_PAGE = 10;

const CATEGORY_LIST = [
    "Indian Geography","World Organisations","Inventions","Physics","Indian Economy","Days and Years","Technology","Chemistry","Honours and Awards","General Science","General Knowledge","Reasoning","Civil Engineering","Hindi","Sports","Computer","Biology","World Geography","Famous Personalities","Aptitude","Madhya Pradesh GK","Solar System","English","Series","Average","Sets","Percentage","Simple Interest","Surds and Indices","Ratio and Proportion","Time and Work","Trains Time","Age","Area","Profit and Loss","Calendar","Simplification","Indian Polity and Constitution","Indian History","World History","History","Environmental Science and Ecology","Blood Relation","Biochemistry","Fats and Fatty Acid Metabolism","Vitamins","Enzymes","Mineral Metabolism","Hormone Metabolism","Distance and Direction","Nucleic Acids","Water and Electrolyte Balance","History of Microbiology","Microbiology","Bacteria and Gram Staining","Agriculture","Solid Mechanics","Child Development and Pedagogy","Virus","Pharmacology","Anatomy","Psychology","Indian General Knowledge"
];

// ==========================================
// ADVANCED CSV PARSER
// ==========================================
function parseFullCSV(text) {
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

function chunkArray(array, size) {
    const chunked = [];
    for (let i = 0; i < array.length; i += size) chunked.push(array.slice(i, i + size));
    return chunked;
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================
function getDifficultyData(questionStr) {
    const len = (questionStr || "").length;
    if (len < 50) return { label: 'Easy', time: '30 sec', color: 'success' };
    if (len > 120) return { label: 'Hard', time: '90 sec', color: 'danger' };
    return { label: 'Medium', time: '60 sec', color: 'warning' };
}

// ==========================================
// ADVERTISEMENT & UI COMPONENTS
// ==========================================
function getAdBannerHtml(label = "Advertisement") {
    return `
        <div class="ad-banner-wrapper my-4 text-center">
            <span class="text-muted d-block small mb-1" style="font-size: 0.70rem; letter-spacing: 0.5px; text-transform: uppercase;">${label}</span>
            <div class="ad-container shadow-sm border-0 mb-0" style="min-height: 100px; background: #fafafa; border-radius: 8px;">
                <ins class="adsbygoogle" style="display:block" data-ad-client="${ADSENSE_CLIENT_ID}" data-ad-format="auto" data-full-width-responsive="true"></ins>
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
                        <ins class="adsbygoogle" style="display:block" data-ad-client="${ADSENSE_CLIENT_ID}" data-ad-format="auto" data-full-width-responsive="true"></ins>
                        <script>try { (adsbygoogle = window.adsbygoogle || []).push({}); } catch(e) {}</script>
                    </div>
                </div>
                <div class="card shadow-sm border-0 rounded-4 bg-white p-4">
                    <h5 class="fw-bold text-dark mb-3"><i class="bi bi-journal-bookmark-fill text-primary me-2"></i>Study Resources</h5>
                    <p class="text-secondary small mb-3 lh-lg">Enhance your preparation with our curated articles and timed mock tests. Master the concepts before taking the exams.</p>
                    <a href="/categories/index.html" class="btn btn-outline-primary btn-sm w-100 rounded-pill fw-bold">Explore Categories</a>
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

// FIXED: Navbar with all Tabs including About and Categories
function getNavbar(depth) {
    const prefix = depth === 0 ? '.' : '../'.repeat(depth).slice(0, -1);
    const cacheBuster = new Date().getTime(); 
    return `
    <nav class="navbar navbar-expand-lg navbar-light bg-white mb-4 shadow-sm py-3 border-bottom sticky-top">
        <div class="container">
            <a class="navbar-brand d-flex align-items-center" href="${prefix}/index.html">
                <img src="${prefix}/main_images/logo.png?v=${cacheBuster}" alt="Wedugo Logo" height="40" onerror="this.style.display='none'">
            </a>
            <button class="navbar-toggler border-0 shadow-none" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav ms-auto fw-semibold fs-6 gap-2">
                    <li class="nav-item"><a class="nav-link text-dark px-3 rounded-pill hover-bg-light" href="${prefix}/index.html"><i class="bi bi-house-door me-1"></i>Home</a></li>
                    <li class="nav-item"><a class="nav-link text-dark px-3 rounded-pill hover-bg-light" href="${prefix}/categories/index.html"><i class="bi bi-grid me-1"></i>Categories</a></li>
                    <li class="nav-item"><a class="nav-link text-dark px-3 rounded-pill hover-bg-light" href="${prefix}/mock-tests/index.html"><i class="bi bi-stopwatch me-1"></i>Mock Tests</a></li>
                    <li class="nav-item"><a class="nav-link text-dark px-3 rounded-pill hover-bg-light" href="${prefix}/mcqs/index.html"><i class="bi bi-list-check me-1"></i>MCQs</a></li>
                    <li class="nav-item"><a class="nav-link text-dark px-3 rounded-pill hover-bg-light" href="${prefix}/topic/index.html"><i class="bi bi-journal-text me-1"></i>Blog</a></li>
                    <li class="nav-item"><a class="nav-link text-dark px-3 rounded-pill hover-bg-light" href="${prefix}/about/index.html"><i class="bi bi-info-circle me-1"></i>About</a></li>
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
                    <a href="${prefix}/about/index.html" class="text-secondary text-decoration-none small me-3 hover-text-primary">About Us</a>
                    <a href="${prefix}/privacy.html" class="text-secondary text-decoration-none small me-3 hover-text-primary">Privacy Policy</a>
                    <a href="${prefix}/terms.html" class="text-secondary text-decoration-none small hover-text-primary">Terms of Service</a>
                </div>
            </div>
        </div>
    </footer>`;
}

// UNIFIED HTML SHELL (Thin Content Mitigation included)
function getHtmlShell(title, content, depth, seoDescription = "", isThinPage = false) {
    const cleanDesc = (seoDescription || 'In-depth educational articles, study guides, and free MCQ mock tests to master your competitive exams at Wedugo Education.').replace(/"/g, '&quot;').substring(0, 160);
    const prefix = depth === 0 ? '.' : '../'.repeat(depth).slice(0, -1);
    
    // THIN CONTENT FIX: Single MCQs get No-Index so Google doesn't penalize the site.
    const metaRobots = isThinPage ? `<meta name="robots" content="noindex, follow">` : `<meta name="robots" content="index, follow">`;
    const displayTitle = title.includes("Wedugo Education") ? title : `${title} | Wedugo Education`;

    return `<!DOCTYPE html>
<html lang="hi">
<head>
    <meta charset="UTF-8">
    ${metaRobots}
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-23NQJXPC86"></script>
    <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-23NQJXPC86');</script>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${displayTitle}</title>
    <meta name="description" content="${cleanDesc}">
    <link rel="icon" href="${prefix}/main_images/icon.png" type="image/png">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Merriweather:wght@400;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}" crossorigin="anonymous"></script>
    <script type='text/javascript' src='https://platform-api.sharethis.com/js/sharethis.js#property=5c5059d8c9830d001319b017&product=inline-share-buttons' async='async'></script>
    <style>
        body { background-color: #f8fafc; font-family: 'Inter', sans-serif; color: #334155; display: flex; flex-direction: column; min-height: 100vh; }
        .hover-bg-light:hover { background-color: #f1f5f9; color: #0d6efd !important; }
        .hover-text-primary:hover { color: #0d6efd !important; }
        .card { border: none; border-radius: 16px; box-shadow: 0 4px 15px rgba(0,0,0,0.03); transition: transform 0.3s ease, box-shadow 0.3s ease; }
        .card-hover:hover { transform: translateY(-5px); box-shadow: 0 15px 30px rgba(0,0,0,0.08) !important; }
        
        /* High-Value Blog Styles */
        .blog-title { font-family: 'Inter', sans-serif; font-weight: 800; letter-spacing: -0.5px; line-height: 1.2; }
        .article-content { font-family: 'Merriweather', serif; font-size: 1.15rem; color: #1e293b; line-height: 1.9; }
        .article-content h2, .article-content h3 { font-family: 'Inter', sans-serif; font-weight: 700; margin-top: 2rem; margin-bottom: 1rem; color: #0f172a; }
        .article-content img { max-width: 100%; height: auto; border-radius: 12px; margin: 2rem 0; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
        .badge-cat { font-size: 0.75rem; padding: 0.5em 1em; letter-spacing: 0.5px; border-radius: 6px; text-transform: uppercase; font-weight: 700;}
        
        /* Quiz Styles */
        .option-btn { text-align: left; padding: 16px 24px; font-weight: 500; font-size: 1.05rem; border-radius: 12px; border: 2px solid #e2e8f0; background: #ffffff; transition: all 0.2s; color: #475569; }
        .option-btn:hover:not(:disabled) { background-color: #f8fafc; border-color: #cbd5e1; transform: translateX(5px); }
        .option-btn.selected { background-color: #eff6ff; border-color: #3b82f6; color: #1d4ed8; }
        .option-btn.correct-show { background-color: #f0fdf4 !important; border-color: #22c55e !important; color: #15803d !important; font-weight: 600; }
        .option-btn.incorrect-show { background-color: #fef2f2 !important; border-color: #ef4444 !important; color: #b91c1c !important; }
        .timer-header { position: sticky; top: 70px; z-index: 1020; border-bottom: 4px solid #3b82f6; background: rgba(255,255,255,0.95); backdrop-filter: blur(8px); }
    </style>
</head>
<body>
    ${getNavbar(depth)}
    <div class="container flex-grow-1 pb-5">
        ${content}
    </div>
    ${getFooter(depth)}
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
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

// ==========================================
// UNIFIED SITEMAP GENERATOR
// ==========================================
async function generateSitemapAndRobots(distDir, quizCategoriesMap, blogPosts, blogCategoriesMap) {
    const today = new Date().toISOString().split('T')[0];
    const urls = [];

    // Core Pages
    urls.push({ loc: `${SITE_BASE_URL}/`, priority: '1.0', changefreq: 'daily' }); 
    urls.push({ loc: `${SITE_BASE_URL}/categories/index.html`, priority: '0.9', changefreq: 'weekly' });
    urls.push({ loc: `${SITE_BASE_URL}/mock-tests/index.html`, priority: '0.9', changefreq: 'weekly' });
    urls.push({ loc: `${SITE_BASE_URL}/mcqs/index.html`, priority: '0.9', changefreq: 'weekly' });
    urls.push({ loc: `${SITE_BASE_URL}/topic/index.html`, priority: '0.9', changefreq: 'weekly' });
    urls.push({ loc: `${SITE_BASE_URL}/about/index.html`, priority: '0.5', changefreq: 'monthly' });

    // Blog Category & Posts
    for (const [catName] of Object.entries(blogCategoriesMap)) {
        const safeName = catName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        urls.push({ loc: `${SITE_BASE_URL}/topic/${safeName}/index.html`, priority: '0.8', changefreq: 'weekly' });
    }
    blogPosts.forEach(post => {
        urls.push({ loc: `${SITE_BASE_URL}/post/${post.urlSlug}/index.html`, priority: '0.9', changefreq: 'monthly' });
    });

    // Quiz Categories, Sets & MCQ Lists
    const QUESTIONS_PER_PAGE = 10;
    for (const [cat, quizzes] of Object.entries(quizCategoriesMap)) {
        if (!quizzes || quizzes.length === 0) continue;
        const safeName = cat.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        urls.push({ loc: `${SITE_BASE_URL}/categories/${safeName}/index.html`, priority: '0.8', changefreq: 'weekly' });
        urls.push({ loc: `${SITE_BASE_URL}/mcqs/${safeName}/index.html`, priority: '0.7', changefreq: 'weekly' });

        const totalSets = Math.ceil(quizzes.length / QUESTIONS_PER_PAGE);
        for (let s = 1; s <= totalSets; s++) {
            urls.push({ loc: `${SITE_BASE_URL}/mock-tests/${safeName}/set-${s}.html`, priority: '0.6', changefreq: 'monthly' });
        }
    }

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
    for (const u of urls) xml += `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>\n`;
    xml += `</urlset>`;

    await fsAsync.writeFile(path.join(distDir, 'sitemap.xml'), xml, 'utf8');
    const robotsTxt = `User-agent: *\nAllow: /\n\n# Unified Fast Indexing Sitemap\nSitemap: ${SITE_BASE_URL}/sitemap.xml\n`;
    await fsAsync.writeFile(path.join(distDir, 'robots.txt'), robotsTxt, 'utf8');
}

async function executeTasksInBatches(tasks, batchSize = 50) {
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
        const [quizRes, blogRes] = await Promise.all([ fetch(QUIZ_SHEET_CSV_URL), fetch(BLOG_SHEET_CSV_URL) ]);
        const allQuizRows = parseFullCSV(await quizRes.text());
        const allBlogRows = parseFullCSV(await blogRes.text());

        // --- PREPARE DATA ---
        const quizHeaders = allQuizRows[0].map(h => h.toLowerCase());
        const quizCategoriesMap = {};
        CATEGORY_LIST.forEach(cat => quizCategoriesMap[cat] = []);
        quizCategoriesMap['Uncategorized'] = [];

        allQuizRows.slice(1).reverse().forEach((values, index) => {
            if (values.length < quizHeaders.length) return;
            const q = {}; quizHeaders.forEach((h, i) => q[h] = values[i]);
            if (!q.question || q.question.includes('à¤')) return;
            let matchedCat = 'Uncategorized';
            const sheetCat = (q.qcategory || '').trim().toLowerCase();
            for (const officialCat of CATEGORY_LIST) {
                if (officialCat.toLowerCase() === sheetCat) { matchedCat = officialCat; break; }
            }
            q.quizId = q.id || index; q.matchedCategory = matchedCat;
            quizCategoriesMap[matchedCat].push(q);
        });

        const blogHeaders = allBlogRows[0].map(h => h.toLowerCase());
        const blogPosts = []; const blogCategoriesMap = {};

        allBlogRows.slice(1).reverse().forEach((values, index) => {
            if (values.length < blogHeaders.length) return; 
            const post = {}; blogHeaders.forEach((h, i) => post[h] = values[i]);
            if (!post.title || !post.content) return; 
            post.postId = post.id || index; post.cat = post.category || 'General';
            post.urlSlug = (post.slug || post.title || post.postId).toString().trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
            if (!blogCategoriesMap[post.cat]) blogCategoriesMap[post.cat] = [];
            blogCategoriesMap[post.cat].push(post); blogPosts.push(post);
        });

        const masterPageTasks = [];

        // ======================================
        // 2. GENERATE BLOG 
        // ======================================
        console.log("2. Generating Blog (High-Value Content)...");
        const postMainDir = path.join(distDir, 'post');
        fs.mkdirSync(postMainDir, { recursive: true });

        blogPosts.forEach((post) => {
            const postDir = path.join(postMainDir, post.urlSlug);
            fs.mkdirSync(postDir, { recursive: true });

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
                        ${getAdBannerHtml("Sponsored")}
                        <div class="card p-4 p-md-5 mb-5 shadow-sm border-0 bg-white">
                            <article class="article-content">${post.content}</article>
                        </div>
                        ${getAdBannerHtml("Sponsored")}
                        <div class="card shadow-sm p-4 bg-light text-center mb-5 border-0 rounded-4">
                            <h3 class="h5 fw-bold text-dark text-uppercase mb-3">Share & Discuss</h3>
                            <div class="sharethis-inline-reaction-buttons mb-4"></div>
                            <div class="text-start border-top pt-4 border-secondary border-opacity-25">
                                ${getDisqusEmbed(`blog_${post.postId}`, `post/${post.urlSlug}/index.html`)}
                            </div>
                        </div>
                    </div>
                    ${getAdSidebar()}
                </div>
            `;
            masterPageTasks.push(async () => { await fsAsync.writeFile(path.join(postDir, 'index.html'), getHtmlShell(post.title, articleContent, 2, post.seo_description || post.title, false)); });
        });

        // BLOG PAGINATION
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
        // 3. GENERATE CATEGORIES & MOCK TESTS & MCQs
        // ======================================
        console.log("3. Generating Categories, Mock Tests, and Single MCQs...");
        
        const catMainDir = path.join(distDir, 'categories');
        const mockTestsDir = path.join(distDir, 'mock-tests');
        const mcqsMainDir = path.join(distDir, 'mcqs');
        
        fs.mkdirSync(catMainDir, { recursive: true });
        fs.mkdirSync(mockTestsDir, { recursive: true });
        fs.mkdirSync(mcqsMainDir, { recursive: true });

        let allCategoriesGridHtml = '<div class="row g-4">';
        let globallyGeneratedSets = [];

        for (const [cat, quizzes] of Object.entries(quizCategoriesMap)) {
            if (!quizzes || quizzes.length === 0) continue; 
            const safeName = cat.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            
            // Dirs
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
                if (globallyGeneratedSets.length < 6) {
                    globallyGeneratedSets.push({ category: cat, safeName: safeName, setNumber: setNumber, link: `../mock-tests/${safeName}/${setFileName}` });
                }

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
                                ${getAdBannerHtml("Sponsored")}
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
                            ${getAdSidebar()}
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

            // B) Single MCQs
            let mcqListHtml = '<div class="list-group shadow-sm border-0 rounded-4 mb-5">';
            quizzes.forEach((q, i) => {
                const singleMcqDir = path.join(mcqSubjectDir, String(q.quizId));
                mcqListHtml += `<a href="../../mcqs/${safeName}/${q.quizId}/index.html" class="list-group-item list-group-item-action p-4 border-light"><strong>Q${i+1}.</strong> ${q.question.substring(0, 80)}...</a>`;

                masterPageTasks.push(async () => {
                    await fsAsync.mkdir(singleMcqDir, { recursive: true });
                    const prevQ = quizzes[i - 1]; const nextQ = quizzes[i + 1];
                    const navButtonsHtml = `
                        <div class="d-flex justify-content-between align-items-center mt-5 pt-4 border-top">
                            ${prevQ ? `<a href="../${prevQ.quizId}/index.html" class="btn btn-outline-secondary fw-bold px-4 rounded-pill"><i class="bi bi-arrow-left me-2"></i>Prev</a>` : `<button class="btn btn-outline-secondary fw-bold px-4 rounded-pill" disabled><i class="bi bi-arrow-left me-2"></i>Prev</button>`}
                            ${nextQ ? `<a href="../${nextQ.quizId}/index.html" class="btn btn-primary fw-bold px-4 rounded-pill shadow-sm">Next<i class="bi bi-arrow-right ms-2"></i></a>` : `<button class="btn btn-primary fw-bold px-4 rounded-pill shadow-sm" disabled>Next<i class="bi bi-arrow-right ms-2"></i></button>`}
                        </div>
                    `;

                    const mcqContent = `
                        ${getBreadcrumbs(3, cat, safeName, 'Question ' + q.quizId, 'mcq')}
                        <div class="row">
                            <div class="col-lg-8">
                                ${getAdBannerHtml("Sponsored")}
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
                            </div>
                            ${getAdSidebar()}
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
                    // 🔥 THIN CONTENT FIX: isThinPage = true (NoIndex for single questions)
                    await fsAsync.writeFile(path.join(singleMcqDir, 'index.html'), getHtmlShell(`Q${q.quizId}: ${cat} MCQ`, mcqContent, 3, q.question, true));
                });
            });
            mcqListHtml += '</div>';

            // C) Category Study Hub (/categories/[cat]/index.html)
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

                    ${getAdBannerHtml("Sponsored")}

                    <h3 class="fw-bold mb-4 mt-5" id="mock-sets">Available Mock Test Sets</h3>
                    ${practiceSetsHtml}
                `;
                await fsAsync.writeFile(path.join(catSubjectDir, 'index.html'), getHtmlShell(`${cat} MCQs & Mock Tests`, catPageContent, 2, "", false));
            });

            // D) MCQs Subject List Page (/mcqs/[cat]/index.html)
            masterPageTasks.push(async () => {
                const mcqCatPageContent = `
                    ${getBreadcrumbs(2, cat, safeName, '', 'mcq')}
                    <h1 class="display-6 blog-title mb-4 text-dark mt-3">${cat} - All MCQs</h1>
                    ${getAdBannerHtml("Sponsored")}
                    ${mcqListHtml}
                `;
                await fsAsync.writeFile(path.join(mcqSubjectDir, 'index.html'), getHtmlShell(`${cat} Single MCQs List`, mcqCatPageContent, 2, "", false));
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
            // /categories/index.html
            await fsAsync.writeFile(path.join(catMainDir, 'index.html'), getHtmlShell('All MCQ Categories', `
                ${getBreadcrumbs(1, '', '', 'Categories Hub', 'cat')}
                <h1 class="display-6 blog-title mb-4 text-dark mt-3">All MCQ Categories</h1>
                <p class="text-secondary mb-5">Select a subject to access mock tests and individual questions.</p>
                ${getAdBannerHtml("Sponsored")}
                ${allCategoriesGridHtml}
            `, 1, "", false));
            
            // /mock-tests/index.html
            await fsAsync.writeFile(path.join(mockTestsDir, 'index.html'), getHtmlShell('Mock Tests Hub', `
                ${getBreadcrumbs(1, '', '', 'Mock Tests Hub', 'mock')}
                <h1 class="display-6 blog-title mb-4 text-dark mt-3">Mock Test Subjects</h1>
                <p class="text-secondary mb-5">Select a subject to access timed practice tests.</p>
                ${getAdBannerHtml("Sponsored")}
                ${allCategoriesGridHtml.replace(/\.\/([\w-]+)\/index\.html/g, '../categories/$1/index.html')}
            `, 1, "", false));

            // /mcqs/index.html
            await fsAsync.writeFile(path.join(mcqsMainDir, 'index.html'), getHtmlShell('Browse All MCQs', `
                ${getBreadcrumbs(1, '', '', 'MCQs Hub', 'mcq')}
                <h1 class="display-6 blog-title mb-4 text-dark mt-3">Browse MCQs by Topic</h1>
                <p class="text-secondary mb-5">Select a subject to practice questions one by one.</p>
                ${getAdBannerHtml("Sponsored")}
                ${allCategoriesGridHtml.replace(/\.\/([\w-]+)\/index\.html/g, '../categories/$1/index.html')}
            `, 1, "", false));
        });

        // ======================================
        // 4. HOMEPAGE (/index.html) -> BLOG ROOT
        // ======================================
        console.log("4. Generating Blog Root Homepage...");
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

            const homeContent = `
                <div class="mt-4 mb-5 text-center">
                    <h1 class="display-3 blog-title text-dark mb-3">Learn & Master Your Exams</h1>
                    <p class="lead text-secondary col-md-8 mx-auto">High-quality editorial guides, deep concepts, and extensive practice tools for modern competitive examinations.</p>
                </div>
                ${topBlogHtml}
                ${getAdBannerHtml("Ad")}
                <div class="text-center mt-5 mb-5">
                    <a href="./page/1/index.html" class="btn btn-outline-dark btn-lg rounded-pill px-5 fw-bold">View All Articles</a>
                </div>
                
                <div class="mt-5 pt-5 border-top">
                    <div class="d-flex justify-content-between align-items-end mb-4">
                        <h2 class="blog-title text-dark mb-0">Ready to Practice?</h2>
                    </div>
                    <div class="row g-3 text-center">
                        <div class="col-md-4">
                            <a href="./categories/index.html" class="card bg-primary text-white border-0 p-4 text-decoration-none card-hover rounded-4 h-100">
                                <h4 class="fw-bold mb-0"><i class="bi bi-grid me-2"></i>All Categories</h4>
                            </a>
                        </div>
                        <div class="col-md-4">
                            <a href="./mock-tests/index.html" class="card bg-success text-white border-0 p-4 text-decoration-none card-hover rounded-4 h-100">
                                <h4 class="fw-bold mb-0"><i class="bi bi-stopwatch me-2"></i>Mock Tests</h4>
                            </a>
                        </div>
                        <div class="col-md-4">
                            <a href="./mcqs/index.html" class="card bg-light text-dark border-0 p-4 text-decoration-none card-hover rounded-4 h-100">
                                <h4 class="fw-bold mb-0"><i class="bi bi-list-check me-2"></i>Single MCQs</h4>
                            </a>
                        </div>
                    </div>
                </div>
            `;
            await fsAsync.writeFile(path.join(distDir, 'index.html'), getHtmlShell('Wedugo Education: Expert Exam Guides & Mock Tests', homeContent, 0, "", false));
        });

        // ======================================
        // 5. POLICIES & ABOUT
        // ======================================
        const aboutDir = path.join(distDir, 'about');
        fs.mkdirSync(aboutDir, { recursive: true });
        masterPageTasks.push(async () => {
            const aboutContent = `
                ${getBreadcrumbs(1, '', '', 'About Us', 'blog')}
                <div class="card shadow-sm p-4 p-md-5 border-0 rounded-4 bg-white mt-4">
                    <h1 class="blog-title text-dark mb-4 display-5">About Wedugo Education</h1>
                    <p class="fs-5 text-secondary lh-lg mb-5">Wedugo Education is an authoritative editorial platform dedicated to providing students with high-quality study materials, in-depth conceptual guides, and robust examination practice tools.</p>
                    <div class="row g-5">
                        <div class="col-md-6">
                            <h3 class="h4 fw-bold mb-3 text-dark">Our Editorial Standard</h3>
                            <p class="text-secondary lh-lg">Every article and mock test on Wedugo is designed to meet strict educational standards, ensuring you receive factual, up-to-date, and highly relevant content to boost your competitive edge.</p>
                        </div>
                        <div class="col-md-6">
                            <h3 class="h4 fw-bold mb-3 text-dark">Contact Us</h3>
                            <p class="text-secondary lh-lg">For inquiries, partnerships, or editorial feedback, please reach out to us via our primary contact channels.</p>
                        </div>
                    </div>
                </div>
            `;
            await fsAsync.writeFile(path.join(aboutDir, 'index.html'), getHtmlShell('About Us: Editorial Mission', aboutContent, 1, "", false));
        });

        masterPageTasks.push(async () => {
            const privacyContent = `
                ${getBreadcrumbs(0, '', '', 'Privacy Policy', 'blog')}
                <div class="card shadow-sm p-4 p-md-5 border-0 rounded-4 bg-white mt-4">
                    <h1 class="blog-title mb-4">Privacy Policy for Wedugo Education</h1>
                    <p class="text-secondary lh-lg">At Wedugo Education, accessible from wedugo.com, one of our main priorities is the privacy of our visitors. This Privacy Policy document contains types of information that is collected and recorded by Wedugo Education and how we use it.</p>
                    <h3 class="mt-4 fw-bold">Google DoubleClick DART Cookie</h3>
                    <p class="text-secondary lh-lg">Google is one of a third-party vendor on our site. It also uses cookies, known as DART cookies, to serve ads to our site visitors based upon their visit to www.website.com and other sites on the internet. However, visitors may choose to decline the use of DART cookies by visiting the Google ad and content network Privacy Policy at the following URL – <a href="https://policies.google.com/technologies/ads">https://policies.google.com/technologies/ads</a></p>
                    <h3 class="mt-4 fw-bold">Our Advertising Partners</h3>
                    <p class="text-secondary lh-lg">Some of advertisers on our site may use cookies and web beacons. Our advertising partners are listed below. Each of our advertising partners has their own Privacy Policy for their policies on user data.</p>
                    <ul><li class="text-secondary">Google AdSense</li></ul>
                    <h3 class="mt-4 fw-bold">Log Files</h3>
                    <p class="text-secondary lh-lg">Wedugo Education follows a standard procedure of using log files. These files log visitors when they visit websites. The information collected by log files include internet protocol (IP) addresses, browser type, Internet Service Provider (ISP), date and time stamp, referring/exit pages, and possibly the number of clicks.</p>
                    <h3 class="mt-4 fw-bold">Consent</h3>
                    <p class="text-secondary lh-lg">By using our website, you hereby consent to our Privacy Policy and agree to its Terms and Conditions.</p>
                </div>
            `;
            await fsAsync.writeFile(path.join(distDir, 'privacy.html'), getHtmlShell('Privacy Policy', privacyContent, 0, "", false));
            
            const termsContent = `
                ${getBreadcrumbs(0, '', '', 'Terms and Conditions', 'blog')}
                <div class="card shadow-sm p-4 p-md-5 border-0 rounded-4 bg-white mt-4">
                    <h1 class="blog-title mb-4">Terms and Conditions</h1>
                    <p class="text-secondary lh-lg">Welcome to Wedugo Education!</p>
                    <p class="text-secondary lh-lg">These terms and conditions outline the rules and regulations for the use of Wedugo Education's Website, located at wedugo.com.</p>
                    <h3 class="mt-4 fw-bold">Cookies</h3>
                    <p class="text-secondary lh-lg">We employ the use of cookies. By accessing Wedugo Education, you agreed to use cookies in agreement with the Wedugo Education's Privacy Policy.</p>
                    <h3 class="mt-4 fw-bold">License</h3>
                    <p class="text-secondary lh-lg">Unless otherwise stated, Wedugo Education and/or its licensors own the intellectual property rights for all material on Wedugo Education. All intellectual property rights are reserved. You may access this from Wedugo Education for your own personal use subjected to restrictions set in these terms and conditions.</p>
                    <ul class="text-secondary lh-lg">
                        <li>You must not republish material from Wedugo Education</li>
                        <li>You must not sell, rent or sub-license material from Wedugo Education</li>
                        <li>You must not reproduce, duplicate or copy material from Wedugo Education</li>
                    </ul>
                    <h3 class="mt-4 fw-bold">User Comments</h3>
                    <p class="text-secondary lh-lg">Parts of this website offer an opportunity for users to post and exchange opinions and information in certain areas of the website. Wedugo Education does not filter, edit, publish or review Comments prior to their presence on the website. Comments do not reflect the views and opinions of Wedugo Education, its agents and/or affiliates.</p>
                </div>
            `;
            await fsAsync.writeFile(path.join(distDir, 'terms.html'), getHtmlShell('Terms and Conditions', termsContent, 0, "", false));
        });

        await executeTasksInBatches(masterPageTasks, 10);

        console.log("6. Finalizing Build...");
        ['tools', 'main_images'].forEach(dir => { const s = path.join(__dirname, dir); if (fs.existsSync(s)) fs.cpSync(s, path.join(distDir, dir), { recursive: true }); });
        ['Ads.txt', 'CNAME', '404.html'].forEach(f => { const s = path.join(__dirname, f); if (fs.existsSync(s)) fs.copyFileSync(s, path.join(distDir, f === 'Ads.txt' ? 'ads.txt' : f)); });

        await generateSitemapAndRobots(distDir, quizCategoriesMap, blogPosts, blogCategoriesMap);

        console.log("✅ BUILD COMPLETE! All sections (Blog, Categories, Mock Tests, Single MCQs) added successfully with No-Index on Thin Content.");
    } catch (error) { console.error("Build failed:", error); }
}

buildUnifiedSite();
