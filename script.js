/**
 * Invisible Art Challenge - Main Game Logic
 * A drawing game where players draw without seeing their strokes
 */

class InvisibleArtGame {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.isDrawing = false;
        this.currentColor = '#000000';
        this.strokeSize = 5;
        this.timer = null;
        this.timeLeft = 0;
        this.isRevealed = false;
        this.drawingData = [];
        this.backgroundMusic = null;
        this.sounds = {
            ding: null,
            reveal: null
        };
        
        // Initialize the game when DOM is loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    /**
     * Initialize the game
     */
    init() {
        this.setupCanvas();
        this.setupTimer();
        this.setupColorPalette();
        this.setupStrokeSize();
        this.setupControls();
        this.setupAudio();
        this.setupDifficultyBackground();
        this.startBackgroundMusic();
    }

    /**
     * Setup canvas for invisible drawing
     */
    setupCanvas() {
        this.canvas = document.getElementById('drawing-canvas');
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        
        // Set canvas size (default 400x400, will be adjusted if reference image exists)
        this.canvas.width = 400;
        this.canvas.height = 400;
        
        // Setup drawing properties
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.lineWidth = this.strokeSize;
        
        // Add event listeners for drawing
        this.addCanvasEventListeners();
        
        // Apply pencil cursor
        this.canvas.style.cursor = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>') 12 12, crosshair`;
    }

