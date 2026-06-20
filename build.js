const fs = require('fs');
const path = require('path');

const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQSnJP6ImRuS24j_tOTKA_i1QG_K-DKutrWxjjSbi4WszrZxR90g_1uNaXQqOjnxR2tX9flEFXy7qfY/pub?gid=0&single=true&output=csv";

// IMPORTANT: Put your custom domain here
const SITE_BASE_URL = "https://www.wedugo.com"; 

// Helper for Navigation (Now includes your custom icon)
function getNavbar(depth) {
    const prefix = depth === 0 ? '.' : '../'.repeat(depth).slice(0, -1);
    return `
    <nav class="navbar navbar-expand-lg navbar-dark bg-primary mb-4 shadow-sm">
        <div class="container">
            <a class="navbar-brand fw-bold d-flex align-items-center" href="${prefix}/index.html">
                
                Wedugo Education
            </a>
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

// Helper for HTML Shell (Added Favicon and ShareThis, Removed Facebook)
function getHtmlShell(title, content, depth, seoDescription = "", pageUrl = "") {
    const cleanDescription = (seoDescription || 'Practice high-quality exam preparation questions and mock tests on Wedugo Education.').replace(/"/g, '&quot;').substring(0, 160);

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    
    <title>${title} | Wedugo Education</title>
    <meta name="description" content="${cleanDescription}">
    <meta name="robots" content="index, follow">
    
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${cleanDescription}">
    <meta property="og:type" content="website">
    ${pageUrl ? `<meta property="og:url" content="${pageUrl}">` : ''}

    <link rel="icon" href="https://www.wedugo.com/main_images/icon.png" type="image/png">

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

            const isCorrupted = /[\u0080-\uFFFF]/.test(JSON.stringify(q));
            if (isCorrupted && q.question && q.question.includes('à¤')) {
                console.log("Skipping corrupted row:", q.id);
                return; // Skips this row and goes to the next one
            }


            const quizId = q.id || (rows.length - index);
			
            const category = q.qcategory || 'Uncategorized';
            const uniquePageUrl = `${SITE_BASE_URL}/quiz/${quizId}/index.html`;

            if (!categoriesMap[category]) categoriesMap[category] = [];
            categoriesMap[category].push({ ...q, quizId });

            const quizDir = path.join(distDir, 'quiz', String(quizId));
            fs.mkdirSync(quizDir, { recursive: true });

            const imageHtml = q.questionurl ? `<img src="${q.questionurl}" class="img-fluid rounded mb-4 shadow-sm" alt="Question Resource">` : '';
            const langBadge = q.language ? `<span class="badge bg-info text-dark ms-2">${q.language}</span>` : '';

            const quizContent = `
                <div class="row g-4 justify-content-center">
                    <div class="col-lg-8">
                        
                        <div class="ad-container text-center mb-4">
                            <ins class="adsbygoogle"
                                 style="display:block"
                                 data-ad-client="ca-pub-5947676189341600"
                                 data-ad-slot="YOUR_TOP_AD_SLOT_ID"
                                 data-ad-format="auto"
                                 data-full-width-responsive="true"></ins>
                            <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
                        </div>

                        <div class="card shadow-sm p-4 p-md-5 mb-4 bg-white">
                            <div class="d-flex justify-content-between align-items-center mb-4">
                                <div><span class="badge bg-primary px-3 py-2 fs-7">${category}</span>${langBadge}</div>
                                <small class="text-muted fw-bold">Question ID: ${q.que_id || quizId}</small>
                            </div>
                            
                            ${imageHtml}
                            
                            <h1 class="h3 mb-3 fw-bold text-dark lh-base">${q.question}</h1>
                            <p class="text-muted small border-bottom pb-3 mb-4">Uploaded by expert: <span class="text-dark fw-semibold">${q.postby || 'Wedugo Admin'}</span></p>

                            <div class="d-grid gap-3 mb-2" id="options-container">
                                <button class="btn option-btn shadow-sm" onclick="checkAnswer(this, 'A')">A) ${q.answer1}</button>
                                <button class="btn option-btn shadow-sm" onclick="checkAnswer(this, 'B')">B) ${q.answer2}</button>
                                <button class="btn option-btn shadow-sm" onclick="checkAnswer(this, 'C')">C) ${q.answer3}</button>
                                <button class="btn option-btn shadow-sm" onclick="checkAnswer(this, 'D')">D) ${q.answer4}</button>
                            </div>

                            <div id="explanation-box" class="alert mt-4 d-none border-2">
                                <h4 class="alert-heading fw-bold mb-2" id="result-title"></h4>
                                <div class="fs-6 py-2 border-top">
                                    <p class="mb-0 text-dark"><strong>Explanation:</strong> ${q.answerdetail || 'No further reference explanation needed for this problem.'}</p>
                                </div>
                            </div>
                        </div>

                        <div class="ad-container text-center mb-4">
                            <ins class="adsbygoogle"
                                 style="display:block"
                                 data-ad-client="ca-pub-5947676189341600"
                                 data-ad-slot="YOUR_BOTTOM_AD_SLOT_ID"
                                 data-ad-format="auto"
                                 data-full-width-responsive="true"></ins>
                            <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
                        </div>

                        <div class="card shadow-sm p-4 bg-white text-center">
                            <h3 class="h5 fw-bold text-dark mb-3 border-bottom pb-2">Share your reaction</h3>
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
                        explanationBox.classList.remove('d-none');
                        
                        if(selectedLetter === correctLetter) {
                            btnElement.style.borderColor = "#198754";
                            btnElement.style.backgroundColor = "#e8f5e9";
                            explanationBox.classList.add('alert-success', 'border-success');
                            resultTitle.innerHTML = "✨ Correct Answer!";
                        } else {
                            btnElement.style.borderColor = "#dc3545";
                            btnElement.style.backgroundColor = "#fde8e8";
                            explanationBox.classList.add('alert-danger', 'border-danger');
                            resultTitle.innerHTML = "❌ Incorrect! The right answer was: " + correctLetter + ") " + answerTexts[correctLetter];
                        }
                    }
                </script>
            `;
            
            const metaDescription = `${q.question} Check the correct answer and detailed explanation on Wedugo Education.`;
            fs.writeFileSync(path.join(quizDir, 'index.html'), getHtmlShell(`Quiz: ${q.question.substring(0,40)}...`, quizContent, 2, metaDescription, uniquePageUrl));

            allQuizzesListHtml += `<a href="./quiz/${quizId}/index.html" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
                <div>
                    <span class="badge bg-primary rounded-pill me-2">${category}</span> 
                    ${q.question}
                </div>
                ${q.language ? `<small class="text-muted">${q.language}</small>` : ''}
            </a>`;
        });
        allQuizzesListHtml += '</div>';

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

            fs.writeFileSync(path.join(specificCatDir, 'index.html'), getHtmlShell(`${categoryName} Quizzes`, catQuizzesHtml, 2, `Explore ${quizzes.length} practice questions in the ${categoryName} category.`));

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

        const categoriesDir = path.join(distDir, 'categories');
        fs.mkdirSync(categoriesDir, { recursive: true });
        fs.writeFileSync(path.join(categoriesDir, 'index.html'), getHtmlShell('All Categories', `<h2 class="mb-4 fw-bold">Explore Categories</h2>${categoryCardsHtml}`, 1, "Browse all quiz and test categories available on Wedugo Education."));

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
        fs.writeFileSync(path.join(aboutDir, 'index.html'), getHtmlShell('About Us', aboutContent, 1, "Learn more about Wedugo Education and our mission to provide high-quality practice exams."));

        
		// 5. Generate Home Page
        // Use slice(0, 20) to only grab the most recent 20 items from the reversed list
        const latestQuizzesHtml = allQuizzesListHtml.split('</a>').slice(0, 20).join('</a>') + '</a>';

        const homeContent = `
            <div class="text-center py-5 mb-5 bg-white rounded shadow-sm">
                <h1 class="display-4 fw-bold text-primary mb-3">Welcome to Wedugo</h1>
                <p class="col-md-8 mx-auto lead text-muted mb-4">Test your knowledge across various categories. Find mock tests, practice sets, and detailed explanations.</p>
                <a href="./categories/index.html" class="btn btn-primary btn-lg px-5 shadow">Browse All Categories</a>
            </div>
            
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h3 class="fw-bold mb-0">Latest 20 Quizzes</h3>
                <a href="./categories/index.html" class="text-decoration-none">View All</a>
            </div>
            
            <div class="shadow-sm rounded bg-white">
                ${latestQuizzesHtml}
            </div>
            
            <div class="text-center mt-4">
                <a href="./categories/index.html" class="btn btn-outline-secondary">See More Quizzes in Categories</a>
            </div>
        `;
		
        fs.writeFileSync(path.join(distDir, 'index.html'), getHtmlShell('Home', homeContent, 0, "Welcome to Wedugo Education. Find mock tests, practice sets, and detailed explanations across various technical subjects."));

        console.log(`Success! Site built with exact schema mappings.`);
    } catch (error) {
        console.error("Build failed:", error);
    }
}

buildWedugoQuizSite();
