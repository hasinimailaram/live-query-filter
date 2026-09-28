// --------------------------------------------------
// Live Query Filter System
// Frontend JavaScript
// --------------------------------------------------

// Current page
let currentPage = 1;

// Number of results per page
const resultsPerPage = 10;

// Debounce timer
let debounceTimer;


// --------------------------------------------------
// Get HTML elements
// --------------------------------------------------

const searchInput = document.getElementById("searchInput");

const categoryContainer =
    document.getElementById("categoryContainer");

const resultsContainer =
    document.getElementById("resultsContainer");

const resultCount =
    document.getElementById("resultCount");

const emptyState =
    document.getElementById("emptyState");

const previousButton =
    document.getElementById("previousButton");

const nextButton =
    document.getElementById("nextButton");

const pageNumbers =
    document.getElementById("pageNumbers");


// --------------------------------------------------
// Load categories
// --------------------------------------------------

async function loadCategories() {

    try {

        const response = await fetch("/api/categories");

        const data = await response.json();

        categoryContainer.innerHTML = "";

        if (!data.categories || data.categories.length === 0) {

            categoryContainer.innerHTML =
                "<p>No categories available.</p>";

            return;
        }


        data.categories.forEach(category => {

            const label = document.createElement("label");

            label.className = "category-item";


            const checkbox = document.createElement("input");

            checkbox.type = "checkbox";

            checkbox.value = category;

            checkbox.className = "category-checkbox";


            const text = document.createElement("span");

            text.textContent = category;


            label.appendChild(checkbox);

            label.appendChild(text);

            categoryContainer.appendChild(label);


            // When category changes
            checkbox.addEventListener("change", () => {

                currentPage = 1;

                loadResults();

            });

        });

    } catch (error) {

        console.error("Error loading categories:", error);

        categoryContainer.innerHTML =
            "<p>Unable to load categories.</p>";
    }
}


// --------------------------------------------------
// Get selected categories
// --------------------------------------------------

function getSelectedCategories() {

    const checkboxes =
        document.querySelectorAll(".category-checkbox");

    const selected = [];


    checkboxes.forEach(checkbox => {

        if (checkbox.checked) {

            selected.push(checkbox.value);

        }

    });


    return selected;
}


// --------------------------------------------------
// Load search results
// --------------------------------------------------

async function loadResults() {

    // Show loading state

    resultsContainer.innerHTML = `
        <div class="loading">
            Loading results...
        </div>
    `;

    emptyState.classList.add("hidden");


    // Get search text

    const searchText =
        searchInput.value.trim();


    // Get selected categories

    const selectedCategories =
        getSelectedCategories();


    // Convert categories to comma-separated string

    const categoryParameter =
        selectedCategories.join(",");


    // Create API URL

    const url =
        `/api/search?search=${encodeURIComponent(searchText)}` +
        `&category=${encodeURIComponent(categoryParameter)}` +
        `&page=${currentPage}` +
        `&limit=${resultsPerPage}`;


    try {

        const response = await fetch(url);


        if (!response.ok) {

            throw new Error(
                "Server returned an error"
            );

        }


        const data = await response.json();


        // Display result count

        resultCount.textContent =
            `${data.total_results} result(s) found`;


        // Check for empty results

        if (
            !data.results ||
            data.results.length === 0
        ) {

            resultsContainer.innerHTML = "";

            emptyState.classList.remove("hidden");

            pageNumbers.innerHTML = "";

            previousButton.disabled = true;

            nextButton.disabled = true;

            return;
        }


        emptyState.classList.add("hidden");


        // Display cards

        displayResults(data.results);


        // Display pagination

        displayPagination(
            data.page,
            data.total_pages
        );


    } catch (error) {

        console.error("Error loading results:", error);


        resultsContainer.innerHTML = `
            <div class="loading">
                Unable to load results.
                Please try again.
            </div>
        `;

    }
}


// --------------------------------------------------
// Display result cards
// --------------------------------------------------

function displayResults(results) {

    resultsContainer.innerHTML = "";


    results.forEach((item, index) => {

        const card =
            document.createElement("div");

        card.className = "result-card";


        // Create title

        const title =
            document.createElement("h3");

        title.textContent =
            getTitle(item, index);


        card.appendChild(title);


        // Display all fields

        Object.entries(item).forEach(
            ([key, value]) => {

                const field =
                    document.createElement("div");

                field.className =
                    "result-field";


                const strong =
                    document.createElement("strong");

                strong.textContent =
                    formatFieldName(key) + ": ";


                const valueText =
                    document.createElement("span");

                valueText.textContent =
                    value;


                field.appendChild(strong);

                field.appendChild(valueText);

                card.appendChild(field);

            }
        );


        resultsContainer.appendChild(card);

    });
}


// --------------------------------------------------
// Get card title
// --------------------------------------------------

function getTitle(item, index) {

    const possibleTitleFields = [
        "name",
        "Name",
        "product",
        "Product",
        "title",
        "Title",
        "item",
        "Item"
    ];


    for (
        const field of possibleTitleFields
    ) {

        if (
            item[field] !== undefined &&
            item[field] !== ""
        ) {

            return item[field];

        }

    }


    return `Catalog Item ${index + 1}`;
}


// --------------------------------------------------
// Format field names
// --------------------------------------------------

function formatFieldName(fieldName) {

    return fieldName
        .replace(/_/g, " ")
        .replace(/\b\w/g, letter =>
            letter.toUpperCase()
        );

}


// --------------------------------------------------
// Display pagination
// --------------------------------------------------

function displayPagination(
    page,
    totalPages
) {

    pageNumbers.innerHTML = "";


    // Previous button

    previousButton.disabled =
        page <= 1;


    previousButton.onclick = () => {

        if (page > 1) {

            currentPage = page - 1;

            loadResults();

            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });

        }

    };


    // Next button

    nextButton.disabled =
        page >= totalPages;


    nextButton.onclick = () => {

        if (page < totalPages) {

            currentPage = page + 1;

            loadResults();

            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });

        }

    };


    // Don't create page buttons if
    // there is only one page

    if (totalPages <= 1) {

        return;

    }


    // Create page buttons

    for (
        let pageNumber = 1;
        pageNumber <= totalPages;
        pageNumber++
    ) {

        const button =
            document.createElement("button");


        button.className =
            "page-button";


        button.textContent =
            pageNumber;


        if (pageNumber === page) {

            button.classList.add("active");

        }


        button.addEventListener(
            "click",
            () => {

                currentPage =
                    pageNumber;

                loadResults();

                window.scrollTo({
                    top: 0,
                    behavior: "smooth"
                });

            }
        );


        pageNumbers.appendChild(button);

    }

}


// --------------------------------------------------
// Debounced search
// --------------------------------------------------

searchInput.addEventListener(
    "input",
    () => {

        clearTimeout(debounceTimer);


        debounceTimer = setTimeout(
            () => {

                currentPage = 1;

                loadResults();

            },
            400
        );

    }
);


// --------------------------------------------------
// Initial application startup
// --------------------------------------------------

loadCategories();

loadResults();