    /**
     * Add event listeners for canvas drawing
     */
    addCanvasEventListeners() {
        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
        this.canvas.addEventListener('mousemove', (e) => this.draw(e));
        this.canvas.addEventListener('mouseup', () => this.stopDrawing());
        this.canvas.addEventListener('mouseout', () => this.stopDrawing());

        // Touch events for mobile
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousedown', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.canvas.dispatchEvent(mouseEvent);
        });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousemove', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.canvas.dispatchEvent(mouseEvent);
        });

        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            const mouseEvent = new MouseEvent('mouseup', {});
            this.canvas.dispatchEvent(mouseEvent);
        });
    }

    /**
     * Get mouse/touch position relative to canvas
     */
    getEventPosition(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    }

    /**
     * Start drawing
     */
    startDrawing(e) {
        if (this.isRevealed) return;
        
        this.isDrawing = true;
        const pos = this.getEventPosition(e);
        
        // Start new path for invisible drawing
        this.ctx.beginPath();
        this.ctx.moveTo(pos.x, pos.y);
        
        // Store drawing data for later reveal
        this.drawingData.push({
            type: 'start',
            x: pos.x,
            y: pos.y,
            color: this.currentColor,
            size: this.strokeSize
        });
    }

    /**
     * Draw on canvas (invisible)
     */
    draw(e) {
        if (!this.isDrawing || this.isRevealed) return;
        
        const pos = this.getEventPosition(e);
        
        // Draw invisible line (fully transparent)
        this.ctx.globalAlpha = 0;
        this.ctx.strokeStyle = this.currentColor;
        this.ctx.lineWidth = this.strokeSize;
        this.ctx.lineTo(pos.x, pos.y);
        this.ctx.stroke();
        this.ctx.beginPath();
        this.ctx.moveTo(pos.x, pos.y);
        
        // Store drawing data
        this.drawingData.push({
            type: 'draw',
            x: pos.x,
            y: pos.y,
            color: this.currentColor,
            size: this.strokeSize
        });
    }

    /**
     * Stop drawing
     */
    stopDrawing() {
        if (!this.isDrawing) return;
        
        this.isDrawing = false;
        this.drawingData.push({ type: 'end' });
    }

    /**
     * Setup timer based on difficulty
     */
    setupTimer() {
        const urlParams = new URLSearchParams(window.location.search);
        const difficulty = urlParams.get('difficulty') || 'medium';
        
        // Set timer based on difficulty
        const timeMap = {
            'easy': 20,
            'medium': 30,
            'hard': 45
        };
        
        this.timeLeft = timeMap[difficulty] || 30;
        this.updateTimerDisplay();
        
        // Start countdown
        this.timer = setInterval(() => {
            this.timeLeft--;
            this.updateTimerDisplay();
            
            // Play ding sound in last 3 seconds
            if (this.timeLeft <= 3 && this.timeLeft > 0) {
                this.playDingSound();
            }
            
            // Auto-reveal when time runs out
            if (this.timeLeft <= 0) {
                clearInterval(this.timer);
                this.revealDrawing();
            }
        }, 1000);
    }

    /**
     * Update timer display
     */
    updateTimerDisplay() {
        const timerElement = document.getElementById('timer');
        if (!timerElement) return;
        
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // Add warning class for last 10 seconds
        if (this.timeLeft <= 10) {
            timerElement.classList.add('warning');
        }
    }

    /**
     * Setup color palette
     */
    setupColorPalette() {
        const colorButtons = document.querySelectorAll('.color-btns');
        const customColorPicker = document.getElementById('custom-color-picker');
        
        // Handle preset color buttons
        colorButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                // Remove active class from all buttons
                colorButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Update current color
                this.currentColor = btn.dataset.color || btn.style.backgroundColor;
            });
        });
        
        // Handle custom color picker
        if (customColorPicker) {
            customColorPicker.addEventListener('change', (e) => {
                // Remove active class from preset buttons
                colorButtons.forEach(b => b.classList.remove('active'));
                
                // Update current color
                this.currentColor = e.target.value;
                
                // Visual feedback
                customColorPicker.style.background = e.target.value;
                customColorPicker.classList.add('active');
            });
        }
    }

    /**
     * Setup stroke size slider
     */
    setupStrokeSize() {
        const strokeSlider = document.getElementById('stroke-size');
        const strokeValue = document.getElementById('stroke-value');
        
        if (!strokeSlider) return;
        
        strokeSlider.addEventListener('input', (e) => {
            this.strokeSize = parseInt(e.target.value);
            if (strokeValue) {
                strokeValue.textContent = this.strokeSize;
            }
        });
        
        // Initialize display
        if (strokeValue) {
            strokeValue.textContent = this.strokeSize;
        }
    }

    /**
     * Setup control buttons
     */
    setupControls() {
        // Reveal button
        const revealBtn = document.getElementById('reveal-btn');
        if (revealBtn) {
            revealBtn.addEventListener('click', () => this.revealDrawing());
        }
        
        // Restart button
        const restartBtn = document.getElementById('restart-btn');
        if (restartBtn) {
            restartBtn.addEventListener('click', () => this.restart());
        }
    }

    /**
     * Setup audio elements
     */
    setupAudio() {
        try {
            // Create audio elements programmatically
            this.sounds.ding = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTcIF2W-7OydDAcpgc7y2ogDNHY');
            this.sounds.reveal = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTcIF2W-7OydDAcpgc7y2og');
            
            // Background music (simple tone)
            this.backgroundMusic = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTcIF2W-7OydDAcpgc7y2og');
            
            // Set audio properties
            if (this.backgroundMusic) {
                this.backgroundMusic.loop = true;
                this.backgroundMusic.volume = 0.1;
            }
            
            Object.values(this.sounds).forEach(sound => {
                if (sound) {
                    sound.volume = 0.3;
                }
            });
        } catch (error) {
            console.warn('Audio setup failed:', error);
        }
    }

    /**
     * Play ding sound
     */
    playDingSound() {
        try {
            if (this.sounds.ding) {
                this.sounds.ding.currentTime = 0;
                this.sounds.ding.play().catch(e => console.warn('Ding sound failed:', e));
            }
        } catch (error) {
            console.warn('Failed to play ding sound:', error);
        }
    }

    /**
     * Start background music
     */
    startBackgroundMusic() {
        try {
            if (this.backgroundMusic) {
                this.backgroundMusic.play().catch(e => console.warn('Background music failed:', e));
            }
        } catch (error) {
            console.warn('Failed to start background music:', error);
        }
    }

    /**
     * Setup difficulty-based background
     */
    setupDifficultyBackground() {
        const urlParams = new URLSearchParams(window.location.search);
        const difficulty = urlParams.get('difficulty') || 'medium';
        
        document.body.classList.add(`difficulty-${difficulty}`);
    }

    /**
     * Reveal the invisible drawing
     */
    revealDrawing() {
        if (this.isRevealed) return;
        
        this.isRevealed = true;
        
        // Stop timer
        if (this.timer) {
            clearInterval(this.timer);
        }
        
        // Clear canvas and redraw with visible strokes
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.globalAlpha = 1;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        // Redraw all stored paths
        let currentPath = null;
        
        this.drawingData.forEach(data => {
            switch (data.type) {
                case 'start':
                    this.ctx.beginPath();
                    this.ctx.moveTo(data.x, data.y);
                    this.ctx.strokeStyle = data.color;
                    this.ctx.lineWidth = data.size;
                    currentPath = { color: data.color, size: data.size };
                    break;
                    
                case 'draw':
                    if (currentPath) {
                        this.ctx.lineTo(data.x, data.y);
                    }
                    break;
                    
                case 'end':
                    if (currentPath) {
                        this.ctx.stroke();
                        currentPath = null;
                    }
                    break;
            }
        });
        
        // Update reveal button
        const revealBtn = document.getElementById('reveal-btn');
        if (revealBtn) {
            revealBtn.textContent = '✨ Drawing Revealed!';
            revealBtn.disabled = true;
            revealBtn.style.opacity = '0.7';
        }
        
        // Show reference image
        this.showReferenceImage();
        
        // Play reveal sound
        try {
            if (this.sounds.reveal) {
                this.sounds.reveal.play().catch(e => console.warn('Reveal sound failed:', e));
            }
        } catch (error) {
            console.warn('Failed to play reveal sound:', error);
        }
        
        // Stop background music
        if (this.backgroundMusic) {
            this.backgroundMusic.pause();
        }
        
        // Disable canvas drawing
        this.canvas.style.cursor = 'default';
        this.canvas.style.pointerEvents = 'none';
    }

    /**
     * Show reference image with animation
     */
    showReferenceImage() {
        const referenceImg = document.getElementById('reference-img');
        const hiddenMessage = document.querySelector('.hidden-message');
        
        if (referenceImg && hiddenMessage) {
            // Hide the hidden message
            hiddenMessage.style.display = 'none';
            
            // Show and animate the reference image
            referenceImg.style.display = 'block';
            referenceImg.classList.add('show-ref', 'reveal-animation');
            
            // Set a default image if none is set
            if (!referenceImg.src || referenceImg.src.includes('blob:')) {
                referenceImg.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzk5YTNhZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPvCfhK4gUmVmZXJlbmNlIEltYWdlPC90ZXh0Pgo8L3N2Zz4K';
            }
            
            // Adjust canvas size to match image when it loads
            referenceImg.onload = () => {
                this.matchCanvasToImage(referenceImg);
            };
        }
    }

    /**
     * Match canvas size to reference image
     */
    matchCanvasToImage(img) {
        const maxWidth = 400;
        const maxHeight = 400;
        
        let { width, height } = img;
        
        // Scale down if image is too large
        if (width > maxWidth || height > maxHeight) {
            const aspectRatio = width / height;
            
            if (width > height) {
                width = maxWidth;
                height = maxWidth / aspectRatio;
            } else {
                height = maxHeight;
                width = maxHeight * aspectRatio;
            }
        }
        
        // Update canvas size
        this.canvas.width = width;
        this.canvas.height = height;
        this.canvas.style.width = width + 'px';
        this.canvas.style.height = height + 'px';
        
        // Redraw after resize
        if (this.isRevealed) {
            this.redrawCanvas();
        }
    }

    /**
     * Redraw canvas after resize
     */
    redrawCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.globalAlpha = 1;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        let currentPath = null;
        
        this.drawingData.forEach(data => {
            switch (data.type) {
                case 'start':
                    this.ctx.beginPath();
                    this.ctx.moveTo(data.x, data.y);
                    this.ctx.strokeStyle = data.color;
                    this.ctx.lineWidth = data.size;
                    currentPath = { color: data.color, size: data.size };
                    break;
                    
                case 'draw':
                    if (currentPath) {
                        this.ctx.lineTo(data.x, data.y);
                    }
                    break;
                    
                case 'end':
                    if (currentPath) {
                        this.ctx.stroke();
                        currentPath = null;
                    }
                    break;
            }
        });
    }

    /**
     * Restart the game
     */
    restart() {
        // Clean up
        if (this.timer) {
            clearInterval(this.timer);
        }
        
        if (this.backgroundMusic) {
            this.backgroundMusic.pause();
            this.backgroundMusic.currentTime = 0;
        }
        
        // Redirect to index
        window.location.href = 'index.html';
    }

    /**
     * Handle page visibility changes (pause/resume timer)
     */
    handleVisibilityChange() {
        if (document.hidden) {
            if (this.timer) {
                clearInterval(this.timer);
            }
            if (this.backgroundMusic) {
                this.backgroundMusic.pause();
            }
        } else {
            if (!this.isRevealed && this.timeLeft > 0) {
                this.setupTimer();
                this.startBackgroundMusic();
            }
        }
    }
}

