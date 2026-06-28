const API_BASE = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : '/api';


let appData = {
    students: [],
    instructors: [],
    departments: [],
    courses: [],
    enrollments: [],
    schedules: [],
    sections: []
};
let editState = {
    page: null,
    id: null
};

let searchState = {
    students: '',
    instructors: '',
    departments: '',
    sections: '',
    courses: '',
    enrollments: '',
    schedules: ''
};

async function fetchFromBackend(endpoint) {
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, { headers: {
            'Bypass-Tunnel-Reminder': 'true', 'Bypass-Tunnel-Reminder': 'true' } });
        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Fetch error:', error);
        return [];
    }
}


async function checkApiStatus() {
    const statusEl = document.getElementById('api-status');
    try {
        const response = await fetch(`${API_BASE}/students`, { headers: {
            'Bypass-Tunnel-Reminder': 'true', 'Bypass-Tunnel-Reminder': 'true' } });
        if (response.ok) {
            statusEl.textContent = 'Online';
            statusEl.classList.add('online');
            statusEl.classList.remove('offline');
            return true;
        }
    } catch (error) {
        statusEl.textContent = ' Offline';
        statusEl.classList.add('offline');
        statusEl.classList.remove('online');
        return false;
    }
}


function getStudentFeeStatus(studentId) {
    const raw = localStorage.getItem('school-fee-status');
    if (!raw) return false;
    try {
        const state = JSON.parse(raw);
        return Boolean(state[String(studentId)]);
    } catch (error) {
        console.error('Fee status parse error:', error);
        return false;
    }
}

function setStudentFeeStatus(studentId, paid) {
    const raw = localStorage.getItem('school-fee-status');
    const state = raw ? JSON.parse(raw) : {};
    state[String(studentId)] = Boolean(paid);
    localStorage.setItem('school-fee-status', JSON.stringify(state));
}

function toggleStudentFeeStatus(studentId, paid) {
    setStudentFeeStatus(studentId, paid);
    const student = appData.students.find(item => String(item.id) === String(studentId));
    if (student) {
        student.fee_status = Boolean(paid);
    }
    renderStudentsTable();
}

function loadScheduleData() {
    const raw = localStorage.getItem('school-schedule-data');
    try {
        appData.schedules = raw ? JSON.parse(raw) : [];
    } catch (error) {
        console.error('Schedule load error:', error);
        appData.schedules = [];
    }
}

function saveScheduleData() {
    localStorage.setItem('school-schedule-data', JSON.stringify(appData.schedules || []));
}

function renderStudentsTable() {
    const tbody = document.getElementById('students-body');
    if (!tbody) return;
    const searchValue = (searchState.students || '').toLowerCase();
    const filteredStudents = (appData.students || []).filter(student => {
        if (!searchValue) return true;
        const searchable = [student.id, student.name, student.email, student.fee_status ? 'paid' : 'unpaid'];
        return searchable.some(value => String(value || '').toLowerCase().includes(searchValue));
    });

    if (!filteredStudents.length) {
        tbody.innerHTML = `<tr><td colspan="5" class="no-data">No students found</td></tr>`;
        return;
    }

    tbody.innerHTML = filteredStudents.map(student => {
        const paid = Boolean(student.fee_status);
        return `<tr>
            <td>${escapeHTML(student.id)}</td>
            <td>${escapeHTML(student.name)}</td>
            <td>${escapeHTML(student.email)}</td>
            <td><span class="fee-pill ${paid ? 'paid' : 'unpaid'}">${paid ? 'Paid' : 'Unpaid'}</span></td>
            <td class="action-cell">
                <label class="fee-toggle">
                    <input type="checkbox" data-student-id="${student.id}" ${paid ? 'checked' : ''} onchange="toggleStudentFeeStatus('${student.id}', this.checked)" />
                    <span>${paid ? 'Paid' : 'Unpaid'}</span>
                </label>
                <button class="edit-btn" onclick="editRecord('${student.id}', 'students')">Edit</button>
                <button class="delete-btn" onclick="deleteRecord('${student.id}', 'students')">Delete</button>
            </td>
        </tr>`;
    }).join('');
}

