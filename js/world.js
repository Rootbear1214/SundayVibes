class Platform {
    constructor(x, y, width, height, type = 'solid') {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.type = type; // 'solid', 'jumpthrough', 'moving', 'breakable', 'spikes'
        this.color = this.getColorByType();
        
        // For moving platforms
        this.originalX = x;
        this.originalY = y;
        this.moveSpeed = 1;
        this.moveRange = 100;
        this.moveDirection = 1;
        
        // Load underground tileset sprites
        this.loadSprites();
    }

    loadSprites() {
        // Load terrain sprites for underground theme
        this.terrainSprite = new Image();
        this.terrainSprite.src = '16x16 Underground Passage/Sprites/Terrain/Sprites_00.png';
        this.terrainLoaded = false;
        this.terrainSprite.onload = () => {
            this.terrainLoaded = true;
        };
        
        // Load spike sprites
        this.spikeSprite = new Image();
        this.spikeSprite.src = '16x16 Underground Passage/Sprites/Spikes/Spikes_01.png';
        this.spikeLoaded = false;
        this.spikeSprite.onload = () => {
            this.spikeLoaded = true;
        };
    }

    getColorByType() {
        switch (this.type) {
            case 'solid': return '#4A4A4A'; // Dark gray stone
            case 'jumpthrough': return '#6A6A6A'; // Lighter gray stone
            case 'moving': return '#5A5A5A'; // Medium gray stone
            case 'breakable': return '#7A7A7A'; // Breakable stone
            case 'spikes': return '#8B0000'; // Dark red for spikes
            default: return '#4A4A4A';
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
            
            if (this.type === 'spikes' && this.spikeLoaded) {
                // Render spikes using sprite
                ctx.imageSmoothingEnabled = false;
                const tileSize = 16;
                for (let x = 0; x < this.width; x += tileSize) {
                    for (let y = 0; y < this.height; y += tileSize) {
                        ctx.drawImage(this.spikeSprite, screenX + x, screenY + y, tileSize, tileSize);
                    }
                }
            } else if (this.terrainLoaded && this.type !== 'spikes') {
                // Render stone platforms using terrain sprite
                ctx.imageSmoothingEnabled = false;
                const tileSize = 16;
                for (let x = 0; x < this.width; x += tileSize) {
                    for (let y = 0; y < this.height; y += tileSize) {
                        ctx.drawImage(this.terrainSprite, screenX + x, screenY + y, tileSize, tileSize);
                    }
                }
            } else {
                // Fallback to colored rectangles
                ctx.fillStyle = this.color;
                ctx.fillRect(screenX, screenY, this.width, this.height);
                
                // Add border for better visibility
                ctx.strokeStyle = '#2A2A2A';
                ctx.lineWidth = 1;
                ctx.strokeRect(screenX, screenY, this.width, this.height);
            }
        }
    }
}

class World {
    constructor() {
        this.platforms = [];
        this.width = 2400; // World is wider than screen for scrolling
        this.height = 600;
        this.spawnX = 80;
        this.spawnY = 510; // Just above the ground platform
        
        // Load background sprites
        this.loadBackgroundSprites();
        this.createUndergroundPassage();
    }

    loadBackgroundSprites() {
        this.backgroundSprites = [];
        // Load multiple background layers for depth
        for (let i = 1; i <= 14; i++) {
            const bg = new Image();
            bg.src = `16x16 Underground Passage/Sprites/Background/BG_${i.toString().padStart(2, '0')}.png`;
            this.backgroundSprites.push(bg);
        }
        
        // Load pillar sprites
        this.pillarSprites = [];
        for (let i = 1; i <= 5; i++) {
            const pillar = new Image();
            pillar.src = `16x16 Underground Passage/Sprites/Pillars/Pillar_${i.toString().padStart(2, '0')}.png`;
            this.pillarSprites.push(pillar);
        }
    }

