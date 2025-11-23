/**
 * UI Logic - Handle display and user interactions
 */

// Available card backs
const CARD_BACKS = [
    'abstract.svg',
    'abstract_clouds.svg',
    'abstract_scene.svg',
    'astronaut.svg',
    'blue.svg',
    'castle.svg',
    'fish.svg',
    'frog.svg',
    'red.svg',
    'red2.svg'
];

// DOM Elements
const elements = {
    playerCards: document.getElementById('player-cards'),
    aiCards: document.getElementById('ai-cards'),
    leadCardSlot: document.getElementById('lead-card'),
    followCardSlot: document.getElementById('follow-card'),
    gameMessage: document.getElementById('game-message'),
    trickCount: document.getElementById('current-trick'),
    playerScore: document.getElementById('player-score'),
    aiScore: document.getElementById('ai-score'),
    newGameBtn: document.getElementById('new-game-btn'),
    restartBtn: document.getElementById('restart-btn'),
    settingsBtn: document.getElementById('settings-btn'),
    settingsModal: document.getElementById('settings-modal'),
    closeSettings: document.getElementById('close-settings'),
    cardBackGallery: document.getElementById('card-back-gallery'),
    aiDifficultySelect: document.getElementById('ai-difficulty')
};

// Initialize UI
function initUI() {
    // Set up event listeners
    elements.newGameBtn.addEventListener('click', startNewGame);
    elements.restartBtn.addEventListener('click', restartRound);
    elements.settingsBtn.addEventListener('click', openSettings);
    elements.closeSettings.addEventListener('click', closeSettings);
    elements.settingsModal.addEventListener('click', (e) => {
        if (e.target === elements.settingsModal) {
            closeSettings();
        }
    });

    // Initialize settings
    initializeSettings();
    
    // Update display
    updateScores();
    updateMessage("Click 'New Game' to start");
    
    // Add labels to card slots
    elements.leadCardSlot.setAttribute('data-label', 'Lead Card');
    elements.followCardSlot.setAttribute('data-label', 'Follow Card');
}

// Settings functions
function initializeSettings() {
    // Populate card back gallery
    elements.cardBackGallery.innerHTML = '';
    CARD_BACKS.forEach(back => {
        const option = document.createElement('div');
        option.className = 'card-back-option';
        if (back === game.selectedCardBack) {
            option.classList.add('selected');
        }
        
        const img = document.createElement('img');
        img.src = `assets/cards/backs/${back}`;
        img.alt = back;
        
        option.appendChild(img);
        option.addEventListener('click', () => selectCardBack(back));
        elements.cardBackGallery.appendChild(option);
    });

    // Set difficulty select
    elements.aiDifficultySelect.value = game.aiDifficulty;
    elements.aiDifficultySelect.addEventListener('change', (e) => {
        game.aiDifficulty = e.target.value;
        game.saveSettings();
    });
}

function selectCardBack(back) {
    game.selectedCardBack = back;
    game.saveSettings();
    
    // Update UI
    document.querySelectorAll('.card-back-option').forEach(option => {
        option.classList.remove('selected');
    });
    event.target.closest('.card-back-option').classList.add('selected');
    
    // Re-render AI cards if game is active
    if (game.gameActive) {
        renderAIHand();
    }
}

function openSettings() {
    elements.settingsModal.classList.remove('hidden');
}

function closeSettings() {
    elements.settingsModal.classList.add('hidden');
}

// Game functions
function startNewGame() {
    game.startNewGame();
    renderGame();
    updateMessage("Your turn! Play a card.");
}

function restartRound() {
    if (!game.gameActive) {
        startNewGame();
    } else {
        const confirmed = confirm("Are you sure you want to restart this round?");
        if (confirmed) {
            startNewGame();
        }
    }
}

// Render functions
function renderGame() {
    renderPlayerHand();
    renderAIHand();
    renderPlayArea();
    updateScores();
    updateTrickCount();
}

function renderPlayerHand() {
    elements.playerCards.innerHTML = '';
    
    game.playerHand.forEach((card, index) => {
        const cardElement = createCardElement(card, 'player', index);
        elements.playerCards.appendChild(cardElement);
    });
}

function renderAIHand() {
    elements.aiCards.innerHTML = '';
    
    game.aiHand.forEach((card, index) => {
        const cardElement = createCardBackElement();
        elements.aiCards.appendChild(cardElement);
    });
}

