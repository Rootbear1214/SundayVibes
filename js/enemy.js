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
        this.jumpTimer = 0;
        this.jumpCooldown = 60; // frames between jumps
        this.isJumping = false;
        this.jumpPhase = 0; // 0 = ground, 1 = squash, 2 = jump, 3 = air, 4 = land
        this.squashAmount = 0;
        this.stretchAmount = 0;
        
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
            // Update jump timer
            this.jumpTimer++;
            
            // Handle jumping animation phases
            if (this.onGround && !this.isJumping && this.jumpTimer >= this.jumpCooldown) {
                // Start jump sequence
                this.isJumping = true;
                this.jumpPhase = 1; // squash phase
                this.jumpTimer = 0;
            }
            
            if (this.isJumping) {
                this.handleJumpAnimation();
            } else {
                // Normal movement when not jumping
                this.velocityX = this.moveSpeed * this.direction;
            }
            
            // Check if we've moved too far from start position
            if (Math.abs(this.x - this.startX) > this.patrolDistance) {
                this.direction *= -1;
            }
        }
    }

    handleJumpAnimation() {
        switch (this.jumpPhase) {
            case 1: // Squash phase - prepare to jump
                this.squashAmount += 0.3;
                this.velocityX = 0; // Stop horizontal movement during squash
                if (this.squashAmount >= 1) {
                    this.jumpPhase = 2;
                    this.squashAmount = 1;
                }
                break;
                
            case 2: // Launch phase - apply jump velocity
                this.velocityY = -6; // Jump upward
                this.velocityX = this.moveSpeed * this.direction * 1.5; // Faster horizontal movement during jump
                this.jumpPhase = 3;
                this.squashAmount = 0;
                this.stretchAmount = 1;
                break;
                
            case 3: // Air phase - stretch while in air
                if (this.velocityY > 0) {
                    // Start falling, begin to compress
                    this.stretchAmount -= 0.1;
                    if (this.stretchAmount <= 0) {
                        this.stretchAmount = 0;
                        this.jumpPhase = 4;
                    }
                }
                break;
                
            case 4: // Landing phase - squash on impact
                if (this.onGround) {
                    this.squashAmount += 0.2;
                    this.velocityX *= 0.8; // Slow down horizontal movement
                    if (this.squashAmount >= 0.8) {
                        // End jump sequence
                        this.isJumping = false;
                        this.jumpPhase = 0;
                        this.squashAmount = 0;
                        this.stretchAmount = 0;
                        this.jumpTimer = 0;
                    }
                }
                break;
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
            
            // Draw slime body with squash and stretch animation
            ctx.fillStyle = '#44FF44'; // Green color for slime
            
            if (this.type === 'slime') {
                // Calculate squash and stretch effects
                let widthMultiplier = 1 + this.squashAmount * 0.5; // Wider when squashed
                let heightMultiplier = 1 - this.squashAmount * 0.3; // Shorter when squashed
                
                if (this.stretchAmount > 0) {
                    widthMultiplier = 1 - this.stretchAmount * 0.2; // Narrower when stretched
                    heightMultiplier = 1 + this.stretchAmount * 0.4; // Taller when stretched
                }
                
                const animatedWidth = this.width * widthMultiplier;
                const animatedHeight = this.height * heightMultiplier;
                
                // Adjust Y position to keep slime grounded during squash
                const yOffset = this.squashAmount > 0 ? (this.height - animatedHeight) : 0;
                
                // Draw slime as an oval/ellipse with animation
                ctx.beginPath();
                ctx.ellipse(
                    screenX + this.width / 2,
                    screenY + this.height / 2 + yOffset,
                    animatedWidth / 2,
                    animatedHeight / 2,
                    0, 0, 2 * Math.PI
                );
                ctx.fill();
                
                // Add shine effect (also animated)
                ctx.fillStyle = '#88FF88'; // Lighter green shine
                ctx.beginPath();
                ctx.ellipse(
                    screenX + this.width / 2 - 3,
                    screenY + this.height / 2 - 2 + yOffset,
                    (animatedWidth / 4) * 0.8,
                    (animatedHeight / 4) * 0.8,
                    0, 0, 2 * Math.PI
                );
                ctx.fill();
                
                // Add simple eyes (positioned relative to animated body)
                ctx.fillStyle = '#000';
                const eyeSize = 3;
                const eyeYOffset = yOffset - (animatedHeight - this.height) * 0.3;
                ctx.fillRect(screenX + 6, screenY + 5 + eyeYOffset, eyeSize, eyeSize);
                ctx.fillRect(screenX + this.width - 9, screenY + 5 + eyeYOffset, eyeSize, eyeSize);
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
        
        // Check if player is close enough and facing the enemy - BIGGER HIT BOX
        const distance = Math.abs(this.getCenterX() - player.getCenterX());
        const verticalDistance = Math.abs(this.getCenterY() - player.getCenterY());
        
        if (distance < 80 && verticalDistance < 50) { // Increased from 40x30 to 80x50
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
            
            // Check if player attacks enemy (melee)
            enemy.checkPlayerAttack(player);
            
            // Check if magic blasts hit enemy (ranged)
            player.magicBlasts.forEach(blast => {
                if (blast.active && blast.checkCollision(enemy) && !enemy.isDead) {
                    enemy.takeDamage(1);
                    blast.destroy(); // Destroy blast on hit
                    console.log(`${enemy.type} hit by magic blast!`);
                }
            });
            
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
        // Spawn slimes on actual platforms (positioned just above platform surfaces)
        // Lower level platforms
        this.addEnemy(200, 448, 'slime'); // On platform at (150, 480)
        this.addEnemy(400, 418, 'slime'); // On jump-through platform at (350, 450)
        this.addEnemy(590, 448, 'slime'); // On platform at (550, 480)
        this.addEnemy(810, 428, 'slime'); // On jump-through platform at (750, 460)
        this.addEnemy(1000, 448, 'slime'); // On platform at (950, 480)
        
        // Mid-level platforms
        this.addEnemy(150, 348, 'slime'); // On platform at (100, 380)
        this.addEnemy(320, 318, 'slime'); // On jump-through platform at (280, 350)
        this.addEnemy(510, 288, 'slime'); // On platform at (450, 320)
        this.addEnemy(1100, 288, 'slime'); // On jump-through platform at (1050, 320)
        this.addEnemy(1350, 268, 'slime'); // On platform at (1300, 300)
        
        // Upper level platforms
        this.addEnemy(260, 188, 'slime'); // On platform at (200, 220)
        this.addEnemy(640, 168, 'slime'); // On platform at (600, 200)
        this.addEnemy(1050, 168, 'slime'); // On platform at (1000, 200)
        this.addEnemy(1510, 148, 'slime'); // On platform at (1450, 180)
    }
    
    getEnemyCount() {
        return this.enemies.length;
    }
    
    clearAllEnemies() {
        this.enemies = [];
    }
}
