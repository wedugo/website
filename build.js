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
        
        // Array to collect master pages to build at the very end
        const masterPageTasks = [];

        console.log("3. Generating Files Category by Category (Memory Safe Mode)...");
        for (const [cat, quizzes] of Object.entries(categoriesMap)) {
            if (!quizzes || quizzes.length === 0) continue; 
            
            console.log(` -> Building ${cat} (${quizzes.length} questions)...`);
            const safeName = cat.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            const specificCatDir = path.join(catMainDir, safeName);
            fs.mkdirSync(specificCatDir, { recursive: true });

            // We will store tasks ONLY for the current category to save RAM
            let currentCategoryTasks = [];

            // INDIVIDUAL QUIZ PAGES
            quizzes.forEach((q, i) => {
                const quizDir = path.join(distDir, 'quiz', String(q.quizId));
                
                currentCategoryTasks.push(async () => {
                    await fsAsync.mkdir(quizDir, { recursive: true });

                    const prevQuiz = quizzes[i - 1];
                    const nextQuiz = quizzes[i + 1];

                    const navButtonsHtml = `
                        <div class="d-flex justify-content-between align-items-center mt-4 pt-4 border-top">
                            ${prevQuiz ? `<a href="../${prevQuiz.quizId}/index.html" class="btn btn-outline-secondary fw-medium px-3 px-md-4">&larr; Previous</a>` : `<button class="btn btn-outline-secondary fw-medium px-3 px-md-4" disabled>&larr; Previous</button>`}
                            ${nextQuiz ? `<a href="../${nextQuiz.quizId}/index.html" class="btn btn-primary fw-medium px-3 px-md-4 shadow-sm">Next &rarr;</a>` : `<button class="btn btn-primary fw-medium px-3 px-md-4 shadow-sm" disabled>Next &rarr;</button>`}
                        </div>
                    `;

                    const quizContent = `
                        <div class="row justify-content-center">
                            <div class="col-lg-8">
                                <div class="ad-container text-center text-muted small">
                                    <ins class="adsbygoogle" style="display:block; width:100%;" data-ad-client="ca-pub-5947676189341600" data-ad-format="auto" data-full-width-responsive="true"></ins>
                                    <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
                                </div>
                                <div class="card shadow-sm p-4 p-md-5 mb-4 bg-white">
                                    <div class="mb-4">
                                        <span class="badge bg-primary badge-cat">${q.matchedCategory}</span>
                                        ${q.language ? `<span class="badge bg-light text-dark border ms-2">${q.language}</span>` : ''}
                                    </div>
                                    <h1 class="h4 mb-4 fw-bold text-dark lh-base">${q.question}</h1>
                                    <div class="d-grid gap-3 mb-2" id="options-container">
                                        <button class="btn option-btn" onclick="checkAnswer(this, 'A')">A) ${q.answer1 || ''}</button>
                                        <button class="btn option-btn" onclick="checkAnswer(this, 'B')">B) ${q.answer2 || ''}</button>
                                        <button class="btn option-btn" onclick="checkAnswer(this, 'C')">C) ${q.answer3 || ''}</button>
                                        <button class="btn option-btn" onclick="checkAnswer(this, 'D')">D) ${q.answer4 || ''}</button>
                                    </div>
                                    <div id="explanation-box" class="alert mt-4 d-none">
                                        <h5 class="alert-heading fw-bold mb-2" id="result-title"></h5>
                                        <hr>
                                        <p class="mb-0 text-dark"><strong>Explanation:</strong> ${q.answerdetail || 'No detailed explanation provided.'}</p>
                                    </div>
                                    ${navButtonsHtml}
                                </div>
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
                                    explanationBox.classList.add('alert-success');
                                    resultTitle.innerHTML = "✨ Correct Answer!";
                                } else {
                                    btnElement.style.borderColor = "#dc3545";
                                    btnElement.style.backgroundColor = "#f8d7da";
                                    btnElement.style.color = "#842029";
                                    explanationBox.classList.add('alert-danger');
                                    resultTitle.innerHTML = "❌ Incorrect! The correct answer was: " + correctLetter + ") " + answerTexts[correctLetter];
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
                            <div class="card shadow-sm p-4 mb-4 bg-white border-0" id="quiz-block-${q.quizId}">
                                <div class="d-flex mb-3">
                                    <span class="badge bg-secondary me-2">Q${(setIndex * QUESTIONS_PER_PAGE) + qIndex + 1}</span>
                                    <h3 class="h5 fw-bold text-dark mb-0 lh-base">${q.question}</h3>
                                </div>
                                <div class="d-grid gap-2 ps-md-4">
                                    <button class="btn option-btn" style="padding: 10px 16px; font-size: 1rem;" onclick="checkSetAnswer(this, 'A', '${q.quizId}', '${correctLetter}', '${escape(q.answer1)}', '${escape(q.answer2)}', '${escape(q.answer3)}', '${escape(q.answer4)}')">A) ${q.answer1}</button>
                                    <button class="btn option-btn" style="padding: 10px 16px; font-size: 1rem;" onclick="checkSetAnswer(this, 'B', '${q.quizId}', '${correctLetter}', '${escape(q.answer1)}', '${escape(q.answer2)}', '${escape(q.answer3)}', '${escape(q.answer4)}')">B) ${q.answer2}</button>
                                    <button class="btn option-btn" style="padding: 10px 16px; font-size: 1rem;" onclick="checkSetAnswer(this, 'C', '${q.quizId}', '${correctLetter}', '${escape(q.answer1)}', '${escape(q.answer2)}', '${escape(q.answer3)}', '${escape(q.answer4)}')">C) ${q.answer3}</button>
                                    <button class="btn option-btn" style="padding: 10px 16px; font-size: 1rem;" onclick="checkSetAnswer(this, 'D', '${q.quizId}', '${correctLetter}', '${escape(q.answer1)}', '${escape(q.answer2)}', '${escape(q.answer3)}', '${escape(q.answer4)}')">D) ${q.answer4}</button>
                                </div>
                                <div id="explanation-${q.quizId}" class="alert mt-3 d-none ms-md-4">
                                    <h6 class="alert-heading fw-bold mb-1" id="result-title-${q.quizId}"></h6>
                                    <hr class="my-2">
                                    <p class="mb-0 small text-dark"><strong>Explanation:</strong> ${q.answerdetail || 'No detailed explanation provided for this question.'}</p>
                                </div>
                            </div>
                        `;
                    });

                    const prevSetBtn = setIndex > 0 ? `<a href="set-${setNumber - 1}.html" class="btn btn-outline-secondary">&larr; Previous Set</a>` : '';
                    const nextSetBtn = setIndex < sets.length - 1 ? `<a href="set-${setNumber + 1}.html" class="btn btn-primary">Next Set &rarr;</a>` : '';

                    const setPageContent = `
                        <div class="row justify-content-center">
                            <div class="col-lg-8">
                                <div class="mb-4 d-flex justify-content-between align-items-center bg-white p-3 rounded shadow-sm">
                                    <h1 class="h5 fw-bold text-primary mb-0">${cat} - Practice Set ${setNumber}</h1>
                                    <a href="index.html" class="btn btn-sm btn-outline-primary">&larr; Back to Category</a>
                                </div>
                                <div class="ad-container text-center text-muted small mb-4">
                                    <ins class="adsbygoogle" style="display:block; width:100%;" data-ad-client="ca-pub-5947676189341600" data-ad-format="auto" data-full-width-responsive="true"></ins>
                                    <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
                                </div>
                                ${setQuestionsHtml}
                                <div class="d-flex justify-content-between mt-4 border-top pt-4">
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
                                    resultTitle.innerHTML = "✨ Correct!";
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
                        <a href="${setFileName}" class="card shadow-sm text-decoration-none card-hover h-100 text-center p-3 border-0">
                            <h6 class="fw-bold text-primary mb-1">Set ${setNumber}</h6>
                            <small class="text-muted">${setQuizzes.length} Questions</small>
                        </a>
                    </div>
                `;
            });
            practiceSetsHtml += '</div>';

            // CATEGORY MASTER PAGE
            if (CATEGORY_LIST.includes(cat)) {
                currentCategoryTasks.push(async () => {
                    let catPageContent = `
                        <div class="d-flex justify-content-between align-items-end mb-4">
                            <h2 class="fw-bold mb-0">${cat}</h2>
                            <span class="text-muted fw-medium">${quizzes.length} Questions Total</span>
                        </div>
                        <h4 class="h5 fw-bold mb-3 border-bottom pb-2">Practice Sets (10 Questions Each)</h4>
                        ${practiceSetsHtml}
                        <h4 class="h5 fw-bold mb-3 border-bottom pb-2 mt-5">All Individual Questions</h4>
                        <div class="card shadow-sm mb-5 border-0">
                            <div class="list-group list-group-flush">
                    `;
                    
                    const listHtml = quizzes.map(q => `
                        <a href="../../quiz/${q.quizId}/index.html" class="list-group-item list-group-item-action d-flex align-items-center">
                            <span class="text-dark">${q.question}</span>
                        </a>
                    `).join('');
                    
                    catPageContent += listHtml + `</div></div>`;
                    await fsAsync.writeFile(path.join(specificCatDir, 'index.html'), getHtmlShell(`${cat} Quizzes`, catPageContent, 2));
                });

                categoriesGridHtml += `
                    <div class="col-md-6 col-lg-4">
                        <div class="card shadow-sm h-100 card-hover border-0">
                            <div class="card-body p-4 text-center d-flex flex-column justify-content-center">
                                <h3 class="h5 fw-bold mb-2 text-dark">${cat}</h3>
                                <p class="text-muted small mb-4">${quizzes.length} Quizzes Available</p>
                                <a href="../category/${safeName}/index.html" class="btn btn-outline-primary mt-auto w-100 fw-medium">Browse Topic</a>
                            </div>
                        </div>
                    </div>
                `;
            }

            // --- EXECUTE & FREE MEMORY BEFORE NEXT CATEGORY ---
            await executeTasksInBatches(currentCategoryTasks, 100);
            currentCategoryTasks = null; // Forces garbage collection of those heavy HTML strings
        }

        console.log("4. Building Core Pages...");
        const categoriesDir = path.join(distDir, 'categories');
        fs.mkdirSync(categoriesDir, { recursive: true });
        masterPageTasks.push(async () => {
            await fsAsync.writeFile(path.join(categoriesDir, 'index.html'), getHtmlShell('All Categories', `<div class="mb-5"><h2 class="fw-bold mb-4">Explore Knowledge Topics</h2>${categoriesGridHtml}</div>`, 1));
        });

        const aboutDir = path.join(distDir, 'about');
        fs.mkdirSync(aboutDir, { recursive: true });
        masterPageTasks.push(async () => {
            const aboutContent = `
                <div class="card shadow-sm p-5 border-0">
                    <h2 class="fw-bold text-primary mb-4">About Wedugo Education</h2>
                    <p class="lead text-muted">Welcome to Wedugo Education, your premier destination for practicing and mastering new subjects.</p>
                </div>
            `;
            await fsAsync.writeFile(path.join(aboutDir, 'index.html'), getHtmlShell('About Us', aboutContent, 1));
        });

        let latest20Html = '<div class="card shadow-sm border-0 mb-5"><div class="list-group list-group-flush">';
        validQuizzes.slice(0, 20).forEach(q => {
            let badge = q.matchedCategory !== 'Uncategorized' ? `<span class="badge bg-primary bg-opacity-10 text-primary border border-primary-subtle rounded-pill me-3" style="min-width: max-content;">${q.matchedCategory}</span>` : '';
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
                <div class="text-center py-5 mb-5 bg-white rounded-4 shadow-sm border-0 px-3">
                    <h1 class="display-5 fw-bold text-dark mb-3">Welcome to Wedugo Education</h1>
                    <p class="col-md-8 mx-auto lead text-muted mb-4">Challenge yourself with high-quality practice sets, mock tests, and detailed explanations across a wide range of subjects.</p>
                    <a href="./categories/index.html" class="btn btn-primary btn-lg px-5 shadow-sm fw-medium rounded-pill">Explore All Categories</a>
                </div>
                <div class="d-flex justify-content-between align-items-end mb-4">
                    <h3 class="fw-bold mb-0 text-dark">Latest 20 Quizzes</h3>
                    <a href="./categories/index.html" class="text-primary text-decoration-none fw-medium">View All <span aria-hidden="true">&rarr;</span></a>
                </div>
                ${latest20Html}
            `;
            await fsAsync.writeFile(path.join(distDir, 'index.html'), getHtmlShell('Home', homeContent, 0));
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

        console.log("✅ Build Complete (Memory Safe + High Speed)");
    } catch (error) {
        console.error("Build failed:", error);
    }
}

buildWedugoQuizSite();
