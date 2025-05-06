class Profile {
    constructor() {
        this.profileUsername = document.getElementById('profileUsername');
        this.profileEmail = document.getElementById('profileEmail');
        this.editProfileBtn = document.getElementById('editProfile');
        this.avgWpm = document.getElementById('avgWpm');
        this.highestWpm = document.getElementById('highestWpm');
        this.testsCompleted = document.getElementById('testsCompleted');
        this.avgAccuracy = document.getElementById('avgAccuracy');
        this.achievementsList = document.getElementById('achievementsList');
        this.historyTable = document.getElementById('historyTable').querySelector('tbody');

        this.setupEventListeners();
    }

    setupEventListeners() {
        this.editProfileBtn.addEventListener('click', () => this.showEditProfileModal());
        document.addEventListener('profileUpdated', () => this.loadProfile());
    }

    async loadProfile() {
        if (!auth.isAuthenticated()) {
            window.location.href = '#test';
            return;
        }

        try {
            const response = await fetch('/api/user/profile', {
                headers: auth.getAuthHeaders()
            });

            const user = await response.json();
            this.updateProfileUI(user);
        } catch (error) {
            console.error('Error loading profile:', error);
        }
    }

    updateProfileUI(user) {
        // Update basic info
        this.profileUsername.textContent = user.username;
        this.profileEmail.textContent = user.email;

        // Update stats
        this.avgWpm.textContent = user.stats.averageWPM.toFixed(1);
        this.highestWpm.textContent = user.stats.highestWPM;
        this.testsCompleted.textContent = user.stats.totalTests;
        this.avgAccuracy.textContent = user.stats.averageAccuracy.toFixed(1) + '%';

        // Update achievements
        this.achievementsList.innerHTML = '';
        user.achievements.forEach(achievement => {
            const achievementCard = document.createElement('div');
            achievementCard.className = 'achievement-card';
            achievementCard.innerHTML = `
                <div class="badge">${achievement.badge}</div>
                <h4>${achievement.name}</h4>
                <p>${achievement.description}</p>
                <small>${new Date(achievement.dateEarned).toLocaleDateString()}</small>
            `;
            this.achievementsList.appendChild(achievementCard);
        });

        // Update test history
        this.historyTable.innerHTML = '';
        user.testHistory.slice().reverse().forEach(test => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${new Date(test.date).toLocaleDateString()}</td>
                <td>${test.wpm}</td>
                <td>${test.accuracy}%</td>
                <td>${test.timeLimit}s</td>
            `;
            this.historyTable.appendChild(row);
        });
    }

    showEditProfileModal() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close">&times;</span>
                <h2>Edit Profile</h2>
                <form id="editProfileForm">
                    <div class="form-group">
                        <label for="editName">Name</label>
                        <input type="text" id="editName" value="${auth.user.profile?.name || ''}">
                    </div>
                    <div class="form-group">
                        <label for="editBio">Bio</label>
                        <textarea id="editBio">${auth.user.profile?.bio || ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label>Theme</label>
                        <select id="editTheme">
                            <option value="light" ${auth.user.preferences?.theme === 'light' ? 'selected' : ''}>Light</option>
                            <option value="dark" ${auth.user.preferences?.theme === 'dark' ? 'selected' : ''}>Dark</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Gender</label>
                        <select id="editGender">
                            <option value="male" ${auth.user.preferences?.gender === 'male' ? 'selected' : ''}>Male</option>
                            <option value="female" ${auth.user.preferences?.gender === 'female' ? 'selected' : ''}>Female</option>
                            <option value="other" ${auth.user.preferences?.gender === 'other' ? 'selected' : ''}>Other</option>
                        </select>
                    </div>
                    <button type="submit" class="btn btn-primary">Save Changes</button>
                </form>
            </div>
        `;

        document.body.appendChild(modal);

        const closeBtn = modal.querySelector('.close');
        const form = modal.querySelector('#editProfileForm');

        closeBtn.addEventListener('click', () => {
            modal.remove();
        });

        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const updates = {
                profile: {
                    name: document.getElementById('editName').value,
                    bio: document.getElementById('editBio').value
                },
                preferences: {
                    theme: document.getElementById('editTheme').value,
                    gender: document.getElementById('editGender').value
                }
            };

            try {
                const response = await fetch('/api/user/profile', {
                    method: 'PATCH',
                    headers: auth.getAuthHeaders(),
                    body: JSON.stringify(updates)
                });

                const updatedUser = await response.json();
                auth.user = updatedUser;
                localStorage.setItem('user', JSON.stringify(updatedUser));

                // Update theme
                document.body.setAttribute('data-theme', updatedUser.preferences.theme);

                modal.remove();
                this.loadProfile();
            } catch (error) {
                console.error('Error updating profile:', error);
                alert('Error updating profile. Please try again.');
            }
        });
    }
}

const profile = new Profile(); 