function renderScheduleTable() {
    const tbody = document.getElementById('schedule-body');
    if (!tbody) return;
    const searchValue = (searchState.schedules || '').toLowerCase();
    const filteredSchedules = (appData.schedules || []).filter(entry => {
        if (!searchValue) return true;
        const teacher = appData.instructors.find(item => String(item.id) === String(entry.teacher_id)) || {};
        const course = appData.courses.find(item => String(item.id) === String(entry.course_id)) || {};
        const section = (appData.sections || []).find(item => String(item.id) === String(entry.section_id)) || {};
        return [entry.day, entry.class_time, teacher.name, course.course_name, section.section_name]
            .some(value => String(value || '').toLowerCase().includes(searchValue));
    });

    if (!filteredSchedules.length) {
        tbody.innerHTML = `<tr><td colspan="7" class="no-data">No schedule entries found</td></tr>`;
        return;
    }

    tbody.innerHTML = filteredSchedules.map(entry => {
        const teacher = appData.instructors.find(item => String(item.id) === String(entry.teacher_id)) || {};
        const course = appData.courses.find(item => String(item.id) === String(entry.course_id)) || {};
        const section = (appData.sections || []).find(item => String(item.id) === String(entry.section_id)) || {};
        return `<tr>
            <td>${escapeHTML(entry.id)}</td>
            <td>${escapeHTML(entry.day)}</td>
            <td>${escapeHTML(entry.class_time)}</td>
            <td>${escapeHTML(teacher.name || '-')}</td>
            <td>${escapeHTML(course.course_name || '-')}</td>
            <td>${escapeHTML(section.section_name || '-')}</td>
            <td class="action-cell">
                <button class="delete-btn" onclick="deleteSchedule('${entry.id}')">Delete</button>
            </td>
        </tr>`;
    }).join('');
}

function showDefaultersList() {
    const panel = document.getElementById('defaulters-panel');
    if (!panel) return;
    const defaulters = (appData.students || []).filter(student => !student.fee_status);
    if (!panel) return;

    if (!defaulters.length) {
        panel.innerHTML = '<div class="defaulters-card empty">No defaulters at the moment.</div>';
        panel.classList.remove('hidden');
        return;
    }

    panel.innerHTML = `
        <div class="defaulters-card">
            <h4>Defaulters List</h4>
            <ul>
                ${defaulters.map(student => `<li><strong>${escapeHTML(student.name)}</strong> — ${escapeHTML(student.email)}</li>`).join('')}
            </ul>
        </div>
    `;
    panel.classList.remove('hidden');
}

function renderOverviewPage() {
    const tbody = document.getElementById('overview-body');
    if (!tbody) return;
    const studentsPanel = document.getElementById('overview-students-panel');
    const teachersPanel = document.getElementById('overview-teachers-panel');

    const rows = (appData.sections || []).map(section => {
        const studentIds = (section.student_ids || []).map(id => String(id));
        const studentsInSection = (appData.students || []).filter(student => studentIds.includes(String(student.id)));
        const feeSummary = studentsInSection.length
            ? `${studentsInSection.filter(student => student.fee_status).length}/${studentsInSection.length} Paid`
            : 'No students';
        const scheduleEntry = (appData.schedules || []).find(item => String(item.section_id) === String(section.id));
        const teacher = appData.instructors.find(item => String(item.id) === String(scheduleEntry?.teacher_id)) || {};
        const course = appData.courses.find(item => String(item.id) === String(scheduleEntry?.course_id)) || {};

        return {
            school: 'Bright Future School',
            section: section.section_name || '-',
            studentIds: studentIds.length ? studentIds.join(', ') : 'No students',
            className: section.section_name || '-',
            course: course.course_name || '-',
            fees: feeSummary,
            timing: scheduleEntry ? `${scheduleEntry.day} • ${scheduleEntry.class_time}` : 'Not assigned',
            teacher: teacher.name || '-'
        };
    });

    if (!rows.length) {
        tbody.innerHTML = '<tr><td colspan="8" class="no-data">No overview records found</td></tr>';
    } else {
        tbody.innerHTML = rows.map(row => `
            <tr>
                <td>${escapeHTML(row.school)}</td>
                <td>${escapeHTML(row.section)}</td>
                <td>${escapeHTML(row.studentIds)}</td>
                <td>${escapeHTML(row.className)}</td>
                <td>${escapeHTML(row.course)}</td>
                <td>${escapeHTML(row.fees)}</td>
                <td>${escapeHTML(row.timing)}</td>
                <td>${escapeHTML(row.teacher)}</td>
            </tr>
        `).join('');
    }

    const studentCards = (appData.students || []).map(student => `
        <div class="overview-chip">
            <strong>${escapeHTML(student.name || student.id)}</strong>
            <span>${escapeHTML(student.email || '')}</span>
            <small>${student.fee_status ? 'Paid' : 'Unpaid'}</small>
        </div>
    `).join('');

    const teacherCards = (appData.instructors || []).map(teacher => `
        <div class="overview-chip">
            <strong>${escapeHTML(teacher.name || teacher.id)}</strong>
            <span>${escapeHTML(teacher.email || '')}</span>
        </div>
    `).join('');

    studentsPanel.innerHTML = studentCards || '<p class="no-data">No students available.</p>';
    teachersPanel.innerHTML = teacherCards || '<p class="no-data">No teachers available.</p>';
}

