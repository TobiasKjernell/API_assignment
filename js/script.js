"use strict"
const statsGrid_el = document.querySelector('.stats-grid');
const infoGrid_el = document.querySelector('.information-grid')
const searchList_el = document.querySelector('.search__list');
const searchItems = [];
const searchInput_el = document.querySelector('.search__input');
const searchInputBtn_el = document.querySelector('.search__btn');
const imgAndNameParent_el = document.querySelector('.img__container');
const locationParent_el = document.querySelector('.area__location')
const footer_el = document.querySelector('.footer');
const card_el = document.querySelector('.card');
const errorInfo_el = document.querySelector('.error__info');
const shinyImgParent = document.querySelector('.card__shiny-container--img');
const colorThemeContainer_el = document.querySelector('.color__theme-container');
const NUMBERCHECK = /^\d/;
const pokemonDic = new Map();
let cachedPokemons = "";
let currentSearchList = [];
let amountOfSearchItems = 15;
let pokeList = [];
let currentHighlight = 0;
let previousHightlight = 0;
let skip = false;
let currentPokemon = "";

const addToGrid = (statsValue, statsType, grid, positionInsert) => {
    let letterFix = upperCaseHelper(statsType);
    let letterFixNumber = statsType;
    if (!NUMBERCHECK.test(statsValue)) {
        letterFixNumber = upperCaseHelper(statsValue);
        statsValue = letterFixNumber;
    }

    grid.insertAdjacentHTML(positionInsert,
        `           <div class="stats__container">
                        <p class="stats__type">${letterFix}</p>
                        <p class="stats__info">${statsValue}</p>
                    </div>`
    )
}


const addRightInfo = (response, location) => {

    imgAndNameParent_el.textContent = "";
    imgAndNameParent_el.insertAdjacentHTML('beforeend', `<div class="pokemon__name">${upperCaseHelper(response.name)}</div>
    <img src="${response.sprites.front_default}" alt="åicture of the pokemon: ${response.name}" class="card__img" height="200px" width="200px">`)


    locationParent_el.textContent = "";
    locationParent_el.insertAdjacentHTML('beforeend', '<div class="grid__title">Can be found in:</div>');

    if (location.length === 0) {
        locationParent_el.insertAdjacentHTML('beforeend', ` <div class="location__container"><div class="location__name">Upgraded Pokémon! Search for lowest version!</div>`);

        return;
    }
    location.forEach(zone => {
        locationParent_el.insertAdjacentHTML('beforeend', ` <div class="location__container"><div class="location__name">${upperCaseHelper(zone.location_area.name)}</div>
                            <div class="location__level-container">
                                <div class="location__method">Method: ${upperCaseHelper(zone.version_details[0].encounter_details[0].method.name)}</div>
                                <div class="location__level--min-max">Level ${zone.version_details[0].encounter_details[0].min_level}-${zone.version_details[0].encounter_details[0].max_level}</div>
                                </div>`)
    });
}

const addLeftInfo = (responseData) => {
    infoGrid_el.textContent = "";
    statsGrid_el.textContent = "";

    addToGrid(responseData.id, "ID", infoGrid_el, 'beforeend')
    addToGrid(responseData.weight, "weight", infoGrid_el, 'beforeend');
    addToGrid(responseData.height, "height", infoGrid_el, 'beforeend');
    addToGrid(responseData.base_experience, "Experience", infoGrid_el, 'beforeend');
    addToGrid(Math.abs(responseData.order), "order", infoGrid_el, 'beforeend');
    addToGrid(responseData.species.name, "species", infoGrid_el, 'beforeend');

    if (responseData.types.length > 1)
        responseData.types.forEach((factionType, i) => {
            addToGrid(factionType.type.name, "type " + (i + 1), infoGrid_el, 'beforeend');
        });
    else {
        addToGrid(responseData.types[0]?.type.name, "type", infoGrid_el, 'beforeend');
    }

    responseData.stats.forEach(statsData => {
        addToGrid(statsData.base_stat, statsData.stat.name, statsGrid_el, 'beforeend');
    });

    shinyImgParent.textContent = "";
    shinyImgParent.insertAdjacentHTML('beforeend', `      <img class="card__shiny--img"
                            src="${responseData.sprites.front_shiny ?? ""}"
                            alt="">
                        <img class="card__shiny--img"
                            src="${responseData.sprites.back_shiny ?? ""}"
                            alt="">`)

}

