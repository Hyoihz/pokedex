import { fetchPokemonDetails, fetchPokemonList } from "./api.js";
import { renderPokemonCard } from "./ui.js";

async function loadPokemon(limit = 20, offset = 0) {
    const pokemonList = await fetchPokemonList(limit, offset);

    for (const pokemon of pokemonList.results) {
        const details = await fetchPokemonDetails(pokemon.url);

        renderPokemonCard(details);
    }
}

document.querySelector(".load-more").addEventListener("click", () => {
    const offset = document.querySelectorAll(".pokemon__card").length;
    loadPokemon(20, offset);
});
// initialize app
document.addEventListener("DOMContentLoaded", () => {
    loadPokemon();
});
