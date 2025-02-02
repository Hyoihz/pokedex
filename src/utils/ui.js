import { Vibrant } from "node-vibrant/browser";
import { getSpeciesDetails } from "./api";
import { TYPE_COLORS } from "./constants";
import { getCachedDetails, storeCacheDetails } from "./db";
import { capitalize, leadZeroPad, showSpinner } from "./helpers";

async function getLightMutedColor(img, id) {
    const cached = await getCachedDetails("color", id);
    if (cached) return cached;

    try {
        const palette = await Vibrant.from(img).getPalette();
        const lightMutedColor = palette.LightMuted.hex;

        await storeCacheDetails("color", id, lightMutedColor);

        return lightMutedColor;
    } catch (error) {
        console.error("Error calculating vibrant color:", error);

        return "#f0f0f0";
    } finally {
    }
}

function fadeInImage(imgEl) {
    imgEl.style.opacity = 0;

    imgEl.onload = () => {
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                imgEl.style.transition = "opacity 0.5s ease-in-out";
                imgEl.style.opacity = 1;
            });
        });
    };
}

export async function renderPokemonCard(details, onRouteChange) {
    const pokemonName = capitalize(details.name);
    const pokemonId = leadZeroPad(details.id, 4);
    const pokemonImg = details.sprites.other["official-artwork"].front_default;

    const renderTypeIcons = details.types
        .map(({ type }) => {
            return `
                <div class="pokedex__filter-icon pokedex__filter-icon--accent" 
                    data-filter=${type.name} 
                    style="background: linear-gradient(to bottom right, ${
                        TYPE_COLORS[type.name].gradient
                    })">
                </div>`;
        })
        .join("");

    const card = document.createElement("div");
    card.className = "pokedex-card";
    card.style.backgroundColor = "#f0f0f0";

    card.innerHTML = `
        <p class="pokedex-card__id">#${pokemonId}</p>
        <div class="pokedex-card__type">${renderTypeIcons}</div>
        <div class="pokedex-card__img-wrapper">
            <div class="pokedex-card__pokeball-background">
                <svg
                    class="pokedex-card__pokeball"
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
                class="pokedex-card__img"
                src="${pokemonImg}"
                alt="${pokemonName}"
                loading="lazy"
            />
        </div>
        <h4 class="pokedex-card__name">${pokemonName}</h4>
    `;

    const cardImgEl = card.querySelector(".pokedex-card__img");
    fadeInImage(cardImgEl);

    card.addEventListener("click", () => {
        sessionStorage.setItem("scrollPos", window.scrollY);

        const trimmedPokemonId = String(Number(pokemonId));

        history.pushState(null, null, `/details/${trimmedPokemonId}`);

        onRouteChange();
    });

    card.style.backgroundColor = await getLightMutedColor(pokemonImg, details.id);

    return card;
}

