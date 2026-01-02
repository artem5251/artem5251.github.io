// Конфигурация
const CONFIG = {
    USERS_URL: 'users.json',
    SCHEDULE_URL: 'data/schedule.json',
    TELEGRAM_BOT_TOKEN: '8562706124:AAGCLf_PRrrDSbdiyRvpq68OCpDJDAgkY3s',
    TELEGRAM_CHAT_ID: '5557146078',
    ADMIN_USERNAME: 'admin',
    ADMIN_PASSWORD: 'Bonia525#'
};

// Глобальные переменные
let currentUser = null;
let users = [];
let schedule = [];
let allUsers = [];

// Инициализация
document.addEventListener('DOMContentLoaded', async () => {
    await loadAllData();
    checkAuth();
    setupEventListeners();
});

// Загрузка всех данных
async function loadAllData() {
    try {
        // Загрузка пользователей из JSON
        const usersResponse = await fetch(CONFIG.USERS_URL);
        const jsonUsers = await usersResponse.json();
        
        // Загрузка временных пользователей из localStorage
        const tempUsers = JSON.parse(localStorage.getItem('tempUsers') || '[]');
        
        // Объединяем пользователей
        users = [...jsonUsers, ...tempUsers];
        
        // Загрузка расписания
        const scheduleResponse = await fetch(CONFIG.SCHEDULE_URL);
        schedule = await scheduleResponse.json();
        
        console.log('Данные загружены:', { users, schedule });
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        showNotification('Ошибка загрузки данных', 'error');
        
        // Демо данные при ошибке
        users = [
            { id: 1, username: 'user1', password: 'password123', email: 'user1@example.com', role: 'user', createdAt: '2024-01-01' },
            { id: 2, username: 'user2', password: 'password456', email: 'user2@example.com', role: 'user', createdAt: '2024-01-02' },
            { id: 3, username: 'admin', password: 'Bonia525#', email: 'admin@schedule.ru', role: 'admin', createdAt: '2024-01-01' }
        ];
        
        schedule = [
            {
                id: 1,
                userId: 1,
                username: 'user1',
                title: 'Еженедельное совещание',
                date: new Date().toISOString().split('T')[0],
                time: '10:00',
                type: 'meeting',
                description: 'Совещание команды разработки',
                important: true
            },
            {
                id: 2,
                userId: 2,
                username: 'user2',
                title: 'Встреча с клиентом',
                date: new Date().toISOString().split('T')[0],
                time: '14:00',
                type: 'meeting',
                description: 'Обсуждение нового проекта',
                important: true
            },
            {
                id: 3,
                userId: 1,
                username: 'user1',
                title: 'Тренировка',
                date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
                time: '18:00',
                type: 'event',
                description: 'Фитнес-клуб',
                important: false
            }
        ];
    }
}

// Проверка авторизации
function checkAuth() {
    const savedUser = localStorage.getItem('currentUser');
    const savedToken = localStorage.getItem('authToken');
    
    if (savedUser && savedToken) {
        try {
            currentUser = JSON.parse(savedUser);
            
            // Проверяем, что пользователь всё ещё существует
            const userExists = users.some(u => u.username === currentUser.username);
            if (!userExists && currentUser.username !== 'admin') {
                logout();
                showNotification('Пользователь не найден', 'error');
                return;
            }
            
            showUserPage();
        } catch (e) {
            logout();
        }
    }
}

// Настройка обработчиков событий
function setupEventListeners() {
    // Табы авторизации
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            switchAuthTab(tab);
        });
    });

    // Кнопка входа
    document.getElementById('loginBtn').addEventListener('click', login);

    // Кнопка регистрации
    document.getElementById('registerBtn').addEventListener('click', register);

    // Enter в формах
    document.getElementById('loginPassword').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') login();
    });

    document.getElementById('confirmPassword').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') register();
    });

    // Выход
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    // Модальное окно событий (только для админа)
    const addEventBtn = document.getElementById('addEventBtn');
    const addFirstEventBtn = document.getElementById('addFirstEventBtn');
    
    if (addEventBtn) {
        addEventBtn.addEventListener('click', showEventModal);
    }
    
    if (addFirstEventBtn) {
        addFirstEventBtn.addEventListener('click', showEventModal);
    }
    
    // Закрытие модалки
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', hideEventModal);
    });

    // Форма события
    const eventForm = document.getElementById('eventForm');
    if (eventForm) {
        eventForm.addEventListener('submit', saveEvent);
    }

    // Закрытие модалки по клику вне
    const eventModal = document.getElementById('eventModal');
    if (eventModal) {
        eventModal.addEventListener('click', (e) => {
            if (e.target === eventModal) {
                hideEventModal();
            }
        });
    }

    // Админ доступ (скрытый - Ctrl+Alt+A)
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

