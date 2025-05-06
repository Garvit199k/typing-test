class Auth {
    constructor() {
        this.token = localStorage.getItem('token');
        this.user = JSON.parse(localStorage.getItem('user'));
        this.setupEventListeners();
        this.updateUI();
    }

    setupEventListeners() {
        // Auth modal
        const authModal = document.getElementById('authModal');
        const welcomeLoginBtn = document.querySelector('.welcome-login');
        const welcomeRegisterBtn = document.querySelector('.welcome-register');
        const logoutBtn = document.getElementById('logoutBtn');
        const closeBtn = authModal.querySelector('.close');
        const tabs = authModal.querySelectorAll('.tab');

        // Show modal
        welcomeLoginBtn.addEventListener('click', () => this.showModal('login'));
        welcomeRegisterBtn.addEventListener('click', () => this.showModal('register'));

        // Close modal
        closeBtn.addEventListener('click', () => this.hideModal());
        window.addEventListener('click', (e) => {
            if (e.target === authModal) this.hideModal();
        });

        // Tab switching
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                const forms = authModal.querySelectorAll('.auth-form');
                forms.forEach(form => form.style.display = 'none');
                const formToShow = tab.dataset.tab === 'login' ? 'loginForm' : 'registerForm';
                document.getElementById(formToShow).style.display = 'block';
            });
        });

        // Form submissions
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.login();
        });

        document.getElementById('registerForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.register();
        });

        // Logout
        logoutBtn.addEventListener('click', () => this.logout());
    }

    showModal(tab = 'login') {
        const authModal = document.getElementById('authModal');
        const tabs = authModal.querySelectorAll('.tab');
        const forms = authModal.querySelectorAll('.auth-form');

        // Reset any previous error states
        this.clearErrors();
        
        tabs.forEach(t => t.classList.remove('active'));
        forms.forEach(form => form.style.display = 'none');

        const activeTab = authModal.querySelector(`[data-tab="${tab}"]`);
        const activeForm = document.getElementById(`${tab}Form`);

        activeTab.classList.add('active');
        activeForm.style.display = 'block';
        authModal.style.display = 'block';
    }

    hideModal() {
        const authModal = document.getElementById('authModal');
        this.clearErrors();
        document.getElementById('loginForm').reset();
        document.getElementById('registerForm').reset();
        authModal.style.display = 'none';
    }

    clearErrors() {
        const errorMessages = document.querySelectorAll('.error-message');
        errorMessages.forEach(msg => msg.remove());
        const errorInputs = document.querySelectorAll('.error');
        errorInputs.forEach(input => input.classList.remove('error'));
    }

    showError(inputElement, message) {
        this.clearErrors();
        inputElement.classList.add('error');
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        inputElement.parentNode.appendChild(errorDiv);
    }

    setLoading(form, isLoading) {
        const submitBtn = form.querySelector('button[type="submit"]');
        if (isLoading) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
        } else {
            submitBtn.disabled = false;
            submitBtn.innerHTML = form.id === 'loginForm' ? 
                '<i class="fas fa-sign-in-alt"></i> Login' : 
                '<i class="fas fa-user-plus"></i> Register';
        }
    }

    async login() {
        const form = document.getElementById('loginForm');
        const username = document.getElementById('loginUsername');
        const password = document.getElementById('loginPassword');

        // Validation
        if (!username.value.trim()) {
            this.showError(username, 'Username is required');
            return;
        }
        if (!password.value) {
            this.showError(password, 'Password is required');
            return;
        }

        this.setLoading(form, true);

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    username: username.value.trim(), 
                    password: password.value 
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Invalid username or password');
            }

            this.setSession(data.token, data.user);
            this.hideModal();
            this.updateUI();
            location.reload();
        } catch (error) {
            this.showError(username, error.message);
        } finally {
            this.setLoading(form, false);
        }
    }

    async register() {
        const form = document.getElementById('registerForm');
        const username = document.getElementById('registerUsername');
        const password = document.getElementById('registerPassword');
        const gender = document.querySelector('input[name="gender"]:checked');

        // Validation
        if (!username.value.trim()) {
            this.showError(username, 'Username is required');
            return;
        }
        if (!password.value) {
            this.showError(password, 'Password is required');
            return;
        }
        if (password.value.length < 6) {
            this.showError(password, 'Password must be at least 6 characters');
            return;
        }
        if (!gender) {
            this.showError(document.querySelector('.gender-select'), 'Please select a theme');
            return;
        }

        this.setLoading(form, true);

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: username.value.trim(),
                    password: password.value,
                    gender: gender.value
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Registration failed');
            }

            this.setSession(data.token, data.user);
            this.hideModal();
            this.updateUI();
            location.reload();
        } catch (error) {
            this.showError(username, error.message);
        } finally {
            this.setLoading(form, false);
        }
    }

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        this.token = null;
        this.user = null;
        this.updateUI();
        location.reload(); // Refresh to remove theme
    }

    setSession(token, user) {
        this.token = token;
        this.user = user;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
    }

    updateUI() {
        const isAuthenticated = !!this.token;
        document.getElementById('logoutBtn').style.display = isAuthenticated ? 'block' : 'none';
        document.getElementById('mainNavLinks').style.display = isAuthenticated ? 'flex' : 'none';
        document.getElementById('welcome').style.display = isAuthenticated ? 'none' : 'block';
        document.getElementById('mainContent').style.display = isAuthenticated ? 'block' : 'none';

        // Apply theme based on user gender
        if (this.user?.gender) {
            document.body.setAttribute('data-theme', this.user.gender);
        } else {
            document.body.removeAttribute('data-theme');
        }
    }

    isAuthenticated() {
        return !!this.token;
    }

    getAuthHeaders() {
        return {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
        };
    }

    getUserId() {
        return this.user?._id;
    }
}

const auth = new Auth(); 