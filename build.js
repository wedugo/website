const fs = require('fs');
const fsAsync = require('fs').promises;
const path = require('path');

const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQSnJP6ImRuS24j_tOTKA_i1QG_K-DKutrWxjjSbi4WszrZxR90g_1uNaXQqOjnxR2tX9flEFXy7qfY/pub?gid=0&single=true&output=csv";
const SITE_BASE_URL = "https://www.wedugo.com"; 
const ADSENSE_CLIENT_ID = "ca-pub-5947676189341600";

const CATEGORY_LIST = [
    "Indian Geography","World Organisations","Inventions","Physics","Indian Economy","Days and Years","Technology","Chemistry","Honours and Awards","General Science","General Knowledge","Reasoning","Civil Engineering","Hindi","Sports","Computer","Biology","World Geography","Famous Personalities","Aptitude","Madhya Pradesh GK","Solar System","English","Series","Average","Sets","Percentage","Simple Interest","Surds and Indices","Ratio and Proportion","Time and Work","Trains Time","Age","Area","Profit and Loss","Calendar","Simplification","Indian Polity and Constitution","Indian History","World History","History","Environmental Science and Ecology","Blood Relation","Biochemistry","Fats and Fatty Acid Metabolism","Vitamins","Enzymes","Mineral Metabolism","Hormone Metabolism","Distance and Direction","Nucleic Acids","Water and Electrolyte Balance","History of Microbiology","Microbiology","Bacteria and Gram Staining","Agriculture","Solid Mechanics","Child Development and Pedagogy","Virus","Pharmacology","Anatomy","Psychology","Indian General Knowledge"
];

function parseCSVLine(text) {
    const result = [];
    let cur = '', inQuotes = false;
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (char === '"') inQuotes = !inQuotes;
        else if (char === ',' && !inQuotes) { result.push(cur.trim()); cur = ''; }
        else cur += char;
    }
    result.push(cur.trim());
    return result;
}

function chunkArray(array, size) {
    const chunked = [];
    for (let i = 0; i < array.length; i += size) {
        chunked.push(array.slice(i, i + size));
    }
    return chunked;
}

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
    const shuffled = filtered.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

// STANDARDIZED RESPONSIVE ADSENSE BANNER
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

// DESKTOP STICKY ADSENSE SIDEBAR
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
                    <p class="text-secondary small mb-0 lh-lg">Consistent timed testing improves recall speed during competitive examinations. Try our <strong>Live Exam Engine</strong> in the Category Hubs to test full-length sets under realistic constraints.</p>
                </div>
            </div>
        </div>
    `;
}

function getCategorySEOText(category, totalQuestions) {
    return `
        <div class="card bg-white border-0 shadow-sm p-4 p-md-5 mb-5 rounded-4">
            <h2 class="h4 fw-bold text-dark mb-3"><i class="bi bi-journal-bookmark-fill text-primary me-2"></i>Comprehensive Guide to ${category}</h2>
            <p class="text-secondary mb-3 lh-lg" style="font-size: 1.05rem;">
                Welcome to the preparation portal for <strong>${category}</strong>. This module is essential for candidates sitting for <span class="badge bg-light text-dark border">${getExamTarget(category)}</span>. 
            </p>
            <p class="text-secondary mb-0 lh-lg" style="font-size: 1.05rem;">
                Below is our curated syllabus bank of <strong>${totalQuestions} multiple-choice questions (MCQs)</strong> structured for concept mastery and speed training. Work through our timed practice sets or launch a customized exam simulation.
            </p>
        </div>
    `;
}

function getBreadcrumbs(depth, category, safeName, currentTitle) {
    const prefix = depth === 0 ? '.' : '../'.repeat(depth).slice(0, -1);
    return `
        <nav aria-label="breadcrumb" class="mb-4">
            <ol class="breadcrumb bg-white p-3 rounded-4 shadow-sm mb-0 border-0">
                <li class="breadcrumb-item"><a href="${prefix}/index.html" class="text-decoration-none text-primary fw-medium"><i class="bi bi-house-door-fill me-1"></i>Home</a></li>
                <li class="breadcrumb-item"><a href="${prefix}/categories/index.html" class="text-decoration-none text-primary fw-medium">All Topics</a></li>
                ${category ? `<li class="breadcrumb-item"><a href="${prefix}/category/${safeName}/index.html" class="text-decoration-none text-primary fw-medium">${category}</a></li>` : ''}
                ${currentTitle ? `<li class="breadcrumb-item active text-truncate fw-medium" aria-current="page" style="max-width: 250px;">${currentTitle}</li>` : ''}
            </ol>
        </nav>
    `;
}

function getDisqusEmbed(identifierId, prefix) {
    const pageUrl = `${SITE_BASE_URL}/${prefix}`;
    const pageIdentifier = `set_${identifierId}`;

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

function getNavbar(depth) {
    const prefix = depth === 0 ? '.' : '../'.repeat(depth).slice(0, -1);
    const cacheBuster = new Date().getTime(); 
    return `
    <nav class="navbar navbar-expand-lg navbar-dark mb-4 shadow-sm py-3" style="background: linear-gradient(135deg, #0d6efd 0%, #0a58ca 100%);">
        <div class="container">
            <a class="navbar-brand fw-bold fs-4 d-flex align-items-center tracking-tight" href="${prefix}/index.html">
                <img src="${prefix}/main_images/logo.png?v=${cacheBuster}" alt="Wedugo Logo" height="35" class="me-2 d-inline-block align-text-top" onerror="this.style.display='none'">
                Wedugo Education
            </a>
            <button class="navbar-toggler border-0" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav ms-auto fw-medium fs-6 gap-3">
                    <li class="nav-item"><a class="nav-link text-white px-3 rounded-pill hover-bg-light" href="${prefix}/index.html"><i class="bi bi-house me-1"></i>Home</a></li>
                    <li class="nav-item"><a class="nav-link text-white px-3 rounded-pill hover-bg-light" href="${prefix}/categories/index.html"><i class="bi bi-grid me-1"></i>Categories</a></li>
                    <li class="nav-item"><a class="nav-link text-white px-3 rounded-pill hover-bg-light" href="${prefix}/about/index.html"><i class="bi bi-info-circle me-1"></i>About</a></li>
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

