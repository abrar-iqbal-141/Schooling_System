const layoutHTML = `
    <div class="navbar">
        <div class="navbar-brand">
            <h1>School Admin Portal</h1>
        </div>
        <div class="navbar-title" id="page-title">Dashboard</div>
        <div class="navbar-status" id="api-status">Checking Status...</div>
    </div>
    <div class="container">
        <div class="sidebar">
            <div class="menu">
                <a href="../Dashboard/index.html" class="menu-item" data-page="dashboard">Dashboard</a>
                <a href="../Overview/index.html" class="menu-item" data-page="overview">Overview</a>
                <a href="../Students/index.html" class="menu-item" data-page="students">Students</a>
                <a href="../Instructors/index.html" class="menu-item" data-page="instructors">Instructors</a>
                <a href="../Departments/index.html" class="menu-item" data-page="departments">Departments</a>
                <a href="../Sections/index.html" class="menu-item" data-page="sections">Sections</a>
                <a href="../Schedule/index.html" class="menu-item" data-page="schedule">Schedule</a>
                <a href="../Courses/index.html" class="menu-item" data-page="courses">Courses</a>
                <a href="../Enrollments/index.html" class="menu-item" data-page="enrollments">Enrollments</a>
            </div>
        </div>
        <div class="main-content" id="main-content">
        </div>
    </div>`;

document.addEventListener("DOMContentLoaded", () => {
    const specificContent = document.getElementById('page-content').innerHTML;
    document.body.innerHTML = layoutHTML;
    document.getElementById('main-content').innerHTML = specificContent;
    
    setTimeout(() => {
        if (typeof showPage === 'function') {
            const pageEl = document.querySelector('.page');
            if (pageEl) showPage(pageEl.id);
        }
        
        const path = window.location.pathname.toLowerCase();
        document.querySelectorAll('.menu-item').forEach(link => {
            const href = link.getAttribute('href').replace('../', '').toLowerCase();
            if(path.includes(href.replace('/index.html', ''))) {
                link.classList.add('active');
                document.getElementById('page-title').textContent = link.textContent;
            }
        });

        if (typeof initPage === 'function') {
            initPage();
        }
    }, 100);
});