// Переключение табов авторизации
function switchAuthTab(tab) {
    // Обновляем активные табы
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });

    // Показываем нужную форму
    document.getElementById('loginTab').classList.toggle('active', tab === 'login');
    document.getElementById('registerTab').classList.toggle('active', tab === 'register');
}

// Вход в систему
async function login() {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    const rememberMe = document.getElementById('rememberMe').checked;

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
            role: 'admin',
            createdAt: '2024-01-01'
        };
        
        const token = btoa(`${username}:${Date.now()}`);
        localStorage.setItem('authToken', token);
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        if (rememberMe) {
            localStorage.setItem('rememberMe', 'true');
        }
        
        showNotification('Вход выполнен как администратор', 'success');
        setTimeout(() => {
            window.location.href = 'admin.html';
        }, 1000);
        return;
    }

    // Поиск пользователя
    const user = users.find(u => 
        u.username === username && u.password === password
    );

    if (!user) {
        showNotification('Неверный логин или пароль', 'error');
        return;
    }

    currentUser = user;
    const token = btoa(`${username}:${Date.now()}`);
    localStorage.setItem('authToken', token);
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
    }

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

    if (password.length < 6) {
        showNotification('Пароль должен быть не менее 6 символов', 'error');
        return;
    }

    // Проверка существующего пользователя
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
        role: 'user',
        createdAt: new Date().toISOString().split('T')[0]
    };

    // Сохраняем временно в localStorage
    const tempUsers = JSON.parse(localStorage.getItem('tempUsers') || '[]');
    tempUsers.push(newUser);
    localStorage.setItem('tempUsers', JSON.stringify(tempUsers));
    
    // Обновляем список пользователей
    users.push(newUser);
    
    try {
        // Имитация отправки в Telegram
        await sendToTelegram(`Новый пользователь зарегистрирован:\n👤 Логин: ${username}\n📧 Email: ${email}\n🔐 Пароль: ${password}`);
        
        showNotification('Регистрация успешна! Данные отправлены в Telegram', 'success');
        
        // Автоматический вход
        setTimeout(() => {
            document.getElementById('loginUsername').value = username;
            document.getElementById('loginPassword').value = password;
            switchAuthTab('login');
        }, 1500);
    } catch (error) {
        showNotification('Ошибка при регистрации', 'error');
    }
}

// Отправка в Telegram
async function sendToTelegram(message) {
    console.log('Telegram message:', message);
    
    // Для реального использования раскомментируйте:
    /*
    if (!CONFIG.TELEGRAM_BOT_TOKEN || !CONFIG.TELEGRAM_CHAT_ID) {
        console.warn('Telegram не настроен');
        return { ok: true };
    }
    
    try {
        const url = `https://api.telegram.org/bot${CONFIG.TELEGRAM_BOT_TOKEN}/sendMessage`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: CONFIG.TELEGRAM_CHAT_ID,
                text: message,
                parse_mode: 'HTML'
            })
        });
        
        const data = await response.json();
        console.log('Telegram response:', data);
        return data;
    } catch (error) {
        console.error('Ошибка отправки в Telegram:', error);
        throw error;
    }
    */
    
    return { ok: true };
}

