// ===== CONFIGURATION =====
const CONFIG = {
    GAME_EXPIRY_DAYS: 3,
    STORAGE_KEY: 'cardGameState',
    CARD_SELECTION_COUNT: 9,
    SLOT_CYCLES: 5,
    SLOT_ITEM_HEIGHT: 80,
    WHEEL_SECTIONS: 6, // Number of sections in the spinning wheel
    ANIMATIONS: {
        TRANSITION_DURATION: 300,
        FADE_DURATION: 400,
        CARD_FLIP_DELAY: 1000,
        SLOT_SPIN_DURATION: 2000,
        SLOT_HIGHLIGHT_DELAY: 500,
        WHEEL_SPIN_DURATION: 3000
    }
};

// Card data - shared between both games
const CARDS = Object.freeze([
    { id: 1, title: "Lucky Card", message: "Congratulations! You found the lucky card!" },
    { id: 2, title: "Mystery Box", message: "A mysterious treasure awaits you!" },
    { id: 3, title: "Golden Ticket", message: "You've won a golden ticket to adventure!" },
    { id: 4, title: "Magic Potion", message: "This potion grants you one wish!" },
    { id: 5, title: "Ancient Scroll", message: "The scroll reveals ancient wisdom." },
    { id: 6, title: "Diamond Gem", message: "A precious diamond worth a fortune!" },
    { id: 7, title: "Silver Key", message: "This key opens any door you choose." },
    { id: 8, title: "Phoenix Feather", message: "A rare feather with magical properties." },
    { id: 9, title: "Crystal Ball", message: "The crystal ball shows your future." },
    { id: 10, title: "Enchanted Ring", message: "This ring protects you from all harm." },
    { id: 11, title: "Hidden Treasure", message: "You've discovered a hidden treasure chest!" },
    { id: 12, title: "Star Fragment", message: "A fragment from a fallen star!" },
    { id: 13, title: "Dragon Scale", message: "A powerful scale from an ancient dragon." },
    { id: 14, title: "Mystic Orb", message: "The orb glows with mysterious energy." },
    { id: 15, title: "Royal Crown", message: "A crown fit for royalty!" },
    { id: 16, title: "Healing Herb", message: "This herb can cure any ailment." },
    { id: 17, title: "Lightning Bolt", message: "Harness the power of lightning!" },
    { id: 18, title: "Ocean Pearl", message: "A pearl from the depths of the ocean." },
    { id: 19, title: "Forest Spirit", message: "The spirit of the forest blesses you." },
    { id: 20, title: "Time Crystal", message: "This crystal can manipulate time itself." },
    { id: 21, title: "Cosmic Energy", message: "You've absorbed cosmic energy from the universe!" }
]);

// ===== GAME STATE =====
const GameState = {
    currentGame: null,
    cardPicker: {
        cards: [],
        isActive: true
    },
    slotMachine: {
        gamesPlayed: 0,
        gameEnded: false,
        reel: null,
        currentCard: null
    }
};

// localStorage management functions (more reliable than cookies for file:// protocol)
function setGameData(name, value) {
    try {
        localStorage.setItem(name, JSON.stringify(value));
        console.log('Data saved to localStorage:', name, value);
        return true;
    } catch(e) {
        console.error('Error saving to localStorage:', e);
        return false;
    }
}

function getGameData(name) {
    try {
        const data = localStorage.getItem(name);
        if (data) {
            const result = JSON.parse(data);
            console.log('Data retrieved from localStorage:', name, result);
            return result;
        }
        console.log('No data found in localStorage for:', name);
        return null;
    } catch(e) {
        console.error('Error reading from localStorage:', e);
        return null;
    }
}

function deleteGameData(name) {
    try {
        localStorage.removeItem(name);
        console.log('Data deleted from localStorage:', name);
        return true;
    } catch(e) {
        console.error('Error deleting from localStorage:', e);
        return false;
    }
}

// Check if localStorage is available
function isStorageAvailable() {
    try {
        const test = '__storage_test__';
        localStorage.setItem(test, 'test');
        localStorage.removeItem(test);
        return true;
    } catch(e) {
        return false;
    }
}

// Game state management
function checkGameState() {
    if (!isStorageAvailable()) {
        console.warn('localStorage not available');
        return null;
    }
    
    const gameState = getGameData(CONFIG.STORAGE_KEY);
    if (gameState && gameState.selectedCard && gameState.expiresAt) {
        const now = new Date().getTime();
        if (now < gameState.expiresAt) {
            console.log('Valid game state found:', gameState);
            return gameState;
        } else {
            // Expired, clean up
            console.log('Game state expired, cleaning up');
            deleteGameData(CONFIG.STORAGE_KEY);
        }
    }
    return null;
}

