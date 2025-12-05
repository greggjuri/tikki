# Last Trick

A web-based two-player card game where only the last trick matters. Play against an AI opponent with four difficulty levels in a match-based scoring system.

## Game Rules

1. Each player is dealt 5 cards
2. First round: random player leads. After that, starting player alternates each round
3. Play any card from your hand when leading
4. The second player must follow suit if they can, otherwise can play any card
5. Whoever plays the highest card of the led suit wins the trick and leads next
6. This continues for 5 tricks
7. **Only the winner of the 5th (final) trick scores 1 point**
8. Rounds continue until a player reaches the score goal (default: 5 points)
9. No trump cards

## Features

- **Match-Based Scoring:**
  - Set your own score goal (1-20 points, default 5)
  - Play rounds until someone reaches the goal
  - Scores persist across rounds in a match
  
- **Four AI Difficulty Levels:**
  - **Easy**: Random valid plays
  - **Medium**: Strategic card management, tries to save high cards for trick 5
  - **Hard**: Advanced probability-based decision making
  - **👑 Grandmaster**: Expert AI using suit-draining, lead control, and void exploitation strategies learned from analyzing winning player patterns
  
- **Fair Starting System**: Random first player at match start, then alternating each round
- **Customizable Card Backs**: Choose from 10 different card back designs
- **Live Match Info**: See score goal and difficulty level during gameplay
- **Custom Notifications**: Clean, branded notifications instead of browser dialogs
- **Smooth Animations**: Cards stay in place, no jumping when playing
- **Sound Effects**: Optional card sounds (toggleable in settings)
- **Responsive Design**: Works on desktop and mobile devices

## Project Structure

```
tikki/
├── index.html          # Main HTML file
├── README.md           # This file
├── PROJECT_STATUS.md   # Development status and notes
├── .gitignore          # Git ignore rules
├── css/
│   └── style.css       # Styling
├── js/
│   ├── game.js         # Core game logic (deck, cards, rules, match system)
│   ├── ai.js           # AI decision making (4 difficulty levels)
│   ├── ui.js           # User interface and interactions
│   └── gameLogger.js   # Optional gameplay logging for AI training
└── assets/
    ├── cards/
    │   ├── fronts/     # Card face SVG files (52 cards)
    │   └── backs/      # Card back SVG files (10 designs)
    └── sounds/
        └── card-flip.wav  # Card play sound effect
```

## Setup

1. Clone this repository to your web server or local machine
2. Download the playing card SVG files from [Tek Eye's Public Domain SVG Playing Cards](https://www.tekeye.uk/playing_cards/svg-playing-cards)
3. Extract the card files:
   - Place all card face SVGs (e.g., `clubs_2.svg`, `hearts_ace.svg`) in `assets/cards/fronts/`
   - Place all card back SVGs (e.g., `blue.svg`, `red.svg`) in `assets/cards/backs/`
4. Open `index.html` in a web browser or serve via a web server

## Card Naming Convention

The game expects card files to follow this naming pattern:
- **Fronts**: `{suit}_{rank}.svg`
  - Suits: `clubs`, `diamonds`, `hearts`, `spades`
  - Ranks: `2`, `3`, `4`, `5`, `6`, `7`, `8`, `9`, `10`, `jack`, `queen`, `king`, `ace`
  - Example: `hearts_ace.svg`, `spades_10.svg`

- **Backs**: Any descriptive name (e.g., `blue.svg`, `astronaut.svg`)

## Technologies Used

- HTML5
- CSS3 (with flexbox and grid)
- Vanilla JavaScript (ES6+)
- SVG graphics
- HTML5 Audio API
- LocalStorage for persistent settings

## How to Play

1. Click "New Game" to start a match
2. Optionally, open Settings to:
   - Set your score goal (how many points to win)
   - Choose your preferred card back design
   - Select AI difficulty
   - Toggle sound effects
3. Click on a card in your hand to play it
4. The AI will automatically play after you
5. Watch the tricks play out
6. Win the 5th trick to score a point!
7. Play rounds until someone reaches the score goal
8. Winner gets a victory notification with option to start a new match

## Game Flow

- **Match**: A series of rounds played until someone reaches the score goal
- **Round**: 5 tricks played with 5 cards each
- **Trick**: One card from each player
- **Score Goal**: Customizable (1-20 points, default 5)
- **Starting Player**: Random at match start, alternates each round

## AI Strategy

### Easy AI
- Plays random valid cards
- No strategic thinking

### Medium AI
- Tracks which cards have been played
- Tries to dump low cards in tricks 1-4
- Saves high cards for the final trick
- Follows suit intelligently

### Hard AI
- All Medium AI features plus:
- Calculates probability of winning with each card
- Estimates opponent's remaining cards
- Makes optimal decisions for trick 5
- Strategic suit selection when leading

### 👑 Grandmaster AI
- Expert-level play based on winning player strategies:
- **Suit Draining**: Leads high cards from multi-card suits to force opponent's high cards out
- **Singleton Dumping**: Voids single-card suits early to create flexibility
- **100% Win-When-Can**: Always takes tricks when able (maintains lead control)
- **Void Exploitation**: Tracks opponent's voids and exploits them on trick 5
- **Progressive Aggression**: Increases card strength throughout the round
- **Optimal Trick 5 Play**: Calculates best winning probability considering all factors

## Settings

All settings are saved to browser localStorage:
- **Score Goal**: How many points needed to win a match
- **AI Difficulty**: Easy, Medium, Hard, or Grandmaster
- **Card Back**: Your preferred card back design
- **Sound Effects**: On/Off toggle

## Development

This game was developed iteratively with a focus on:
- Clean, maintainable code structure
- Smooth user experience (no card jumping, clean notifications)
- Strategic AI opponents that provide genuine challenge
- Flexible match system for extended play
- AI training system for learning from player strategies

## Credits

- Card graphics: [Tek Eye Public Domain SVG Playing Cards](https://www.tekeye.uk/playing_cards/svg-playing-cards)
- Game concept: Traditional card game mechanics
- Development: Iterative collaboration between developer and AI assistant

## License

This project is released under the MIT License. The card graphics are public domain.

## Version History

- **v1.0**: Initial release with basic gameplay
- **v1.1**: Added match/round system with customizable score goals
- **v1.2**: Improved UI with custom notifications and smooth card animations
- **v1.3**: Added sound effects
- **v1.4**: Added Grandmaster AI, randomized/alternating starting player, streamlined UI
