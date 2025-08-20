// --- State Management (Global) ---
const STORAGE_KEY = 'tleLevel2Progress';
let userProgress = {};
let practiceData = []; // Will be populated by fetching data.json

// --- UI Generation ---

// Helper function to format week titles
function formatWeekTitle(title) {
    const match = title.trim().match(/^week(\d+)\s*[-:]\s*(.+)$/i);
    if (match) {
        let num = match[1].padStart(2, '0');
        let text = match[2].trim();
        text = text.charAt(0).toUpperCase() + text.slice(1);
        return `Week ${num} - ${text}`;
    }
    return title.charAt(0).toUpperCase() + title.slice(1);
}

// Helper function to format day titles
function formatDayTitle(title) {
    const match = title.trim().match(/^day(\d+)$/i);
    if (match) {
        let num = match[1].padStart(2, '0');
        return `Day ${num}`;
    }
    return title.charAt(0).toUpperCase() + title.slice(1);
}


function createPlatformBadge(url) {
    if (!url) return '';
    const platformMap = {
        'codeforces.com': ['Codeforces', 'codeforces'],
        'leetcode.com': ['LeetCode', 'leetcode'],
        'cses.fi': ['CSES', 'cses'],
        'spoj.com': ['SPOJ', 'spoj'],
        'codechef.com': ['CodeChef', 'codechef'],
        'atcoder.jp': ['AtCoder', 'atcoder'],
        'geeksforgeeks.org': ['GeeksforGeeks', 'geeksforgeeks']
    };
    const found = Object.entries(platformMap).find(([domain]) => url.includes(domain));
    const [platformName, className] = found ? found[1] : ['Other', ''];
    return `<span class="task-platform ${className}">${platformName}</span>`;
}

function extractProblemId(url) {
    if (!url) return 'Link Missing';
    const patterns = [
        /problemset\/problem\/(\d+)\/(\w+)/,
        /contest\/\d+\/problem\/(\w+)/,
        /problems\/([\w-]+)/,
        /task\/([\w-]+)/,
        /submit\/(\w+)$/
    ];
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match.slice(1).join(' ');
    }
    return 'Problem Link';
}

// Creates a single task item element
function createTaskItem(task, index) {
    const { problem, video } = task;
    if (!problem) return '';

    const progress = userProgress[problem] || { completed: false, bookmarked: false };
    const isCompleted = progress.completed;
    const isBookmarked = progress.bookmarked;

    return `
    <div class="task-item ${isCompleted ? 'completed' : ''}" data-url="${problem}">
      <input type="checkbox" class="task-checkbox" ${isCompleted ? 'checked' : ''}>
      <div class="task-number">${index + 1}</div>
      <div class="task-content">
        ${createPlatformBadge(problem)}
        <span class="task-link">${extractProblemId(problem)}</span>
        ${video ? `<a href="${video}" class="video-link" target="_blank" rel="noopener noreferrer"><i class="fas fa-video"></i></a>` : ''}
      </div>
       <i class="fas fa-star bookmark-icon ${isBookmarked ? 'active' : ''}"></i>
    </div>
  `;
}

// Creates a week section, including all its days and tasks
function createWeekSection(weekData) {
    const section = document.createElement('div');
    section.className = 'week-section';
    section.dataset.weekId = weekData.week;

    const tasksInWeek = weekData.days.flatMap(day => day.tasks.filter(t => t.problem));
    const completedTasks = tasksInWeek.filter(task => userProgress[task.problem]?.completed).length;
    const completionPercent = tasksInWeek.length > 0 ? Math.round((completedTasks / tasksInWeek.length) * 100) : 0;


    section.innerHTML = `
    <div class="week-header">
      <h2 class="week-title">${formatWeekTitle(weekData.week)}</h2>
      <div class="week-header-controls">
        <div class="week-progress">${completedTasks}/${tasksInWeek.length} (${completionPercent}%)</div>
        <span class="toggle-icon">▶</span>
      </div>
    </div>
    <div class="day-container">
      ${weekData.days.map(day => `
        <div class="day-header">${formatDayTitle(day.title)}</div>
        <div class="tasks-list">
          ${day.tasks.map(createTaskItem).join('')}
        </div>
      `).join('')}
    </div>
  `;
    return section;
}

// Creates the special bookmarked problems section
function createBookmarkSection() {
    const section = document.createElement('div');
    section.className = 'week-section';
    section.id = 'bookmarks-section';

    section.innerHTML = `
    <div class="week-header">
      <h2 class="week-title"><i class="fas fa-star" style="color: var(--bookmarked);"></i> Bookmarked Problems</h2>
      <span class="toggle-icon">▶</span>
    </div>
    <div class="day-container">
      <div class="tasks-list" id="bookmarks-list">
         <!-- Bookmarked items will be populated here -->
      </div>
    </div>
    `;
    return section;
}

// --- State Management Logic ---