const setErrorInfo = (message, state) => {
    if (state) {
        card_el.classList.add("hidden");
        errorInfo_el.classList.remove('hidden');
        errorInfo_el.textContent = message;
    }
    else {
        card_el.classList.remove("hidden");
        errorInfo_el.classList.add('hidden');
    }
}

const promiseHelper = (url, errorMsg = 'Something went wrong in api search') => {
    return fetch(url).then(response => {
        if (!response.ok) {
            throw new Error(`${errorMsg} (${response.status})`);
        }
        return response.json();
    })
}

const upperCaseHelper = value => {
    return value[0].toUpperCase() + value.slice(1);
}

const getPokemon = async (id) => {
    try {
        searchInputBtn_el.textContent = "...";

        setErrorInfo("", false);

        //Pararell because i like when all card-info comes together and throws error if something happens.
        let [pokemonInfo, locationInfo] = await Promise.all([
            promiseHelper(`https://pokeapi.co/api/v2/pokemon/${id}/`, 'Pokemon search went wrong'),
            promiseHelper(`https://pokeapi.co/api/v2/pokemon/${id}/encounters`, 'Location search went wrong')
        ]);

        localStorage.setItem('pokemon', pokemonInfo.name);
        addLeftInfo(pokemonInfo);
        addRightInfo(pokemonInfo, locationInfo);
        searchInputBtn_el.textContent = "Search";

    } catch (err) {
        setErrorInfo(err.message, true);
    }
}

const mapValuesSearch = (map, val) => [...map.values()].includes(val)

//Store/Cache once
const getAllPokemonsNameAndID = async () => {

    try {
        let allPokemons = await fetch("https://pokeapi.co/api/v2/pokemon?limit=1025");
        let overResult = await allPokemons.json();

        let ids = overResult.results.map(element => element.url.slice(element.url[element.url.length - 1], -1).split('/').pop());
        cachedPokemons = overResult.results.map(element => element.name);

        ids.forEach((pokemon, i) => {
            pokemonDic.set(cachedPokemons[i], pokemon)
        })

        pokeList = [...pokemonDic.keys()];
    }
    catch (err) {
        setErrorInfo(err.message, true);
    }
}

const setupFooter = () => {
    let year = new Date();
    footer_el.children.item(0).textContent = `Made by Tobias Kjernell, ${year.getFullYear()}`;
}

const searchWrap = (search) => {
    if (searchInput_el.value.toLowerCase() === currentPokemon.toLowerCase()) return;

    getPokemon(search);
    searchInput_el.value = upperCaseHelper(search)
    searchList_el.textContent = "";
    currentPokemon = searchInput_el.value;
}

const searchChecks = () => {
    let searchValue = searchInput_el.value.toLowerCase().trim();

    if (cachedPokemons.includes(searchValue))
        searchWrap(searchValue);
    else if (pokemonDic.get(pokeList[searchValue - 1]))
        searchWrap(pokemonDic.get(pokeList[searchValue - 1]))
}

const setThemeColor = (theme) => {

    localStorage.setItem('theme', theme);
    let rootStyle = document.documentElement.style;
    for (const theme of colorThemeContainer_el.children) {
        theme.classList.remove("color__btn--active");
    }

    switch (theme) {
        case "light":
            document.querySelector('.color__btn--light').classList.add('color__btn--active');
            rootStyle.setProperty('--standard-text', '#333');
            rootStyle.setProperty('--base-background-color', '#ACDDDE');
            rootStyle.setProperty('--outline', '#777');
            rootStyle.setProperty('--base-hover', '#94d8da');
            rootStyle.setProperty('--scroll-background', '#c1f9fa');
            rootStyle.setProperty('--place-holder', '#808080');
            break;
        case "dark":
            document.querySelector('.color__btn--dark').classList.add('color__btn--active');
            rootStyle.setProperty('--standard-text', '#fff');
            rootStyle.setProperty('--base-background-color', '#222');
            rootStyle.setProperty('--outline', '#a17a17');
            rootStyle.setProperty('--base-hover', '#181818');
            rootStyle.setProperty('--scroll-background', '#2e2e2e');
            rootStyle.setProperty('--place-holder', '#808080');
            break;
        case "pokemon":
            document.querySelector('.color__btn--pokemon').classList.add('color__btn--active');
            rootStyle.setProperty('--standard-text', '#ffde00');
            rootStyle.setProperty('--base-background-color', '#cc0000');
            rootStyle.setProperty('--outline', '#fff');
            rootStyle.setProperty('--base-hover', '#181818');
            rootStyle.setProperty('--scroll-background', '#ff0f0f');
            rootStyle.setProperty('--place-holder', '#ffde00');
            break;
        default:
            break;
    }
}

