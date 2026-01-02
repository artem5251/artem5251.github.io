// Конфигурация
const CONFIG = {
    USERS_URL: 'users.json',
    SCHEDULE_URL: 'schedule.json',
    ADMIN_USERNAME: 'admin',
    ADMIN_PASSWORD: 'Bonia525#'
};

// Глобальные переменные
let currentUser = null;
let users = [];
let schedule = [];

// Инициализация
document.addEventListener('DOMContentLoaded', async () => {
    // Если это админ страница, проверяем авторизацию
    if (window.location.pathname.includes('admin.html')) {
        if (!checkAdminAuth()) return;
        initAdminPage();
    } else {
        await initMainPage();
    }
});

// Инициализация главной страницы
async function initMainPage() {
    await loadUsers();
    checkAuth();
    setupEventListeners();
}

// Инициализация админ страницы
async function initAdminPage() {
    await loadUsers();
    setupAdminEventListeners();
    loadAdminData();
    
    // Устанавливаем сегодняшнюю дату
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('eventDate');
    if (dateInput) {
        dateInput.value = today;
        dateInput.min = today;
    }
    
    // Обработка чекбокса "Для всех"
    const forAllCheckbox = document.getElementById('eventForAll');
    const userSelectGroup = document.getElementById('userSelectGroup');
    
    if (forAllCheckbox && userSelectGroup) {
        forAllCheckbox.addEventListener('change', function() {
            const userSelect = document.getElementById('eventUser');
            if (this.checked) {
                userSelectGroup.style.opacity = '0.5';
                userSelect.disabled = true;
            } else {
                userSelectGroup.style.opacity = '1';
                userSelect.disabled = false;
            }
        });
    }
}

// Загрузка пользователей
async function loadUsers() {
    try {
        const response = await fetch(CONFIG.USERS_URL);
        users = await response.json();
        console.log('Пользователи загружены:', users);
    } catch (error) {
        console.error('Ошибка загрузки пользователей:', error);
        showNotification('Ошибка загрузки пользователей', 'error');
        // Демо данные
        users = [
            { id: 1, username: 'Татьяна', password: 'Bonia525', email: 'none', role: 'user' },
            { id: 2, username: 'Рома', password: 'Bonia777', email: 'none', role: 'user' },
            { id: 3, username: 'admin', password: 'Bonia525#', email: 'admin@schedule.ru', role: 'admin' }
        ];
    }
}

// Проверка авторизации админа
function checkAdminAuth() {
    const savedUser = localStorage.getItem('currentUser');
    if (!savedUser) {
        window.location.href = 'index.html';
        return false;
    }

    try {
        const user = JSON.parse(savedUser);
        if (user.username !== CONFIG.ADMIN_USERNAME) {
            window.location.href = 'index.html';
            return false;
        }
        
        // Обновляем имя админа
        const adminNameEl = document.getElementById('adminName');
        if (adminNameEl) adminNameEl.textContent = user.username;
        return true;
    } catch (e) {
        window.location.href = 'index.html';
        return false;
    }
}

// Проверка авторизации пользователя
function checkAuth() {
    const savedUser = localStorage.getItem('currentUser');
    const savedToken = localStorage.getItem('authToken');
    
    if (savedUser && savedToken) {
        try {
            currentUser = JSON.parse(savedUser);
            showUserPage();
        } catch (e) {
            logout();
        }
    }
}

// Настройка обработчиков событий для главной страницы
function setupEventListeners() {
    // Табы авторизации
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            switchAuthTab(tab);
        });
    });

    // Кнопка входа
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', login);
    }

    // Enter в форме входа
    const loginPassword = document.getElementById('loginPassword');
    if (loginPassword) {
        loginPassword.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') login();
        });
    }

    // Кнопка регистрации
    const registerBtn = document.getElementById('registerBtn');
    if (registerBtn) {
        registerBtn.addEventListener('click', register);
    }

    // Enter в форме регистрации
    const confirmPassword = document.getElementById('confirmPassword');
    if (confirmPassword) {
        confirmPassword.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') register();
        });
    }

    // Выход
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    // Админ доступ (Ctrl+Alt+A)
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.altKey && e.key === 'a') {
            e.preventDefault();
            const loginUsername = document.getElementById('loginUsername');
            const loginPassword = document.getElementById('loginPassword');
            
            if (loginUsername && loginPassword) {
                loginUsername.value = CONFIG.ADMIN_USERNAME;
                loginPassword.value = CONFIG.ADMIN_PASSWORD;
                showNotification('Данные администратора заполнены', 'info');
            }
        }
    });
}

