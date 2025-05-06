class TypingTest {
    constructor() {
        // Wait for elements to be available
        const initInterval = setInterval(() => {
            if (document.getElementById('mainContent').style.display !== 'none') {
                this.initializeElements();
                clearInterval(initInterval);
            }
        }, 100);
    }

    initializeElements() {
        this.textDisplay = document.getElementById('textDisplay');
        this.textInput = document.getElementById('textInput');
        this.timeDisplay = document.getElementById('time');
        this.wpmDisplay = document.getElementById('wpm');
        this.accuracyDisplay = document.getElementById('accuracy');
        this.startButton = document.getElementById('startTest');
        this.timeSelect = document.getElementById('timeLimit');
        this.victoryModal = document.getElementById('victoryModal');
        this.finalWpmDisplay = document.getElementById('finalWpm');
        this.finalAccuracyDisplay = document.getElementById('finalAccuracy');
        this.tryAgainBtn = document.getElementById('tryAgainBtn');
        this.shareResultBtn = document.getElementById('shareResultBtn');

        this.currentText = '';
        this.timeLeft = 0;
        this.timer = null;
        this.isRunning = false;
        this.startTime = null;
        this.totalCharacters = 0;
        this.correctCharacters = 0;
        this.currentWordIndex = 0;

        this.setupEventListeners();
    }

    setupEventListeners() {
        this.startButton.addEventListener('click', () => this.startTest());
        this.textInput.addEventListener('input', () => this.checkInput());
        this.textInput.addEventListener('keydown', (e) => {
            if (e.key === ' ') {
                this.checkWord();
            }
        });
        this.tryAgainBtn.addEventListener('click', () => {
            this.hideVictoryModal();
            this.startTest();
        });
        this.shareResultBtn.addEventListener('click', () => this.shareResult());
        this.victoryModal.querySelector('.close').addEventListener('click', () => this.hideVictoryModal());
        window.addEventListener('click', (e) => {
            if (e.target === this.victoryModal) {
                this.hideVictoryModal();
            }
        });
    }

    async startTest() {
        if (this.isRunning) return;

        try {
            const response = await fetch('/api/test/text');
            const data = await response.json();
            this.currentText = data.text;
            this.displayText();
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
            this.currentWordIndex = 0;

            this.timer = setInterval(() => this.updateTimer(), 1000);
            this.startButton.textContent = 'Running...';
        } catch (error) {
            console.error('Error fetching text:', error);
            alert('Error starting test. Please try again.');
        }
    }

    displayText() {
        this.textDisplay.innerHTML = this.currentText.split(' ').map((word, index) => 
            `<span class="word" data-index="${index}">${word}</span>`
        ).join(' ');
        this.highlightCurrentWord();
    }

    highlightCurrentWord() {
        const words = this.textDisplay.getElementsByClassName('word');
        Array.from(words).forEach(word => {
            word.classList.remove('current', 'correct', 'incorrect');
        });
        
        if (words[this.currentWordIndex]) {
            words[this.currentWordIndex].classList.add('current');
        }
    }

    checkWord() {
        const words = this.currentText.split(' ');
        const currentWord = words[this.currentWordIndex];
        const typedWord = this.textInput.value.trim();

        const wordElement = this.textDisplay.querySelector(`[data-index="${this.currentWordIndex}"]`);
        if (typedWord === currentWord) {
            wordElement.classList.add('correct');
            this.correctCharacters += currentWord.length + 1; // +1 for space
        } else {
            wordElement.classList.add('incorrect');
        }

        this.totalCharacters += currentWord.length + 1;
        this.currentWordIndex++;
        this.textInput.value = '';
        this.highlightCurrentWord();
        this.updateStats();
    }

    checkInput() {
        if (!this.isRunning) return;

        const words = this.currentText.split(' ');
        const currentWord = words[this.currentWordIndex];
        const typedWord = this.textInput.value;
        
        const wordElement = this.textDisplay.querySelector(`[data-index="${this.currentWordIndex}"]`);
        
        // Real-time character checking
        let correct = 0;
        for (let i = 0; i < typedWord.length; i++) {
            if (typedWord[i] === currentWord[i]) {
                correct++;
            }
        }

        // Update word highlighting
        if (typedWord.length > 0) {
            if (currentWord.startsWith(typedWord)) {
                wordElement.classList.remove('incorrect');
                wordElement.classList.add('current');
            } else {
                wordElement.classList.add('incorrect');
            }
        }

        this.updateStats();
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

    showVictoryModal(wpm, accuracy) {
        this.finalWpmDisplay.textContent = wpm;
        this.finalAccuracyDisplay.textContent = accuracy + '%';
        this.victoryModal.style.display = 'block';
    }

    hideVictoryModal() {
        this.victoryModal.style.display = 'none';
    }

    async shareResult() {
        const text = `🎉 Just completed a typing test!\n🚀 WPM: ${this.finalWpmDisplay.textContent}\n🎯 Accuracy: ${this.finalAccuracyDisplay.textContent}\nTry it yourself at: [Your App URL]`;
        
        try {
            await navigator.clipboard.writeText(text);
            alert('Result copied to clipboard! Share it with your friends!');
        } catch (error) {
            this.logError('Error sharing result', error);
            alert('Could not copy to clipboard. Please try again.');
        }
    }

    async logError(message, error) {
        try {
            await fetch('/api/log/error', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(auth.isAuthenticated() ? auth.getAuthHeaders() : {})
                },
                body: JSON.stringify({
                    message,
                    error: error.message,
                    stack: error.stack,
                    timestamp: new Date().toISOString(),
                    userId: auth.isAuthenticated() ? auth.getUserId() : null,
                    userAgent: navigator.userAgent,
                    path: window.location.pathname
                })
            });
        } catch (e) {
            console.error('Error logging to server:', e);
        }
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

        // Show victory modal
        this.showVictoryModal(wpm, accuracy);

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
                this.logError('Error submitting test results', error);
                alert('Error saving your results. Please try again.');
            }
        } else {
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