function deleteSchedule(id) {
    if (!confirm('Delete this schedule entry?')) return;
    appData.schedules = (appData.schedules || []).filter(item => String(item.id) !== String(id));
    saveScheduleData();
    renderScheduleTable();
}

async function loadAllData() {
    appData.students = await fetchFromBackend('/students');
    appData.instructors = await fetchFromBackend('/instructors');
    appData.departments = await fetchFromBackend('/departments');
    appData.courses = await fetchFromBackend('/courses');
    appData.enrollments = await fetchFromBackend('/enrollments');
    appData.students = appData.students.map(student => ({
        ...student,
        fee_status: getStudentFeeStatus(student.id)
    }));
    loadScheduleData();
    updateDashboard();
    const activePage = document.querySelector('.page.active')?.id;
    if (activePage) showPage(activePage);
}


function updateDashboard() {
    const setTotal = (id, count) => {
        const el = document.getElementById(id);
        if (el) el.textContent = count;
    };
    setTotal('total-students', appData.students.length);
    setTotal('total-instructors', appData.instructors.length);
    setTotal('total-departments', appData.departments.length);
    setTotal('total-courses', appData.courses.length);
    renderDashboardChart();
}

// Sections stored in localStorage (no backend change)
function loadSections() {
    const raw = localStorage.getItem('sections');
    try {
        appData.sections = raw ? JSON.parse(raw) : [];
    } catch (e) {
        appData.sections = [];
    }
}

function saveSections() {
    localStorage.setItem('sections', JSON.stringify(appData.sections || []));
}

function renderSections() {
    const tbody = document.getElementById('sections-body');
    if (!tbody) return;
    const searchValue = (searchState.sections || '').toLowerCase();
    const sections = (appData.sections || []).filter(s => {
        if (!searchValue) return true;
        const teacher = appData.instructors.find(i => String(i.id) === String(s.instructor_id)) || {};
        const course = appData.courses.find(c => String(c.id) === String(s.course_id)) || {};
        const studentNames = (s.student_ids || []).map(id => {
            const st = appData.students.find(x => String(x.id) === String(id));
            return st ? st.name : id;
        }).join(', ');
        return [
            s.id,
            s.section_name,
            teacher.name,
            course.course_name,
            studentNames
        ].some(value => String(value || '').toLowerCase().includes(searchValue));
    });
    if (!sections.length) {
        tbody.innerHTML = `<tr><td colspan="6" class="no-data">No sections found</td></tr>`;
        return;
    }

    tbody.innerHTML = sections.map(s => {
        const teacher = appData.instructors.find(i => String(i.id) === String(s.instructor_id)) || {};
        const course = appData.courses.find(c => String(c.id) === String(s.course_id)) || {};
        const studentCount = (s.student_ids || []).length;
        const studentNames = (s.student_ids || []).map(id => {
            const st = appData.students.find(x => String(x.id) === String(id));
            return st ? st.name : id;
        }).join(', ');
        return `<tr>
            <td>${escapeHTML(s.id)}</td>
            <td>${escapeHTML(s.section_name)}</td>
            <td>${escapeHTML(teacher.name || '-')}</td>
            <td>${escapeHTML(course.course_name || '-')}</td>
            <td title="${escapeHTML(studentNames)}">${studentCount}</td>
            <td class="action-cell">
                <button class="edit-btn" onclick="editSection('${s.id}')">Edit</button>
                <button class="delete-btn" onclick="deleteSection('${s.id}')">Delete</button>
            </td>
        </tr>`;
    }).join('');
}

function deleteSection(id) {
    if (!confirm('Delete this section?')) return;
    appData.sections = (appData.sections || []).filter(s => s.id !== id);
    saveSections();
    renderSections();
}

