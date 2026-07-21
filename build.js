const fs = require('fs');
const fsAsync = require('fs').promises;
const path = require('path');

const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQSnJP6ImRuS24j_tOTKA_i1QG_K-DKutrWxjjSbi4WszrZxR90g_1uNaXQqOjnxR2tX9flEFXy7qfY/pub?gid=0&single=true&output=csv";
const SITE_BASE_URL = "https://www.wedugo.com"; 

// OFFICIAL CATEGORY LIST
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

// --- ADSENSE "THICK CONTENT" ENRICHMENT FUNCTIONS ---

function getDifficultyData(questionStr) {
    const len = (questionStr || "").length;
    if (len < 50) return { label: 'Easy', time: '30 sec', color: 'success' };
    if (len > 120) return { label: 'Hard', time: '90 sec', color: 'danger' };
    return { label: 'Medium', time: '60 sec', color: 'warning' };
}

function getExamTarget(category) {
    const techExams = ['Computer', 'Technology', 'Civil Engineering', 'Solid Mechanics'];
    const medicalExams = ['Biology', 'Anatomy', 'Biochemistry', 'Microbiology', 'Pharmacology', 'Virus'];
    const govtExams = ['Indian Geography', 'Indian Polity and Constitution', 'Indian History', 'General Knowledge', 'Reasoning', 'Aptitude'];

    if (techExams.includes(category)) return "GATE, SSC JE, State Engineering Services, and PSU recruitment exams";
    if (medicalExams.includes(category)) return "NEET, AIIMS, Nursing Boards, Hospital Assistant Exams, and Medical Entrance tests";
    if (govtExams.includes(category)) return "UPSC, SSC CGL, Banking (PO/Clerk), Railways (RRB), and State PSC examinations";
    
    return "various competitive assessments, university entrance exams, and professional certification tests";
}

