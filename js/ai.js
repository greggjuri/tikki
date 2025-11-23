/**
 * AI Logic - Decision making for computer opponent
 */

class AI {
    constructor(gameState) {
        this.game = gameState;
        this.playedCards = []; // Track all cards played so far
    }

    // Main AI decision function
    chooseCard() {
        const difficulty = this.game.aiDifficulty;
        
        switch(difficulty) {
            case 'easy':
                return this.chooseCardEasy();
            case 'medium':
                return this.chooseCardMedium();
            case 'hard':
                return this.chooseCardHard();
            default:
                return this.chooseCardMedium();
        }
    }

    /**
     * EASY AI: Plays randomly or uses very basic rules
     */
    chooseCardEasy() {
        const validCards = this.game.getValidCards('ai');
        
        // Just play a random valid card
        const randomIndex = Math.floor(Math.random() * validCards.length);
        return validCards[randomIndex];
    }

    /**
     * MEDIUM AI: Uses decent strategy
     * - Tracks played cards
     * - Tries to dump low cards early
     * - Saves high cards for trick 5
     */
    chooseCardMedium() {
        const validCards = this.game.getValidCards('ai');
        const trickNumber = this.game.currentTrick;
        const isLeading = this.game.leadCard === null;

        // Update our tracking of played cards
        this.updatePlayedCards();

        // Trick 5 - try to win it
        if (trickNumber === 5) {
            return this.chooseBestCardToWin(validCards, isLeading);
        }

        // Tricks 1-4 - try to lose them (dump weak cards)
        if (isLeading) {
            // Lead with lowest card
            return this.getLowestCard(validCards);
        } else {
            // Try to lose the trick
            const leadSuit = this.game.leadCard.suit;
            const sameSuit = validCards.filter(c => c.suit === leadSuit);
            
            if (sameSuit.length > 0) {
                // Play lowest card of the suit that still loses
                const leadValue = this.game.leadCard.getValue();
                const losingCards = sameSuit.filter(c => c.getValue() < leadValue);
                
                if (losingCards.length > 0) {
                    return this.getLowestCard(losingCards);
                } else {
                    // Have to win, play lowest card
                    return this.getLowestCard(sameSuit);
                }
            } else {
                // Different suit, dump lowest card overall
                return this.getLowestCard(validCards);
            }
        }
    }

    /**
     * HARD AI: Advanced strategy
     * - Calculates probabilities
     * - Considers what player might have
     * - Optimal play for trick 5
     */
    chooseCardHard() {
        const validCards = this.game.getValidCards('ai');
        const trickNumber = this.game.currentTrick;
        const isLeading = this.game.leadCard === null;

        this.updatePlayedCards();

        // Trick 5 - calculate best chance to win
        if (trickNumber === 5) {
            if (isLeading) {
                return this.chooseOptimalLeadCard(validCards);
            } else {
                return this.chooseBestCardToWin(validCards, false);
            }
        }

        // Tricks 1-4 - sophisticated dumping strategy
        if (isLeading) {
            // Lead a suit where we're weak, dumping low cards
            return this.chooseStrategicLeadCard(validCards);
        } else {
            // Follow intelligently
            return this.chooseStrategicFollowCard(validCards);
        }
    }

    // Helper: Update list of played cards
    updatePlayedCards() {
        // Get all cards played in previous tricks
        this.playedCards = [];
        for (let trick of this.game.trickHistory) {
            this.playedCards.push(trick.leadCard);
            this.playedCards.push(trick.followCard);
        }
        // Add current trick if any
        if (this.game.leadCard) {
            this.playedCards.push(this.game.leadCard);
        }
    }

    // Helper: Get lowest value card
    getLowestCard(cards) {
        return cards.reduce((lowest, card) => 
            card.getValue() < lowest.getValue() ? card : lowest
        );
    }

