class MagicBlast {
    constructor(x, y, direction) {
        this.x = x;
        this.y = y;
        this.width = 20; // Increased from 8 to 20 for bigger hit box
        this.height = 12; // Increased from 4 to 12 for bigger hit box
        this.speed = 8;
        this.direction = direction; // 1 for right, -1 for left
        this.velocityX = this.speed * this.direction;
        this.velocityY = 0;
        this.active = true;
        this.maxDistance = 400; // Maximum travel distance
        this.startX = x;
        
        // Particle system
        this.particles = [];
        this.particleTimer = 0;
        this.particleSpawnRate = 2; // Spawn particles every 2 frames
    }

    update() {
        if (!this.active) return;

        // Move the blast
        this.x += this.velocityX;
        this.y += this.velocityY;

        // Check if blast has traveled too far
        const distanceTraveled = Math.abs(this.x - this.startX);
        if (distanceTraveled > this.maxDistance) {
            this.active = false;
            return;
        }

        // Spawn particles
        this.particleTimer++;
        if (this.particleTimer >= this.particleSpawnRate) {
            this.particleTimer = 0;
            this.spawnParticle();
        }

        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.update();
            
            if (!particle.active) {
                this.particles.splice(i, 1);
            }
        }
    }

    spawnParticle() {
        // Create glowing particles around the blast
        const particle = new MagicParticle(
            this.x + (Math.random() - 0.5) * this.width,
            this.y + (Math.random() - 0.5) * this.height
        );
        this.particles.push(particle);
    }

    render(ctx, camera) {
        if (!this.active) return;

        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        // Only render if on screen
        if (screenX + this.width >= 0 && screenX <= camera.width &&
            screenY + this.height >= 0 && screenY <= camera.height) {
            
            ctx.save();

            // Draw the magic blast line
            ctx.strokeStyle = '#00FFFF'; // Cyan color
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            
            // Add glow effect
            ctx.shadowColor = '#00FFFF';
            ctx.shadowBlur = 10;
            
            ctx.beginPath();
            ctx.moveTo(screenX, screenY + this.height / 2);
            ctx.lineTo(screenX + this.width, screenY + this.height / 2);
            ctx.stroke();

            ctx.restore();

            // Render particles
            this.particles.forEach(particle => {
                particle.render(ctx, camera);
            });
        }
    }

    // Check collision with a rectangle (enemy, wall, etc.)
    checkCollision(rect) {
        if (!this.active) return false;
        
        return this.x < rect.x + rect.width &&
               this.x + this.width > rect.x &&
               this.y < rect.y + rect.height &&
               this.y + this.height > rect.y;
    }

    // Deactivate the blast
    destroy() {
        this.active = false;
    }
}

class MagicParticle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.velocityX = (Math.random() - 0.5) * 2;
        this.velocityY = (Math.random() - 0.5) * 2;
        this.life = 30; // Particle lifetime in frames
        this.maxLife = this.life;
        this.size = Math.random() * 3 + 1;
        this.active = true;
        
        // Color variations for magical effect
        this.colors = ['#00FFFF', '#0080FF', '#40E0D0', '#00CED1'];
        this.color = this.colors[Math.floor(Math.random() * this.colors.length)];
    }

    update() {
        if (!this.active) return;

        // Move particle
        this.x += this.velocityX;
        this.y += this.velocityY;

        // Apply slight gravity/drift
        this.velocityY += 0.05;
        this.velocityX *= 0.98; // Slight friction

        // Decrease life
        this.life--;
        if (this.life <= 0) {
            this.active = false;
        }
    }

    render(ctx, camera) {
        if (!this.active) return;

        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        // Only render if on screen
        if (screenX >= -10 && screenX <= camera.width + 10 &&
            screenY >= -10 && screenY <= camera.height + 10) {
            
            ctx.save();

            // Calculate alpha based on remaining life
            const alpha = this.life / this.maxLife;
            
            // Draw glowing particle
            ctx.globalAlpha = alpha;
            ctx.fillStyle = this.color;
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 5;
            
            ctx.beginPath();
            ctx.arc(screenX, screenY, this.size, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }
    }
}
