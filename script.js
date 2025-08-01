// ===== INVISIBLE ART CHALLENGE - GAME SCRIPT =====

// Game state variables
let difficulty = 'easy';
let timeLeft = 60;
let gameActive = true;
let isDrawing = false;
let timerInterval = null;

// Canvas and drawing variables
let canvas = null;
let ctx = null;
let currentColor = '#000000'; // Initial color is black
let currentBrushSize = 5;
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
    
    // Make drawing invisible initially by setting globalAlpha to 0
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
    
    // Tool buttons (clear canvas is the only one left)
    document.getElementById('clear-canvas').addEventListener('click', clearCanvas);
    
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
        color: currentColor,
        size: currentBrushSize
    });
}

function draw(e) {
    if (!isDrawing || !gameActive) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    
    ctx.lineWidth = currentBrushSize;
    ctx.strokeStyle = currentColor;
    ctx.lineTo(x, y);
    ctx.stroke();
    
    // Store stroke point
    drawnStrokes.push({
        type: 'draw',
        x: x,
        y: y,
        color: currentColor,
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
    ctx.strokeStyle = currentColor;
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
    ctx.lineWidth = currentBrushSize;
}

function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawnStrokes = [];
    setupDrawingContext();
}


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

// ===== AI INTEGRATION FUNCTIONS =====
/**
 * Asynchronously checks the user's drawing against the reference image using the Gemini API.
 * @returns {Promise<{score: number, quote: string}>} A promise that resolves with the match score and a funny quote.
 */
async function checkMatchWithAI() {
    // 1. Get the reference image data from the prompt image
    const promptImage = document.getElementById('prompt-image');
    if (!promptImage.src) {
        throw new Error('Reference image not loaded.');
    }
    const promptData = await fetch(promptImage.src).then(res => res.blob());
    const promptBase64 = await new Promise(resolve => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.split(',')[1]);
        reader.readAsDataURL(promptData);
    });

    // 2. Get the user's drawing from the canvas
    const drawnImageBase64 = canvas.toDataURL('image/png').split(',')[1];
    
    // 3. Define the prompt for the AI
    const promptText = "Compare the user's drawing with the reference image. Your response MUST be a JSON object with two fields: 'score', which is an integer from 0 to 100 representing the likeness, and 'funnyQuote', which is a single funny quote about art. Make sure your JSON is well-formed.";

    // 4. Construct the API request payload
    let chatHistory = [];
    const payload = {
        contents: [
            {
                role: "user",
                parts: [
                    { text: promptText },
                    { inlineData: { mimeType: "image/png", data: promptBase64 } },
                    { inlineData: { mimeType: "image/png", data: drawnImageBase64 } }
                ]
            }
        ],
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
                type: "OBJECT",
                properties: {
                    "score": { "type": "NUMBER" },
                    "funnyQuote": { "type": "STRING" }
                }
            }
        }
    };
    
    // 5. Make the API call to Gemini
    // IMPORTANT: This API key is provided by the user. Do not share or reuse it.
    const apiKey = "AIzaSyBQ8fr6BiS-tBTfLyCSU8bwuKvifd5VVHw";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
    
    let result = null;
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            // Log the full response to the console to help with debugging
            const apiResult = await response.json();
            console.log("Full API Response:", apiResult);

            if (!apiResult.candidates || apiResult.candidates.length === 0 || !apiResult.candidates[0].content || !apiResult.candidates[0].content.parts || apiResult.candidates[0].content.parts.length === 0) {
                throw new Error("Invalid API response format.");
            }
            
            const jsonString = apiResult.candidates[0].content.parts[0].text;
            result = JSON.parse(jsonString);
            break;
        } catch (e) {
            attempts++;
            if (attempts < maxAttempts) {
                const delay = Math.pow(2, attempts) * 1000; // Exponential backoff
                console.error(`Attempt ${attempts} failed. Retrying in ${delay / 1000}s...`, e);
                await new Promise(res => setTimeout(res, delay));
            } else {
                console.error("Failed to call Gemini API after multiple attempts.", e);
                throw e;
            }
        }
    }
    
    if (result) {
        return {
            score: result.score,
            quote: result.funnyQuote
        };
    } else {
        throw new Error('API call failed or returned an invalid response.');
    }
}

// ===== REVEAL AND AI FEEDBACK =====
async function revealDrawing() {
    if (!gameActive) return;
    
    gameActive = false;
    clearInterval(timerInterval);
    
    // Make drawing visible by redrawing with full opacity
    redrawVisible();
    
    // Show a loading message while waiting for the AI
    const resultElement = document.getElementById('match-result');
    document.getElementById('match-feedback').textContent = "AI is analyzing your masterpiece...";
    document.getElementById('match-score').textContent = "..."
    document.getElementById('points-earned').textContent = "..."
    resultElement.classList.remove('hidden');

    try {
        // Call the AI to check the match and get feedback
        const aiResult = await checkMatchWithAI();
        
        // Update the UI with the AI's response
        document.getElementById('match-score').textContent = Math.round(aiResult.score);
        document.getElementById('match-feedback').textContent = aiResult.quote;
        
        // Calculate and display points based on the AI score
        const pointsEarned = calculatePoints(aiResult.score);
        document.getElementById('points-earned').textContent = pointsEarned;

    } catch (error) {
        console.error("Error with AI analysis:", error);
        document.getElementById('match-feedback').textContent = "AI is on a coffee break. Try again!";
        document.getElementById('match-score').textContent = "N/A";
        document.getElementById('points-earned').textContent = "0";
    }
    
    // Disable reveal button
    document.getElementById('reveal-btn').disabled = true;
    document.getElementById('reveal-btn').style.opacity = '0.6';
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

function calculatePoints(matchScore) {
    let points = matchScore;
    
    switch (difficulty) {
        case 'easy':
            points *= 1;
            break;
        case 'medium':
            points *= 1.5;
            break;
        case 'hard':
            points *= 2;
            break;
    }
    
    if (timeLeft > 0) {
        points += timeLeft * 2;
    }
    
    return Math.floor(points);
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
