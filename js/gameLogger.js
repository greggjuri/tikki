/**
 * Game Logger - Captures player decisions for AI training
 * 
 * Logs each card play with full context to enable pattern analysis
 * and creation of an adaptive AI that mimics the player's style.
 */

class GameLogger {
    constructor() {
        this.currentRoundLog = null;
        this.sessionId = Date.now();
        this.loadLogs();
    }

    // Load existing logs from localStorage
    loadLogs() {
        const saved = localStorage.getItem('gamePlayLogs');
        this.logs = saved ? JSON.parse(saved) : [];
    }

    // Save logs to localStorage
    saveLogs() {
        localStorage.setItem('gamePlayLogs', JSON.stringify(this.logs));
    }

    // Start logging a new round
    startRound(playerHand, aiHand) {
        this.currentRoundLog = {
            timestamp: Date.now(),
            sessionId: this.sessionId,
            initialPlayerHand: playerHand.map(c => this.cardToString(c)),
            initialAiHand: aiHand.map(c => this.cardToString(c)),
            decisions: [],
            roundWinner: null
        };
    }

    // Log a player decision (only logs human player decisions for learning)
    logDecision(context) {
        if (!this.currentRoundLog) return;

        const decision = {
            trickNumber: context.trickNumber,
            isLeading: context.isLeading,
            leadCard: context.leadCard ? this.cardToString(context.leadCard) : null,
            playerHand: context.playerHand.map(c => this.cardToString(c)),
            validCards: context.validCards.map(c => this.cardToString(c)),
            cardsPlayedThisRound: context.cardsPlayedThisRound.map(c => this.cardToString(c)),
            chosenCard: this.cardToString(context.chosenCard),
            // Calculated features for easier analysis
            features: this.calculateFeatures(context)
        };

        this.currentRoundLog.decisions.push(decision);
    }

    // Calculate derived features for pattern analysis
    calculateFeatures(context) {
        const validCards = context.validCards;
        const chosen = context.chosenCard;
        const handValues = validCards.map(c => c.getValue());
        const chosenValue = chosen.getValue();
        
        // Where does the chosen card rank among valid options?
        const sortedValues = [...handValues].sort((a, b) => a - b);
        const rankPosition = sortedValues.indexOf(chosenValue);
        
        // Relative position: 0 = lowest valid, 1 = highest valid
        const relativeRank = validCards.length > 1 
            ? rankPosition / (validCards.length - 1) 
            : 0.5;

        // Did player play their highest card?
        const playedHighest = chosenValue === Math.max(...handValues);
        
        // Did player play their lowest card?
        const playedLowest = chosenValue === Math.min(...handValues);

        // If following, could player have won?
        let couldWin = null;
        let didWin = null;
        if (!context.isLeading && context.leadCard) {
            const leadValue = context.leadCard.getValue();
            const leadSuit = context.leadCard.suit;
            const sameSuitCards = validCards.filter(c => c.suit === leadSuit);
            
            if (sameSuitCards.length > 0) {
                couldWin = sameSuitCards.some(c => c.getValue() > leadValue);
                didWin = chosen.suit === leadSuit && chosenValue > leadValue;
            }
        }

        return {
            trickNumber: context.trickNumber,
            isLeading: context.isLeading,
            validCardCount: validCards.length,
            relativeRank: Math.round(relativeRank * 100) / 100,
            playedHighest,
            playedLowest,
            chosenValue,
            couldWin,
            didWin,
            // Suit info when leading
            chosenSuit: chosen.suit
        };
    }

    // Log trick result
    logTrickResult(trickNumber, winner) {
        if (!this.currentRoundLog) return;
        
        // Find the decision for this trick and add result
        const decision = this.currentRoundLog.decisions.find(
            d => d.trickNumber === trickNumber
        );
        if (decision) {
            decision.trickWinner = winner;
        }
    }

    // End round and save
    endRound(winner) {
        if (!this.currentRoundLog) return;
        
        this.currentRoundLog.roundWinner = winner;
        this.logs.push(this.currentRoundLog);
        this.saveLogs();
        this.currentRoundLog = null;
        
        console.log(`📊 Round logged. Total logged rounds: ${this.logs.length}`);
    }

    // Convert card to string format for storage
    cardToString(card) {
        return `${card.suit}_${card.rank}`;
    }

    // Parse card string back to object
    parseCard(str) {
        const [suit, rank] = str.split('_');
        return { suit, rank, getValue: () => {
            const values = {
                '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
                'jack': 11, 'queen': 12, 'king': 13, 'ace': 14
            };
            return values[rank];
        }};
    }

    // Get statistics summary
    getStats() {
        const totalRounds = this.logs.length;
        const totalDecisions = this.logs.reduce((sum, r) => sum + r.decisions.length, 0);
        const playerWins = this.logs.filter(r => r.roundWinner === 'player').length;
        
        return {
            totalRounds,
            totalDecisions,
            playerWins,
            aiWins: totalRounds - playerWins,
            winRate: totalRounds > 0 ? Math.round((playerWins / totalRounds) * 100) : 0
        };
    }

