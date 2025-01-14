import { API_URL, fetchPokemonDetails, fetchPokemonList } from "./api.js";
import { renderPokemonCard } from "./ui.js";

async function handleRoute() {
    const pathname = window.location.pathname;

    if (pathname.startsWith("/pokedex/details/")) {
        const id = pathname.split("/")[3];
        const url = `${API_URL}pokemon/${id}`;

        const details = await fetchPokemonDetails(url);
        renderPokemonInfo(details);
    }
}

async function loadPokemon(limit = 20, offset = 0) {
    const pokemonList = await fetchPokemonList(limit, offset);

    const pokemonPromises = pokemonList.results.map(async (pokemon) => {
        const details = await fetchPokemonDetails(pokemon.url);
        return { details };
    });

    const fragment = document.createDocumentFragment();
    const results = await Promise.all(pokemonPromises);

    for (const { details } of results) {
        const card = await renderPokemonCard(details, handleRoute);
        fragment.appendChild(card);
    }

    document.querySelector(".pokemon__list").appendChild(fragment);
}

document.querySelector(".load-more").addEventListener("click", () => {
    const offset = document.querySelectorAll(".pokemon__card").length;
    loadPokemon(20, offset);
});

window.addEventListener("popstate", handleRoute);

// initialize app
document.addEventListener("DOMContentLoaded", () => {
    loadPokemon();
    handleRoute();
});