export async function renderPokemonInfo(details, id, onRouteChange) {
    const pokemonName = capitalize(details.name);
    const pokemonId = leadZeroPad(details.id, 4);
    const pokemonImg = details.sprites.other["official-artwork"].front_default;
    const pokemonWeight = details.weight / 10;
    const pokemonHeight = details.height / 10;

    const speciesDetails = await getSpeciesDetails(details.id);

    const filteredNames = speciesDetails.names.find(({ language }) => language.name === "ja");
    const pokemonNameJA = filteredNames.name;

    const filteredEntries = speciesDetails["flavor_text_entries"].find(
        ({ language }) => language.name === "en"
    );
    const pokemonInfo = filteredEntries["flavor_text"].replace(/\n/g, " ").replace(/\u000c/g, " ");

    const stats = [
        { name: "HP", value: details.stats[0].base_stat },
        { name: "ATK", value: details.stats[1].base_stat },
        { name: "DEF", value: details.stats[2].base_stat },
        { name: "SATK", value: details.stats[3].base_stat },
        { name: "SDEF", value: details.stats[4].base_stat },
        { name: "SPD", value: details.stats[5].base_stat },
    ];

    const renderInfoStat = stats
        .map((stat) => {
            return `
                <div class="pokemon-info__stat">
                    <p class="pokemon-info__stat-name">${stat.name}</p>
                    <div class="pokemon-info__stat-group">
                        <p class="pokemon-info__stat-value">${leadZeroPad(stat.value, 3)}</p>
                        <div class="pokemon-info__progress-hp pokemon-info__progress-wrapper" 
                            style="background-color: ${TYPE_COLORS[
                                details.types[0].type.name
                            ].base.replace(/, 1\)/, ", 0.2)")}">
                            <div class="pokemon-info__progress" 
                                data-target-width="${(stat.value / 255) * 100}" 
                                style="width:0%;
                                background: linear-gradient(to bottom right, ${
                                    TYPE_COLORS[details.types[0].type.name].gradient
                                }">
                            </div>
                        </div>
                    </div>
                </div>`;
        })
        .join("");

    const info = document.createElement("section");
    info.className = "pokemon-info";
    info.style.backgroundColor = "#f0f0f0";

    info.innerHTML = `
        <div class="pokemon-info__wrapper">
            <div class="pokemon-info__header-wrapper">
                <div class="pokemon-info__header">
                    <div class="pokemon-info__header-content">
                        <div class="pokemon-info__header-group">
                            <button class="pokemon-info__back-button">
                                <svg
                                    width="22"
                                    height="22"
                                    viewBox="0 0 22 22"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        d="M9.89992 20.9666L0.633252 11.6999C0.522141 11.5888 0.444363 11.4777 0.399919 11.3666C0.355474 11.2555 0.333252 11.1333 0.333252 10.9999C0.333252 10.8666 0.355474 10.7444 0.399919 10.6333C0.444363 10.5222 0.522141 10.4111 0.633252 10.2999L9.93325 0.999943C10.111 0.822165 10.3333 0.733276 10.5999 0.733276C10.8666 0.733276 11.0999 0.833276 11.2999 1.03328C11.4999 1.23328 11.5999 1.46661 11.5999 1.73328C11.5999 1.99994 11.4999 2.23328 11.2999 2.43328L3.73325 9.99994H20.2666C20.5555 9.99994 20.7944 10.0944 20.9833 10.2833C21.1721 10.4722 21.2666 10.7111 21.2666 10.9999C21.2666 11.2888 21.1721 11.5277 20.9833 11.7166C20.7944 11.9055 20.5555 11.9999 20.2666 11.9999H3.73325L11.3333 19.5999C11.511 19.7777 11.5999 19.9999 11.5999 20.2666C11.5999 20.5333 11.4999 20.7666 11.2999 20.9666C11.0999 21.1666 10.8666 21.2666 10.5999 21.2666C10.3333 21.2666 10.0999 21.1666 9.89992 20.9666V20.9666Z"
                                        fill="white"
                                    />
                                </svg>
                            </button>
                            <h2 class="pokemon-info__name-eng">${pokemonName}</h2>
                            <p class="pokemon-info__id">#${pokemonId}</p>
                        </div>
                        <p class="pokemon-info__name-ja">${pokemonNameJA}</p>
                    </div>
                </div>
                <div class="pokemon-info__pokeball-wrapper">
                    <svg
                        class="pokemon-info__pokeball"
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

                <div class="pokemon-info__navigation">
                    <div class="pokemon-info__chevron-wrapper pokemon-info__chevron-wrapper--left">
                        <button class="pokemon-info__chevron-prev">
                            <svg
                                width="7"
                                height="12"
                                viewBox="0 0 7 12"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M5.47505 11.45L0.525048 6.5C0.441715 6.41667 0.383382 6.33333 0.350049 6.25C0.316716 6.16667 0.300049 6.075 0.300049 5.975C0.300049 5.875 0.316716 5.78333 0.350049 5.7C0.383382 5.61667 0.441715 5.53333 0.525048 5.45L5.50005 0.475C5.65005 0.325 5.82922 0.25 6.03755 0.25C6.24588 0.25 6.42505 0.325 6.57505 0.475C6.72505 0.625 6.79588 0.808333 6.78755 1.025C6.77922 1.24167 6.70005 1.425 6.55005 1.575L2.15005 5.975L6.57505 10.4C6.72505 10.55 6.80005 10.725 6.80005 10.925C6.80005 11.125 6.72505 11.3 6.57505 11.45C6.42505 11.6 6.24171 11.675 6.02505 11.675C5.80838 11.675 5.62505 11.6 5.47505 11.45V11.45Z"
                                    fill="white"
                                />
                            </svg>
                        </button>
                    </div>
                    <div class="pokemon-info__meta">
                        <div class="pokemon-info__image-wrapper">
                            <img
                                class="pokemon-info__image"
                                src="${pokemonImg}"
                                alt="${pokemonName}"
                            />
                        </div>
                        <div class="pokemon-info__types">
                        </div>
                    </div>
                    <div class="pokemon-info__chevron-wrapper pokemon-info__chevron-wrapper--right">
                        <button class="pokemon-info__chevron-next">
                            <svg
                                width="8"
                                height="12"
                                viewBox="0 0 8 12"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M0.849955 11.45C0.716621 11.2834 0.645787 11.1 0.637454 10.9C0.629121 10.7 0.699955 10.525 0.849955 10.375L5.24995 5.97503L0.824954 1.55003C0.691621 1.4167 0.629121 1.23753 0.637454 1.01253C0.645787 0.787533 0.716621 0.608367 0.849955 0.475033C1.01662 0.308367 1.19579 0.2292 1.38745 0.237534C1.57912 0.245867 1.74995 0.325033 1.89995 0.475033L6.87495 5.45003C6.95829 5.53337 7.01662 5.6167 7.04995 5.70003C7.08329 5.78337 7.09995 5.87503 7.09995 5.97503C7.09995 6.07503 7.08329 6.1667 7.04995 6.25003C7.01662 6.33337 6.95829 6.4167 6.87495 6.50003L1.92495 11.45C1.77495 11.6 1.59995 11.6709 1.39995 11.6625C1.19995 11.6542 1.01662 11.5834 0.849955 11.45V11.45Z"
                                    fill="white"
                                />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
            <div class="pokemon-info__details-wrapper">
                <div class="pokemon-info__about">
                    <p class="pokemon-info__title">About</p>
                    <div class="pokemon-info__attributes">
                        <div class="pokemon-info__attribute">
                            <div class="pokemon-info__attribute-wrapper">
                                <svg
                                    class="pokemon-info__attribute-icon"
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                >
                                    <path
                                        d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"
                                    ></path>
                                    <path
                                        d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"
                                    ></path>
                                    <path d="M7 21h10"></path>
                                    <path d="M12 3v18"></path>
                                    <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"></path>
                                </svg>
                                <p class="pokemon-info__value">${pokemonWeight} kg</p>
                            </div>
                            <p class="pokemon-info__label">Weight</p>
                        </div>
                        <div class="pokemon-info__attribute">
                            <div class="pokemon-info__attribute-wrapper">
                                <svg
                                    class="pokemon-info__attribute-icon"
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                >
                                    <path
                                        d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0Z"
                                    ></path>
                                    <path d="m14.5 12.5 2-2"></path>
                                    <path d="m11.5 9.5 2-2"></path>
                                    <path d="m8.5 6.5 2-2"></path>
                                    <path d="m17.5 15.5 2-2"></path>
                                </svg>
                                <p class="pokemon-info__value">${pokemonHeight} m</p>
                            </div>
                            <p class="pokemon-info__label">Height</p>
                        </div>
                        <div class="pokemon-info__attribute">
                            <div class="pokemon-info__abilities">
                            </div>
                            <p class="pokemon-info__label">Abilities</p>
                        </div>
                    </div>
                </div>
                <div class="pokemon-info__description">
                    <p class="pokemon-info__text">${pokemonInfo}</p>
                </div>
                <div class="pokemon-info__base-stats">
                    <p class="pokemon-info__title">Base Stats</p>
                    <div class="pokemon-info__stats">
                        ${renderInfoStat}
                    </div>
                </div>
            </div>
        </section>
    `;

    const infoImgEl = info.querySelector(".pokemon-info__image");
    fadeInImage(infoImgEl);

    const pokemonInfoWrapper = info.querySelector(".pokemon-info__wrapper");
    pokemonInfoWrapper.style.backgroundColor = await getLightMutedColor(pokemonImg, details.id);

    const pokemonAbilitiesContainer = info.querySelector(".pokemon-info__abilities");
    details.abilities.forEach((abilityInfo) => {
        const ability = document.createElement("p");

        ability.className = "pokemon-info__ability";
        ability.textContent =
            abilityInfo.ability.name.charAt(0).toUpperCase() + abilityInfo.ability.name.slice(1);

        pokemonAbilitiesContainer.appendChild(ability);
    });

    const pokemonTypesContainer = info.querySelector(".pokemon-info__types");
    details.types.forEach((typeInfo) => {
        const type = document.createElement("p");

        type.className = "pokemon-info__type";
        type.textContent = capitalize(typeInfo.type.name);
        type.style.background = `linear-gradient(to bottom right, ${
            TYPE_COLORS[typeInfo.type.name].gradient
        }`;

        pokemonTypesContainer.appendChild(type);
    });

    info.querySelectorAll(".pokemon-info__title, .pokemon-info__stat-name").forEach(
        (elem) => (elem.style.color = TYPE_COLORS[details.types[0].type.name].base)
    );

    info.querySelector(".pokemon-info__header-wrapper").addEventListener("click", (e) => {
        e.preventDefault();
        console.log(e.target);

        if (e.target.closest(".pokemon-info__back-button")) {
            showSpinner();
            history.pushState(null, null, "/");
            document.body.removeChild(info);

            onRouteChange();
        } else if (e.target.closest(".pokemon-info__chevron-prev")) {
            showSpinner();
            if (id === "1") history.pushState(null, null, `/details/${1025}`);
            else history.pushState(null, null, `/details/${parseInt(id) - 1}`);

            onRouteChange();
        } else if (e.target.closest(".pokemon-info__chevron-next")) {
            showSpinner();
            if (id === "1025") history.pushState(null, null, "/details/1");
            else history.pushState(null, null, `/details/${parseInt(id) + 1}`);

            onRouteChange();
        }
    });

    if (document.body.children.length > 1) {
        document.body.replaceChild(info, document.body.children[1]);
    } else {
        document.body.appendChild(info);
    }

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            document.querySelectorAll(".pokemon-info__progress").forEach((progressEl) => {
                const targetWidth = progressEl.getAttribute("data-target-width");
                progressEl.style.width = targetWidth + "%";
            });
        });
    });

    const pokedex = document.querySelector(".pokedex");
    pokedex.style.display = "none";
}
