# Set JSON Creation Workflow

This project uses a script to convert raw Pokémon TCG card lists (TXT format) into the JSON format required by the simulator.

The script is located at:

scripts/generate-set-json.mjs

The generated JSON files are saved to:

data/sets/


STEP 1 — Obtain Raw Card Data ([pkmncards.com](https://pkmncards.com/sets/))
--> view set as list, copy & paste text into a txt file --> save as set-name.txt

Download or create a TXT file containing card data in the expected format.

Example file:
Evolving-Skies-Card-Info.txt


STEP 2 — Run the Script

From the project root directory, run:

node scripts/generate-set-json.mjs "C:\Users\jakeb\Desktop\coding-vault\pokemon-pack-simulator\data\raw\base-set.txt"


STEP 3 — Script Output

The script will automatically create a JSON file in:

data/sets/

Example output:

data/sets/evolving-skies.json


STEP 4 — Verify

Check the console output to confirm:

• total cards parsed
• rarity distribution
• output file path


STEP 5 — Use in Simulator

Restart the development server if needed.

The new set JSON will automatically appear in the set selection dropdown.


NOTES

• Do not manually edit generated JSON unless necessary.
• All set JSON files must live inside data/sets/.
• The simulator loads set data directly from these JSON files.