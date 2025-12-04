/**
 * Game Logic - Core game state and rules
 */

class Card {
    constructor(suit, rank) {
        this.suit = suit;
        this.rank = rank;
    }

    // Get the numeric value for comparison (Ace=14, King=13, Queen=12, Jack=11)
    getValue() {
        const values = {
            '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
            'jack': 11, 'queen': 12, 'king': 13, 'ace': 14
        };
        return values[this.rank];
    }

    // Get the image filename
    getImagePath() {
        return `assets/cards/fronts/${this.suit}_${this.rank}.svg`;
    }

    toString() {
        return `${this.rank} of ${this.suit}`;
    }
}

class Deck {
    constructor() {
        this.cards = [];
        this.initialize();
        this.soundEnabled = true; // Default on
    }

    initialize() {
        const suits = ['clubs', 'diamonds', 'hearts', 'spades'];
        const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'jack', 'queen', 'king', 'ace'];
        
        this.cards = [];
        for (let suit of suits) {
            for (let rank of ranks) {
                this.cards.push(new Card(suit, rank));
            }
        }
    }

    shuffle() {
        // Fisher-Yates shuffle algorithm
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }

    deal(count) {
        return this.cards.splice(0, count);
    }
}

class GameState {
    constructor() {
        this.deck = new Deck();
        this.playerHand = [];
        this.aiHand = [];
        this.playerScore = 0;
        this.aiScore = 0;
        this.scoreGoal = 5; // Points needed to win the match
        this.currentTrick = 0;
        this.leadCard = null;
        this.followCard = null;
        this.leadPlayer = null; // 'player' or 'ai'
        this.currentPlayer = null; // whose turn it is
        this.playedCards = []; // cards played in current trick
        this.trickHistory = []; // history of all tricks
        this.gameActive = false;
        this.roundActive = false; // Track if a round is being played
        this.aiDifficulty = 'medium';
        this.selectedCardBack = 'blue.svg';
        
        // Load settings from localStorage
        this.loadSettings();
    }

    loadSettings() {
        const savedDifficulty = localStorage.getItem('aiDifficulty');
        const savedCardBack = localStorage.getItem('cardBack');
        const savedGoal = localStorage.getItem('scoreGoal');
        
        if (savedDifficulty) {
            this.aiDifficulty = savedDifficulty;
        }
        if (savedCardBack) {
            this.selectedCardBack = savedCardBack;
        }
        if (savedGoal) {
            this.scoreGoal = parseInt(savedGoal);
        }

        const savedSound = localStorage.getItem('soundEnabled');
        
        if (savedSound !== null) {
            this.soundEnabled = savedSound === 'true';
        }
    }
        

    saveSettings() {
        localStorage.setItem('aiDifficulty', this.aiDifficulty);
        localStorage.setItem('cardBack', this.selectedCardBack);
        localStorage.setItem('scoreGoal', this.scoreGoal.toString());
        localStorage.setItem('soundEnabled', this.soundEnabled.toString());
    }

    startNewMatch() {
        // Reset scores for a brand new match
        this.playerScore = 0;
        this.aiScore = 0;
        this.startNewRound();
    }

    startNewRound() {
        // Start a new round (keep scores)
        this.deck.initialize();
        this.deck.shuffle();
        
        this.playerHand = this.deck.deal(5);
        this.aiHand = this.deck.deal(5);
        
        this.currentTrick = 1;
        this.leadCard = null;
        this.followCard = null;
        this.playedCards = [];
        this.trickHistory = [];
        
        // Randomly determine who goes first (or player next to dealer always goes first)
        // For simplicity, let's say player always goes first in the first trick
        this.leadPlayer = 'player';
        this.currentPlayer = 'player';
        this.gameActive = true;
        this.roundActive = true;
    }

    // Keep old name for compatibility during transition
    startNewGame() {
        this.startNewRound();
    }

    canPlayCard(card, player) {
        // If this player is leading, they can play any card
        if (this.currentPlayer !== player) {
            return false;
        }

        if (this.leadCard === null) {
            return true;
        }

        // If following, must follow suit if possible
        const hand = player === 'player' ? this.playerHand : this.aiHand;
        const hasSuit = hand.some(c => c.suit === this.leadCard.suit);
        
        if (hasSuit) {
            // Must play a card of the same suit
            return card.suit === this.leadCard.suit;
        } else {
            // Can play any card if they don't have the suit
            return true;
        }
    }

    playCard(card, player) {
        if (!this.canPlayCard(card, player)) {
            return false;
        }

        // Remove card from hand
        const hand = player === 'player' ? this.playerHand : this.aiHand;
        const index = hand.findIndex(c => c.suit === card.suit && c.rank === card.rank);
        if (index !== -1) {
            hand.splice(index, 1);
        }

        // Place card on table
        if (this.leadCard === null) {
            this.leadCard = card;
            this.leadPlayer = player;
            this.playedCards.push({ card, player });
            // Switch to other player
            this.currentPlayer = player === 'player' ? 'ai' : 'player';
        } else {
            this.followCard = card;
            this.playedCards.push({ card, player });
            // Trick is complete, evaluate it
            this.evaluateTrick();
        }

        return true;
    }

    evaluateTrick() {
        // Winner is the highest card of the lead suit
        const leadSuit = this.leadCard.suit;
        
        let winner;
        if (this.followCard.suit === leadSuit) {
            // Both cards are same suit, compare values
            winner = this.leadCard.getValue() > this.followCard.getValue() ? this.leadPlayer : 
                    (this.leadPlayer === 'player' ? 'ai' : 'player');
        } else {
            // Follow card is different suit, lead wins
            winner = this.leadPlayer;
        }

        // Store trick result (save cards before clearing)
        this.trickHistory.push({
            trickNumber: this.currentTrick,
            leadCard: this.leadCard,
            followCard: this.followCard,
            leadPlayer: this.leadPlayer,
            winner: winner
        });

        // If this was the final trick (trick 5), award point
        if (this.currentTrick === 5) {
            if (winner === 'player') {
                this.playerScore++;
            } else {
                this.aiScore++;
            }
            this.gameActive = false;
            return 'game_over';
        }

        // Prepare for next trick
        this.leadPlayer = winner;
        this.currentPlayer = winner;
        this.currentTrick++;
        
        // DON'T clear the cards here - let UI handle display timing
        // but the trick is marked as complete
        return 'trick_complete';
    }

    clearTrick() {
        this.leadCard = null;
        this.followCard = null;
        this.playedCards = [];
    }

    getValidCards(player) {
        const hand = player === 'player' ? this.playerHand : this.aiHand;
        
        if (this.leadCard === null) {
            // Leading, all cards are valid
            return hand.slice();
        }

        // Following, must follow suit if possible
        const sameSuit = hand.filter(c => c.suit === this.leadCard.suit);
        if (sameSuit.length > 0) {
            return sameSuit;
        } else {
            return hand.slice();
        }
    }

    // Check if hand qualifies for redeal (highest card is 9 or lower)
    handQualifiesForRedeal(hand) {
        const highestValue = Math.max(...hand.map(card => card.getValue()));
        return highestValue <= 9;
    }

    // Redeal a hand (draw 5 new cards from remaining deck)
    redealHand(player) {
        if (player === 'player') {
            this.playerHand = this.deck.deal(5);
        } else {
            this.aiHand = this.deck.deal(5);
        }
    }

    resetScores() {
        this.playerScore = 0;
        this.aiScore = 0;
    }
}

// Global game state
const game = new GameState();
