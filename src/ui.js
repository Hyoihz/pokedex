import { Vibrant } from "node-vibrant/browser";

export async function renderPokemonCard(details, onRouteChange) {
    const pokemonName = details.name.charAt(0).toUpperCase() + details.name.slice(1);
    const pokemonId = details.id.toString().padStart(4, "0");
    const pokemonImg = details.sprites.other["official-artwork"].front_default;

    const card = document.createElement("div");
    card.className = "pokemon__card";
    card.style.backgroundColor = "#f0f0f0";

    card.innerHTML = `
        <p class="pokemon__id">#${pokemonId}</p>
        <div class="pokemon__img-wrapper">
            <div class="pokemon__pokeball-background">
                <svg
                    class="pokemon__pokeball"
                    width="206"
                    height="208"
                    viewBox="0 0 206 208"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        d="M127.762 104C127.762 117.676 116.676 128.762 103 128.762C89.3244 128.762 78.2381 117.676 78.2381 104C78.2381 90.3244 89.3244 79.2381 103 79.2381C116.676 79.2381 127.762 90.3244 127.762 104Z"
                        fill="white"
                    />
                    <path
                        fill-rule="evenodd"
                        clip-rule="evenodd"
                        d="M103 208C155.393 208 198.738 169.257 205.947 118.857H145.035C138.917 136.169 122.407 148.571 103 148.571C83.5933 148.571 67.0835 136.169 60.9648 118.857H0.0532227C7.26235 169.257 50.6067 208 103 208ZM60.9648 89.1429H0.0532227C7.26235 38.7431 50.6067 0 103 0C155.393 0 198.738 38.7431 205.947 89.1429H145.035C138.917 71.8314 122.407 59.4286 103 59.4286C83.5933 59.4286 67.0835 71.8314 60.9648 89.1429ZM127.762 104C127.762 117.676 116.676 128.762 103 128.762C89.3244 128.762 78.2381 117.676 78.2381 104C78.2381 90.3244 89.3244 79.2381 103 79.2381C116.676 79.2381 127.762 90.3244 127.762 104Z"
                        fill="white"
                    />
                </svg>
            </div>
            <img
                class="pokemon__img"
                src="${pokemonImg}"
                alt="${pokemonName}"
                loading="lazy"
            />
        </div>
        <h4 class="pokemon__name">${pokemonName}</h4>
    `;

    card.addEventListener("click", () => {
        const trimmedPokemonId = String(Number(pokemonId));

        history.pushState(null, null, `/pokedex/details/${trimmedPokemonId}`);

        onRouteChange();
    });

    Vibrant.from(pokemonImg)
        .getPalette()
        .then((palette) => {
            card.style.backgroundColor = palette.LightMuted.hex;
        })
        .catch(() => {
            // Keep default background if color calculation fails
        });

    return card;
}
