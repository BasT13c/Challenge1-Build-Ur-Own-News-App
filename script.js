const API_KEY = "16845f8e8129480ea662d2297fa3c6cf";
// const url = "https://newsapi.org/v2/top-headlines?country=eg&apiKey=${API_KEY}";
const url = "https://newsapi.org/v2/everything?q=";

window.addEventListener("load", () => fetchNews("Egypt"));

function reload() {
    window.location.reload();
}

const cache = {};

async function fetchNews(query) {
    if (cache[query]) {
        bindData(cache[query]);
        return;
    }

    const res = await fetch(`${url}${query}&apiKey=${API_KEY}`);
    const data = await res.json();
    cache[query] = data.articles;
    // console.log(data);
    bindData(data.articles);
}

function bindData(articles) {
    const cardsContainer = document.getElementById("cards-container");
    const newsCardTemplate = document.getElementById("template-news-card");

    cardsContainer.innerHTML = "";

    articles.forEach((article) => {
        if (!article.urlToImage) return;
        const cardClone = newsCardTemplate.content.cloneNode(true);
        // console.log(cardClone);
        fillDataInCard(cardClone, article);
        cardsContainer.appendChild(cardClone);
    });
}

function fillDataInCard(cardClone, article) {
    const newsImg = cardClone.querySelector("#news-img");
    // console.log(newsImg);
    const newsTitle = cardClone.querySelector("#news-title");
    // console.log(newsTitle);
    const newsSource = cardClone.querySelector("#news-source");
    // console.log(newsSource);
    const newsDesc = cardClone.querySelector("#news-desc");
    // console.log(newsDesc);

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