function getRandomRelated(quizzes, currentId, count = 3) {
    const filtered = quizzes.filter(q => q.quizId !== currentId);
    const shuffled = filtered.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

function getCategorySEOText(category, totalQuestions) {
    return `
        <div class="card bg-light border-0 shadow-sm p-4 mb-4 rounded-3">
            <h2 class="h5 fw-bold text-dark mb-2">Comprehensive Guide to ${category}</h2>
            <p class="text-muted mb-3">
                Welcome to the ultimate preparation hub for <strong>${category}</strong>. Mastering this subject is crucial for academic excellence and general knowledge enhancement. This topic is frequently tested in <strong>${getExamTarget(category)}</strong>. 
            </p>
            <p class="text-muted mb-0">
                Below, you will find a curated collection of <strong>${totalQuestions} carefully selected multiple-choice questions (MCQs)</strong> designed to test your understanding, improve your retention, and prepare you for real-world exam scenarios. Work through our timed structured practice sets, review the detailed explanations, and track your progress.
            </p>
        </div>
    `;
}

function getBreadcrumbs(depth, category, safeName, currentTitle) {
    const prefix = depth === 0 ? '.' : '../'.repeat(depth).slice(0, -1);
    return `
        <nav aria-label="breadcrumb" class="mb-4">
            <ol class="breadcrumb bg-white p-3 rounded-3 shadow-sm mb-0">
                <li class="breadcrumb-item"><a href="${prefix}/index.html" class="text-decoration-none text-primary">Home</a></li>
                <li class="breadcrumb-item"><a href="${prefix}/categories/index.html" class="text-decoration-none text-primary">Categories</a></li>
                ${category ? `<li class="breadcrumb-item"><a href="${prefix}/category/${safeName}/index.html" class="text-decoration-none text-primary">${category}</a></li>` : ''}
                ${currentTitle ? `<li class="breadcrumb-item active text-truncate" aria-current="page" style="max-width: 250px;">${currentTitle}</li>` : ''}
            </ol>
        </nav>
    `;
}

function getDisqusEmbed(quizId) {
    const pageUrl = `${SITE_BASE_URL}/quiz/${quizId}/index.html`;
    const pageIdentifier = `quiz_${quizId}`;

    return `
        <div id="disqus_thread"></div>
        <script>
            var disqus_config = function () {
                this.page.url = '${pageUrl}';
                this.page.identifier = '${pageIdentifier}';
            };
            (function() {
                var d = document, s = d.createElement('script');
                
                // 🔴 REPLACE THIS LINE WITH YOUR DISQUS SHORTNAME URL:
                s.src = 'https://wedugo.disqus.com/embed.js'; 
                
                s.setAttribute('data-timestamp', +new Date());
                (d.head || d.body).appendChild(s);
            })();
        </script>
        <noscript>Please enable JavaScript to view the comments powered by Disqus.</noscript>
    `;
}

// ------------------------------------

function getNavbar(depth) {
    const prefix = depth === 0 ? '.' : '../'.repeat(depth).slice(0, -1);
    return `
    <nav class="navbar navbar-expand-lg navbar-dark bg-primary mb-4 shadow-sm">
        <div class="container">
            <a class="navbar-brand fw-bold fs-4 d-flex align-items-center" href="${prefix}/index.html">
                <img src="${prefix}/main_images/logo.png" alt="Wedugo Logo" height="30" class="me-2 d-inline-block align-text-top" onerror="this.style.display='none'">
                Wedugo Education
            </a>
            <button class="navbar-toggler border-0" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav ms-auto fw-medium">
                    <li class="nav-item"><a class="nav-link px-3" href="${prefix}/index.html">Home</a></li>
                    <li class="nav-item"><a class="nav-link px-3" href="${prefix}/categories/index.html">Categories</a></li>
                    <li class="nav-item"><a class="nav-link px-3" href="${prefix}/about/index.html">About</a></li>
                </ul>
            </div>
        </div>
    </nav>`;
}

function getHtmlShell(title, content, depth, seoDescription = "") {
    const cleanDesc = (seoDescription || 'Practice high-quality exam preparation questions and mock tests on Wedugo Education.').replace(/"/g, '&quot;').substring(0, 160);
    const prefix = depth === 0 ? '.' : '../'.repeat(depth).slice(0, -1);
    
    return `<!DOCTYPE html>
<html lang="hi">
<head>
    <meta charset="UTF-8">
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
        body { background-color: #f4f7f6; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; }
        .card { border: none; border-radius: 12px; transition: transform 0.2s, box-shadow 0.2s; }
        .card-hover:hover { transform: translateY(-4px); box-shadow: 0 12px 24px rgba(0,0,0,0.08) !important; }
        .option-btn { text-align: left; padding: 16px 20px; font-weight: 500; font-size: 1.05rem; border-radius: 8px; border: 2px solid #e9ecef; background: #fff; transition: all 0.2s ease; color: #495057; }
        .option-btn:hover:not(:disabled) { background-color: #f8f9fa; border-color: #dee2e6; transform: translateX(4px); }
        .option-btn:disabled { opacity: 1; cursor: default; }
        .badge-cat { font-size: 0.85rem; padding: 0.5em 0.9em; letter-spacing: 0.5px; }
        .ad-container { min-height: 100px; background: #fff; border: 1px dashed #ced4da; margin-bottom: 24px; border-radius: 8px; display: block; width: 100%; overflow: hidden; text-align: center; }
        .list-group-item { border-left: none; border-right: none; padding: 1rem 1.25rem; transition: background-color 0.2s; }
        .list-group-item:first-child { border-top: none; }
        .list-group-item:hover { background-color: #f8f9fa; }
        .preview-option { background-color: #f8f9fa; border: 1px solid #dee2e6; border-radius: 6px; padding: 8px 12px; font-size: 0.95rem; color: #495057; }
        .timer-header { position: sticky; top: 0; z-index: 1020; border-bottom: 3px solid #0d6efd; }
        .related-q-card { border-left: 4px solid #0d6efd; }
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

// MEMORY-SAFE BATCH ENGINE
async function executeTasksInBatches(tasks, batchSize = 100) {
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

        console.log("3. Generating Files Category by Category (Memory Safe Mode)...");
        for (const [cat, quizzes] of Object.entries(categoriesMap)) {
            if (!quizzes || quizzes.length === 0) continue; 
            
            console.log(` -> Building ${cat} (${quizzes.length} questions)...`);
            const safeName = cat.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            const specificCatDir = path.join(catMainDir, safeName);
            fs.mkdirSync(specificCatDir, { recursive: true });

            let currentCategoryTasks = [];

            // INDIVIDUAL QUIZ PAGES (Immediate Reveal + Thick Content Integrations)
            quizzes.forEach((q, i) => {
                const quizDir = path.join(distDir, 'quiz', String(q.quizId));
                
                const diffData = getDifficultyData(q.question);
                const explanationText = (q.answerdetail && q.answerdetail.trim() !== "") 
                    ? q.answerdetail 
                    : `While a specific detailed explanation is not available for this query, reviewing the core principles of <strong>${q.matchedCategory}</strong> will help clarify the concept. The correct option highlights a fundamental fact frequently tested in ${getExamTarget(q.matchedCategory)}. Consistent practice and studying related foundational materials is the key to mastering these patterns.`;

                // Generate Related Questions Html
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
                                            <span class="badge bg-light text-secondary border ms-auto">⏱️ Est. Time: ${diffData.time}</span>
                                        </div>
                                        <h1 class="h3 mb-4 fw-bold text-dark lh-base">${q.question}</h1>
                                        <div class="bg-light p-3 rounded-2 border-start border-3 border-primary mb-4">
                                            <p class="text-muted small mb-0"><strong>Exam Relevance:</strong> This question type is highly relevant for candidates preparing for <em>${getExamTarget(q.matchedCategory)}</em>. Select the correct option below to instantly reveal the detailed explanation and solution breakdown.</p>
                                        </div>
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
                                    
                                    <!-- Dynamic Disqus Comments Integration -->
                                    <div class="mt-5 pt-4 border-top">
                                        <h4 class="h5 fw-bold mb-3 text-dark">Community Discussion</h4>
                                        <p class="small text-muted mb-4">Have a doubt or an alternative solution for this question? Discuss with the community below.</p>
                                        ${getDisqusEmbed(q.quizId)}
                                    </div>
                                    
                                </article>
                            </div>
                        </div>
                        <script>
                            function checkAnswer(btnElement, selectedLetter) {
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
                                    btnElement.style.borderColor = "#198754";
                                    btnElement.style.backgroundColor = "#d1e7dd";
                                    btnElement.style.color = "#0f5132";
                                    explanationBox.classList.add('alert-success', 'border-success', 'border-opacity-25');
                                    resultTitle.innerHTML = "✨ Correct Answer!";
                                } else {
                                    btnElement.style.borderColor = "#dc3545";
                                    btnElement.style.backgroundColor = "#f8d7da";
                                    btnElement.style.color = "#842029";
                                    explanationBox.classList.add('alert-danger', 'border-danger', 'border-opacity-25');
                                    resultTitle.innerHTML = "❌ Incorrect. The right answer is " + correctLetter + ") " + answerTexts[correctLetter];
                                }
                            }
                        </script>
                    `;
                    await fsAsync.writeFile(path.join(quizDir, 'index.html'), getHtmlShell(q.question.substring(0,40) + '...', quizContent, 2, q.question));
                });
            });

            // MULTI-QUESTION PRACTICE SETS (TIMER + SUBMIT + THICK CONTENT)
            const QUESTIONS_PER_PAGE = 10;
            const sets = chunkArray(quizzes, QUESTIONS_PER_PAGE);
            let practiceSetsHtml = '<div class="row g-3 mb-4">';

            sets.forEach((setQuizzes, setIndex) => {
                const setNumber = setIndex + 1;
                const setFileName = `set-${setNumber}.html`;

                currentCategoryTasks.push(async () => {
                    let setQuestionsHtml = '';
                    let answersMapScript = [];

                    setQuizzes.forEach((q, qIndex) => {
                        const correctLetter = (q.mainanswer || '').toString().replace(/[^A-D]/gi, '').toUpperCase();
                        const diffData = getDifficultyData(q.question);
                        
                        const explanationText = (q.answerdetail && q.answerdetail.trim() !== "") 
                            ? q.answerdetail 
                            : `While a specific detailed explanation is not available for this query, reviewing the core principles of <strong>${q.matchedCategory}</strong> will help clarify the concept. This principle is vital for ${getExamTarget(q.matchedCategory)}. Consistent practice is the key to mastering these patterns.`;

                        answersMapScript.push(`'${q.quizId}': '${correctLetter}'`);
                        
                        setQuestionsHtml += `
                            <article class="card shadow-sm p-4 p-md-5 mb-5 bg-white border-0 rounded-4" id="quiz-block-${q.quizId}">
                                <div class="d-flex align-items-center flex-wrap gap-2 mb-4 pb-3 border-bottom">
                                    <span class="badge bg-secondary rounded-pill me-2 px-3 py-2 fs-6">Q${(setIndex * QUESTIONS_PER_PAGE) + qIndex + 1}</span>
                                    <span class="badge bg-${diffData.color} bg-opacity-10 text-${diffData.color} border border-${diffData.color}-subtle px-2 py-1">${diffData.label}</span>
                                </div>
                                <h3 class="h5 fw-bold text-dark mb-4 lh-base">${q.question}</h3>
                                
                                <div class="d-grid gap-3 ps-md-4 mb-4">
                                    <button class="btn option-btn py-3 fs-6" data-letter="A" onclick="selectOption('${q.quizId}', 'A', this)">A) ${q.answer1}</button>
                                    <button class="btn option-btn py-3 fs-6" data-letter="B" onclick="selectOption('${q.quizId}', 'B', this)">B) ${q.answer2}</button>
                                    <button class="btn option-btn py-3 fs-6" data-letter="C" onclick="selectOption('${q.quizId}', 'C', this)">C) ${q.answer3}</button>
                                    <button class="btn option-btn py-3 fs-6" data-letter="D" onclick="selectOption('${q.quizId}', 'D', this)">D) ${q.answer4}</button>
                                </div>
                                <div id="explanation-${q.quizId}" class="alert mt-3 d-none ms-md-4 p-4 border rounded-3">
                                    <h6 class="alert-heading fw-bold fs-5 mb-3" id="result-title-${q.quizId}"></h6>
                                    <hr class="opacity-25 mb-3">
                                    <h6 class="fw-bold text-dark mb-2">Solution Breakdown:</h6>
                                    <p class="mb-0 text-dark lh-lg">${explanationText}</p>
                                </div>
                            </article>
                        `;
                    });

                    const prevSetBtn = setIndex > 0 ? `<a href="set-${setNumber - 1}.html" class="btn btn-outline-secondary px-4 py-2">&larr; Previous Set</a>` : '';
                    const nextSetBtn = setIndex < sets.length - 1 ? `<a href="set-${setNumber + 1}.html" class="btn btn-primary px-4 py-2 shadow">Next Practice Set &rarr;</a>` : '';

                    const setPageContent = `
                        <div class="row justify-content-center">
                            <div class="col-lg-10">
                                ${getBreadcrumbs(2, cat, safeName, `Practice Set ${setNumber}`)}
                                
                                <!-- TIMER HEADER -->
                                <div class="timer-header bg-white p-3 shadow-sm d-flex flex-wrap gap-3 justify-content-between align-items-center mb-4 rounded-3">
                                    <div>
                                        <h1 class="h4 fw-bold text-dark mb-1">${cat} - Mock Test ${setNumber}</h1>
                                        <p class="text-muted mb-0 small">Answer all questions, then click submit to view your detailed academic score and answer analysis.</p>
                                    </div>
                                    <div class="text-center ms-auto">
                                        <span class="d-block text-muted small fw-bold text-uppercase mb-1">Time Remaining</span>
                                        <div class="fs-3 fw-bold font-monospace bg-light px-3 py-1 rounded text-danger border" id="timer-display">10:00</div>
                                    </div>
                                </div>

                                <!-- SCORE BOARD -->
                                <div id="score-board" class="card shadow border-success d-none mb-5 text-center p-5 rounded-4 bg-success bg-opacity-10">
                                    <h2 class="text-success fw-bold mb-3">Test Completed!</h2>
                                    <p class="fs-5 text-dark mb-2">Your Final Academic Score:</p>
                                    <div class="display-3 fw-bold text-success mb-3" id="final-score">0 / 10</div>
                                    <p class="text-muted">Review your correct and incorrect answers below. Taking multiple timed sets dramatically increases retention for competitive exams.</p>
                                </div>
                                
                                <div class="ad-container text-center text-muted small mb-5">
                                    <ins class="adsbygoogle" style="display:block; width:100%;" data-ad-client="ca-pub-5947676189341600" data-ad-format="auto" data-full-width-responsive="true"></ins>
                                    <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
                                </div>
                                
                                <div class="practice-set-container">
                                    ${setQuestionsHtml}
                                </div>
                                
                                <!-- SUBMIT BUTTON -->
                                <div class="text-center mt-5 mb-5" id="submit-container">
                                    <button class="btn btn-success btn-lg px-5 py-3 fw-bold shadow-lg rounded-pill fs-5" onclick="submitTest()">
                                        📝 Submit Results & View Explanations
                                    </button>
                                </div>
                                
                                <div class="d-flex justify-content-between mt-5 pt-4 border-top">
                                    <div>${prevSetBtn}</div>
                                    <div>${nextSetBtn}</div>
                                </div>
                            </div>
                        </div>

                        <!-- MOCK TEST JAVASCRIPT LOGIC -->
                        <script>
                            const correctAnswers = { ${answersMapScript.join(', ')} };
                            const userAnswers = {};
                            let timeLeft = 600; // 10 minutes in seconds
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
                                    b.classList.remove('border-primary', 'bg-primary', 'bg-opacity-10');
                                });
                                
                                btn.classList.add('border-primary', 'bg-primary', 'bg-opacity-10');
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
                                        btn.classList.remove('border-primary', 'bg-primary', 'bg-opacity-10');
                                        
                                        const btnLetter = btn.getAttribute('data-letter');
                                        if (btnLetter === correct) {
                                            btn.style.borderColor = "#198754";
                                            btn.style.backgroundColor = "#d1e7dd";
                                            btn.style.color = "#0f5132";
                                        } else if (btnLetter === user && user !== correct) {
                                            btn.style.borderColor = "#dc3545";
                                            btn.style.backgroundColor = "#f8d7da";
                                            btn.style.color = "#842029";
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
                    await fsAsync.writeFile(path.join(specificCatDir, setFileName), getHtmlShell(`${cat} Practice Set ${setNumber}`, setPageContent, 2));
                });

                practiceSetsHtml += `
                    <div class="col-6 col-md-4 col-lg-3">
                        <a href="${setFileName}" class="card shadow-sm text-decoration-none card-hover h-100 text-center p-4 border-0 rounded-4">
                            <div class="fs-1 mb-2">⏱️</div>
                            <h6 class="fw-bold text-dark mb-1">Mock Set ${setNumber}</h6>
                            <span class="badge bg-primary bg-opacity-10 text-primary mt-2">${setQuizzes.length} Questions (10m)</span>
                        </a>
                    </div>
                `;
            });
            practiceSetsHtml += '</div>';

            // CATEGORY MASTER PAGE
            if (CATEGORY_LIST.includes(cat)) {
                currentCategoryTasks.push(async () => {
                    let catPageContent = `
                        ${getBreadcrumbs(2, cat, safeName, '')}
                        
                        <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-end mb-4">
                            <h1 class="display-6 fw-bold mb-3 mb-md-0 text-dark">${cat} MCQs & Study Guide</h1>
                            <span class="badge bg-primary fs-6 px-3 py-2 rounded-pill shadow-sm">${quizzes.length} Total Questions Available</span>
                        </div>
                        
                        ${getCategorySEOText(cat, quizzes.length)}
                        
                        <div class="mt-5 mb-4">
                            <h3 class="h4 fw-bold mb-3 text-dark d-flex align-items-center">
                                <span class="me-2">⏱️</span> Timed Practice Sets
                            </h3>
                            <p class="text-muted mb-4">Take these 10-minute mock exams to evaluate your readiness. Immediate feedback and solutions are provided upon submission.</p>
                            ${practiceSetsHtml}
                        </div>
                        
                        <div class="mt-5">
                            <h3 class="h4 fw-bold mb-3 text-dark border-bottom pb-3 d-flex align-items-center">
                                <span class="me-2">🔍</span> Browse All Individual Questions
                            </h3>
                            <div class="card shadow-sm mt-4 border-0 rounded-4 overflow-hidden">
                                <div class="list-group list-group-flush">
                    `;
                    
                    const listHtml = quizzes.map(q => `
                        <a href="../../quiz/${q.quizId}/index.html" class="list-group-item list-group-item-action d-flex align-items-center py-3">
                            <span class="badge bg-secondary rounded-pill me-3" style="min-width: 45px; text-align:center;">Q${q.quizId}</span>
                            <span class="text-dark fw-medium">${q.question}</span>
                        </a>
                    `).join('');
                    
                    catPageContent += listHtml + `</div></div></div>`;
                    await fsAsync.writeFile(path.join(specificCatDir, 'index.html'), getHtmlShell(`${cat} MCQs & Quiz Preparation`, catPageContent, 2));
                });

                categoriesGridHtml += `
                    <div class="col-md-6 col-lg-4">
                        <div class="card shadow-sm h-100 card-hover border-0 rounded-4 overflow-hidden">
                            <div class="card-body p-4 p-xl-5 text-center d-flex flex-column justify-content-center">
                                <div class="mb-4 bg-light rounded-circle d-inline-flex align-items-center justify-content-center mx-auto" style="width: 80px; height: 80px;">
                                    <span class="fs-2 text-primary">📚</span>
                                </div>
                                <h3 class="h4 fw-bold mb-2 text-dark">${cat}</h3>
                                <p class="text-muted small mb-4">Access a comprehensive library of ${quizzes.length} highly relevant MCQs tailored for this subject.</p>
                                <a href="../category/${safeName}/index.html" class="btn btn-outline-primary mt-auto w-100 fw-bold py-2 rounded-pill">Start Practicing</a>
                            </div>
                        </div>
                    </div>
                `;
            }

            // --- EXECUTE & FREE MEMORY BEFORE NEXT CATEGORY ---
            await executeTasksInBatches(currentCategoryTasks, 100);
            currentCategoryTasks = null; 
        }

        console.log("4. Building Core Pages...");
        const categoriesDir = path.join(distDir, 'categories');
        fs.mkdirSync(categoriesDir, { recursive: true });
        masterPageTasks.push(async () => {
            const categoriesContent = `
                ${getBreadcrumbs(1, '', '', 'All Categories')}
                <div class="mb-5 text-center py-4">
                    <h1 class="display-5 fw-bold mb-3 text-dark">Explore Knowledge Topics</h1>
                    <p class="lead text-muted col-lg-8 mx-auto">Select a subject below to dive into thousands of practice questions, timed mock sets, and detailed educational explanations designed to help you succeed.</p>
                </div>
                ${categoriesGridHtml}
            `;
            await fsAsync.writeFile(path.join(categoriesDir, 'index.html'), getHtmlShell('All Categories & Subjects', categoriesContent, 1));
        });

        const aboutDir = path.join(distDir, 'about');
        fs.mkdirSync(aboutDir, { recursive: true });
        masterPageTasks.push(async () => {
            const aboutContent = `
                ${getBreadcrumbs(1, '', '', 'About Us')}
                <div class="card shadow-sm p-5 border-0 rounded-4">
                    <h1 class="fw-bold text-primary mb-4">About Wedugo Education</h1>
                    <p class="lead text-dark lh-base">Welcome to Wedugo Education, your premier destination for practicing and mastering a diverse range of academic and competitive subjects.</p>
                    <hr class="my-4">
                    <h3 class="h5 fw-bold mb-3">Our Mission</h3>
                    <p class="text-muted mb-4">Our mission is to provide accessible, high-quality multiple-choice questions (MCQs) and detailed study guides to students and aspirants across the globe. We believe that consistent practice and clear conceptual understanding are the keys to cracking any exam.</p>
                    <h3 class="h5 fw-bold mb-3">What We Offer</h3>
                    <ul class="text-muted mb-0 lh-lg">
                        <li><strong>Massive Question Bank:</strong> Over 50,000 carefully curated questions.</li>
                        <li><strong>Detailed Explanations:</strong> Learn the 'why' behind the correct answers.</li>
                        <li><strong>Timed Practice:</strong> Topic-wise categorization and 10-question mock sets with built-in timers to track speed and progress.</li>
                    </ul>
                </div>
            `;
            await fsAsync.writeFile(path.join(aboutDir, 'index.html'), getHtmlShell('About Wedugo Education', aboutContent, 1));
        });

        // --- HOMEPAGE LAYOUT ---
        let top5Html = '<div class="row g-4 mb-5">';
        validQuizzes.slice(0, 5).forEach(q => {
            let badge = q.matchedCategory !== 'Uncategorized' ? `<span class="badge bg-primary bg-opacity-10 text-primary border border-primary-subtle rounded-pill me-2 px-3">${q.matchedCategory}</span>` : '';
            top5Html += `
                <div class="col-lg-6 col-xl-4">
                    <div class="card h-100 shadow-sm border-0 rounded-4 card-hover">
                        <div class="card-body p-4 d-flex flex-column">
                            <div class="mb-3">${badge}</div>
                            <h3 class="h6 fw-bold text-dark mb-4 lh-base">${q.question}</h3>
                            
                            <div class="d-grid gap-2 mb-4">
                                <div class="preview-option">A) ${q.answer1 || ''}</div>
                                <div class="preview-option">B) ${q.answer2 || ''}</div>
                                <div class="preview-option">C) ${q.answer3 || ''}</div>
                                <div class="preview-option">D) ${q.answer4 || ''}</div>
                            </div>
                            
                            <a href="./quiz/${q.quizId}/index.html" class="btn btn-outline-primary mt-auto fw-bold w-100 rounded-pill py-2">
                                View Answer & Explanation
                            </a>
                        </div>
                    </div>
                </div>
            `;
        });
        top5Html += '</div>';

        let next15Html = '<div class="card shadow-sm border-0 mb-5 rounded-4 overflow-hidden"><div class="list-group list-group-flush">';
        validQuizzes.slice(5, 20).forEach(q => {
            let badge = q.matchedCategory !== 'Uncategorized' ? `<span class="badge bg-secondary bg-opacity-10 text-secondary border border-secondary-subtle rounded-pill me-3 px-3" style="min-width: max-content;">${q.matchedCategory}</span>` : '';
            next15Html += `
                <a href="./quiz/${q.quizId}/index.html" class="list-group-item list-group-item-action d-flex align-items-center py-3">
                    ${badge}
                    <span class="text-dark fw-medium text-truncate">${q.question}</span>
                </a>
            `;
        });
        next15Html += '</div></div>';

        masterPageTasks.push(async () => {
            const homeContent = `
                <header class="text-center py-5 mb-5 bg-white rounded-4 shadow-sm border-0 px-4 mt-3">
                    <span class="badge bg-primary bg-opacity-10 text-primary mb-3 px-3 py-2 rounded-pill fs-6">Over 50,000 Questions Available</span>
                    <h1 class="display-4 fw-bold text-dark mb-4">Master Your Exams with Wedugo Education</h1>
                    <p class="col-md-8 mx-auto fs-5 text-muted mb-5 lh-base">Challenge yourself with high-quality practice sets, timed mock tests, and detailed conceptual explanations designed for competitive success.</p>
                    <div class="d-flex justify-content-center gap-3 flex-wrap">
                        <a href="./categories/index.html" class="btn btn-primary btn-lg px-5 shadow fw-bold rounded-pill">Explore All Topics</a>
                        <a href="#latest" class="btn btn-outline-dark btn-lg px-5 shadow-sm fw-bold rounded-pill">Try Latest MCQs</a>
                    </div>
                </header>
                
                <div class="ad-container text-center text-muted small mb-5">
                    <ins class="adsbygoogle" style="display:block; width:100%;" data-ad-client="ca-pub-5947676189341600" data-ad-format="auto" data-full-width-responsive="true"></ins>
                    <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
                </div>
                
                <div id="latest" class="d-flex justify-content-between align-items-end mb-4 pt-4 border-top">
                    <div>
                        <h2 class="fw-bold mb-2 text-dark">Recently Added Questions</h2>
                        <p class="text-muted mb-0">Test your knowledge immediately with these fresh additions.</p>
                    </div>
                    <a href="./categories/index.html" class="btn btn-outline-primary fw-medium rounded-pill px-4">View All Hubs &rarr;</a>
                </div>
                
                ${top5Html}
                
                <h4 class="h5 fw-bold mb-3 text-dark">More Recent Updates</h4>
                ${next15Html}
            `;
            await fsAsync.writeFile(path.join(distDir, 'index.html'), getHtmlShell('Free MCQ Mock Tests & Study Guides', homeContent, 0));
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

        console.log("✅ Build Complete (AdSense Thick Content Framework + Disqus Active)");
    } catch (error) {
        console.error("Build failed:", error);
    }
}

buildWedugoQuizSite();
