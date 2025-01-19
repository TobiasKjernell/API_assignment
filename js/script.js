const ENDPOINT = "https://pokeapi.co/api/v2/pokemon/";
const statsGrid_el = document.querySelector('.stats-grid');
const infoGrid_el = document.querySelector('.information-grid')
const searchList_el = document.querySelector('.search__list');
const searchItems = [];
const searchInput_el = document.querySelector('.search__input');
const searchInputBtn_el = document.querySelector('.search__btn');
const imgAndNameParent_el = document.querySelector('.img__container');
const locationParent_el = document.querySelector('.area__location')
const footer_el = document.querySelector('.footer');
const numberCheck = /^\d/;
const pokemonDic = new Map();
let cachedPokemons = "";
let currentSearchList = [];
let amountOfSearchItems = 15;
let pokeList = [];
let currentHighlight = 0;
let previousHightlight = 0;
let skip = false;

const addToGrid = (statsValue, statsType, grid, positionInsert) => {
    let letterFix = upperCaseHelper(statsType);
    let letterFixNumber = statsType;
    if (!numberCheck.test(statsValue)) {
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

const addImgAndName = (response, positionInsert) => {
    imgAndNameParent_el.textContent = "";
    imgAndNameParent_el.insertAdjacentHTML(positionInsert, `<div class="pokemon__name">${upperCaseHelper(response.name)}</div>
    <img src="${response.sprites.front_default}" alt="" class="card__img" height="auto" width="200px">`)
}

const addRightInfo = (response, location) => {
    addImgAndName(response, 'afterbegin')
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

}

const promiseHelper = (url, errorMsg = 'Something went wrong in api search') => {
    return fetch(url).then(response => {
        if (!response.ok) throw new Error(`${errorMsg} (${response.status})`);

        return response.json();
    })
}

const getPokemon = async (id) => {
    try {
        searchInputBtn_el.textContent = "...";

        //Pararell because i like when all card-info comes together and throws error if something happens.
        let [pokemonInfo, locationInfo] = await Promise.all([
            promiseHelper(ENDPOINT + id, 'Pokemon search went wrong'),
            promiseHelper(`https://pokeapi.co/api/v2/pokemon/${id}/encounters`, 'Location search went wrong')

        ]);
        
    
        statsGrid_el.textContent = "";
  

        addLeftInfo(pokemonInfo);
        addRightInfo(pokemonInfo, locationInfo);
        searchInputBtn_el.textContent = "Search";

    } catch (err) {
        console.log(err);
    }
}

const mapValuesSearch = (map, val) => [...map.values()].includes(val)

//Store/Cache once
const getAllPokemons = async () => {
    let allPokemons = await fetch("https://pokeapi.co/api/v2/pokemon?limit=1025");
    overResult = await allPokemons.json();

    let ids = overResult.results.map(element => element.url.slice(element.url[element.url.length - 1], -1).split('/').pop());
    cachedPokemons = overResult.results.map(element => element.name);

    ids.forEach((pokemon, i) => {
        pokemonDic.set(cachedPokemons[i], pokemon)
    })

    pokeList = [...pokemonDic.keys()];
}

const setupFooter = () => {
    let year = new Date();
    footer_el.children.item(0).textContent = `Made by Tobias Kjernell, ${year.getFullYear()}`;
}

const upperCaseHelper = value => {
    return value[0].toUpperCase() + value.slice(1);
}

const searchWrap = (search) => {
    getPokemon(search);
    searchInput_el.value = upperCaseHelper(search)
    searchList_el.textContent = "";
}

const searchChecks = () => {
    let searchValue = searchInput_el.value.toLowerCase().trim();
    if (cachedPokemons.includes(searchValue))
        searchWrap(searchValue);
    else if (pokemonDic.get(pokeList[searchValue - 1]))
        searchWrap(pokemonDic.get(pokeList[searchValue - 1]))
}

const setupSearchAndEvents = () => {

    //Delegate hierarchy
    searchList_el.addEventListener('click', (e) => {
        const clicked = e.target.closest(".search__item");

        if (!clicked) return;

        let searchValue = clicked.children[0].textContent.toLowerCase().trim()
        searchWrap(searchValue);

    })

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
            let quickCalc = currentHighlight - 1 < 0 ? 0 : currentHighlight - 1;
            searchList_el.children.item(quickCalc).classList.add('--active');
            searchInput_el.value = searchList_el.children.item(quickCalc).children.item(0).textContent;
        }
    })

}

const createSearchItem = (id, pokemonName) => {
    searchList_el.insertAdjacentHTML('beforeend', `<li class="search__item">
        <p class="search__item--name">${pokemonName}</p>
        <p class="search__item--id">ID: ${id}</p>
        </li>`);
}

const Init = () => {
    setupFooter();
    setupSearchAndEvents();
    getAllPokemons();
}

const inputFiltering = () => {
    searchList_el.textContent = "";

    currentSearchList = [];

    const filterValue = searchInput_el.value.toLowerCase();
    if (filterValue.length === 0) return;

    currentHighlight = 0;
    if (!numberCheck.test(filterValue)) {

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

    } else if (numberCheck.test(filterValue)) {
        const text = searchInput_el.value.toLowerCase().trim();

        if (pokemonDic.get(pokeList[text - 1]) && !currentSearchList.includes(text)) {
            let id = pokemonDic.get(pokeList[text - 1]);
            let name = pokeList[text - 1][0].toUpperCase() + pokeList[text - 1].slice(1);
            createSearchItem(id, name)
            currentSearchList.push(text);
        }
    }
}

searchInput_el.addEventListener('input', () => inputFiltering());

Init();
getPokemon("goomy");


