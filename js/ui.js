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
    playerScore: document.getElementById('player-score'),
    aiScore: document.getElementById('ai-score'),
    newGameBtn: document.getElementById('new-game-btn'),
    restartBtn: document.getElementById('restart-btn'),
    settingsBtn: document.getElementById('settings-btn'),
    settingsModal: document.getElementById('settings-modal'),
    closeSettings: document.getElementById('close-settings'),
    cardBackGallery: document.getElementById('card-back-gallery'),
    aiDifficultySelect: document.getElementById('ai-difficulty'),
    scoreGoalInput: document.getElementById('score-goal'),
    notificationModal: document.getElementById('notification-modal'),
    notificationTitle: document.getElementById('notification-title'),
    notificationMessage: document.getElementById('notification-message'),
    notificationOk: document.getElementById('notification-ok')
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

    // Set score goal input
    elements.scoreGoalInput.value = game.scoreGoal;
    elements.scoreGoalInput.addEventListener('change', (e) => {
        const value = parseInt(e.target.value);
        if (value >= 1 && value <= 20) {
            game.scoreGoal = value;
            game.saveSettings();
        } else {
            e.target.value = game.scoreGoal;
        }
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

// Notification function (updated to support Yes/No buttons)
function showNotification(title, message, onNo, onYes) {
    elements.notificationTitle.textContent = title;
    elements.notificationMessage.textContent = message;
    elements.notificationModal.classList.remove('hidden');
    
    if (onYes) {
        // Two-button mode (Yes/No)
        const yesBtn = document.createElement('button');
        yesBtn.textContent = 'Yes, Redeal';
        yesBtn.className = 'btn btn-primary';
        yesBtn.style.marginRight = '10px';
        
        const noBtn = document.createElement('button');
        noBtn.textContent = 'No, Keep Hand';
        noBtn.className = 'btn';
        
        const buttonContainer = document.createElement('div');
        buttonContainer.style.marginTop = '20px';
        buttonContainer.appendChild(yesBtn);
        buttonContainer.appendChild(noBtn);
        
        // Replace OK button with Yes/No buttons
        const oldOkBtn = elements.notificationOk;
        oldOkBtn.style.display = 'none';
        elements.notificationModal.querySelector('.modal-content').appendChild(buttonContainer);
        
        yesBtn.addEventListener('click', () => {
            elements.notificationModal.classList.add('hidden');
            buttonContainer.remove();
            oldOkBtn.style.display = '';
            if (onYes) onYes();
        });
        
        noBtn.addEventListener('click', () => {
            elements.notificationModal.classList.add('hidden');
            buttonContainer.remove();
            oldOkBtn.style.display = '';
            if (onNo) onNo();
        });
    } else {
        // Single-button mode (OK only)
        const newOkBtn = elements.notificationOk.cloneNode(true);
        elements.notificationOk.parentNode.replaceChild(newOkBtn, elements.notificationOk);
        elements.notificationOk = newOkBtn;
        
        elements.notificationOk.addEventListener('click', () => {
            elements.notificationModal.classList.add('hidden');
            if (onNo) onNo();
        });
    }
}

// Handle redeal offers after initial deal
async function handleRedealOffers() {
    // Check if player qualifies for redeal
    const playerQualifies = game.handQualifiesForRedeal(game.playerHand);
    
    // Check if AI qualifies for redeal
    const aiQualifies = game.handQualifiesForRedeal(game.aiHand);
    
    // Offer redeal to player first if they qualify
    if (playerQualifies) {
        const playerWantsRedeal = await new Promise((resolve) => {
            showNotification(
                '🎴 Weak Hand Detected',
                'Your highest card is 9 or lower. Would you like to redeal your hand?\n\n(You\'ll draw 5 new cards from the remaining deck)',
                () => resolve(false),
                () => resolve(true)
            );
        });
        
        if (playerWantsRedeal) {
            game.redealHand('player');
            renderPlayerHand();
            showNotification('Cards Redealt', 'You received 5 new cards!', null);
            await new Promise(resolve => setTimeout(resolve, 1500));
        }
    }
    
    // AI decides on redeal if it qualifies
    if (aiQualifies) {
        // AI always redeals if highest card is 9 or lower
        updateMessage("AI is considering a redeal...");
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        game.redealHand('ai');
        renderAIHand();
        showNotification('AI Redealt', 'The AI chose to redeal their hand.', null);
        await new Promise(resolve => setTimeout(resolve, 1500));
    }
}

// Game functions
function startNewGame() {
    game.startNewMatch();
    renderGame();
    updateMessage("Dealing cards...");
    
    // Check for redeal offers after initial deal
    setTimeout(async () => {
        await handleRedealOffers();
        updateMessage("Your turn! Play a card.");
    }, 500);
}

function restartRound() {
    if (!game.gameActive) {
        startNewGame();
    } else {
        const confirmed = confirm("Are you sure you want to restart this round?");
        if (confirmed) {
            game.startNewRound();
            renderGame();
            updateMessage("Your turn! Play a card.");
        }
    }
}

// Render functions
function renderGame() {
    renderPlayerHand();
    renderAIHand();
    renderPlayArea();
    updateScores();
}

function renderPlayerHand() {
    elements.playerCards.innerHTML = '';
    
    game.playerHand.forEach((card, index) => {
        const cardElement = createCardElement(card, 'player', index);
        elements.playerCards.appendChild(cardElement);
    });
}

function updatePlayerCardStates() {
    // Update disabled states on existing cards without re-rendering
    const cardElements = elements.playerCards.querySelectorAll('.card');
    const cards = game.playerHand;
    
    cardElements.forEach((cardElement, index) => {
        if (index < cards.length) {
            const card = cards[index];
            
            // Remove old disabled state
            cardElement.classList.remove('disabled');
            
            // Check if card should be disabled
            if (!game.gameActive || game.currentPlayer !== 'player') {
                cardElement.classList.add('disabled');
            } else if (!game.canPlayCard(card, 'player')) {
                cardElement.classList.add('disabled');
            }
        }
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
    cardDiv.className = 'card';
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
    cardDiv.className = 'card ai-card';
    
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
            // Remove the played card from hand (no jump)
            cardElement.remove();
            
            // Update play area to show the played card
            renderPlayArea();
            
            // Update AI hand count (remove one card)
            renderAIHand();
            
            // Update card states for remaining cards
            updatePlayerCardStates();
            
            // Check if trick is complete (both lead and follow cards played)
            if (game.leadCard && game.followCard) {
                // Trick complete
                handleTrickComplete();
            } else if (game.currentPlayer === 'ai') {
                // Player led, now AI's turn to follow
                updateMessage("AI is thinking...");
                setTimeout(handleAITurn, 1000);
            } else {
                // Player is leading next
                updateMessage("Your turn! Play a card.");
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
    
    // Update displays without full re-render
    renderPlayArea();
    renderAIHand();
    updatePlayerCardStates();
    
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
    
    // Disable player input during trick display
    const playerCards = document.querySelectorAll('#player-cards .card');
    playerCards.forEach(card => card.classList.add('disabled'));
    
    // Clear the table after a delay
    setTimeout(() => {
        game.clearTrick();
        renderPlayArea();
        renderPlayerHand(); // Re-render player cards to make them clickable again
        
        // Check if game is over
        if (!game.gameActive) {
            handleGameOver();
        } else if (game.currentPlayer === 'ai') {
            updateMessage("AI is leading...");
            setTimeout(handleAITurn, 1000);
        } else {
            updateMessage("Your turn! Play a card.");
        }
    }, 2000);
}

function handleGameOver() {
    const lastTrick = game.trickHistory[game.trickHistory.length - 1];
    const roundWinner = lastTrick.winner;
    const roundWinnerText = roundWinner === 'player' ? 'You' : 'AI';
    
    updateMessage(`${roundWinnerText} won the final trick!`);
    updateScores();
    
    setTimeout(() => {
        // Check if someone won the match
        if (game.playerScore >= game.scoreGoal) {
            showNotification(
                '🎉 You Won the Match!',
                `Congratulations! You reached ${game.scoreGoal} points!\n\nFinal Score: You ${game.playerScore} - ${game.aiScore} AI`,
                () => {
                    game.startNewMatch();
                    renderGame();
                    updateMessage("New match started! Your turn.");
                }
            );
        } else if (game.aiScore >= game.scoreGoal) {
            showNotification(
                'AI Won the Match',
                `AI reached ${game.scoreGoal} points.\n\nFinal Score: You ${game.playerScore} - ${game.aiScore} AI`,
                () => {
                    game.startNewMatch();
                    renderGame();
                    updateMessage("New match started! Your turn.");
                }
            );
        } else {
            // Round over but match continues
            showNotification(
                'Round Complete',
                `${roundWinnerText} won this round!\n\nScore: You ${game.playerScore} - ${game.aiScore} AI\n\nFirst to ${game.scoreGoal} wins!`,
                () => {
                    game.startNewRound();
                    renderGame();
                    updateMessage("New round! Your turn.");
                }
            );
        }
    }, 2000);
}

// Update functions
function updateMessage(message) {
    elements.gameMessage.textContent = message;
}

function updateScores() {
    elements.playerScore.textContent = game.playerScore;
    elements.aiScore.textContent = game.aiScore;
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', initUI);