    // Analyze patterns for AI training
    analyzePatterns() {
        if (this.logs.length < 10) {
            return { error: 'Need at least 10 rounds of data for analysis' };
        }

        const allDecisions = this.logs.flatMap(r => r.decisions);
        
        // Separate by game phase
        const earlyTricks = allDecisions.filter(d => d.trickNumber <= 2);
        const midTricks = allDecisions.filter(d => d.trickNumber === 3 || d.trickNumber === 4);
        const finalTrick = allDecisions.filter(d => d.trickNumber === 5);

        // Analyze leading behavior
        const leadingDecisions = allDecisions.filter(d => d.features.isLeading);
        const followingDecisions = allDecisions.filter(d => !d.features.isLeading);

        // Calculate averages
        const avgRankWhenLeading = this.average(leadingDecisions.map(d => d.features.relativeRank));
        const avgRankWhenFollowing = this.average(followingDecisions.map(d => d.features.relativeRank));
        
        // Final trick behavior
        const finalLeading = finalTrick.filter(d => d.features.isLeading);
        const finalFollowing = finalTrick.filter(d => !d.features.isLeading);
        
        // When player could win, how often did they?
        const couldWinDecisions = followingDecisions.filter(d => d.features.couldWin === true);
        const didWinWhenCould = couldWinDecisions.filter(d => d.features.didWin === true);
        const winWhenCanRate = couldWinDecisions.length > 0 
            ? didWinWhenCould.length / couldWinDecisions.length 
            : 0;

        // Early vs final trick comparison
        const earlyLeadAvg = this.average(earlyTricks.filter(d => d.features.isLeading).map(d => d.features.relativeRank));
        const finalLeadAvg = this.average(finalLeading.map(d => d.features.relativeRank));

        return {
            dataPoints: allDecisions.length,
            roundsAnalyzed: this.logs.length,
            
            // Overall tendencies
            leadingStyle: {
                avgRelativeRank: Math.round(avgRankWhenLeading * 100),
                interpretation: avgRankWhenLeading < 0.3 ? 'Conservative (leads low)' :
                               avgRankWhenLeading > 0.7 ? 'Aggressive (leads high)' : 'Balanced'
            },
            
            followingStyle: {
                avgRelativeRank: Math.round(avgRankWhenFollowing * 100),
                winWhenCanRate: Math.round(winWhenCanRate * 100),
                interpretation: winWhenCanRate > 0.7 ? 'Aggressive (takes tricks when possible)' :
                               winWhenCanRate < 0.3 ? 'Conservative (ducks often)' : 'Selective'
            },
            
            // Trick 5 specific
            finalTrickStyle: {
                leadsHigh: finalLeading.filter(d => d.features.playedHighest).length,
                totalLeads: finalLeading.length,
                avgRankOnFinal: Math.round(this.average(finalTrick.map(d => d.features.relativeRank)) * 100)
            },
            
            // Early game vs late game
            phaseComparison: {
                earlyAvgRank: Math.round(earlyLeadAvg * 100),
                finalAvgRank: Math.round(finalLeadAvg * 100),
                savesHighCards: finalLeadAvg > earlyLeadAvg + 0.2
            },
            
            // Suit preferences when leading
            suitPreferences: this.analyzeSuitPreferences(leadingDecisions)
        };
    }

    // Analyze suit leading preferences
    analyzeSuitPreferences(leadingDecisions) {
        const suits = ['clubs', 'diamonds', 'hearts', 'spades'];
        const counts = {};
        suits.forEach(s => counts[s] = 0);
        
        leadingDecisions.forEach(d => {
            const suit = d.chosenCard.split('_')[0];
            counts[suit]++;
        });
        
        const total = leadingDecisions.length;
        return suits.map(s => ({
            suit: s,
            count: counts[s],
            percentage: total > 0 ? Math.round((counts[s] / total) * 100) : 0
        }));
    }

    // Helper: calculate average
    average(arr) {
        if (arr.length === 0) return 0;
        return arr.reduce((a, b) => a + b, 0) / arr.length;
    }

    // Export logs as JSON (for backup/analysis)
    exportLogs() {
        const data = {
            exportDate: new Date().toISOString(),
            stats: this.getStats(),
            analysis: this.analyzePatterns(),
            logs: this.logs
        };
        return JSON.stringify(data, null, 2);
    }

    // Import logs from JSON
    importLogs(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            if (data.logs && Array.isArray(data.logs)) {
                this.logs = [...this.logs, ...data.logs];
                this.saveLogs();
                return { success: true, imported: data.logs.length };
            }
            return { success: false, error: 'Invalid format' };
        } catch (e) {
            return { success: false, error: e.message };
        }
    }

    // Clear all logs
    clearLogs() {
        this.logs = [];
        this.saveLogs();
        console.log('🗑️ All logs cleared');
    }

    // Generate AI parameters from analysis
    generateAIProfile() {
        const analysis = this.analyzePatterns();
        if (analysis.error) return null;

        // Convert analysis to AI-usable parameters
        return {
            name: 'Adaptive',
            description: 'Learned from your playstyle',
            
            // When leading, what rank card to play (0-1 scale)
            leadingAggression: {
                early: analysis.phaseComparison.earlyAvgRank / 100,
                final: analysis.phaseComparison.finalAvgRank / 100
            },
            
            // When following and can win, probability of taking the trick
            followWinProbability: {
                early: Math.min(0.9, Math.max(0.1, 
                    1 - (analysis.followingStyle.winWhenCanRate / 100))), // Inverse for early (duck more)
                final: Math.min(0.95, analysis.followingStyle.winWhenCanRate / 100 + 0.3) // Higher for final
            },
            
            // Save high cards for trick 5?
            savesHighCards: analysis.phaseComparison.savesHighCards,
            
            // Overall aggression level
            overallAggression: (analysis.leadingStyle.avgRelativeRank + 
                               analysis.followingStyle.winWhenCanRate) / 200
        };
    }
}

// Global logger instance
const gameLogger = new GameLogger();

// Console commands for debugging/analysis
window.gameLogger = gameLogger;
console.log('📊 Game Logger loaded. Use gameLogger.getStats() to see statistics.');
console.log('   Use gameLogger.analyzePatterns() for detailed analysis.');
console.log('   Use gameLogger.exportLogs() to export data.');