// Настройка обработчиков событий для админ панели
function setupAdminEventListeners() {
    // Форма добавления события
    const addEventForm = document.getElementById('addEventForm');
    if (addEventForm) {
        addEventForm.addEventListener('submit', addEvent);
    }

    // Кнопка обновления
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadAdminData);
    }

    // Кнопка экспорта
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportData);
    }

    // Кнопка выхода
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('currentUser');
            window.location.href = 'index.html';
        });
    }
}

// Переключение табов авторизации
function switchAuthTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    
    const loginTab = document.getElementById('loginTab');
    const registerTab = document.getElementById('registerTab');
    
    if (loginTab) loginTab.classList.toggle('active', tab === 'login');
    if (registerTab) registerTab.classList.toggle('active', tab === 'register');
}

// Вход в систему
async function login() {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!username || !password) {
        showNotification('Заполните все поля', 'error');
        return;
    }

    // Проверка администратора
    if (username === CONFIG.ADMIN_USERNAME && password === CONFIG.ADMIN_PASSWORD) {
        currentUser = { 
            id: 3, 
            username: CONFIG.ADMIN_USERNAME, 
            email: 'admin@schedule.ru',
            role: 'admin'
        };
        localStorage.setItem('authToken', btoa(`${username}:${Date.now()}`));
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        showNotification('Вход выполнен как администратор', 'success');
        setTimeout(() => {
            window.location.href = 'admin.html';
        }, 1000);
        return;
    }

    // Поиск пользователя
    const user = users.find(u => u.username === username && u.password === password);

    if (!user) {
        showNotification('Неверный логин или пароль', 'error');
        return;
    }

    currentUser = user;
    localStorage.setItem('authToken', btoa(`${username}:${Date.now()}`));
    localStorage.setItem('currentUser', JSON.stringify(currentUser));

    showNotification('Вход выполнен успешно', 'success');
    showUserPage();
}

// Регистрация
async function register() {
    const username = document.getElementById('regUsername').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // Валидация
    if (!username || !email || !password) {
        showNotification('Заполните все поля', 'error');
        return;
    }

    if (password !== confirmPassword) {
        showNotification('Пароли не совпадают', 'error');
        return;
    }

    if (users.some(u => u.username === username)) {
        showNotification('Пользователь с таким логином уже существует', 'error');
        return;
    }

    // Создание нового пользователя
    const newUser = {
        id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
        username,
        email,
        password,
        role: 'user'
    };

    users.push(newUser);
    
    // Отправка в Telegram
    await sendToTelegram(`Новый пользователь:\n👤 ${username}\n📧 ${email}\n🔐 ${password}`);
    
    showNotification('Регистрация успешна! Войдите с вашими данными.', 'success');
    
    // Автоматический вход
    setTimeout(() => {
        const loginUsername = document.getElementById('loginUsername');
        const loginPassword = document.getElementById('loginPassword');
        if (loginUsername && loginPassword) {
            loginUsername.value = username;
            loginPassword.value = password;
        }
        switchAuthTab('login');
    }, 1500);
}

// Отправка в Telegram
async function sendToTelegram(message) {
    console.log('Telegram сообщение:', message);
    // В реальном проекте здесь будет fetch запрос к вашему боту
    return { ok: true };
}

// Показать страницу пользователя
function showUserPage() {
    if (!currentUser) return;
    
    const userGreeting = document.getElementById('userGreeting');
    if (userGreeting) {
        userGreeting.textContent = `Привет, ${currentUser.username}!`;
    }
    
    const authPage = document.getElementById('authPage');
    const userPage = document.getElementById('userPage');
    
    if (authPage) authPage.classList.remove('active');
    if (userPage) userPage.classList.add('active');
    
    loadUserSchedule();
}

// Загрузка расписания пользователя
async function loadUserSchedule() {
    try {
        const response = await fetch(CONFIG.SCHEDULE_URL);
        const allEvents = await response.json();
        
        let userEvents;
        if (currentUser.role === 'admin') {
            userEvents = allEvents;
        } else {
            userEvents = allEvents.filter(event => 
                event.forAll === true || 
                event.userId === currentUser.id || 
                event.username === currentUser.username
            );
        }
        
        displaySchedule(userEvents);
    } catch (error) {
        console.error('Ошибка загрузки расписания:', error);
        // Демо данные
        const demoEvents = [
            {
                id: 1,
                title: "Общее собрание",
                date: new Date().toISOString().split('T')[0],
                time: "10:00",
                type: "meeting",
                description: "Для всех сотрудников",
                important: true,
                forAll: true
            }
        ];
        displaySchedule(demoEvents);
    }
}

