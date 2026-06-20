const fs = require('fs');
const path = require('path');

const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQSnJP6ImRuS24j_tOTKA_i1QG_K-DKutrWxjjSbi4WszrZxR90g_1uNaXQqOjnxR2tX9flEFXy7qfY/pub?gid=0&single=true&output=csv";
const SITE_BASE_URL = "https://www.wedugo.com"; 

// OFFICIAL CATEGORY LIST (Strictly Enforced)
const CATEGORY_LIST = [
    "Indian Geography","World Organisations","Inventions","Physics","Indian Economy","Days and Years","Technology","Chemistry","Honours and Awards","General Science","General Knowledge","Reasoning","Civil Engineering","Hindi","Sports","Computer","Biology","World Geography","Famous Personalities","Aptitude","Madhya Pradesh GK","Solar System","English","Series","Average","Sets","Percentage","Simple Interest","Surds and Indices","Ratio and Proportion","Time and Work","Trains Time","Age","Area","Profit and Loss","Calendar","Simplification","Indian Polity and Constitution","Indian History","World History","History","Environmental Science and Ecology","Blood Relation","Biochemistry","Fats and Fatty Acid Metabolism","Vitamins","Enzymes","Mineral Metabolism","Hormone Metabolism","Distance and Direction","Nucleic Acids","Water and Electrolyte Balance","History of Microbiology","Microbiology","Bacteria and Gram Staining","Agriculture","Solid Mechanics","Child Development and Pedagogy","Virus","Pharmacology","Anatomy","Psychology","Indian General Knowledge"
];

// ROBUST CSV PARSER: Safely ignores commas that are inside quotes
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

