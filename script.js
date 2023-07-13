const API_KEY = "16845f8e8129480ea662d2297fa3c6cf";
const url = "https://newsapi.org/v2/everything?q=";

window.addEventListener("load", () => fetchNews("Egypt"));

function reload() {
    window.location.reload();
}

let currentQuery = "Egypt";

const cache = {};

async function fetchNews(query) {
    currentQuery = query;

    if (cache[query]) {
        bindData(cache[query]);
        return;
    }

    const res = await fetch(`${url}${query}&apiKey=${API_KEY}`);
    const data = await res.json();
    // Add a relevancy score to each article based on its position in the results
    data.articles.forEach((article, index) => {
        article.relevancyScore = data.articles.length - index;
    });
    // Get the popularity scores of the sources
    const sources = [...new Set(data.articles.map((article) => article.source))];
    const sourcesPopularity = await getPopularityScores(sources);
    // Add a popularity score to each article based on its source's popularity
    data.articles.forEach((article) => {
        article.popularityScore = sourcesPopularity[article.source.name] || 0;
    });
    cache[query] = data.articles;
    bindData(data.articles);
}

async function getPopularityScores(sources) {
    const sourcesPopularity = {};
    const corsProxy = "https://cors-anywhere.herokuapp.com/";
    for (const source of sources) {
        if (!source.url) continue;
        const url = `${corsProxy}https://www.alexa.com/siteinfo/${source.url}`;
        const res = await fetch(url);
        const data = await res.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(data, "text/html");
        const rankElement = doc.querySelector(".rankmini-rank");
        if (rankElement) {
            const rankText = rankElement.textContent.trim();
            const rank = parseInt(rankText.replace(/,/g, ""));
            if (!isNaN(rank)) {
                sourcesPopularity[source.name] = 1 / rank;
            }
        }
    }
    return sourcesPopularity;
}


function sortArticles(articles, criteria) {
    const sortedArticles = [...articles];
    sortedArticles.sort((a, b) => {
        if (criteria === "date") {
            return new Date(b.publishedAt) - new Date(a.publishedAt);
        } else if (criteria === "source") {
            return a.source.name.localeCompare(b.source.name);
        } else if (criteria === "relevancy") {
            return b.relevancyScore - a.relevancyScore;
        } else if (criteria === "popularity") {
            return b.popularityScore - a.popularityScore;
        }
    });
    return sortedArticles;
}

function bindData(articles) {
    const cardsContainer = document.getElementById("cards-container");
    const newsCardTemplate = document.getElementById("template-news-card");

    cardsContainer.innerHTML = "";

    articles.forEach((article) => {
        if (!article.urlToImage) return;
        const cardClone = newsCardTemplate.content.cloneNode(true);
        fillDataInCard(cardClone, article);
        cardsContainer.appendChild(cardClone);
    });
}

function fillDataInCard(cardClone, article) {
    const newsImg = cardClone.querySelector("#news-img");
    const newsTitle = cardClone.querySelector("#news-title");
    const newsSource = cardClone.querySelector("#news-source");
    const newsDesc = cardClone.querySelector("#news-desc");

    newsImg.src = article.urlToImage;
    newsTitle.innerHTML = article.title;
    newsDesc.innerHTML = article.description;

    const date = new Date(article.publishedAt).toLocaleString("en-US", {
        timeZone: "Africa/Cairo",
    });

    newsSource.innerHTML = `${article.source.name} • ${date}`;

    cardClone.firstElementChild.addEventListener("click", () => {
        window.open(article.url, "_blank");
    });
}

let curSelectedNav = null;

function onNavItemClick(id) {
    fetchNews(id);
    const navItem = document.getElementById(id);
    curSelectedNav?.classList.remove("active");
    curSelectedNav = navItem;
    curSelectedNav.classList.add("active");
}

let debounceTimeout;
const searchButton = document.getElementById("search-button");
const searchText = document.getElementById("search-text");

searchText.addEventListener("input", () => {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
        const query = searchText.value;
        if (!query) return;
        fetchNews(query);
        curSelectedNav?.classList.remove("active");
        curSelectedNav = null;
    }, 300);
});

searchButton.addEventListener("click", () => {
    clearTimeout(debounceTimeout);
    const query = searchText.value;
    if (!query) return;
    fetchNews(query);
    curSelectedNav?.classList.remove("active");
    curSelectedNav = null;
});

const sortSelect = document.getElementById("sort-select");

sortSelect.addEventListener("change", () => {
    const criteria = sortSelect.value;
    const sortedArticles = sortArticles(cache[currentQuery], criteria);
    bindData(sortedArticles);
});

