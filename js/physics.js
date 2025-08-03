class Physics {
    constructor() {
        this.gravity = 0.8;
        this.friction = 0.85;
        this.airResistance = 0.98;
        this.jumpVelocity = -15;
        this.moveSpeed = 5;
    }

    // Apply gravity to an object
    applyGravity(object) {
        if (!object.onGround) {
            object.velocityY += this.gravity;
        }
    }

    // Apply friction to horizontal movement
    applyFriction(object) {
        if (object.onGround) {
            object.velocityX *= this.friction;
        } else {
            object.velocityX *= this.airResistance;
        }
    }

    // Check collision between two rectangles (AABB)
    checkCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }

    // Resolve collision between player and platform
    resolveCollision(player, platform) {
        // Calculate overlaps more precisely
        const overlapX = Math.min(
            (player.x + player.width) - platform.x,
            (platform.x + platform.width) - player.x
        );
        const overlapY = Math.min(
            (player.y + player.height) - platform.y,
            (platform.y + platform.height) - player.y
        );

        // Add small buffer to prevent floating point precision issues
        const buffer = 0.1;

        // Resolve collision based on smallest overlap
        if (overlapX < overlapY) {
            // Horizontal collision
            if (player.x < platform.x) {
                player.x = platform.x - player.width - buffer;
            } else {
                player.x = platform.x + platform.width + buffer;
            }
            player.velocityX = 0;
        } else {
            // Vertical collision
            if (player.y < platform.y) {
                // Player is above platform (landing on top)
                player.y = platform.y - player.height - buffer;
                player.velocityY = 0;
                player.onGround = true;
            } else {
                // Player is below platform (hitting from below)
                player.y = platform.y + platform.height + buffer;
                player.velocityY = 0;
            }
        }
    }

    // Update object position based on velocity with collision prevention
    updatePosition(object) {
        // Limit maximum velocity to prevent tunneling through platforms
        const maxVelocity = 15; // Reduced from 20 for better collision detection
        object.velocityX = Math.max(-maxVelocity, Math.min(maxVelocity, object.velocityX));
        object.velocityY = Math.max(-maxVelocity, Math.min(maxVelocity, object.velocityY));
        
        // Move in smaller steps to prevent tunneling
        const steps = Math.max(1, Math.ceil(Math.max(Math.abs(object.velocityX), Math.abs(object.velocityY)) / 5));
        const stepX = object.velocityX / steps;
        const stepY = object.velocityY / steps;
        
        for (let i = 0; i < steps; i++) {
            object.x += stepX;
            object.y += stepY;
        }
    }

    // Check if object is within world bounds
    checkWorldBounds(object, worldWidth, worldHeight) {
        // Horizontal bounds
        if (object.x < 0) {
            object.x = 0;
            object.velocityX = 0;
        } else if (object.x + object.width > worldWidth) {
            object.x = worldWidth - object.width;
            object.velocityX = 0;
        }

        // Don't prevent vertical falling - let the game's death system handle it
        // The death zone check in main.js will trigger when player falls too far
    }
}
