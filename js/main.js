class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Game objects
        this.input = new InputHandler();
        this.physics = new Physics();
        this.world = new World();
        this.camera = new Camera(this.canvas.width, this.canvas.height);
        this.enemyManager = new EnemyManager();
        
        // Initialize player at spawn position
        const spawn = this.world.getSpawnPosition();
        this.player = new Player(spawn.x, spawn.y);
        
        // Set camera bounds
        this.camera.setBounds(this.world.width, this.world.height);
        
        // Game state
        this.isRunning = false;
        this.lastTime = 0;
        this.fps = 60;
        this.frameInterval = 1000 / this.fps;
        
        // Death system
        this.deathZone = this.world.height + 50; // Death occurs 50px below world
        this.isPlayerDead = false;
        this.deathTimer = 0;
        this.deathDuration = 220; // frames before respawn
        
        // Debug info
        this.showDebug = false;
        this.frameCount = 0;
        this.fpsCounter = 0;
        this.lastFpsTime = 0;
        
        this.init();
    }

    init() {
        // Set up canvas
        this.canvas.focus();
        
        // Add debug toggle
        document.addEventListener('keydown', (e) => {
            if (e.key === 'F1') {
                this.showDebug = !this.showDebug;
                e.preventDefault();
            }
        });
        
        // Spawn enemies in the world
        this.enemyManager.spawnEnemiesInWorld();
        
        console.log('Game initialized. Press F1 to toggle debug info.');
        console.log('Controls: A/D - Move, W - Jump, J - Punch, K - Ranged Attack');
        
        this.start();
    }

    start() {
        this.isRunning = true;
        this.lastTime = performance.now();
        this.gameLoop();
    }

    stop() {
        this.isRunning = false;
    }

    gameLoop(currentTime = performance.now()) {
        if (!this.isRunning) return;

        const deltaTime = currentTime - this.lastTime;
        
        // Maintain consistent frame rate
        if (deltaTime >= this.frameInterval) {
            this.update(deltaTime);
            this.render();
            
            this.lastTime = currentTime - (deltaTime % this.frameInterval);
            this.frameCount++;
            
            // Calculate FPS
            if (currentTime - this.lastFpsTime >= 1000) {
                this.fpsCounter = this.frameCount;
                this.frameCount = 0;
                this.lastFpsTime = currentTime;
            }
        }

        requestAnimationFrame((time) => this.gameLoop(time));
    }

    update(deltaTime) {
        // Handle death state
        if (this.isPlayerDead) {
            this.deathTimer++;
            if (this.deathTimer >= this.deathDuration) {
                this.respawnPlayer();
            }
            return; // Don't update game while player is dead
        }

        // Update game objects
        this.player.update(this.input, this.physics);
        this.world.update();
        this.enemyManager.update(this.physics, this.world.platforms, this.player);
        
        // Handle collisions
        this.world.checkCollisions(this.player, this.physics);
        
        // Check for player death from health loss
        if (this.player.isDead()) {
            this.killPlayer();
        }
        
        // Update camera to follow player
        this.camera.follow(this.player);
        this.camera.update();
        
        // Check for player death (fell into pit)
        if (this.player.y > this.deathZone) {
            this.killPlayer();
        }
    }

    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Render world (includes background and platforms)
        this.world.render(this.ctx, this.camera);
        
        // Render enemies
        this.enemyManager.render(this.ctx, this.camera);
        
        // Render player (unless dead)
        if (!this.isPlayerDead) {
            this.player.render(this.ctx, this.camera);
        }
        
        // Render death overlay if player is dead
        if (this.isPlayerDead) {
            this.renderDeathOverlay();
        }
        
        // Render UI
        this.renderUI();
        
        // Render health hearts
        this.renderHealthUI();
        
        // Render debug info if enabled
        if (this.showDebug) {
            this.renderDebug();
        }
    }

    renderDeathOverlay() {
        this.ctx.save();
        
        // Dark red overlay with fade effect
        const alpha = Math.min(0.7, this.deathTimer / 30);
        this.ctx.fillStyle = `rgba(139, 0, 0, ${alpha})`;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Death message
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 32px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('YOU DIED', this.canvas.width / 2, this.canvas.height / 2 - 20);
        
        // Respawn countdown
        const timeLeft = Math.ceil((this.deathDuration - this.deathTimer) / 60);
        this.ctx.font = '18px Arial';
        this.ctx.fillText(`Respawning in ${timeLeft}...`, this.canvas.width / 2, this.canvas.height / 2 + 20);
        
        this.ctx.restore();
    }

    renderUI() {
        // Save context state
        this.ctx.save();
        
        // UI elements are rendered in screen space (not affected by camera)
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(10, 10, 200, 60);
        
        this.ctx.fillStyle = 'white';
        this.ctx.font = '14px Arial';
        this.ctx.fillText(`Position: ${Math.round(this.player.x)}, ${Math.round(this.player.y)}`, 15, 30);
        this.ctx.fillText(`Velocity: ${Math.round(this.player.velocityX)}, ${Math.round(this.player.velocityY)}`, 15, 45);
        this.ctx.fillText(`On Ground: ${this.player.onGround}`, 15, 60);
        
        // Attack cooldowns
        if (this.player.punchCooldown > 0 || this.player.rangedCooldown > 0) {
            this.ctx.fillStyle = 'rgba(255, 0, 0, 0.7)';
            this.ctx.fillRect(10, 80, 150, 30);
            this.ctx.fillStyle = 'white';
            this.ctx.fillText(`Punch CD: ${this.player.punchCooldown}`, 15, 95);
            this.ctx.fillText(`Ranged CD: ${this.player.rangedCooldown}`, 15, 105);
        }
        
        // Restore context state
        this.ctx.restore();
    }

    renderHealthUI() {
        this.ctx.save();
        
        const heartSize = 24;
        const heartSpacing = 30;
        const startX = 20;
        const startY = this.canvas.height - 40; // Bottom left area
        
        // Draw hearts for current health
        for (let i = 0; i < this.player.maxHealth; i++) {
            const x = startX + (i * heartSpacing);
            const y = startY;
            
            if (i < this.player.health) {
                // Full heart (red)
                this.drawHeart(x, y, heartSize, '#FF0000');
            } else {
                // Empty heart (gray)
                this.drawHeart(x, y, heartSize, '#666666');
            }
        }
        
        this.ctx.restore();
    }
    
    drawHeart(x, y, size, color) {
        this.ctx.fillStyle = color;
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 2;
        
        // Draw heart shape using path
        this.ctx.beginPath();
        
        const centerX = x + size / 2;
        const centerY = y + size / 2;
        const width = size * 0.8;
        const height = size * 0.8;
        
        // Heart shape using bezier curves
        this.ctx.moveTo(centerX, centerY + height / 4);
        
        // Left curve
        this.ctx.bezierCurveTo(
            centerX - width / 2, centerY - height / 4,
            centerX - width / 2, centerY - height / 2,
            centerX, centerY - height / 8
        );
        
        // Right curve
        this.ctx.bezierCurveTo(
            centerX + width / 2, centerY - height / 2,
            centerX + width / 2, centerY - height / 4,
            centerX, centerY + height / 4
        );
        
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
    }

    renderDebug() {
        this.ctx.save();
        
        // Debug panel
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(this.canvas.width - 220, 10, 210, 120);
        
        this.ctx.fillStyle = 'lime';
        this.ctx.font = '12px monospace';
        this.ctx.fillText(`FPS: ${this.fpsCounter}`, this.canvas.width - 210, 30);
        this.ctx.fillText(`Camera: ${Math.round(this.camera.x)}, ${Math.round(this.camera.y)}`, this.canvas.width - 210, 45);
        this.ctx.fillText(`World Size: ${this.world.width}x${this.world.height}`, this.canvas.width - 210, 60);
        this.ctx.fillText(`Platforms: ${this.world.platforms.length}`, this.canvas.width - 210, 75);
        this.ctx.fillText(`Enemies: ${this.enemyManager.getEnemyCount()}`, this.canvas.width - 210, 90);
        this.ctx.fillText(`Player Facing: ${this.player.facing > 0 ? 'Right' : 'Left'}`, this.canvas.width - 210, 105);
        this.ctx.fillText(`Attacking: ${this.player.isAttacking}`, this.canvas.width - 210, 120);
        this.ctx.fillText(`Press F1 to toggle debug`, this.canvas.width - 210, 135);
        
        // Draw collision boxes
        this.ctx.strokeStyle = 'red';
        this.ctx.lineWidth = 1;
        
        // Player collision box
        const playerScreenX = this.player.x - this.camera.x;
        const playerScreenY = this.player.y - this.camera.y;
        this.ctx.strokeRect(playerScreenX, playerScreenY, this.player.width, this.player.height);
        
        // Platform collision boxes
        this.world.platforms.forEach(platform => {
            if (this.camera.isVisible(platform.x, platform.y, platform.width, platform.height)) {
                const screenX = platform.x - this.camera.x;
                const screenY = platform.y - this.camera.y;
                this.ctx.strokeRect(screenX, screenY, platform.width, platform.height);
            }
        });
        
        // Enemy collision boxes
        this.ctx.strokeStyle = 'orange';
        this.enemyManager.enemies.forEach(enemy => {
            if (!enemy.isDead && this.camera.isVisible(enemy.x, enemy.y, enemy.width, enemy.height)) {
                const screenX = enemy.x - this.camera.x;
                const screenY = enemy.y - this.camera.y;
                this.ctx.strokeRect(screenX, screenY, enemy.width, enemy.height);
            }
        });
        
        this.ctx.restore();
    }

    killPlayer() {
        if (!this.isPlayerDead) {
            this.isPlayerDead = true;
            this.deathTimer = 0;
            this.camera.shake(10, 20); // Screen shake on death
            console.log('Player died! Respawning in ' + (this.deathDuration / 60).toFixed(1) + ' seconds...');
        }
    }

    respawnPlayer() {
        const spawn = this.world.getSpawnPosition();
        this.player.reset(spawn.x, spawn.y);
        this.isPlayerDead = false;
        this.deathTimer = 0;
        
        // Respawn all enemies when player dies
        this.enemyManager.clearAllEnemies();
        this.enemyManager.spawnEnemiesInWorld();
        
        console.log('Player respawned at spawn position - enemies respawned');
    }

    resetPlayer() {
        const spawn = this.world.getSpawnPosition();
        this.player.reset(spawn.x, spawn.y);
        this.isPlayerDead = false;
        this.deathTimer = 0;
        
        // Respawn all enemies when player resets
        this.enemyManager.clearAllEnemies();
        this.enemyManager.spawnEnemiesInWorld();
        
        console.log('Player reset to spawn position - enemies respawned');
    }

    // Public methods for external control
    pause() {
        this.isRunning = false;
    }

    resume() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.lastTime = performance.now();
            this.gameLoop();
        }
    }

    restart() {
        this.resetPlayer();
        this.camera.snapTo(0, 0);
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
});

// Handle window resize
window.addEventListener('resize', () => {
    if (window.game) {
        // Could implement canvas resizing here if needed
        console.log('Window resized');
    }
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (window.game) {
        if (document.hidden) {
            window.game.pause();
        } else {
            window.game.resume();
        }
    }
});
