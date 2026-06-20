const fs = require('fs');
const path = require('path');

const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQSnJP6ImRuS24j_tOTKA_i1QG_K-DKutrWxjjSbi4WszrZxR90g_1uNaXQqOjnxR2tX9flEFXy7qfY/pub?gid=0&single=true&output=csv";

const SITE_BASE_URL = "https://www.wedugo.com"; 

// Your specific category hierarchy
const CATEGORY_LIST = [
    "General Knowledge & Science", "Indian Geography", "World Geography", "Indian Economy",
    "General Science", "Physics", "Chemistry", "Biology", "Solar System",
    "Madhya Pradesh GK", "Famous Personalities", "Honours and Awards", "Inventions",
    "Days and Years", "Aptitude & Reasoning", "Reasoning", "Aptitude", "Average",
    "Series", "Sets", "Percentage", "Simple Interest", "Surds and Indices",
    "Ratio and Proportion", "Technical & Language", "Computer", "Technology",
    "Civil Engineering", "English", "Hindi", "Sports"
];

function getNavbar(depth) {
    const prefix = depth === 0 ? '.' : '../'.repeat(depth).slice(0, -1);
    return `
    <nav class="navbar navbar-expand-lg navbar-dark bg-primary mb-4 shadow-sm">
        <div class="container">
            <a class="navbar-brand fw-bold" href="${prefix}/index.html">Wedugo Education</a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav ms-auto">
                    <li class="nav-item"><a class="nav-link" href="${prefix}/index.html">Home</a></li>
                    <li class="nav-item"><a class="nav-link" href="${prefix}/categories/index.html">Categories</a></li>
                    <li class="nav-item"><a class="nav-link" href="${prefix}/about/index.html">About</a></li>
                </ul>
            </div>
        </div>
    </nav>`;
}

