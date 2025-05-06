class TypingTest {
    constructor() {
        this.textDisplay = document.getElementById('textDisplay');
        this.textInput = document.getElementById('textInput');
        this.timeDisplay = document.getElementById('time');
        this.wpmDisplay = document.getElementById('wpm');
        this.accuracyDisplay = document.getElementById('accuracy');
        this.startButton = document.getElementById('startTest');
        this.timeSelect = document.getElementById('timeLimit');

        this.currentText = '';
        this.timeLeft = 0;
        this.timer = null;
        this.isRunning = false;
        this.startTime = null;
        this.totalCharacters = 0;
        this.correctCharacters = 0;

        this.setupEventListeners();
    }

    setupEventListeners() {
        this.startButton.addEventListener('click', () => this.startTest());
        this.textInput.addEventListener('input', () => this.checkInput());
    }

    async startTest() {
        if (this.isRunning) return;

        try {
            const response = await fetch('/api/test/text');
            const data = await response.json();
            this.currentText = data.text;
            this.textDisplay.textContent = this.currentText;
            this.textInput.value = '';
            this.textInput.disabled = false;
            this.textInput.focus();

            this.timeLeft = parseInt(this.timeSelect.value);
            this.timeDisplay.textContent = this.formatTime(this.timeLeft);
            this.wpmDisplay.textContent = '0';
            this.accuracyDisplay.textContent = '0%';

            this.isRunning = true;
            this.startTime = Date.now();
            this.totalCharacters = 0;
            this.correctCharacters = 0;

            this.timer = setInterval(() => this.updateTimer(), 1000);
            this.startButton.textContent = 'Running...';
        } catch (error) {
            console.error('Error fetching text:', error);
            alert('Error starting test. Please try again.');
        }
    }

    checkInput() {
        if (!this.isRunning) return;

        const inputText = this.textInput.value;
        const currentLength = inputText.length;
        let correct = 0;

        for (let i = 0; i < currentLength; i++) {
            if (inputText[i] === this.currentText[i]) {
                correct++;
            }
        }

        this.totalCharacters = currentLength;
        this.correctCharacters = correct;

        // Update WPM and accuracy in real-time
        this.updateStats();

        // Check if text is completed
        if (inputText === this.currentText) {
            this.endTest();
        }
    }

    updateTimer() {
        this.timeLeft--;
        this.timeDisplay.textContent = this.formatTime(this.timeLeft);

        if (this.timeLeft <= 0) {
            this.endTest();
        }
    }

    updateStats() {
        // Calculate WPM
        const timeElapsed = (Date.now() - this.startTime) / 1000 / 60; // in minutes
        const wordsTyped = this.totalCharacters / 5; // assume average word length of 5
        const wpm = Math.round(wordsTyped / timeElapsed);

        // Calculate accuracy
        const accuracy = this.totalCharacters > 0
            ? Math.round((this.correctCharacters / this.totalCharacters) * 100)
            : 0;

        this.wpmDisplay.textContent = wpm.toString();
        this.accuracyDisplay.textContent = accuracy + '%';
    }

    async endTest() {
        clearInterval(this.timer);
        this.isRunning = false;
        this.textInput.disabled = true;
        this.startButton.textContent = 'Start Test';

        // Calculate final stats
        const timeElapsed = (Date.now() - this.startTime) / 1000 / 60;
        const wordsTyped = this.totalCharacters / 5;
        const wpm = Math.round(wordsTyped / timeElapsed);
        const accuracy = Math.round((this.correctCharacters / this.totalCharacters) * 100);

        // Submit results if user is authenticated
        if (auth.isAuthenticated()) {
            try {
                const response = await fetch('/api/test/submit', {
                    method: 'POST',
                    headers: auth.getAuthHeaders(),
                    body: JSON.stringify({
                        wpm,
                        accuracy,
                        timeLimit: parseInt(this.timeSelect.value)
                    })
                });

                const data = await response.json();

                // Show achievement notification if any new achievements
                if (data.achievements && data.achievements.length > 0) {
                    const newAchievements = data.achievements.filter(a => {
                        const earnedDate = new Date(a.dateEarned);
                        return earnedDate > this.startTime;
                    });

                    if (newAchievements.length > 0) {
                        this.showAchievementNotification(newAchievements);
                    }
                }
            } catch (error) {
                console.error('Error submitting test results:', error);
            }
        } else {
            // Show login prompt
            alert('Sign in to save your results and track your progress!');
        }
    }

    showAchievementNotification(achievements) {
        achievements.forEach(achievement => {
            const notification = document.createElement('div');
            notification.className = 'achievement-notification';
            notification.innerHTML = `
                <div class="achievement-badge">${achievement.badge}</div>
                <div class="achievement-details">
                    <h3>${achievement.name}</h3>
                    <p>${achievement.description}</p>
                </div>
            `;

            document.body.appendChild(notification);

            // Remove notification after 5 seconds
            setTimeout(() => {
                notification.remove();
            }, 5000);
        });
    }

    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
}

const typingTest = new TypingTest(); 