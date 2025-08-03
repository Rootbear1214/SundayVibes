class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 40;
        this.velocityX = 0;
        this.velocityY = 0;
        this.onGround = false;
        this.color = '#9f00fbff'; // Green color (fallback)
        
        // Load kitty sprite
        this.sprite = new Image();
        this.sprite.src = 'kitty.png';
        this.spriteLoaded = false;
        this.sprite.onload = () => {
            this.spriteLoaded = true;
            console.log('Kitty sprite loaded successfully!');
        };
        this.sprite.onerror = () => {
            console.error('Failed to load kitty sprite, using fallback rectangle');
        };
        
        // Combat properties
        this.punchCooldown = 0;
        this.rangedCooldown = 0;
        this.maxCooldown = 30; // frames
        
        // Health system
        this.maxHealth = 3;
        this.health = this.maxHealth;
        this.invulnerable = false;
        this.invulnerabilityTimer = 0;
        this.invulnerabilityDuration = 120; // 2 seconds at 60fps
        
        // Animation state
        this.facing = 1; // 1 for right, -1 for left
        this.isAttacking = false;
        this.attackTimer = 0;
    }

    update(input, physics) {
        // Handle horizontal movement
        if (input.isLeftPressed()) {
            this.velocityX = -physics.moveSpeed;
            this.facing = -1;
        } else if (input.isRightPressed()) {
            this.velocityX = physics.moveSpeed;
            this.facing = 1;
        }

        // Handle jumping
        if (input.isJumpPressed() && this.onGround) {
            this.velocityY = physics.jumpVelocity;
            this.onGround = false;
        }

        // Handle combat
        this.handleCombat(input);

        // Apply physics
        physics.applyGravity(this);
        physics.applyFriction(this);
        physics.updatePosition(this);

        // Update cooldowns and timers
        this.updateTimers();
    }

    handleCombat(input) {
        // Punch attack
        if (input.isPunchPressed() && this.punchCooldown <= 0) {
            this.punch();
        }

        // Ranged attack
        if (input.isRangedPressed() && this.rangedCooldown <= 0) {
            this.rangedAttack();
        }
    }

    punch() {
        this.punchCooldown = this.maxCooldown;
        this.isAttacking = true;
        this.attackTimer = 15; // Attack animation duration
        
        // TODO: Add punch hit detection logic here
        console.log('Punch attack!');
    }

    rangedAttack() {
        this.rangedCooldown = this.maxCooldown;
        this.isAttacking = true;
        this.attackTimer = 10;
        
        // TODO: Create projectile here
        console.log('Ranged attack!');
    }

    updateTimers() {
        if (this.punchCooldown > 0) this.punchCooldown--;
        if (this.rangedCooldown > 0) this.rangedCooldown--;
        if (this.attackTimer > 0) {
            this.attackTimer--;
        } else {
            this.isAttacking = false;
        }
        
        // Update invulnerability timer
        if (this.invulnerabilityTimer > 0) {
            this.invulnerabilityTimer--;
            if (this.invulnerabilityTimer <= 0) {
                this.invulnerable = false;
            }
        }
    }

    render(ctx, camera) {
        // Calculate screen position relative to camera
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        // Only render if on screen
        if (screenX + this.width >= 0 && screenX <= camera.width &&
            screenY + this.height >= 0 && screenY <= camera.height) {
            
            // Flash effect when invulnerable
            if (this.invulnerable && Math.floor(this.invulnerabilityTimer / 8) % 2 === 0) {
                return; // Skip rendering to create flashing effect
            }
            
            ctx.save();
            
            // Apply visual effects for different states
            if (this.isAttacking) {
                // Orange tint when attacking
                ctx.globalCompositeOperation = 'multiply';
                ctx.fillStyle = '#FF5722';
                ctx.fillRect(screenX, screenY, this.width, this.height);
                ctx.globalCompositeOperation = 'source-over';
            } else if (this.invulnerable) {
                // Red tint when invulnerable
                ctx.globalCompositeOperation = 'multiply';
                ctx.fillStyle = '#FF9999';
                ctx.fillRect(screenX, screenY, this.width, this.height);
                ctx.globalCompositeOperation = 'source-over';
            }
            
            if (this.spriteLoaded) {
                // Draw kitty sprite
                ctx.save();
                
                // Flip sprite horizontally if facing left
                if (this.facing === -1) {
                    ctx.scale(-1, 1);
                    ctx.drawImage(this.sprite, -screenX - this.width, screenY, this.width, this.height);
                } else {
                    ctx.drawImage(this.sprite, screenX, screenY, this.width, this.height);
                }
                
                ctx.restore();
            } else {
                // Fallback rectangle if sprite not loaded
                ctx.fillStyle = this.color;
                
                // Change color slightly when attacking
                if (this.isAttacking) {
                    ctx.fillStyle = '#FF5722'; // Orange when attacking
                }
                
                // Change color when invulnerable
                if (this.invulnerable) {
                    ctx.fillStyle = '#FF9999'; // Light red when invulnerable
                }
                
                ctx.fillRect(screenX, screenY, this.width, this.height);
                
                // Draw a simple face/direction indicator
                ctx.fillStyle = '#2E7D32'; // Darker green
                const eyeSize = 4;
                const eyeY = screenY + 8;
                
                if (this.facing === 1) {
                    // Facing right
                    ctx.fillRect(screenX + this.width - 12, eyeY, eyeSize, eyeSize);
                } else {
                    // Facing left
                    ctx.fillRect(screenX + 8, eyeY, eyeSize, eyeSize);
                }
            }
            
            ctx.restore();
        }
    }

    // Get the center position of the player
    getCenterX() {
        return this.x + this.width / 2;
    }

    getCenterY() {
        return this.y + this.height / 2;
    }

    // Take damage from enemies
    takeDamage(damage = 1) {
        if (this.invulnerable || this.health <= 0) {
            return false; // No damage taken
        }
        
        this.health -= damage;
        this.invulnerable = true;
        this.invulnerabilityTimer = this.invulnerabilityDuration;
        
        console.log(`Player took ${damage} damage! Health: ${this.health}/${this.maxHealth}`);
        
        if (this.health <= 0) {
            this.health = 0;
            return true; // Player died
        }
        
        return false; // Player survived
    }
    
    // Check if player is dead
    isDead() {
        return this.health <= 0;
    }
    
    // Heal player
    heal(amount = 1) {
        this.health = Math.min(this.maxHealth, this.health + amount);
    }
    
    // Reset player to spawn position
    reset(x, y) {
        this.x = x;
        this.y = y;
        this.velocityX = 0;
        this.velocityY = 0;
        this.onGround = false;
        this.health = this.maxHealth; // Reset health on respawn
        this.invulnerable = false;
        this.invulnerabilityTimer = 0;
    }
}
