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
// ADVANCED CSV PARSER (Handles multi-line HTML & Quotes)
// ==========================================
function parseFullCSV(text) {
    const rows = [];
    let curRow = [];
    let curCell = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const nextChar = text[i + 1];

        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                curCell += '"'; 
                i++; 
            } else {
                inQuotes = !inQuotes; 
            }
        } else if (char === ',' && !inQuotes) {
            curRow.push(curCell.trim());
            curCell = '';
        } else if ((char === '\n' || char === '\r') && !inQuotes) {
            if (char === '\r' && nextChar === '\n') i++; 
            curRow.push(curCell.trim());
            if (curRow.join('').length > 0) rows.push(curRow);
            curRow = [];
            curCell = '';
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
    for (let i = 0; i < array.length; i += size) {
        chunked.push(array.slice(i, i + size));
    }
    return chunked;
}

// ==========================================
// HELPER FUNCTIONS & LOGIC
// ==========================================
function getDifficultyData(questionStr) {
    const len = (questionStr || "").length;
    if (len < 50) return { label: 'Easy', time: '30 sec', color: 'success' };
    if (len > 120) return { label: 'Hard', time: '90 sec', color: 'danger' };
    return { label: 'Medium', time: '60 sec', color: 'warning' };
}

function getExamTarget(category) {
    const techExams = ['Computer', 'Technology', 'Civil Engineering', 'Solid Mechanics'];
    const medicalExams = ['Biology', 'Anatomy', 'Biochemistry', 'Microbiology', 'Pharmacology', 'Virus'];
    const govtExams = ['Indian Geography', 'Indian Polity and Constitution', 'Indian History', 'General Knowledge', 'Reasoning', 'Aptitude', 'Madhya Pradesh GK'];

    if (techExams.includes(category)) return "GATE, SSC JE, State Engineering Services, and PSU recruitment exams";
    if (medicalExams.includes(category)) return "NEET, AIIMS, Nursing Boards, Hospital Assistant Exams, and Medical Entrance tests";
    if (govtExams.includes(category)) return "UPSC, MPESB, SSC CGL, Banking (PO/Clerk), Railways (RRB), and State PSC examinations";
    
    return "various competitive assessments, university entrance exams, and professional certification tests";
}

function getRandomRelated(quizzes, currentId, count = 3) {
    const filtered = quizzes.filter(q => q.quizId !== currentId);
    return filtered.sort(() => 0.5 - Math.random()).slice(0, count);
}

// ==========================================
// ADVERTISEMENT COMPONENTS (Kept Intact)
// ==========================================
function getAdBannerHtml(label = "Advertisement") {
    return `
        <div class="ad-banner-wrapper my-4 text-center">
            <span class="text-muted d-block small mb-1" style="font-size: 0.75rem; letter-spacing: 0.5px;">${label}</span>
            <div class="ad-container shadow-sm border-0 mb-0" style="min-height: 100px; background: #ffffff;">
                <ins class="adsbygoogle"
                     style="display:block"
                     data-ad-client="${ADSENSE_CLIENT_ID}"
                     data-ad-format="auto"
                     data-full-width-responsive="true"></ins>
                <script>
                     try { (adsbygoogle = window.adsbygoogle || []).push({}); } catch(e) {}
                </script>
            </div>
        </div>
    `;
}

function getAdSidebar() {
    return `
        <div class="col-lg-4 d-none d-lg-block">
            <div class="sticky-desktop-sidebar">
                <div class="card shadow-sm border-0 rounded-4 bg-white p-3 mb-4 text-center">
                    <span class="text-muted small fw-bold text-uppercase mb-2 d-block" style="font-size: 0.75rem;">Sponsored Link</span>
                    <div class="ad-container shadow-none border-0 mb-0" style="min-height: 280px; background: #f8fafc;">
                        <ins class="adsbygoogle"
                             style="display:block"
                             data-ad-client="${ADSENSE_CLIENT_ID}"
                             data-ad-format="auto"
                             data-full-width-responsive="true"></ins>
                        <script>
                             try { (adsbygoogle = window.adsbygoogle || []).push({}); } catch(e) {}
                        </script>
                    </div>
                </div>
                <div class="card shadow-sm border-0 rounded-4 bg-white p-4">
                    <h5 class="fw-bold text-dark mb-3"><i class="bi bi-lightning-charge-fill text-warning me-2"></i>Study Guidance</h5>
                    <p class="text-secondary small mb-0 lh-lg">Consistent timed testing improves recall speed during competitive examinations. Explore our Live Exam Engine or dive into detailed Blog guides for deep conceptual clarity.</p>
                </div>
            </div>
        </div>
    `;
}

// ==========================================
// UNIFIED UI COMPONENTS
// ==========================================
function getDisqusEmbed(identifierId, prefix) {
    const pageUrl = `${SITE_BASE_URL}/${prefix}`;
    const pageIdentifier = `${identifierId}`;

    return `
        <div id="disqus_thread"></div>
        <script>
            var disqus_config = function () {
                this.page.url = '${pageUrl}';
                this.page.identifier = '${pageIdentifier}';
            };
            (function() {
                var d = document, s = d.createElement('script');
                s.src = 'https://wedugo.disqus.com/embed.js'; 
                s.setAttribute('data-timestamp', +new Date());
                (d.head || d.body).appendChild(s);
            })();
        </script>
        <noscript>Please enable JavaScript to view comments powered by Disqus.</noscript>
    `;
}

