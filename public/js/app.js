class App {
    constructor() {
        this.sections = document.querySelectorAll('.section');
        this.navLinks = document.querySelectorAll('.nav-links a');
        this.leaderboardTabs = document.querySelectorAll('.leaderboard-tabs .tab');
        this.leaderboardTable = document.getElementById('leaderboardTable').querySelector('tbody');

        this.setupEventListeners();
        this.handleNavigation();
        this.loadTheme();
    }

    setupEventListeners() {
        // Navigation
        this.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.getAttribute('data-section');
                window.location.hash = section;
            });
        });

        // Leaderboard tabs
        this.leaderboardTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                this.switchLeaderboard(tab.getAttribute('data-type'));
            });
        });

        // Handle navigation changes
        window.addEventListener('hashchange', () => this.handleNavigation());
    }

    handleNavigation() {
        const hash = window.location.hash.slice(1) || 'test';

        // Update active section
        this.sections.forEach(section => {
            section.classList.remove('active');
            if (section.id === hash) {
                section.classList.add('active');
            }
        });

        // Update active nav link
        this.navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-section') === hash) {
                link.classList.add('active');
            }
        });

        // Load section-specific content
        switch (hash) {
            case 'profile':
                if (!auth.isAuthenticated()) {
                    window.location.hash = 'test';
                    return;
                }
                profile.loadProfile();
                break;
            case 'leaderboard':
                this.loadLeaderboard('typing');
                break;
        }
    }

    async loadLeaderboard(type) {
        try {
            const endpoint = type === 'typing' ? '/api/user/leaderboard' : '/api/game/leaderboard';
            const response = await fetch(endpoint);
            const users = await response.json();

            this.leaderboardTable.innerHTML = '';
            users.forEach((user, index) => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${user.username}</td>
                    <td>${type === 'typing' ? user.stats.highestWPM : user.gameStats.highScore}</td>
                    <td>${type === 'typing' ? user.stats.totalTests : user.gameStats.gamesPlayed}</td>
                `;
                this.leaderboardTable.appendChild(row);
            });

            // Update table headers
            const headers = document.querySelector('#leaderboardTable thead tr');
            headers.innerHTML = `
                <th>Rank</th>
                <th>Username</th>
                <th>${type === 'typing' ? 'WPM' : 'Score'}</th>
                <th>${type === 'typing' ? 'Tests' : 'Games'}</th>
            `;
        } catch (error) {
            console.error('Error loading leaderboard:', error);
        }
    }

    switchLeaderboard(type) {
        this.leaderboardTabs.forEach(tab => {
            tab.classList.toggle('active', tab.getAttribute('data-type') === type);
        });
        this.loadLeaderboard(type);
    }

    loadTheme() {
        if (auth.isAuthenticated()) {
            const theme = auth.user.preferences?.theme || 'light';
            document.body.setAttribute('data-theme', theme);
        }
    }
}

// Initialize the application
const app = new App(); 