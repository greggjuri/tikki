/**
 * AI Logic - Decision making for computer opponent
 * 
 * Difficulty Levels:
 * - Easy: Random valid plays
 * - Medium: Basic strategy (dump low, save high)
 * - Hard: Probability-based decisions
 * - Grandmaster: Advanced suit-draining and lead control strategy
 */

class AI {
    constructor(gameState) {
        this.game = gameState;
        this.playedCards = []; // Track all cards played so far
        this.opponentVoidSuits = new Set(); // Track suits opponent is void in
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
            case 'grandmaster':
                return this.chooseCardGrandmaster();
            default:
                return this.chooseCardMedium();
        }
    }

    /**
     * EASY AI: Plays randomly or uses very basic rules
     */
    chooseCardEasy() {
        const validCards = this.game.getValidCards('ai');
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

        this.updatePlayedCards();

        if (trickNumber === 5) {
            return this.chooseBestCardToWin(validCards, isLeading);
        }

        if (isLeading) {
            return this.getLowestCard(validCards);
        } else {
            const leadSuit = this.game.leadCard.suit;
            const sameSuit = validCards.filter(c => c.suit === leadSuit);
            
            if (sameSuit.length > 0) {
                const leadValue = this.game.leadCard.getValue();
                const losingCards = sameSuit.filter(c => c.getValue() < leadValue);
                
                if (losingCards.length > 0) {
                    return this.getLowestCard(losingCards);
                } else {
                    return this.getLowestCard(sameSuit);
                }
            } else {
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

        if (trickNumber === 5) {
            if (isLeading) {
                return this.chooseOptimalLeadCard(validCards);
            } else {
                return this.chooseBestCardToWin(validCards, false);
            }
        }

        if (isLeading) {
            return this.chooseStrategicLeadCard(validCards);
        } else {
            return this.chooseStrategicFollowCard(validCards);
        }
    }

    /**
     * GRANDMASTER AI: Expert-level strategy based on winning player patterns
     * 
     * Core Strategies:
     * 1. SUIT DRAINING: Lead high cards from multi-card suits to exhaust opponent's cards in that suit
     * 2. ALWAYS TAKE TRICKS: When following and can win, always take it to control the lead
     * 3. SINGLETON DUMPING: Get rid of single cards in suits early
     * 4. VOID CREATION: Track opponent voids and exploit them on trick 5
     * 5. PROGRESSIVE AGGRESSION: Increase card strength played as game progresses
     * 6. LEAD CONTROL: Prioritize winning tricks to dictate suit selection
     */
    chooseCardGrandmaster() {
        const validCards = this.game.getValidCards('ai');
        const trickNumber = this.game.currentTrick;
        const isLeading = this.game.leadCard === null;
        const hand = this.game.aiHand;

        this.updatePlayedCards();
        this.updateOpponentVoids();

        // TRICK 5: All-out to win
        if (trickNumber === 5) {
            return this.grandmasterTrick5(validCards, isLeading);
        }

        // TRICKS 1-4: Strategic play for position
        if (isLeading) {
            return this.grandmasterLead(validCards, hand, trickNumber);
        } else {
            return this.grandmasterFollow(validCards, trickNumber);
        }
    }

    /**
     * Grandmaster: Trick 5 - Maximum effort to win
     */
    grandmasterTrick5(validCards, isLeading) {
        if (isLeading) {
            // Lead from a suit where opponent is void (guaranteed win)
            const voidSuitCards = validCards.filter(c => this.opponentVoidSuits.has(c.suit));
            if (voidSuitCards.length > 0) {
                // Any card in a void suit wins - play lowest to be efficient
                return this.getLowestCard(voidSuitCards);
            }

            // Otherwise, lead highest card from suit most likely to win
            return this.chooseBestWinningSuit(validCards);
        } else {
            // Following on trick 5: MUST try to win
            const leadSuit = this.game.leadCard.suit;
            const leadValue = this.game.leadCard.getValue();
            const sameSuit = validCards.filter(c => c.suit === leadSuit);
            
            if (sameSuit.length > 0) {
                const winningCards = sameSuit.filter(c => c.getValue() > leadValue);
                if (winningCards.length > 0) {
                    // Play lowest winning card
                    return this.getLowestCard(winningCards);
                }
                // Can't win, minimize damage
                return this.getLowestCard(sameSuit);
            }
            // Off suit - dump lowest
            return this.getLowestCard(validCards);
        }
    }

    /**
     * Grandmaster: Leading strategy for tricks 1-4
     * 
     * Priority order:
     * 1. Dump singletons (void a suit for later advantage)
     * 2. Lead HIGH from multi-card suits to drain opponent (suit draining)
     * 3. Progressive aggression based on trick number
     */
    grandmasterLead(validCards, hand, trickNumber) {
        // Group cards by suit
        const bySuit = this.groupBySuit(validCards);
        const handBySuit = this.groupBySuit(hand);
        
        // Strategy 1: SINGLETON DUMPING
        // If we have a suit with only 1 card, lead it to void that suit
        for (let suit in bySuit) {
            if (handBySuit[suit] && handBySuit[suit].length === 1) {
                // This is a singleton - dump it
                return handBySuit[suit][0];
            }
        }

        // Strategy 2: SUIT DRAINING
        // Lead HIGH cards from suits where we have multiple cards
        // This forces opponent to use their high cards or become void
        
        // Find suits with 2+ cards
        const multiCardSuits = [];
        for (let suit in handBySuit) {
            if (handBySuit[suit].length >= 2) {
                multiCardSuits.push({
                    suit: suit,
                    cards: handBySuit[suit],
                    highest: this.getHighestCard(handBySuit[suit]),
                    lowest: this.getLowestCard(handBySuit[suit])
                });
            }
        }

        if (multiCardSuits.length > 0) {
            // Progressive aggression: higher cards as tricks progress
            // Tricks 1-2: Lead from suit where our high card is strong but not our best overall
            // Tricks 3-4: Lead our power cards to drain and set up trick 5
            
            if (trickNumber <= 2) {
                // Early game: Lead high from our WEAKEST multi-card suit
                // This drains opponent while preserving our strongest suits
                multiCardSuits.sort((a, b) => a.highest.getValue() - b.highest.getValue());
                const weakestSuit = multiCardSuits[0];
                return weakestSuit.highest;
            } else {
                // Mid-game (tricks 3-4): Lead high from STRONGEST suit to dominate
                multiCardSuits.sort((a, b) => b.highest.getValue() - a.highest.getValue());
                const strongestSuit = multiCardSuits[0];
                return strongestSuit.highest;
            }
        }

        // Fallback: No multi-card suits, play based on trick number
        // Progressive aggression
        const sorted = [...validCards].sort((a, b) => a.getValue() - b.getValue());
        const aggressionIndex = Math.floor((trickNumber / 5) * (sorted.length - 1));
        return sorted[Math.min(aggressionIndex, sorted.length - 1)];
    }

    /**
     * Grandmaster: Following strategy for tricks 1-4
     * 
     * Core rule: ALWAYS TAKE THE TRICK if possible (100% win-when-can)
     * This maintains lead control and lets us dictate suit selection
     */
    grandmasterFollow(validCards, trickNumber) {
        const leadSuit = this.game.leadCard.suit;
        const leadValue = this.game.leadCard.getValue();
        const sameSuit = validCards.filter(c => c.suit === leadSuit);
        
        if (sameSuit.length > 0) {
            const winningCards = sameSuit.filter(c => c.getValue() > leadValue);
            
            if (winningCards.length > 0) {
                // ALWAYS TAKE THE TRICK - this is the key grandmaster insight
                // Use the LOWEST winning card to be efficient
                return this.getLowestCard(winningCards);
            } else {
                // Can't win - dump highest card we can (efficient disposal)
                return this.getHighestCard(sameSuit);
            }
        } else {
            // Off-suit: We're creating a void!
            // Track this advantage and dump our lowest card
            return this.getLowestCard(validCards);
        }
    }

    /**
     * Choose the best suit to lead on trick 5
     */
    chooseBestWinningSuit(validCards) {
        const bySuit = this.groupBySuit(validCards);
        let bestCard = null;
        let bestScore = -1;

        for (let suit in bySuit) {
            const highest = this.getHighestCard(bySuit[suit]);
            const score = this.calculateWinProbability(highest);
            
            if (score > bestScore) {
                bestScore = score;
                bestCard = highest;
            }
        }

        return bestCard || this.getHighestCard(validCards);
    }

    /**
     * Calculate probability of winning with a card
     * Considers: card value, cards played, opponent voids
     */
    calculateWinProbability(card) {
        let score = card.getValue();
        
        // Bonus for higher cards in suit that have been played
        const higherPlayed = this.playedCards.filter(c => 
            c.suit === card.suit && c.getValue() > card.getValue()
        ).length;
        score += higherPlayed * 3;

        // Huge bonus if opponent is void in this suit
        if (this.opponentVoidSuits.has(card.suit)) {
            score += 20;
        }

        // Bonus for Aces and Kings
        if (card.getValue() === 14) score += 5;
        if (card.getValue() === 13) score += 3;

        return score;
    }

    /**
     * Track which suits the opponent (player) is void in
     */
    updateOpponentVoids() {
        this.opponentVoidSuits.clear();
        
        for (let trick of this.game.trickHistory) {
            // If player followed with a different suit, they're void
            if (trick.leadPlayer === 'ai') {
                // AI led, check if player followed suit
                if (trick.followCard.suit !== trick.leadCard.suit) {
                    this.opponentVoidSuits.add(trick.leadCard.suit);
                }
            }
        }
    }

    // ==================== HELPER METHODS ====================

    updatePlayedCards() {
        this.playedCards = [];
        for (let trick of this.game.trickHistory) {
            this.playedCards.push(trick.leadCard);
            this.playedCards.push(trick.followCard);
        }
        if (this.game.leadCard) {
            this.playedCards.push(this.game.leadCard);
        }
    }

    groupBySuit(cards) {
        const bySuit = {};
        cards.forEach(card => {
            if (!bySuit[card.suit]) {
                bySuit[card.suit] = [];
            }
            bySuit[card.suit].push(card);
        });
        return bySuit;
    }

    getLowestCard(cards) {
        return cards.reduce((lowest, card) => 
            card.getValue() < lowest.getValue() ? card : lowest
        );
    }

    getHighestCard(cards) {
        return cards.reduce((highest, card) => 
            card.getValue() > highest.getValue() ? card : highest
        );
    }

    chooseBestCardToWin(validCards, isLeading) {
        if (isLeading) {
            return this.getHighestCard(validCards);
        } else {
            const leadSuit = this.game.leadCard.suit;
            const leadValue = this.game.leadCard.getValue();
            const sameSuit = validCards.filter(c => c.suit === leadSuit);
            
            if (sameSuit.length > 0) {
                const winningCards = sameSuit.filter(c => c.getValue() > leadValue);
                if (winningCards.length > 0) {
                    return this.getLowestCard(winningCards);
                } else {
                    return this.getLowestCard(sameSuit);
                }
            } else {
                return this.getLowestCard(validCards);
            }
        }
    }

    chooseOptimalLeadCard(validCards) {
        const bySuit = this.groupBySuit(validCards);
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

    estimateWinProbability(card) {
        const higherCardsPlayed = this.playedCards.filter(c => 
            c.suit === card.suit && c.getValue() > card.getValue()
        ).length;
        return card.getValue() + (higherCardsPlayed * 2);
    }

    chooseStrategicLeadCard(validCards) {
        const bySuit = this.groupBySuit(validCards);
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

    chooseStrategicFollowCard(validCards) {
        const leadSuit = this.game.leadCard.suit;
        const leadValue = this.game.leadCard.getValue();
        const sameSuit = validCards.filter(c => c.suit === leadSuit);
        
        if (sameSuit.length > 0) {
            const losingCards = sameSuit.filter(c => c.getValue() < leadValue);
            
            if (losingCards.length > 0) {
                return this.getHighestCard(losingCards);
            } else {
                return this.getLowestCard(sameSuit);
            }
        } else {
            return this.getLowestCard(validCards);
        }
    }
}

// Create AI instance
const ai = new AI(game);