function getHtmlShell(title, content, depth, seoDescription = "", isThinPage = false) {
    const cleanDesc = (seoDescription || 'Practice high-quality exam preparation sets and timed mock tests on Wedugo Education.').replace(/"/g, '&quot;').substring(0, 160);
    const prefix = depth === 0 ? '.' : '../'.repeat(depth).slice(0, -1);
    
    // Low-content single question pages get noindex; High-content sets & hubs stay fully indexable
    const metaRobots = isThinPage ? `<meta name="robots" content="noindex, follow">` : `<meta name="robots" content="index, follow">`;

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
    <title>${title} | Wedugo Education</title>
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
        body { background-color: #f1f5f9; font-family: 'Inter', sans-serif; color: #334155; display: flex; flex-direction: column; min-height: 100vh; }
        .hover-bg-light:hover { background-color: rgba(255,255,255,0.1); }
        .card { border: none; border-radius: 16px; box-shadow: 0 4px 15px rgba(0,0,0,0.03); transition: transform 0.3s ease, box-shadow 0.3s ease; }
        .card-hover:hover { transform: translateY(-5px); box-shadow: 0 15px 30px rgba(0,0,0,0.08) !important; }
        .option-btn { text-align: left; padding: 16px 24px; font-weight: 500; font-size: 1.05rem; border-radius: 12px; border: 2px solid #e2e8f0; background: #ffffff; transition: all 0.2s; color: #475569; }
        .option-btn:hover:not(:disabled) { background-color: #f8fafc; border-color: #cbd5e1; transform: translateX(5px); }
        .option-btn.selected { background-color: #eff6ff; border-color: #3b82f6; color: #1d4ed8; box-shadow: 0 4px 10px rgba(59, 130, 246, 0.15); }
        .option-btn.correct-show { background-color: #f0fdf4 !important; border-color: #22c55e !important; color: #15803d !important; font-weight: 600; }
        .option-btn.incorrect-show { background-color: #fef2f2 !important; border-color: #ef4444 !important; color: #b91c1c !important; }
        .option-btn:disabled { opacity: 1; cursor: default; }
        .ad-container { min-height: 100px; background: #fff; border: 1px dashed #cbd5e1; border-radius: 12px; display: block; width: 100%; overflow: hidden; text-align: center; }
        .timer-header { position: sticky; top: 0; z-index: 1020; border-bottom: 4px solid #3b82f6; background: rgba(255,255,255,0.95); backdrop-filter: blur(8px); }
        .sticky-desktop-sidebar { position: sticky; top: 20px; }
        
        /* TESTBOOK EXAM UI */
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

// AUTOMATIC SITEMAP & ROBOTS GENERATOR (Focuses crawl budget on high-value pages)
async function generateSitemapAndRobots(distDir, categoriesMap) {
    console.log("6. Auto-generating SEO Sitemap & Robots.txt for fast indexing...");
    
    const today = new Date().toISOString().split('T')[0];
    const urls = [];

    // 1. Core Platform Pages
    urls.push({ loc: `${SITE_BASE_URL}/`, priority: '1.0', changefreq: 'daily' });
    urls.push({ loc: `${SITE_BASE_URL}/categories/index.html`, priority: '0.9', changefreq: 'weekly' });
    urls.push({ loc: `${SITE_BASE_URL}/about/index.html`, priority: '0.5', changefreq: 'monthly' });

    // 2. High-Value Category Hubs & Full Practice Sets
    const QUESTIONS_PER_PAGE = 10;
    for (const [cat, quizzes] of Object.entries(categoriesMap)) {
        if (!quizzes || quizzes.length === 0) continue;
        
        const safeName = cat.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        
        urls.push({
            loc: `${SITE_BASE_URL}/category/${safeName}/index.html`,
            priority: '0.8',
            changefreq: 'weekly'
        });

        const totalSets = Math.ceil(quizzes.length / QUESTIONS_PER_PAGE);
        for (let s = 1; s <= totalSets; s++) {
            urls.push({
                loc: `${SITE_BASE_URL}/category/${safeName}/set-${s}.html`,
                priority: '0.7',
                changefreq: 'monthly'
            });
        }
    }

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
    for (const u of urls) {
        xml += `  <url>\n`;
        xml += `    <loc>${u.loc}</loc>\n`;
        xml += `    <lastmod>${today}</lastmod>\n`;
        xml += `    <changefreq>${u.changefreq}</changefreq>\n`;
        xml += `    <priority>${u.priority}</priority>\n`;
        xml += `  </url>\n`;
    }
    xml += `</urlset>`;

    await fsAsync.writeFile(path.join(distDir, 'sitemap.xml'), xml, 'utf8');

    const robotsTxt = `User-agent: *
Allow: /

# Fast Indexing Sitemap
Sitemap: ${SITE_BASE_URL}/sitemap.xml
`;
    await fsAsync.writeFile(path.join(distDir, 'robots.txt'), robotsTxt, 'utf8');
    console.log(` -> sitemap.xml generated with ${urls.length} indexable high-value URLs.`);
}

async function executeTasksInBatches(tasks, batchSize = 50) {
    for (let i = 0; i < tasks.length; i += batchSize) {
        const batch = tasks.slice(i, i + batchSize);
        await Promise.all(batch.map(async task => {
            try {
                await task();
            } catch (err) {
                console.error("Batch task warning:", err.message);
            }
        }));
    }
}

async function buildWedugoQuizSite() {
    try {
        console.log("1. Fetching Data from Google Sheets...");
        const response = await fetch(SHEET_CSV_URL);
        const csvText = await response.text();
        const lines = csvText.trim().split(/\r?\n/);
        
        const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase());
        const rows = lines.slice(1).reverse(); 

        const distDir = path.join(__dirname, 'public');
        if (fs.existsSync(distDir)) {
            try { fs.rmSync(distDir, { recursive: true, force: true }); } catch (e) {}
        }
        
        fs.mkdirSync(distDir, { recursive: true });
        const catMainDir = path.join(distDir, 'category');
        fs.mkdirSync(catMainDir, { recursive: true });
        const quizMainDir = path.join(distDir, 'quiz');
        fs.mkdirSync(quizMainDir, { recursive: true });

        const categoriesMap = {};
        CATEGORY_LIST.forEach(cat => categoriesMap[cat] = []);
        categoriesMap['Uncategorized'] = [];

        console.log("2. Processing Rows...");
        rows.forEach((line, index) => {
            const values = parseCSVLine(line);
            if (values.length < headers.length) return; 

            const q = {};
            headers.forEach((h, i) => q[h] = values[i]);

            if (q.question && q.question.includes('à¤')) return;
            if (!q.question) return;

            let matchedCat = 'Uncategorized';
            const sheetCat = (q.qcategory || '').trim().toLowerCase();
            for (const officialCat of CATEGORY_LIST) {
                if (officialCat.toLowerCase() === sheetCat) {
                    matchedCat = officialCat;
                    break;
                }
            }

            const quizId = q.id || (rows.length - index);
            q.quizId = quizId;
            q.matchedCategory = matchedCat;

            categoriesMap[matchedCat].push(q);
        });

        let categoriesGridHtml = '<div class="row g-4">';
        const masterPageTasks = [];
        const globallyGeneratedSets = []; 

        console.log("3. Generating Platform Content & Integrating Ad Units...");
        
        for (const [cat, quizzes] of Object.entries(categoriesMap)) {
            if (!quizzes || quizzes.length === 0) continue; 
            
            const safeName = cat.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            const specificCatDir = path.join(catMainDir, safeName);
            fs.mkdirSync(specificCatDir, { recursive: true });

            let currentCategoryTasks = [];

            // INDIVIDUAL QUIZ PAGES (Ad unit included, marked noindex for safety)
            quizzes.forEach((q, i) => {
                const quizDir = path.join(quizMainDir, String(q.quizId));
                
                const diffData = getDifficultyData(q.question);
                const explanationText = (q.answerdetail && q.answerdetail.trim() !== "") 
                    ? q.answerdetail 
                    : `Reviewing the core principles of <strong>${q.matchedCategory}</strong> will help clarify the concept. The correct option highlights a fundamental fact frequently tested in ${getExamTarget(q.matchedCategory)}.`;

                const relatedQuizzes = getRandomRelated(quizzes, q.quizId, 3);
                let relatedHtml = '';
                if(relatedQuizzes.length > 0) {
                    relatedHtml = `<div class="mt-5"><h4 class="h5 fw-bold mb-4 text-dark border-bottom pb-3"><i class="bi bi-link-45deg me-2 text-primary"></i>Related Questions</h4><div class="row g-3">`;
                    relatedQuizzes.forEach(rq => {
                        relatedHtml += `
                            <div class="col-12">
                                <a href="../${rq.quizId}/index.html" class="card shadow-sm text-decoration-none card-hover bg-white p-4 border-0">
                                    <span class="badge bg-light text-secondary mb-2 border" style="width:fit-content">Q${rq.quizId}</span>
                                    <p class="text-dark fw-medium small mb-0 lh-base">${rq.question.substring(0, 80)}...</p>
                                </a>
                            </div>
                        `;
                    });
                    relatedHtml += `</div></div>`;
                }

                currentCategoryTasks.push(async () => {
                    await fsAsync.mkdir(quizDir, { recursive: true });

                    const prevQuiz = quizzes[i - 1];
                    const nextQuiz = quizzes[i + 1];

                    const navButtonsHtml = `
                        <div class="d-flex justify-content-between align-items-center mt-5 pt-4 border-top">
                            ${prevQuiz ? `<a href="../${prevQuiz.quizId}/index.html" class="btn btn-outline-secondary fw-bold px-4 rounded-pill"><i class="bi bi-arrow-left me-2"></i>Prev</a>` : `<button class="btn btn-outline-secondary fw-bold px-4 rounded-pill" disabled><i class="bi bi-arrow-left me-2"></i>Prev</button>`}
                            ${nextQuiz ? `<a href="../${nextQuiz.quizId}/index.html" class="btn btn-primary fw-bold px-4 rounded-pill shadow-sm">Next<i class="bi bi-arrow-right ms-2"></i></a>` : `<button class="btn btn-primary fw-bold px-4 rounded-pill shadow-sm" disabled>Next<i class="bi bi-arrow-right ms-2"></i></button>`}
                        </div>
                    `;

                    const quizContent = `
                        ${getBreadcrumbs(2, q.matchedCategory, safeName, 'Question ' + q.quizId)}
                        <div class="row">
                            <div class="col-lg-8">
                                ${getAdBannerHtml("Top Ad")}
                                
                                <article class="card p-4 p-md-5 mb-4 bg-white shadow-sm border-0 rounded-4">
                                    <header class="mb-4 border-bottom pb-4">
                                        <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
                                            <a href="../../category/${safeName}/index.html" class="badge bg-primary text-decoration-none px-3 py-2 rounded-pill"><i class="bi bi-folder2-open me-1"></i>${q.matchedCategory}</a>
                                            <span class="badge bg-${diffData.color} bg-opacity-10 text-${diffData.color} border border-${diffData.color}-subtle px-3 py-2 rounded-pill"><i class="bi bi-bar-chart-fill me-1"></i>${diffData.label}</span>
                                            <span class="badge bg-light text-secondary border ms-auto fs-6 font-monospace rounded-pill px-3 py-2" id="single-timer"><i class="bi bi-stopwatch me-2"></i>00:00</span>
                                        </div>
                                        <h1 class="h4 fw-bold text-dark lh-base mt-3" style="line-height: 1.6 !important;">${q.question}</h1>
                                    </header>

                                    <div class="d-grid gap-3 mb-4" id="options-container">
                                        <button class="btn option-btn" onclick="checkAnswer(this, 'A')">A) ${q.answer1 || ''}</button>
                                        <button class="btn option-btn" onclick="checkAnswer(this, 'B')">B) ${q.answer2 || ''}</button>
                                        <button class="btn option-btn" onclick="checkAnswer(this, 'C')">C) ${q.answer3 || ''}</button>
                                        <button class="btn option-btn" onclick="checkAnswer(this, 'D')">D) ${q.answer4 || ''}</button>
                                    </div>
                                    
                                    <div id="explanation-box" class="alert mt-4 d-none p-4 rounded-4 border">
                                        <h5 class="alert-heading fw-bold mb-3 d-flex align-items-center" id="result-title"></h5>
                                        <hr class="opacity-25">
                                        <div class="mt-3">
                                            <h6 class="fw-bold text-dark mb-2"><i class="bi bi-lightbulb-fill text-warning me-2"></i>Detailed Solution:</h6>
                                            <p class="mb-0 text-dark lh-lg" style="font-size: 1.05rem;">${explanationText}</p>
                                        </div>
                                    </div>
                                    
                                    ${navButtonsHtml}
                                    
                                    ${getAdBannerHtml("In-Content Ad")}
                                    ${relatedHtml}
                                    
                                    <div class="mt-5 pt-5 border-top">
                                        <div class="bg-light p-4 p-md-5 rounded-4 border">
                                            <h4 class="h4 fw-bold mb-3 text-dark"><i class="bi bi-chat-square-text-fill text-primary me-2"></i>Discussion</h4>
                                            ${getDisqusEmbed(q.quizId, `quiz/${q.quizId}`)}
                                        </div>
                                    </div>
                                </article>
                            </div>
                            ${getAdSidebar()}
                        </div>
                        <script>
                            let seconds = 0;
                            let singleTimerInterval;
                            let hasAnswered = false;

                            function updateSingleTimer() {
                                seconds++;
                                let m = Math.floor(seconds / 60);
                                let s = seconds % 60;
                                document.getElementById('single-timer').innerHTML = '<i class="bi bi-stopwatch me-2"></i>' + (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
                            }
                            
                            window.addEventListener('load', function() {
                                singleTimerInterval = setInterval(updateSingleTimer, 1000);
                            });

                            function checkAnswer(btnElement, selectedLetter) {
                                if(hasAnswered) return;
                                hasAnswered = true;
                                clearInterval(singleTimerInterval); 

                                const correctLetter = "${(q.mainanswer || '').toString().replace(/[^A-D]/gi, '').toUpperCase()}";
                                const answerTexts = {
                                    'A': "${(q.answer1 || '').replace(/'/g, "\\'")}",
                                    'B': "${(q.answer2 || '').replace(/'/g, "\\'")}",
                                    'C': "${(q.answer3 || '').replace(/'/g, "\\'")}",
                                    'D': "${(q.answer4 || '').replace(/'/g, "\\'")}"
                                };
                                const explanationBox = document.getElementById('explanation-box');
                                const resultTitle = document.getElementById('result-title');
                                document.querySelectorAll('.option-btn').forEach(btn => btn.disabled = true);
                                explanationBox.classList.remove('d-none', 'alert-success', 'alert-danger');
                                if(selectedLetter === correctLetter) {
                                    btnElement.classList.add('correct-show');
                                    explanationBox.classList.add('alert-success', 'border-success', 'border-opacity-25');
                                    resultTitle.innerHTML = "✨ Correct Answer! Time taken: " + document.getElementById('single-timer').innerText.trim();
                                } else {
                                    btnElement.classList.add('incorrect-show');
                                    explanationBox.classList.add('alert-danger', 'border-danger', 'border-opacity-25');
                                    resultTitle.innerHTML = "❌ Incorrect. The right answer is " + correctLetter + ") " + answerTexts[correctLetter];
                                }
                            }
                        </script>
                    `;
                    // Flagged as true for noindex (keeps domain clean from thin-content penalties)
                    await fsAsync.writeFile(path.join(quizDir, 'index.html'), getHtmlShell(q.question.substring(0,40) + '...', quizContent, 2, q.question, true));
                });
            });

            // 10-QUESTION PRACTICE SETS (High-Value Indexable Content)
            const QUESTIONS_PER_PAGE = 10;
            const sets = chunkArray(quizzes, QUESTIONS_PER_PAGE);
            let practiceSetsHtml = '<div class="row g-4 mb-4">';

            sets.forEach((setQuizzes, setIndex) => {
                const setNumber = setIndex + 1;
                const setFileName = `set-${setNumber}.html`;
                
                if (globallyGeneratedSets.length < 20) {
                    globallyGeneratedSets.push({
                        category: cat,
                        safeName: safeName,
                        setNumber: setNumber,
                        link: `./category/${safeName}/${setFileName}`
                    });
                }

                currentCategoryTasks.push(async () => {
                    let setQuestionsHtml = '';
                    let answersMapScript = [];

                    setQuizzes.forEach((q, qIndex) => {
                        const correctLetter = (q.mainanswer || '').toString().replace(/[^A-D]/gi, '').toUpperCase();
                        const diffData = getDifficultyData(q.question);
                        const explanationText = (q.answerdetail && q.answerdetail.trim() !== "") ? q.answerdetail : `Consistent practice is the key to mastering these patterns for ${getExamTarget(q.matchedCategory)}.`;

                        answersMapScript.push(`'${q.quizId}': '${correctLetter}'`);
                        
                        setQuestionsHtml += `
                            <article class="card p-4 p-md-5 mb-5 bg-white border border-light rounded-4" id="quiz-block-${q.quizId}">
                                <div class="d-flex align-items-center flex-wrap gap-2 mb-4 pb-4 border-bottom">
                                    <span class="badge bg-primary rounded-pill me-2 px-3 py-2 fs-6">Question ${(setIndex * QUESTIONS_PER_PAGE) + qIndex + 1}</span>
                                    <span class="badge bg-${diffData.color} bg-opacity-10 text-${diffData.color} border border-${diffData.color}-subtle px-3 py-2 rounded-pill fs-6">${diffData.label}</span>
                                </div>
                                <h3 class="h4 fw-bold text-dark mb-4 lh-base" style="line-height: 1.6 !important;">${q.question}</h3>
                                
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

                        // Inject mid-set ad between question 5 and 6
                        if (qIndex === 4) {
                            setQuestionsHtml += getAdBannerHtml("Mid-Test Ad");
                        }
                    });

                    const prevSetBtn = setIndex > 0 ? `<a href="set-${setNumber - 1}.html" class="btn btn-outline-secondary px-4 py-3 fw-bold rounded-pill"><i class="bi bi-arrow-left me-2"></i>Previous Set</a>` : '';
                    const nextSetBtn = setIndex < sets.length - 1 ? `<a href="set-${setNumber + 1}.html" class="btn btn-primary px-4 py-3 shadow fw-bold rounded-pill">Next Set<i class="bi bi-arrow-right ms-2"></i></a>` : '';

                    const setPageContent = `
                        ${getBreadcrumbs(2, cat, safeName, `Practice Set ${setNumber}`)}
                        <div class="row">
                            <div class="col-lg-8">
                                ${getAdBannerHtml("Top Ad")}
                                
                                <div class="timer-header p-4 shadow-sm d-flex flex-wrap gap-3 justify-content-between align-items-center mb-5 rounded-4 border">
                                    <div>
                                        <h1 class="h3 fw-bold text-dark mb-2">${cat} - Mock Test ${setNumber}</h1>
                                        <p class="text-muted mb-0 fs-6">Answer all 10 questions, then click submit to view your academic score and explanations.</p>
                                    </div>
                                    <div class="text-center ms-auto bg-light p-3 rounded-4 border">
                                        <span class="d-block text-muted small fw-bold text-uppercase mb-1">Time Remaining</span>
                                        <div class="fs-3 fw-bold font-monospace text-danger" id="timer-display"><i class="bi bi-stopwatch me-2"></i>10:00</div>
                                    </div>
                                </div>

                                <div id="score-board" class="card shadow-lg border-success d-none mb-5 text-center p-5 rounded-4 bg-success bg-opacity-10" style="border-width: 2px !important;">
                                    <div class="display-1 text-success mb-3"><i class="bi bi-check-circle-fill"></i></div>
                                    <h2 class="text-success fw-bold display-6 mb-4">Test Completed Successfully!</h2>
                                    <p class="fs-4 text-dark mb-3">Your Final Academic Score:</p>
                                    <div class="display-1 fw-bold text-success mb-4" id="final-score">0 / 10</div>
                                    <p class="text-muted fs-5 lh-lg">Review your solutions below.</p>
                                    <a href="index.html" class="btn btn-success btn-lg mt-3 rounded-pill px-5 fw-bold">Back to ${cat} Hub</a>
                                </div>
                                
                                <div class="practice-set-container">
                                    ${setQuestionsHtml}
                                </div>
                                
                                <div class="text-center mt-5 mb-5" id="submit-container">
                                    <button class="btn btn-success btn-lg px-5 py-4 fw-bold shadow-lg rounded-pill fs-4 w-100 w-md-auto" onclick="submitTest()">
                                        <i class="bi bi-journal-check me-2"></i>Submit Test & View Explanations
                                    </button>
                                </div>
                                
                                <div class="d-flex justify-content-between mt-5 pt-4 border-top">
                                    <div>${prevSetBtn}</div>
                                    <div>${nextSetBtn}</div>
                                </div>

                                <div class="mt-5 pt-5 border-top">
                                    <div class="card bg-white border-0 shadow-sm p-4 p-md-5 rounded-4">
                                        <h4 class="h3 fw-bold mb-4 text-dark"><i class="bi bi-chat-square-text-fill text-primary me-2"></i>Community Discussion</h4>
                                        ${getDisqusEmbed(`${safeName}_set_${setNumber}`, `category/${safeName}/${setFileName}`)}
                                    </div>
                                </div>
                            </div>
                            ${getAdSidebar()}
                        </div>

                        <script>
                            const correctAnswers = { ${answersMapScript.join(', ')} };
                            const userAnswers = {};
                            let timeLeft = 600; 
                            let timerInterval;
                            let testSubmitted = false;

                            function startTimer() {
                                const display = document.getElementById('timer-display');
                                timerInterval = setInterval(() => {
                                    if(testSubmitted) return;
                                    timeLeft--;
                                    let m = Math.floor(timeLeft / 60);
                                    let s = timeLeft % 60;
                                    display.innerHTML = '<i class="bi bi-stopwatch me-2"></i>' + (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
                                    if (timeLeft <= 0) {
                                        clearInterval(timerInterval);
                                        submitTest();
                                    }
                                }, 1000);
                            }

                            function selectOption(quizId, letter, btn) {
                                if(testSubmitted) return; 
                                const container = document.getElementById('quiz-block-' + quizId);
                                container.querySelectorAll('.option-btn').forEach(b => {
                                    b.classList.remove('selected');
                                });
                                btn.classList.add('selected');
                                userAnswers[quizId] = letter;
                            }

                            function submitTest() {
                                if(testSubmitted) return;
                                testSubmitted = true;
                                clearInterval(timerInterval);
                                document.getElementById('submit-container').style.display = 'none';
                                
                                let score = 0;
                                let total = Object.keys(correctAnswers).length;

                                for (let quizId in correctAnswers) {
                                    const correct = correctAnswers[quizId];
                                    const user = userAnswers[quizId];
                                    const container = document.getElementById('quiz-block-' + quizId);
                                    const explanation = document.getElementById('explanation-' + quizId);
                                    const title = document.getElementById('result-title-' + quizId);
                                    
                                    container.querySelectorAll('.option-btn').forEach(btn => {
                                        btn.disabled = true;
                                        btn.classList.remove('selected');
                                        
                                        const btnLetter = btn.getAttribute('data-letter');
                                        if (btnLetter === correct) {
                                            btn.classList.add('correct-show');
                                        } else if (btnLetter === user && user !== correct) {
                                            btn.classList.add('incorrect-show');
                                        }
                                    });

                                    explanation.classList.remove('d-none');
                                    if (user === correct) {
                                        score++;
                                        explanation.classList.add('alert-success', 'border-success', 'border-opacity-25');
                                        title.innerHTML = "✨ Correct!";
                                    } else if (!user) {
                                        explanation.classList.add('alert-warning', 'border-warning', 'border-opacity-25');
                                        title.innerHTML = "⚠️ Unanswered. Correct Option: " + correct;
                                    } else {
                                        explanation.classList.add('alert-danger', 'border-danger', 'border-opacity-25');
                                        title.innerHTML = "❌ Incorrect. Correct Option: " + correct;
                                    }
                                }
                                
                                const scoreBoard = document.getElementById('score-board');
                                scoreBoard.classList.remove('d-none');
                                document.getElementById('final-score').innerText = score + " / " + total;
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }

                            window.onload = startTimer;
                        </script>
                    `;
                    // Retained as indexable thick content
                    await fsAsync.writeFile(path.join(specificCatDir, setFileName), getHtmlShell(`${cat} Practice Set ${setNumber}`, setPageContent, 2, "", false));
                });

                practiceSetsHtml += `
                    <div class="col-sm-6 col-lg-4">
                        <a href="${setFileName}" class="card shadow-sm text-decoration-none card-hover h-100 p-4 border border-light rounded-4 bg-white d-block">
                            <div class="d-flex align-items-center mb-3">
                                <div class="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center" style="width: 50px; height: 50px;">
                                    <i class="bi bi-card-checklist fs-4"></i>
                                </div>
                                <h5 class="fw-bold text-dark mb-0 ms-3">Mock Set ${setNumber}</h5>
                            </div>
                            <hr class="opacity-10 my-3">
                            <div class="d-flex justify-content-between text-secondary mt-2">
                                <small class="fw-medium"><i class="bi bi-ui-checks me-1"></i>10 Qs</small>
                                <small class="fw-bold text-danger"><i class="bi bi-stopwatch me-1"></i>10 Mins</small>
                            </div>
                        </a>
                    </div>
                `;
            });
            practiceSetsHtml += '</div>';

            // CATEGORY MASTER PAGE (With Ads & Live Exam Engine)
            const safeCategoryDataString = JSON.stringify(quizzes).replace(/</g, '\\u003c');

            if (CATEGORY_LIST.includes(cat)) {
                currentCategoryTasks.push(async () => {
                    let catPageContent = `
                        <div class="row">
                            <div class="col-12">
                                ${getBreadcrumbs(2, cat, safeName, '')}
                                
                                ${getAdBannerHtml("Top Banner Ad")}
                                
                                <div id="setup-view">
                                    <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-end mb-4">
                                        <h1 class="display-5 fw-bold mb-3 mb-md-0 text-dark">${cat} MCQs & Study Guide</h1>
                                        <span class="badge bg-primary fs-5 px-4 py-2 rounded-pill shadow-sm">${quizzes.length} Questions</span>
                                    </div>
                                    
                                    ${getCategorySEOText(cat, quizzes.length)}
                                    
                                    <div class="card shadow-sm border-0 p-4 p-md-5 mb-5 rounded-4 bg-primary text-white" style="background: linear-gradient(135deg, #0d6efd 0%, #0a58ca 100%);">
                                        <div class="text-center mb-4">
                                            <h3 class="fw-bold display-6 text-white"><i class="bi bi-rocket-takeoff-fill me-3"></i>Generate Custom Live Exam</h3>
                                            <p class="fs-5 text-white-50 mt-3">Simulate exam conditions with custom question limits and automatic scoring.</p>
                                        </div>
                                        <div class="row justify-content-center mt-4">
                                            <div class="col-md-8 col-lg-6">
                                                <div class="input-group input-group-lg mb-4 shadow">
                                                    <span class="input-group-text bg-white border-0 fw-bold text-primary"><i class="bi bi-funnel-fill me-2"></i>Select Limit:</span>
                                                    <select class="form-select border-0 fw-bold text-dark" id="custom-q-count">
                                                        <option value="10">10 Questions (10 Mins)</option>
                                                        <option value="20" selected>20 Questions (20 Mins)</option>
                                                        <option value="30">30 Questions (30 Mins)</option>
                                                        <option value="50">50 Questions (50 Mins)</option>
                                                        <option value="100">100 Questions (100 Mins)</option>
                                                    </select>
                                                </div>
                                                <button class="btn btn-light text-primary btn-lg w-100 fw-bold shadow-lg py-3 fs-4 rounded-pill" onclick="startCustomExam()"><i class="bi bi-play-circle-fill me-2"></i>Start Live Exam Now</button>
                                            </div>
                                        </div>
                                    </div>

                                    ${getAdBannerHtml("In-Feed Hub Ad")}

                                    <div class="mt-5 mb-5">
                                        <div class="d-flex align-items-center mb-4 border-bottom pb-3">
                                            <span class="fs-1 me-3 text-primary"><i class="bi bi-bullseye"></i></span>
                                            <div>
                                                <h3 class="h3 fw-bold text-dark mb-1">Standard Structured Sets</h3>
                                                <p class="text-secondary mb-0 fs-6">Pre-built 10-question mock exams.</p>
                                            </div>
                                        </div>
                                        ${practiceSetsHtml}
                                    </div>
                                </div>
                                
                                <div id="exam-view" class="d-none">
                                    <div class="row g-4">
                                        <div class="col-lg-8">
                                            <div class="card shadow-sm border border-light rounded-4 h-100 d-flex flex-column bg-white">
                                                <div class="card-header bg-white border-bottom p-4 d-flex justify-content-between align-items-center rounded-top-4">
                                                    <span class="badge bg-primary fs-5 px-4 py-2 rounded-pill" id="ce-q-number">Question 1</span>
                                                    <button class="btn btn-outline-danger fw-bold rounded-pill px-4" onclick="quitExam()"><i class="bi bi-x-circle me-2"></i>Quit Exam</button>
                                                </div>
                                                <div class="card-body p-4 p-md-5 flex-grow-1">
                                                    <h3 class="h4 fw-bold text-dark mb-5 lh-base" id="ce-q-text" style="line-height: 1.6 !important;">Loading question...</h3>
                                                    <div class="d-grid gap-3 ps-md-2" id="ce-options-container">
                                                        <button class="btn option-btn" id="ce-opt-A" onclick="selectCEOption('A')"></button>
                                                        <button class="btn option-btn" id="ce-opt-B" onclick="selectCEOption('B')"></button>
                                                        <button class="btn option-btn" id="ce-opt-C" onclick="selectCEOption('C')"></button>
                                                        <button class="btn option-btn" id="ce-opt-D" onclick="selectCEOption('D')"></button>
                                                    </div>
                                                    
                                                    <div id="ce-solution-box" class="alert mt-5 d-none p-4 p-md-5 border rounded-4 bg-light">
                                                        <h5 class="alert-heading fw-bold fs-4 mb-3" id="ce-result-title"></h5>
                                                        <hr class="opacity-25 mb-4">
                                                        <h6 class="fw-bold text-dark mb-3 fs-5"><i class="bi bi-lightbulb-fill text-warning me-2"></i>Detailed Solution:</h6>
                                                        <p class="mb-0 text-dark lh-lg" id="ce-solution-text" style="font-size: 1.1rem;"></p>
                                                    </div>
                                                </div>
                                                <div class="card-footer bg-white border-top p-4 d-flex justify-content-between rounded-bottom-4">
                                                    <button class="btn btn-outline-secondary px-5 py-3 fw-bold rounded-pill" onclick="navCEPrev()"><i class="bi bi-arrow-left me-2"></i>Previous</button>
                                                    <button class="btn btn-primary px-5 py-3 fw-bold shadow-sm rounded-pill" onclick="navCENext()">Next<i class="bi bi-arrow-right ms-2"></i></button>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div class="col-lg-4">
                                            <div class="exam-sidebar shadow-sm h-100 d-flex flex-column bg-white">
                                                <div class="text-center mb-4 bg-light p-4 rounded-4 border">
                                                    <span class="d-block text-secondary small fw-bold text-uppercase mb-2">Time Remaining</span>
                                                    <div class="fs-1 fw-bold font-monospace text-danger" id="ce-timer">00:00</div>
                                                </div>
                                                
                                                <div class="bg-white p-4 rounded-4 border mb-4 flex-grow-1 shadow-sm">
                                                    <h6 class="fw-bold border-bottom pb-3 text-dark"><i class="bi bi-grid-3x3-gap-fill text-primary me-2"></i>Question Palette</h6>
                                                    <div class="palette-grid" id="ce-palette"></div>
                                                </div>
                                                
                                                <div class="bg-light p-4 rounded-4 border mb-4">
                                                    <h6 class="fw-bold small mb-3 text-secondary text-uppercase">Legend:</h6>
                                                    <div class="d-flex justify-content-between small fw-bold text-dark">
                                                        <div><span class="legend-box legend-correct" id="legend-green"></span> <span id="leg-g-txt">Correct</span></div>
                                                        <div><span class="legend-box legend-incorrect" id="legend-red"></span> <span id="leg-r-txt">Incorrect</span></div>
                                                        <div><span class="legend-box legend-unattempted" style="background:#3b82f6; border-color:#3b82f6" id="legend-blue"></span> <span id="leg-b-txt">Attempted</span></div>
                                                    </div>
                                                </div>
                                                
                                                <button class="btn btn-success btn-lg w-100 fw-bold shadow-lg mt-auto py-3 rounded-pill" id="ce-submit-btn" onclick="submitCustomExam()"><i class="bi bi-check-circle-fill me-2"></i>Submit Final Test</button>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div id="ce-score-board" class="card shadow-lg border-success d-none mt-5 text-center p-5 rounded-4 bg-success bg-opacity-10" style="border-width: 2px !important;">
                                        <div class="display-1 text-success mb-3"><i class="bi bi-trophy-fill"></i></div>
                                        <h2 class="text-success fw-bold display-5 mb-4">Exam Completed!</h2>
                                        <p class="fs-4 text-dark mb-3">Your Final Score:</p>
                                        <div class="display-1 fw-bold text-success mb-4" id="ce-final-score">0 / 0</div>
                                        <p class="text-secondary fs-5 lh-lg mb-4">Click on the question numbers in the palette above to view solutions.</p>
                                        <button class="btn btn-success btn-lg px-5 py-3 rounded-pill fw-bold shadow" onclick="quitExam()"><i class="bi bi-house-fill me-2"></i>Return to Category Hub</button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <script>
                            const allQuestionsData = ${safeCategoryDataString};
                            let examQuestions = [];
                            let ceUserAnswers = {};
                            let currentQIndex = 0;
                            let ceTimerInterval;
                            let ceTimeLeft = 0;
                            let isExamSubmitted = false;

                            function startCustomExam() {
                                const qCount = parseInt(document.getElementById('custom-q-count').value);
                                
                                let shuffled = allQuestionsData.sort(() => 0.5 - Math.random());
                                examQuestions = shuffled.slice(0, Math.min(qCount, shuffled.length));
                                
                                ceUserAnswers = {};
                                currentQIndex = 0;
                                isExamSubmitted = false;
                                ceTimeLeft = examQuestions.length * 60; 
                                
                                document.getElementById('setup-view').classList.add('d-none');
                                document.getElementById('exam-view').classList.remove('d-none');
                                document.getElementById('ce-score-board').classList.add('d-none');
                                document.getElementById('ce-submit-btn').classList.remove('d-none');
                                
                                document.getElementById('legend-green').style.backgroundColor = '#fff';
                                document.getElementById('leg-g-txt').innerText = 'Unattempted';
                                document.getElementById('legend-red').style.display = 'none';
                                document.getElementById('leg-r-txt').style.display = 'none';
                                
                                buildPalette();
                                renderCEQuestion(0);
                                
                                clearInterval(ceTimerInterval);
                                ceTimerInterval = setInterval(updateCETimer, 1000);
                                updateCETimer();
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }

                            function updateCETimer() {
                                if (isExamSubmitted) return;
                                ceTimeLeft--;
                                let m = Math.floor(ceTimeLeft / 60);
                                let s = ceTimeLeft % 60;
                                document.getElementById('ce-timer').innerHTML = '<i class="bi bi-stopwatch me-2"></i>' + (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
                                if (ceTimeLeft <= 0) {
                                    clearInterval(ceTimerInterval);
                                    submitCustomExam();
                                }
                            }

                            function buildPalette() {
                                const palette = document.getElementById('ce-palette');
                                palette.innerHTML = '';
                                examQuestions.forEach((q, i) => {
                                    const node = document.createElement('div');
                                    node.className = 'q-node';
                                    node.id = 'node-' + i;
                                    node.innerText = i + 1;
                                    node.onclick = () => renderCEQuestion(i);
                                    palette.appendChild(node);
                                });
                            }

                            function renderCEQuestion(index) {
                                currentQIndex = index;
                                const q = examQuestions[index];
                                
                                document.querySelectorAll('.q-node').forEach(n => n.classList.remove('active'));
                                document.getElementById('node-' + index).classList.add('active');
                                
                                document.getElementById('ce-q-number').innerText = 'Question ' + (index + 1);
                                document.getElementById('ce-q-text').innerText = q.question;
                                
                                const opts = ['A', 'B', 'C', 'D'];
                                opts.forEach(letter => {
                                    const btn = document.getElementById('ce-opt-' + letter);
                                    btn.innerText = letter + ') ' + q['answer' + (opts.indexOf(letter)+1)];
                                    btn.className = 'btn option-btn'; 
                                    btn.disabled = isExamSubmitted; 
                                    
                                    if (ceUserAnswers[index] === letter) {
                                        btn.classList.add('selected');
                                    }
                                    
                                    if (isExamSubmitted) {
                                        const correctLetter = (q.mainanswer || '').toString().replace(/[^A-D]/gi, '').toUpperCase();
                                        if (letter === correctLetter) btn.classList.add('correct-show');
                                        else if (ceUserAnswers[index] === letter) btn.classList.add('incorrect-show');
                                    }
                                });
                                
                                const solBox = document.getElementById('ce-solution-box');
                                if (isExamSubmitted) {
                                    solBox.classList.remove('d-none');
                                    const correctLetter = (q.mainanswer || '').toString().replace(/[^A-D]/gi, '').toUpperCase();
                                    const title = document.getElementById('ce-result-title');
                                    if (ceUserAnswers[index] === correctLetter) {
                                        solBox.className = 'alert mt-5 p-4 p-md-5 border rounded-4 alert-success border-success border-opacity-25';
                                        title.innerHTML = '<i class="bi bi-check-circle-fill me-2"></i>Correct!';
                                    } else if (!ceUserAnswers[index]) {
                                        solBox.className = 'alert mt-5 p-4 p-md-5 border rounded-4 alert-warning border-warning border-opacity-25';
                                        title.innerHTML = '<i class="bi bi-exclamation-triangle-fill me-2"></i>Unanswered. Correct: ' + correctLetter;
                                    } else {
                                        solBox.className = 'alert mt-5 p-4 p-md-5 border rounded-4 alert-danger border-danger border-opacity-25';
                                        title.innerHTML = '<i class="bi bi-x-circle-fill me-2"></i>Incorrect. Correct: ' + correctLetter;
                                    }
                                    document.getElementById('ce-solution-text').innerText = q.answerdetail || 'Standard foundational principle.';
                                } else {
                                    solBox.classList.add('d-none');
                                }
                            }

                            function selectCEOption(letter) {
                                if (isExamSubmitted) return;
                                ceUserAnswers[currentQIndex] = letter;
                                
                                const opts = ['A', 'B', 'C', 'D'];
                                opts.forEach(l => document.getElementById('ce-opt-' + l).classList.remove('selected'));
                                document.getElementById('ce-opt-' + letter).classList.add('selected');
                                
                                document.getElementById('node-' + currentQIndex).classList.add('attempted');
                            }

                            function navCEPrev() {
                                if (currentQIndex > 0) renderCEQuestion(currentQIndex - 1);
                            }
                            function navCENext() {
                                if (currentQIndex < examQuestions.length - 1) renderCEQuestion(currentQIndex + 1);
                            }

                            function submitCustomExam() {
                                if (isExamSubmitted) return;
                                if(ceTimeLeft > 0 && !confirm("Are you sure you want to submit the exam?")) return;
                                
                                isExamSubmitted = true;
                                clearInterval(ceTimerInterval);
                                document.getElementById('ce-submit-btn').classList.add('d-none');
                                
                                let score = 0;
                                examQuestions.forEach((q, i) => {
                                    const correct = (q.mainanswer || '').toString().replace(/[^A-D]/gi, '').toUpperCase();
                                    const user = ceUserAnswers[i];
                                    const node = document.getElementById('node-' + i);
                                    node.classList.remove('attempted'); 
                                    
                                    if (user === correct) {
                                        score++;
                                        node.classList.add('correct');
                                    } else if (user) {
                                        node.classList.add('incorrect');
                                    }
                                });
                                
                                document.getElementById('legend-green').style.backgroundColor = '#22c55e';
                                document.getElementById('legend-green').style.borderColor = '#22c55e';
                                document.getElementById('leg-g-txt').innerText = 'Correct';
                                document.getElementById('legend-red').style.display = 'inline-block';
                                document.getElementById('leg-r-txt').style.display = 'inline';
                                document.getElementById('leg-b-txt').innerText = 'Unattempted';
                                document.getElementById('legend-blue').style.backgroundColor = '#fff';
                                document.getElementById('legend-blue').style.borderColor = '#cbd5e1';
                                
                                document.getElementById('ce-score-board').classList.remove('d-none');
                                document.getElementById('ce-final-score').innerText = score + " / " + examQuestions.length;
                                
                                renderCEQuestion(currentQIndex);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }

                            function quitExam() {
                                if(!isExamSubmitted && !confirm("Quit without saving?")) return;
                                clearInterval(ceTimerInterval);
                                document.getElementById('exam-view').classList.add('d-none');
                                document.getElementById('setup-view').classList.remove('d-none');
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }
                        </script>
                    `;
                    await fsAsync.writeFile(path.join(specificCatDir, 'index.html'), getHtmlShell(`${cat} MCQs & Live Exam Engine`, catPageContent, 2, "", false));
                });

                categoriesGridHtml += `
                    <div class="col-md-6 col-lg-4">
                        <div class="card shadow-sm h-100 card-hover border-light rounded-4 overflow-hidden bg-white">
                            <div class="card-body p-4 p-xl-5 text-center d-flex flex-column justify-content-center">
                                <div class="mb-4 bg-primary bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mx-auto" style="width: 80px; height: 80px;">
                                    <i class="bi bi-display fs-1 text-primary"></i>
                                </div>
                                <h3 class="h4 fw-bold mb-3 text-dark">${cat}</h3>
                                <p class="text-secondary mb-4 fs-6 lh-lg">Live Testbook-style exam simulation with ${quizzes.length} questions.</p>
                                <a href="../category/${safeName}/index.html" class="btn btn-outline-primary mt-auto w-100 fw-bold py-3 rounded-pill shadow-sm">Launch Exam Engine</a>
                            </div>
                        </div>
                    </div>
                `;
            }

            await executeTasksInBatches(currentCategoryTasks, 50);
            currentCategoryTasks = null; 
        }

        console.log("4. Building Core Pages with Advertisements...");
        const categoriesDir = path.join(distDir, 'categories');
        fs.mkdirSync(categoriesDir, { recursive: true });
        masterPageTasks.push(async () => {
            const categoriesContent = `
                ${getBreadcrumbs(1, '', '', 'All Categories')}
                ${getAdBannerHtml("Top Ad")}
                <div class="mb-5 text-center py-5">
                    <h1 class="display-4 fw-bold mb-4 text-dark">Explore Knowledge Topics</h1>
                    <p class="lead text-secondary col-lg-8 mx-auto lh-lg">Select a subject below to launch dynamic custom exams, timed mock sets, and detailed educational explanations.</p>
                </div>
                ${categoriesGridHtml}
                ${getAdBannerHtml("Bottom Ad")}
            `;
            await fsAsync.writeFile(path.join(categoriesDir, 'index.html'), getHtmlShell('All Categories & Exam Engines', categoriesContent, 1, "", false));
        });

        const aboutDir = path.join(distDir, 'about');
        fs.mkdirSync(aboutDir, { recursive: true });
        masterPageTasks.push(async () => {
            const aboutContent = `
                ${getBreadcrumbs(1, '', '', 'About Us')}
                ${getAdBannerHtml("Top Ad")}
                <div class="card shadow-sm p-4 p-md-5 border-light rounded-4 bg-white">
                    <h1 class="fw-bold text-primary mb-4 display-5"><i class="bi bi-building-fill-check me-3"></i>About Wedugo Education</h1>
                    <p class="lead text-dark lh-base mb-5">Welcome to Wedugo Education, your premier destination for practicing and mastering a diverse range of academic and competitive subjects.</p>
                    <div class="row g-5 mt-2">
                        <div class="col-md-6">
                            <h3 class="h4 fw-bold mb-3 text-dark"><i class="bi bi-geo-alt-fill text-danger me-2"></i>Our Mission</h3>
                            <p class="text-secondary lh-lg fs-6">Our mission is to provide accessible, high-quality multiple-choice questions (MCQs) and dynamic testing engines to aspirants across the globe.</p>
                        </div>
                        <div class="col-md-6">
                            <h3 class="h4 fw-bold mb-3 text-dark"><i class="bi bi-layers-fill text-success me-2"></i>What We Offer</h3>
                            <ul class="text-secondary mb-0 lh-lg fs-6 list-unstyled">
                                <li class="mb-2"><i class="bi bi-check-circle-fill text-success me-2"></i><strong>Dynamic Exam Engine:</strong> Choose how many questions you want to simulate real testing environments.</li>
                                <li class="mb-2"><i class="bi bi-check-circle-fill text-success me-2"></i><strong>Massive Question Bank:</strong> Over 50,000 carefully curated questions.</li>
                                <li class="mb-2"><i class="bi bi-check-circle-fill text-success me-2"></i><strong>Detailed Explanations:</strong> Learn the 'why' behind the correct answers.</li>
                            </ul>
                        </div>
                    </div>
                </div>
            `;
            await fsAsync.writeFile(path.join(aboutDir, 'index.html'), getHtmlShell('About Wedugo Education', aboutContent, 1, "", false));
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
                    <span class="badge bg-danger bg-opacity-10 text-danger mb-4 px-4 py-2 rounded-pill fs-6 border border-danger-subtle"><i class="bi bi-stars me-2"></i>New Custom Exam Engines Available</span>
                    <h1 class="display-3 fw-bold text-dark mb-4 px-lg-5 tracking-tight">Master Your Exams with Wedugo Education</h1>
                    <p class="col-lg-8 mx-auto fs-5 text-secondary mb-5 lh-lg">Challenge yourself with dynamic, user-controlled exam environments. Select your subject, choose your question count, and test your knowledge against our 50,000+ question database.</p>
                    <div class="d-flex justify-content-center gap-3 flex-wrap">
                        <a href="./categories/index.html" class="btn btn-primary btn-lg px-5 py-3 shadow-lg fw-bold rounded-pill"><i class="bi bi-lightning-charge-fill me-2"></i>Launch Exam Engine</a>
                        <a href="#latest" class="btn btn-white border btn-lg px-5 py-3 shadow-sm fw-bold rounded-pill text-dark"><i class="bi bi-clock-history me-2"></i>Try Latest Sets</a>
                    </div>
                </header>
                
                ${getAdBannerHtml("Homepage Top Ad")}
                
                <div id="latest" class="d-flex flex-column flex-md-row justify-content-between align-items-md-end mb-4 pt-5">
                    <div>
                        <h2 class="display-6 fw-bold mb-2 text-dark"><i class="bi bi-fire text-danger me-2"></i>Recently Added Mock Tests</h2>
                        <p class="text-secondary mb-0 fs-5">Test your knowledge immediately with our latest timed exam sets.</p>
                    </div>
                    <a href="./categories/index.html" class="btn btn-outline-primary fw-bold rounded-pill px-4 py-2 mt-3 mt-md-0 shadow-sm">View All Categories<i class="bi bi-arrow-right ms-2"></i></a>
                </div>
                
                ${topSetsHtml}
                
                ${getAdBannerHtml("Homepage Bottom Ad")}
                
                <div class="text-center mt-5 mb-5 pt-4 border-top">
                    <a href="./categories/index.html" class="btn btn-dark btn-lg px-5 py-3 fw-bold rounded-pill shadow-lg"><i class="bi bi-collection-fill me-2"></i>Browse All Live Exams & Sets</a>
                </div>
            `;
            await fsAsync.writeFile(path.join(distDir, 'index.html'), getHtmlShell('Free Custom Exam Engines & Study Guides', homeContent, 0, "", false));
        });

        await executeTasksInBatches(masterPageTasks, 10);

        console.log("5. Copying Static Assets...");
        const directoriesToCopy = ['tools', 'main_images'];
        directoriesToCopy.forEach(dirName => {
            const srcDir = path.join(__dirname, dirName);
            const destDir = path.join(distDir, dirName);
            if (fs.existsSync(srcDir)) {
                fs.cpSync(srcDir, destDir, { recursive: true });
            }
        });

        const staticFiles = ['Ads.txt', 'CNAME', '404.html'];
        staticFiles.forEach(file => {
            const sourcePath = path.join(__dirname, file);
            const targetName = file === 'Ads.txt' ? 'ads.txt' : file; 
            if (fs.existsSync(sourcePath)) {
                fs.copyFileSync(sourcePath, path.join(distDir, targetName));
            }
        });

        // 6. Generate Sitemap & Robots automatically inside public/
        await generateSitemapAndRobots(distDir, categoriesMap);

        console.log("✅ Build Complete (Ad Units Embedded + Auto Sitemap Active)");
    } catch (error) {
        console.error("Critical Build failed:", error);
    }
}

buildWedugoQuizSite();
