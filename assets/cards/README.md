# Card Assets

## Required Files

You need to download the SVG playing card files and place them in the appropriate directories.

### Download Source
[Tek Eye Public Domain SVG Playing Cards](https://www.tekeye.uk/playing_cards/svg-playing-cards)

Download the zip file from: https://www.tekeye.uk/downloads/svg_playing_cards.zip

### File Placement

#### Fronts Directory (`fronts/`)
Place all 52 card face SVG files here. Files should be named:
- `{suit}_{rank}.svg`
- Examples: `clubs_2.svg`, `hearts_ace.svg`, `spades_king.svg`, `diamonds_10.svg`

**All 52 cards needed:**
- clubs: 2-10, jack, queen, king, ace
- diamonds: 2-10, jack, queen, king, ace  
- hearts: 2-10, jack, queen, king, ace
- spades: 2-10, jack, queen, king, ace

#### Backs Directory (`backs/`)
Place the card back SVG files here. The game expects these 10 backs:
- abstract.svg
- abstract_clouds.svg
- abstract_scene.svg
- astronaut.svg
- blue.svg
- castle.svg
- fish.svg
- frog.svg
- red.svg
- red2.svg

## Notes
- All files must be SVG format
- Follow the exact naming convention for the game to work properly
- Card backs can have any names, just update the `CARD_BACKS` array in `ui.js` if different
