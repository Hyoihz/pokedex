import { API_URL } from "./constants";
import { getCachedDetails, storeCacheDetails } from "./db";

export async function fetchPokemonList(limit, offset) {
    const url = `${API_URL}pokemon?limit=${limit}&offset=${offset}`;
    const res = await fetch(url);
    const data = await res.json();

    return data;
}

export async function fetchPokemonDetails(url) {
    const id = url.split("/").filter(Boolean).pop();

    const cached = await getCachedDetails("pokemon", id);
    if (cached) return cached;

    const [pokemonRes, speciesRes] = await Promise.all([
        fetch(url),
        fetch(`${API_URL}/pokemon-species/${id}`),
    ]);

    const pokemonData = await pokemonRes.json();
    const speciesData = await speciesRes.json();

    const pokemonId = pokemonData.id;
    const speciesId = speciesData.id;

    await Promise.all([
        storeCacheDetails("pokemon", pokemonId, pokemonData),
        storeCacheDetails("species", speciesId, speciesData),
    ]);

    return pokemonData;
}

export async function getSpeciesDetails(id) {
    const cached = await getCachedDetails("species", id);
    if (cached) return cached;
}
