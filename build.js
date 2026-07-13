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

// --- NEW SEO ENRICHMENT FUNCTIONS ---

// Generates dynamic, keyword-rich introductory text for Category pages
function getCategorySEOText(category, totalQuestions) {
    return `
        <div class="card bg-light border-0 shadow-sm p-4 mb-4 rounded-3">
            <h2 class="h5 fw-bold text-dark mb-2">Comprehensive Guide to ${category}</h2>
            <p class="text-muted mb-0">
                Welcome to the ultimate preparation hub for <strong>${category}</strong>. Mastering this subject is crucial for competitive exams, academic excellence, and general knowledge enhancement. Below, you will find a curated collection of <strong>${totalQuestions} carefully selected multiple-choice questions (MCQs)</strong> designed to test your understanding, improve your retention, and prepare you for real-world exam scenarios. Work through our structured 10-question practice sets, review the detailed explanations, and track your progress to ensure complete mastery of the topic.
            </p>
        </div>
    `;
}

// Generates semantic breadcrumbs for better crawling and UX
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

            // INDIVIDUAL QUIZ PAGES
            quizzes.forEach((q, i) => {
                const quizDir = path.join(distDir, 'quiz', String(q.quizId));
                
                currentCategoryTasks.push(async () => {
                    await fsAsync.mkdir(quizDir, { recursive: true });

                    const prevQuiz = quizzes[i - 1];
                    const nextQuiz = quizzes[i + 1];

                    const navButtonsHtml = `
                        <div class="d-flex justify-content-between align-items-center mt-5 pt-4 border-top">
                            ${prevQuiz ? `<a href="../${prevQuiz.quizId}/index.html" class="btn btn-outline-secondary fw-medium px-3 px-md-4">&larr; Previous Question</a>` : `<button class="btn btn-outline-secondary fw-medium px-3 px-md-4" disabled>&larr; Previous Question</button>`}
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
                                            ${q.language ? `<span class="badge bg-light text-dark border">${q.language}</span>` : ''}
                                            <span class="badge bg-light text-secondary border ms-auto">ID: ${q.quizId}</span>
                                        </div>
                                        <h1 class="h3 mb-4 fw-bold text-dark lh-base">${q.question}</h1>
                                        <p class="text-muted small border-start border-3 border-primary ps-3">Test your knowledge on this concept from <strong>${q.matchedCategory}</strong> by selecting the correct option below. Detailed explanations are provided to help you learn.</p>
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
                                            <h6 class="fw-bold text-dark mb-2">Detailed Explanation:</h6>
                                            <p class="mb-3 text-dark lh-lg" style="font-size: 1.05rem;">${q.answerdetail || 'No detailed explanation has been provided for this specific question. However, analyzing the core concepts of ' + q.matchedCategory + ' will help you understand why this is the correct answer.'}</p>
                                        </div>
                                        <div class="bg-white p-3 rounded-2 border mt-3">
                                            <p class="mb-0 small text-muted"><strong>Study Tip:</strong> Consistent practice is key. Explore more questions and structured sets in our <a href="../../category/${safeName}/index.html" class="fw-bold text-primary">${q.matchedCategory} Hub</a> to strengthen your exam preparation.</p>
                                        </div>
                                    </div>
                                    
                                    ${navButtonsHtml}
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
                                    resultTitle.innerHTML = "✨ Correct Answer! Well done.";
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

            // MULTI-QUESTION PRACTICE SETS
            const QUESTIONS_PER_PAGE = 10;
            const sets = chunkArray(quizzes, QUESTIONS_PER_PAGE);
            let practiceSetsHtml = '<div class="row g-3 mb-4">';

            sets.forEach((setQuizzes, setIndex) => {
                const setNumber = setIndex + 1;
                const setFileName = `set-${setNumber}.html`;

                currentCategoryTasks.push(async () => {
                    let setQuestionsHtml = '';
                    setQuizzes.forEach((q, qIndex) => {
                        const correctLetter = (q.mainanswer || '').toString().replace(/[^A-D]/gi, '').toUpperCase();
                        const escape = str => (str || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
                        
                        setQuestionsHtml += `
                            <article class="card shadow-sm p-4 p-md-5 mb-5 bg-white border-0 rounded-4" id="quiz-block-${q.quizId}">
                                <div class="d-flex align-items-center mb-4 pb-3 border-bottom">
                                    <span class="badge bg-secondary rounded-pill me-3 px-3 py-2 fs-6">Question ${(setIndex * QUESTIONS_PER_PAGE) + qIndex + 1}</span>
                                    <h3 class="h4 fw-bold text-dark mb-0 lh-base">${q.question}</h3>
                                </div>
                                <div class="d-grid gap-3 ps-md-4 mb-4">
                                    <button class="btn option-btn py-3 fs-6" onclick="checkSetAnswer(this, 'A', '${q.quizId}', '${correctLetter}', '${escape(q.answer1)}', '${escape(q.answer2)}', '${escape(q.answer3)}', '${escape(q.answer4)}')">A) ${q.answer1}</button>
                                    <button class="btn option-btn py-3 fs-6" onclick="checkSetAnswer(this, 'B', '${q.quizId}', '${correctLetter}', '${escape(q.answer1)}', '${escape(q.answer2)}', '${escape(q.answer3)}', '${escape(q.answer4)}')">B) ${q.answer2}</button>
                                    <button class="btn option-btn py-3 fs-6" onclick="checkSetAnswer(this, 'C', '${q.quizId}', '${correctLetter}', '${escape(q.answer1)}', '${escape(q.answer2)}', '${escape(q.answer3)}', '${escape(q.answer4)}')">C) ${q.answer3}</button>
                                    <button class="btn option-btn py-3 fs-6" onclick="checkSetAnswer(this, 'D', '${q.quizId}', '${correctLetter}', '${escape(q.answer1)}', '${escape(q.answer2)}', '${escape(q.answer3)}', '${escape(q.answer4)}')">D) ${q.answer4}</button>
                                </div>
                                <div id="explanation-${q.quizId}" class="alert mt-3 d-none ms-md-4 p-4 border rounded-3">
                                    <h6 class="alert-heading fw-bold fs-5 mb-3" id="result-title-${q.quizId}"></h6>
                                    <hr class="opacity-25 mb-3">
                                    <h6 class="fw-bold text-dark mb-2">Solution Breakdown:</h6>
                                    <p class="mb-0 text-dark lh-lg"> ${q.answerdetail || 'Practicing these concepts consistently will yield the best results for your upcoming tests.'}</p>
                                </div>
                            </article>
                        `;
                    });

                    const prevSetBtn = setIndex > 0 ? `<a href="set-${setNumber - 1}.html" class="btn btn-outline-secondary px-4 py-2">&larr; Previous Practice Set</a>` : '';
                    const nextSetBtn = setIndex < sets.length - 1 ? `<a href="set-${setNumber + 1}.html" class="btn btn-primary px-4 py-2 shadow">Next Practice Set &rarr;</a>` : '';

                    const setPageContent = `
                        <div class="row justify-content-center">
                            <div class="col-lg-10">
                                ${getBreadcrumbs(2, cat, safeName, `Practice Set ${setNumber}`)}
                                
                                <div class="mb-4 bg-white p-4 rounded-4 shadow-sm border-0 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                                    <div>
                                        <h1 class="h3 fw-bold text-dark mb-2">${cat} - Detailed Practice Set ${setNumber}</h1>
                                        <p class="text-muted mb-0">Evaluate your preparation with these 10 carefully selected mock questions. Review explanations instantly to learn from your mistakes.</p>
                                    </div>
                                    <a href="index.html" class="btn btn-outline-primary text-nowrap flex-shrink-0">&larr; Back to ${cat} Hub</a>
                                </div>
                                
                                <div class="ad-container text-center text-muted small mb-5">
                                    <ins class="adsbygoogle" style="display:block; width:100%;" data-ad-client="ca-pub-5947676189341600" data-ad-format="auto" data-full-width-responsive="true"></ins>
                                    <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
                                </div>
                                
                                <div class="practice-set-container">
                                    ${setQuestionsHtml}
                                </div>
                                
                                <div class="d-flex justify-content-between mt-5 pt-4 border-top">
                                    <div>${prevSetBtn}</div>
                                    <div>${nextSetBtn}</div>
                                </div>
                            </div>
                        </div>
                        <script>
                            function checkSetAnswer(btnElement, selectedLetter, quizId, correctLetter, aText, bText, cText, dText) {
                                const answerTexts = { 'A': aText, 'B': bText, 'C': cText, 'D': dText };
                                const container = document.getElementById('quiz-block-' + quizId);
                                const explanationBox = document.getElementById('explanation-' + quizId);
                                const resultTitle = document.getElementById('result-title-' + quizId);
                                container.querySelectorAll('.option-btn').forEach(btn => btn.disabled = true);
                                explanationBox.classList.remove('d-none', 'alert-success', 'alert-danger');
                                if(selectedLetter === correctLetter) {
                                    btnElement.style.borderColor = "#198754";
                                    btnElement.style.backgroundColor = "#d1e7dd";
                                    btnElement.style.color = "#0f5132";
                                    explanationBox.classList.add('alert-success');
                                    resultTitle.innerHTML = "✨ Excellent! Correct Answer.";
                                } else {
                                    btnElement.style.borderColor = "#dc3545";
                                    btnElement.style.backgroundColor = "#f8d7da";
                                    btnElement.style.color = "#842029";
                                    explanationBox.classList.add('alert-danger');
                                    resultTitle.innerHTML = "❌ Incorrect! Answer: " + correctLetter + ") " + answerTexts[correctLetter];
                                }
                            }
                        </script>
                    `;
                    await fsAsync.writeFile(path.join(specificCatDir, setFileName), getHtmlShell(`${cat} Practice Set ${setNumber}`, setPageContent, 2));
                });

                practiceSetsHtml += `
                    <div class="col-6 col-md-4 col-lg-3">
                        <a href="${setFileName}" class="card shadow-sm text-decoration-none card-hover h-100 text-center p-4 border-0 rounded-4">
                            <div class="fs-1 mb-2">📝</div>
                            <h6 class="fw-bold text-dark mb-1">Mock Set ${setNumber}</h6>
                            <span class="badge bg-primary bg-opacity-10 text-primary mt-2">${setQuizzes.length} Questions</span>
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
                                <span class="me-2">🎯</span> Structured Practice Sets
                            </h3>
                            <p class="text-muted mb-4">Take these 10-question mock exams to evaluate your readiness. Immediate feedback and solutions are provided.</p>
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
                    <p class="lead text-muted col-lg-8 mx-auto">Select a subject below to dive into thousands of practice questions, mock sets, and detailed educational explanations designed to help you succeed.</p>
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
                        <li><strong>Structured Practice:</strong> Topic-wise categorization and 10-question mock sets to track progress.</li>
                    </ul>
                </div>
            `;
            await fsAsync.writeFile(path.join(aboutDir, 'index.html'), getHtmlShell('About Wedugo Education', aboutContent, 1));
        });

        let latest20Html = '<div class="card shadow-sm border-0 mb-5 rounded-4 overflow-hidden"><div class="list-group list-group-flush">';
        validQuizzes.slice(0, 20).forEach(q => {
            let badge = q.matchedCategory !== 'Uncategorized' ? `<span class="badge bg-primary bg-opacity-10 text-primary border border-primary-subtle rounded-pill me-3 px-3" style="min-width: max-content;">${q.matchedCategory}</span>` : '';
            latest20Html += `
                <a href="./quiz/${q.quizId}/index.html" class="list-group-item list-group-item-action d-flex align-items-center py-3">
                    ${badge}
                    <span class="text-dark fw-medium text-truncate">${q.question}</span>
                </a>
            `;
        });
        latest20Html += '</div></div>';

        masterPageTasks.push(async () => {
            const homeContent = `
                <header class="text-center py-5 mb-5 bg-white rounded-4 shadow-sm border-0 px-4 mt-3">
                    <span class="badge bg-primary bg-opacity-10 text-primary mb-3 px-3 py-2 rounded-pill fs-6">Over 50,000 Questions Available</span>
                    <h1 class="display-4 fw-bold text-dark mb-4">Master Your Exams with Wedugo Education</h1>
                    <p class="col-md-8 mx-auto fs-5 text-muted mb-5 lh-base">Challenge yourself with high-quality practice sets, subject-specific mock tests, and detailed conceptual explanations designed for competitive success.</p>
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
                        <p class="text-muted mb-0">Jump right into our newest educational material.</p>
                    </div>
                    <a href="./categories/index.html" class="btn btn-outline-primary fw-medium rounded-pill px-4">View All Hubs &rarr;</a>
                </div>
                ${latest20Html}
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

        console.log("✅ Build Complete (AdSense Optimized + Memory Safe)");
    } catch (error) {
        console.error("Build failed:", error);
    }
}

buildWedugoQuizSite();
