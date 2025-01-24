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

async function loadPokemon(pokemonList) {
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

    const pokedexList = document.querySelector(".pokedex__list");
    if (pokedexList.hasChildNodes()) pokedexList.replaceChildren();

    pokedexList.appendChild(fragment);
}

// initialize app
document.addEventListener("DOMContentLoaded", async () => {
    const searchInput = document.getElementById("search-input");
    const loadMoreBtn = document.querySelector(".pokedex__load-more");

    let isSearchActive = false;

    searchInput.value = "";

    window.addEventListener("popstate", handleRoute);

    searchInput.addEventListener("input", async (e) => {
        if (e.target.value === "") {
            if (isSearchActive) {
                isSearchActive = false;
                const pokemonList = await fetchPokemonList(20, 0);

                loadPokemon(pokemonList);
            }
        }
    });

    searchInput.addEventListener("keydown", async (e) => {
        if (e.key === "Enter") {
            const searchValue = e.target.value.trim().toLowerCase();
            const pokemonList = await fetchPokemonList(1025, 0);

            if (searchValue !== "") {
                isSearchActive = true;

                const filteredPokemonList = pokemonList.results.filter((pokemon) => {
                    const isNameMatch = pokemon.name.includes(searchValue);
                    const idFromUrl = pokemon.url.match(/(\d+)\/$/)[1];
                    const isIdMatch = idFromUrl === searchValue;

                    return isNameMatch || isIdMatch;
                });

                if (filteredPokemonList.length === 0) {
                    // TODO
                    console.log("No pokemon found!");
                    return;
                }

                loadPokemon({ results: filteredPokemonList });
            }
        }
    });

    loadMoreBtn.addEventListener("click", () => {
        const offset = document.querySelectorAll(".pokedex-card").length;
        loadPokemon(20, offset);
    });

    const pokemonList = await fetchPokemonList(20, 0);

    loadPokemon(pokemonList);
    handleRoute();
});