// Create a section programmatically (use from browser console)
function createSectionWithId(id) {
    if (!id) return null;
    loadSections();
    appData.sections = appData.sections || [];
    if (appData.sections.find(s => s.id === String(id))) {
        return null; // already exists
    }
    const newSection = { id: String(id), section_name: `Section ${id}`, instructor_id: '', course_id: '', student_ids: [] };
    appData.sections.push(newSection);
    saveSections();
    renderSections();
    return newSection;
}

function editSection(id) {
    const s = (appData.sections || []).find(x => x.id === id);
    if (!s) return;
    const idField = document.getElementById('section-id');
    idField.value = s.id || '';
    idField.disabled = false;
    document.getElementById('section-name').value = s.section_name || '';
    populateDropdown('section-instructor-id', appData.instructors, 'name', 'Select Instructor');
    populateDropdown('section-course-id', appData.courses, 'course_name', 'Select Course');
    document.getElementById('section-instructor-id').value = s.instructor_id || '';
    document.getElementById('section-course-id').value = s.course_id || '';
    // populate students multi-select
    const sel = document.getElementById('section-students');
    if (!sel) return;
    sel.innerHTML = appData.students.map(st => `<option value="${st.id}">${st.id} - ${st.name}</option>`).join('');
    (s.student_ids || []).forEach(id => { const opt = sel.querySelector(`option[value="${id}"]`); if (opt) opt.selected = true; });
    // store a temporary edit id
    editState.page = 'sections';
    editState.id = s.id;
    toggleFormPanel('section-form-panel', true);
}

function setupSectionFormHandlers() {
    document.getElementById('add-section-button')?.addEventListener('click', () => {
        populateDropdown('section-instructor-id', appData.instructors, 'name', 'Select Instructor');
        populateDropdown('section-course-id', appData.courses, 'course_name', 'Select Course');
        const sel = document.getElementById('section-students');
    if (!sel) return;
        sel.innerHTML = appData.students.map(st => `<option value="${st.id}">${st.id} - ${st.name}</option>`).join('');
        document.getElementById('section-name').value = '';
        const idField = document.getElementById('section-id');
        idField.value = '';
        idField.disabled = false;
        clearEditState();
        toggleFormPanel('section-form-panel', true);
    });
    document.getElementById('section-cancel-button')?.addEventListener('click', () => {
        toggleFormPanel('section-form-panel', false);
        clearEditState();
    });
    document.getElementById('section-submit-button')?.addEventListener('click', () => {
        const name = document.getElementById('section-name').value.trim();
        const instructor_id = document.getElementById('section-instructor-id').value;
        const course_id = document.getElementById('section-course-id').value;
        const studentSelect = document.getElementById('section-students');
        const student_ids = Array.from(studentSelect.selectedOptions).map(o => o.value);
        const providedId = document.getElementById('section-id').value.trim();
        if (!name) { alert('Section name required'); return; }
        if (!instructor_id) { alert('Select instructor'); return; }
        if (!course_id) { alert('Select course'); return; }

        if (editState.page === 'sections' && editState.id) {
            // update and allow ID changes when editing
            if (!providedId) {
                alert('ID is required. Please enter a unique ID.');
                return;
            }
            const existingSection = appData.sections.find(s => s.id === providedId && s.id !== editState.id);
            if (existingSection) {
                alert('Section ID already exists. Choose a different ID.');
                return;
            }
            appData.sections = appData.sections.map(s => s.id === editState.id ? { ...s, id: providedId, section_name: name, instructor_id, course_id, student_ids } : s);
        } else {
            // creating new: ID is mandatory
            if (!providedId) { alert('ID is required. Please enter a unique ID.'); return; }
            appData.sections = appData.sections || [];
            if (appData.sections.find(s => s.id === providedId)) {
                alert('Section ID already exists. Choose a different ID.');
                return;
            }
            appData.sections.push({ id: providedId, section_name: name, instructor_id, course_id, student_ids });
        }
        saveSections();
        renderSections();
        toggleFormPanel('section-form-panel', false);
        clearEditState();
    });
}

