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

// --- ADSENSE SEO ENRICHMENT FUNCTIONS ---

function getDifficultyData(questionStr) {
    const len = (questionStr || "").length;
    if (len < 50) return { label: 'Easy', color: 'success' };
    if (len > 120) return { label: 'Hard', color: 'danger' };
    return { label: 'Medium', color: 'warning' };
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

function getCategorySEOText(category, totalQuestions) {
    return `
        <div class="card bg-white border border-light shadow-sm p-4 p-md-5 mb-5 rounded-4">
            <h2 class="h4 fw-bold text-dark mb-3">Comprehensive Guide to ${category}</h2>
            <p class="text-muted mb-3 lh-lg" style="font-size: 1.05rem;">
                Welcome to the ultimate preparation hub for <strong>${category}</strong>. Mastering this subject is crucial for academic excellence and general knowledge enhancement. This topic is frequently tested in <strong>${getExamTarget(category)}</strong>. 
            </p>
            <p class="text-muted mb-0 lh-lg" style="font-size: 1.05rem;">
                Below, you will find a curated collection of <strong>${totalQuestions} carefully selected multiple-choice questions (MCQs)</strong> designed to test your understanding, improve your retention, and prepare you for real-world exam scenarios. To maximize your study efficiency, we have consolidated these questions into timed, 10-question practice sets. Work through them, review the detailed explanations upon submission, and track your progress.
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
    const cacheBuster = new Date().getTime(); // Fixes the logo cache issue
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

function getHtmlShell(title, content, depth, seoDescription = "") {
    const cleanDesc = (seoDescription || 'Practice high-quality exam preparation sets and timed mock tests on Wedugo Education.').replace(/"/g, '&quot;').substring(0, 160);
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
        body { background-color: #f8f9fa; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #212529; }
        .card { border: 1px solid #e9ecef; border-radius: 16px; transition: transform 0.2s, box-shadow 0.2s; }
        .card-hover:hover { transform: translateY(-4px); box-shadow: 0 12px 30px rgba(0,0,0,0.08) !important; }
        .option-btn { text-align: left; padding: 18px 24px; font-weight: 500; font-size: 1.1rem; border-radius: 12px; border: 2px solid #dee2e6; background: #fff; transition: all 0.2s ease; color: #495057; }
        .option-btn:hover:not(:disabled) { background-color: #f8f9fa; border-color: #adb5bd; transform: translateX(6px); }
        .option-btn:disabled { opacity: 1; cursor: default; }
        .badge-cat { font-size: 0.9rem; padding: 0.6em 1em; letter-spacing: 0.5px; }
        .ad-container { min-height: 100px; background: #fff; border: 1px dashed #ced4da; margin-bottom: 30px; border-radius: 12px; display: block; width: 100%; overflow: hidden; text-align: center; }
        .timer-header { position: sticky; top: 0; z-index: 1020; border-bottom: 4px solid #0d6efd; background: rgba(255,255,255,0.95); backdrop-filter: blur(5px); }
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
        });

        const catMainDir = path.join(distDir, 'category');
        fs.mkdirSync(catMainDir, { recursive: true });
        let categoriesGridHtml = '<div class="row g-4">';
        
        const masterPageTasks = [];
        const globallyGeneratedSets = []; // For the homepage Latest sets

        console.log("3. Generating THICK CONTENT Category Hubs & Practice Sets...");
        
        for (const [cat, quizzes] of Object.entries(categoriesMap)) {
            if (!quizzes || quizzes.length === 0) continue; 
            
            const safeName = cat.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            const specificCatDir = path.join(catMainDir, safeName);
            fs.mkdirSync(specificCatDir, { recursive: true });

            let currentCategoryTasks = [];

            // SINGLE QUESTION PAGES ARE DELETED HERE. We ONLY build thick 10-Question sets.

            const QUESTIONS_PER_PAGE = 10;
            const sets = chunkArray(quizzes, QUESTIONS_PER_PAGE);
            let practiceSetsHtml = '<div class="row g-4 mb-4">';

            sets.forEach((setQuizzes, setIndex) => {
                const setNumber = setIndex + 1;
                const setFileName = `set-${setNumber}.html`;
                
                // Track for homepage
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
                        
                        const explanationText = (q.answerdetail && q.answerdetail.trim() !== "") 
                            ? q.answerdetail 
                            : `While a specific detailed explanation is not available for this query, reviewing the core principles of <strong>${q.matchedCategory}</strong> will help clarify the concept. This principle is vital for ${getExamTarget(q.matchedCategory)}. Consistent practice is the key to mastering these patterns.`;

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
                                
                                <!-- TIMER HEADER -->
                                <div class="timer-header bg-white p-4 shadow-sm d-flex flex-wrap gap-3 justify-content-between align-items-center mb-5 rounded-4 border">
                                    <div>
                                        <h1 class="h3 fw-bold text-dark mb-2">${cat} - Comprehensive Mock Test ${setNumber}</h1>
                                        <p class="text-muted mb-0 fs-6">Answer all 10 questions, then click submit to view your detailed academic score and answer analysis.</p>
                                    </div>
                                    <div class="text-center ms-auto bg-light p-3 rounded-4 border">
                                        <span class="d-block text-muted small fw-bold text-uppercase mb-1">Time Remaining</span>
                                        <div class="fs-2 fw-bold font-monospace text-danger" id="timer-display">10:00</div>
                                    </div>
                                </div>

                                <!-- SCORE BOARD -->
                                <div id="score-board" class="card shadow-lg border-success d-none mb-5 text-center p-5 rounded-4 bg-success bg-opacity-10" style="border-width: 2px !important;">
                                    <h2 class="text-success fw-bold display-6 mb-4">Test Completed Successfully!</h2>
                                    <p class="fs-4 text-dark mb-3">Your Final Academic Score:</p>
                                    <div class="display-1 fw-bold text-success mb-4" id="final-score">0 / 10</div>
                                    <p class="text-muted fs-5 lh-lg">Review your correct and incorrect answers below. Taking multiple timed sets dramatically increases retention for competitive exams.</p>
                                    <a href="index.html" class="btn btn-success btn-lg mt-3 rounded-pill px-5">Back to ${cat} Hub</a>
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
                                    <button class="btn btn-success btn-lg px-5 py-4 fw-bold shadow-lg rounded-pill fs-4 w-100 w-md-auto" onclick="submitTest()">
                                        📝 Submit Test & View Explanations
                                    </button>
                                </div>
                                
                                <div class="d-flex justify-content-between mt-5 pt-4 border-top">
                                    <div>${prevSetBtn}</div>
                                    <div>${nextSetBtn}</div>
                                </div>

                                <!-- Disqus Comments Section for Sets -->
                                <div class="mt-5 pt-5 border-top">
                                    <div class="card bg-white border-0 shadow-sm p-4 p-md-5 rounded-4">
                                        <h4 class="h3 fw-bold mb-3 text-dark">Community Discussion</h4>
                                        <p class="text-muted mb-5 fs-5">Have a doubt about any question in this set? Discuss with the community below.</p>
                                        ${getDisqusEmbed(`${safeName}_set_${setNumber}`, `category/${safeName}/${setFileName}`)}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- MOCK TEST JAVASCRIPT LOGIC -->
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

            // CATEGORY MASTER PAGE
            if (CATEGORY_LIST.includes(cat)) {
                currentCategoryTasks.push(async () => {
                    let catPageContent = `
                        <div class="row justify-content-center">
                            <div class="col-lg-10 col-xl-9">
                                ${getBreadcrumbs(2, cat, safeName, '')}
                                
                                <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-end mb-4">
                                    <h1 class="display-5 fw-bold mb-3 mb-md-0 text-dark">${cat} MCQs & Study Guide</h1>
                                    <span class="badge bg-primary fs-5 px-4 py-2 rounded-pill shadow-sm">${quizzes.length} Questions</span>
                                </div>
                                
                                ${getCategorySEOText(cat, quizzes.length)}
                                
                                <div class="mt-5 mb-5">
                                    <div class="d-flex align-items-center mb-4">
                                        <span class="fs-2 me-3">🎯</span>
                                        <div>
                                            <h3 class="h3 fw-bold text-dark mb-1">Structured Practice Sets</h3>
                                            <p class="text-muted mb-0 fs-6">Evaluate your readiness. Immediate feedback provided upon submission.</p>
                                        </div>
                                    </div>
                                    ${practiceSetsHtml}
                                </div>
                            </div>
                        </div>
                    `;
                    
                    await fsAsync.writeFile(path.join(specificCatDir, 'index.html'), getHtmlShell(`${cat} MCQs & Quiz Preparation`, catPageContent, 2));
                });

                categoriesGridHtml += `
                    <div class="col-md-6 col-lg-4">
                        <div class="card shadow-sm h-100 card-hover border-light rounded-4 overflow-hidden bg-white">
                            <div class="card-body p-4 p-xl-5 text-center d-flex flex-column justify-content-center">
                                <div class="mb-4 bg-primary bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mx-auto" style="width: 80px; height: 80px;">
                                    <span class="fs-2 text-primary">📚</span>
                                </div>
                                <h3 class="h4 fw-bold mb-2 text-dark">${cat}</h3>
                                <p class="text-muted mb-4 fs-6">Access a comprehensive library of ${quizzes.length} highly relevant MCQs structured into timed exams.</p>
                                <a href="../category/${safeName}/index.html" class="btn btn-outline-primary mt-auto w-100 fw-bold py-3 rounded-pill">Start Practicing</a>
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
                    <p class="lead text-muted col-lg-8 mx-auto lh-lg">Select a subject below to dive into thousands of practice questions, timed mock sets, and detailed educational explanations designed to help you succeed.</p>
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
                <div class="card shadow-sm p-4 p-md-5 border-light rounded-4 bg-white">
                    <h1 class="fw-bold text-primary mb-4 display-6">About Wedugo Education</h1>
                    <p class="lead text-dark lh-base mb-5">Welcome to Wedugo Education, your premier destination for practicing and mastering a diverse range of academic and competitive subjects.</p>
                    <div class="row g-5">
                        <div class="col-md-6">
                            <h3 class="h4 fw-bold mb-3">Our Mission</h3>
                            <p class="text-muted lh-lg fs-6">Our mission is to provide accessible, high-quality multiple-choice questions (MCQs) and detailed study guides to students and aspirants across the globe. We believe that consistent practice and clear conceptual understanding are the keys to cracking any exam.</p>
                        </div>
                        <div class="col-md-6">
                            <h3 class="h4 fw-bold mb-3">What We Offer</h3>
                            <ul class="text-muted mb-0 lh-lg fs-6">
                                <li><strong>Massive Question Bank:</strong> Over 50,000 carefully curated questions.</li>
                                <li><strong>Detailed Explanations:</strong> Learn the 'why' behind the correct answers.</li>
                                <li><strong>Timed Practice:</strong> Topic-wise categorization and 10-question mock sets with built-in timers to track speed and progress.</li>
                            </ul>
                        </div>
                    </div>
                </div>
            `;
            await fsAsync.writeFile(path.join(aboutDir, 'index.html'), getHtmlShell('About Wedugo Education', aboutContent, 1));
        });

        // --- HOMEPAGE LAYOUT (Now linking to Thick Practice Sets) ---
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
                    <span class="badge bg-primary bg-opacity-10 text-primary mb-4 px-4 py-2 rounded-pill fs-6 border border-primary-subtle">Over 50,000 Questions Consolidated into Exam Sets</span>
                    <h1 class="display-4 fw-bold text-dark mb-4 px-lg-5">Master Your Exams with Wedugo Education</h1>
                    <p class="col-lg-8 mx-auto fs-5 text-muted mb-5 lh-lg">Challenge yourself with high-quality practice sets, timed mock tests, and detailed conceptual explanations designed exclusively for competitive success.</p>
                    <div class="d-flex justify-content-center gap-3 flex-wrap">
                        <a href="./categories/index.html" class="btn btn-primary btn-lg px-5 py-3 shadow-lg fw-bold rounded-pill">Explore All Topics</a>
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
                    <a href="./categories/index.html" class="btn btn-dark btn-lg px-5 py-3 fw-bold rounded-pill shadow-sm">Browse 100+ More Practice Sets</a>
                </div>
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

        console.log("✅ Build Complete (AdSense Master Framework - Thick Sets Only)");
    } catch (error) {
        console.error("Build failed:", error);
    }
}

buildWedugoQuizSite();
