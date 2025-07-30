import express from "express";
import bodyParser from "body-parser";
import axios from "axios";

const app = express();
const port = 3000;

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

let maxId = 1017;

// Dynamically fetch total Pokémon count
async function getTotalPokemonCount() {
    try {
        const response = await axios.get("https://pokeapi.co/api/v2/pokemon-species/");
        return response.data.count;
    } catch (error) {
        console.error("Error fetching total Pokémon count:", error);
        return 1017;
    }
}

async function initializePokemonCount() {
    maxId = await getTotalPokemonCount();
    console.log(`Updated total Pokémon count: ${maxId}`);
}

initializePokemonCount();

async function getRandomPokedexEntry() {
    try {
        const randomId = Math.floor(Math.random() * maxId) + 1;
        console.log(`Fetching data for Pokémon ID: ${randomId}`);

        const response = await axios.get(`https://pokeapi.co/api/v2/pokemon-species/${randomId}`);
        console.log("API response received");

        const entries = response.data.flavor_text_entries.filter(entry => entry.language.name === "en");
        let entryText = entries.length > 0 ? entries[Math.floor(Math.random() * entries.length)].flavor_text : "No entry found.";
        const correctPokemon = response.data.name;

        // Capitalize and censor Pokémon name if found
        const nameCapitalized = correctPokemon.charAt(0).toUpperCase() + correctPokemon.slice(1);
        const nameLower = correctPokemon.toLowerCase();
        const nameUpper = correctPokemon.toUpperCase();

        let censoredEntry = entryText
            .replaceAll(nameCapitalized, `<span class="hide-name">${nameCapitalized}</span>`)
            .replaceAll(nameLower, `<span class="hide-name">${nameLower}</span>`)
            .replaceAll(nameUpper, `<span class="hide-name">${nameUpper}</span>`);

        // Generate 3 incorrect Pokémon
        let wrongAnswers = new Set();
        while (wrongAnswers.size < 3) {
            let wrongId = Math.floor(Math.random() * maxId) + 1;
            if (wrongId !== randomId) {
                let wrongResponse = await axios.get(`https://pokeapi.co/api/v2/pokemon-species/${wrongId}`);
                wrongAnswers.add(wrongResponse.data.name);
            }
        }

        let answerChoices = [...wrongAnswers, correctPokemon];
        answerChoices = answerChoices.sort(() => Math.random() - 0.5);

        const imageUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${randomId}.png`;

        return { entryText: censoredEntry, correctPokemon, answerChoices, imageUrl };

    } catch (error) {
        console.error("Error fetching Pokédex entry:", error);
        return {
            entryText: "Error fetching entry.",
            correctPokemon: "Unknown",
            answerChoices: [],
            imageUrl: ""
        };
    }
}

app.get("/", async (req, res) => {
    const pokedexData = await getRandomPokedexEntry();
    console.log("Rendering page with data:", pokedexData);
    res.render("index", {
        dexEntry: pokedexData.entryText,
        correctAnswer: pokedexData.correctPokemon,
        answerChoices: pokedexData.answerChoices,
        imageUrl: pokedexData.imageUrl
    });
});

app.listen(port, () => {
    console.log(`Server running on port: ${port}`);
});

app.get("/api/entry", async (req, res) => {
    const pokedexData = await getRandomPokedexEntry();
    res.json(pokedexData);
});