function renderDashboardChart() {
    if (typeof Chart === 'undefined') return; 

    const ctx = document.getElementById('dashboard-chart');
    if (!ctx) return;
    if (!ctx) return;

    const studentsCount = appData.students ? appData.students.length : 0;
    const instructorsCount = appData.instructors ? appData.instructors.length : 0;

    const data = {
        labels: ['Students', 'Instructors'],
        datasets: [{
            data: [studentsCount, instructorsCount],
            backgroundColor: ['#4e79a7', '#f28e2b'],
            hoverOffset: 8,
            borderWidth: 1
        }]
    };

    // reuse existing chart if present
    if (window.dashboardChart && window.dashboardChart.destroy) {
        window.dashboardChart.data = data;
        window.dashboardChart.update();
        return;
    }

    window.dashboardChart = new Chart(ctx.getContext('2d'), {
        type: 'pie',
        data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });

    // render mini charts for each category
    renderMiniChart('chart-students', appData.students.length, '#667eea', 'doughnut');
    renderMiniChart('chart-instructors', appData.instructors.length, '#764ba2', 'doughnut');
    renderMiniChart('chart-departments', appData.departments.length, '#f59e0b', 'doughnut');
    renderMiniChart('chart-sections', (appData.sections || []).length, '#10b981', 'doughnut');
    renderMiniChart('chart-courses', appData.courses.length, '#8b5cf6', 'doughnut');
    renderMiniChart('chart-enrollments', appData.enrollments.length, '#ec4899', 'doughnut');

    // update count badges
    document.getElementById('chart-students-count').textContent = appData.students.length;
    document.getElementById('chart-instructors-count').textContent = appData.instructors.length;
    document.getElementById('chart-departments-count').textContent = appData.departments.length;
    document.getElementById('chart-sections-count').textContent = (appData.sections || []).length;
    document.getElementById('chart-courses-count').textContent = appData.courses.length;
    document.getElementById('chart-enrollments-count').textContent = appData.enrollments.length;
}

function renderMiniChart(canvasId, count, color, type) {
    if (typeof Chart === 'undefined') return;
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const chartKey = `miniChart_${canvasId}`;
    const data = {
        datasets: [{
            data: [count, 100 - count],
            backgroundColor: [color, 'rgba(0,0,0,0.05)'],
            borderWidth: 0
        }]
    };

    if (window[chartKey] && window[chartKey].destroy) {
        window[chartKey].data = data;
        window[chartKey].update();
        return;
    }

    window[chartKey] = new Chart(canvas.getContext('2d'), {
        type,
        data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { enabled: false }
            }
        }
    });
}


function escapeHTML(str) {
    if (str === null || str === undefined) return '-';
    return String(str).replace(/[&<>'"]/g, match => {
        const escapeMap = { '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' };
        return escapeMap[match];
    });
}

function formatTableValue(column, value) {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'string' && /^(date_of_birth|enrollment_date)$/.test(column)) {
        return escapeHTML(value.split('T')[0]);
    }
    return escapeHTML(value);
}

