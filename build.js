const fs = require('fs');
const fsAsync = require('fs').promises;
const path = require('path');

const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQSnJP6ImRuS24j_tOTKA_i1QG_K-DKutrWxjjSbi4WszrZxR90g_1uNaXQqOjnxR2tX9flEFXy7qfY/pub?gid=0&single=true&output=csv";
const SITE_BASE_URL = "https://www.wedugo.com"; 

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

function getCategorySEOText(category, totalQuestions) {
    return `
        <div class="card bg-white border-0 shadow-sm p-4 p-md-5 mb-5 rounded-4">
            <h2 class="h4 fw-bold text-dark mb-3"><i class="bi bi-journal-bookmark-fill text-primary me-2"></i>Comprehensive Guide to ${category}</h2>
            <p class="text-secondary mb-3 lh-lg" style="font-size: 1.05rem;">
                Welcome to the ultimate preparation hub for <strong>${category}</strong>. Mastering this subject is crucial for academic excellence and general knowledge enhancement. This topic is frequently tested in <span class="badge bg-light text-dark border">${getExamTarget(category)}</span>. 
            </p>
            <p class="text-secondary mb-0 lh-lg" style="font-size: 1.05rem;">
                Below, you will find a curated collection of <strong>${totalQuestions} carefully selected multiple-choice questions (MCQs)</strong> designed to test your understanding, improve your retention, and prepare you for real-world exam scenarios. Generate a custom live exam or work through our pre-built timed practice sets.
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
        <noscript>Please enable JavaScript to view the comments powered by Disqus.</noscript>
    `;
}

// AD SIDEBAR HELPER (Desktop Only)
function getAdSidebar() {
    return `
        <div class="col-lg-4 d-none d-lg-block">
            <div class="sticky-desktop-sidebar">
                <div class="card shadow-sm border-0 rounded-4 bg-white p-3 mb-4 text-center">
                    <span class="text-muted small fw-bold text-uppercase mb-2 d-block">Advertisement</span>
                    <div class="ad-container shadow-none border-0 mb-0" style="min-height: 250px; background: #f8fafc;">
                        <ins class="adsbygoogle" style="display:block" data-ad-client="ca-pub-5947676189341600" data-ad-format="auto" data-full-width-responsive="true"></ins>
                        <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
                    </div>
                </div>
                <div class="card shadow-sm border-0 rounded-4 bg-white p-4">
                    <h5 class="fw-bold text-dark mb-3"><i class="bi bi-lightning-charge-fill text-warning me-2"></i>Study Tips</h5>
                    <p class="text-secondary small mb-0 lh-lg">Consistent practice is key. Try our <strong>Custom Live Exam</strong> feature in the category hubs to simulate real testing conditions.</p>
                </div>
            </div>
        </div>
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

function getHtmlShell(title, content, depth, seoDescription = "", isThinPage = false) {
    const cleanDesc = (seoDescription || 'Practice high-quality exam preparation sets and timed mock tests on Wedugo Education.').replace(/"/g, '&quot;').substring(0, 160);
    const prefix = depth === 0 ? '.' : '../'.repeat(depth).slice(0, -1);
    
    // CRITICAL FIX: Only thick pages get indexed. Thin pages get noindex.
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
    
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5947676189341600" crossorigin="anonymous"></script>
    <script type='text/javascript' src='https://platform-api.sharethis.com/js/sharethis.js#property=5c5059d8c9830d001319b017&product=inline-share-buttons' async='async'></script>
    
    <style>
        body { background-color: #f1f5f9; font-family: 'Inter', sans-serif; color: #334155; }
        .hover-bg-light:hover { background-color: rgba(255,255,255,0.1); }
        .card { border: none; border-radius: 16px; box-shadow: 0 4px 15px rgba(0,0,0,0.03); transition: transform 0.3s ease, box-shadow 0.3s ease; }
        .card-hover:hover { transform: translateY(-5px); box-shadow: 0 15px 30px rgba(0,0,0,0.08) !important; }
        .option-btn { text-align: left; padding: 16px 24px; font-weight: 500; font-size: 1.05rem; border-radius: 12px; border: 2px solid #e2e8f0; background: #ffffff; transition: all 0.2s; color: #475569; }
        .option-btn:hover:not(:disabled) { background-color: #f8fafc; border-color: #cbd5e1; transform: translateX(5px); }
        .option-btn.selected { background-color: #eff6ff; border-color: #3b82f6; color: #1d4ed8; box-shadow: 0 4px 10px rgba(59, 130, 246, 0.15); }
        .option-btn.correct-show { background-color: #f0fdf4 !important; border-color: #22c55e !important; color: #15803d !important; font-weight: 600; }
        .option-btn.incorrect-show { background-color: #fef2f2 !important; border-color: #ef4444 !important; color: #b91c1c !important; }
        .option-btn:disabled { opacity: 1; cursor: default; }
        .ad-container { min-height: 100px; background: #fff; border: 1px dashed #cbd5e1; margin-bottom: 30px; border-radius: 12px; display: block; width: 100%; overflow: hidden; text-align: center; box-shadow: inset 0 2px 4px rgba(0,0,0,0.02); }
        .timer-header { position: sticky; top: 0; z-index: 1020; border-bottom: 4px solid #3b82f6; background: rgba(255,255,255,0.95); backdrop-filter: blur(8px); }
        
        /* DESKTOP LAYOUT ADSENSE SIDEBAR */
        .sticky-desktop-sidebar { position: sticky; top: 20px; }
        
        /* TESTBOOK STYLE PALETTE CSS */
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
    <div class="container pb-5">
        ${content}
    </div>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>`;
}

async function executeTasksInBatches(tasks, batchSize = 50) {
    for (let i = 0; i < tasks.length; i += batchSize) {
        const batch = tasks.slice(i, i + batchSize);
        await Promise.all(batch.map(task => task()));
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
        if (fs.existsSync(distDir)) fs.rmSync(distDir, { recursive: true });
        fs.mkdirSync(distDir);

        const categoriesMap = {};
        CATEGORY_LIST.forEach(cat => categoriesMap[cat] = []);
        categoriesMap['Uncategorized'] = [];
        const validQuizzes = [];

        console.log("2. Processing Data...");
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
            validQuizzes.push(q);
        });

        const catMainDir = path.join(distDir, 'category');
        fs.mkdirSync(catMainDir, { recursive: true });
        let categoriesGridHtml = '<div class="row g-4">';
        
        const masterPageTasks = [];
        const globallyGeneratedSets = []; 

        console.log("3. Generating Premium UI Files (Sets, Custom Exam SPAs, Ad Layouts)...");
        
        for (const [cat, quizzes] of Object.entries(categoriesMap)) {
            if (!quizzes || quizzes.length === 0) continue; 
            
            const safeName = cat.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            const specificCatDir = path.join(catMainDir, safeName);
            fs.mkdirSync(specificCatDir, { recursive: true });

            let currentCategoryTasks = [];

            // INDIVIDUAL QUIZ PAGES (Noindex Applied + Sticky Desktop Sidebar)
            quizzes.forEach((q, i) => {
                const quizDir = path.join(distDir, 'quiz', String(q.quizId));
                
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
                            ${prevQuiz ? `<a href="../${prevQuiz.quizId}/index.html" class="btn btn-outline-secondary fw-bold px-4 rounded-pill"><i class="
