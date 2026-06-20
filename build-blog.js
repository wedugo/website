const fs = require('fs');
const path = require('path');

// REPLACE THIS WITH YOUR NEW BLOG GOOGLE SHEET CSV URL
const BLOG_SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQrpdugY1OXmb7Pzer-sjOixONsm2wix3Xg29fl6WGVEaNmvL_U0aKv21RKpZRtedHHpqp4l7C-Mk7m/pub?output=csv";
const SITE_BASE_URL = "https://www.wedugo.com/blog"; 

const POSTS_PER_PAGE = 10;

// UPGRADED ADVANCED CSV PARSER (Handles multi-line HTML cells perfectly)
function parseFullCSV(text) {
    const rows = [];
    let curRow = [];
    let curCell = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const nextChar = text[i + 1];

        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                curCell += '"'; // Escaped quote
                i++; // Skip the next quote
            } else {
                inQuotes = !inQuotes; // Toggle quote state
            }
        } else if (char === ',' && !inQuotes) {
            curRow.push(curCell.trim());
            curCell = '';
        } else if ((char === '\n' || char === '\r') && !inQuotes) {
            // End of row
            if (char === '\r' && nextChar === '\n') i++; // Handle Windows newlines
            curRow.push(curCell.trim());
            if (curRow.join('').length > 0) rows.push(curRow);
            curRow = [];
            curCell = '';
        } else {
            curCell += char;
        }
    }
    // Push the very last cell/row if it didn't end with a newline
    if (curCell || curRow.length > 0) {
        curRow.push(curCell.trim());
        if (curRow.join('').length > 0) rows.push(curRow);
    }
    return rows;
}

// HELPER: Blog Navbar
function getBlogNavbar(depth) {
    const prefix = depth === 0 ? '.' : '../'.repeat(depth).slice(0, -1);
    const mainSite = depth === 0 ? '..' : '../'.repeat(depth + 1).slice(0, -1);
    
    return `
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark mb-4 shadow-sm">
        <div class="container">
            <a class="navbar-brand fw-bold fs-4 text-white" href="${prefix}/index.html">Wedugo Blog</a>
            <button class="navbar-toggler border-0" type="button" data-bs-toggle="collapse" data-bs-target="#blogNav">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="blogNav">
                <ul class="navbar-nav ms-auto fw-medium">
                    <li class="nav-item"><a class="nav-link px-3 text-light" href="${mainSite}/index.html">&larr; Back to Quizzes</a></li>
                    <li class="nav-item"><a class="nav-link px-3 text-white" href="${prefix}/index.html">Blog Home</a></li>
                    <li class="nav-item"><a class="nav-link px-3 text-white" href="${prefix}/page/1/index.html">All Posts</a></li>
                    <li class="nav-item"><a class="nav-link px-3 text-white" href="${prefix}/categories/index.html">Topics</a></li>
                </ul>
            </div>
        </div>
    </nav>`;
}