function renderTableRows(data, columns, tableBodyId, page) {
    const tbody = document.getElementById(tableBodyId);
    if (!tbody) return;
    const searchValue = (searchState[page] || '').toLowerCase();
    const filteredData = data.filter(row => {
        if (!searchValue) return true;
        return columns.some(col => String(row[col] || '').toLowerCase().includes(searchValue));
    });
    
    if (!filteredData || filteredData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="${columns.length + 1}" class="no-data">No records found</td></tr>`;
        return;
    }

    tbody.innerHTML = filteredData.map(row => {
        return `<tr>
            ${columns.map(col => `<td>${formatTableValue(col, row[col])}</td>`).join('')}
            <td class="action-cell">
                <button class="edit-btn" onclick="editRecord('${row.id}', '${page}')">Edit</button>
                <button class="delete-btn" onclick="deleteRecord('${row.id}', '${page}')">Delete</button>
            </td>
        </tr>`;
    }).join('');
}

function populateDropdown(selectId, data, textKey, defaultText) {
    const select = document.getElementById(selectId);
    if (!select) return;
    select.innerHTML = `<option value="">${defaultText}</option>` +
        data.map(item => `<option value="${item.id}">${item.id} - ${item[textKey]}</option>`).join('');
}

function clearEditState() {
    editState.page = null;
    editState.id = null;
}

function editRecord(id, page) {
    editState.page = page;
    editState.id = id;
    const row = appData[page].find(item => item.id === id);
    if (!row) return;

    if (page === 'students') {
        document.getElementById('student-name').value = row.name || '';
        document.getElementById('student-email').value = row.email || '';
        document.getElementById('student-gender').value = row.gender || '';
        document.getElementById('student-dob').value = row.date_of_birth || '';
        toggleFormPanel('student-form-panel', true);
    }
    if (page === 'instructors') {
        document.getElementById('instructor-name').value = row.name || '';
        document.getElementById('instructor-email').value = row.email || '';
        document.getElementById('instructor-gender').value = row.gender || '';
        toggleFormPanel('instructor-form-panel', true);
    }
    if (page === 'departments') {
        document.getElementById('department-name').value = row.department_name || '';
        document.getElementById('department-building').value = row.building || '';
        toggleFormPanel('department-form-panel', true);
    }
    if (page === 'courses') {
        document.getElementById('course-name').value = row.course_name || '';
        document.getElementById('course-description').value = row.description || '';
        document.getElementById('course-credits').value = row.credits || '';
        toggleFormPanel('course-form-panel', true);
    }
    if (page === 'enrollments') {
        populateDropdown('enrollment-student-id', appData.students, 'name', 'Select Student');
        populateDropdown('enrollment-course-id', appData.courses, 'course_name', 'Select Course');
        document.getElementById('enrollment-student-id').value = row.student_id || '';
        document.getElementById('enrollment-course-id').value = row.course_id || '';
        document.getElementById('enrollment-grade').value = row.grade || '';
        document.getElementById('enrollment-date').value = row.enrollment_date || '';
        toggleFormPanel('enrollment-form-panel', true);
    }
}

function deleteRecord(id, page) {
    const confirmDelete = confirm(`Are you sure you want to delete this ${page.slice(0, -1)}?`);
    if (!confirmDelete) return;

    const endpoints = {
        students: `/students/${id}`,
        instructors: `/instructors/${id}`,
        departments: `/departments/${id}`,
        courses: `/courses/${id}`,
        enrollments: `/enrollments/${id}`
    };

    fetch(`${API_BASE}${endpoints[page]}`, { method: 'DELETE', headers: {
            'Bypass-Tunnel-Reminder': 'true', 'Bypass-Tunnel-Reminder': 'true' } })
        .then(res => {
            if (!res.ok) throw new Error('Delete failed');
            return res.json();
        })
        .then(() => {
            loadAllData();
            showPage(page);
            alert(`${page.slice(0, -1).charAt(0).toUpperCase() + page.slice(1, -1)} deleted successfully.`);
        })
        .catch(err => {
            console.error('Delete error:', err);
            alert('Failed to delete record. Please try again.');
        });
}


function showPage(pageName) {
   
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    // Show selected page
    const page = document.getElementById(pageName);
    if (page) page.classList.add('active');

 
    document.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));
    document.querySelector(`[data-page="${pageName}"]`).classList.add('active');


    const titles = {
        dashboard: 'Dashboard',
        overview: 'School Overview',
        students: 'Students Management',
        instructors: 'Instructors Management',
        departments: 'Departments Management',
        sections: 'Sections Management',
        schedule: 'Schedule Management',
        courses: 'Courses Management',
        enrollments: 'Enrollments Management'
    };
    document.getElementById('page-title').textContent = titles[pageName];

 
    switch (pageName) {
        case 'overview':
            renderOverviewPage();
            break;
        case 'students':
            renderStudentsTable();
            break;
        case 'instructors':
            renderTableRows(appData.instructors, ['id', 'name', 'email'], 'instructors-body', 'instructors');
            break;
        case 'departments':
            renderTableRows(appData.departments, ['id', 'department_name', 'building'], 'departments-body', 'departments');
            break;
        case 'sections':
            renderSections();
            break;
        case 'schedule':
            renderScheduleTable();
            break;
        case 'courses':
            renderTableRows(appData.courses, ['id', 'course_name', 'description', 'credits'], 'courses-body', 'courses');
            break;
        case 'enrollments':
            renderTableRows(appData.enrollments, ['id', 'student_name', 'course_name', 'grade', 'enrollment_date'], 'enrollments-body', 'enrollments');
            break;
    }
}


function toggleFormPanel(panelId, show) {
    const panel = document.getElementById(panelId);
    if (!panel) return;
    panel.classList.toggle('hidden', !show);
}

async function postToBackend(endpoint, data, method = 'POST') {
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            method,
            headers: {
            'Bypass-Tunnel-Reminder': 'true', 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({}));
            throw new Error(errorBody.error || `API Error: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Post error:', error);
        alert(`Unable to save data: ${error.message}`);
        return null;
    }
}

