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
        const overlapX = Math.min(
            (player.x + player.width) - platform.x,
            (platform.x + platform.width) - player.x
        );
        const overlapY = Math.min(
            (player.y + player.height) - platform.y,
            (platform.y + platform.height) - player.y
        );

        // Resolve collision based on smallest overlap
        if (overlapX < overlapY) {
            // Horizontal collision
            if (player.x < platform.x) {
                player.x = platform.x - player.width;
            } else {
                player.x = platform.x + platform.width;
            }
            player.velocityX = 0;
        } else {
            // Vertical collision
            if (player.y < platform.y) {
                // Player is above platform
                player.y = platform.y - player.height;
                player.velocityY = 0;
                player.onGround = true;
            } else {
                // Player is below platform
                player.y = platform.y + platform.height;
                player.velocityY = 0;
            }
        }
    }

    // Update object position based on velocity
    updatePosition(object) {
        object.x += object.velocityX;
        object.y += object.velocityY;
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

        // Vertical bounds (falling off the world)
        if (object.y > worldHeight) {
            // Reset to spawn point or handle death
            object.y = worldHeight - object.height;
            object.velocityY = 0;
            object.onGround = true;
        }
    }
}