function createCardElement(card, player, index) {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'card dealing';
    if (player === 'ai') {
        cardDiv.classList.add('ai-card');
    }
    
    const img = document.createElement('img');
    img.src = card.getImagePath();
    img.alt = card.toString();
    
    cardDiv.appendChild(img);
    
    // Add click handler for player cards
    if (player === 'player') {
        cardDiv.addEventListener('click', () => handlePlayerCardClick(card, cardDiv));
        
        // Check if card is playable
        if (game.gameActive && game.currentPlayer === 'player') {
            if (!game.canPlayCard(card, 'player')) {
                cardDiv.classList.add('disabled');
            }
        } else {
            cardDiv.classList.add('disabled');
        }
    }
    
    return cardDiv;
}

function createCardBackElement() {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'card ai-card dealing';
    
    const img = document.createElement('img');
    img.src = `assets/cards/backs/${game.selectedCardBack}`;
    img.alt = 'Card back';
    
    cardDiv.appendChild(img);
    return cardDiv;
}

function renderPlayArea() {
    // Clear play area
    elements.leadCardSlot.innerHTML = '';
    elements.followCardSlot.innerHTML = '';
    
    // Render lead card if exists
    if (game.leadCard) {
        const leadCardElement = createPlayedCardElement(game.leadCard);
        elements.leadCardSlot.appendChild(leadCardElement);
    }
    
    // Render follow card if exists
    if (game.followCard) {
        const followCardElement = createPlayedCardElement(game.followCard);
        elements.followCardSlot.appendChild(followCardElement);
    }
}

function createPlayedCardElement(card) {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'card';
    
    const img = document.createElement('img');
    img.src = card.getImagePath();
    img.alt = card.toString();
    
    cardDiv.appendChild(img);
    return cardDiv;
}

// Event handlers
function handlePlayerCardClick(card, cardElement) {
    if (!game.gameActive || game.currentPlayer !== 'player') {
        return;
    }
    
    if (!game.canPlayCard(card, 'player')) {
        updateMessage("You must follow suit if you can!");
        return;
    }
    
    // Play the card
    cardElement.classList.add('playing');
    
    setTimeout(() => {
        const result = game.playCard(card, 'player');
        if (result) {
            renderGame();
            
            if (game.currentPlayer === 'ai') {
                updateMessage("AI is thinking...");
                setTimeout(handleAITurn, 1000);
            }
        }
    }, 300);
}

function handleAITurn() {
    if (!game.gameActive || game.currentPlayer !== 'ai') {
        return;
    }
    
    // AI chooses a card
    const chosenCard = ai.chooseCard();
    
    // Play the card
    game.playCard(chosenCard, 'ai');
    renderGame();
    
    // Check game state
    if (!game.gameActive) {
        // Game over
        handleGameOver();
    } else if (game.leadCard && game.followCard) {
        // Trick complete, show result
        handleTrickComplete();
    } else if (game.currentPlayer === 'ai') {
        // AI leads next trick
        updateMessage("AI is leading...");
        setTimeout(handleAITurn, 1000);
    } else {
        // Player's turn
        updateMessage("Your turn! Play a card.");
    }
}

function handleTrickComplete() {
    const lastTrick = game.trickHistory[game.trickHistory.length - 1];
    const winner = lastTrick.winner;
    const winnerText = winner === 'player' ? 'You' : 'AI';
    
    updateMessage(`${winnerText} won trick ${lastTrick.trickNumber}!`);
    
    // Clear the table after a delay
    setTimeout(() => {
        game.clearTrick();
        renderPlayArea();
        
        if (game.currentPlayer === 'ai') {
            updateMessage("AI is leading...");
            setTimeout(handleAITurn, 1000);
        } else {
            updateMessage("Your turn! Play a card.");
        }
    }, 2000);
}

function handleGameOver() {
    const lastTrick = game.trickHistory[game.trickHistory.length - 1];
    const winner = lastTrick.winner;
    const winnerText = winner === 'player' ? 'You' : 'AI';
    
    updateMessage(`${winnerText} won the final trick! ${winnerText === 'You' ? 'You get' : 'AI gets'} 1 point!`);
    updateScores();
    
    setTimeout(() => {
        const playAgain = confirm(`${winnerText} won this round!\n\nScore: You ${game.playerScore} - ${game.aiScore} AI\n\nPlay another round?`);
        if (playAgain) {
            startNewGame();
        } else {
            updateMessage("Game ended. Click 'New Game' to play again.");
        }
    }, 2000);
}

// Update functions
function updateMessage(message) {
    elements.gameMessage.textContent = message;
}

function updateTrickCount() {
    elements.trickCount.textContent = `Trick: ${game.currentTrick} / 5`;
}

function updateScores() {
    elements.playerScore.textContent = game.playerScore;
    elements.aiScore.textContent = game.aiScore;
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', initUI);
