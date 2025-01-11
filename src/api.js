const API_URL = "https://pokeapi.co/api/v2/";

export async function fetchPokemonList(limit, offset) {
    const url = `${API_URL}pokemon?limit=${limit}&offset=${offset}`;
    const res = await fetch(url);
    const data = await res.json();

    return data;
}

export async function fetchPokemonDetails(url) {
    const res = await fetch(url);
    const data = await res.json();

    return data;
}
