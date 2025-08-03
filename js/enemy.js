class Enemy {
    constructor(x, y, type = 'slime') {
        this.x = x;
        this.y = y;
        this.width = 25;
        this.height = 20;
        this.type = type;
        this.velocityX = 0;
        this.velocityY = 0;
        this.onGround = false;
        
        // Enemy properties
        this.health = 1;
        this.maxHealth = 1;
        this.isDead = false;
        this.deathTimer = 0;
        this.deathDuration = 30; // frames before removal
        
        // Movement properties
        this.moveSpeed = 1;
        this.direction = Math.random() > 0.5 ? 1 : -1; // Random initial direction
        this.patrolDistance = 100;
        this.startX = x;
        
        // Animation properties
        this.animationTimer = 0;
        this.bounceHeight = 0;
        this.bounceSpeed = 0.1;
        
        // Combat properties
        this.damage = 1;
        this.attackCooldown = 0;
        this.canAttack = true;
        
        this.setTypeProperties();
    }
    
    setTypeProperties() {
        switch (this.type) {
            case 'slime':
                this.color = '#FF4444'; // Red color
                this.moveSpeed = 0.8;
                this.patrolDistance = 80;
                this.bounceSpeed = 0.15;
                break;
            default:
                this.color = '#FF4444';
                break;
        }
    }
    
    update(physics, platforms, player) {
        if (this.isDead) {
            this.deathTimer++;
            return this.deathTimer < this.deathDuration;
        }
        
        // Update animation
        this.animationTimer += this.bounceSpeed;
        this.bounceHeight = Math.sin(this.animationTimer) * 3;
        
        // Simple AI movement
        this.updateMovement();
        
        // Apply physics
        physics.applyGravity(this);
        physics.updatePosition(this);
        
        // Check platform collisions
        this.checkPlatformCollisions(platforms, physics);
        
        // Check if should turn around at edges or walls
        this.checkTurnAround(platforms);
        
        // Update cooldowns
        if (this.attackCooldown > 0) {
            this.attackCooldown--;
        }
        
        return true; // Continue existing
    }
    
    updateMovement() {
        if (this.type === 'slime') {
            // Slimes move in a bouncing pattern
            this.velocityX = this.moveSpeed * this.direction;
            
            // Check if we've moved too far from start position
            if (Math.abs(this.x - this.startX) > this.patrolDistance) {
                this.direction *= -1;
            }
        }
    }
    
    checkPlatformCollisions(platforms, physics) {
        this.onGround = false;
        
        platforms.forEach(platform => {
            if (physics.checkCollision(this, platform)) {
                if (platform.type === 'jumpthrough') {
                    // Only collide if enemy is falling and above the platform
                    if (this.velocityY > 0 && this.y < platform.y) {
                        this.y = platform.y - this.height;
                        this.velocityY = 0;
                        this.onGround = true;
                    }
                } else {
                    // Solid platform - full collision resolution
                    physics.resolveCollision(this, platform);
                }
            }
        });
    }
    
    checkTurnAround(platforms) {
        // Check if there's a platform ahead to walk on
        const checkDistance = 30;
        const futureX = this.x + (checkDistance * this.direction);
        const futureY = this.y + this.height + 10; // Check below future position
        
        let foundPlatform = false;
        platforms.forEach(platform => {
            if (futureX >= platform.x && futureX <= platform.x + platform.width &&
                futureY >= platform.y && futureY <= platform.y + platform.height) {
                foundPlatform = true;
            }
        });
        
        // Turn around if no platform ahead (to avoid falling off)
        if (!foundPlatform && this.onGround) {
            this.direction *= -1;
        }
    }
    
    takeDamage(damage = 1) {
        if (this.isDead) return false;
        
        this.health -= damage;
        if (this.health <= 0) {
            this.die();
            return true; // Enemy died
        }
        return false; // Enemy survived
    }
    
    die() {
        this.isDead = true;
        this.deathTimer = 0;
        this.velocityX = 0;
        this.velocityY = -5; // Small bounce when dying
        console.log(`${this.type} enemy died!`);
    }
    
    // Check if enemy can attack player
    canAttackPlayer(player) {
        if (!this.canAttack || this.attackCooldown > 0 || this.isDead) {
            return false;
        }
        
        const distance = Math.sqrt(
            Math.pow(this.getCenterX() - player.getCenterX(), 2) +
            Math.pow(this.getCenterY() - player.getCenterY(), 2)
        );
        
        return distance < 35; // Attack range
    }
    
    attackPlayer(player) {
        if (this.canAttackPlayer(player)) {
            this.attackCooldown = 60; // 1 second cooldown at 60fps
            return this.damage;
        }
        return 0;
    }
    
    render(ctx, camera) {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y + this.bounceHeight;
        
        // Only render if on screen
        if (screenX + this.width >= 0 && screenX <= camera.width &&
            screenY + this.height >= 0 && screenY <= camera.height) {
            
            if (this.isDead) {
                // Fade out when dead
                const alpha = 1 - (this.deathTimer / this.deathDuration);
                ctx.globalAlpha = alpha;
            }
            
            // Draw slime body
            ctx.fillStyle = this.color;
            
            if (this.type === 'slime') {
                // Draw slime as an oval/ellipse
                ctx.beginPath();
                ctx.ellipse(
                    screenX + this.width / 2,
                    screenY + this.height / 2,
                    this.width / 2,
                    this.height / 2,
                    0, 0, 2 * Math.PI
                );
                ctx.fill();
                
                // Add shine effect
                ctx.fillStyle = '#FF8888';
                ctx.beginPath();
                ctx.ellipse(
                    screenX + this.width / 2 - 5,
                    screenY + this.height / 2 - 3,
                    this.width / 4,
                    this.height / 4,
                    0, 0, 2 * Math.PI
                );
                ctx.fill();
                
                // Add simple eyes
                ctx.fillStyle = '#000';
                const eyeSize = 3;
                ctx.fillRect(screenX + 6, screenY + 5, eyeSize, eyeSize);
                ctx.fillRect(screenX + this.width - 9, screenY + 5, eyeSize, eyeSize);
            }
            
            // Reset alpha
            ctx.globalAlpha = 1;
        }
    }
    
    getCenterX() {
        return this.x + this.width / 2;
    }
    
    getCenterY() {
        return this.y + this.height / 2;
    }
    
    // Check collision with player attacks
    checkPlayerAttack(player) {
        if (!player.isAttacking || this.isDead) {
            return false;
        }
        
        // Check if player is close enough and facing the enemy
        const distance = Math.abs(this.getCenterX() - player.getCenterX());
        const verticalDistance = Math.abs(this.getCenterY() - player.getCenterY());
        
        if (distance < 40 && verticalDistance < 30) {
            // Check if player is facing the enemy
            const playerFacingEnemy = (player.facing > 0 && this.x > player.x) || 
                                    (player.facing < 0 && this.x < player.x);
            
            if (playerFacingEnemy) {
                return this.takeDamage(1);
            }
        }
        
        return false;
    }
}

