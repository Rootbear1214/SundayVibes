class Camera {
    constructor(width, height) {
        this.x = 0;
        this.y = 0;
        this.width = width;
        this.height = height;
        
        // Camera following properties
        this.targetX = 0;
        this.targetY = 0;
        this.followSpeed = 0.1;
        this.leadDistance = 100; // How far ahead of player to look
        
        // Camera bounds
        this.minX = 0;
        this.maxX = 0;
        this.minY = 0;
        this.maxY = 0;
        
        // Smoothing
        this.smoothing = true;
    }

    setBounds(worldWidth, worldHeight) {
        this.maxX = Math.max(0, worldWidth - this.width);
        this.maxY = Math.max(0, worldHeight - this.height);
    }

    follow(player) {
        // Calculate target position with leading
        const leadX = player.facing * this.leadDistance;
        this.targetX = player.getCenterX() - this.width / 2 + leadX;
        this.targetY = player.getCenterY() - this.height / 2;

        // Apply smoothing
        if (this.smoothing) {
            this.x += (this.targetX - this.x) * this.followSpeed;
            this.y += (this.targetY - this.y) * this.followSpeed;
        } else {
            this.x = this.targetX;
            this.y = this.targetY;
        }

        // Clamp to world bounds
        this.x = Math.max(this.minX, Math.min(this.maxX, this.x));
        this.y = Math.max(this.minY, Math.min(this.maxY, this.y));
    }

    // Check if a rectangle is visible on screen
    isVisible(x, y, width, height) {
        return x + width >= this.x && 
               x <= this.x + this.width &&
               y + height >= this.y && 
               y <= this.y + this.height;
    }

    // Convert world coordinates to screen coordinates
    worldToScreen(worldX, worldY) {
        return {
            x: worldX - this.x,
            y: worldY - this.y
        };
    }

    // Convert screen coordinates to world coordinates
    screenToWorld(screenX, screenY) {
        return {
            x: screenX + this.x,
            y: screenY + this.y
        };
    }

    // Shake effect for impacts/explosions
    shake(intensity = 5, duration = 10) {
        this.shakeIntensity = intensity;
        this.shakeDuration = duration;
        this.shakeTimer = duration;
    }

    update() {
        // Handle camera shake
        if (this.shakeTimer > 0) {
            this.shakeTimer--;
            const shakeX = (Math.random() - 0.5) * this.shakeIntensity;
            const shakeY = (Math.random() - 0.5) * this.shakeIntensity;
            
            this.x += shakeX;
            this.y += shakeY;
            
            // Reduce shake intensity over time
            this.shakeIntensity *= 0.9;
        }
    }

    // Instantly snap to target (useful for scene transitions)
    snapTo(x, y) {
        this.x = x;
        this.y = y;
        this.targetX = x;
        this.targetY = y;
    }

    // Set camera follow speed (0 = instant, 1 = very slow)
    setFollowSpeed(speed) {
        this.followSpeed = Math.max(0, Math.min(1, speed));
    }

    // Enable/disable smoothing
    setSmoothing(enabled) {
        this.smoothing = enabled;
    }

    // Get camera center position
    getCenterX() {
        return this.x + this.width / 2;
    }

    getCenterY() {
        return this.y + this.height / 2;
    }
}