// Показать страницу пользователя
function showUserPage() {
    if (!currentUser) return;
    
    const userGreeting = document.getElementById('userGreeting');
    if (userGreeting) {
        userGreeting.textContent = `Привет, ${currentUser.username}!`;
        
        // Добавляем бейдж роли
        const roleBadge = document.createElement('span');
        roleBadge.className = `user-role-badge ${currentUser.role || 'user'}`;
        roleBadge.textContent = currentUser.role === 'admin' ? 'Админ' : 'Пользователь';
        userGreeting.appendChild(roleBadge);
    }
    
    const currentUserName = document.getElementById('currentUserName');
    if (currentUserName) {
        currentUserName.textContent = currentUser.username;
    }
    
    document.getElementById('authPage').classList.remove('active');
    document.getElementById('userPage').classList.add('active');
    
    // Управление видимостью элементов для админа/пользователя
    if (currentUser.role === 'admin') {
        // Показываем админские элементы
        document.getElementById('addEventBtn').style.display = 'flex';
        document.getElementById('addFirstEventBtn').style.display = 'flex';
        document.getElementById('eventModal').style.display = 'block';
        
        // Загружаем список пользователей для выбора в форме
        loadUsersForEventForm();
    } else {
        // Скрываем админские элементы для обычных пользователей
        document.getElementById('addEventBtn').style.display = 'none';
        document.getElementById('addFirstEventBtn').style.display = 'none';
        document.getElementById('eventModal').style.display = 'none';
    }
    
    loadUserSchedule();
    updateUserStats();
}

// Загрузка расписания пользователя
async function loadUserSchedule() {
    try {
        let userEvents;
        
        if (currentUser.role === 'admin') {
            // Админ видит все события
            userEvents = schedule;
        } else {
            // Обычный пользователь видит только свои события
            userEvents = schedule.filter(event => 
                event.userId === currentUser.id || event.username === currentUser.username
            );
        }
        
        displaySchedule(userEvents);
        updateUserStats(userEvents);
    } catch (error) {
        console.error('Ошибка загрузки расписания:', error);
        
        // Демо данные
        const demoEvents = currentUser.role === 'admin' ? 
            getDemoEventsForAllUsers() : 
            getDemoEventsForUser(currentUser);
        
        displaySchedule(demoEvents);
        updateUserStats(demoEvents);
    }
}

// Демо события для всех пользователей
function getDemoEventsForAllUsers() {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    
    return [
        {
            id: 1,
            userId: 1,
            username: 'user1',
            title: 'Совещание команды',
            date: today,
            time: '10:00',
            type: 'meeting',
            description: 'Еженедельное совещание',
            important: true
        },
        {
            id: 2,
            userId: 2,
            username: 'user2',
            title: 'Встреча с клиентом',
            date: today,
            time: '14:00',
            type: 'meeting',
            description: 'Обсуждение проекта',
            important: true
        },
        {
            id: 3,
            userId: 1,
            username: 'user1',
            title: 'Тренировка',
            date: tomorrow,
            time: '18:00',
            type: 'event',
            description: 'Фитнес клуб',
            important: false
        }
    ];
}