    // Helper: Get highest value card
    getHighestCard(cards) {
        return cards.reduce((highest, card) => 
            card.getValue() > highest.getValue() ? card : highest
        );
    }

    // Helper: Choose best card to win current trick
    chooseBestCardToWin(validCards, isLeading) {
        if (isLeading) {
            // Lead with highest card
            return this.getHighestCard(validCards);
        } else {
            const leadSuit = this.game.leadCard.suit;
            const leadValue = this.game.leadCard.getValue();
            const sameSuit = validCards.filter(c => c.suit === leadSuit);
            
            if (sameSuit.length > 0) {
                // Try to barely beat the lead card
                const winningCards = sameSuit.filter(c => c.getValue() > leadValue);
                if (winningCards.length > 0) {
                    return this.getLowestCard(winningCards);
                } else {
                    // Can't win, play lowest
                    return this.getLowestCard(sameSuit);
                }
            } else {
                // Can't follow suit, can't win, dump lowest
                return this.getLowestCard(validCards);
            }
        }
    }

    // Helper: Choose optimal lead card (hard AI, trick 5)
    chooseOptimalLeadCard(validCards) {
        // Lead with the suit where we have the highest card
        // and it's likely to win (considering played cards)
        
        // Group cards by suit
        const bySuit = {};
        validCards.forEach(card => {
            if (!bySuit[card.suit]) {
                bySuit[card.suit] = [];
            }
            bySuit[card.suit].push(card);
        });

        // Find the suit with the highest card
        let bestCard = null;
        let bestScore = -1;

        for (let suit in bySuit) {
            const highest = this.getHighestCard(bySuit[suit]);
            const score = this.estimateWinProbability(highest);
            
            if (score > bestScore) {
                bestScore = score;
                bestCard = highest;
            }
        }

        return bestCard || this.getHighestCard(validCards);
    }

    // Helper: Estimate probability that a card will win if led
    estimateWinProbability(card) {
        // Count how many higher cards of this suit have been played
        const higherCardsPlayed = this.playedCards.filter(c => 
            c.suit === card.suit && c.getValue() > card.getValue()
        ).length;

        // Simple heuristic: higher card value + more higher cards played = higher probability
        return card.getValue() + (higherCardsPlayed * 2);
    }

    // Helper: Choose strategic lead card for tricks 1-4
    chooseStrategicLeadCard(validCards) {
        // Lead with a low card from a suit where we're weak
        // Group by suit
        const bySuit = {};
        validCards.forEach(card => {
            if (!bySuit[card.suit]) {
                bySuit[card.suit] = [];
            }
            bySuit[card.suit].push(card);
        });

        // Find suit with fewest cards and lead lowest from it
        let weakestSuit = null;
        let smallestCount = Infinity;

        for (let suit in bySuit) {
            if (bySuit[suit].length < smallestCount) {
                smallestCount = bySuit[suit].length;
                weakestSuit = suit;
            }
        }

        if (weakestSuit) {
            return this.getLowestCard(bySuit[weakestSuit]);
        }

        return this.getLowestCard(validCards);
    }

    // Helper: Choose strategic follow card for tricks 1-4
    chooseStrategicFollowCard(validCards) {
        const leadSuit = this.game.leadCard.suit;
        const leadValue = this.game.leadCard.getValue();
        const sameSuit = validCards.filter(c => c.suit === leadSuit);
        
        if (sameSuit.length > 0) {
            // Try to play just below the lead card if possible
            const losingCards = sameSuit.filter(c => c.getValue() < leadValue);
            
            if (losingCards.length > 0) {
                // Play the highest losing card (efficient dumping)
                return this.getHighestCard(losingCards);
            } else {
                // Must win, play lowest winning card
                return this.getLowestCard(sameSuit);
            }
        } else {
            // Different suit - dump our absolute lowest card
            return this.getLowestCard(validCards);
        }
    }
}

// Create AI instance
const ai = new AI(game);