function loadProgress() {
    const savedProgress = localStorage.getItem(STORAGE_KEY);
    if (savedProgress) {
        userProgress = JSON.parse(savedProgress);
    } else {
        // Initialize if no saved data
        practiceData.forEach(week => {
            week.days.forEach(day => {
                day.tasks.forEach(task => {
                    if (task.problem) {
                        userProgress[task.problem] = {
                            completed: false,
                            bookmarked: false
                        };
                    }
                });
            });
        });
    }
}

function saveProgress() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userProgress));
}


// --- App Logic & Event Handling ---

function updateProgress() {
    const allTasks = Object.keys(userProgress);
    const completedTasks = allTasks.filter(url => userProgress[url]?.completed);
    const totalCount = allTasks.length;
    const completedCount = completedTasks.length;
    const overallPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    document.getElementById('overall-progress-bar').style.width = `${overallPercent}%`;
    document.getElementById('overall-progress-text').textContent = `${overallPercent}%`;

    practiceData.forEach(week => {
        const weekSection = document.querySelector(`.week-section[data-week-id="${week.week}"]`);
        if (weekSection) {
            const tasksInWeek = week.days.flatMap(day => day.tasks.filter(t => t.problem));
            const completedInWeek = tasksInWeek.filter(task => userProgress[task.problem]?.completed).length;
            const percent = tasksInWeek.length > 0 ? Math.round((completedInWeek / tasksInWeek.length) * 100) : 0;
            const progressText = weekSection.querySelector('.week-progress');
            if (progressText) {
                progressText.textContent = `${completedInWeek}/${tasksInWeek.length} (${percent}%)`;
            }
        }
    });
}

function renderBookmarks() {
    const bookmarksList = document.getElementById('bookmarks-list');
    if (!bookmarksList) return;
    const bookmarkedTasks = [];
    practiceData.forEach(week => {
        week.days.forEach(day => {
            day.tasks.forEach(task => {
                if (task.problem && userProgress[task.problem]?.bookmarked) {
                    bookmarkedTasks.push(task);
                }
            });
        });
    });

    if (bookmarkedTasks.length > 0) {
        bookmarksList.innerHTML = bookmarkedTasks.map(createTaskItem).join('');
    } else {
        bookmarksList.innerHTML = `<p style="padding: 1rem 0;">No problems bookmarked yet.</p>`;
    }
    attachTaskListeners(bookmarksList);
}

function attachTaskListeners(container) {
    container.querySelectorAll('.task-item').forEach(item => {
        const url = item.dataset.url;
        if (!url) return;
        const checkbox = item.querySelector('.task-checkbox');
        checkbox.addEventListener('change', () => {
            userProgress[url].completed = checkbox.checked;
            saveProgress();
            item.classList.toggle('completed', checkbox.checked);
            updateProgress();
        });
        const content = item.querySelector('.task-content');
        content.addEventListener('click', (e) => {
            if (e.target.closest('.video-link')) return;
            window.open(url, '_blank');
        });
        const bookmarkIcon = item.querySelector('.bookmark-icon');
        bookmarkIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            userProgress[url].bookmarked = !userProgress[url].bookmarked;
            saveProgress();
            bookmarkIcon.classList.toggle('active', userProgress[url].bookmarked);
            renderBookmarks();
        });
    });
}

function applyFilter(filter) {
    document.querySelectorAll('.week-section:not(#bookmarks-section) .task-item').forEach(item => {
        const url = item.dataset.url;
        const status = userProgress[url];
        let show = false;
        switch (filter) {
            case 'completed':
                if (status.completed) show = true;
                break;
            case 'incomplete':
                if (!status.completed) show = true;
                break;
            case 'bookmarked':
                if (status.bookmarked) show = true;
                break;
            case 'all':
            default:
                show = true;
        }
        item.style.display = show ? 'flex' : 'none';
    });
}

// --- Main Initialization ---
function initializeApp() {
    loadProgress();
    const mainContainer = document.querySelector('.main-container');
    mainContainer.appendChild(createBookmarkSection());
    practiceData.forEach(week => {
        mainContainer.appendChild(createWeekSection(week));
    });
    renderBookmarks();
    updateProgress();
    attachTaskListeners(mainContainer);

    document.querySelectorAll('.week-header').forEach(header => {
        header.addEventListener('click', () => {
            const container = header.nextElementSibling;
            header.classList.toggle('active');
            if (container.style.maxHeight) {
                container.style.maxHeight = null;
            } else {
                container.style.maxHeight = container.scrollHeight + "px";
            }
        });
    });
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            applyFilter(button.dataset.filter);
        });
    });
    document.getElementById('reset-progress-btn').addEventListener('click', () => {
        if (confirm('Are you sure you want to reset all your progress? This action cannot be undone.')) {
            localStorage.removeItem(STORAGE_KEY);
            window.location.reload();
        }
    });
}

// --- App Entry Point ---
async function startApp() {
    try {
        const response = await fetch('data.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        practiceData = await response.json();
        initializeApp();
    } catch (error) {
        console.error("Could not load practice data:", error);
        document.querySelector('.main-container').innerHTML = `<p style="color: red; text-align: center; font-size: 1.2rem;">Error: Could not load problem data. Please refresh the page.</p>`;
    }
}

document.addEventListener('DOMContentLoaded', startApp);