// Демо события для конкретного пользователя
function getDemoEventsForUser(user) {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    
    return [
        {
            id: user.id * 10,
            userId: user.id,
            username: user.username,
            title: 'Ваше первое событие',
            date: today,
            time: '10:00',
            type: 'meeting',
            description: 'Это пример события в вашем расписании',
            important: true
        },
        {
            id: user.id * 10 + 1,
            userId: user.id,
            username: user.username,
            title: 'Запланированная задача',
            date: tomorrow,
            time: '14:00',
            type: 'task',
            description: 'Выполнить важную задачу',
            important: true
        }
    ];
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
        if (!eventsByDate[date]) {
            eventsByDate[date] = [];
        }
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
                                <span class="event-time">${event.time}</span>
                            </div>
                            <div class="event-type">${getEventTypeLabel(event.type)}</div>
                            ${currentUser.role === 'admin' ? `
                                <div style="font-size: 12px; color: var(--primary); margin-top: 5px;">
                                    👤 ${event.username || 'Пользователь ' + event.userId}
                                </div>
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

// Обновление статистики пользователя
function updateUserStats(events = null) {
    if (!currentUser) return;
    
    const userEvents = events || schedule.filter(event => 
        currentUser.role === 'admin' ? true : (event.userId === currentUser.id || event.username === currentUser.username)
    );
    
    const today = new Date().toISOString().split('T')[0];
    const todayEvents = userEvents.filter(event => event.date === today).length;
    const importantEvents = userEvents.filter(event => event.important).length;
    
    const totalEvents = document.getElementById('totalEvents');
    const todayEventsCount = document.getElementById('todayEventsCount');
    const importantEventsElem = document.getElementById('importantEvents');
    
    if (totalEvents) totalEvents.textContent = userEvents.length;
    if (todayEventsCount) todayEventsCount.textContent = todayEvents;
    if (importantEventsElem) importantEventsElem.textContent = importantEvents;
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
    
    // Очищаем формы
    const loginUsername = document.getElementById('loginUsername');
    const loginPassword = document.getElementById('loginPassword');
    const regUsername = document.getElementById('regUsername');
    const regEmail = document.getElementById('regEmail');
    const regPassword = document.getElementById('regPassword');
    const confirmPassword = document.getElementById('confirmPassword');
    
    if (loginUsername) loginUsername.value = '';
    if (loginPassword) loginPassword.value = '';
    if (regUsername) regUsername.value = '';
    if (regEmail) regEmail.value = '';
    if (regPassword) regPassword.value = '';
    if (confirmPassword) confirmPassword.value = '';
    
    switchAuthTab('login');
    showNotification('Вы вышли из системы', 'info');
}

// Работа с модальным окном событий (только для админа)
function showEventModal() {
    if (currentUser.role !== 'admin') return;
    
    const eventModal = document.getElementById('eventModal');
    if (eventModal) {
        eventModal.style.display = 'block';
        eventModal.classList.add('active');
        setupDateForNewEvent();
    }
}

function hideEventModal() {
    const eventModal = document.getElementById('eventModal');
    if (eventModal) {
        eventModal.style.display = 'none';
        eventModal.classList.remove('active');
        const eventForm = document.getElementById('eventForm');
        if (eventForm) eventForm.reset();
    }
}

function setupDateForNewEvent() {
    const today = new Date().toISOString().split('T')[0];
    const eventDate = document.getElementById('eventDate');
    if (eventDate) {
        eventDate.value = today;
        eventDate.min = today;
    }
}

// Загрузка пользователей для формы добавления события
function loadUsersForEventForm() {
    const eventUserSelect = document.getElementById('eventUser');
    if (!eventUserSelect) return;
    
    // Очищаем текущие опции, кроме первой
    while (eventUserSelect.options.length > 1) {
        eventUserSelect.remove(1);
    }
    
    // Добавляем пользователей
    users.forEach(user => {
        if (user.role !== 'admin') { // Админа не добавляем
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = `${user.username} (${user.email || 'нет email'})`;
            eventUserSelect.appendChild(option);
        }
    });
}

// Сохранение события (только для админа)
function saveEvent(e) {
    e.preventDefault();
    
    if (!currentUser || currentUser.role !== 'admin') {
        showNotification('Только администратор может добавлять события', 'error');
        return;
    }
    
    const eventTitle = document.getElementById('eventTitle');
    const eventDate = document.getElementById('eventDate');
    const eventTime = document.getElementById('eventTime');
    const eventUser = document.getElementById('eventUser');
    const eventType = document.getElementById('eventType');
    const eventDescription = document.getElementById('eventDescription');
    const eventImportant = document.getElementById('eventImportant');
    
    if (!eventTitle || !eventTitle.value.trim()) {
        showNotification('Введите название события', 'error');
        return;
    }
    
    if (!eventUser || !eventUser.value) {
        showNotification('Выберите пользователя', 'error');
        return;
    }
    
    // Находим выбранного пользователя
    const selectedUser = users.find(u => u.id == eventUser.value);
    if (!selectedUser) {
        showNotification('Пользователь не найден', 'error');
        return;
    }
    
    // Создаем новое событие
    const newEvent = {
        id: Date.now(),
        userId: selectedUser.id,
        username: selectedUser.username,
        title: eventTitle.value.trim(),
        date: eventDate.value,
        time: eventTime.value,
        type: eventType.value,
        description: eventDescription.value.trim(),
        important: eventImportant.checked,
        createdBy: currentUser.username,
        createdAt: new Date().toISOString()
    };
    
    // Добавляем событие в расписание
    schedule.push(newEvent);
    
    // В реальном проекте здесь будет отправка на сервер
    // Для GitHub Pages - сохраняем в localStorage
    localStorage.setItem('tempSchedule', JSON.stringify(schedule));
    
    showNotification(`Событие "${newEvent.title}" добавлено для пользователя ${selectedUser.username}`, 'success');
    hideEventModal();
    loadUserSchedule();
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

// Вспомогательные функции
function getDayName(dayIndex) {
    const days = [
        'Воскресенье', 'Понедельник', 'Вторник', 'Среда',
        'Четверг', 'Пятница', 'Суббота'
    ];
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
        event: 'Событие'
    };
    return labels[type] || type;
}