function getHtmlShell(title, content, depth, seoDescription = "", pageUrl = "") {
    const cleanDescription = (seoDescription || 'Practice high-quality exam preparation questions and mock tests on Wedugo Education.').replace(/"/g, '&quot;').substring(0, 160);

    return `
<!DOCTYPE html>
<html lang="hi">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} | Wedugo Education</title>
    <meta name="description" content="${cleanDescription}">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5947676189341600" crossorigin="anonymous"></script>
    <script type='text/javascript' src='https://platform-api.sharethis.com/js/sharethis.js#property=5c5059d8c9830d001319b017&product=inline-share-buttons' async='async'></script>
    <style>
        body { background-color: #f8f9fa; }
        .option-btn { text-align: left; padding: 15px 20px; font-weight: 500; transition: 0.2s; }
        .option-btn:hover:not(:disabled) { transform: translateX(5px); background-color: #f0f8ff; }
        .option-btn:disabled { opacity: 0.8; cursor: not-allowed; }
        .ad-container { min-height: 100px; background: #fff; border: 1px dashed #dee2e6; display: flex; align-items: center; justify-content: center; color: #adb5bd; font-size: 12px; margin-bottom: 20px; border-radius: 8px;}
    </style>
</head>
<body>
    ${getNavbar(depth)}
    <div class="container pb-5">${content}</div>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>`;
}

async function buildWedugoQuizSite() {
    try {
        const response = await fetch(SHEET_CSV_URL);
        const csvText = await response.text();
        const lines = csvText.trim().split(/\r?\n/).map(line => line.split(','));
        const headers = lines[0].map(h => h.trim());
        const rows = lines.slice(1).reverse(); 

        const distDir = path.join(__dirname, 'public');
        if (fs.existsSync(distDir)) fs.rmSync(distDir, { recursive: true });
        fs.mkdirSync(distDir);

        const categoriesMap = {};
        let allQuizzesListHtml = '<div class="list-group">';

        rows.forEach((row, index) => {
            if (row.length < headers.length) return; 
            const q = {};
            headers.forEach((header, i) => { q[header] = row[i]?.trim(); });

            // Data Corruption Filter
            const isCorrupted = /[\u0080-\uFFFF]/.test(JSON.stringify(q));
            if (isCorrupted && q.question && q.question.includes('à¤')) return;

            const quizId = q.id || (rows.length - index);
            const category = q.qcategory || 'Uncategorized';
            const uniquePageUrl = `${SITE_BASE_URL}/quiz/${quizId}/index.html`;

            if (!categoriesMap[category]) categoriesMap[category] = [];
            categoriesMap[category].push({ ...q, quizId });

            const quizDir = path.join(distDir, 'quiz', String(quizId));
            fs.mkdirSync(quizDir, { recursive: true });

            const quizContent = `
                <div class="row g-4 justify-content-center">
                    <div class="col-lg-8">
                        <div class="ad-container text-center mb-4">
                            <ins class="adsbygoogle" style="display:block" data-ad-client="ca-pub-5947676189341600" data-ad-format="auto" data-full-width-responsive="true"></ins>
                            <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
                        </div>
                        <div class="card shadow-sm p-4 p-md-5 mb-4 bg-white">
                            <div class="d-flex justify-content-between align-items-center mb-4">
                                <span class="badge bg-primary px-3 py-2 fs-7">${category}</span>
                            </div>
                            <h1 class="h3 mb-3 fw-bold text-dark lh-base">${q.question}</h1>
                            <div class="d-grid gap-3 mb-2" id="options-container">
                                <button class="btn option-btn shadow-sm" onclick="checkAnswer(this, 'A')">A) ${q.answer1}</button>
                                <button class="btn option-btn shadow-sm" onclick="checkAnswer(this, 'B')">B) ${q.answer2}</button>
                                <button class="btn option-btn shadow-sm" onclick="checkAnswer(this, 'C')">C) ${q.answer3}</button>
                                <button class="btn option-btn shadow-sm" onclick="checkAnswer(this, 'D')">D) ${q.answer4}</button>
                            </div>
                            <div id="explanation-box" class="alert mt-4 d-none border-2">
                                <h4 class="alert-heading fw-bold mb-2" id="result-title"></h4>
                                <div class="fs-6 py-2 border-top"><p class="mb-0 text-dark"><strong>Explanation:</strong> ${q.answerdetail || 'No explanation provided.'}</p></div>
                            </div>
                        </div>
                        <div class="card shadow-sm p-4 bg-white text-center">
                            <h3 class="h5 fw-bold text-dark mb-3">Share your reaction</h3>
                            <div class="sharethis-inline-reaction-buttons"></div>
                        </div>
                    </div>
                </div>
                <script>
                    function checkAnswer(btnElement, selectedLetter) {
                        const correctLetter = "${(q.mainanswer || '').toString().replace(/[^A-D]/gi, '').toUpperCase()}";
                        const answerTexts = { 'A': "${(q.answer1 || '').replace(/'/g, "\\'")}", 'B': "${(q.answer2 || '').replace(/'/g, "\\'")}", 'C': "${(q.answer3 || '').replace(/'/g, "\\'")}", 'D': "${(q.answer4 || '').replace(/'/g, "\\'")}" };
                        const explanationBox = document.getElementById('explanation-box');
                        const resultTitle = document.getElementById('result-title');
                        document.querySelectorAll('.option-btn').forEach(btn => btn.disabled = true);
                        explanationBox.classList.remove('d-none');
                        if(selectedLetter === correctLetter) {
                            btnElement.style.borderColor = "#198754"; btnElement.style.backgroundColor = "#e8f5e9";
                            explanationBox.classList.add('alert-success', 'border-success');
                            resultTitle.innerHTML = "✨ Correct!";
                        } else {
                            btnElement.style.borderColor = "#dc3545"; btnElement.style.backgroundColor = "#fde8e8";
                            explanationBox.classList.add('alert-danger', 'border-danger');
                            resultTitle.innerHTML = "❌ Incorrect! Answer: " + correctLetter + ") " + answerTexts[correctLetter];
                        }
                    }
                </script>
            `;
            fs.writeFileSync(path.join(quizDir, 'index.html'), getHtmlShell(q.question.substring(0, 40), quizContent, 2));

            allQuizzesListHtml += `<a href="./quiz/${quizId}/index.html" class="list-group-item list-group-item-action">${q.question}</a>`;
        });
        allQuizzesListHtml += '</div>';

        // Generate Category Pages based on YOUR list
        const catMainDir = path.join(distDir, 'category');
        fs.mkdirSync(catMainDir, { recursive: true });
        
        let categoryCardsHtml = '<div class="row g-4">';
        
        // Loop through your PRE-DEFINED list
        CATEGORY_LIST.forEach(cat => {
            const quizzes = categoriesMap[cat] || [];
            const safeCatName = cat.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            const specificCatDir = path.join(catMainDir, safeCatName);
            fs.mkdirSync(specificCatDir, { recursive: true });

            let catQuizzesHtml = `<h2 class="mb-4">${cat}</h2><div class="list-group">`;
            quizzes.forEach(q => catQuizzesHtml += `<a href="../../quiz/${q.quizId}/index.html" class="list-group-item">${q.question}</a>`);
            catQuizzesHtml += '</div>';
            fs.writeFileSync(path.join(specificCatDir, 'index.html'), getHtmlShell(cat, catQuizzesHtml, 2));

            categoryCardsHtml += `
                <div class="col-md-4"><div class="card p-3 mb-3"><h5 class="card-title">${cat}</h5><a href="../category/${safeCatName}/index.html" class="btn btn-primary btn-sm">View (${quizzes.length})</a></div></div>
            `;
        });
        categoryCardsHtml += '</div>';

        fs.writeFileSync(path.join(distDir, 'categories', 'index.html'), getHtmlShell('Categories', `<h2>Explore Categories</h2>${categoryCardsHtml}`, 1));
        
        const latestQuizzesHtml = allQuizzesListHtml.split('</a>').slice(0, 20).join('</a>') + '</a>';
        const homeContent = `
            <div class="text-center py-5"><h1>Welcome to Wedugo</h1><a href="./categories/index.html" class="btn btn-primary">Browse All Categories</a></div>
            <h3>Latest 20 Quizzes</h3>${latestQuizzesHtml}
        `;
        fs.writeFileSync(path.join(distDir, 'index.html'), getHtmlShell('Home', homeContent, 0));
    } catch (error) { console.error(error); }
}

buildWedugoQuizSite();
