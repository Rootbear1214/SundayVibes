class Platform {
    constructor(x, y, width, height, type = 'solid') {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.type = type; // 'solid', 'jumpthrough', 'moving', 'breakable'
        this.color = this.getColorByType();
        
        // For moving platforms
        this.originalX = x;
        this.originalY = y;
        this.moveSpeed = 1;
        this.moveRange = 100;
        this.moveDirection = 1;
    }

    getColorByType() {
        switch (this.type) {
            case 'solid': return '#8B4513'; // Brown
            case 'jumpthrough': return '#32CD32'; // Lime green
            case 'moving': return '#FF6347'; // Tomato
            case 'breakable': return '#DDA0DD'; // Plum
            default: return '#8B4513';
        }
    }

    update() {
        if (this.type === 'moving') {
            this.x += this.moveSpeed * this.moveDirection;
            
            // Reverse direction when reaching move range
            if (Math.abs(this.x - this.originalX) >= this.moveRange) {
                this.moveDirection *= -1;
            }
        }
    }

    render(ctx, camera) {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        // Only render if on screen
        if (screenX + this.width >= 0 && screenX <= camera.width &&
            screenY + this.height >= 0 && screenY <= camera.height) {
            
            ctx.fillStyle = this.color;
            ctx.fillRect(screenX, screenY, this.width, this.height);
            
            // Add border for better visibility
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.strokeRect(screenX, screenY, this.width, this.height);
        }
    }
}

class World {
    constructor() {
        this.platforms = [];
        this.width = 2400; // World is wider than screen for scrolling
        this.height = 600;
        this.spawnX = 100;
        this.spawnY = 510; // Just above the ground platform (550 - 40 player height)
        
        this.createInitialPlatforms();
    }

    createInitialPlatforms() {
        // Ground platforms
        this.platforms.push(new Platform(0, 550, 400, 50, 'solid'));
        this.platforms.push(new Platform(500, 550, 300, 50, 'solid'));
        this.platforms.push(new Platform(900, 550, 400, 50, 'solid'));
        this.platforms.push(new Platform(1400, 550, 300, 50, 'solid'));
        this.platforms.push(new Platform(1800, 550, 600, 50, 'solid'));

        // Mid-level platforms
        this.platforms.push(new Platform(200, 450, 150, 20, 'jumpthrough'));
        this.platforms.push(new Platform(450, 400, 100, 20, 'solid'));
        this.platforms.push(new Platform(650, 350, 120, 20, 'jumpthrough'));
        this.platforms.push(new Platform(850, 300, 100, 20, 'solid'));
        this.platforms.push(new Platform(1100, 400, 150, 20, 'jumpthrough'));
        this.platforms.push(new Platform(1350, 350, 100, 20, 'solid'));
        this.platforms.push(new Platform(1550, 300, 120, 20, 'jumpthrough'));

        // High platforms
        this.platforms.push(new Platform(300, 250, 100, 20, 'solid'));
        this.platforms.push(new Platform(500, 200, 80, 20, 'jumpthrough'));
        this.platforms.push(new Platform(750, 150, 100, 20, 'solid'));
        this.platforms.push(new Platform(1000, 200, 120, 20, 'jumpthrough'));
        this.platforms.push(new Platform(1250, 150, 100, 20, 'solid'));
        this.platforms.push(new Platform(1500, 100, 150, 20, 'jumpthrough'));

        // Moving platforms
        this.platforms.push(new Platform(600, 480, 80, 20, 'moving'));
        this.platforms.push(new Platform(1200, 250, 80, 20, 'moving'));

        // Floating islands
        this.platforms.push(new Platform(400, 100, 60, 20, 'solid'));
        this.platforms.push(new Platform(800, 80, 80, 20, 'solid'));
        this.platforms.push(new Platform(1600, 50, 100, 20, 'solid'));

        // Challenge gaps and vertical sections
        this.platforms.push(new Platform(50, 350, 60, 20, 'jumpthrough'));
        this.platforms.push(new Platform(50, 250, 60, 20, 'jumpthrough'));
        this.platforms.push(new Platform(50, 150, 60, 20, 'jumpthrough'));
    }

    update() {
        // Update all platforms (mainly for moving platforms)
        this.platforms.forEach(platform => {
            platform.update();
        });
    }

    render(ctx, camera) {
        // Render background
        ctx.fillStyle = '#87CEEB'; // Sky blue
        ctx.fillRect(0, 0, camera.width, camera.height);

        // Render all platforms
        this.platforms.forEach(platform => {
            platform.render(ctx, camera);
        });
    }

    // Check collisions between player and platforms
    checkCollisions(player, physics) {
        player.onGround = false;

        this.platforms.forEach(platform => {
            if (physics.checkCollision(player, platform)) {
                // Handle different platform types
                if (platform.type === 'jumpthrough') {
                    // Only collide if player is falling and above the platform
                    if (player.velocityY > 0 && player.y < platform.y) {
                        player.y = platform.y - player.height;
                        player.velocityY = 0;
                        player.onGround = true;
                    }
                } else {
                    // Solid platform - full collision resolution
                    physics.resolveCollision(player, platform);
                }
            }
        });

        // Check world bounds
        physics.checkWorldBounds(player, this.width, this.height);
    }

    // Get spawn position
    getSpawnPosition() {
        return { x: this.spawnX, y: this.spawnY };
    }

    // Add a new platform (for future level editing)
    addPlatform(x, y, width, height, type = 'solid') {
        this.platforms.push(new Platform(x, y, width, height, type));
    }

    // Remove platforms (for breakable platforms)
    removePlatform(platform) {
        const index = this.platforms.indexOf(platform);
        if (index > -1) {
            this.platforms.splice(index, 1);
        }
    }
}
