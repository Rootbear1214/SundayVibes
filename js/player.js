class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 40;
        this.velocityX = 0;
        this.velocityY = 0;
        this.onGround = false;
        this.color = '#4CAF50'; // Green color
        
        // Combat properties
        this.punchCooldown = 0;
        this.rangedCooldown = 0;
        this.maxCooldown = 30; // frames
        
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
    }

    render(ctx, camera) {
        // Calculate screen position relative to camera
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        // Only render if on screen
        if (screenX + this.width >= 0 && screenX <= camera.width &&
            screenY + this.height >= 0 && screenY <= camera.height) {
            
            ctx.fillStyle = this.color;
            
            // Change color slightly when attacking
            if (this.isAttacking) {
                ctx.fillStyle = '#FF5722'; // Orange when attacking
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
    }

    // Get the center position of the player
    getCenterX() {
        return this.x + this.width / 2;
    }

    getCenterY() {
        return this.y + this.height / 2;
    }

    // Reset player to spawn position
    reset(x, y) {
        this.x = x;
        this.y = y;
        this.velocityX = 0;
        this.velocityY = 0;
        this.onGround = false;
    }
}
