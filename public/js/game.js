class DogRescueGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.startButton = document.getElementById('startGame');
        this.scoreDisplay = document.getElementById('gameScore');
        this.highScoreDisplay = document.getElementById('highScore');

        this.isRunning = false;
        this.score = 0;
        this.gameLoop = null;
        this.lastFrame = 0;
        this.obstacles = [];
        this.dogs = [];
        this.player = {
            x: 50,
            y: this.canvas.height - 60,
            width: 40,
            height: 40,
            speed: 5,
            jumping: false,
            jumpForce: 15,
            gravity: 0.8,
            velocityY: 0
        };

        this.keys = {
            ArrowLeft: false,
            ArrowRight: false,
            Space: false
        };

        this.setupCanvas();
        this.setupEventListeners();
        this.loadHighScore();
    }

    setupCanvas() {
        // Make canvas responsive
        const resize = () => {
            this.canvas.width = this.canvas.parentElement.clientWidth;
            this.canvas.height = 400;
            this.player.y = this.canvas.height - 60;
        };
        
        resize();
        window.addEventListener('resize', resize);
    }

    setupEventListeners() {
        this.startButton.addEventListener('click', () => this.startGame());

        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (e.code in this.keys) {
                this.keys[e.code] = true;
                if (e.code === 'Space') {
                    e.preventDefault();
                }
            }
        });

        document.addEventListener('keyup', (e) => {
            if (e.code in this.keys) {
                this.keys[e.code] = false;
            }
        });

        // Touch controls
        let touchStartX = 0;
        this.canvas.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            this.keys.Space = true;
        });

        this.canvas.addEventListener('touchmove', (e) => {
            const touchX = e.touches[0].clientX;
            const diff = touchX - touchStartX;
            
            this.keys.ArrowLeft = diff < -30;
            this.keys.ArrowRight = diff > 30;
        });

        this.canvas.addEventListener('touchend', () => {
            this.keys.ArrowLeft = false;
            this.keys.ArrowRight = false;
            this.keys.Space = false;
        });
    }

    loadHighScore() {
        if (auth.isAuthenticated()) {
            const user = JSON.parse(localStorage.getItem('user'));
            this.highScoreDisplay.textContent = user.gameStats?.highScore || '0';
        } else {
            this.highScoreDisplay.textContent = '0';
        }
    }

    startGame() {
        if (this.isRunning) return;

        this.isRunning = true;
        this.score = 0;
        this.obstacles = [];
        this.dogs = [];
        this.player.x = 50;
        this.player.y = this.canvas.height - 60;
        this.player.velocityY = 0;
        this.scoreDisplay.textContent = '0';
        this.startButton.textContent = 'Running...';

        this.lastFrame = performance.now();
        this.gameLoop = requestAnimationFrame((timestamp) => this.update(timestamp));
    }

    update(timestamp) {
        const deltaTime = (timestamp - this.lastFrame) / 1000;
        this.lastFrame = timestamp;

        this.updatePlayer(deltaTime);
        this.updateObstacles(deltaTime);
        this.updateDogs(deltaTime);
        this.checkCollisions();
        this.draw();

        if (this.isRunning) {
            this.gameLoop = requestAnimationFrame((timestamp) => this.update(timestamp));
        }
    }

    updatePlayer(deltaTime) {
        // Horizontal movement
        if (this.keys.ArrowLeft) {
            this.player.x -= this.player.speed * deltaTime * 60;
        }
        if (this.keys.ArrowRight) {
            this.player.x += this.player.speed * deltaTime * 60;
        }

        // Keep player in bounds
        this.player.x = Math.max(0, Math.min(this.canvas.width - this.player.width, this.player.x));

        // Jumping
        if (this.keys.Space && !this.player.jumping) {
            this.player.velocityY = -this.player.jumpForce;
            this.player.jumping = true;
        }

        // Apply gravity
        this.player.velocityY += this.player.gravity;
        this.player.y += this.player.velocityY;

        // Ground collision
        if (this.player.y > this.canvas.height - this.player.height) {
            this.player.y = this.canvas.height - this.player.height;
            this.player.velocityY = 0;
            this.player.jumping = false;
        }
    }

    updateObstacles(deltaTime) {
        // Add new obstacles
        if (Math.random() < 0.02) {
            this.obstacles.push({
                x: this.canvas.width,
                y: this.canvas.height - 30,
                width: 30,
                height: 30,
                speed: 4
            });
        }

        // Move obstacles
        this.obstacles.forEach(obstacle => {
            obstacle.x -= obstacle.speed * deltaTime * 60;
        });

        // Remove off-screen obstacles
        this.obstacles = this.obstacles.filter(obstacle => obstacle.x > -obstacle.width);
    }

    updateDogs(deltaTime) {
        // Add new dogs to rescue
        if (Math.random() < 0.01) {
            this.dogs.push({
                x: this.canvas.width,
                y: Math.random() * (this.canvas.height - 100),
                width: 30,
                height: 30,
                speed: 3
            });
        }

        // Move dogs
        this.dogs.forEach(dog => {
            dog.x -= dog.speed * deltaTime * 60;
        });

        // Remove off-screen dogs
        this.dogs = this.dogs.filter(dog => dog.x > -dog.width);
    }

    checkCollisions() {
        // Check obstacle collisions
        for (const obstacle of this.obstacles) {
            if (this.checkCollision(this.player, obstacle)) {
                this.endGame();
                return;
            }
        }

        // Check dog rescues
        for (let i = this.dogs.length - 1; i >= 0; i--) {
            if (this.checkCollision(this.player, this.dogs[i])) {
                this.dogs.splice(i, 1);
                this.score += 100;
                this.scoreDisplay.textContent = this.score;
            }
        }
    }

    checkCollision(a, b) {
        return a.x < b.x + b.width &&
               a.x + a.width > b.x &&
               a.y < b.y + b.height &&
               a.y + a.height > b.y;
    }

    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw ground
        this.ctx.fillStyle = '#90EE90';
        this.ctx.fillRect(0, this.canvas.height - 20, this.canvas.width, 20);

        // Draw player
        this.ctx.fillStyle = '#4A90E2';
        this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);

        // Draw obstacles
        this.ctx.fillStyle = '#E74C3C';
        this.obstacles.forEach(obstacle => {
            this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        });

        // Draw dogs
        this.ctx.fillStyle = '#F1C40F';
        this.dogs.forEach(dog => {
            this.ctx.fillRect(dog.x, dog.y, dog.width, dog.height);
        });
    }

    async endGame() {
        this.isRunning = false;
        cancelAnimationFrame(this.gameLoop);
        this.startButton.textContent = 'Start Game';

        // Submit score if authenticated
        if (auth.isAuthenticated()) {
            try {
                const response = await fetch('/api/game/score', {
                    method: 'POST',
                    headers: auth.getAuthHeaders(),
                    body: JSON.stringify({ score: this.score })
                });

                const data = await response.json();
                
                // Update high score display
                if (data.gameStats.highScore > parseInt(this.highScoreDisplay.textContent)) {
                    this.highScoreDisplay.textContent = data.gameStats.highScore;
                }

                // Show achievement notification if any new achievements
                if (data.achievements) {
                    const newAchievements = data.achievements.filter(a => {
                        const earnedDate = new Date(a.dateEarned);
                        return earnedDate > this.lastFrame;
                    });

                    if (newAchievements.length > 0) {
                        this.showAchievementNotification(newAchievements);
                    }
                }
            } catch (error) {
                console.error('Error submitting game score:', error);
            }
        } else {
            alert('Sign in to save your high score and earn achievements!');
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

            setTimeout(() => {
                notification.remove();
            }, 5000);
        });
    }
}

const game = new DogRescueGame(); 