// HELPER: Blog HTML Shell
function getBlogHtmlShell(title, content, depth, seoDescription = "") {
    const cleanDesc = (seoDescription || 'Read the latest educational articles, exam updates, and study materials on the Wedugo Education Blog.').replace(/"/g, '&quot;').substring(0, 160);
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
    <title>${title} | Wedugo Blog</title>
    <meta name="description" content="${cleanDesc}">
    <link rel="icon" href="https://www.wedugo.com/main_images/icon.png" type="image/png">
    
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5947676189341600" crossorigin="anonymous"></script>
    <script type='text/javascript' src='https://platform-api.sharethis.com/js/sharethis.js#property=5c5059d8c9830d001319b017&product=inline-share-buttons' async='async'></script>
    
    <style>
        body { background-color: #fcfcfc; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; line-height: 1.6; }
        .blog-card { border: 1px solid #eaeaea; border-radius: 12px; transition: transform 0.2s, box-shadow 0.2s; background: #fff; }
        .blog-card:hover { transform: translateY(-3px); box-shadow: 0 10px 20px rgba(0,0,0,0.05); }
        .article-content { font-size: 1.1rem; color: #444; }
        .article-content img { max-width: 100%; height: auto; border-radius: 8px; margin: 20px 0; }
        .ad-container { min-height: 100px; background: #fff; border: 1px dashed #ced4da; margin-bottom: 24px; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
        .badge-cat { font-size: 0.85rem; padding: 0.5em 0.9em; letter-spacing: 0.5px; }
    </style>
</head>
<body>
    ${getBlogNavbar(depth)}
    <div class="container pb-5">
        ${content}
    </div>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>`;
}

async function buildBlogSite() {
    try {
        console.log("Fetching Blog Data...");
        const response = await fetch(BLOG_SHEET_CSV_URL);
        const csvText = await response.text();
        
        // Use the new parser
        const allParsedRows = parseFullCSV(csvText);
        
        const headers = allParsedRows[0].map(h => h.toLowerCase());
        const rowsToProcess = allParsedRows.slice(1).reverse(); // Latest first

        const distDir = path.join(__dirname, 'public', 'blog');
        if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true });

        const posts = [];
        const categoriesMap = {};

        // 1. Process Data
        rowsToProcess.forEach((values, index) => {
            if (values.length < headers.length) return; 

            const post = {};
            headers.forEach((h, i) => post[h] = values[i]);
            
            if (!post.title || !post.content) return; // Skip empty rows

            post.postId = post.id || String(rowsToProcess.length - index);
            post.cat = post.category || 'General';

            let rawUrl = post.url || post.slug || post.title || post.postId;
            post.urlSlug = rawUrl.toString().trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
            
            if (!categoriesMap[post.cat]) categoriesMap[post.cat] = [];
            categoriesMap[post.cat].push(post);
            posts.push(post);
        });

        // 2. Generate Individual Article Pages
        const postMainDir = path.join(distDir, 'post');
        fs.mkdirSync(postMainDir, { recursive: true });

        posts.forEach((post) => {
            const postDir = path.join(postMainDir, post.urlSlug);
            fs.mkdirSync(postDir, { recursive: true });

            const articleContent = `
                <div class="row justify-content-center">
                    <div class="col-lg-8">
                        <div class="mb-4 text-center">
                            <span class="badge bg-dark badge-cat mb-3">${post.cat}</span>
                            <h1 class="fw-bold text-dark display-6 lh-sm mb-3">${post.title}</h1>
                            <p class="text-muted mb-0">By <span class="fw-semibold text-dark">${post.author || 'Wedugo Team'}</span> &bull; ${post.date || 'Recently Updated'}</p>
                        </div>
                        
                        <div class="ad-container text-muted small">
                            <ins class="adsbygoogle" style="display:block" data-ad-client="ca-pub-5947676189341600" data-ad-format="auto" data-full-width-responsive="true"></ins>
                            <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
                        </div>

                        <div class="blog-card p-4 p-md-5 mb-5">
                            <div class="article-content">
                                ${post.content}
                            </div>
                        </div>

                        <div class="card shadow-sm p-4 bg-white text-center mb-4 border-0">
                            <h3 class="h6 fw-bold text-secondary text-uppercase mb-3">Share this Article</h3>
                            <div class="sharethis-inline-reaction-buttons"></div>
                        </div>
                    </div>
                </div>
            `;
            fs.writeFileSync(path.join(postDir, 'index.html'), getBlogHtmlShell(post.title, articleContent, 2, post.seo_description || post.title));
        });

        // 3. Generate Paginated "All Posts" Pages
        const totalPages = Math.ceil(posts.length / POSTS_PER_PAGE);
        const pageMainDir = path.join(distDir, 'page');
        fs.mkdirSync(pageMainDir, { recursive: true });

        for (let i = 1; i <= totalPages; i++) {
            const pageDir = path.join(pageMainDir, String(i));
            fs.mkdirSync(pageDir, { recursive: true });

            const startIndex = (i - 1) * POSTS_PER_PAGE;
            const pagePosts = posts.slice(startIndex, startIndex + POSTS_PER_PAGE);

            let pageContent = `<h2 class="fw-bold mb-4">All Articles (Page ${i} of ${totalPages})</h2><div class="row g-4 mb-5">`;
            
            pagePosts.forEach(post => {
                pageContent += `
                    <div class="col-md-6">
                        <div class="blog-card h-100 p-4">
                            <span class="badge bg-secondary mb-2">${post.cat}</span>
                            <h3 class="h5 fw-bold mb-3"><a href="../../post/${post.urlSlug}/index.html" class="text-dark text-decoration-none">${post.title}</a></h3>
                            <p class="text-muted small mb-0">${post.date || ''}</p>
                        </div>
                    </div>
                `;
            });
            pageContent += `</div>`;

            pageContent += `<nav><ul class="pagination justify-content-center">`;
            if (i > 1) pageContent += `<li class="page-item"><a class="page-link" href="../${i - 1}/index.html">Previous</a></li>`;
            for (let p = 1; p <= totalPages; p++) {
                pageContent += `<li class="page-item ${p === i ? 'active' : ''}"><a class="page-link" href="../${p}/index.html">${p}</a></li>`;
            }
            if (i < totalPages) pageContent += `<li class="page-item"><a class="page-link" href="../${i + 1}/index.html">Next</a></li>`;
            pageContent += `</ul></nav>`;

            fs.writeFileSync(path.join(pageDir, 'index.html'), getBlogHtmlShell(`Blog Posts - Page ${i}`, pageContent, 2));
        }

        // 4. Generate Blog Categories Master Page
        const categoriesDir = path.join(distDir, 'categories');
        fs.mkdirSync(categoriesDir, { recursive: true });
        let catGridHtml = '<div class="row g-4">';
        
        for (const [catName, catPosts] of Object.entries(categoriesMap)) {
            const safeName = catName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            const specificCatDir = path.join(categoriesDir, safeName);
            fs.mkdirSync(specificCatDir, { recursive: true });

            let catPageHtml = `<h2 class="fw-bold mb-4">Articles in "${catName}"</h2><div class="list-group shadow-sm mb-5">`;
            catPosts.forEach(post => {
                catPageHtml += `<a href="../../post/${post.urlSlug}/index.html" class="list-group-item list-group-item-action py-3"><h5 class="mb-1 fw-bold">${post.title}</h5><small class="text-muted">${post.date || ''}</small></a>`;
            });
            catPageHtml += '</div>';
            fs.writeFileSync(path.join(specificCatDir, 'index.html'), getBlogHtmlShell(`${catName} Articles`, catPageHtml, 3));

            catGridHtml += `
                <div class="col-md-4">
                    <div class="blog-card text-center p-4 h-100 d-flex flex-column justify-content-center">
                        <h4 class="fw-bold text-dark mb-2">${catName}</h4>
                        <p class="text-muted small mb-3">${catPosts.length} Articles</p>
                        <a href="./${safeName}/index.html" class="btn btn-outline-dark btn-sm mt-auto">Read Topic</a>
                    </div>
                </div>
            `;
        }
        catGridHtml += '</div>';
        fs.writeFileSync(path.join(categoriesDir, 'index.html'), getBlogHtmlShell('Blog Categories', `<h2 class="fw-bold mb-4">Blog Topics</h2>${catGridHtml}`, 1));

        // 5. Generate Blog Homepage (Top 5 ONLY)
        let top5Html = '<div class="list-group shadow-sm border-0 mb-4">';
        posts.slice(0, 5).forEach(post => {
            top5Html += `
                <a href="./post/${post.urlSlug}/index.html" class="list-group-item list-group-item-action p-4 border-bottom">
                    <div class="d-flex w-100 justify-content-between align-items-center mb-2">
                        <h3 class="h5 fw-bold mb-0 text-dark">${post.title}</h3>
                        <small class="text-muted ms-3">${post.date || ''}</small>
                    </div>
                    <span class="badge bg-dark badge-cat">${post.cat}</span>
                </a>
            `;
        });
        top5Html += '</div>';

        const homeContent = `
            <div class="py-5 text-center bg-white border rounded-4 mb-5 shadow-sm">
                <h1 class="display-4 fw-bold text-dark mb-3">Wedugo Blog</h1>
                <p class="lead text-muted col-md-8 mx-auto mb-4">Your source for the latest exam updates, educational strategies, and detailed study materials.</p>
                <a href="./page/1/index.html" class="btn btn-dark btn-lg px-5 rounded-pill shadow-sm">Read All Articles</a>
            </div>
            
            <div class="d-flex justify-content-between align-items-end mb-4">
                <h2 class="fw-bold mb-0">Latest 5 Articles</h2>
                <a href="./page/1/index.html" class="text-dark fw-medium text-decoration-none">View Archive &rarr;</a>
            </div>
            
            ${top5Html}
            
            <div class="text-center mt-4">
                <a href="./categories/index.html" class="btn btn-outline-secondary">Browse by Topic</a>
            </div>
        `;
        
        fs.writeFileSync(path.join(distDir, 'index.html'), getBlogHtmlShell('Wedugo Blog Home', homeContent, 0));
        console.log("Blog Site Built Successfully with Custom URLs!");

    } catch (e) {
        console.error("Blog Build Failed:", e);
    }
}

buildBlogSite();
