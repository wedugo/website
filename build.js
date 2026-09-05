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
        <div class="card bg-white border border-light shadow-sm p-4 p-md-5 mb-5 rounded-4">
            <h2 class="h4 fw-bold text-dark mb-3">Comprehensive Guide to ${category}</h2>
            <p class="text-muted mb-3 lh-lg" style="font-size: 1.05rem;">
                Welcome to the ultimate preparation hub for <strong>${category}</strong>. Mastering this subject is crucial for academic excellence and general knowledge enhancement. This topic is frequently tested in <strong>${getExamTarget(category)}</strong>. 
            </p>
            <p class="text-muted mb-0 lh-lg" style="font-size: 1.05rem;">
                Below, you will find a curated collection of <strong>${totalQuestions} carefully selected multiple-choice questions (MCQs)</strong> designed to test your understanding, improve your retention, and prepare you for real-world exam scenarios. Generate a custom exam or work through our timed structured practice sets.
            </p>
        </div>
    `;
}

function getBreadcrumbs(depth, category, safeName, currentTitle) {
    const prefix = depth === 0 ? '.' : '../'.repeat(depth).slice(0, -1);
    return `
        <nav aria-label="breadcrumb" class="mb-4">
            <ol class="breadcrumb bg-white p-3 rounded-4 shadow-sm mb-0 border">
                <li class="breadcrumb-item"><a href="${prefix}/index.html" class="text-decoration-none text-primary fw-medium">Home</a></li>
                <li class="breadcrumb-item"><a href="${prefix}/categories/index.html" class="text-decoration-none text-primary fw-medium">All Topics</a></li>
                ${category ? `<li class="breadcrumb-item"><a href="${prefix}/category/${safeName}/index.html" class="text-decoration-none text-primary fw-medium">${category}</a></li>` : ''}
                ${currentTitle ? `<li class="breadcrumb-item active text-truncate" aria-current="page" style="max-width: 250px;">${currentTitle}</li>` : ''}
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

function getNavbar(depth) {
    const prefix = depth === 0 ? '.' : '../'.repeat(depth).slice(0, -1);
    const cacheBuster = new Date().getTime(); 
    return `
    <nav class="navbar navbar-expand-lg navbar-dark bg-primary mb-4 shadow-sm py-3">
        <div class="container">
            <a class="navbar-brand fw-bold fs-4 d-flex align-items-center" href="${prefix}/index.html">
                <img src="${prefix}/main_images/logo.png?v=${cacheBuster}" alt="Wedugo Logo" height="35" class="me-2 d-inline-block align-text-top" onerror="this.style.display='none'">
                Wedugo Education
            </a>
            <button class="navbar-toggler border-0" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav ms-auto fw-medium fs-5 gap-2">
                    <li class="nav-item"><a class="nav-link px-3" href="${prefix}/index.html">Home</a></li>
                    <li class="nav-item"><a class="nav-link px-3" href="${prefix}/categories/index.html">Categories</a></li>
                    <li class="nav-item"><a class="nav-link px-3" href="${prefix}/about/index.html">About</a></li>
                </ul>
            </div>
        </div>
    </nav>`;
}

