class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 60;
        this.height = 60;
        this.velocityX = 0;
        this.velocityY = 0;
        this.onGround = false;
        this.color = '#9f00fbff'; // Green color (fallback)
        
        // Load blob idle sprites (individual PNGs)
        this.idleSprites = [];
        this.idleSpritesLoaded = 0;
        this.totalIdleSprites = 3;
        
        // Load each idle sprite
        for (let i = 1; i <= this.totalIdleSprites; i++) {
            const sprite = new Image();
            sprite.src = `sprites/blob/Green-Blob-Idle${i}.png`;
            sprite.onload = () => {
                this.idleSpritesLoaded++;
                if (this.idleSpritesLoaded === this.totalIdleSprites) {
                    console.log('All green blob idle sprites loaded successfully!');
                }
            };
            sprite.onerror = () => {
                console.error(`Failed to load green blob idle sprite ${i}`);
            };
            this.idleSprites.push(sprite);
        }
        
        // Load blob walking sprites (individual PNGs)
        this.walkSprites = [];
        this.walkSpritesLoaded = 0;
        this.totalWalkSprites = 5;
        
        // Load each walking sprite
        for (let i = 1; i <= this.totalWalkSprites; i++) {
            const sprite = new Image();
            sprite.src = `sprites/blob/Green-Blob-Run ${i}.png`;
            sprite.onload = () => {
                this.walkSpritesLoaded++;
                if (this.walkSpritesLoaded === this.totalWalkSprites) {
                    console.log('All green blob walking sprites loaded successfully!');
                }
            };
            sprite.onerror = () => {
                console.error(`Failed to load green blob walking sprite ${i}`);
            };
            this.walkSprites.push(sprite);
        }
        
        // Load staff weapon sprite
        this.staffSprite = new Image();
        this.staffSprite.src = 'sprites/weapons/staff.png';
        this.staffLoaded = false;
        this.staffSprite.onload = () => {
            this.staffLoaded = true;
            console.log('Staff sprite loaded successfully!');
        };
        this.staffSprite.onerror = () => {
            console.error('Failed to load staff sprite');
        };
        
        // Load sword weapon sprite
        this.swordSprite = new Image();
        this.swordSprite.src = 'sprites/weapons/sword.png';
        this.swordLoaded = false;
        this.swordSprite.onload = () => {
            this.swordLoaded = true;
            console.log('Sword sprite loaded successfully!');
        };
        this.swordSprite.onerror = () => {
            console.error('Failed to load sword sprite');
        };
        
        // Animation properties for individual sprites
        this.currentFrame = 0;
        this.frameTimer = 0;
        this.frameDelay = 20; // Frames to wait before switching to next animation frame
        this.walkFrameDelay = 18; // Much slower walking animation
        
        // Animation state
        this.isWalking = false;
        this.walkingStateTimer = 0; // Timer to stabilize walking state
        
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
        this.isPunching = false;
        this.punchAnimationTimer = 0;
        this.punchAnimationDuration = 20; // frames for sword swing animation
        
        // Magic blast system
        this.magicBlasts = [];
    }

    update(input, physics) {
        // Handle movement only if not stunned (invulnerable)
        if (!this.invulnerable) {
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
        }

        // Apply physics
        physics.applyGravity(this);
        physics.applyFriction(this);
        physics.updatePosition(this);

        // Update cooldowns and timers
        this.updateTimers();
        
        // Update animation frame
        this.updateAnimation();
        
        // Update magic blasts
        this.updateMagicBlasts();
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
        this.isPunching = true;
        this.punchAnimationTimer = this.punchAnimationDuration;
        
        // TODO: Add punch hit detection logic here
        console.log('Sword swing attack!');
    }

    rangedAttack() {
        this.rangedCooldown = this.maxCooldown;
        this.isAttacking = true;
        this.attackTimer = 10;
        
        // Create magic blast
        const blastX = this.facing === 1 ? this.x + this.width : this.x;
        const blastY = this.y + this.height / 2;
        const blast = new MagicBlast(blastX, blastY, this.facing);
        this.magicBlasts.push(blast);
        
        console.log('Magic blast created!');
    }

    updateTimers() {
        if (this.punchCooldown > 0) this.punchCooldown--;
        if (this.rangedCooldown > 0) this.rangedCooldown--;
        if (this.attackTimer > 0) {
            this.attackTimer--;
        } else {
            this.isAttacking = false;
        }
        
        // Update punch animation timer
        if (this.punchAnimationTimer > 0) {
            this.punchAnimationTimer--;
        } else {
            this.isPunching = false;
        }
        
        // Update invulnerability timer
        if (this.invulnerabilityTimer > 0) {
            this.invulnerabilityTimer--;
            if (this.invulnerabilityTimer <= 0) {
                this.invulnerable = false;
            }
        }
    }

    updateAnimation() {
        // Determine if player should be walking - remove onGround check to avoid flickering
        const shouldWalk = Math.abs(this.velocityX) > 0.1;
        
        if (shouldWalk) {
            this.walkingStateTimer++;
        } else {
            this.walkingStateTimer--;
        }
        
        // Clamp the timer
        this.walkingStateTimer = Math.max(0, Math.min(10, this.walkingStateTimer));
        
        // Only change walking state if timer reaches threshold
        const wasWalking = this.isWalking;
        this.isWalking = this.walkingStateTimer > 5;
        
        // Get current animation set and frame count
        const currentFrameDelay = this.isWalking ? this.walkFrameDelay : this.frameDelay;
        const totalFrames = this.isWalking ? this.totalWalkSprites : this.totalIdleSprites;
        
        // Reset frame if animation state changed
        if (wasWalking !== this.isWalking) {
            this.currentFrame = 0;
            this.frameTimer = 0;
        }
        
        // Update frame timer
        this.frameTimer++;
        
        // Switch to next frame when timer reaches delay
        if (this.frameTimer >= currentFrameDelay) {
            this.frameTimer = 0;
            this.currentFrame = (this.currentFrame + 1) % totalFrames;
        }
    }

    render(ctx, camera) {
        // Calculate screen position relative to camera
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        // Only render if on screen
        if (screenX + this.width >= 0 && screenX <= camera.width &&
            screenY + this.height >= 0 && screenY <= camera.height) {
            
            ctx.save();
            
            // Check if sprites are loaded
            const idleReady = this.idleSpritesLoaded === this.totalIdleSprites && this.idleSprites.length > 0;
            const walkReady = this.walkSpritesLoaded === this.totalWalkSprites && this.walkSprites.length > 0;
            
            if ((this.isWalking && walkReady) || (!this.isWalking && idleReady)) {
                // Draw animated blob sprite from individual PNGs
                ctx.save();
                
                // Disable image smoothing for pixelated look
                ctx.imageSmoothingEnabled = false;
                
                // Get the current sprite image based on animation state
                const currentSprite = this.isWalking ? 
                    this.walkSprites[this.currentFrame] : 
                    this.idleSprites[this.currentFrame];
                
                // Only draw if sprite exists
                if (currentSprite) {
                    // Flip sprite horizontally if facing left
                    if (this.facing === -1) {
                        ctx.scale(-1, 1);
                        ctx.drawImage(
                            currentSprite,
                            -screenX - this.width, screenY, this.width, this.height
                        );
                    } else {
                        ctx.drawImage(
                            currentSprite,
                            screenX, screenY, this.width, this.height
                        );
                    }
                }
                
                ctx.restore();
                
                // Draw weapons based on current action (outside of sprite context)
                if (this.isPunching && this.swordLoaded) {
                    // Draw sword when punching
                    ctx.save();
                    ctx.imageSmoothingEnabled = false;
                    
                    // Calculate sword swing animation
                    const swingProgress = 1 - (this.punchAnimationTimer / this.punchAnimationDuration);
                    const swingAngle = Math.sin(swingProgress * Math.PI) * 90; // 0 to 90 degrees swing
                    
                    // Position sword relative to player
                    const swordWidth = 50;
                    const swordHeight = 50;
                    let swordX, swordY;
                    
                    if (this.facing === -1) {
                        // Facing left - sword on left side
                        swordX = screenX - 20;
                        swordY = screenY + 5;
                        
                        // Apply rotation for swing animation
                        ctx.translate(swordX + swordWidth/2, swordY + swordHeight/2);
                        ctx.rotate((-swingAngle - 45) * Math.PI / 180); // Swing from -45 to -135 degrees
                        ctx.scale(-1, 1); // Flip horizontally for left facing
                        ctx.drawImage(this.swordSprite, -swordWidth/2, -swordHeight/2, swordWidth, swordHeight);
                    } else {
                        // Facing right - sword on right side
                        swordX = screenX + this.width - 30;
                        swordY = screenY + 5;
                        
                        // Apply rotation for swing animation
                        ctx.translate(swordX + swordWidth/2, swordY + swordHeight/2);
                        ctx.rotate((swingAngle - 45) * Math.PI / 180); // Swing from -45 to 45 degrees
                        ctx.drawImage(this.swordSprite, -swordWidth/2, -swordHeight/2, swordWidth, swordHeight);
                    }
                    
                    ctx.restore();
                } else if (this.staffLoaded) {
                    // Draw staff weapon when not punching
                    ctx.save();
                    ctx.imageSmoothingEnabled = false;
                    
                    // Position staff relative to player
                    const staffWidth = 40;
                    const staffHeight = 40;
                    let staffX, staffY;
                    
                    if (this.facing === -1) {
                        // Facing left - staff on left side, flipped horizontally, closer to player
                        staffX = screenX - 15; // Moved closer: -30 to -15
                        staffY = screenY + 10;
                        ctx.translate(staffX + staffWidth/2, staffY + staffHeight/2);
                        ctx.scale(-1, 1); // Flip horizontally for left facing
                        ctx.drawImage(this.staffSprite, -staffWidth/2, -staffHeight/2, staffWidth, staffHeight);
                    } else {
                        // Facing right - staff on right side, closer to player
                        staffX = screenX + this.width - 25; // Moved closer: -10 to -25
                        staffY = screenY + 10;
                        ctx.drawImage(this.staffSprite, staffX, staffY, staffWidth, staffHeight);
                    }
                    
                    ctx.restore();
                }
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
    
    // Update magic blasts
    updateMagicBlasts() {
        for (let i = this.magicBlasts.length - 1; i >= 0; i--) {
            const blast = this.magicBlasts[i];
            blast.update();
            
            if (!blast.active) {
                this.magicBlasts.splice(i, 1);
            }
        }
    }

    // Render magic blasts
    renderMagicBlasts(ctx, camera) {
        this.magicBlasts.forEach(blast => {
            blast.render(ctx, camera);
        });
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
        this.magicBlasts = []; // Clear magic blasts on reset
    }
}
