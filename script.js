// ===== INVISIBLE ART CHALLENGE - GAME SCRIPT =====

// Game state variables
let difficulty = 'easy';
let timeLeft = 60;
let gameActive = true;
let isDrawing = false;
let timerInterval = null;
// The score variable has been removed
// let currentScore = 0;

// Canvas and drawing variables
let canvas = null;
let ctx = null;
let currentColor = '#000000';
let currentBrushSize = 5;
// The eraser mode has been removed
// let isEraserMode = false;
let drawnStrokes = [];

// Audio elements
let bgMusic = null;
let dingSound = null;

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    initializeGame();
});

function initializeGame() {
    // Parse difficulty from URL
    parseDifficultyFromURL();
    
    // Initialize DOM elements
    initializeElements();
    
    // Load random prompt image
    loadRandomPrompt();
    
    // Initialize canvas
    initializeCanvas();
    
    // Initialize audio
    initializeAudio();
    
    // Set up event listeners
    setupEventListeners();
    
    // Start timer
    startTimer();
}

// ===== URL PARSING =====
function parseDifficultyFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const levelParam = urlParams.get('level');
    
    if (levelParam && ['easy', 'medium', 'hard'].includes(levelParam)) {
        difficulty = levelParam;
    }
    
    // Set time based on difficulty
    switch(difficulty) {
        case 'easy':
            timeLeft = 60;
            break;
        case 'medium':
            timeLeft = 45;
            break;
        case 'hard':
            timeLeft = 30;
            break;
    }
}

// ===== DOM ELEMENT INITIALIZATION =====
function initializeElements() {
    canvas = document.getElementById('drawing-canvas');
    ctx = canvas.getContext('2d');
    bgMusic = document.getElementById('bg-music');
    dingSound = document.getElementById('ding-sound');
}

// ===== PROMPT IMAGE LOADING =====
function loadRandomPrompt() {
    // Generate random prompt number (1-3 for each difficulty)
    const promptNumber = Math.floor(Math.random() * 3) + 1;
    const imagePath = `assets/prompts/${difficulty}/prompt${promptNumber}-${difficulty}.png`;
    
    const promptImage = document.getElementById('prompt-image');
    promptImage.src = imagePath;
    
    // Set canvas size when image loads
    promptImage.onload = function() {
        canvas.width = this.naturalWidth || 400;
        canvas.height = this.naturalHeight || 400;
        
        // Set canvas display size to match container
        canvas.style.width = '100%';
        canvas.style.height = '350px';
        
        // Initialize drawing context
        setupDrawingContext();
    };
    
    // Fallback if image doesn't load
    promptImage.onerror = function() {
        canvas.width = 400;
        canvas.height = 350;
        setupDrawingContext();
    };
}

// ===== CANVAS INITIALIZATION =====
function initializeCanvas() {
    // Canvas will be sized when prompt image loads
    setupDrawingContext();
}

function setupDrawingContext() {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = currentBrushSize;
    ctx.strokeStyle = currentColor;
    
    // Make drawing invisible initially
    ctx.globalAlpha = 0;
    
    // Clear canvas with white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// ===== AUDIO INITIALIZATION =====
function initializeAudio() {
    if (bgMusic) {
        bgMusic.volume = 0.3;
        bgMusic.play().catch(e => {
            console.log('Autoplay prevented, user interaction required');
        });
    }
    
    if (dingSound) {
        dingSound.volume = 0.5;
    }
}

// ===== EVENT LISTENERS =====
function setupEventListeners() {
    // Drawing events
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
    
    // Touch events for mobile
    canvas.addEventListener('touchstart', handleTouch);
    canvas.addEventListener('touchmove', handleTouch);
    canvas.addEventListener('touchend', stopDrawing);
    
    // Color palette
    const colorOptions = document.querySelectorAll('.color-option');
    colorOptions.forEach(option => {
        option.addEventListener('click', selectColor);
    });
    
    // Brush sizes
    const brushSizes = document.querySelectorAll('.brush-size');
    brushSizes.forEach(brush => {
        brush.addEventListener('click', selectBrushSize);
    });
    
    // Tool buttons
    document.getElementById('clear-canvas').addEventListener('click', clearCanvas);
    // The eraser button listener has been removed
    
    // Game controls
    document.getElementById('reveal-btn').addEventListener('click', revealDrawing);
    document.getElementById('restart-btn').addEventListener('click', restartGame);
    
    // Enable audio on first user interaction
    document.addEventListener('click', enableAudio, { once: true });
}

// ===== DRAWING FUNCTIONS =====
function startDrawing(e) {
    if (!gameActive) return;
    
    isDrawing = true;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    
    // Store stroke start
    drawnStrokes.push({
        type: 'start',
        x: x,
        y: y,
        color: currentColor, // Eraser mode removed, always use current color
        size: currentBrushSize
    });
}

function draw(e) {
    if (!isDrawing || !gameActive) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    
    ctx.lineWidth = currentBrushSize;
    ctx.strokeStyle = currentColor; // Eraser mode removed, always use current color
    ctx.lineTo(x, y);
    ctx.stroke();
    
    // Store stroke point
    drawnStrokes.push({
        type: 'draw',
        x: x,
        y: y,
        color: currentColor, // Eraser mode removed, always use current color
        size: currentBrushSize
    });
}

function stopDrawing() {
    if (!isDrawing) return;
    isDrawing = false;
    ctx.beginPath();
    
    // Store stroke end
    drawnStrokes.push({ type: 'end' });
}

function handleTouch(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent(e.type === 'touchstart' ? 'mousedown' : 
                                     e.type === 'touchmove' ? 'mousemove' : 'mouseup', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    canvas.dispatchEvent(mouseEvent);
}

// ===== TOOL FUNCTIONS =====
function selectColor(e) {
    // Remove active class from all colors
    document.querySelectorAll('.color-option').forEach(option => {
        option.classList.remove('active');
    });
    
    // Add active class to selected color
    e.target.classList.add('active');
    
    // Update current color
    currentColor = e.target.dataset.color;
    // Eraser mode and its logic have been removed
}

function selectBrushSize(e) {
    // Remove active class from all brush sizes
    document.querySelectorAll('.brush-size').forEach(brush => {
        brush.classList.remove('active');
    });
    
    // Add active class to selected brush
    e.target.classList.add('active');
    
    // Update current brush size
    currentBrushSize = parseInt(e.target.dataset.size);
}

function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawnStrokes = [];
    setupDrawingContext();
}

// The toggleEraser function has been removed

// ===== TIMER FUNCTIONS =====
function startTimer() {
    updateTimerDisplay();
    
    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();
        
        // Play ding in last 3 seconds
        if (timeLeft <= 3 && timeLeft > 0) {
            playDingSound();
        }
        
        // Auto-reveal when time runs out
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            revealDrawing();
        }
    }, 1000);
}

function updateTimerDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const timerElement = document.getElementById('timer');
    
    timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    // Change color when time is running low
    if (timeLeft <= 10) {
        timerElement.style.color = '#e53e3e';
    } else if (timeLeft <= 30) {
        timerElement.style.color = '#dd6b20';
    }
}

function playDingSound() {
    if (dingSound) {
        dingSound.currentTime = 0;
        dingSound.play().catch(e => console.log('Could not play ding sound'));
    }
}

// ===== AUDIO FUNCTIONS =====
function enableAudio() {
    if (bgMusic && bgMusic.paused) {
        bgMusic.play().catch(e => console.log('Could not play background music'));
    }
}

// ===== FAKE AI REVEAL AND ROASTING LOGIC =====
function revealDrawing() {
    if (!gameActive) return;
    
    gameActive = false;
    clearInterval(timerInterval);

    // Disable reveal button
    document.getElementById('reveal-btn').disabled = true;
    document.getElementById('reveal-btn').style.opacity = '0.6';
    
    // Make drawing visible immediately
    redrawVisible();

    // Show the fake AI loading screen and add 'loading' class to body
    const aiLoadingScreen = document.getElementById('ai-loading');
    aiLoadingScreen.classList.remove('hidden');
    document.body.classList.add('loading-active');
    
    // Simulate AI processing time with a delay
    setTimeout(() => {
        // Store the feedback and the drawn image in local storage
        const feedback = generateRoastingQuote();
        const drawnImage = canvas.toDataURL(); // Get the canvas content as a data URL
        
        localStorage.setItem('aiFeedback', feedback);
        localStorage.setItem('drawnImage', drawnImage);

        // Redirect to the new result page
        window.location.href = 'result.html';
    }, 3000); // 3-second delay
}

function redrawVisible() {
    // Clear canvas and redraw with full opacity
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.globalAlpha = 1;
    
    // Redraw all strokes
    drawnStrokes.forEach(stroke => {
        if (stroke.type === 'start') {
            ctx.beginPath();
            ctx.moveTo(stroke.x, stroke.y);
            ctx.lineWidth = stroke.size;
            ctx.strokeStyle = stroke.color;
        } else if (stroke.type === 'draw') {
            ctx.lineTo(stroke.x, stroke.y);
            ctx.stroke();
        } else if (stroke.type === 'end') {
            ctx.beginPath();
        }
    });
}

// The showMatchResult function is no longer needed on this page

function generateRoastingQuote() {
    const quotes = [
        "The AI is struggling to identify this. It's asking if it's a new form of modern art or a glitch.",
        "Our neural network just rebooted itself. It couldn't handle the artistic complexity.",
        "I've seen better artwork on a cave wall. At least the cave artist had an excuse.",
        "Your drawing is... abstract. In the most generous sense of the word.",
        "Is this what they call 'drawing from memory'? Because you clearly have none.",
        "The AI has concluded that your drawing is a Rorschach test for people who can't see.",
        "Analysis complete: It appears you've captured the essence of 'I forgot what I was drawing'.",
        "It's a bold choice to use the entire canvas to represent a single line. A very bold choice.",
        "Our database of masterpieces does not contain any entries that remotely resemble this.",
        "This is what a picture looks like when it's been through a blender."
    ];

    const randomIndex = Math.floor(Math.random() * quotes.length);
    return quotes[randomIndex];
}

// ===== GAME CONTROL =====
function restartGame() {
    window.location.href = 'index.html';
}

// ===== ERROR HANDLING =====
window.addEventListener('error', function(e) {
    console.error('Game error:', e.error);
});

// Prevent context menu on canvas
canvas?.addEventListener('contextmenu', function(e) {
    e.preventDefault();
});
