import { fetchPokemonDetails, fetchPokemonList } from "./utils/api";
import { API_URL, TYPE_COLORS } from "./utils/constants";
import { initDB } from "./utils/db";
import { capitalize, hideSpinner, showSpinner } from "./utils/helpers";
import { renderPokemonCard, renderPokemonInfo } from "./utils/ui";

initDB().catch(console.error);

async function handleRoute() {
    const pathname = window.location.pathname;

    if (!(pathname === "/" || pathname.match(/^\/details\/\d+$/))) {
        // TODO
        console.log("Page not found!");
        return;
    }

    if (pathname === "/") {
        showSpinner();
        const pokedex = document.querySelector(".pokedex");
        const pokemonInfo = document.querySelector(".pokemon-info");

        pokedex.style.display = "block";
        pokemonInfo && (pokemonInfo.style.display = "none");

        requestAnimationFrame(() => {
            const savedPos = sessionStorage.getItem("scrollPos");
            if (savedPos) {
                window.scrollTo(0, parseInt(savedPos));
                sessionStorage.removeItem("scrollPos");
            }
        });
    } else if (pathname.match(/^\/details\/\d+$/)) {
        const id = pathname.split("/")[2];
        const url = `${API_URL}pokemon/${id}`;

        const details = await fetchPokemonDetails(url);
        renderPokemonInfo(details, id, handleRoute);
    }

    hideSpinner();
}