// Additional utility functions
const GameUtils = {
    /**
     * Get URL parameters
     */
    getUrlParams() {
        return new URLSearchParams(window.location.search);
    },

    /**
     * Format time for display
     */
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    },

    /**
     * Create audio context for better browser compatibility
     */
    createAudioContext() {
        try {
            window.AudioContext = window.AudioContext || window.webkitAudioContext;
            return new AudioContext();
        } catch (error) {
            console.warn('Web Audio API not supported:', error);
            return null;
        }
    },

    /**
     * Handle full screen for better mobile experience
     */
    requestFullscreen(element) {
        if (element.requestFullscreen) {
            element.requestFullscreen();
        } else if (element.webkitRequestFullscreen) {
            element.webkitRequestFullscreen();
        } else if (element.msRequestFullscreen) {
            element.msRequestFullscreen();
        }
    }
};

// Initialize the game
const game = new InvisibleArtGame();

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (game) {
        game.handleVisibilityChange();
    }
});

// Handle page unload cleanup
window.addEventListener('beforeunload', () => {
    if (game) {
        if (game.timer) {
            clearInterval(game.timer);
        }
        if (game.backgroundMusic) {
            game.backgroundMusic.pause();
        }
    }
});

// Export for potential module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { InvisibleArtGame, GameUtils };
}