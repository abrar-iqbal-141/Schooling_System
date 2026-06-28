const layoutHTML = `
    <div class="navbar">
        <div class="navbar-brand">
            <h1><i class="fa-solid fa-graduation-cap" style="margin-right: 10px;"></i>SZABIST Portal</h1>
        </div>
        <div class="navbar-title" id="page-title">Dashboard</div>
        <div class="navbar-status" id="api-status">Checking Status...</div>
    </div>
    <div class="container">
        <div class="sidebar">
            <div class="menu">
                <a href="../Dashboard/index.html" class="menu-item" data-page="dashboard"><i class="fa-solid fa-chart-line fa-fw" style="margin-right:8px;"></i>Dashboard</a>
                <a href="../Overview/index.html" class="menu-item" data-page="overview"><i class="fa-solid fa-earth-americas fa-fw" style="margin-right:8px;"></i>Overview</a>
                <a href="../Students/index.html" class="menu-item" data-page="students"><i class="fa-solid fa-user-graduate fa-fw" style="margin-right:8px;"></i>Students</a>
                <a href="../Defaulters/index.html" class="menu-item" data-page="defaulters"><i class="fa-solid fa-triangle-exclamation fa-fw" style="margin-right:8px;"></i>Defaulters</a>
                <a href="../Instructors/index.html" class="menu-item" data-page="instructors"><i class="fa-solid fa-chalkboard-user fa-fw" style="margin-right:8px;"></i>Instructors</a>
                <a href="../Departments/index.html" class="menu-item" data-page="departments"><i class="fa-solid fa-building fa-fw" style="margin-right:8px;"></i>Departments</a>
                <a href="../Sections/index.html" class="menu-item" data-page="sections"><i class="fa-solid fa-people-group fa-fw" style="margin-right:8px;"></i>Sections</a>
                <a href="../Schedule/index.html" class="menu-item" data-page="schedule"><i class="fa-regular fa-calendar-days fa-fw" style="margin-right:8px;"></i>Schedule</a>
                <a href="../Courses/index.html" class="menu-item" data-page="courses"><i class="fa-solid fa-book fa-fw" style="margin-right:8px;"></i>Courses</a>
                <a href="../Enrollments/index.html" class="menu-item" data-page="enrollments"><i class="fa-solid fa-clipboard-user fa-fw" style="margin-right:8px;"></i>Enrollments</a>
            </div>
        </div>
        <div class="main-content" id="main-content">
        </div>
    </div>`;

document.addEventListener("DOMContentLoaded", () => {
    if (!document.querySelector('link[href*="font-awesome"]')) {
        const faLink = document.createElement('link');
        faLink.rel = 'stylesheet';
        faLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
        document.head.appendChild(faLink);
    }

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