// initialize app
document.addEventListener("DOMContentLoaded", async () => {
    const searchInput = document.getElementById("search-input");
    const searchFilter = document.getElementById("search-filter");
    const pokedexActiveFilters = document.querySelector(".pokedex__active-filters");
    const pokedexDropdown = document.querySelector(".pokedex__filter-dropdown");
    const pokedexFilterIcon = document.querySelectorAll(".pokedex__filter-icon");
    const loadMoreBtn = document.querySelector(".pokedex__load-more");
    const selectedFilters = new Set();

    let isSearchActive = false;
    let isFiltered = false;
    let isLoadMore = false;
    let isLoading = false;

    searchInput.value = "";

    async function loadPokemon(pokemonList) {
        const pokedexList = document.querySelector(".pokedex__list");
        isLoading = true;
        updateLoadMoreButton();

        // Create skeleton placeholders first
        const skeletonFragment = document.createDocumentFragment();
        const skeletonCount = pokemonList.results.length;

        // Generate skeleton cards
        for (let i = 0; i < skeletonCount; i++) {
            const skeletonCard = document.createElement("div");
            skeletonCard.className = "skeleton-card";
            skeletonCard.innerHTML = `
                <div class="pokedex-card__pokeball-background">
                    <svg width="206" height="208" viewBox="0 0 206 208" fill="none" xmlns="http://www.w3.org/2000/svg" class="pokedex-card__pokeball pokedex-card__pokeball--skeleton">
                        <path d="M127.762 104C127.762 117.676 116.676 128.762 103 128.762C89.3244 128.762 78.2381 117.676 78.2381 104C78.2381 90.3244 89.3244 79.2381 103 79.2381C116.676 79.2381 127.762 90.3244 127.762 104Z" fill="white"></path>
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M103 208C155.393 208 198.738 169.257 205.947 118.857H145.035C138.917 136.169 122.407 148.571 103 148.571C83.5933 148.571 67.0835 136.169 60.9648 118.857H0.0532227C7.26235 169.257 50.6067 208 103 208ZM60.9648 89.1429H0.0532227C7.26235 38.7431 50.6067 0 103 0C155.393 0 198.738 38.7431 205.947 89.1429H145.035C138.917 71.8314 122.407 59.4286 103 59.4286C83.5933 59.4286 67.0835 71.8314 60.9648 89.1429ZM127.762 104C127.762 117.676 116.676 128.762 103 128.762C89.3244 128.762 78.2381 117.676 78.2381 104C78.2381 90.3244 89.3244 79.2381 103 79.2381C116.676 79.2381 127.762 90.3244 127.762 104Z" fill="white"></path>
                    </svg>
                </div>
            `;
            skeletonFragment.appendChild(skeletonCard);
        }

        // Show skeletons immediately
        if (!isLoadMore) {
            pokedexList.replaceChildren(skeletonFragment);
        } else {
            pokedexList.appendChild(skeletonFragment);
        }

        // Load actual data
        const pokemonPromises = pokemonList.results.map(async (pokemon) => {
            const details = await fetchPokemonDetails(pokemon.url);
            return { details };
        });

        const results = await Promise.all(pokemonPromises);
        const fragment = document.createDocumentFragment();

        // Replace skeletons with real cards
        for (const { details } of results) {
            const card = await renderPokemonCard(details, handleRoute);
            card.classList.add("pokedex-card");
            fragment.appendChild(card);
        }

        const skeletons = pokedexList.querySelectorAll(".skeleton-card");
        skeletons.forEach((skeleton) => skeleton.classList.add("fade-out"));

        // Wait for skeleton fade-out
        await new Promise((resolve) => setTimeout(resolve, 300));
        await Promise.all(
            [...skeletons].map(
                (skeleton) =>
                    new Promise((resolve) =>
                        skeleton.addEventListener("transitionend", resolve, { once: true })
                    )
            )
        );

        // Remove skeletons and add real content
        if (!isLoadMore) {
            pokedexList.replaceChildren(fragment);
        } else {
            const currentChildren = [...pokedexList.children];
            const newChildren = currentChildren
                .slice(0, -skeletonCount)
                .concat(...fragment.children);
            pokedexList.replaceChildren(...newChildren);
        }

        // Stagger animation for new cards
        requestAnimationFrame(() => {
            const cards = pokedexList.querySelectorAll(".pokedex-card:not(.animate-in)");
            cards.forEach((card, index) => {
                setTimeout(() => {
                    card.classList.add("animate-in");
                }, index * 125); // 50ms delay between each card
            });
        });

        isLoading = false;
        updateLoadMoreButton();
    }
    // async function loadPokemon(pokemonList) {
    //     // showSpinner();
    //     const pokemonPromises = pokemonList.results.map(async (pokemon) => {
    //         const details = await fetchPokemonDetails(pokemon.url);
    //         return { details };
    //     });

    //     const fragment = document.createDocumentFragment();
    //     const results = await Promise.all(pokemonPromises);

    //     for (const { details } of results) {
    //         const card = await renderPokemonCard(details, handleRoute);
    //         fragment.appendChild(card);
    //     }

    //     const pokedexList = document.querySelector(".pokedex__list");

    //     if (!isLoadMore) {
    //         pokedexList.replaceChildren();
    //     }

    //     pokedexList.appendChild(fragment);
    //     // hideSpinner();
    // }

    pokedexFilterIcon.forEach((icon) => {
        const type = icon.closest(".pokedex__filter-item").dataset.filter;
        icon.style.background = `linear-gradient(to bottom right, ${TYPE_COLORS[type].gradient} )`;
    });

    window.addEventListener("popstate", handleRoute);

    function areArraysEqual(arr1, arr2) {
        return arr1.length === arr2.length && arr1.every((item) => arr2.includes(item));
    }

    function hasFilterChanged() {
        return (
            filterState.filterMode !== prevFilterState.filterMode ||
            !areArraysEqual(filterState.filterType, prevFilterState.filterType)
        );
    }

    function toggleApplyFilterButton() {
        const applyFilter = document.querySelector(".pokedex__filter-action-apply");
        const applyFilterDisabledClass = "pokedex__filter-action-apply--disabled";

        applyFilter.classList.toggle(applyFilterDisabledClass, !hasFilterChanged());
    }

    function updateFilterModeDescription() {
        const description =
            filterState.filterMode === "any"
                ? "Pokémon matching any type."
                : "Pokémon matching all types.";
        document.querySelector(".pokedex__filter-mode-description").textContent = description;
    }

    function createSkeletonCard() {
        const skeleton = document.createElement("div");
        skeleton.className = "skeleton-card";
        skeleton.innerHTML = `
      <div class="pokedex-card__pokeball-background">
        <svg width="206" height="208" viewBox="0 0 206 208" fill="none" xmlns="http://www.w3.org/2000/svg" class="pokedex-card__pokeball pokedex-card__pokeball--skeleton">
          <path d="M127.762 104C127.762 117.676 116.676 128.762 103 128.762C89.3244 128.762 78.2381 117.676 78.2381 104C78.2381 90.3244 89.3244 79.2381 103 79.2381C116.676 79.2381 127.762 90.3244 127.762 104Z" fill="white"></path>
          <path fill-rule="evenodd" clip-rule="evenodd" d="M103 208C155.393 208 198.738 169.257 205.947 118.857H145.035C138.917 136.169 122.407 148.571 103 148.571C83.5933 148.571 67.0835 136.169 60.9648 118.857H0.0532227C7.26235 169.257 50.6067 208 103 208ZM60.9648 89.1429H0.0532227C7.26235 38.7431 50.6067 0 103 0C155.393 0 198.738 38.7431 205.947 89.1429H145.035C138.917 71.8314 122.407 59.4286 103 59.4286C83.5933 59.4286 67.0835 71.8314 60.9648 89.1429ZM127.762 104C127.762 117.676 116.676 128.762 103 128.762C89.3244 128.762 78.2381 117.676 78.2381 104C78.2381 90.3244 89.3244 79.2381 103 79.2381C116.676 79.2381 127.762 90.3244 127.762 104Z" fill="white"></path>
        </svg>
      </div>
    `;
        return skeleton;
    }

    function updateLoadMoreButton() {
        // Hide the "Load More" button if search is active, any filters are selected, or data is loading
        if (isLoading || isSearchActive || selectedFilters.size > 0) {
            loadMoreBtn.style.display = "none";
        } else {
            loadMoreBtn.style.display = "block";
        }
    }

    function filterPokemonCards() {
        const pokedexList = document.querySelector(".pokedex__list");

        // Remove any previously added "filtered" skeleton placeholders.
        pokedexList.querySelectorAll(".filtered-skeleton").forEach((skeleton) => skeleton.remove());

        // Grab all the real pokemon cards. (Assuming they have the class "pokedex-card")
        const pokemonCards = Array.from(pokedexList.children).filter((child) =>
            child.classList.contains("pokedex-card")
        );

        // Count how many cards get filtered out
        let filteredCount = 0;
        const animationPromises = [];

        // Loop through all actual cards to determine if they match the filter criteria.
        pokemonCards.forEach((card, index) => {
            // Assume each card has elements that contain type information with [data-filter].
            const typeElements = card.querySelectorAll("[data-filter]");
            const cardTypes = Array.from(typeElements).map((el) => el.dataset.filter);

            // Determine if this card should be shown based on your filter logic.
            // (Your original logic using selectedFilters and filterState is used here.)
            const isShow =
                selectedFilters.size === 0 ||
                (filterState.filterMode === "any"
                    ? cardTypes.some((type) => selectedFilters.has(type))
                    : cardTypes.length === selectedFilters.size &&
                      Array.from(selectedFilters).every((filter) => cardTypes.includes(filter)));

            if (!isShow) {
                filteredCount++;
                card.classList.add("filtered-out");
                const promise = new Promise((resolve) => {
                    setTimeout(() => {
                        card.style.display = "none";
                        resolve();
                    }, 300);
                });
                animationPromises.push(promise);
            } else {
                card.style.display = "block";
                card.classList.remove("filtered-out");
                setTimeout(() => {
                    card.classList.add("animate-in");
                }, index * 50);
            }
        });

        // Append a skeleton placeholder for each card that got filtered out.
        Promise.all(animationPromises).then(() => {
            for (let i = 0; i < filteredCount; i++) {
                const skeleton = createSkeletonCard();
                skeleton.classList.add("filtered-skeleton");
                pokedexList.appendChild(skeleton);
            }
        });
    }

    searchInput.addEventListener("input", async (e) => {
        // if (e.target.value === "") {
        //     if (isSearchActive) {
        //         isSearchActive = false;
        //         const pokemonList = await fetchPokemonList(20, 0);
        //         await loadPokemon(pokemonList);
        //         filterPokemonCards();
        //     }
        // }
    });

    searchInput.addEventListener("keydown", async (e) => {
        if (e.key === "Enter") {
            const pokedexList = document.querySelector(".pokedex__list");
            const searchValue = e.target.value.trim().toLowerCase();
            const pokemonList = await fetchPokemonList(1025, 0);

            if (searchValue !== "") {
                pokedexList.innerHTML = "";
                isSearchActive = true;

                const filteredPokemonList = pokemonList.results.filter((pokemon) => {
                    const isNameMatch = pokemon.name.includes(searchValue);
                    const idFromUrl = pokemon.url.match(/(\d+)\/$/)[1];
                    const isIdMatch = idFromUrl === searchValue;

                    return isNameMatch || isIdMatch;
                });

                if (filteredPokemonList.length === 0) {
                    pokedexList.innerHTML = `
                        <div class="pokedex__no-results-wrapper">
                            <p class="pokedex__no-results">No Pokémon found...</p>
                        </div>
                        `;
                    updateLoadMoreButton();

                    return;
                }

                if (!isFiltered) {
                    await loadPokemon({ results: filteredPokemonList });

                    isFiltered = false;

                    updateLoadMoreButton();
                } else {
                    await loadPokemon({ results: filteredPokemonList });

                    filterPokemonCards();
                    updateLoadMoreButton();

                    isFiltered = false;
                }
            }
        }
    });

    loadMoreBtn.addEventListener("click", async () => {
        const offset = document.querySelectorAll(".pokedex-card").length;
        const pokemonList = await fetchPokemonList(24, offset);

        isLoadMore = true;
        await loadPokemon(pokemonList);
        isLoadMore = false;
    });

    const prevFilterState = {
        filterMode: "any",
        filterType: [],
    };

    const filterState = {
        filterMode: "any",
        filterType: [],
    };

    searchFilter.addEventListener("click", () => {
        if (window.getComputedStyle(pokedexDropdown).display === "none") {
            pokedexDropdown.style.display = "block";
        } else {
            filterState.filterMode = prevFilterState.filterMode;
            filterState.filterType = [...prevFilterState.filterType];

            pokedexDropdown.style.display = "none";
        }

        // const filterList = document.querySelector(".pokedex__filter-list");
        // filterList.scrollTo(0, 0);

        const filterModes = document.querySelectorAll("[data-filter-mode]");
        filterModes.forEach((mode) => {
            const selectedFilterClass = "pokedex__filter-option--selected";

            if (filterState.filterMode === mode.dataset.filterMode)
                mode.classList.add(selectedFilterClass);
            else mode.classList.remove(selectedFilterClass);
        });

        const checkMarks = document.querySelectorAll(".pokedex__filter-check");
        checkMarks.forEach((checkMark) => {
            const filterItem = checkMark.parentElement;
            const typeName = filterItem.dataset.filter;

            if (filterState.filterType.includes(typeName))
                checkMark.classList.add("pokedex__filter-check--active");
            else checkMark.classList.remove("pokedex__filter-check--active");
        });

        updateFilterModeDescription();
        toggleApplyFilterButton();
    });

    pokedexDropdown.addEventListener("click", (e) => {
        const selectedDropMode = e.target.closest("[data-filter-mode]");
        const selectedFilterClass = "pokedex__filter-option--selected";

        if (selectedDropMode) {
            if (!selectedDropMode.classList.contains(selectedFilterClass)) {
                const parent = selectedDropMode.parentElement;

                parent.querySelectorAll(`.${selectedFilterClass}`).forEach((el) => {
                    el.classList.remove(selectedFilterClass);
                });

                selectedDropMode.classList.add(selectedFilterClass);
            }

            filterState.filterMode = selectedDropMode.dataset.filterMode;

            updateFilterModeDescription();
            toggleApplyFilterButton();

            return;
        }

        const dropDownItem = e.target.closest(".pokedex__filter-item");

        if (dropDownItem) {
            const checkMark = dropDownItem.querySelector(".pokedex__filter-check");
            checkMark.classList.toggle("pokedex__filter-check--active");

            const typeName = dropDownItem.dataset.filter;
            if (checkMark.classList.contains("pokedex__filter-check--active")) {
                if (!filterState.filterType.includes(typeName)) {
                    filterState.filterType.push(typeName);
                }
            } else {
                filterState.filterType = filterState.filterType.filter((type) => type !== typeName);
            }

            toggleApplyFilterButton();
        }

        const clearFilter = e.target.closest(".pokedex__filter-action-clear");

        if (clearFilter) {
            const activeCheckMarks = document.querySelectorAll(".pokedex__filter-check--active");

            filterState.filterMode = "any";
            filterState.filterType = [];

            activeCheckMarks.forEach((checkMark) => {
                checkMark.classList.remove("pokedex__filter-check--active");
            });

            document.querySelectorAll("[data-filter-mode]").forEach((mode) => {
                mode.classList.toggle(
                    "pokedex__filter-option--selected",
                    mode.dataset.filterMode === "any"
                );
            });

            updateFilterModeDescription();
            toggleApplyFilterButton();
        }

        const applyFilter = e.target.closest(".pokedex__filter-action-apply");

        if (applyFilter) {
            prevFilterState.filterMode = filterState.filterMode;
            prevFilterState.filterType = [...filterState.filterType];

            const activeFilters = document.querySelector(".pokedex__active-filters");

            activeFilters.replaceChildren();
            selectedFilters.clear();

            filterState.filterType.forEach((typeName, index) => {
                selectedFilters.add(typeName);

                const activeFilter = document.createElement("div");
                activeFilter.className = "pokedex__active-filter";
                activeFilter.dataset.filter = typeName;
                activeFilter.style.background = `linear-gradient(to bottom right, ${TYPE_COLORS[typeName].gradient} )`;
                activeFilter.innerHTML = `
                    <span class="pokedex__active-filter-label">${capitalize(typeName)}</span>
                    <button class="pokedex__active-filter-remove">
                        <svg
                            class="pokedex__filter-remove"
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
                            <path d="M18 6 6 18"></path>
                            <path d="m6 6 12 12"></path>
                        </svg>
                    </button>
                `;

                activeFilters.appendChild(activeFilter);
                setTimeout(() => {
                    activeFilter.classList.add("animate-in");
                }, index * 100);
            });

            isFiltered = true;

            filterPokemonCards();
            updateLoadMoreButton();

            pokedexDropdown.style.display = "none";
        }
    });

    pokedexActiveFilters.addEventListener("click", async (e) => {
        const activeFilterRemove = e.target.closest(".pokedex__active-filter-remove");
        if (!activeFilterRemove) return;

        const activeFilter = activeFilterRemove.closest(".pokedex__active-filter");
        activeFilter.classList.add("animate-out");
        await new Promise((resolve) => setTimeout(resolve, 300));
        const selectedFilter = activeFilter.dataset.filter;

        filterState.filterType = filterState.filterType.filter((type) => type !== selectedFilter);

        prevFilterState.filterMode = filterState.filterMode;
        prevFilterState.filterType = [...filterState.filterType];

        const checkMark = document.querySelector(
            `[data-filter="${selectedFilter}"] .pokedex__filter-check`
        );
        checkMark.classList.remove("pokedex__filter-check--active");

        selectedFilters.delete(selectedFilter);
        activeFilter.remove();

        if (selectedFilters.size === 0) {
            filterState.filterMode = "any";
            prevFilterState.filterMode = "any";

            document.querySelectorAll("[data-filter-mode]").forEach((mode) => {
                mode.classList.toggle(
                    "pokedex__filter-option--selected",
                    mode.dataset.filterMode === "any"
                );
            });
        }

        toggleApplyFilterButton();
        filterPokemonCards();
        updateLoadMoreButton();
    });

    const pokemonList = await fetchPokemonList(24, 0);

    loadPokemon(pokemonList);
    updateLoadMoreButton();
    handleRoute();
});
