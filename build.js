const fs = require('fs');
const path = require('path');

const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQSnJP6ImRuS24j_tOTKA_i1QG_K-DKutrWxjjSbi4WszrZxR90g_1uNaXQqOjnxR2tX9flEFXy7qfY/pub?gid=0&single=true&output=csv";

// Helper for Navigation
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

// Helper for HTML Shell
function getHtmlShell(title, content, depth) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} | Wedugo Education</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        body { background-color: #f8f9fa; }
        .option-btn { text-align: left; padding: 15px 20px; font-weight: 500; transition: 0.2s; }
        .option-btn:hover { transform: translateX(5px); }
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
        const response = await fetch(SHEET_CSV_URL);
        const csvText = await response.text();
        
        const lines = csvText.trim().split('\n').map(line => line.split(','));
        const headers = lines[0].map(h => h.trim());
        const rows = lines.slice(1).reverse(); // Newest first

        const distDir = path.join(__dirname, 'public');
        if (fs.existsSync(distDir)) fs.rmSync(distDir, { recursive: true });
        fs.mkdirSync(distDir);

        const categoriesMap = {};
        let allQuizzesListHtml = '<div class="list-group">';

        rows.forEach((row, index) => {
            if (row.length < headers.length) return; 
            
            // Map row data to YOUR exact headers
            const q = {};
            headers.forEach((header, i) => { q[header] = row[i]?.trim(); });

            // Using your specific column names
            const quizId = q.id || (rows.length - index);
            const category = q.qcategory || 'Uncategorized';

            if (!categoriesMap[category]) categoriesMap[category] = [];
            categoriesMap[category].push({ ...q, quizId });

            const quizDir = path.join(distDir, 'quiz', String(quizId));
            fs.mkdirSync(quizDir, { recursive: true });

            // Handle optional image (questionurl)
            const imageHtml = q.questionurl ? `<img src="${q.questionurl}" class="img-fluid rounded mb-4 shadow-sm" alt="Question Resource">` : '';

            // Handle optional language tag
            const langBadge = q.language ? `<span class="badge bg-info text-dark ms-2">${q.language}</span>` : '';

            const quizContent = `
                <div class="card shadow-sm mx-auto" style="max-width: 700px;">
                    <div class="card-body p-4 p-md-5">
                        
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <div>
                                <span class="badge bg-secondary">${category}</span>
                                ${langBadge}
                            </div>
                            <small class="text-muted">ID: ${q.que_id || quizId}</small>
                        </div>
                        
                        
                        
                        <h3 class="card-title mb-2 fw-bold text-dark">${q.question}</h3>
                        <p class="text-muted small mb-4">Posted by: <strong>${q.postby || 'Admin'}</strong></p>

                        <div class="d-grid gap-3" id="options-container">
                            <button class="btn btn-outline-primary option-btn" onclick="checkAnswer(this, '${q.answer1}')">A) ${q.answer1}</button>
                            <button class="btn btn-outline-primary option-btn" onclick="checkAnswer(this, '${q.answer2}')">B) ${q.answer2}</button>
                            <button class="btn btn-outline-primary option-btn" onclick="checkAnswer(this, '${q.answer3}')">C) ${q.answer3}</button>
                            <button class="btn btn-outline-primary option-btn" onclick="checkAnswer(this, '${q.answer4}')">D) ${q.answer4}</button>
                        </div>

                        <div id="explanation-box" class="alert mt-4 d-none">
                            <h5 class="alert-heading" id="result-title"></h5>
                            <hr>
                            <p class="mb-0"><strong>Explanation:</strong> ${q.answerdetail || 'No explanation provided.'}</p>
                        </div>

                    </div>
                </div>

                <script>
                    function checkAnswer(btnElement, selectedOption) {
                        const correct = "${q.mainanswer}";
                        const explanationBox = document.getElementById('explanation-box');
                        const resultTitle = document.getElementById('result-title');
                        const allButtons = document.querySelectorAll('.option-btn');
                        
                        // Disable all buttons after clicking
                        allButtons.forEach(btn => btn.disabled = true);

                        // Show Explanation Box
                        explanationBox.classList.remove('d-none');

                        if(selectedOption === correct) {
                            btnElement.classList.replace('btn-outline-primary', 'btn-success');
                            explanationBox.classList.add('alert-success');
                            resultTitle.innerText = "Correct! 🎉";
                        } else {
                            btnElement.classList.replace('btn-outline-primary', 'btn-danger');
                            explanationBox.classList.add('alert-danger');
                            resultTitle.innerText = "Incorrect! ❌ The correct answer was: " + correct;
                        }
                    }
                </script>
            `;
            fs.writeFileSync(path.join(quizDir, 'index.html'), getHtmlShell(`Quiz: ${q.question.substring(0,20)}...`, quizContent, 2));

            allQuizzesListHtml += `<a href="./quiz/${quizId}/index.html" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
                <div>
                    <span class="badge bg-primary rounded-pill me-2">${category}</span> 
                    ${q.question}
                </div>
                ${q.language ? `<small class="text-muted">${q.language}</small>` : ''}
            </a>`;
        });
        allQuizzesListHtml += '</div>';

        // 2. Generate Category Specific Pages
        const catMainDir = path.join(distDir, 'category');
        fs.mkdirSync(catMainDir, { recursive: true });
        
        let categoryCardsHtml = '<div class="row g-4">';

        for (const [categoryName, quizzes] of Object.entries(categoriesMap)) {
            const safeCatName = categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            const specificCatDir = path.join(catMainDir, safeCatName);
            fs.mkdirSync(specificCatDir, { recursive: true });

            let catQuizzesHtml = `
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h2 class="fw-bold">${categoryName} Quizzes</h2>
                    <span class="badge bg-secondary fs-6">${quizzes.length} Questions</span>
                </div>
                <div class="list-group shadow-sm">`;
            
            quizzes.forEach(q => {
                catQuizzesHtml += `<a href="../../quiz/${q.quizId}/index.html" class="list-group-item list-group-item-action py-3">${q.question}</a>`;
            });
            catQuizzesHtml += '</div>';

            fs.writeFileSync(path.join(specificCatDir, 'index.html'), getHtmlShell(`${categoryName} Quizzes`, catQuizzesHtml, 2));

            categoryCardsHtml += `
                <div class="col-md-6 col-lg-4">
                    <div class="card shadow-sm h-100 border-0">
                        <div class="card-body text-center p-4">
                            <h3 class="card-title h5 fw-bold mb-3">${categoryName}</h3>
                            <p class="text-muted mb-4">${quizzes.length} Quizzes Available</p>
                            <a href="../category/${safeCatName}/index.html" class="btn btn-outline-primary w-100">Browse Category</a>
                        </div>
                    </div>
                </div>
            `;
        }
        categoryCardsHtml += '</div>';

        // 3. Generate "All Categories" Page
        const categoriesDir = path.join(distDir, 'categories');
        fs.mkdirSync(categoriesDir, { recursive: true });
        fs.writeFileSync(path.join(categoriesDir, 'index.html'), getHtmlShell('All Categories', `<h2 class="mb-4 fw-bold">Explore Categories</h2>${categoryCardsHtml}`, 1));

        // 4. Generate About Page
        const aboutDir = path.join(distDir, 'about');
        fs.mkdirSync(aboutDir, { recursive: true });
        const aboutContent = `
            <div class="bg-white p-5 rounded shadow-sm">
                <h2 class="fw-bold text-primary">About Wedugo Education</h2>
                <hr class="mb-4"/>
                <p class="lead">Welcome to Wedugo Education, your premier destination for practicing and mastering new subjects.</p>
                <p>This platform provides high-quality, interactive quiz formats to help students and professionals prepare for technical exams and general knowledge assessments.</p>
            </div>
        `;
        fs.writeFileSync(path.join(aboutDir, 'index.html'), getHtmlShell('About Us', aboutContent, 1));

        // 5. Generate Home Page
        const homeContent = `
            <div class="text-center py-5 mb-5 bg-white rounded shadow-sm">
                <h1 class="display-4 fw-bold text-primary mb-3">Welcome to Wedugo</h1>
                <p class="col-md-8 mx-auto lead text-muted mb-4">Test your knowledge across various categories. Find mock tests, practice sets, and detailed explanations.</p>
                <a href="./categories/index.html" class="btn btn-primary btn-lg px-5 shadow">Browse Categories</a>
            </div>
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h3 class="fw-bold mb-0">Latest Quizzes</h3>
            </div>
            <div class="shadow-sm rounded bg-white">
                ${allQuizzesListHtml}
            </div>
        `;
        fs.writeFileSync(path.join(distDir, 'index.html'), getHtmlShell('Home', homeContent, 0));

        console.log(`Success! Site built with exact schema mappings.`);
    } catch (error) {
        console.error("Build failed:", error);
    }
}

buildWedugoQuizSite();