    createUndergroundPassage() {
        // Main floor platforms (underground stone floor)
        this.platforms.push(new Platform(0, 550, 300, 50, 'solid'));
        this.platforms.push(new Platform(400, 550, 200, 50, 'solid'));
        this.platforms.push(new Platform(700, 550, 300, 50, 'solid'));
        this.platforms.push(new Platform(1100, 550, 250, 50, 'solid'));
        this.platforms.push(new Platform(1450, 550, 300, 50, 'solid'));
        this.platforms.push(new Platform(1850, 550, 550, 50, 'solid'));

        // Underground ceiling/roof platforms
        this.platforms.push(new Platform(0, 0, 2400, 32, 'solid'));

        // Side walls
        this.platforms.push(new Platform(0, 32, 32, 518, 'solid'));
        this.platforms.push(new Platform(2368, 32, 32, 518, 'solid'));

        // Multi-level stone platforms (like in the mockup)
        // Lower level platforms
        this.platforms.push(new Platform(150, 480, 120, 32, 'solid'));
        this.platforms.push(new Platform(350, 450, 100, 32, 'jumpthrough'));
        this.platforms.push(new Platform(550, 480, 80, 32, 'solid'));
        this.platforms.push(new Platform(750, 460, 120, 32, 'jumpthrough'));
        this.platforms.push(new Platform(950, 480, 100, 32, 'solid'));
        this.platforms.push(new Platform(1200, 450, 150, 32, 'jumpthrough'));
        this.platforms.push(new Platform(1500, 480, 120, 32, 'solid'));
        this.platforms.push(new Platform(1750, 460, 100, 32, 'jumpthrough'));

        // Mid-level platforms
        this.platforms.push(new Platform(100, 380, 100, 32, 'solid'));
        this.platforms.push(new Platform(280, 350, 80, 32, 'jumpthrough'));
        this.platforms.push(new Platform(450, 320, 120, 32, 'solid'));
        this.platforms.push(new Platform(650, 300, 100, 32, 'jumpthrough'));
        this.platforms.push(new Platform(850, 350, 80, 32, 'solid'));
        this.platforms.push(new Platform(1050, 320, 120, 32, 'jumpthrough'));
        this.platforms.push(new Platform(1300, 300, 100, 32, 'solid'));
        this.platforms.push(new Platform(1550, 350, 150, 32, 'jumpthrough'));
        this.platforms.push(new Platform(1800, 320, 120, 32, 'solid'));

        // Upper level platforms
        this.platforms.push(new Platform(200, 220, 120, 32, 'solid'));
        this.platforms.push(new Platform(400, 180, 100, 32, 'jumpthrough'));
        this.platforms.push(new Platform(600, 200, 80, 32, 'solid'));
        this.platforms.push(new Platform(800, 160, 120, 32, 'jumpthrough'));
        this.platforms.push(new Platform(1000, 200, 100, 32, 'solid'));
        this.platforms.push(new Platform(1200, 160, 150, 32, 'jumpthrough'));
        this.platforms.push(new Platform(1450, 180, 120, 32, 'solid'));
        this.platforms.push(new Platform(1700, 140, 100, 32, 'jumpthrough'));

        // High platforms near ceiling
        this.platforms.push(new Platform(150, 100, 80, 32, 'solid'));
        this.platforms.push(new Platform(350, 80, 100, 32, 'jumpthrough'));
        this.platforms.push(new Platform(550, 100, 120, 32, 'solid'));
        this.platforms.push(new Platform(800, 80, 100, 32, 'jumpthrough'));
        this.platforms.push(new Platform(1050, 100, 150, 32, 'solid'));
        this.platforms.push(new Platform(1350, 80, 120, 32, 'jumpthrough'));
        this.platforms.push(new Platform(1600, 100, 100, 32, 'solid'));
        this.platforms.push(new Platform(1850, 80, 150, 32, 'jumpthrough'));

        // Spike traps at the bottom of pits (between platforms)
        this.platforms.push(new Platform(300, 584, 100, 16, 'spikes')); // Between first platforms
        this.platforms.push(new Platform(600, 584, 100, 16, 'spikes')); // Between second platforms  
        this.platforms.push(new Platform(1000, 584, 100, 16, 'spikes')); // Between third platforms
        this.platforms.push(new Platform(1350, 584, 100, 16, 'spikes')); // Between fourth platforms
        this.platforms.push(new Platform(1750, 584, 100, 16, 'spikes')); // Between fifth platforms

        // Moving stone platforms
        this.platforms.push(new Platform(500, 400, 64, 16, 'moving'));
        this.platforms.push(new Platform(900, 250, 64, 16, 'moving'));
        this.platforms.push(new Platform(1400, 250, 64, 16, 'moving'));

        // Narrow passage platforms (challenging jumps)
        this.platforms.push(new Platform(50, 300, 32, 32, 'jumpthrough'));
        this.platforms.push(new Platform(50, 200, 32, 32, 'jumpthrough'));
        this.platforms.push(new Platform(50, 100, 32, 32, 'jumpthrough'));
        
        this.platforms.push(new Platform(2318, 300, 32, 32, 'jumpthrough'));
        this.platforms.push(new Platform(2318, 200, 32, 32, 'jumpthrough'));
        this.platforms.push(new Platform(2318, 100, 32, 32, 'jumpthrough'));
    }

