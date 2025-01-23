import { API_URL, fetchPokemonDetails, fetchPokemonList } from "./utils/api.js";
import { renderPokemonCard, renderPokemonInfo } from "./utils/ui.js";

async function handleRoute() {
    const pathname = window.location.pathname;

    if (!(pathname === "/" || pathname.match(/^\/details\/\d+$/))) {
        // TODO
        console.log("Page not found!");
        return;
    }

    if (pathname === "/") {
        const pokedex = document.querySelector(".pokedex");
        const pokemonInfo = document.querySelector(".pokemon-info");

        pokedex.style.display = "block";
        pokemonInfo && (pokemonInfo.style.display = "none");
    } else if (pathname.match(/^\/details\/\d+$/)) {
        const id = pathname.split("/")[2];
        const url = `${API_URL}pokemon/${id}`;

        const details = await fetchPokemonDetails(url);
        renderPokemonInfo(details, id, handleRoute);
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

    document.querySelector(".pokedex__list").appendChild(fragment);
}

document.querySelector(".pokedex__load-more").addEventListener("click", () => {
    const offset = document.querySelectorAll(".pokedex-card").length;
    loadPokemon(20, offset);
});

window.addEventListener("popstate", handleRoute);

// initialize app
document.addEventListener("DOMContentLoaded", () => {
    loadPokemon();
    handleRoute();
});
