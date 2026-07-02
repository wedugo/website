const fs = require('fs');
const path = require('path');

const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQSnJP6ImRuS24j_tOTKA_i1QG_K-DKutrWxjjSbi4WszrZxR90g_1uNaXQqOjnxR2tX9flEFXy7qfY/pub?gid=0&single=true&output=csv";

// OFFICIAL CATEGORY LIST
const CATEGORY_LIST = [
    "Indian Geography","World Organisations","Inventions","Physics","Indian Economy","Days and Years","Technology","Chemistry","Honours and Awards","General Science","General Knowledge","Reasoning","Civil Engineering","Hindi","Sports","Computer","Biology","World Geography","Famous Personalities","Aptitude","Madhya Pradesh GK","Solar System","English","Series","Average","Sets","Percentage","Simple Interest","Surds and Indices","Ratio and Proportion","Time and Work","Trains Time","Age","Area","Profit and Loss","Calendar","Simplification","Indian Polity and Constitution","Indian History","World History","History","Environmental Science and Ecology","Blood Relation","Biochemistry","Fats and Fatty Acid Metabolism","Vitamins","Enzymes","Mineral Metabolism","Hormone Metabolism","Distance and Direction","Nucleic Acids","Water and Electrolyte Balance","History of Microbiology","Microbiology","Bacteria and Gram Staining","Agriculture","Solid Mechanics","Child Development and Pedagogy","Virus","Pharmacology","Anatomy","Psychology","Indian General Knowledge"
];

const QUESTIONS_PER_PAGE = 10;

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

// HELPER: Chunk array into smaller arrays (for Practice Sets)
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

function getFooter(depth) {
    const prefix = depth === 0 ? '.' : '../'.repeat(depth).slice(0, -1);
    return `
    <footer class="bg-dark text-light py-5 mt-5">
        <div class="container">
            <div class="row mb-4">
                <div class="col-md-6">
                    <h5 class="fw-bold mb-3">Wedugo Education</h5>
                    <p class="text-secondary small">Comprehensive preparation materials for state-level recruitment, lab technician profiles, hospital assistant exams, and general knowledge assessments. Practice daily to improve your speed and accuracy.</p>
                </div>
            </div>
            <div class="border-top border-secondary pt-4 text-center">
                <p class="mb-2 small">&copy; ${new Date().getFullYear()} Wedugo Education. All rights reserved.</p>
                <div class="d-flex justify-content-center gap-3 small">
                    <a href="${prefix}/privacy/index.html" class="text-secondary text-decoration-none hover-underline">Privacy Policy</a>
                    <a href="${prefix}/terms/index.html" class="text-secondary text-decoration-none hover-underline">Terms of Service</a>
                    <a href="${prefix}/contact/index.html" class="text-secondary text-decoration-none hover-underline">Contact Us</a>
                </div>
            </div>
        </div>
    </footer>`;
}