function saveGameResult(card) {
    if (!isStorageAvailable()) {
        console.warn('localStorage not available, cannot save game result');
        return;
    }
    
    const expiresAt = new Date().getTime() + (CONFIG.GAME_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
    const gameState = {
        selectedCard: card,
        playedAt: new Date().getTime(),
        expiresAt: expiresAt
    };
    
    console.log('Saving game result:', gameState);
    setGameData(CONFIG.STORAGE_KEY, gameState);
}

function formatTimeRemaining(expiresAt) {
    const now = new Date().getTime();
    const remaining = expiresAt - now;
    
    const days = Math.floor(remaining / (24 * 60 * 60 * 1000));
    const hours = Math.floor((remaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
    
    if (days > 0) {
        return `${days} day${days > 1 ? 's' : ''}, ${hours} hour${hours > 1 ? 's' : ''}`;
    } else if (hours > 0) {
        return `${hours} hour${hours > 1 ? 's' : ''}, ${minutes} minute${minutes > 1 ? 's' : ''}`;
    } else {
        return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    }
}

function showAlreadyPlayedModal(gameState) {
    const modal = document.createElement('div');
    modal.className = 'result-modal';
    modal.style.zIndex = '2000';
    
    const playedDate = new Date(gameState.playedAt).toLocaleDateString();
    const timeRemaining = formatTimeRemaining(gameState.expiresAt);
    
    modal.innerHTML = `
        <div class="modal-content">
            <h2>🎮 Already Played!</h2>
            <p><strong>You've already played the card game!</strong></p>
            <div style="margin: 20px 0; padding: 15px; background: rgba(102, 126, 234, 0.1); border-radius: 10px;">
                <p><strong>Your Result:</strong> ${gameState.selectedCard.title}</p>
                <p><em>${gameState.selectedCard.message}</em></p>
                <p style="font-size: 0.9rem; color: #666; margin-top: 10px;">Played on: ${playedDate}</p>
            </div>
            <p><strong>Next game available in:</strong><br>${timeRemaining}</p>
            <div class="modal-buttons">
                <button onclick="closeAlreadyPlayedModal()" style="background: linear-gradient(145deg, #667eea, #764ba2); color: white; border: none; padding: 12px 24px; border-radius: 25px; cursor: pointer;">OK</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function closeAlreadyPlayedModal() {
    const modal = document.querySelector('.result-modal[style*="z-index: 2000"]');
    if (modal) {
        modal.remove();
    }
    backToHub();
}

// Make function global for onclick handler
window.closeAlreadyPlayedModal = closeAlreadyPlayedModal;

// Navigation functions
function startGame(gameType) {
    // Check if game has already been played
    const existingGameState = checkGameState();
    if (existingGameState) {
        showAlreadyPlayedModal(existingGameState);
        return;
    }
    
    GameState.currentGame = gameType;
    
    // Add fade-out effect to hub
    const gameSelection = document.getElementById('game-selection');
    gameSelection.style.opacity = '0';
    gameSelection.style.transform = 'scale(0.95)';
    
    setTimeout(() => {
        // Hide game selection screen completely
        gameSelection.classList.add('hidden');
        gameSelection.style.opacity = '';
        gameSelection.style.transform = '';
        
        // Show selected game with fade-in effect
        if (gameType === 'card-picker') {
            const cardPickerGame = document.getElementById('card-picker-game');
            cardPickerGame.classList.remove('hidden');
            cardPickerGame.style.opacity = '0';
            cardPickerGame.style.transform = 'scale(1.05)';
            
            // Trigger fade-in
            setTimeout(() => {
                cardPickerGame.style.transition = 'all 0.4s ease';
                cardPickerGame.style.opacity = '1';
                cardPickerGame.style.transform = 'scale(1)';
            }, 50);
            
            initCardPicker();
        } else if (gameType === 'slot-machine') {
            const slotMachineGame = document.getElementById('slot-machine-game');
            slotMachineGame.classList.remove('hidden');
            slotMachineGame.style.opacity = '0';
            slotMachineGame.style.transform = 'scale(1.05)';
            
            // Trigger fade-in
            setTimeout(() => {
                slotMachineGame.style.transition = 'all 0.4s ease';
                slotMachineGame.style.opacity = '1';
                slotMachineGame.style.transform = 'scale(1)';
            }, 50);
            
            initSlotMachine();
        } else if (gameType === 'spinning-wheel') {
            const spinningWheelGame = document.getElementById('spinning-wheel-game');
            spinningWheelGame.classList.remove('hidden');
            spinningWheelGame.style.opacity = '0';
            spinningWheelGame.style.transform = 'scale(1.05)';
            
            // Trigger fade-in
            setTimeout(() => {
                spinningWheelGame.style.transition = 'all 0.4s ease';
                spinningWheelGame.style.opacity = '1';
                spinningWheelGame.style.transform = 'scale(1)';
            }, 50);
            
            initSpinningWheel();
        }
    }, 300);
}

function backToHub() {
    // Hide all game screens
    document.getElementById('card-picker-game').classList.add('hidden');
    document.getElementById('slot-machine-game').classList.add('hidden');
    document.getElementById('spinning-wheel-game').classList.add('hidden');
    
    // Show game selection screen
    document.getElementById('game-selection').classList.remove('hidden');
    
    // Reset games - but don't reset wheel position
    resetCardPicker();
    resetSlotMachine();
    resetSpinningWheelState(); // Only reset state, not position
    checkExistingGameOnLoad();
    
    GameState.currentGame = null;
}

// ========== CARD PICKER GAME ==========
let cardPickerGameCards = [];
let cardPickerGameActive = true;

function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function selectRandomCards() {
    const shuffled = shuffleArray(CARDS);
    return shuffled.slice(0, CONFIG.CARD_SELECTION_COUNT);
}

function createCardElement(card, index) {
    const cardElement = document.createElement('div');
    cardElement.className = 'card';
    cardElement.dataset.cardId = card.id;
    cardElement.dataset.index = index;
    
    cardElement.innerHTML = `
        <div class="card-back">
            ?
        </div>
        <div class="card-content">
            <div class="card-title">${card.title}</div>
            <div class="card-message">${card.message}</div>
        </div>
    `;
    
    cardElement.addEventListener('click', () => handleCardClick(cardElement, card));
    
    return cardElement;
}

function handleCardClick(cardElement, card) {
    if (!cardPickerGameActive || cardElement.classList.contains('flipped')) {
        return;
    }
    
    cardElement.classList.add('flipped');
    
    const allCardElements = document.querySelectorAll('.card');
    allCardElements.forEach(otherCard => {
        if (otherCard !== cardElement) {
            otherCard.classList.add('disabled');
        }
    });
    
    cardPickerGameActive = false;
    
    setTimeout(() => {
        showCardPickerResult(card);
    }, 1000);
}

function showCardPickerResult(selectedCard) {
    // Save the game result
    saveGameResult(selectedCard);
    
    const modal = document.getElementById('result-modal');
    const resultMessage = document.getElementById('result-message');
    
    resultMessage.innerHTML = `
        You selected: <strong>${selectedCard.title}</strong><br>
        <em>${selectedCard.message}</em>
    `;
    
    modal.classList.remove('hidden');
}

function initCardPicker() {
    const gameBoard = document.getElementById('game-board');
    gameBoard.innerHTML = '';
    
    cardPickerGameCards = selectRandomCards();
    
    cardPickerGameCards.forEach((card, index) => {
        const cardElement = createCardElement(card, index);
        gameBoard.appendChild(cardElement);
    });
    
    cardPickerGameActive = true;
}


function resetCardPicker() {
    const modal = document.getElementById('result-modal');
    modal.classList.add('hidden');
    const gameBoard = document.getElementById('game-board');
    gameBoard.innerHTML = '';
    cardPickerGameActive = true;
}

// ========== NEW 3-SLOT MACHINE GAME ==========
let slotCombinations = {}; // Maps combination strings to cards
let slotSelectedCards = []; // The 6 randomly selected cards
let slotGameEnded = false;
let slotCurrentResult = null;
let slotReels = [];

// Generate random combinations for selected cards
function generateSlotCombinations() {
    // Select 8 random cards from the CARDS array
    const shuffled = shuffleArray(CARDS);
    slotSelectedCards = shuffled.slice(0, 8);
    
    slotCombinations = {};
    
    // Generate all possible combinations (🐅,🐅,🐅 to 🦭,🦭,🦭)
    const allCombinations = [];
    const values = ['🐅', '🦭'];
    for (let i = 0; i < values.length; i++) {
        for (let j = 0; j < values.length; j++) {
            for (let k = 0; k < values.length; k++) {
                allCombinations.push([values[i], values[j], values[k]]);
            }
        }
    }
    
    // We have 8 possible combinations (2x2x2=8) and 8 cards
    // Each card gets exactly one winning combination
    const shuffledCombinations = shuffleArray(allCombinations);
    
    // Assign combinations to all 8 cards
    slotSelectedCards.forEach((card, index) => {
        const combination = shuffledCombinations[index];
        const combinationKey = combination.join(',');
        slotCombinations[combinationKey] = card;
        console.log(`Combination ${combinationKey} -> ${card.title}`);
    });
    
    console.log('All 8 cards have winning combinations - every spin guarantees a winner!');
}

// Create the legend showing all combinations
function createSlotLegend() {
    const legendList = document.getElementById('slot-legend-list');
    legendList.innerHTML = '';
    
    Object.entries(slotCombinations).forEach(([combination, card]) => {
        const legendItem = document.createElement('div');
        legendItem.className = 'legend-item';
        legendItem.dataset.combination = combination;
        
        const values = combination.split(',');
        const combinationDisplay = document.createElement('div');
        combinationDisplay.className = 'legend-combination';
        
        values.forEach(val => {
            const valueSpan = document.createElement('span');
            valueSpan.className = 'legend-number';
            valueSpan.textContent = val;
            combinationDisplay.appendChild(valueSpan);
        });
        
        const cardSpan = document.createElement('span');
        cardSpan.className = 'legend-card';
        cardSpan.textContent = card.title;
        
        legendItem.appendChild(combinationDisplay);
        legendItem.appendChild(cardSpan);
        
        legendList.appendChild(legendItem);
    });
}

// Initialize slot machine reels with static starting values
function initSlotReels() {
    slotReels = [];
    
    for (let i = 1; i <= 3; i++) {
        const reel = document.getElementById(`slot-reel-${i}`);
        slotReels.push(reel);
        
        // Create initial static content if reel is empty
        if (!reel.querySelector('.slot-reel-static')) {
            const staticContent = document.createElement('div');
            staticContent.classList.add('slot-reel-static');
            
            // Generate 3 random values for visual variety
            const randomValues = [];
            for (let j = 0; j < 3; j++) {
                const randomEmoji = Math.floor(Math.random() * 2) + 1;
                randomValues.push(randomEmoji === 1 ? '🐅' : '🦭');
            }
            
            randomValues.forEach((value, index) => {
                const valueElement = document.createElement('div');
                valueElement.className = 'slot-value';
                valueElement.textContent = value;
                
                // Highlight the middle value (index 1)
                if (index === 1) {
                    valueElement.classList.add('active');
                }
                
                staticContent.appendChild(valueElement);
            });
            
            // Position to show the middle value in the center
            staticContent.style.transform = 'translateY(-0px)';
            
            // Clear reel and add static content
            removeAllChildNodes(reel);
            reel.appendChild(staticContent);
        }
        
        // Reset any spinning states
        reel.classList.remove('spinning');
    }
}

// Clear all child nodes from an element
function removeAllChildNodes(parent) {
    while (parent.firstChild) {
        parent.removeChild(parent.firstChild);
    }
}

// Build the reel content with predetermined result and set initial position
function buildReelContent(reelElement, finalValue, reelIndex) {
    // Create the prizes container
    const prizeBlocks = document.createElement('div');
    prizeBlocks.classList.add('slot-reel-content');
    
        const slotValues = ['🐅', '🦭']; // Our available emojis
    const duplicatesPerValue = 15; // How many times each value appears
    const slotHeight = 40; // Height of each slot value
    
    // Create a long list of random values for spinning effect
    const randomValues = [];
    for (let i = 0; i < duplicatesPerValue; i++) {
        slotValues.forEach(value => {
            randomValues.push(value);
        });
    }
    
    // Shuffle the values for realistic spinning
    const shuffledValues = shuffleArray(randomValues);
    
    // Add all the shuffled values
    shuffledValues.forEach(value => {
        const valueElement = document.createElement('div');
        valueElement.className = 'slot-value';
        valueElement.textContent = value;
        prizeBlocks.appendChild(valueElement);
    });
    
    // Add the final result at the end
    const finalElement = document.createElement('div');
    finalElement.className = 'slot-value slot-value-final';
    finalElement.textContent = finalValue;
    prizeBlocks.appendChild(finalElement);
    
    // Clear the reel and add new content
    removeAllChildNodes(reelElement);
    reelElement.appendChild(prizeBlocks);
    
    // Set random initial position
    const randomInitialValue = slotValues[Math.floor(Math.random() * slotValues.length)];
    
    // Find a position where this initial value appears (but not too close to the end)
    const availablePositions = [];
    shuffledValues.forEach((value, index) => {
        if (value === randomInitialValue && index < shuffledValues.length - 5) {
            availablePositions.push(index);
        }
    });
    
    // Choose a random position from available ones
    const initialPosition = availablePositions.length > 0 
        ? availablePositions[Math.floor(Math.random() * availablePositions.length)]
        : 0;
    
    // Calculate initial translateY to show the selected value
    // We want to center the value in the visible area (20px offset for centering)
    const initialTranslateY = (initialPosition * slotHeight) - 80;
    
    // Set initial position
    prizeBlocks.style.transform = `translateY(-${initialTranslateY}px)`;
    
    // Highlight the initially visible value
    const initialElement = prizeBlocks.children[initialPosition];
    if (initialElement) {
        initialElement.classList.add('active');
    }
    
    console.log(`Reel ${reelIndex + 1}: Initial value ${randomInitialValue} at position ${initialPosition}, translateY: -${initialTranslateY}px`);
    
    return {
        totalItems: shuffledValues.length,
        initialPosition: initialTranslateY
    };
}

// Animate a single reel
function animateReel(reelElement, reelIndex, reelData) {
    const slotHeight = 80;
    const totalHeight = reelData.totalItems * slotHeight;
    const baseDuration = 2000;
    const duration = baseDuration + (reelIndex * 300); // Stagger the reels
    
    const prizeBlocks = reelElement.querySelector('.slot-reel-content');
    
    // Get current transform value (initial position)
    const currentTransform = prizeBlocks.style.transform;
    const currentTranslateY = currentTransform.includes('translateY') 
        ? currentTransform.match(/translateY\(([^)]+)\)/)[1] 
        : '0px';
    
    console.log(`Reel ${reelIndex + 1}: Starting animation from ${currentTranslateY} to -${totalHeight}px`);
    
    // Clear any previous active states
    reelElement.querySelectorAll('.slot-value.active').forEach(el => {
        el.classList.remove('active');
    });
    
    // Animate using Web Animations API - start from current position
    const animation = prizeBlocks.animate([
        {
            transform: currentTransform || "translateY(0px)"
        },
        {
            transform: `translateY(-${totalHeight}px)`
        }
    ], {
        duration: duration,
        fill: "forwards",
        easing: "cubic-bezier(0.25, 0.46, 0.45, 0.94)" // Smooth easing
    });
    
    return new Promise((resolve) => {
        animation.addEventListener('finish', () => {
            // Highlight the final value
            const finalValue = reelElement.querySelector('.slot-value-final');
            if (finalValue) {
                finalValue.classList.add('active');
            }
            resolve();
        });
    });
}

// Main slot machine spin function
async function spinSlotMachine() {
    if (slotGameEnded) return;
    
    slotGameEnded = true;
    
    const spinButton = document.getElementById('spin-button');
    spinButton.classList.add('spinning');
    spinButton.disabled = true;
    
    // Clear previous winning highlight
    document.querySelectorAll('.legend-item.winning').forEach(item => {
        item.classList.remove('winning');
    });
    
    // Generate random final values for each reel (1 or 2)
    const finalValues = [
        Math.random() < 0.5 ? '🐅' : '🦭',
        Math.random() < 0.5 ? '🐅' : '🦭',
        Math.random() < 0.5 ? '🐅' : '🦭'
    ];
    
    console.log('Final slot values:', finalValues);
    
    // Build reel content with predetermined results
    const reelPromises = slotReels.map((reel, index) => {
        const reelData = buildReelContent(reel, finalValues[index], index);
        return animateReel(reel, index, reelData);
    });
    
    // Wait for all reels to finish
    await Promise.all(reelPromises);
    
    // Check for winning combination
    const combinationKey = finalValues.join(',');
    const winningCard = slotCombinations[combinationKey];
    
    console.log('Final combination:', combinationKey, 'Winning card:', winningCard);
    
    if (winningCard) {
        // Highlight winning combination in legend
        const legendItem = document.querySelector(`[data-combination="${combinationKey}"]`);
        if (legendItem) {
            legendItem.classList.add('winning');
        }
        
        slotCurrentResult = winningCard;
        
        setTimeout(() => {
            showSlotResult(winningCard);
        }, 1000);
    } else {
        // No winning combination
        setTimeout(() => {
            showSlotResult(null);
        }, 1000);
    }
    
    spinButton.classList.remove('spinning');
}

// Show slot machine result
function showSlotResult(winningCard) {
    const modal = document.getElementById('slot-result-modal');
    const resultMessage = document.getElementById('slot-result-message');
    
    if (winningCard) {
        // Save the game result
        saveGameResult(winningCard);
        
        resultMessage.innerHTML = `
            🎉 <strong>Congratulations!</strong><br>
            You won: <strong>${winningCard.title}</strong><br>
            <em>${winningCard.message}</em>
        `;
    } else {
        resultMessage.innerHTML = `
            😔 <strong>No Match!</strong><br>
            Better luck next time!<br>
            <em>Try again for a different combination.</em>
        `;
    }
    
    modal.classList.remove('hidden');
}

// Close slot modal
function closeSlotModal() {
    const modal = document.getElementById('slot-result-modal');
    modal.classList.add('hidden');
    backToHub();
}

// Reset slot machine
function resetSlotMachine() {
    const modal = document.getElementById('slot-result-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
    
    slotGameEnded = false;
    slotCurrentResult = null;
    
    const spinButton = document.getElementById('spin-button');
    if (spinButton) {
        spinButton.disabled = false;
        spinButton.classList.remove('spinning');
    }
    
    // Clear winning highlights
    document.querySelectorAll('.legend-item.winning').forEach(item => {
        item.classList.remove('winning');
    });
    
    // Reset reels
    initSlotReels();
}

// Initialize slot machine game
function initSlotMachine() {
    generateSlotCombinations();
    createSlotLegend();
    initSlotReels();
}

// Debug function to test localStorage functionality
function testStorage() {
    console.log('Testing localStorage functionality...');
    
    if (!isStorageAvailable()) {
        console.error('localStorage is not available!');
        return;
    }
    
    const testData = { test: 'value', timestamp: new Date().getTime() };
    setGameData('test', testData);
    const retrieved = getGameData('test');
    console.log('Test storage result:', retrieved);
    deleteGameData('test');
    console.log('localStorage test completed successfully!');
}

// Check for existing game state on page load
function checkExistingGameOnLoad() {
    const existingGameState = checkGameState();
    if (existingGameState) {
        console.log('Found existing game state:', existingGameState);
        // Add visual indicator to hub that game was already played
        const hubFooter = document.querySelector('.hub-footer p');
        if (hubFooter) {
            const playedDate = new Date(existingGameState.playedAt).toLocaleDateString();
            const timeRemaining = formatTimeRemaining(existingGameState.expiresAt);
            hubFooter.innerHTML = `
                <strong style="color: #ffd700;">⚠️ Game Already Played</strong><br>
                Last result: ${existingGameState.selectedCard.title}<br>
                Next game available in: ${timeRemaining}
            `;
        }
    }
}

// ========== SPINNING WHEEL GAME ==========
let wheelSections = [];
let wheelSpinning = false;
let wheelCurrentCard = null;
let currentWheelRotation = 0; // Track current wheel position

function selectRandomWheelCards() {
    const shuffled = shuffleArray(CARDS);
    return shuffled.slice(0, CONFIG.WHEEL_SECTIONS);
}

function createWheelSections() {
    const wheel = document.getElementById('wheel');
    // Clear wheel but keep the center button
    const existingSections = wheel.querySelectorAll('.wheel-section');
    existingSections.forEach(section => section.remove());
    
    wheelSections = selectRandomWheelCards();
    
    // Create SVG-based wheel
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.setAttribute('viewBox', '0 0 300 300');
    svg.style.position = 'absolute';
    svg.style.top = '0';
    svg.style.left = '0';
    svg.style.zIndex = '1';
    
    const colors = [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', 
        '#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3'
    ];
    
    const radius = 140; // Slightly smaller than the wheel to account for border
    const centerX = 150;
    const centerY = 150;
    const degreesPerSection = 360 / CONFIG.WHEEL_SECTIONS;
    
    wheelSections.forEach((card, index) => {
        const startAngle = index * degreesPerSection - 90; // Start from top
        const endAngle = (index + 1) * degreesPerSection - 90;
        
        // Convert to radians
        const startAngleRad = (startAngle * Math.PI) / 180;
        const endAngleRad = (endAngle * Math.PI) / 180;
        
        // Calculate path coordinates
        const x1 = centerX + radius * Math.cos(startAngleRad);
        const y1 = centerY + radius * Math.sin(startAngleRad);
        const x2 = centerX + radius * Math.cos(endAngleRad);
        const y2 = centerY + radius * Math.sin(endAngleRad);
        
        const largeArcFlag = degreesPerSection > 180 ? 1 : 0;
        
        // Create path for the section
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const pathData = [
            `M ${centerX} ${centerY}`,
            `L ${x1} ${y1}`,
            `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
            'Z'
        ].join(' ');
        
        path.setAttribute('d', pathData);
        path.setAttribute('fill', colors[index % colors.length]);
        path.setAttribute('stroke', '#333');
        path.setAttribute('stroke-width', '1');
        path.classList.add('wheel-section');
        path.dataset.cardId = card.id;
        path.dataset.index = index;
        
        svg.appendChild(path);
        
        // Add text label
        const textAngle = startAngle + degreesPerSection / 2;
        const textRadius = radius * 0.7;
        const textX = centerX + textRadius * Math.cos((textAngle * Math.PI) / 180);
        const textY = centerY + textRadius * Math.sin((textAngle * Math.PI) / 180);
        
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', textX);
        text.setAttribute('y', textY);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('dominant-baseline', 'middle');
        text.setAttribute('fill', 'white');
        text.setAttribute('font-size', '12');
        text.setAttribute('font-weight', 'bold');
        text.setAttribute('text-shadow', '1px 1px 2px rgba(0,0,0,0.5)');
        text.style.filter = 'drop-shadow(1px 1px 2px rgba(0,0,0,0.5))';
        text.style.pointerEvents = 'none';
        
        // Truncate text if too long
        const maxLength = 12;
        const displayText = card.title.length > maxLength ? 
            card.title.substring(0, maxLength) + '...' : card.title;
        text.textContent = displayText;
        
        svg.appendChild(text);
    });
    
    wheel.appendChild(svg);
}