class EnemyManager {
    constructor() {
        this.enemies = [];
        this.spawnTimer = 0;
        this.maxEnemies = 8;
    }
    
    addEnemy(x, y, type = 'slime') {
        if (this.enemies.length < this.maxEnemies) {
            this.enemies.push(new Enemy(x, y, type));
        }
    }
    
    update(physics, platforms, player) {
        // Update all enemies
        this.enemies = this.enemies.filter(enemy => {
            const shouldKeep = enemy.update(physics, platforms, player);
            
            // Check if enemy attacks player
            if (enemy.canAttackPlayer(player)) {
                const damage = enemy.attackPlayer(player);
                if (damage > 0) {
                    const playerDied = player.takeDamage(damage);
                    if (playerDied) {
                        console.log(`Player died from ${enemy.type} attack!`);
                        return false; // Signal to main game that player died
                    }
                }
            }
            
            // Check if player attacks enemy
            enemy.checkPlayerAttack(player);
            
            return shouldKeep;
        });
    }
    
    render(ctx, camera) {
        this.enemies.forEach(enemy => {
            enemy.render(ctx, camera);
        });
    }
    
    // Spawn enemies at specific locations
    spawnEnemiesInWorld() {
        // Spawn slimes on various platforms
        this.addEnemy(250, 400, 'slime'); // On first jump-through platform
        this.addEnemy(500, 350, 'slime'); // On solid platform
        this.addEnemy(700, 300, 'slime'); // On jump-through platform
        this.addEnemy(900, 250, 'slime'); // On solid platform
        this.addEnemy(1150, 350, 'slime'); // On jump-through platform
        this.addEnemy(1400, 300, 'slime'); // On solid platform
        this.addEnemy(1600, 250, 'slime'); // On jump-through platform
    }
    
    getEnemyCount() {
        return this.enemies.length;
    }
    
    clearAllEnemies() {
        this.enemies = [];
    }
}