function getHtmlShell(title, content, depth, seoDescription = "") {
    const cleanDesc = (seoDescription || 'Practice high-quality exam preparation questions and mock tests on Wedugo Education.').replace(/"/g, '&quot;').substring(0, 160);
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-23NQJXPC86"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-23NQJXPC86');
    </script>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} | Wedugo Education</title>
    <meta name="description" content="${cleanDesc}">
    <link rel="icon" href="https://www.wedugo.com/main_images/icon.png" type="image/png">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5947676189341600" crossorigin="anonymous"></script>
    
    <style>
        body { background-color: #f4f7f6; font-family: 'Segoe UI', Tahoma, Geneva, sans-serif; color: #333; display: flex; flex-direction: column; min-height: 100vh; }
        main { flex: 1; }
        .card { border: none; border-radius: 12px; transition: transform 0.2s, box-shadow 0.2s; }
        .card-hover:hover { transform: translateY(-4px); box-shadow: 0 12px 24px rgba(0,0,0,0.08) !important; }
        .option-btn { text-align: left; padding: 12px 20px; font-weight: 500; font-size: 1rem; border-radius: 8px; border: 2px solid #e9ecef; background: #fff; transition: all 0.2s ease; color: #495057; }
        .option-btn:hover:not(:disabled) { background-color: #f8f9fa; border-color: #dee2e6; transform: translateX(4px); }
        .option-btn:disabled { opacity: 1; cursor: default; }
        .ad-container { min-height: 100px; background: #fff; border: 1px dashed #ced4da; margin: 24px 0; border-radius: 8px; overflow: hidden; text-align: center; }
        .hover-underline:hover { text-decoration: underline !important; }
    </style>
</head>
<body>
    ${getNavbar(depth)}
    <main class="container pb-5">
        ${content}
    </main>
    ${getFooter(depth)}
    
    <script>
        // Global logic for checking answers on Set pages
        function checkAnswer(btnElement, selectedLetter, quizId, correctLetter, aText, bText, cText, dText) {
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
                resultTitle.innerHTML = "❌ Incorrect! Correct Answer: " + correctLetter + ") " + answerTexts[correctLetter];
            }
        }
    </script>
</body>
</html>`;
}

function generateTrustPages(distDir) {
    const pages = [
        { dir: 'privacy', title: 'Privacy Policy', content: '<h1 class="fw-bold mb-4">Privacy Policy</h1><p>At Wedugo Education, your privacy is important to us. This Privacy Policy explains how we collect, use, and protect your personal information when you use our website.</p><h2>Information Collection</h2><p>We do not collect personally identifiable information unless you explicitly provide it to us. Our advertising partners (like Google AdSense) may use cookies to serve personalized ads.</p><h2>Cookies</h2><p>We use standard analytics and advertising cookies to improve user experience.</p>' },
        { dir: 'terms', title: 'Terms of Service', content: '<h1 class="fw-bold mb-4">Terms of Service</h1><p>Welcome to Wedugo Education. By accessing our website, you agree to these Terms of Service.</p><h2>Use of Content</h2><p>The quiz materials are for informational and preparatory purposes. We strive for accuracy but make no warranties regarding the correctness of every question.</p>' },
        { dir: 'contact', title: 'Contact Us', content: '<h1 class="fw-bold mb-4">Contact Us</h1><p>If you have any questions, suggestions, or concerns regarding our content, feel free to reach out.</p><div class="card p-4 shadow-sm border-0 mt-4"><h5>Email Support</h5><p class="mb-0">Please email us at: <strong>support@wedugo.com</strong></p></div>' }
    ];

    pages.forEach(page => {
        const pageDir = path.join(distDir, page.dir);
        fs.mkdirSync(pageDir, { recursive: true });
        const html = `<div class="row justify-content-center"><div class="col-lg-8 bg-white p-5 rounded-4 shadow-sm">${page.content}</div></div>`;
        fs.writeFileSync(path.join(pageDir, 'index.html'), getHtmlShell(page.title, html, 1));
    });
}

async function buildWedugoQuizSite() {
    try {
        const response = await fetch(SHEET_CSV_URL);
        const csvText = await response.text();
        const lines = csvText.trim().split(/\r?\n/);
        
        const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase());
        const rows = lines.slice(1).reverse(); 

        const distDir = path.join(__dirname, 'public');
        if (fs.existsSync(distDir)) fs.rmSync(distDir, { recursive: true });
        fs.mkdirSync(distDir);
        generateTrustPages(distDir);

        const categoriesMap = {};
        CATEGORY_LIST.forEach(cat => categoriesMap[cat] = []);
        categoriesMap['Uncategorized'] = [];

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

            q.quizId = q.id || (rows.length - index);
            categoriesMap[matchedCat].push(q);
        });

        const catMainDir = path.join(distDir, 'category');
        fs.mkdirSync(catMainDir, { recursive: true });
        
        let categoriesGridHtml = '<div class="row g-4">';
        let allLatestSets = []; // Store links to latest practice sets for homepage

        for (const [cat, quizzes] of Object.entries(categoriesMap)) {
            if (!quizzes || quizzes.length === 0) continue; 
            const safeName = cat.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            const specificCatDir = path.join(catMainDir, safeName);
            fs.mkdirSync(specificCatDir, { recursive: true });

            // Chunk questions into sets of 10
            const sets = chunkArray(quizzes, QUESTIONS_PER_PAGE);
            
            let catPageListHtml = '';

            sets.forEach((setQuizzes, setIndex) => {
                const setNumber = setIndex + 1;
                const setFileName = `set-${setNumber}.html`;
                
                // Add ALL sets to our global list for the homepage
allLatestSets.push({ cat, safeName, setNumber, questionCount: setQuizzes.length });

                // Build the HTML for the 10 questions in this set
                let questionsHtml = '';
                setQuizzes.forEach((q, qIndex) => {
                    const correctLetter = (q.mainanswer || '').toString().replace(/[^A-D]/gi, '').toUpperCase();
                    const escape = str => (str || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
                    
                    questionsHtml += `
                        <div class="card shadow-sm p-4 mb-4 bg-white border-0" id="quiz-block-${q.quizId}">
                            <div class="d-flex mb-3">
                                <span class="badge bg-secondary me-2">Q${(setIndex * QUESTIONS_PER_PAGE) + qIndex + 1}</span>
                                <h3 class="h5 fw-bold text-dark mb-0 lh-base">${q.question}</h3>
                            </div>
                            <div class="d-grid gap-2 ps-md-4">
                                <button class="btn option-btn" onclick="checkAnswer(this, 'A', '${q.quizId}', '${correctLetter}', '${escape(q.answer1)}', '${escape(q.answer2)}', '${escape(q.answer3)}', '${escape(q.answer4)}')">A) ${q.answer1}</button>
                                <button class="btn option-btn" onclick="checkAnswer(this, 'B', '${q.quizId}', '${correctLetter}', '${escape(q.answer1)}', '${escape(q.answer2)}', '${escape(q.answer3)}', '${escape(q.answer4)}')">B) ${q.answer2}</button>
                                <button class="btn option-btn" onclick="checkAnswer(this, 'C', '${q.quizId}', '${correctLetter}', '${escape(q.answer1)}', '${escape(q.answer2)}', '${escape(q.answer3)}', '${escape(q.answer4)}')">C) ${q.answer3}</button>
                                <button class="btn option-btn" onclick="checkAnswer(this, 'D', '${q.quizId}', '${correctLetter}', '${escape(q.answer1)}', '${escape(q.answer2)}', '${escape(q.answer3)}', '${escape(q.answer4)}')">D) ${q.answer4}</button>
                            </div>
                            <div id="explanation-${q.quizId}" class="alert mt-3 d-none ms-md-4">
                                <h6 class="alert-heading fw-bold mb-1" id="result-title-${q.quizId}"></h6>
                                <p class="mb-0 small text-dark border-top border-dark-subtle pt-2 mt-2"><strong>Explanation:</strong> ${q.answerdetail || 'Consistent practice is key to mastering this topic.'}</p>
                            </div>
                        </div>
                    `;
                });

                // AdSense Block
                const adHtml = `
                    <div class="ad-container text-muted small">
                        <ins class="adsbygoogle" style="display:block; width:100%;" data-ad-client="ca-pub-5947676189341600" data-ad-format="auto" data-full-width-responsive="true"></ins>
                        <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
                    </div>`;

                const prevBtn = setIndex > 0 ? `<a href="set-${setNumber - 1}.html" class="btn btn-outline-secondary">&larr; Previous Set</a>` : '';
                const nextBtn = setIndex < sets.length - 1 ? `<a href="set-${setNumber + 1}.html" class="btn btn-primary">Next Set &rarr;</a>` : '';

                const setPageContent = `
                    <div class="row justify-content-center">
                        <div class="col-lg-8">
                            <nav aria-label="breadcrumb" class="mb-4">
                                <ol class="breadcrumb bg-white p-3 shadow-sm rounded-3">
                                    <li class="breadcrumb-item"><a href="../../index.html">Home</a></li>
                                    <li class="breadcrumb-item"><a href="index.html">${cat}</a></li>
                                    <li class="breadcrumb-item active" aria-current="page">Practice Set ${setNumber}</li>
                                </ol>
                            </nav>
                            
                            <div class="mb-4 p-4 bg-primary bg-opacity-10 rounded-4">
                                <h1 class="h3 fw-bold text-primary mb-2">${cat} - Practice Set ${setNumber}</h1>
                                <p class="text-muted mb-0">Test your knowledge with these ${setQuizzes.length} targeted questions. Select an option to instantly view the correct answer and detailed explanation.</p>
                            </div>
                            
                            ${adHtml}
                            ${questionsHtml}
                            ${adHtml}
                            
                            <div class="d-flex justify-content-between mt-4 border-top pt-4">
                                <div>${prevBtn}</div>
                                <div>${nextBtn}</div>
                            </div>
                        </div>
                    </div>
                `;

                fs.writeFileSync(path.join(specificCatDir, setFileName), getHtmlShell(`${cat} Practice Set ${setNumber}`, setPageContent, 2));

                // Add link to Category Index list
                catPageListHtml += `
                    <a href="${setFileName}" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center py-3">
                        <span class="text-dark fw-medium">Practice Set ${setNumber}</span>
                        <span class="badge bg-primary rounded-pill">${setQuizzes.length} Qs</span>
                    </a>
                `;
            });

            // Build Category Master Page
            if (CATEGORY_LIST.includes(cat)) {
                let catPageContent = `
                    <div class="mb-4">
                        <h2 class="fw-bold mb-2">${cat} Mock Tests</h2>
                        <p class="text-muted">Browse our complete collection of ${cat} practice sets. Each set contains carefully curated multiple-choice questions for comprehensive exam preparation.</p>
                    </div>
                    <div class="card shadow-sm border-0 mb-5">
                        <div class="list-group list-group-flush">
                            ${catPageListHtml}
                        </div>
                    </div>
                `;
                fs.writeFileSync(path.join(specificCatDir, 'index.html'), getHtmlShell(`${cat} Quizzes`, catPageContent, 2));

                categoriesGridHtml += `
                    <div class="col-md-6 col-lg-4">
                        <div class="card shadow-sm h-100 card-hover border-0">
                            <div class="card-body p-4 text-center d-flex flex-column justify-content-center">
                                <h3 class="h5 fw-bold mb-2 text-dark">${cat}</h3>
                                <p class="text-muted small mb-4">${sets.length} Practice Sets</p>
                                <a href="../category/${safeName}/index.html" class="btn btn-outline-primary mt-auto w-100 fw-medium">Start Practicing</a>
                            </div>
                        </div>
                    </div>
                `;
            }
        }
        categoriesGridHtml += '</div>';

        const categoriesDir = path.join(distDir, 'categories');
        fs.mkdirSync(categoriesDir, { recursive: true });
        fs.writeFileSync(path.join(categoriesDir, 'index.html'), getHtmlShell('All Categories', `<div class="mb-5"><h2 class="fw-bold mb-4">Explore Knowledge Topics</h2>${categoriesGridHtml}</div>`, 1));

        // Generate Home Page
        let latestSetsHtml = '<div class="row g-3 mb-5">';
        allLatestSets.slice(0, 12).forEach(set => {
            latestSetsHtml += `
                <div class="col-md-6 col-lg-4">
                    <a href="./category/${set.safeName}/set-${set.setNumber}.html" class="text-decoration-none">
                        <div class="card shadow-sm border-0 h-100 card-hover bg-white">
                            <div class="card-body p-4">
                                <span class="badge bg-primary bg-opacity-10 text-primary border border-primary-subtle rounded-pill mb-3">${set.cat}</span>
                                <h4 class="h6 fw-bold text-dark mb-1">Practice Set ${set.setNumber}</h4>
                                <small class="text-muted">${set.questionCount} Questions</small>
                            </div>
                        </div>
                    </a>
                </div>
            `;
        });
        latestSetsHtml += '</div>';

        const homeContent = `
            <div class="text-center py-5 mb-5 bg-white rounded-4 shadow-sm border-0 px-3">
                <h1 class="display-5 fw-bold text-dark mb-3">Welcome to Wedugo Education</h1>
                <p class="col-md-8 mx-auto lead text-muted mb-4">Your ultimate resource for state-level examinations and competitive testing. Challenge yourself with high-quality practice sets, mock tests, and detailed explanations.</p>
                <a href="./categories/index.html" class="btn btn-primary btn-lg px-5 shadow-sm fw-medium rounded-pill">Explore All Categories</a>
            </div>
            
            <div class="d-flex justify-content-between align-items-end mb-4">
                <h3 class="fw-bold mb-0 text-dark">Latest Practice Sets</h3>
                <a href="./categories/index.html" class="text-primary text-decoration-none fw-medium">View All <span aria-hidden="true">&rarr;</span></a>
            </div>
            
            ${latestSetsHtml}

            <!-- Added SEO Content for Homepage to thicken word count -->
            <div class="card shadow-sm border-0 bg-white p-5 mt-5">
                <h2 class="h4 fw-bold mb-3">Why Practice with Wedugo?</h2>
                <p class="text-muted">Success in competitive exams requires consistent practice and a deep understanding of core concepts. Wedugo Education is designed to simulate real exam environments with our comprehensive question banks. Whether you are preparing for technical roles, administrative exams, or brushing up on general knowledge, our structured practice sets ensure you are always test-ready.</p>
                <p class="text-muted mb-0">Our platform features instant feedback. As soon as you select an answer, you receive immediate validation along with detailed explanations to help reinforce your learning and correct misconceptions on the spot.</p>
            </div>
        `;
       
        fs.writeFileSync(path.join(distDir, 'index.html'), getHtmlShell('Home', homeContent, 0));

        // Copy static files
        const staticFiles = ['Ads.txt','robots.txt', 'CNAME', '404.html'];
        staticFiles.forEach(file => {
            const sourcePath = path.join(__dirname, file);
            const targetName = file === 'Ads.txt' ? 'ads.txt' : file; 
            if (fs.existsSync(sourcePath)) { fs.copyFileSync(sourcePath, path.join(distDir, targetName)); }
        });

        console.log("Success! Rebuilt site with Practice Sets (10 questions per page) for AdSense compliance.");
    } catch (error) {
        console.error("Build failed:", error);
    }
}

buildWedugoQuizSite();