// HELPER: Dynamic Navbar (No Icon, Text Only)
function getNavbar(depth) {
    const prefix = depth === 0 ? '.' : '../'.repeat(depth).slice(0, -1);
    return `
    <nav class="navbar navbar-expand-lg navbar-dark bg-primary mb-4 shadow-sm">
        <div class="container">
            <a class="navbar-brand fw-bold fs-4" href="${prefix}/index.html">Wedugo Education</a>
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

// HELPER: Main HTML Shell (Favicon in head, Modern UI styling)
function getHtmlShell(title, content, depth, seoDescription = "") {
    const cleanDesc = (seoDescription || 'Practice high-quality exam preparation questions and mock tests on Wedugo Education.').replace(/"/g, '&quot;').substring(0, 160);
    return `<!DOCTYPE html>
<html lang="hi">
<head>
    <meta charset="UTF-8">
    
    <!-- Google tag (gtag.js) -->
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
    
    <!-- Favicon -->
    <link rel="icon" href="https://www.wedugo.com/main_images/icon.png" type="image/png">
    
    <!-- Bootstrap CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    
    <!-- AdSense & ShareThis -->
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
        .ad-container { min-height: 100px; background: #fff; border: 1px dashed #ced4da; margin-bottom: 24px; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
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

async function buildWedugoQuizSite() {
    try {
        // 1. Fetch and Parse Data
        const response = await fetch(SHEET_CSV_URL);
        const csvText = await response.text();
        const lines = csvText.trim().split(/\r?\n/);
        
        const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase());
        const rows = lines.slice(1).reverse(); 

        const distDir = path.join(__dirname, 'public');
        if (fs.existsSync(distDir)) fs.rmSync(distDir, { recursive: true });
        fs.mkdirSync(distDir);

        // 2. Setup Category Map with Strict Enforcement
        const categoriesMap = {};
        CATEGORY_LIST.forEach(cat => categoriesMap[cat] = []);
        categoriesMap['Uncategorized'] = [];

        const validQuizzes = [];

        // 3. Process Rows and Sort Data
        rows.forEach((line, index) => {
            const values = parseCSVLine(line);
            if (values.length < headers.length) return; 

            const q = {};
            headers.forEach((h, i) => q[h] = values[i]);

            // Data Corruption Filter (Ignores broken Hindi characters)
            if (q.question && q.question.includes('à¤')) return;
            if (!q.question) return;

            // Strict Category Matching (Case-insensitive)
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

        // 4. Generate Specific Category Pages AND Individual Quiz Pages (With Prev/Next buttons)
        const catMainDir = path.join(distDir, 'category');
        fs.mkdirSync(catMainDir, { recursive: true });
        
        let categoriesGridHtml = '<div class="row g-4">';

        for (const [cat, quizzes] of Object.entries(categoriesMap)) {
            if (!quizzes || quizzes.length === 0) continue; // Skip empty categories

            // --- GENERATE INDIVIDUAL QUIZ PAGES FOR THIS CATEGORY ---
            quizzes.forEach((q, i) => {
                const quizDir = path.join(distDir, 'quiz', String(q.quizId));
                fs.mkdirSync(quizDir, { recursive: true });

                // Find Previous and Next quizzes inside the SAME category
                const prevQuiz = quizzes[i - 1];
                const nextQuiz = quizzes[i + 1];

                // Build the Next/Previous Button Row
                const navButtonsHtml = `
                    <div class="d-flex justify-content-between align-items-center mt-4 pt-4 border-top">
                        ${prevQuiz 
                            ? `<a href="../${prevQuiz.quizId}/index.html" class="btn btn-outline-secondary fw-medium px-3 px-md-4">&larr; Previous</a>` 
                            : `<button class="btn btn-outline-secondary fw-medium px-3 px-md-4" disabled>&larr; Previous</button>`}
                        
                        ${nextQuiz 
                            ? `<a href="../${nextQuiz.quizId}/index.html" class="btn btn-primary fw-medium px-3 px-md-4 shadow-sm">Next &rarr;</a>` 
                            : `<button class="btn btn-primary fw-medium px-3 px-md-4 shadow-sm" disabled>Next &rarr;</button>`}
                    </div>
                `;

                const quizContent = `
                    <div class="row justify-content-center">
                        <div class="col-lg-8">
                            <div class="ad-container text-center text-muted small">
                                <ins class="adsbygoogle" style="display:block" data-ad-client="ca-pub-5947676189341600" data-ad-format="auto" data-full-width-responsive="true"></ins>
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
                                    <p class="mb-0 text-dark"><strong>Explanation:</strong> ${q.answerdetail || 'No detailed explanation provided for this question.'}</p>
                                </div>
                                
                                <!-- NEXT & PREVIOUS BUTTONS INJECTED HERE -->
                                ${navButtonsHtml}
                            </div>

                            <div class="card shadow-sm p-4 bg-white text-center mb-4">
                                <h3 class="h6 fw-bold text-secondary text-uppercase mb-3">Share this Question</h3>
                                <div class="sharethis-inline-reaction-buttons"></div>
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
                fs.writeFileSync(path.join(quizDir, 'index.html'), getHtmlShell(q.question.substring(0,40) + '...', quizContent, 2, q.question));
            });

            // --- GENERATE CATEGORY MASTER PAGES ---
            if (CATEGORY_LIST.includes(cat)) {
                const safeName = cat.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                const specificCatDir = path.join(catMainDir, safeName);
                fs.mkdirSync(specificCatDir, { recursive: true });

                let catPageContent = `
                    <div class="d-flex justify-content-between align-items-end mb-4">
                        <h2 class="fw-bold mb-0">${cat}</h2>
                        <span class="text-muted fw-medium">${quizzes.length} Questions</span>
                    </div>
                    <div class="card shadow-sm mb-5">
                        <div class="list-group list-group-flush">
                `;
                
                quizzes.forEach(q => {
                    catPageContent += `
                        <a href="../../quiz/${q.quizId}/index.html" class="list-group-item list-group-item-action d-flex align-items-center">
                            <span class="text-dark">${q.question}</span>
                        </a>
                    `;
                });
                catPageContent += `</div></div>`;

                fs.writeFileSync(path.join(specificCatDir, 'index.html'), getHtmlShell(`${cat} Quizzes`, catPageContent, 2));

                // Build grid card for All Categories page
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
        }
        categoriesGridHtml += '</div>';

        // 5. Generate All Categories Master Page
        const categoriesDir = path.join(distDir, 'categories');
        fs.mkdirSync(categoriesDir, { recursive: true });
        fs.writeFileSync(path.join(categoriesDir, 'index.html'), getHtmlShell('All Categories', `<div class="mb-5"><h2 class="fw-bold mb-4">Explore Knowledge Topics</h2>${categoriesGridHtml}</div>`, 1));

        // 6. Generate About Page
        const aboutDir = path.join(distDir, 'about');
        fs.mkdirSync(aboutDir, { recursive: true });
        const aboutContent = `
            <div class="card shadow-sm p-5 border-0">
                <h2 class="fw-bold text-primary mb-4">About Wedugo Education</h2>
                <p class="lead text-muted">Welcome to Wedugo Education, your premier destination for practicing and mastering new subjects.</p>
                <p>This platform provides high-quality, interactive quiz formats to help students and professionals prepare for technical exams and general knowledge assessments.</p>
            </div>
        `;
        fs.writeFileSync(path.join(aboutDir, 'index.html'), getHtmlShell('About Us', aboutContent, 1));

        // 7. Generate Home Page (EXACTLY 20 LATEST ITEMS)
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
        fs.writeFileSync(path.join(distDir, 'index.html'), getHtmlShell('Home', homeContent, 0));

        console.log("Success! Cleaned UI, Strict Categories, Next/Prev Buttons, and 20-Item Homepage Built Perfectly.");
    } catch (error) {
        console.error("Build failed:", error);
    }
}

buildWedugoQuizSite();
