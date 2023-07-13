const API_KEY = "16845f8e8129480ea662d2297fa3c6cf";
const url = "https://newsapi.org/v2/everything?q=";

window.addEventListener("load", () => {
    fetchNews("Egypt");
    displayBookmarks();
});


function reload() {
    window.location.reload();
}

let currentQuery = "Egypt";

const cache = {};

async function fetchNews(query, sortBy) {
    currentQuery = query;

    if (cache[query]) {
        bindData(cache[query]);
        return;
    }

    const res = await fetch(`${url}${query}&sortBy=${sortBy}&apiKey=${API_KEY}`);
    const data = await res.json();
    cache[query] = data.articles;
    bindData(data.articles);

    sortSelect.value = "";
}

function sortArticles(articles, criteria) {
    if (!criteria || criteria == "none") {
        // If no sort criteria is selected, return the original list of articles unchanged
        return articles;
    }

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

    // Sort articles before displaying them
    const sortBy = sortSelect.value;
    const sortedArticles = sortArticles(articles, sortBy);

    sortedArticles.forEach((article) => {
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

    const bookmarkCheckbox = cardClone.querySelector("#bookmark");

    // Add an event listener to the bookmark checkbox
    bookmarkCheckbox.addEventListener("change", () => {
    // Get the current list of bookmarks from local storage
    const bookmarks = JSON.parse(localStorage.getItem("bookmarks")) || [];

    if (bookmarkCheckbox.checked) {
        // Check if the article is already in the list of bookmarks
        const index = bookmarks.findIndex((bookmark) => bookmark.title === article.title);
        if (index === -1) {
            // If the article is not already in the list of bookmarks, add it
            bookmarks.push(article);
            localStorage.setItem("bookmarks", JSON.stringify(bookmarks));
        }
    } else {
        // Remove the article from the list of bookmarked articles
        const index = bookmarks.findIndex((bookmark) => bookmark.title === article.title);
        if (index !== -1) {
            bookmarks.splice(index, 1);
            localStorage.setItem("bookmarks", JSON.stringify(bookmarks));
        }
    }

    // Update the displayed list of bookmarks
    displayBookmarks();
});

}

let curSelectedNav = null;

function onNavItemClick(id) {
    fetchNews(id);
    const navItem = document.getElementById(id);
    curSelectedNav?.classList.remove("active");
    curSelectedNav = navItem;
    curSelectedNav.classList.add("active");

    sortSelect.value = "";
}

let debounceTimeout;
const searchButton = document.getElementById("search-button");
const searchText = document.getElementById("search-text");
const sortSelect = document.getElementById("sort-select");

// searchText.addEventListener("input", () => {
//     clearTimeout(debounceTimeout);
//     debounceTimeout = setTimeout(() => {
//         const query = searchText.value;
//         if (!query) return;
//         const sortBy = sortSelect.value;
//         fetchNews(query, sortBy);
//         curSelectedNav?.classList.remove("active");
//         curSelectedNav = null;
//     }, 300);
// });

searchButton.addEventListener("click", () => {
    clearTimeout(debounceTimeout);
    const query = searchText.value;
    if (!query) return;
    const sortBy = sortSelect.value;
    fetchNews(query, sortBy);
    curSelectedNav?.classList.remove("active");
    curSelectedNav = null;

    sortSelect.value = "";
});

sortSelect.addEventListener("change", () => {
    const sortBy = sortSelect.value;
    fetchNews(currentQuery, sortBy);
});

function displayBookmarks() {
    // Get the bookmarked articles from local storage
    const bookmarks = JSON.parse(localStorage.getItem("bookmarks")) || [];

    // Get the bookmarks list element
    const bookmarksList = document.querySelector(".bookmark-list");

    // Clear the bookmarks list
    bookmarksList.innerHTML = "";

    // Create an accordion for each bookmarked article
    for (const bookmark of bookmarks) {
        const accordion = document.createElement("div");
        accordion.classList.add("accordion");

        const title = document.createElement("button");
        title.textContent = bookmark.title;
        title.addEventListener("click", () => {
            window.open(bookmark.url, "_blank");
        });
        accordion.appendChild(title);

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";
        deleteButton.addEventListener("click", () => {
            // Remove the article from the list of bookmarked articles
            const index = bookmarks.findIndex((b) => b.title === bookmark.title);
            if (index !== -1) {
                bookmarks.splice(index, 1);
                localStorage.setItem("bookmarks", JSON.stringify(bookmarks));
                displayBookmarks();
            }
        });
        accordion.appendChild(deleteButton);

        bookmarksList.appendChild(accordion);
    }
}

const bookmarkList = document.querySelector(".bookmark-list");
const bookmarkButton = document.querySelector(".bookmark-tab button");

bookmarkButton.addEventListener("click", () => {
    const rect = bookmarkButton.getBoundingClientRect();
    bookmarkList.style.top = `${rect.bottom}px`;
    bookmarkList.style.left = `${rect.left}px`;
    bookmarkList.classList.toggle("open");
});