function spinWheel() {
    if (wheelSpinning) return;
    
    wheelSpinning = true;
    
    const spinButton = document.getElementById('wheel-center-button');
    const resultText = document.getElementById('wheel-result-text');
    
    spinButton.classList.add('spinning');
    spinButton.disabled = true;
    spinButton.textContent = 'Spinning...';
    
    const wheel = document.getElementById('wheel');
    
    // Get current rotation or start from 0
    const currentTransform = wheel.style.transform;
    let currentRotation = 0;
    if (currentTransform) {
        const match = currentTransform.match(/rotate\(([^)]+)\)/);
        if (match) {
            currentRotation = parseFloat(match[1]);
        }
    }
    
    // Generate a random rotation (multiple full rotations + random angle)
    const fullRotations = 5 + Math.floor(Math.random() * 4); // 5-8 full rotations
    const randomAngle = Math.random() * 360; // Random final angle
    const totalRotation = currentRotation + (fullRotations * 360) + randomAngle;
    
    // Set both start and final rotation CSS variables
    wheel.style.setProperty('--start-rotation', `${currentRotation}deg`);
    wheel.style.setProperty('--final-rotation', `${totalRotation}deg`);
    wheel.classList.add('wheel-spinning');
    
    console.log('Spinning wheel from', currentRotation, 'to', totalRotation);
    
    // Show result after spin completes
    setTimeout(() => {
        // Before removing the animation class, set the final transform directly
        wheel.style.transform = `rotate(${totalRotation}deg)`;
        
        // Now remove the animation class
        wheel.classList.remove('wheel-spinning');
        spinButton.classList.remove('spinning');
        
        // Calculate which section the arrow is pointing to
        const finalAngle = totalRotation % 360; // Get the final angle (0-360)
        const activeSection = calculateActiveSectionFromArrow(finalAngle);
        wheelCurrentCard = wheelSections[activeSection];
        
        console.log('Final angle:', finalAngle, 'Active section:', activeSection, 'Card:', wheelCurrentCard.title);
        
        // Display the actual card title
        spinButton.textContent = `The result is: ${wheelCurrentCard.title}`;
        
        setTimeout(() => {
            showWheelResult();
        }, 1000);
    }, CONFIG.ANIMATIONS.WHEEL_SPIN_DURATION);
}