// Отображение расписания
function displaySchedule(events) {
    const container = document.getElementById('scheduleContainer');
    const emptyState = document.getElementById('emptySchedule');
    
    if (!container) return;
    
    if (!events || events.length === 0) {
        container.innerHTML = '';
        if (emptyState) emptyState.style.display = 'block';
        return;
    }
    
    if (emptyState) emptyState.style.display = 'none';
    
    // Группируем события по датам
    const eventsByDate = {};
    events.forEach(event => {
        const date = event.date || new Date().toISOString().split('T')[0];
        if (!eventsByDate[date]) eventsByDate[date] = [];
        eventsByDate[date].push(event);
    });
    
    // Сортируем даты
    const sortedDates = Object.keys(eventsByDate).sort();
    
    // Создаем карточки
    let html = '';
    
    sortedDates.forEach(date => {
        const dateEvents = eventsByDate[date];
        const dateObj = new Date(date);
        const dayName = getDayName(dateObj.getDay());
        const formattedDate = formatDate(dateObj);
        
        html += `
            <div class="day-card">
                <div class="day-header">
                    <div>
                        <h3 class="day-title">${dayName}</h3>
                        <div class="day-date">${formattedDate}</div>
                    </div>
                    <span class="event-count">${dateEvents.length} событий</span>
                </div>
                <ul class="events-list">
                    ${dateEvents.map(event => `
                        <li class="event-item ${event.important ? 'important' : ''}">
                            <div class="event-header">
                                <div class="event-title">${event.title}</div>
                                <div class="event-meta">
                                    ${event.forAll ? 
                                        '<span class="for-all-badge">Для всех</span>' : 
                                        ''
                                    }
                                    <span class="event-time">${event.time}</span>
                                </div>
                            </div>
                            <div class="event-type">${getEventTypeLabel(event.type)}</div>
                            ${currentUser && currentUser.role === 'admin' && !event.forAll && event.username ? `
                                <div class="event-user">👤 ${event.username}</div>
                            ` : ''}
                            ${event.description ? `
                                <div class="event-description">${event.description}</div>
                            ` : ''}
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Загрузка данных для админ панели
async function loadAdminData() {
    try {
        // Загрузка событий
        const response = await fetch(CONFIG.SCHEDULE_URL);
        schedule = await response.json();
        
        // Обновление статистики
        updateAdminStats();
        
        // Отображение пользователей
        displayAdminUsers();
        
        // Заполнение выпадающего списка
        populateUserSelect();
        
        // Отображение событий
        displayAdminEvents();
        
        showNotification('Данные загружены', 'success');
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        showNotification('Ошибка загрузки данных', 'error');
    }
}

// Обновление статистики в админ панели
function updateAdminStats() {
    const today = new Date().toISOString().split('T')[0];
    const todayEvents = schedule.filter(e => e.date === today).length;
    
    const usersCount = document.getElementById('usersCount');
    const eventsCount = document.getElementById('eventsCount');
    const todayEventsEl = document.getElementById('todayEvents');
    
    if (usersCount) usersCount.textContent = users.length;
    if (eventsCount) eventsCount.textContent = schedule.length;
    if (todayEventsEl) todayEventsEl.textContent = todayEvents;
}

// Отображение пользователей в админ панели
function displayAdminUsers() {
    const container = document.getElementById('usersList');
    if (!container) return;
    
    container.innerHTML = '';
    
    users.forEach(user => {
        const row = document.createElement('div');
        row.className = 'table-row';
        
        const roleColor = user.role === 'admin' ? 'var(--primary)' : 'var(--text)';
        const roleIcon = user.role === 'admin' ? '👑' : '👤';
        const roleText = user.role === 'admin' ? 'Админ' : 'Пользователь';
        
        row.innerHTML = `
            <div>${user.id || '—'}</div>
            <div><strong>${user.username}</strong></div>
            <div>${user.email || '—'}</div>
            <div style="color: ${roleColor};">${roleIcon} ${roleText}</div>
        `;
        
        container.appendChild(row);
    });
}

// Заполнение выпадающего списка пользователей
function populateUserSelect() {
    const select = document.getElementById('eventUser');
    if (!select) return;
    
    select.innerHTML = '<option value="">Выберите пользователя</option>';
    
    users.forEach(user => {
        if (user.role !== 'admin') {
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = `${user.username}`;
            select.appendChild(option);
        }
    });
}

// Отображение событий в админ панели
function displayAdminEvents() {
    const container = document.getElementById('eventsList');
    if (!container) return;
    
    if (schedule.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-calendar-times"></i>
                <p>Нет событий</p>
            </div>
        `;
        return;
    }
    
    // Сортируем события по дате
    const sortedEvents = [...schedule].sort((a, b) => {
        const dateA = new Date(a.date + 'T' + (a.time || '00:00'));
        const dateB = new Date(b.date + 'T' + (b.time || '00:00'));
        return dateA - dateB;
    });
    
    container.innerHTML = '';
    
    sortedEvents.forEach(event => {
        const eventElement = document.createElement('div');
        eventElement.className = `event-item ${event.important ? 'important' : ''}`;
        
        const user = users.find(u => u.id == event.userId) || { username: 'Неизвестно' };
        const typeLabels = {
            meeting: 'Встреча',
            task: 'Задача',
            reminder: 'Напоминание',
            event: 'Событие',
            work: 'Работа'
        };
        
        eventElement.innerHTML = `
            <div class="event-info">
                <div class="event-title">${event.title}</div>
                <div class="event-meta">
                    ${event.forAll ? 
                        '<span class="for-all-badge">Для всех</span>' : 
                        `<span>👤 ${user.username}</span> •`
                    }
                    <span> 📅 ${formatDate(event.date)}</span> • 
                    <span> ⏰ ${event.time || '—'}</span> • 
                    <span> ${typeLabels[event.type] || event.type}</span>
                    ${event.important ? ' • <span class="important-badge">⭐ Важное</span>' : ''}
                </div>
                ${event.description ? `
                    <div class="event-description">${event.description}</div>
                ` : ''}
            </div>
            <div class="event-actions">
                <button class="btn-icon edit" onclick="editEvent(${event.id})" title="Редактировать">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon delete" onclick="deleteEvent(${event.id})" title="Удалить">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        container.appendChild(eventElement);
    });
}

// Добавление события (админ)
async function addEvent(e) {
    e.preventDefault();
    
    const title = document.getElementById('eventTitle').value.trim();
    const userId = document.getElementById('eventUser').value;
    const date = document.getElementById('eventDate').value;
    const time = document.getElementById('eventTime').value;
    const type = document.getElementById('eventType').value;
    const description = document.getElementById('eventDescription').value.trim();
    const important = document.getElementById('eventImportant').checked;
    const forAll = document.getElementById('eventForAll').checked;
    
    // Валидация
    if (!title) {
        showNotification('Введите название события', 'error');
        return;
    }
    
    if (!forAll && !userId) {
        showNotification('Выберите пользователя или отметьте "Для всех"', 'error');
        return;
    }
    
    // Создаем новое событие
    const newEvent = {
        id: Date.now(),
        title: title,
        date: date,
        time: time,
        type: type,
        description: description,
        important: important,
        forAll: forAll,
        createdAt: new Date().toISOString()
    };
    
    // Если не для всех, добавляем информацию о пользователе
    if (!forAll && userId) {
        const user = users.find(u => u.id == userId);
        if (user) {
            newEvent.userId = parseInt(userId);
            newEvent.username = user.username;
        }
    }
    
    // Добавляем событие
    schedule.push(newEvent);
    
    // Обновляем интерфейс
    updateAdminStats();
    displayAdminEvents();
    
    // Очищаем форму
    document.getElementById('addEventForm').reset();
    document.getElementById('eventDate').value = new Date().toISOString().split('T')[0];
    
    showNotification(`Событие "${title}" добавлено`, 'success');
}

// Редактирование события (админ)
function editEvent(eventId) {
    const event = schedule.find(e => e.id == eventId);
    if (!event) {
        showNotification('Событие не найдено', 'error');
        return;
    }
    
    const newTitle = prompt('Новое название события:', event.title);
    if (newTitle === null || newTitle.trim() === '') return;
    
    const newDescription = prompt('Новое описание:', event.description || '');
    
    event.title = newTitle.trim();
    event.description = newDescription ? newDescription.trim() : '';
    
    displayAdminEvents();
    showNotification('Событие обновлено', 'success');
}

// Удаление события (админ)
function deleteEvent(eventId) {
    if (!confirm('Удалить это событие?')) return;
    
    schedule = schedule.filter(e => e.id != eventId);
    
    updateAdminStats();
    displayAdminEvents();
    showNotification('Событие удалено', 'success');
}

// Экспорт данных
function exportData() {
    const dataStr = JSON.stringify(schedule, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'schedule-export.json';
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    showNotification('Данные экспортированы', 'success');
}

// Выход из системы
function logout() {
    currentUser = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    
    const userPage = document.getElementById('userPage');
    const authPage = document.getElementById('authPage');
    
    if (userPage) userPage.classList.remove('active');
    if (authPage) authPage.classList.add('active');
    
    // Очистка форм
    ['loginUsername', 'loginPassword', 'regUsername', 'regEmail', 'regPassword', 'confirmPassword'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    
    switchAuthTab('login');
    showNotification('Вы вышли из системы', 'info');
}

// Вспомогательные функции
function getDayName(dayIndex) {
    const days = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
    return days[dayIndex];
}

function formatDate(date) {
    return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

function getEventTypeLabel(type) {
    const labels = {
        meeting: 'Встреча',
        task: 'Задача',
        reminder: 'Напоминание',
        event: 'Событие',
        work: 'Работа',
        other: 'Другое'
    };
    return labels[type] || type;
}

// Уведомления
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    if (!notification) return;
    
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.style.display = 'block';
    
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}