function getHtmlShell(title, content, depth, seoDescription = "", isThinPage = false) {
    const cleanDesc = (seoDescription || 'Practice high-quality exam preparation sets and timed mock tests on Wedugo Education.').replace(/"/g, '&quot;').substring(0, 160);
    const prefix = depth === 0 ? '.' : '../'.repeat(depth).slice(0, -1);
    
    // Add noindex to single-question thin pages to prevent AdSense index bloat
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
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5947676189341600" crossorigin="anonymous"></script>
    <script type='text/javascript' src='https://platform-api.sharethis.com/js/sharethis.js#property=5c5059d8c9830d001319b017&product=inline-share-buttons' async='async'></script>
    
    <style>
        body { background-color: #f8f9fa; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #212529; }
        .card { border: 1px solid #e9ecef; border-radius: 12px; transition: transform 0.2s, box-shadow 0.2s; }
        .card-hover:hover { transform: translateY(-4px); box-shadow: 0 12px 30px rgba(0,0,0,0.08) !important; }
        .option-btn { text-align: left; padding: 18px 24px; font-weight: 500; font-size: 1.1rem; border-radius: 8px; border: 2px solid #dee2e6; background: #fff; transition: all 0.2s ease; color: #495057; }
        .option-btn:hover:not(:disabled) { background-color: #f8f9fa; border-color: #adb5bd; transform: translateX(6px); }
        .option-btn.selected { background-color: #e7f1ff; border-color: #0d6efd; color: #084298; }
        .option-btn.correct-show { background-color: #d1e7dd !important; border-color: #198754 !important; color: #0f5132 !important; }
        .option-btn.incorrect-show { background-color: #f8d7da !important; border-color: #dc3545 !important; color: #842029 !important; }
        .option-btn:disabled { opacity: 1; cursor: default; }
        .ad-container { min-height: 100px; background: #fff; border: 1px dashed #ced4da; margin-bottom: 30px; border-radius: 12px; display: block; width: 100%; overflow: hidden; text-align: center; }
        .timer-header { position: sticky; top: 0; z-index: 1020; border-bottom: 4px solid #0d6efd; background: rgba(255,255,255,0.95); backdrop-filter: blur(5px); }
        
        /* TESTBOOK STYLE PALETTE CSS */
        .palette-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; margin-top: 15px; }
        .q-node { width: 100%; aspect-ratio: 1; border-radius: 8px; border: 1px solid #ced4da; display: flex; align-items: center; justify-content: center; font-weight: bold; cursor: pointer; background: #fff; color: #495057; transition: 0.2s; }
        .q-node:hover { background: #e9ecef; }
        .q-node.active { border: 2px solid #0d6efd; box-shadow: 0 0 0 3px rgba(13,110,253,0.25); }
        .q-node.attempted { background-color: #0d6efd; color: #fff; border-color: #0d6efd; }
        .q-node.correct { background-color: #198754 !important; color: #fff !important; border-color: #198754 !important; }
        .q-node.incorrect { background-color: #dc3545 !important; color: #fff !important; border-color: #dc3545 !important; }
        
        .exam-sidebar { background: #e0f2f1; padding: 15px; border-radius: 8px; border: 2px solid #b2dfdb; }
        .legend-box { width: 16px; height: 16px; display: inline-block; border-radius: 4px; margin-right: 5px; vertical-align: middle; border: 1px solid #ccc; }
        .legend-correct { background-color: #198754; border-color: #198754; }
        .legend-incorrect { background-color: #dc3545; border-color: #dc3545; }
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

        console.log("3. Generating Files (Preserving Single Pages, Sets, & Injecting Custom Exam SPAs)...");
        
        for (const [cat, quizzes] of Object.entries(categoriesMap)) {
            if (!quizzes || quizzes.length === 0) continue; 
            
            const safeName = cat.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            const specificCatDir = path.join(catMainDir, safeName);
            fs.mkdirSync(specificCatDir, { recursive: true });

            let currentCategoryTasks = [];

            // INDIVIDUAL QUIZ PAGES (Retained, but marked noindex for AdSense compliance)
            quizzes.forEach((q, i) => {
                const quizDir = path.join(distDir, 'quiz', String(q.quizId));
                
                const diffData = getDifficultyData(q.question);
                const explanationText = (q.answerdetail && q.answerdetail.trim() !== "") 
                    ? q.answerdetail 
                    : `Reviewing the core principles of <strong>${q.matchedCategory}</strong> will help clarify the concept. The correct option highlights a fundamental fact frequently tested in ${getExamTarget(q.matchedCategory)}.`;

                const relatedQuizzes = getRandomRelated(quizzes, q.quizId, 3);
                let relatedHtml = '';
                if(relatedQuizzes.length > 0) {
                    relatedHtml = `<div class="mt-5"><h4 class="h5 fw-bold mb-4 text-dark border-bottom pb-2">Related Questions in ${q.matchedCategory}</h4><div class="row g-3">`;
                    relatedQuizzes.forEach(rq => {
                        relatedHtml += `
                            <div class="col-md-4">
                                <a href="../${rq.quizId}/index.html" class="card related-q-card h-100 shadow-sm text-decoration-none card-hover bg-light p-3 border-0">
                                    <span class="badge bg-secondary mb-2" style="width:fit-content">Q${rq.quizId}</span>
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
                            ${prevQuiz ? `<a href="../${prevQuiz.quizId}/index.html" class="btn btn-outline-secondary fw-medium px-3 px-md-4">&larr; Previous</a>` : `<button class="btn btn-outline-secondary fw-medium px-3 px-md-4" disabled>&larr; Previous</button>`}
                            ${nextQuiz ? `<a href="../${nextQuiz.quizId}/index.html" class="btn btn-primary fw-medium px-3 px-md-4 shadow-sm">Next Question &rarr;</a>` : `<button class="btn btn-primary fw-medium px-3 px-md-4 shadow-sm" disabled>Next Question &rarr;</button>`}
                        </div>
                    `;

                    const quizContent = `
                        <div class="row justify-content-center">
                            <div class="col-lg-9">
                                ${getBreadcrumbs(2, q.matchedCategory, safeName, 'Question ' + q.quizId)}
                                
                                <div class="ad-container text-center text-muted small">
                                    <ins class="adsbygoogle" style="display:block; width:100%;" data-ad-client="ca-pub-5947676189341600" data-ad-format="auto" data-full-width-responsive="true"></ins>
                                    <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
                                </div>
                                
                                <article class="card shadow-sm p-4 p-md-5 mb-4 bg-white">
                                    <header class="mb-4">
                                        <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
                                            <a href="../../category/${safeName}/index.html" class="badge bg-primary badge-cat text-decoration-none">${q.matchedCategory}</a>
                                            <span class="badge bg-${diffData.color} bg-opacity-10 text-${diffData.color} border border-${diffData.color}-subtle">Difficulty: ${diffData.label}</span>
                                            <span class="badge bg-light text-secondary border ms-auto fs-6 font-monospace" id="single-timer">⏱️ 00:00</span>
                                        </div>
                                        <h1 class="h3 mb-4 fw-bold text-dark lh-base">${q.question}</h1>
                                    </header>

                                    <div class="d-grid gap-3 mb-4" id="options-container">
                                        <button class="btn option-btn" onclick="checkAnswer(this, 'A')">A) ${q.answer1 || ''}</button>
                                        <button class="btn option-btn" onclick="checkAnswer(this, 'B')">B) ${q.answer2 || ''}</button>
                                        <button class="btn option-btn" onclick="checkAnswer(this, 'C')">C) ${q.answer3 || ''}</button>
                                        <button class="btn option-btn" onclick="checkAnswer(this, 'D')">D) ${q.answer4 || ''}</button>
                                    </div>
                                    
                                    <div id="explanation-box" class="alert mt-4 d-none p-4 rounded-3 border">
                                        <h5 class="alert-heading fw-bold mb-3 d-flex align-items-center" id="result-title"></h5>
                                        <hr class="opacity-25">
                                        <div class="mt-3">
                                            <h6 class="fw-bold text-dark mb-2">Detailed Solution & Learning Notes:</h6>
                                            <p class="mb-3 text-dark lh-lg" style="font-size: 1.05rem;">${explanationText}</p>
                                        </div>
                                    </div>
                                    
                                    ${navButtonsHtml}
                                    ${relatedHtml}
                                    
                                    <div class="mt-5 pt-4 border-top">
                                        <h4 class="h5 fw-bold mb-3 text-dark">Community Discussion</h4>
                                        ${getDisqusEmbed(q.quizId, `quiz/${q.quizId}`)}
                                    </div>
                                    
                                </article>
                            </div>
                        </div>
                        <script>
                            let seconds = 0;
                            let singleTimerInterval;
                            let hasAnswered = false;

                            function updateSingleTimer() {
                                seconds++;
                                let m = Math.floor(seconds / 60);
                                let s = seconds % 60;
                                document.getElementById('single-timer').innerHTML = '⏱️ ' + (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
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
                                    resultTitle.innerHTML = "✨ Correct Answer! Time taken: " + document.getElementById('single-timer').innerText.replace('⏱️ ', '');
                                } else {
                                    btnElement.classList.add('incorrect-show');
                                    explanationBox.classList.add('alert-danger', 'border-danger', 'border-opacity-25');
                                    resultTitle.innerHTML = "❌ Incorrect. The right answer is " + correctLetter + ") " + answerTexts[correctLetter];
                                }
                            }
                        </script>
                    `;
                    // isThinPage = true
                    await fsAsync.writeFile(path.join(quizDir, 'index.html'), getHtmlShell(q.question.substring(0,40) + '...', quizContent, 2, q.question, true));
                });
            });

            // EXISTING 10-Q PRACTICE SETS
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
                            <article class="card shadow-sm p-4 p-md-5 mb-5 bg-white border border-light rounded-4" id="quiz-block-${q.quizId}">
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
                                    <h6 class="fw-bold text-dark mb-3 fs-5">Solution Breakdown:</h6>
                                    <p class="mb-0 text-dark lh-lg" style="font-size: 1.1rem;">${explanationText}</p>
                                </div>
                            </article>
                        `;
                    });

                    const prevSetBtn = setIndex > 0 ? `<a href="set-${setNumber - 1}.html" class="btn btn-outline-secondary px-4 py-3 fw-bold rounded-pill">&larr; Previous Practice Set</a>` : '';
                    const nextSetBtn = setIndex < sets.length - 1 ? `<a href="set-${setNumber + 1}.html" class="btn btn-primary px-4 py-3 shadow fw-bold rounded-pill">Next Practice Set &rarr;</a>` : '';

                    const setPageContent = `
                        <div class="row justify-content-center">
                            <div class="col-lg-10 col-xl-9">
                                ${getBreadcrumbs(2, cat, safeName, `Practice Set ${setNumber}`)}
                                
                                <div class="timer-header bg-white p-4 shadow-sm d-flex flex-wrap gap-3 justify-content-between align-items-center mb-5 rounded-4 border">
                                    <div>
                                        <h1 class="h3 fw-bold text-dark mb-2">${cat} - Mock Test ${setNumber}</h1>
                                        <p class="text-muted mb-0 fs-6">Answer all 10 questions, then click submit to view your detailed academic score and answer analysis.</p>
                                    </div>
                                    <div class="text-center ms-auto bg-light p-3 rounded-4 border">
                                        <span class="d-block text-muted small fw-bold text-uppercase mb-1">Time Remaining</span>
                                        <div class="fs-2 fw-bold font-monospace text-danger" id="timer-display">10:00</div>
                                    </div>
                                </div>

                                <div id="score-board" class="card shadow-lg border-success d-none mb-5 text-center p-5 rounded-4 bg-success bg-opacity-10" style="border-width: 2px !important;">
                                    <h2 class="text-success fw-bold display-6 mb-4">Test Completed Successfully!</h2>
                                    <p class="fs-4 text-dark mb-3">Your Final Academic Score:</p>
                                    <div class="display-1 fw-bold text-success mb-4" id="final-score">0 / 10</div>
                                    <p class="text-muted fs-5 lh-lg">Review your correct and incorrect answers below.</p>
                                    <a href="index.html" class="btn btn-success btn-lg mt-3 rounded-pill px-5">Back to ${cat} Hub</a>
                                </div>
                                
                                <div class="ad-container text-center text-muted small mb-5">
                                    <ins class="adsbygoogle" style="display:block; width:100%;" data-ad-client="ca-pub-5947676189341600" data-ad-format="auto" data-full-width-responsive="true"></ins>
                                    <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
                                </div>
                                
                                <div class="practice-set-container">
                                    ${setQuestionsHtml}
                                </div>
                                
                                <div class="text-center mt-5 mb-5" id="submit-container">
                                    <button class="btn btn-success btn-lg px-5 py-4 fw-bold shadow-lg rounded-pill fs-4 w-100 w-md-auto" onclick="submitTest()">
                                        📝 Submit Test & View Explanations
                                    </button>
                                </div>
                                
                                <div class="d-flex justify-content-between mt-5 pt-4 border-top">
                                    <div>${prevSetBtn}</div>
                                    <div>${nextSetBtn}</div>
                                </div>

                                <div class="mt-5 pt-5 border-top">
                                    <div class="card bg-white border-0 shadow-sm p-4 p-md-5 rounded-4">
                                        <h4 class="h3 fw-bold mb-3 text-dark">Community Discussion</h4>
                                        ${getDisqusEmbed(`${safeName}_set_${setNumber}`, `category/${safeName}/${setFileName}`)}
                                    </div>
                                </div>
                            </div>
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
                                    display.innerText = (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
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
                    await fsAsync.writeFile(path.join(specificCatDir, setFileName), getHtmlShell(`${cat} Practice Set ${setNumber}`, setPageContent, 2, "", false));
                });

                practiceSetsHtml += `
                    <div class="col-sm-6 col-lg-4">
                        <a href="${setFileName}" class="card shadow-sm text-decoration-none card-hover h-100 p-4 border border-light rounded-4 bg-white">
                            <div class="d-flex align-items-center mb-3">
                                <div class="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center" style="width: 50px; height: 50px;">
                                    <span class="fs-4">📝</span>
                                </div>
                                <h5 class="fw-bold text-dark mb-0 ms-3">Mock Set ${setNumber}</h5>
                            </div>
                            <hr class="opacity-10 my-2">
                            <div class="d-flex justify-content-between text-muted mt-2">
                                <small class="fw-medium">10 Questions</small>
                                <small class="fw-medium text-danger">⏱️ 10 Mins</small>
                            </div>
                        </a>
                    </div>
                `;
            });
            practiceSetsHtml += '</div>';

            // 🌟 CATEGORY MASTER PAGE (NEW FEATURE: Custom Testbook-Style Exam Engine)
            // Injecting the full category question bank safely as JSON
            const safeCategoryDataString = JSON.stringify(quizzes).replace(/</g, '\\u003c');

            if (CATEGORY_LIST.includes(cat)) {
                currentCategoryTasks.push(async () => {
                    let catPageContent = `
                        <div class="row">
                            <div class="col-12">
                                ${getBreadcrumbs(2, cat, safeName, '')}
                                
                                <div id="setup-view">
                                    <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-end mb-4">
                                        <h1 class="display-5 fw-bold mb-3 mb-md-0 text-dark">${cat} MCQs & Study Guide</h1>
                                        <span class="badge bg-primary fs-5 px-4 py-2 rounded-pill shadow-sm">${quizzes.length} Questions</span>
                                    </div>
                                    
                                    ${getCategorySEOText(cat, quizzes.length)}
                                    
                                    <!-- NEW: Custom Exam Generator (Testbook UI Launcher) -->
                                    <div class="card shadow-lg border-primary border-2 p-5 mb-5 rounded-4 bg-primary bg-opacity-10">
                                        <div class="text-center mb-4">
                                            <h3 class="fw-bold text-primary display-6">🚀 Generate Custom Live Exam</h3>
                                            <p class="text-dark fs-5">Simulate the exact MPESB/UPSC exam environment. Choose the number of questions to attempt.</p>
                                        </div>
                                        <div class="row justify-content-center">
                                            <div class="col-md-6 col-lg-4">
                                                <div class="input-group input-group-lg mb-3 shadow-sm">
                                                    <span class="input-group-text bg-white fw-bold">Questions:</span>
                                                    <select class="form-select fw-bold" id="custom-q-count">
                                                        <option value="10">10 Questions (10 Mins)</option>
                                                        <option value="20" selected>20 Questions (20 Mins)</option>
                                                        <option value="30">30 Questions (30 Mins)</option>
                                                        <option value="50">50 Questions (50 Mins)</option>
                                                        <option value="100">100 Questions (100 Mins)</option>
                                                    </select>
                                                </div>
                                                <button class="btn btn-primary btn-lg w-100 fw-bold shadow py-3 fs-4 rounded-pill" onclick="startCustomExam()">Start Live Exam Now</button>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="mt-5 mb-5">
                                        <div class="d-flex align-items-center mb-4 border-bottom pb-3">
                                            <span class="fs-2 me-3">🎯</span>
                                            <div>
                                                <h3 class="h3 fw-bold text-dark mb-1">Standard Structured Sets</h3>
                                                <p class="text-muted mb-0 fs-6">Pre-built 10-question mock exams.</p>
                                            </div>
                                        </div>
                                        ${practiceSetsHtml}
                                    </div>
                                </div>
                                
                                <!-- NEW: The Testbook Style Custom Exam Engine SPA UI -->
                                <div id="exam-view" class="d-none">
                                    <div class="row g-4">
                                        <!-- Left Pane: Question Area -->
                                        <div class="col-lg-8">
                                            <div class="card shadow-sm border-0 rounded-4 h-100 d-flex flex-column">
                                                <div class="card-header bg-white border-bottom p-4 d-flex justify-content-between align-items-center rounded-top-4">
                                                    <span class="badge bg-primary fs-5 px-3 py-2" id="ce-q-number">Question 1</span>
                                                    <button class="btn btn-sm btn-outline-danger fw-bold" onclick="quitExam()">Quit Exam</button>
                                                </div>
                                                <div class="card-body p-4 p-md-5 flex-grow-1">
                                                    <h3 class="h4 fw-bold text-dark mb-4 lh-base" id="ce-q-text">Loading question...</h3>
                                                    <div class="d-grid gap-3" id="ce-options-container">
                                                        <button class="btn option-btn" id="ce-opt-A" onclick="selectCEOption('A')"></button>
                                                        <button class="btn option-btn" id="ce-opt-B" onclick="selectCEOption('B')"></button>
                                                        <button class="btn option-btn" id="ce-opt-C" onclick="selectCEOption('C')"></button>
                                                        <button class="btn option-btn" id="ce-opt-D" onclick="selectCEOption('D')"></button>
                                                    </div>
                                                    
                                                    <div id="ce-solution-box" class="alert mt-5 d-none p-4 border rounded-4 bg-light">
                                                        <h5 class="alert-heading fw-bold fs-5 mb-3" id="ce-result-title"></h5>
                                                        <hr class="opacity-25 mb-3">
                                                        <h6 class="fw-bold text-dark mb-2">Detailed Solution:</h6>
                                                        <p class="mb-0 text-dark lh-lg" id="ce-solution-text"></p>
                                                    </div>
                                                </div>
                                                <div class="card-footer bg-white border-top p-4 d-flex justify-content-between rounded-bottom-4">
                                                    <button class="btn btn-outline-secondary px-4 fw-bold" onclick="navCEPrev()">Previous</button>
                                                    <button class="btn btn-primary px-5 fw-bold shadow-sm" onclick="navCENext()">Next</button>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <!-- Right Pane: Testbook Style Sidebar -->
                                        <div class="col-lg-4">
                                            <div class="exam-sidebar shadow-sm h-100 d-flex flex-column">
                                                <div class="text-center mb-3 bg-white p-3 rounded border">
                                                    <span class="d-block text-muted small fw-bold text-uppercase mb-1">Time Remaining</span>
                                                    <div class="fs-2 fw-bold font-monospace text-danger" id="ce-timer">00:00</div>
                                                </div>
                                                
                                                <div class="bg-white p-3 rounded border mb-3 flex-grow-1">
                                                    <h6 class="fw-bold border-bottom pb-2">Question Palette: ${cat}</h6>
                                                    <div class="palette-grid" id="ce-palette">
                                                        <!-- Palette Nodes Generated by JS -->
                                                    </div>
                                                </div>
                                                
                                                <div class="bg-white p-3 rounded border mb-3">
                                                    <h6 class="fw-bold small mb-2 text-muted">Legend:</h6>
                                                    <div class="d-flex justify-content-between small fw-medium">
                                                        <div><span class="legend-box legend-correct" id="legend-green"></span> <span id="leg-g-txt">Correct</span></div>
                                                        <div><span class="legend-box legend-incorrect" id="legend-red"></span> <span id="leg-r-txt">Incorrect</span></div>
                                                        <div><span class="legend-box legend-unattempted" style="background:#0d6efd" id="legend-blue"></span> <span id="leg-b-txt">Attempted</span></div>
                                                    </div>
                                                </div>
                                                
                                                <button class="btn btn-success btn-lg w-100 fw-bold shadow mt-auto" id="ce-submit-btn" onclick="submitCustomExam()">Submit Test</button>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div id="ce-score-board" class="card shadow-lg border-success d-none mt-5 text-center p-5 rounded-4 bg-success bg-opacity-10" style="border-width: 2px !important;">
                                        <h2 class="text-success fw-bold display-6 mb-4">Exam Completed!</h2>
                                        <p class="fs-4 text-dark mb-3">Your Final Score:</p>
                                        <div class="display-1 fw-bold text-success mb-4" id="ce-final-score">0 / 0</div>
                                        <p class="text-muted fs-5 lh-lg mb-4">You can now click on the question numbers in the palette above to view the detailed solutions and correct answers.</p>
                                        <button class="btn btn-outline-success btn-lg px-5 rounded-pill fw-bold" onclick="quitExam()">Return to Category Hub</button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- TESTBOOK SPA ENGINE JS -->
                        <script>
                            const allQuestionsData = JSON.parse('${safeCategoryDataString}');
                            let examQuestions = [];
                            let ceUserAnswers = {};
                            let currentQIndex = 0;
                            let ceTimerInterval;
                            let ceTimeLeft = 0;
                            let isExamSubmitted = false;

                            function startCustomExam() {
                                const qCount = parseInt(document.getElementById('custom-q-count').value);
                                
                                // Shuffle and pick requested amount
                                let shuffled = allQuestionsData.sort(() => 0.5 - Math.random());
                                examQuestions = shuffled.slice(0, Math.min(qCount, shuffled.length));
                                
                                ceUserAnswers = {};
                                currentQIndex = 0;
                                isExamSubmitted = false;
                                ceTimeLeft = examQuestions.length * 60; // 1 min per question
                                
                                // UI Switch
                                document.getElementById('setup-view').classList.add('d-none');
                                document.getElementById('exam-view').classList.remove('d-none');
                                document.getElementById('ce-score-board').classList.add('d-none');
                                document.getElementById('ce-submit-btn').classList.remove('d-none');
                                
                                // Reset Legend labels for taking test
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
                                document.getElementById('ce-timer').innerText = (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
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
                                
                                // Update Palette Active State
                                document.querySelectorAll('.q-node').forEach(n => n.classList.remove('active'));
                                document.getElementById('node-' + index).classList.add('active');
                                
                                // Render Texts
                                document.getElementById('ce-q-number').innerText = 'Question ' + (index + 1);
                                document.getElementById('ce-q-text').innerText = q.question;
                                
                                const opts = ['A', 'B', 'C', 'D'];
                                opts.forEach(letter => {
                                    const btn = document.getElementById('ce-opt-' + letter);
                                    btn.innerText = letter + ') ' + q['answer' + (opts.indexOf(letter)+1)];
                                    btn.className = 'btn option-btn'; // Reset
                                    btn.disabled = isExamSubmitted; // Disable if submitted
                                    
                                    // Restore selected state during exam
                                    if (ceUserAnswers[index] === letter) {
                                        btn.classList.add('selected');
                                    }
                                    
                                    // If submitted, show correct/incorrect colors
                                    if (isExamSubmitted) {
                                        const correctLetter = (q.mainanswer || '').toString().replace(/[^A-D]/gi, '').toUpperCase();
                                        if (letter === correctLetter) btn.classList.add('correct-show');
                                        else if (ceUserAnswers[index] === letter) btn.classList.add('incorrect-show');
                                    }
                                });
                                
                                // Solution Box Logic
                                const solBox = document.getElementById('ce-solution-box');
                                if (isExamSubmitted) {
                                    solBox.classList.remove('d-none');
                                    const correctLetter = (q.mainanswer || '').toString().replace(/[^A-D]/gi, '').toUpperCase();
                                    const title = document.getElementById('ce-result-title');
                                    if (ceUserAnswers[index] === correctLetter) {
                                        solBox.className = 'alert mt-5 p-4 border rounded-4 alert-success border-success border-opacity-25';
                                        title.innerText = '✨ Correct!';
                                    } else if (!ceUserAnswers[index]) {
                                        solBox.className = 'alert mt-5 p-4 border rounded-4 alert-warning border-warning border-opacity-25';
                                        title.innerText = '⚠️ Unanswered. Correct: ' + correctLetter;
                                    } else {
                                        solBox.className = 'alert mt-5 p-4 border rounded-4 alert-danger border-danger border-opacity-25';
                                        title.innerText = '❌ Incorrect. Correct: ' + correctLetter;
                                    }
                                    document.getElementById('ce-solution-text').innerText = q.answerdetail || 'Standard foundational principle.';
                                } else {
                                    solBox.classList.add('d-none');
                                }
                            }

                            function selectCEOption(letter) {
                                if (isExamSubmitted) return;
                                ceUserAnswers[currentQIndex] = letter;
                                
                                // Color button
                                const opts = ['A', 'B', 'C', 'D'];
                                opts.forEach(l => document.getElementById('ce-opt-' + l).classList.remove('selected'));
                                document.getElementById('ce-opt-' + letter).classList.add('selected');
                                
                                // Mark palette as attempted (blue)
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
                                    node.classList.remove('attempted'); // Clear blue
                                    
                                    if (user === correct) {
                                        score++;
                                        node.classList.add('correct');
                                    } else if (user) {
                                        node.classList.add('incorrect');
                                    }
                                });
                                
                                // Update Legend
                                document.getElementById('legend-green').style.backgroundColor = '#198754';
                                document.getElementById('leg-g-txt').innerText = 'Correct';
                                document.getElementById('legend-red').style.display = 'inline-block';
                                document.getElementById('leg-r-txt').style.display = 'inline';
                                document.getElementById('leg-b-txt').innerText = 'Unattempted';
                                document.getElementById('legend-blue').style.backgroundColor = '#fff';
                                document.getElementById('legend-blue').style.border = '1px solid #ccc';
                                
                                // Show Score
                                document.getElementById('ce-score-board').classList.remove('d-none');
                                document.getElementById('ce-final-score').innerText = score + " / " + examQuestions.length;
                                
                                // Re-render current to show solution
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
                                    <span class="fs-2 text-primary">⚙️</span>
                                </div>
                                <h3 class="h4 fw-bold mb-2 text-dark">${cat}</h3>
                                <p class="text-muted mb-4 fs-6">Custom Testbook-style exam engine with ${quizzes.length} highly relevant MCQs.</p>
                                <a href="../category/${safeName}/index.html" class="btn btn-outline-primary mt-auto w-100 fw-bold py-3 rounded-pill">Launch Exam Engine</a>
                            </div>
                        </div>
                    </div>
                `;
            }

            await executeTasksInBatches(currentCategoryTasks, 50);
            currentCategoryTasks = null; 
        }

        console.log("4. Building Core Pages...");
        const categoriesDir = path.join(distDir, 'categories');
        fs.mkdirSync(categoriesDir, { recursive: true });
        masterPageTasks.push(async () => {
            const categoriesContent = `
                ${getBreadcrumbs(1, '', '', 'All Categories')}
                <div class="mb-5 text-center py-5">
                    <h1 class="display-4 fw-bold mb-4 text-dark">Explore Knowledge Topics</h1>
                    <p class="lead text-muted col-lg-8 mx-auto lh-lg">Select a subject below to launch dynamic custom exams, timed mock sets, and detailed educational explanations.</p>
                </div>
                ${categoriesGridHtml}
            `;
            await fsAsync.writeFile(path.join(categoriesDir, 'index.html'), getHtmlShell('All Categories & Exam Engines', categoriesContent, 1, "", false));
        });

        const aboutDir = path.join(distDir, 'about');
        fs.mkdirSync(aboutDir, { recursive: true });
        masterPageTasks.push(async () => {
            const aboutContent = `
                ${getBreadcrumbs(1, '', '', 'About Us')}
                <div class="card shadow-sm p-4 p-md-5 border-light rounded-4 bg-white">
                    <h1 class="fw-bold text-primary mb-4 display-6">About Wedugo Education</h1>
                    <p class="lead text-dark lh-base mb-5">Welcome to Wedugo Education, your premier destination for practicing and mastering a diverse range of academic and competitive subjects.</p>
                    <div class="row g-5">
                        <div class="col-md-6">
                            <h3 class="h4 fw-bold mb-3">Our Mission</h3>
                            <p class="text-muted lh-lg fs-6">Our mission is to provide accessible, high-quality multiple-choice questions (MCQs) and dynamic testing engines to aspirants across the globe.</p>
                        </div>
                        <div class="col-md-6">
                            <h3 class="h4 fw-bold mb-3">What We Offer</h3>
                            <ul class="text-muted mb-0 lh-lg fs-6">
                                <li><strong>Dynamic Exam Engine:</strong> Choose how many questions you want to simulate real testing environments.</li>
                                <li><strong>Massive Question Bank:</strong> Over 50,000 carefully curated questions.</li>
                                <li><strong>Detailed Explanations:</strong> Learn the 'why' behind the correct answers.</li>
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
                    <a href="${set.link}" class="card shadow-sm border-light rounded-4 card-hover h-100 text-decoration-none bg-white">
                        <div class="card-body p-4 d-flex flex-column">
                            <span class="badge bg-primary bg-opacity-10 text-primary mb-3 px-3 py-2 w-auto align-self-start">${set.category}</span>
                            <h3 class="h5 fw-bold text-dark mb-4 lh-base">Comprehensive Mock Test ${set.setNumber}</h3>
                            <div class="d-flex justify-content-between align-items-center mt-auto border-top pt-3">
                                <span class="text-muted small fw-medium">10 Questions</span>
                                <span class="btn btn-sm btn-outline-primary fw-bold rounded-pill">Start Test &rarr;</span>
                            </div>
                        </div>
                    </a>
                </div>
            `;
        });
        topSetsHtml += '</div>';

        masterPageTasks.push(async () => {
            const homeContent = `
                <header class="text-center py-5 mb-5 bg-white rounded-5 shadow-sm border border-light px-4 mt-3" style="background: linear-gradient(180deg, #ffffff 0%, #f8f9fa 100%);">
                    <span class="badge bg-primary bg-opacity-10 text-primary mb-4 px-4 py-2 rounded-pill fs-6 border border-primary-subtle">New Custom Exam Engines Available</span>
                    <h1 class="display-4 fw-bold text-dark mb-4 px-lg-5">Master Your Exams with Wedugo Education</h1>
                    <p class="col-lg-8 mx-auto fs-5 text-muted mb-5 lh-lg">Challenge yourself with dynamic, user-controlled exam environments. Select your subject, choose your question count, and test your knowledge against our 50,000+ question database.</p>
                    <div class="d-flex justify-content-center gap-3 flex-wrap">
                        <a href="./categories/index.html" class="btn btn-primary btn-lg px-5 py-3 shadow-lg fw-bold rounded-pill">Launch Exam Engine</a>
                        <a href="#latest" class="btn btn-outline-dark btn-lg px-5 py-3 shadow-sm fw-bold rounded-pill bg-white">Try Latest Sets</a>
                    </div>
                </header>
                
                <div class="ad-container text-center text-muted small mb-5">
                    <ins class="adsbygoogle" style="display:block; width:100%;" data-ad-client="ca-pub-5947676189341600" data-ad-format="auto" data-full-width-responsive="true"></ins>
                    <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
                </div>
                
                <div id="latest" class="d-flex flex-column flex-md-row justify-content-between align-items-md-end mb-4 pt-5">
                    <div>
                        <h2 class="display-6 fw-bold mb-2 text-dark">Recently Added Mock Tests</h2>
                        <p class="text-muted mb-0 fs-5">Test your knowledge immediately with our latest timed exam sets.</p>
                    </div>
                    <a href="./categories/index.html" class="btn btn-outline-primary fw-bold rounded-pill px-4 mt-3 mt-md-0">View All Categories &rarr;</a>
                </div>
                
                ${topSetsHtml}
                
                <div class="text-center mt-5 mb-5">
                    <a href="./categories/index.html" class="btn btn-dark btn-lg px-5 py-3 fw-bold rounded-pill shadow-sm">Browse All Live Exams & Sets</a>
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

        const staticFiles = ['Ads.txt','robots.txt', 'CNAME', '404.html'];
        staticFiles.forEach(file => {
            const sourcePath = path.join(__dirname, file);
            const targetName = file === 'Ads.txt' ? 'ads.txt' : file; 
            if (fs.existsSync(sourcePath)) {
                fs.copyFileSync(sourcePath, path.join(distDir, targetName));
            }
        });

        console.log("✅ Build Complete (AdSense Ready: Custom Live Exam SPA + NoIndex Thin Pages)");
    } catch (error) {
        console.error("Build failed:", error);
    }
}

buildWedugoQuizSite();