async function submitForm(config) {
    const payload = {};
    config.fields.forEach(field => {
        payload[field.name] = field.element.value.trim();
    });

    if (config.validation) {
        const invalid = config.validation(payload);
        if (invalid) {
            alert(invalid);
            return;
        }
    }

    const isEdit = editState.page === config.page && editState.id;
    const url = isEdit ? `${config.endpoint}/${editState.id}` : config.endpoint;
    const method = isEdit ? 'PUT' : 'POST';
    const result = await postToBackend(url, payload, method);
    if (result) {
        await loadAllData();
        showPage(config.page);
        toggleFormPanel(config.panelId, false);
        config.fields.forEach(field => { field.element.value = ''; });
        clearEditState();
        if (config.page === 'sections') {
            const msg = document.getElementById('section-save-message');
            if (msg) {
                msg.textContent = `${config.label} saved successfully.`;
                msg.classList.remove('hidden');
                msg.classList.add('success');
                setTimeout(() => msg.classList.add('hidden'), 3000);
            }
        } else {
            alert(`${config.label} saved successfully.`);
        }
    }
}


function setupScheduleFormHandlers() {
    document.getElementById('add-schedule-button')?.addEventListener('click', () => {
        populateDropdown('schedule-teacher-id', appData.instructors, 'name', 'Select Teacher');
        populateDropdown('schedule-course-id', appData.courses, 'course_name', 'Select Subject');
        populateDropdown('schedule-section-id', (appData.sections || []), 'section_name', 'Select Section');
        document.getElementById('schedule-time').value = '09:00';
        document.getElementById('schedule-day').value = 'Monday';
        toggleFormPanel('schedule-form-panel', true);
    });

    document.getElementById('schedule-cancel-button')?.addEventListener('click', () => {
        toggleFormPanel('schedule-form-panel', false);
    });

    document.getElementById('schedule-submit-button')?.addEventListener('click', () => {
        const teacher_id = document.getElementById('schedule-teacher-id').value;
        const course_id = document.getElementById('schedule-course-id').value;
        const section_id = document.getElementById('schedule-section-id').value;
        const class_time = document.getElementById('schedule-time').value;
        const day = document.getElementById('schedule-day').value;

        if (!teacher_id || !course_id || !section_id || !class_time || !day) {
            alert('Please fill out the teacher, subject, section, time, and day fields.');
            return;
        }

        const entry = {
            id: `sched-${Date.now()}`,
            teacher_id,
            course_id,
            section_id,
            class_time,
            day
        };
        appData.schedules = [...(appData.schedules || []), entry];
        saveScheduleData();
        renderScheduleTable();
        toggleFormPanel('schedule-form-panel', false);
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Frontend loaded. Connected to Backend at:', API_BASE);
    

    await checkApiStatus();
    await loadAllData();
    // load local sections and wire their handlers
    loadSections();
    setupSectionFormHandlers();
    setupScheduleFormHandlers();
    renderSections();
    renderScheduleTable();
    

    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', () => {
            showPage(item.dataset.page);
        });
    });


    


    const populateDropdown = (selectId, data, textKey, defaultText) => {
        const select = document.getElementById(selectId);
        if (!select) return;
        select.innerHTML = `<option value="">${defaultText}</option>` + 
            data.map(item => `<option value="${item.id}">${item.id} - ${item[textKey]}</option>`).join('');
    };


    document.getElementById('add-student-button')?.addEventListener('click', () => toggleFormPanel('student-form-panel', true));
    document.getElementById('show-defaulters-button')?.addEventListener('click', showDefaultersList);
    document.getElementById('student-cancel-button')?.addEventListener('click', () => toggleFormPanel('student-form-panel', false));
    document.getElementById('student-submit-button')?.addEventListener('click', () => {
        submitForm({
            endpoint: '/students',
            page: 'students',
            panelId: 'student-form-panel',
            label: 'Student',
            fields: [
                { name: 'name', element: document.getElementById('student-name') },
                { name: 'email', element: document.getElementById('student-email') },
                { name: 'gender', element: document.getElementById('student-gender') },
                { name: 'date_of_birth', element: document.getElementById('student-dob') }
            ],
            validation: (payload) => {
                if (!payload.name || !payload.email) return 'Student name and email are required.';
                return null;
            }
        });
    });

    document.getElementById('add-instructor-button')?.addEventListener('click', () => toggleFormPanel('instructor-form-panel', true));
    document.getElementById('instructor-cancel-button')?.addEventListener('click', () => toggleFormPanel('instructor-form-panel', false));
    document.getElementById('instructor-submit-button')?.addEventListener('click', () => {
        submitForm({
            endpoint: '/instructors',
            page: 'instructors',
            panelId: 'instructor-form-panel',
            label: 'Instructor',
            fields: [
                { name: 'name', element: document.getElementById('instructor-name') },
                { name: 'email', element: document.getElementById('instructor-email') },
                { name: 'gender', element: document.getElementById('instructor-gender') }
            ],
            validation: (payload) => {
                if (!payload.name || !payload.email) return 'Instructor name and email are required.';
                return null;
            }
        });
    });

    document.getElementById('add-department-button')?.addEventListener('click', () => toggleFormPanel('department-form-panel', true));
    document.getElementById('department-cancel-button')?.addEventListener('click', () => toggleFormPanel('department-form-panel', false));
    document.getElementById('department-submit-button')?.addEventListener('click', () => {
        submitForm({
            endpoint: '/departments',
            page: 'departments',
            panelId: 'department-form-panel',
            label: 'Department',
            fields: [
                { name: 'department_name', element: document.getElementById('department-name') },
                { name: 'building', element: document.getElementById('department-building') }
            ],
            validation: (payload) => {
                if (!payload.department_name) return 'Department name is required.';
                return null;
            }
        });
    });

    document.getElementById('add-course-button')?.addEventListener('click', () => toggleFormPanel('course-form-panel', true));
    document.getElementById('course-cancel-button')?.addEventListener('click', () => toggleFormPanel('course-form-panel', false));
    document.getElementById('course-submit-button')?.addEventListener('click', () => {
        submitForm({
            endpoint: '/courses',
            page: 'courses',
            panelId: 'course-form-panel',
            label: 'Course',
            fields: [
                { name: 'course_name', element: document.getElementById('course-name') },
                { name: 'description', element: document.getElementById('course-description') },
                { name: 'credits', element: document.getElementById('course-credits') }
            ],
            validation: (payload) => {
                if (!payload.course_name) return 'Course name is required.';
                return null;
            }
        });
    });

    document.getElementById('add-enrollment-button')?.addEventListener('click', () => {
        populateDropdown('enrollment-student-id', appData.students, 'name', 'Select Student');
        populateDropdown('enrollment-course-id', appData.courses, 'course_name', 'Select Course');
        document.getElementById('enrollment-date').value = new Date().toISOString().split('T')[0];
        toggleFormPanel('enrollment-form-panel', true);
    });
    document.getElementById('enrollment-cancel-button')?.addEventListener('click', () => toggleFormPanel('enrollment-form-panel', false));
    document.getElementById('enrollment-submit-button')?.addEventListener('click', () => {
        submitForm({
            endpoint: '/enrollments',
            page: 'enrollments',
            panelId: 'enrollment-form-panel',
            label: 'Enrollment',
            fields: [
                { name: 'student_id', element: document.getElementById('enrollment-student-id') },
                { name: 'course_id', element: document.getElementById('enrollment-course-id') },
                { name: 'grade', element: document.getElementById('enrollment-grade') },
                { name: 'enrollment_date', element: document.getElementById('enrollment-date') }
            ],
            validation: (payload) => {
                if (!payload.student_id || !payload.course_id) return 'Student ID and Course ID are required.';
                return null;
            }
        });
    });

    const searchBindings = [
        { inputId: 'students-search', page: 'students' },
        { inputId: 'instructors-search', page: 'instructors' },
        { inputId: 'departments-search', page: 'departments' },
        { inputId: 'sections-search', page: 'sections' },
        { inputId: 'schedule-search', page: 'schedules' },
        { inputId: 'courses-search', page: 'courses' },
        { inputId: 'enrollments-search', page: 'enrollments' }
    ];

    searchBindings.forEach(binding => {
        const input = document.getElementById(binding.inputId);
        if (!input) return;
        input.addEventListener('input', () => {
            searchState[binding.page === 'schedules' ? 'schedules' : binding.page] = input.value;
            if (binding.page === 'sections') {
                renderSections();
            } else if (binding.page === 'schedules') {
                renderScheduleTable();
            } else {
                showPage(binding.page);
            }
        });
    });

    const initialPage = document.querySelector('.page')?.id || 'dashboard';
    showPage(initialPage);
});