const setupColorThemeEvent = () => {
    colorThemeContainer_el.addEventListener('click', (e) => {
        const clicked = e.target.closest('.color__btn');

        if (!clicked) return; { }

        setThemeColor(clicked.dataset.theme);

    })
}

const setupSearchAndEvents = () => {

    //Delegate hierarchy
    searchList_el.addEventListener('click', (e) => {
        const clicked = e.target.closest(".search__item");

        if (!clicked) return;

        let searchValue = clicked.children[0].textContent.toLowerCase().trim()
        searchWrap(searchValue);

    })

    //Input filtering
    searchInput_el.addEventListener('input', () => inputFiltering());

    //Search Button
    searchInputBtn_el.addEventListener('click', (e) => {
        e.preventDefault();
        searchChecks();
    })

    //Enter
    window.addEventListener('keydown', (e) => {
        if (e.code === "Enter" && searchInput_el.value !== "")
            searchChecks();
    })

    //ArrowDown
    window.addEventListener('keydown', (e) => {
        if (e.code === "ArrowDown" && searchList_el.childElementCount > 0) {
            e.preventDefault();

            if (currentHighlight === searchList_el.childElementCount) return;

            searchList_el.children.item(currentHighlight - 1 < 0 ? 0 : currentHighlight - 1).classList.remove('--active')
            searchList_el.children.item(currentHighlight).classList.add('--active');
            searchInput_el.value = searchList_el.children.item(currentHighlight).children.item(0).textContent;
            ++currentHighlight;
            if (currentHighlight >= searchList_el.childElementCount)
                currentHighlight = searchList_el.childElementCount;
        }
    })

    //ArrowUp
    window.addEventListener('keydown', (e) => {
        if (e.code === "ArrowUp" && searchList_el.childElementCount > 0) {
            --currentHighlight;
            e.preventDefault();

            if (currentHighlight <= 0) {
                currentHighlight = 1;
                return;
            }

            searchList_el.children.item(currentHighlight).classList.remove('--active')
            let currentStep = currentHighlight - 1 < 0 ? 0 : currentHighlight - 1;
            searchList_el.children.item(currentStep).classList.add('--active');
            searchInput_el.value = searchList_el.children.item(currentStep).children.item(0).textContent;
        }
    })

}

const createSearchItem = (id, pokemonName) => {
    searchList_el.insertAdjacentHTML('beforeend', `<li class="search__item">
        <p class="search__item--name">${pokemonName}</p>
        <p class="search__item--id">ID: ${id}</p>
        </li>`);
}

const loadLocalStorage = () => {
    let savedThme = localStorage.getItem('theme') !== null ? localStorage.getItem('theme') : 'dark';
    let savedPokemon = localStorage.getItem('pokemon') !== null ? localStorage.getItem('pokemon') : 'ekans';
    setThemeColor(savedThme);
    getPokemon(savedPokemon);
}

const Init = () => {
    setupFooter();
    setupSearchAndEvents();
    setupColorThemeEvent();
    loadLocalStorage();
    getAllPokemonsNameAndID();
}

const inputFiltering = () => {
    searchList_el.textContent = "";

    currentSearchList = [];

    const filterValue = searchInput_el.value.toLowerCase();
    if (filterValue.length === 0) return;

    currentHighlight = 0;
    if (!NUMBERCHECK.test(filterValue)) {

        for (let index = 0; index < amountOfSearchItems; index++) {
            for (const item of pokemonDic.keys()) {
                const text = item.toLowerCase();
                if (text.startsWith(filterValue) && !currentSearchList.includes(item)) {
                    createSearchItem(pokemonDic.get(item), upperCaseHelper(item));
                    currentSearchList.push(item);
                    break;
                }
            }
        }

    } else if (NUMBERCHECK.test(filterValue)) {
        const text = searchInput_el.value.toLowerCase().trim();

        if (pokemonDic.get(pokeList[text - 1]) && !currentSearchList.includes(text)) {
            let id = pokemonDic.get(pokeList[text - 1]);
            let name = pokeList[text - 1][0].toUpperCase() + pokeList[text - 1].slice(1);
            createSearchItem(id, name)
            currentSearchList.push(text);
        }
    }
}

Init();



