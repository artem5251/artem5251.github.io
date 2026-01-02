// Конфигурация
const CONFIG = {
    USERS_URL: 'users.json',
    SCHEDULE_URL: 'data/schedule.json',
    TELEGRAM_BOT_TOKEN: '8562706124:AAGCLf_PRrrDSbdiyRvpq68OCpDJDAgkY3s',
    TELEGRAM_CHAT_ID: 'YOUR_CHAT_ID', // Замените на ваш ID
    ADMIN_USERNAME: 'admin',
    ADMIN_PASSWORD: 'Bonia525#'
};

// Глобальные переменные
let currentUser = null;
let users = [];
let schedule = [];

// Инициализация
document.addEventListener('DOMContentLoaded', async () => {
    await loadUsers();
    checkAuth();
    setupEventListeners();
});

// Загрузка пользователей из JSON
async function loadUsers() {
    try {
        const response = await fetch(CONFIG.USERS_URL);
        users = await response.json();
        console.log('Пользователи загружены:', users);
    } catch (error) {
        console.error('Ошибка загрузки пользователей:', error);
        showNotification('Ошибка загрузки данных', 'error');
        // Запасные данные
        users = [
            { id: 1, username: 'user1', password: 'password123' },
            { id: 2, username: 'user2', password: 'password456' },
            { id: 3, username: 'admin', password: 'Bonia525#', role: 'admin' }
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
    document.getElementById('logoutBtn').addEventListener('click', logout);

    // Модальное окно событий
    document.getElementById('addEventBtn')?.addEventListener('click', showEventModal);
    document.getElementById('addFirstEventBtn')?.addEventListener('click', showEventModal);
    
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', hideEventModal);
    });

    // Форма события
    document.getElementById('eventForm').addEventListener('submit', saveEvent);

    // Закрытие модалки по клику вне
    document.getElementById('eventModal').addEventListener('click', (e) => {
        if (e.target === document.getElementById('eventModal')) {
            hideEventModal();
        }
    });

    // Админ доступ (скрытый - Ctrl+Alt+A)
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.altKey && e.key === 'a') {
            e.preventDefault();
            document.getElementById('loginUsername').value = CONFIG.ADMIN_USERNAME;
            document.getElementById('loginPassword').value = CONFIG.ADMIN_PASSWORD;
            showNotification('Данные администратора заполнены', 'info');
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
        currentUser = { username: CONFIG.ADMIN_USERNAME, role: 'admin' };
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
        id: users.length + 1,
        username,
        email,
        password,
        createdAt: new Date().toISOString()
    };

    // В реальном проекте здесь будет отправка на сервер
    users.push(newUser);
    
    try {
        // Отправка в Telegram (имитация)
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
    // В реальном проекте раскомментируйте этот код:
    /*
    const url = `https://api.telegram.org/bot${CONFIG.TELEGRAM_BOT_TOKEN}/sendMessage`;
    
    try {
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
        
        return await response.json();
    } catch (error) {
        console.error('Ошибка отправки в Telegram:', error);
        throw error;
    }
    */
    
    // Для демо - просто логируем
    console.log('Telegram message:', message);
    return { ok: true };
}

// Показать страницу пользователя
function showUserPage() {
    if (!currentUser) return;
    
    document.getElementById('userGreeting').textContent = `Привет, ${currentUser.username}!`;
    document.getElementById('authPage').classList.remove('active');
    document.getElementById('userPage').classList.add('active');
    
    loadUserSchedule();
    setupDateForNewEvent();
}

// Загрузка расписания пользователя
async function loadUserSchedule() {
    try {
        const response = await fetch(CONFIG.SCHEDULE_URL);
        schedule = await response.json();
        
        // Фильтруем события текущего пользователя
        const userEvents = schedule.filter(event => 
            event.userId === currentUser.id || event.userId === currentUser.username
        );
        
        displaySchedule(userEvents);
    } catch (error) {
        console.error('Ошибка загрузки расписания:', error);
        // Демо данные
        const demoEvents = [
            {
                id: 1,
                userId: currentUser.id || currentUser.username,
                title: 'Пример встречи',
                date: new Date().toISOString().split('T')[0],
                time: '10:00',
                type: 'meeting',
                description: 'Это пример события в вашем расписании',
                important: true
            }
        ];
        displaySchedule(demoEvents);
    }
}

// Отображение расписания
function displaySchedule(events) {
    const container = document.getElementById('scheduleContainer');
    const emptyState = document.getElementById('emptySchedule');
    
    if (!events || events.length === 0) {
        container.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';
    