// FIXED: Clean White Header to make Logo visible based on your image_7e1dea.jpg
function getNavbar(depth) {
    const prefix = depth === 0 ? '.' : '../'.repeat(depth).slice(0, -1);
    const cacheBuster = new Date().getTime(); 
    return `
    <nav class="navbar navbar-expand-lg navbar-light bg-white mb-4 shadow-sm py-3 border-bottom">
        <div class="container">
            <a class="navbar-brand fw-bold fs-4 d-flex align-items-center tracking-tight" href="${prefix}/index.html">
                <!-- Text Removed, Only Logo remains for clean look -->
                <img src="${prefix}/main_images/logo.png?v=${cacheBuster}" alt="Wedugo Logo" height="40" class="d-inline-block align-text-top" onerror="this.style.display='none'">
            </a>
            <button class="navbar-toggler border-0 shadow-none" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav ms-auto fw-semibold fs-6 gap-2">
                    <li class="nav-item"><a class="nav-link text-dark px-3 rounded-pill hover-bg-light" href="${prefix}/index.html"><i class="bi bi-house me-1"></i>Home</a></li>
                    <li class="nav-item"><a class="nav-link text-dark px-3 rounded-pill hover-bg-light" href="${prefix}/categories/index.html"><i class="bi bi-grid me-1"></i>Mock Tests</a></li>
                    <li class="nav-item"><a class="nav-link text-dark px-3 rounded-pill hover-bg-light" href="${prefix}/blog/index.html"><i class="bi bi-journal-text me-1"></i>Blog</a></li>
                    <li class="nav-item"><a class="nav-link text-dark px-3 rounded-pill hover-bg-light" href="${prefix}/about/index.html"><i class="bi bi-info-circle me-1"></i>About</a></li>
                </ul>
            </div>
        </div>
    </nav>`;
}

function getFooter() {
    return `
    <footer class="bg-white border-top py-4 mt-5 mt-auto">
        <div class="container text-center">
            <p class="mb-0 text-muted small fw-medium">© ${new Date().getFullYear()} Wedugo Education. All Rights Reserved.</p>
        </div>
    </footer>`;
}

