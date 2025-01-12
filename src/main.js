import { fetchPokemonDetails, fetchPokemonList } from "./api.js";
import { renderPokemonCard } from "./ui.js";

async function loadPokemon(limit = 20, offset = 0) {
    const pokemonList = await fetchPokemonList(limit, offset);

    const pokemonPromises = pokemonList.results.map(async (pokemon) => {
        const details = await fetchPokemonDetails(pokemon.url);
        return { details };
    });

    const fragment = document.createDocumentFragment();
    const results = await Promise.all(pokemonPromises);

    for (const { details } of results) {
        const card = await renderPokemonCard(details);
        fragment.appendChild(card);
    }

    document.querySelector(".pokemon__list").appendChild(fragment);
}

document.querySelector(".load-more").addEventListener("click", () => {
    const offset = document.querySelectorAll(".pokemon__card").length;
    loadPokemon(20, offset);
});

// initialize app
document.addEventListener("DOMContentLoaded", () => {
    loadPokemon();
});
