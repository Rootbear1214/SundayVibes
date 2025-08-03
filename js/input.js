class InputHandler {
    constructor() {
        this.keys = {};
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            // Prevent default behavior for game keys
            if (['a', 's', 'd', 'w', 'j', 'k'].includes(e.key.toLowerCase())) {
                e.preventDefault();
            }
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });

        // Handle window focus/blur to reset keys
        window.addEventListener('blur', () => {
            this.keys = {};
        });
    }

    isPressed(key) {
        return !!this.keys[key.toLowerCase()];
    }

    // Movement keys
    isLeftPressed() {
        return this.isPressed('a');
    }

    isRightPressed() {
        return this.isPressed('d');
    }

    isDownPressed() {
        return this.isPressed('s');
    }

    isJumpPressed() {
        return this.isPressed('w');
    }

    // Combat keys
    isPunchPressed() {
        return this.isPressed('j');
    }

    isRangedPressed() {
        return this.isPressed('k');
    }
}