// UNIFIED HTML SHELL (Handles both Blog & Quiz Styles)
function getHtmlShell(title, content, depth, seoDescription = "", isThinPage = false) {
    const cleanDesc = (seoDescription || 'Practice high-quality exam preparation sets, read educational blogs, and take timed mock tests on Wedugo Education.').replace(/"/g, '&quot;').substring(0, 160);
    const prefix = depth === 0 ? '.' : '../'.repeat(depth).slice(0, -1);
    
    // Thin Content Mitigation: Individual Question pages get noindex. Blogs and Mock sets get index.
    const metaRobots = isThinPage ? `<meta name="robots" content="noindex, follow">` : `<meta name="robots" content="index, follow">`;
    const displayTitle = title.includes("Wedugo Education") ? title : `${title} | Wedugo Education`;

    return `<!DOCTYPE html>
<html lang="hi">
<head>
    <meta charset="UTF-8">
    ${metaRobots}
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-23NQJXPC86"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-23NQJXPC86');
    </script>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${displayTitle}</title>
    <meta name="description" content="${cleanDesc}">
    <link rel="icon" href="${prefix}/main_images/icon.png" type="image/png">
    
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}" crossorigin="anonymous"></script>
    <script type='text/javascript' src='https://platform-api.sharethis.com/js/sharethis.js#property=5c5059d8c9830d001319b017&product=inline-share-buttons' async='async'></script>
    
    <style>
        body { background-color: #f8fafc; font-family: 'Inter', sans-serif; color: #334155; display: flex; flex-direction: column; min-height: 100vh; }
        .hover-bg-light:hover { background-color: #f1f5f9; color: #0d6efd !important; }
        .card { border: none; border-radius: 16px; box-shadow: 0 4px 15px rgba(0,0,0,0.03); transition: transform 0.3s ease, box-shadow 0.3s ease; }
        .card-hover:hover { transform: translateY(-5px); box-shadow: 0 15px 30px rgba(0,0,0,0.08) !important; }
        
        /* Quiz CSS */
        .option-btn { text-align: left; padding: 16px 24px; font-weight: 500; font-size: 1.05rem; border-radius: 12px; border: 2px solid #e2e8f0; background: #ffffff; transition: all 0.2s; color: #475569; }
        .option-btn:hover:not(:disabled) { background-color: #f8fafc; border-color: #cbd5e1; transform: translateX(5px); }
        .option-btn.selected { background-color: #eff6ff; border-color: #3b82f6; color: #1d4ed8; box-shadow: 0 4px 10px rgba(59, 130, 246, 0.15); }
        .option-btn.correct-show { background-color: #f0fdf4 !important; border-color: #22c55e !important; color: #15803d !important; font-weight: 600; }
        .option-btn.incorrect-show { background-color: #fef2f2 !important; border-color: #ef4444 !important; color: #b91c1c !important; }
        .option-btn:disabled { opacity: 1; cursor: default; }
        .timer-header { position: sticky; top: 0; z-index: 1020; border-bottom: 4px solid #3b82f6; background: rgba(255,255,255,0.95); backdrop-filter: blur(8px); }
        .sticky-desktop-sidebar { position: sticky; top: 20px; }
        .q-node { width: 42px; height: 42px; border-radius: 8px; border: 1px solid #cbd5e1; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 0.95rem; cursor: pointer; background: #fff; color: #475569; transition: all 0.2s; box-shadow: 0 2px 4px rgba(0,0,0,0.02); margin: 0 auto; }
        .q-node:hover { background: #f1f5f9; border-color: #94a3b8; }
        .q-node.active { border: 2px solid #3b82f6; background: #eff6ff; color: #1d4ed8; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2); }
        .q-node.attempted { background-color: #3b82f6; color: #fff; border-color: #3b82f6; }
        .q-node.correct { background-color: #22c55e !important; color: #fff !important; border-color: #22c55e !important; }
        .q-node.incorrect { background-color: #ef4444 !important; color: #fff !important; border-color: #ef4444 !important; }
        .palette-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(45px, 1fr)); gap: 12px; margin-top: 15px; }
        .exam-sidebar { background: #f8fafc; padding: 20px; border-radius: 16px; border: 1px solid #e2e8f0; }
        .legend-box { width: 16px; height: 16px; display: inline-block; border-radius: 4px; margin-right: 6px; vertical-align: middle; border: 1px solid #cbd5e1; }
        .legend-correct { background-color: #22c55e; border-color: #22c55e; }
        .legend-incorrect { background-color: #ef4444; border-color: #ef4444; }
        .legend-unattempted { background-color: #fff; }
        
        /* Blog CSS */
        .blog-card { border: 1px solid #eaeaea; border-radius: 12px; transition: transform 0.2s, box-shadow 0.2s; background: #fff; }
        .blog-card:hover { transform: translateY(-3px); box-shadow: 0 10px 20px rgba(0,0,0,0.05); }
        .article-content { font-size: 1.15rem; color: #334155; line-height: 1.8; }
        .article-content img { max-width: 100%; height: auto; border-radius: 12px; margin: 25px 0; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
        .badge-cat { font-size: 0.85rem; padding: 0.5em 1em; letter-spacing: 0.5px; border-radius: 8px;}
        .ad-container { min-height: 100px; background: #fff; border: 1px dashed #cbd5e1; border-radius: 12px; display: block; width: 100%; overflow: hidden; text-align: center; }
    </style>
</head>
<body>
    ${getNavbar(depth)}
    <div class="container flex-grow-1 pb-5">
        ${content}
    </div>
    ${getFooter()}
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>`;
}

function getBreadcrumbs(depth, category, safeName, currentTitle, isBlog = false) {
    const prefix = depth === 0 ? '.' : '../'.repeat(depth).slice(0, -1);
    
    let pathList = ``;
    if (isBlog) {
        pathList += `<li class="breadcrumb-item"><a href="${prefix}/blog/index.html" class="text-decoration-none text-primary fw-medium">Blog Home</a></li>`;
        if (category) pathList += `<li class="breadcrumb-item"><a href="${prefix}/blog/categories/${safeName}/index.html" class="text-decoration-none text-primary fw-medium">${category}</a></li>`;
    } else {
        pathList += `<li class="breadcrumb-item"><a href="${prefix}/categories/index.html" class="text-decoration-none text-primary fw-medium">Mock Tests</a></li>`;
        if (category) pathList += `<li class="breadcrumb-item"><a href="${prefix}/category/${safeName}/index.html" class="text-decoration-none text-primary fw-medium">${category}</a></li>`;
    }
    
    return `
        <nav aria-label="breadcrumb" class="mb-4">
            <ol class="breadcrumb bg-white p-3 rounded-4 shadow-sm mb-0 border border-light">
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
    console.log("-> Auto-generating Unified SEO Sitemap & Robots.txt...");
    
    const today = new Date().toISOString().split('T')[0];
    const urls = [];

    // Core Pages
    urls.push({ loc: `${SITE_BASE_URL}/`, priority: '1.0', changefreq: 'daily' });
    urls.push({ loc: `${SITE_BASE_URL}/categories/index.html`, priority: '0.9', changefreq: 'weekly' });
    urls.push({ loc: `${SITE_BASE_URL}/blog/index.html`, priority: '0.9', changefreq: 'daily' });
    urls.push({ loc: `${SITE_BASE_URL}/about/index.html`, priority: '0.5', changefreq: 'monthly' });

    // Quiz Category & Set Pages
    const QUESTIONS_PER_PAGE = 10;
    for (const [cat, quizzes] of Object.entries(quizCategoriesMap)) {
        if (!quizzes || quizzes.length === 0) continue;
        const safeName = cat.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        urls.push({ loc: `${SITE_BASE_URL}/category/${safeName}/index.html`, priority: '0.8', changefreq: 'weekly' });

        const totalSets = Math.ceil(quizzes.length / QUESTIONS_PER_PAGE);
        for (let s = 1; s <= totalSets; s++) {
            urls.push({ loc: `${SITE_BASE_URL}/category/${safeName}/set-${s}.html`, priority: '0.7', changefreq: 'monthly' });
        }
    }

    // Blog Category Pages
    for (const [catName] of Object.entries(blogCategoriesMap)) {
        const safeName = catName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        urls.push({ loc: `${SITE_BASE_URL}/blog/categories/${safeName}/index.html`, priority: '0.7', changefreq: 'weekly' });
    }

    // Blog Individual Posts
    blogPosts.forEach(post => {
        urls.push({ loc: `${SITE_BASE_URL}/blog/post/${post.urlSlug}/index.html`, priority: '0.9', changefreq: 'monthly' });
    });

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
    for (const u of urls) {
        xml += `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>\n`;
    }
    xml += `</urlset>`;

    await fsAsync.writeFile(path.join(distDir, 'sitemap.xml'), xml, 'utf8');

    const robotsTxt = `User-agent: *\nAllow: /\n\n# Unified Fast Indexing Sitemap\nSitemap: ${SITE_BASE_URL}/sitemap.xml\n`;
    await fsAsync.writeFile(path.join(distDir, 'robots.txt'), robotsTxt, 'utf8');
    console.log(`-> sitemap.xml generated with ${urls.length} indexable high-value URLs.`);
}

async function executeTasksInBatches(tasks, batchSize = 50) {
    for (let i = 0; i < tasks.length; i += batchSize) {
        const batch = tasks.slice(i, i + batchSize);
        await Promise.all(batch.map(async task => {
            try { await task(); } catch (err) { console.error("Batch task warning:", err.message); }
        }));
    }
}

// ==========================================
// MAIN MASTER BUILDER (Orchestrator)
// ==========================================
async function buildUnifiedSite() {
    try {
        const distDir = path.join(__dirname, 'public');
        if (fs.existsSync(distDir)) {
            try { fs.rmSync(distDir, { recursive: true, force: true }); } catch (e) {}
        }
        fs.mkdirSync(distDir, { recursive: true });
        
        console.log("1. Fetching Data from Google Sheets...");
        const [quizRes, blogRes] = await Promise.all([
            fetch(QUIZ_SHEET_CSV_URL),
            fetch(BLOG_SHEET_CSV_URL)
        ]);
        
        const quizCsvText = await quizRes.text();
        const blogCsvText = await blogRes.text();

        // Parse CSVs using the Robust Full Parser
        const allQuizRows = parseFullCSV(quizCsvText);
        const allBlogRows = parseFullCSV(blogCsvText);

        // --- PREPARE QUIZ DATA ---
        const quizHeaders = allQuizRows[0].map(h => h.toLowerCase());
        const quizRows = allQuizRows.slice(1).reverse();
        const quizCategoriesMap = {};
        CATEGORY_LIST.forEach(cat => quizCategoriesMap[cat] = []);
        quizCategoriesMap['Uncategorized'] = [];

        quizRows.forEach((values, index) => {
            if (values.length < quizHeaders.length) return;
            const q = {};
            quizHeaders.forEach((h, i) => q[h] = values[i]);
            if (!q.question || q.question.includes('à¤')) return;

            let matchedCat = 'Uncategorized';
            const sheetCat = (q.qcategory || '').trim().toLowerCase();
            for (const officialCat of CATEGORY_LIST) {
                if (officialCat.toLowerCase() === sheetCat) {
                    matchedCat = officialCat; break;
                }
            }
            q.quizId = q.id || (quizRows.length - index);
            q.matchedCategory = matchedCat;
            quizCategoriesMap[matchedCat].push(q);
        });

        // --- PREPARE BLOG DATA ---
        const blogHeaders = allBlogRows[0].map(h => h.toLowerCase());
        const blogRows = allBlogRows.slice(1).reverse();
        const blogPosts = [];
        const blogCategoriesMap = {};

        blogRows.forEach((values, index) => {
            if (values.length < blogHeaders.length) return; 
            const post = {};
            blogHeaders.forEach((h, i) => post[h] = values[i]);
            if (!post.title || !post.content) return; 

            post.postId = post.id || String(blogRows.length - index);
            post.cat = post.category || 'General';
            let rawUrl = post.url || post.slug || post.title || post.postId;
            post.urlSlug = rawUrl.toString().trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
            
            if (!blogCategoriesMap[post.cat]) blogCategoriesMap[post.cat] = [];
            blogCategoriesMap[post.cat].push(post);
            blogPosts.push(post);
        });

        const masterPageTasks = [];
        const globallyGeneratedSets = []; 

        console.log("2. Generating Quiz Platform Content & Integrating Ad Units...");
        const catMainDir = path.join(distDir, 'category');
        const quizMainDir = path.join(distDir, 'quiz');
        fs.mkdirSync(catMainDir, { recursive: true });
        fs.mkdirSync(quizMainDir, { recursive: true });

        let categoriesGridHtml = '<div class="row g-4">';
        let currentQuizTasks = [];

        for (const [cat, quizzes] of Object.entries(quizCategoriesMap)) {
            if (!quizzes || quizzes.length === 0) continue; 
            
            const safeName = cat.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            const specificCatDir = path.join(catMainDir, safeName);
            fs.mkdirSync(specificCatDir, { recursive: true });

            // 10-QUESTION PRACTICE SETS
            const sets = chunkArray(quizzes, 10);
            let practiceSetsHtml = '<div class="row g-4 mb-4">';

            sets.forEach((setQuizzes, setIndex) => {
                const setNumber = setIndex + 1;
                const setFileName = `set-${setNumber}.html`;
                
                if (globallyGeneratedSets.length < 20) {
                    globallyGeneratedSets.push({ category: cat, safeName: safeName, setNumber: setNumber, link: `./category/${safeName}/${setFileName}` });
                }

                currentQuizTasks.push(async () => {
                    let setQuestionsHtml = '';
                    let answersMapScript = [];

                    setQuizzes.forEach((q, qIndex) => {
                        const correctLetter = (q.mainanswer || '').toString().replace(/[^A-D]/gi, '').toUpperCase();
                        const diffData = getDifficultyData(q.question);
                        const explanationText = (q.answerdetail && q.answerdetail.trim() !== "") ? q.answerdetail : `Consistent practice is key for mastering ${getExamTarget(q.matchedCategory)}.`;
                        answersMapScript.push(`'${q.quizId}': '${correctLetter}'`);
                        
                        setQuestionsHtml += `
                            <article class="card p-4 p-md-5 mb-5 bg-white border border-light rounded-4" id="quiz-block-${q.quizId}">
                                <div class="d-flex align-items-center flex-wrap gap-2 mb-4 pb-4 border-bottom">
                                    <span class="badge bg-primary rounded-pill me-2 px-3 py-2 fs-6">Question ${(setIndex * 10) + qIndex + 1}</span>
                                    <span class="badge bg-${diffData.color} bg-opacity-10 text-${diffData.color} border border-${diffData.color}-subtle px-3 py-2 rounded-pill fs-6">${diffData.label}</span>
                                </div>
                                <h3 class="h4 fw-bold text-dark mb-4 lh-base">${q.question}</h3>
                                <div class="d-grid gap-3 ps-md-3 mb-4">
                                    <button class="btn option-btn" data-letter="A" onclick="selectOption('${q.quizId}', 'A', this)">A) ${q.answer1}</button>
                                    <button class="btn option-btn" data-letter="B" onclick="selectOption('${q.quizId}', 'B', this)">B) ${q.answer2}</button>
                                    <button class="btn option-btn" data-letter="C" onclick="selectOption('${q.quizId}', 'C', this)">C) ${q.answer3}</button>
                                    <button class="btn option-btn" data-letter="D" onclick="selectOption('${q.quizId}', 'D', this)">D) ${q.answer4}</button>
                                </div>
                                <div id="explanation-${q.quizId}" class="alert mt-4 d-none p-4 p-md-5 border rounded-4 bg-light">
                                    <h5 class="alert-heading fw-bold fs-4 mb-3" id="result-title-${q.quizId}"></h5>
                                    <hr class="opacity-25 mb-4">
                                    <h6 class="fw-bold text-dark mb-3 fs-5"><i class="bi bi-lightbulb-fill text-warning me-2"></i>Solution Breakdown:</h6>
                                    <p class="mb-0 text-dark lh-lg" style="font-size: 1.1rem;">${explanationText}</p>
                                </div>
                            </article>
                        `;
                        if (qIndex === 4) setQuestionsHtml += getAdBannerHtml("Mid-Test Ad");
                    });

                    const prevSetBtn = setIndex > 0 ? `<a href="set-${setNumber - 1}.html" class="btn btn-outline-secondary px-4 py-3 fw-bold rounded-pill"><i class="bi bi-arrow-left me-2"></i>Previous</a>` : '';
                    const nextSetBtn = setIndex < sets.length - 1 ? `<a href="set-${setNumber + 1}.html" class="btn btn-primary px-4 py-3 shadow fw-bold rounded-pill">Next Set<i class="bi bi-arrow-right ms-2"></i></a>` : '';

                    const setPageContent = `
                        ${getBreadcrumbs(2, cat, safeName, `Practice Set ${setNumber}`, false)}
                        <div class="row">
                            <div class="col-lg-8">
                                ${getAdBannerHtml("Top Ad")}
                                <div class="timer-header p-4 shadow-sm d-flex flex-wrap gap-3 justify-content-between align-items-center mb-5 rounded-4 border">
                                    <div>
                                        <h1 class="h3 fw-bold text-dark mb-2">${cat} - Mock Test ${setNumber}</h1>
                                        <p class="text-muted mb-0 fs-6">Answer 10 questions, then submit to view your score.</p>
                                    </div>
                                    <div class="text-center ms-auto bg-light p-3 rounded-4 border">
                                        <div class="fs-3 fw-bold font-monospace text-danger" id="timer-display"><i class="bi bi-stopwatch me-2"></i>10:00</div>
                                    </div>
                                </div>
                                <div id="score-board" class="card shadow-lg border-success d-none mb-5 text-center p-5 rounded-4 bg-success bg-opacity-10">
                                    <h2 class="text-success fw-bold display-6 mb-4">Test Completed Successfully!</h2>
                                    <p class="fs-4 text-dark mb-3">Final Score:</p>
                                    <div class="display-1 fw-bold text-success mb-4" id="final-score">0 / 10</div>
                                    <a href="index.html" class="btn btn-success btn-lg mt-3 rounded-pill px-5 fw-bold">Back to ${cat} Hub</a>
                                </div>
                                <div class="practice-set-container">${setQuestionsHtml}</div>
                                <div class="text-center mt-5 mb-5" id="submit-container">
                                    <button class="btn btn-success btn-lg px-5 py-4 fw-bold shadow-lg rounded-pill fs-4 w-100" onclick="submitTest()"><i class="bi bi-journal-check me-2"></i>Submit Test & View Explanations</button>
                                </div>
                                <div class="d-flex justify-content-between mt-5 pt-4 border-top">
                                    <div>${prevSetBtn}</div>
                                    <div>${nextSetBtn}</div>
                                </div>
                                <div class="mt-5 pt-5 border-top">
                                    <div class="card bg-white border-0 shadow-sm p-4 rounded-4">
                                        <h4 class="h3 fw-bold mb-4"><i class="bi bi-chat-square-text-fill text-primary me-2"></i>Discussion</h4>
                                        ${getDisqusEmbed(`set_${safeName}_${setNumber}`, `category/${safeName}/${setFileName}`)}
                                    </div>
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
                                    document.getElementById('timer-display').innerHTML = '<i class="bi bi-stopwatch me-2"></i>' + (m<10?'0':'')+m + ':' + (s<10?'0':'')+s;
                                    if (timeLeft <= 0) { clearInterval(timerInterval); submitTest(); }
                                }, 1000);
                            }
                            function selectOption(quizId, letter, btn) {
                                if(testSubmitted) return;
                                const container = document.getElementById('quiz-block-' + quizId);
                                container.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
                                btn.classList.add('selected');
                                userAnswers[quizId] = letter;
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
                                    if (user === correct) { score++; explanation.classList.add('alert-success', 'border-success'); title.innerHTML = "✨ Correct!"; }
                                    else if (!user) { explanation.classList.add('alert-warning', 'border-warning'); title.innerHTML = "⚠️ Unanswered. Correct Option: " + correct; }
                                    else { explanation.classList.add('alert-danger', 'border-danger'); title.innerHTML = "❌ Incorrect. Correct Option: " + correct; }
                                }
                                document.getElementById('score-board').classList.remove('d-none');
                                document.getElementById('final-score').innerText = score + " / " + total;
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }
                            window.onload = startTimer;
                        </script>
                    `;
                    const seoSetTitle = `${cat} Practice Set ${setNumber}: 10 MCQ Mock Test`;
                    await fsAsync.writeFile(path.join(specificCatDir, setFileName), getHtmlShell(seoSetTitle, setPageContent, 2, "", false));
                });

                practiceSetsHtml += `
                    <div class="col-sm-6 col-lg-4">
                        <a href="${setFileName}" class="card shadow-sm text-decoration-none card-hover h-100 p-4 border border-light rounded-4 bg-white d-block">
                            <h5 class="fw-bold text-dark mb-0"><i class="bi bi-card-checklist text-primary me-2"></i>Mock Set ${setNumber}</h5>
                            <hr class="opacity-10 my-3">
                            <div class="d-flex justify-content-between text-secondary mt-2">
                                <small class="fw-medium"><i class="bi bi-ui-checks me-1"></i>10 Qs</small>
                                <small class="fw-bold text-danger"><i class="bi bi-stopwatch me-1"></i>10 Mins</small>
                            </div>
                        </a>
                    </div>`;
            });
            practiceSetsHtml += '</div>';

            // CATEGORY MASTER PAGE (Quiz Hub)
            if (CATEGORY_LIST.includes(cat)) {
                currentQuizTasks.push(async () => {
                    const catPageContent = `
                        <div class="row">
                            <div class="col-12">
                                ${getBreadcrumbs(2, cat, safeName, '', false)}
                                ${getAdBannerHtml("Top Banner Ad")}
                                <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-end mb-4">
                                    <h1 class="display-5 fw-bold mb-3 text-dark">${cat} MCQs & Study Guide</h1>
                                    <span class="badge bg-primary fs-5 px-4 py-2 rounded-pill shadow-sm">${quizzes.length} Questions</span>
                                </div>
                                <div class="card shadow-sm border-0 p-4 p-md-5 mb-5 rounded-4 bg-primary text-white" style="background: linear-gradient(135deg, #0d6efd 0%, #0a58ca 100%);">
                                    <div class="text-center mb-4">
                                        <h3 class="fw-bold display-6 text-white"><i class="bi bi-rocket-takeoff-fill me-3"></i>Live Exam Engine</h3>
                                        <p class="fs-5 text-white-50 mt-3">Ready to test your knowledge? Choose a set below to start simulating.</p>
                                    </div>
                                </div>
                                ${getAdBannerHtml("In-Feed Hub Ad")}
                                <div class="mt-5 mb-5">
                                    <div class="d-flex align-items-center mb-4 border-bottom pb-3">
                                        <h3 class="h3 fw-bold text-dark mb-1"><i class="bi bi-bullseye text-primary me-2"></i>Standard Structured Sets</h3>
                                    </div>
                                    ${practiceSetsHtml}
                                </div>
                            </div>
                        </div>
                    `;
                    const categorySeoTitle = `${cat} MCQs & Live Mock Test: Free Practice`;
                    await fsAsync.writeFile(path.join(specificCatDir, 'index.html'), getHtmlShell(categorySeoTitle, catPageContent, 2, "", false));
                });

                categoriesGridHtml += `
                    <div class="col-md-6 col-lg-4">
                        <div class="card shadow-sm h-100 card-hover border-light rounded-4 bg-white">
                            <div class="card-body p-4 text-center d-flex flex-column justify-content-center">
                                <h3 class="h4 fw-bold mb-3 text-dark">${cat}</h3>
                                <p class="text-secondary mb-4 fs-6 lh-lg">${quizzes.length} questions available.</p>
                                <a href="../category/${safeName}/index.html" class="btn btn-outline-primary mt-auto w-100 fw-bold py-3 rounded-pill shadow-sm">Launch Mock Tests</a>
                            </div>
                        </div>
                    </div>
                `;
            }
        }
        categoriesGridHtml += '</div>';
        await executeTasksInBatches(currentQuizTasks, 50);

        console.log("3. Generating Blog Content...");
        const blogMainDir = path.join(distDir, 'blog');
        fs.mkdirSync(blogMainDir, { recursive: true });
        
        let blogCatGridHtml = '<div class="row g-4">';
        
        // BLOG: INDIVIDUAL POSTS
        const postMainDir = path.join(blogMainDir, 'post');
        fs.mkdirSync(postMainDir, { recursive: true });

        blogPosts.forEach((post) => {
            const postDir = path.join(postMainDir, post.urlSlug);
            fs.mkdirSync(postDir, { recursive: true });

            const articleContent = `
                ${getBreadcrumbs(3, post.cat, post.cat.toLowerCase().replace(/[^a-z0-9]+/g, '-'), post.title, true)}
                <div class="row justify-content-center">
                    <div class="col-lg-8">
                        <div class="mb-4 text-center">
                            <a href="../../categories/${post.cat.toLowerCase().replace(/[^a-z0-9]+/g, '-')}/index.html" class="badge bg-primary badge-cat text-decoration-none mb-3">${post.cat}</a>
                            <h1 class="fw-bold text-dark display-5 lh-sm mb-3">${post.title}</h1>
                            <p class="text-muted mb-0">By <span class="fw-semibold text-dark">${post.author || 'Wedugo Team'}</span> &bull; ${post.date || 'Recently Updated'}</p>
                        </div>
                        
                        ${getAdBannerHtml("Top Article Ad")}

                        <div class="blog-card p-4 p-md-5 mb-5 shadow-sm border-0">
                            <div class="article-content">
                                ${post.content}
                            </div>
                        </div>
                        
                        ${getAdBannerHtml("Bottom Article Ad")}

                        <div class="card shadow-sm p-4 bg-white text-center mb-5 border-0 rounded-4">
                            <h3 class="h5 fw-bold text-secondary text-uppercase mb-3">Share & Discuss</h3>
                            <div class="sharethis-inline-reaction-buttons mb-4"></div>
                            <div class="text-start border-top pt-4">
                                ${getDisqusEmbed(`blog_${post.postId}`, `blog/post/${post.urlSlug}/index.html`)}
                            </div>
                        </div>
                    </div>
                    ${getAdSidebar()}
                </div>
            `;
            masterPageTasks.push(async () => {
                await fsAsync.writeFile(path.join(postDir, 'index.html'), getHtmlShell(post.title, articleContent, 3, post.seo_description || post.title, false));
            });
        });

        // BLOG: PAGINATION & CATEGORY HUBS
        const blogPageDir = path.join(blogMainDir, 'page');
        fs.mkdirSync(blogPageDir, { recursive: true });
        const totalBlogPages = Math.ceil(blogPosts.length / POSTS_PER_PAGE);

        for (let i = 1; i <= totalBlogPages; i++) {
            const pageDir = path.join(blogPageDir, String(i));
            fs.mkdirSync(pageDir, { recursive: true });
            const startIndex = (i - 1) * POSTS_PER_PAGE;
            const pagePosts = blogPosts.slice(startIndex, startIndex + POSTS_PER_PAGE);

            let pageContent = `
                ${getBreadcrumbs(3, '', '', `All Articles - Page ${i}`, true)}
                <h2 class="display-6 fw-bold mb-4 text-dark">Latest Blog Posts</h2>
                <div class="row g-4 mb-5">
            `;
            pagePosts.forEach(post => {
                pageContent += `
                    <div class="col-md-6">
                        <div class="blog-card h-100 p-4 shadow-sm">
                            <span class="badge bg-primary bg-opacity-10 text-primary border border-primary-subtle mb-3">${post.cat}</span>
                            <h3 class="h5 fw-bold mb-3"><a href="../../post/${post.urlSlug}/index.html" class="text-dark text-decoration-none">${post.title}</a></h3>
                            <p class="text-muted small mb-0"><i class="bi bi-clock me-1"></i>${post.date || 'Updated recently'}</p>
                        </div>
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

            masterPageTasks.push(async () => {
                await fsAsync.writeFile(path.join(pageDir, 'index.html'), getHtmlShell(`Blog Posts - Page ${i}`, pageContent, 3, "", false));
            });
        }

        const blogCatMainDir = path.join(blogMainDir, 'categories');
        fs.mkdirSync(blogCatMainDir, { recursive: true });
        
        for (const [catName, catPosts] of Object.entries(blogCategoriesMap)) {
            const safeName = catName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            const specificCatDir = path.join(blogCatMainDir, safeName);
            fs.mkdirSync(specificCatDir, { recursive: true });

            let catPageHtml = `
                ${getBreadcrumbs(3, '', '', `Articles in ${catName}`, true)}
                <h2 class="fw-bold mb-4 display-6">Topic: ${catName}</h2>
                <div class="list-group shadow-sm mb-5 border-0 rounded-4">
            `;
            catPosts.forEach(post => {
                catPageHtml += `<a href="../../post/${post.urlSlug}/index.html" class="list-group-item list-group-item-action py-4 border-light"><h5 class="mb-2 fw-bold text-dark">${post.title}</h5><small class="text-muted">${post.date || ''}</small></a>`;
            });
            catPageHtml += '</div>';

            masterPageTasks.push(async () => {
                await fsAsync.writeFile(path.join(specificCatDir, 'index.html'), getHtmlShell(`${catName} Articles`, catPageHtml, 3, "", false));
            });

            blogCatGridHtml += `
                <div class="col-md-4">
                    <div class="blog-card text-center p-4 h-100 d-flex flex-column justify-content-center shadow-sm border-0">
                        <h4 class="fw-bold text-dark mb-2">${catName}</h4>
                        <p class="text-muted small mb-4">${catPosts.length} Guides</p>
                        <a href="./${safeName}/index.html" class="btn btn-outline-primary btn-sm mt-auto rounded-pill py-2">Explore Topic</a>
                    </div>
                </div>
            `;
        }
        blogCatGridHtml += '</div>';

        // BLOG HOMEPAGE & CATEGORIES ROOT
        masterPageTasks.push(async () => {
            await fsAsync.writeFile(path.join(blogCatMainDir, 'index.html'), getHtmlShell('Blog Topics', `
                ${getBreadcrumbs(2, '', '', 'All Blog Topics', true)}
                <h2 class="display-6 fw-bold mb-4 text-dark">Explore Blog Topics</h2>
                ${blogCatGridHtml}
            `, 2, "", false));

            let top5Html = '<div class="list-group shadow-sm border-0 mb-5 rounded-4">';
            blogPosts.slice(0, 5).forEach(post => {
                top5Html += `
                    <a href="./post/${post.urlSlug}/index.html" class="list-group-item list-group-item-action p-4 border-light">
                        <div class="d-flex w-100 justify-content-between align-items-center mb-2">
                            <h3 class="h5 fw-bold mb-0 text-dark">${post.title}</h3>
                            <small class="text-muted ms-3"><i class="bi bi-calendar3 me-1"></i>${post.date || ''}</small>
                        </div>
                        <span class="badge bg-primary bg-opacity-10 text-primary border border-primary-subtle mt-2">${post.cat}</span>
                    </a>
                `;
            });
            top5Html += '</div>';

            const blogHomeContent = `
                ${getBreadcrumbs(1, '', '', 'Blog Home', true)}
                <div class="py-5 text-center bg-white border border-light rounded-4 mb-5 shadow-sm">
                    <h1 class="display-4 fw-bold text-dark mb-3">Wedugo Blog</h1>
                    <p class="lead text-muted col-md-8 mx-auto mb-4">Your source for the latest exam updates, educational strategies, and deep conceptual guides.</p>
                    <a href="./page/1/index.html" class="btn btn-primary btn-lg px-5 py-3 rounded-pill shadow fw-bold">Read All Articles</a>
                </div>
                ${getAdBannerHtml("Blog Middle Ad")}
                <div class="d-flex justify-content-between align-items-end mb-4 mt-5">
                    <h2 class="fw-bold mb-0 text-dark display-6">Latest Articles</h2>
                    <a href="./page/1/index.html" class="text-primary fw-bold text-decoration-none">View Archive &rarr;</a>
                </div>
                ${top5Html}
                <div class="text-center mt-5 mb-4">
                    <a href="./categories/index.html" class="btn btn-outline-dark btn-lg rounded-pill px-5">Browse by Topic</a>
                </div>
            `;
            await fsAsync.writeFile(path.join(blogMainDir, 'index.html'), getHtmlShell('Wedugo Blog: Exam Guides & News', blogHomeContent, 1, "", false));
        });

        // 4. MAIN SITE CORE PAGES
        console.log("4. Building Core Static Pages...");
        const categoriesDir = path.join(distDir, 'categories');
        fs.mkdirSync(categoriesDir, { recursive: true });

        masterPageTasks.push(async () => {
            const categoriesContent = `
                ${getBreadcrumbs(1, '', '', 'All Quiz Categories', false)}
                ${getAdBannerHtml("Top Ad")}
                <div class="mb-5 text-center py-5">
                    <h1 class="display-4 fw-bold mb-4 text-dark">Explore MCQ Topics</h1>
                    <p class="lead text-secondary col-lg-8 mx-auto lh-lg">Select a subject below to launch timed mock sets and detailed educational explanations.</p>
                </div>
                ${categoriesGridHtml}
                ${getAdBannerHtml("Bottom Ad")}
            `;
            await fsAsync.writeFile(path.join(categoriesDir, 'index.html'), getHtmlShell('Explore All Subjects: Free MCQ Practice', categoriesContent, 1, "", false));
        });

        const aboutDir = path.join(distDir, 'about');
        fs.mkdirSync(aboutDir, { recursive: true });
        masterPageTasks.push(async () => {
            const aboutContent = `
                ${getBreadcrumbs(1, '', '', 'About Us', false)}
                <div class="card shadow-sm p-4 p-md-5 border-light rounded-4 bg-white mt-4">
                    <h1 class="fw-bold text-primary mb-4 display-5"><i class="bi bi-building-fill-check me-3"></i>About Wedugo Education</h1>
                    <p class="lead text-dark lh-base mb-5">Welcome to Wedugo Education, your premier destination for practicing and mastering a diverse range of academic and competitive subjects.</p>
                    <div class="row g-5 mt-2">
                        <div class="col-md-6">
                            <h3 class="h4 fw-bold mb-3 text-dark"><i class="bi bi-geo-alt-fill text-danger me-2"></i>Our Mission</h3>
                            <p class="text-secondary lh-lg fs-6">Our mission is to provide accessible, high-quality multiple-choice questions (MCQs), dynamic testing engines, and conceptual blog guides to aspirants across the globe.</p>
                        </div>
                        <div class="col-md-6">
                            <h3 class="h4 fw-bold mb-3 text-dark"><i class="bi bi-layers-fill text-success me-2"></i>What We Offer</h3>
                            <ul class="text-secondary mb-0 lh-lg fs-6 list-unstyled">
                                <li class="mb-2"><i class="bi bi-check-circle-fill text-success me-2"></i><strong>Mock Sets:</strong> Test your speed with timed sets.</li>
                                <li class="mb-2"><i class="bi bi-check-circle-fill text-success me-2"></i><strong>Detailed Explanations:</strong> Learn the 'why' behind correct answers.</li>
                                <li class="mb-2"><i class="bi bi-check-circle-fill text-success me-2"></i><strong>Rich Blog Content:</strong> Deep dives into complex topics.</li>
                            </ul>
                        </div>
                    </div>
                </div>
            `;
            await fsAsync.writeFile(path.join(aboutDir, 'index.html'), getHtmlShell('About Us: Free Educational Test Platform', aboutContent, 1, "", false));
        });

        let topSetsHtml = '<div class="row g-4 mb-5">';
        globallyGeneratedSets.slice(0, 6).forEach(set => {
            topSetsHtml += `
                <div class="col-md-6 col-lg-4">
                    <a href="${set.link}" class="card shadow-sm border border-light rounded-4 card-hover h-100 text-decoration-none bg-white">
                        <div class="card-body p-4 d-flex flex-column">
                            <span class="badge bg-primary bg-opacity-10 text-primary mb-3 px-3 py-2 w-auto align-self-start border border-primary-subtle"><i class="bi bi-bookmark-fill me-1"></i>${set.category}</span>
                            <h3 class="h5 fw-bold text-dark mb-4 lh-base">Comprehensive Mock Test ${set.setNumber}</h3>
                            <div class="d-flex justify-content-between align-items-center mt-auto border-top pt-3">
                                <span class="text-secondary small fw-bold"><i class="bi bi-ui-checks me-1"></i>10 Questions</span>
                                <span class="btn btn-sm btn-light text-primary fw-bold rounded-pill shadow-sm">Start Test<i class="bi bi-arrow-right ms-2"></i></span>
                            </div>
                        </div>
                    </a>
                </div>
            `;
        });
        topSetsHtml += '</div>';

        masterPageTasks.push(async () => {
            const homeContent = `
                <header class="text-center py-5 mb-5 bg-white rounded-5 shadow-sm border border-light px-4 mt-3 position-relative overflow-hidden" style="background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);">
                    <span class="badge bg-primary bg-opacity-10 text-primary mb-4 px-4 py-2 rounded-pill fs-6 border border-primary-subtle"><i class="bi bi-stars me-2"></i>Free MCQs & Study Guides</span>
                    <h1 class="display-3 fw-bold text-dark mb-4 px-lg-5 tracking-tight">Master Your Exams with Wedugo Education</h1>
                    <p class="col-lg-8 mx-auto fs-5 text-secondary mb-5 lh-lg">Challenge yourself with dynamic exam environments, or dive deep into our detailed blog guides. Access over 50,000+ questions across 50+ categories completely free.</p>
                    <div class="d-flex justify-content-center gap-3 flex-wrap">
                        <a href="./categories/index.html" class="btn btn-primary btn-lg px-5 py-3 shadow-lg fw-bold rounded-pill"><i class="bi bi-lightning-charge-fill me-2"></i>Start Mock Tests</a>
                        <a href="./blog/index.html" class="btn btn-white border border-secondary border-opacity-25 btn-lg px-5 py-3 shadow-sm fw-bold rounded-pill text-dark"><i class="bi bi-journal-text me-2"></i>Read Study Blogs</a>
                    </div>
                </header>
                
                ${getAdBannerHtml("Homepage Top Ad")}
                
                <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-end mb-4 pt-5">
                    <div>
                        <h2 class="display-6 fw-bold mb-2 text-dark"><i class="bi bi-fire text-danger me-2"></i>Popular Mock Tests</h2>
                        <p class="text-secondary mb-0 fs-5">Test your knowledge immediately with our latest timed exam sets.</p>
                    </div>
                    <a href="./categories/index.html" class="btn btn-outline-primary fw-bold rounded-pill px-4 py-2 mt-3 mt-md-0 shadow-sm">View All Mock Tests<i class="bi bi-arrow-right ms-2"></i></a>
                </div>
                ${topSetsHtml}
                
                ${getAdBannerHtml("Homepage Bottom Ad")}
            `;
            await fsAsync.writeFile(path.join(distDir, 'index.html'), getHtmlShell('Wedugo Education: Free MCQ Mock Tests & Study Blogs', homeContent, 0, "", false));
        });

        await executeTasksInBatches(masterPageTasks, 10);

        // 5. Copy Static Assets
        console.log("5. Copying Static Assets...");
        const directoriesToCopy = ['tools', 'main_images'];
        directoriesToCopy.forEach(dirName => {
            const srcDir = path.join(__dirname, dirName);
            const destDir = path.join(distDir, dirName);
            if (fs.existsSync(srcDir)) fs.cpSync(srcDir, destDir, { recursive: true });
        });
        const staticFiles = ['Ads.txt', 'CNAME', '404.html'];
        staticFiles.forEach(file => {
            const sourcePath = path.join(__dirname, file);
            if (fs.existsSync(sourcePath)) fs.copyFileSync(sourcePath, path.join(distDir, file === 'Ads.txt' ? 'ads.txt' : file));
        });

        // 6. SITEMAP
        await generateSitemapAndRobots(distDir, quizCategoriesMap, blogPosts, blogCategoriesMap);

        console.log("✅ Unified Website Build Complete! (Blog & Quizzes Merged, Header Optimized)");
    } catch (error) {
        console.error("Critical Build failed:", error);
    }
}

buildUnifiedSite();
