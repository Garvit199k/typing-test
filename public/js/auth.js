class Auth {
    constructor() {
        this.token = localStorage.getItem('token');
        this.user = JSON.parse(localStorage.getItem('user'));
        this.setupEventListeners();
        this.updateUI();
    }

    setupEventListeners() {
        // Auth modal
        const modal = document.getElementById('authModal');
        const loginBtn = document.getElementById('loginBtn');
        const registerBtn = document.getElementById('registerBtn');
        const logoutBtn = document.getElementById('logoutBtn');
        const closeBtn = document.querySelector('.close');
        const authTabs = document.querySelectorAll('.auth-tabs .tab');
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');

        // Show modal
        loginBtn.addEventListener('click', () => {
            modal.style.display = 'block';
            this.showForm('login');
        });

        registerBtn.addEventListener('click', () => {
            modal.style.display = 'block';
            this.showForm('register');
        });

        // Close modal
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });

        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });

        // Switch forms
        authTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                this.showForm(tab.dataset.tab);
            });
        });

        // Handle form submissions
        loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        logoutBtn.addEventListener('click', () => this.handleLogout());
    }

    showForm(type) {
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        const tabs = document.querySelectorAll('.auth-tabs .tab');

        if (type === 'login') {
            loginForm.style.display = 'block';
            registerForm.style.display = 'none';
            tabs[0].classList.add('active');
            tabs[1].classList.remove('active');
        } else {
            loginForm.style.display = 'none';
            registerForm.style.display = 'block';
            tabs[0].classList.remove('active');
            tabs[1].classList.add('active');
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error);
            }

            this.setSession(data.token, data.user);
            document.getElementById('authModal').style.display = 'none';
            this.updateUI();
        } catch (error) {
            alert(error.message);
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        const username = document.getElementById('registerUsername').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error);
            }

            this.setSession(data.token, data.user);
            document.getElementById('authModal').style.display = 'none';
            this.updateUI();
        } catch (error) {
            alert(error.message);
        }
    }

    handleLogout() {
        this.clearSession();
        this.updateUI();
        window.location.href = '#test';
    }

    setSession(token, user) {
        this.token = token;
        this.user = user;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
    }

    clearSession() {
        this.token = null;
        this.user = null;
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    }

    updateUI() {
        const loginBtn = document.getElementById('loginBtn');
        const registerBtn = document.getElementById('registerBtn');
        const logoutBtn = document.getElementById('logoutBtn');
        const profileLink = document.getElementById('profileLink');

        if (this.token && this.user) {
            loginBtn.style.display = 'none';
            registerBtn.style.display = 'none';
            logoutBtn.style.display = 'block';
            profileLink.style.display = 'block';
        } else {
            loginBtn.style.display = 'block';
            registerBtn.style.display = 'block';
            logoutBtn.style.display = 'none';
            profileLink.style.display = 'none';
        }
    }

    getAuthHeaders() {
        return this.token ? {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
        } : {
            'Content-Type': 'application/json'
        };
    }

    isAuthenticated() {
        return !!this.token;
    }
}

const auth = new Auth(); 