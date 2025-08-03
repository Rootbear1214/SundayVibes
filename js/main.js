class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Game objects
        this.input = new InputHandler();
        this.physics = new Physics();
        this.world = new World();
        this.camera = new Camera(this.canvas.width, this.canvas.height);
        
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
        // Update game objects
        this.player.update(this.input, this.physics);
        this.world.update();
        
        // Handle collisions
        this.world.checkCollisions(this.player, this.physics);
        
        // Update camera to follow player
        this.camera.follow(this.player);
        this.camera.update();
        
        // Check for player reset (fell off world)
        if (this.player.y > this.world.height + 100) {
            this.resetPlayer();
        }
    }

    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Render world (includes background and platforms)
        this.world.render(this.ctx, this.camera);
        
        // Render player
        this.player.render(this.ctx, this.camera);
        
        // Render UI
        this.renderUI();
        
        // Render debug info if enabled
        if (this.showDebug) {
            this.renderDebug();
        }
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
        this.ctx.fillText(`Player Facing: ${this.player.facing > 0 ? 'Right' : 'Left'}`, this.canvas.width - 210, 90);
        this.ctx.fillText(`Attacking: ${this.player.isAttacking}`, this.canvas.width - 210, 105);
        this.ctx.fillText(`Press F1 to toggle debug`, this.canvas.width - 210, 120);
        
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
        
        this.ctx.restore();
    }

    resetPlayer() {
        const spawn = this.world.getSpawnPosition();
        this.player.reset(spawn.x, spawn.y);
        console.log('Player reset to spawn position');
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