    update() {
        // Update all platforms (mainly for moving platforms)
        this.platforms.forEach(platform => {
            platform.update();
        });
    }

    render(ctx, camera) {
        // Render dark underground background
        ctx.fillStyle = '#1a1a1a'; // Very dark background
        ctx.fillRect(0, 0, camera.width, camera.height);

        // Add some atmospheric depth with gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, camera.height);
        gradient.addColorStop(0, '#2a2a2a');
        gradient.addColorStop(1, '#0a0a0a');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, camera.width, camera.height);

        // Render background elements (stone walls, etc.)
        if (this.backgroundSprites.length > 0 && this.backgroundSprites[0].complete) {
            ctx.imageSmoothingEnabled = false;
            const bgSprite = this.backgroundSprites[0];
            // Tile the background
            for (let x = -camera.x % 16; x < camera.width; x += 16) {
                for (let y = 0; y < camera.height; y += 16) {
                    ctx.drawImage(bgSprite, x, y, 16, 16);
                }
            }
        }

        // Render all platforms
        this.platforms.forEach(platform => {
            platform.render(ctx, camera);
        });

        // Add some atmospheric lighting effects
        this.renderAtmosphere(ctx, camera);
    }

    renderAtmosphere(ctx, camera) {
        // Add subtle lighting effects for underground atmosphere
        ctx.save();
        ctx.globalAlpha = 0.1;
        
        // Create some light spots
        const lightSpots = [
            { x: 200, y: 300 },
            { x: 600, y: 200 },
            { x: 1000, y: 350 },
            { x: 1400, y: 250 },
            { x: 1800, y: 300 }
        ];

        lightSpots.forEach(spot => {
            const screenX = spot.x - camera.x;
            const screenY = spot.y;
            
            if (screenX > -100 && screenX < camera.width + 100) {
                const gradient = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, 80);
                gradient.addColorStop(0, 'rgba(255, 255, 200, 0.3)');
                gradient.addColorStop(1, 'rgba(255, 255, 200, 0)');
                ctx.fillStyle = gradient;
                ctx.fillRect(screenX - 80, screenY - 80, 160, 160);
            }
        });

        ctx.restore();
    }

    // Check collisions between player and platforms
    checkCollisions(player, physics) {
        player.onGround = false;

        // Sort platforms by distance to player for better collision priority
        const sortedPlatforms = this.platforms.slice().sort((a, b) => {
            const distA = Math.abs(player.x - a.x) + Math.abs(player.y - a.y);
            const distB = Math.abs(player.x - b.x) + Math.abs(player.y - b.y);
            return distA - distB;
        });

        sortedPlatforms.forEach(platform => {
            if (physics.checkCollision(player, platform)) {
                // Handle different platform types
                if (platform.type === 'jumpthrough') {
                    // Only collide if player is falling and above the platform
                    if (player.velocityY > 0 && player.y + player.height - 5 < platform.y) {
                        player.y = platform.y - player.height - 0.1;
                        player.velocityY = 0;
                        player.onGround = true;
                    }
                } else if (platform.type === 'spikes') {
                    // Spikes damage the player
                    if (!player.invulnerable) {
                        player.takeDamage(1);
                        console.log('Player hit spikes!');
                    }
                    // Don't stop player movement on spikes
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