function showWheelResult() {
    // Save the game result
    saveGameResult(wheelCurrentCard);
    
    // Show modal with result
    const modal = document.getElementById('wheel-result-modal');
    const resultMessage = document.getElementById('wheel-result-message');
    
    resultMessage.innerHTML = `
        You selected: <strong>${wheelCurrentCard.title}</strong><br>
        <em>${wheelCurrentCard.message}</em>
    `;
    
    modal.classList.remove('hidden');
    
    // Disable the spin button
    const spinButton = document.getElementById('wheel-center-button');
    spinButton.disabled = true;
    spinButton.style.opacity = '0.5';
    spinButton.style.cursor = 'not-allowed';
    // spinButton.textContent = '🔒 USED';
}

function closeWheelModal() {
    const modal = document.getElementById('wheel-result-modal');
    modal.classList.add('hidden');
    backToHub();
}

// Reset wheel state but preserve position (for navigation)
function resetSpinningWheelState() {
    const modal = document.getElementById('wheel-result-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
    
    wheelSpinning = false;
    wheelCurrentCard = null;
    
    const spinButton = document.getElementById('wheel-center-button');
    const resultText = document.getElementById('wheel-result-text');
    
    if (spinButton) {
        spinButton.disabled = false;
        spinButton.style.opacity = '1';
        spinButton.style.cursor = 'pointer';
        spinButton.textContent = 'Click SPIN to play!';
    }
    
    if (resultText) {
        resultText.textContent = '';
    }
    
    const wheel = document.getElementById('wheel');
    if (wheel) {
        wheel.classList.remove('wheel-spinning');
        // Keep wheel at current position - don't reset rotation
    }
}

// Full reset including wheel position (for testing/debugging)
function resetSpinningWheel() {
    const modal = document.getElementById('wheel-result-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
    
    wheelSpinning = false;
    wheelCurrentCard = null;
    
    const spinButton = document.getElementById('wheel-center-button');
    const resultText = document.getElementById('wheel-result-text');
    
    if (spinButton) {
        spinButton.disabled = false;
        spinButton.style.opacity = '1';
        spinButton.style.cursor = 'pointer';
        spinButton.textContent = 'SPIN';
    }
    
    if (resultText) {
        resultText.textContent = 'Click SPIN to play!';
    }
    
    const wheel = document.getElementById('wheel');
    if (wheel) {
        wheel.classList.remove('wheel-spinning');
        wheel.style.transform = 'rotate(0deg)';
        wheel.style.setProperty('--final-rotation', '0deg');
        wheel.style.setProperty('--start-rotation', '0deg');
    }
}

function calculateActiveSectionFromArrow(finalAngle) {
    // The arrow is pointing to the right (90 degrees from top)
    // We need to adjust for this and calculate which section it's pointing to
    
    // Normalize the angle to be positive and within 0-360
    let adjustedAngle = finalAngle;
    while (adjustedAngle < 0) adjustedAngle += 360;
    while (adjustedAngle >= 360) adjustedAngle -= 360;
    
    // Since the arrow points right (90 degrees), we need to offset by 90 degrees
    // Also, since the wheel rotates clockwise but sections are indexed counter-clockwise,
    // we need to reverse the calculation
    const arrowAngle = 90; // Arrow points to the right
    const relativeAngle = (arrowAngle - adjustedAngle) % 360;
    const normalizedAngle = relativeAngle < 0 ? relativeAngle + 360 : relativeAngle;
    
    // Calculate which section this angle falls into
    const degreesPerSection = 360 / CONFIG.WHEEL_SECTIONS;
    const sectionIndex = Math.floor(normalizedAngle / degreesPerSection);
    
    // Ensure the section index is within bounds
    return sectionIndex % CONFIG.WHEEL_SECTIONS;
}

function initSpinningWheel() {
    createWheelSections();
}

// Global functions for onclick handlers
window.spinWheel = spinWheel;
window.closeWheelModal = closeWheelModal;
window.closeSlotModal = closeSlotModal;
window.spinSlotMachine = spinSlotMachine;

// Event Listeners
document.getElementById("clear-state").addEventListener("click", () => {
    deleteGameData('cardGameState');
    window.location.reload();
});
document.addEventListener('DOMContentLoaded', function() {
    // Test storage functionality
    testStorage();
    
    // Check for existing game state
    checkExistingGameOnLoad();
    
    // Slot Machine event listeners
    const spinButton = document.getElementById('spin-button');
    if (spinButton) {
        spinButton.addEventListener('click', spinSlotMachine);
    }
    
    // Spinning Wheel event listeners
    const wheelSpinButton = document.getElementById('wheel-center-button');
    if (wheelSpinButton) {
        wheelSpinButton.addEventListener('click', spinWheel);
    }
});
