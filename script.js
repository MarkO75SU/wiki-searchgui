// script.js

// Object to hold translations
const translations = {};
let currentLang = 'de'; // Default language

// Mapping of language codes to Wikipedia search help URLs
const wikipediaSearchHelpUrls = {
    'de': 'https://de.wikipedia.org/wiki/Hilfe:Suche',
    'en': 'https://en.wikipedia.org/wiki/Help:Searching',
    'fr': 'https://fr.wikipedia.org/wiki/Aide:Recherche',
    // Add more languages if supported
    'es': 'https://es.wikipedia.org/wiki/Ayuda:Búsqueda',
    'zh': 'https://zh.wikipedia.org/wiki/Help:Search',
    'hi': 'https://hi.wikipedia.org/wiki/Help:Search',
    'ar': 'https://ar.wikipedia.org/wiki/Help:Search',
    'ru': 'https://ru.wikipedia.org/wiki/Help:Search',
    'pt': 'https://pt.wikipedia.org/wiki/Ajuda:Pesquisa'
};

// Helper function to fetch translations
async function fetchTranslations(lang) {
    try {
        const response = await fetch(`${lang}.json`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        translations[lang] = await response.json();
    } catch (error) {
        console.error(`Could not fetch translations for ${lang}:`, error);
    }
}

// Function to apply translations and update dynamic content
function applyTranslations() {
    const elements = document.querySelectorAll('[id]');
    elements.forEach(element => {
        const key = element.id;
        // Check for placeholder translation specifically for input elements
        if (element.tagName === 'INPUT' && element.hasAttribute('placeholder')) {
            const placeholderKey = `${key}-placeholder`; // e.g., 'search-query-placeholder'
            if (translations[currentLang] && translations[currentLang][placeholderKey]) {
                element.placeholder = translations[currentLang][placeholderKey];
            }
        } else if (translations[currentLang] && translations[currentLang][key]) {
            // Default: translate textContent for other elements
            element.textContent = translations[currentLang][key];
        }
    });

    // Handle translation for select options and placeholders
    if (currentLang && translations[currentLang]) {
        // Translate options for the category dropdown
        const categorySelectElement = document.getElementById('category-select');
        if (categorySelectElement) {
            categorySelectElement.querySelectorAll('option').forEach(option => {
                const optionValue = option.value;
                if (optionValue === "") {
                    // Translate placeholder option "Select a category"
                    const placeholderKey = 'placeholder-category-dropdown';
                    if (translations[currentLang][placeholderKey]) {
                        option.textContent = translations[currentLang][placeholderKey];
                    }
                } else {
                    const translationKey = `category-${optionValue}`; // e.g., "category-Science"
                    if (translations[currentLang][translationKey]) {
                        option.textContent = translations[currentLang][translationKey];
                    }
                }
            });
        }

        // Translate options for the target wiki language dropdown
        const targetWikiLangSelect = document.getElementById('target-wiki-lang');
        if (targetWikiLangSelect) {
             targetWikiLangSelect.querySelectorAll('option').forEach(option => {
                const langCode = option.value;
                const translationKey = `lang-${langCode}-option`; // e.g., "lang-de-option"
                if (langCode && translations[currentLang][translationKey]) {
                    option.textContent = translations[currentLang][translationKey];
                }
            });
            
            // Sync the selected option of target-wiki-lang to match the app's currentLang
            // This makes the default target wiki language change with the app's UI language.
            const currentAppLangCode = currentLang; // e.g., 'de', 'en', 'fr'
            const optionValues = Array.from(targetWikiLangSelect.options).map(option => option.value);

            if (optionValues.includes(currentAppLangCode)) {
                targetWikiLangSelect.value = currentAppLangCode;
            } else {
                // If currentAppLangCode is not a direct option, reset to default 'de'
                // or choose a sensible fallback. Assuming 'de' is the most robust default.
                targetWikiLangSelect.value = 'de';
            }
        }
    }
    
    // Update dynamic links, like the Wikipedia search help link
    const officialDocLink = document.getElementById('official-doc-link');
    if (officialDocLink) {
        officialDocLink.href = wikipediaSearchHelpUrls[currentLang] || wikipediaSearchHelpUrls['en']; // Fallback to English if language not found
    }
}

// Language switcher functionality
document.querySelectorAll('.lang-button').forEach(button => {
    button.addEventListener('click', async (event) => {
        currentLang = event.target.dataset.lang;
        await fetchTranslations(currentLang);
        applyTranslations();
    });
});

// Info popup functionality
document.querySelectorAll('.info-icon').forEach(icon => {
    icon.addEventListener('mouseover', (event) => {
        const infoId = event.target.dataset.infoId;
        const popup = document.getElementById(`${infoId}-popup`);
        if (popup) {
            popup.style.display = 'block';
        }
    });

    icon.addEventListener('mouseout', (event) => {
        const infoId = event.target.dataset.infoId;
        const popup = document.getElementById(`${infoId}-popup`);
        if (popup) {
            popup.style.display = 'none';
        }
    });
});

// Function to add Enter key listener to trigger form submission
function addEnterKeySubmitListener() {
    const searchForm = document.getElementById('search-form');
    // Exit if the search form is not found to prevent errors
    if (!searchForm) {
        console.error("Search form element not found. Cannot attach Enter key listener.");
        return;
    }

    const inputFieldsToWatch = [
        'search-query',
        'exact-phrase',
        'without-words',
        'any-words',
        'incategory-value',
        'deepcat-value',
        'prefix-value',
        'subpageof-value',
        'linkfrom-value',
        'insource-value',
        'hastemplate-value',
        'filetype-value',
        'filesize-min',
        'filesize-max',
        'category-select' // The new dropdown
    ];

    inputFieldsToWatch.forEach(id => {
        const inputElement = document.getElementById(id);
        if (inputElement) {
            inputElement.addEventListener('keydown', (event) => {
                if (event.key === 'Enter') {
                    // Prevent default form submission behavior if Enter is pressed
                    event.preventDefault();
                    // Manually trigger the form submission to initiate search
                    searchForm.submit();
                }
            });
        } else {
            // Log if an expected input element is not found
            console.warn(`Input element with ID '${id}' not found. Enter key listener not attached for this field.`);
        }
    });
}


// Event listener for form submission
const searchForm = document.getElementById('search-form');
if (searchForm) {
    searchForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // Prevent default form submission
        console.log("Form submitted. Generating search query...");

        const generatedQuery = generateSearchString();
        const targetLangInput = document.getElementById('target-wiki-lang');
        // Safely get targetLang, default to 'en' if element not found or value is empty
        const targetLang = targetLangInput ? targetLangInput.value || 'en' : 'en';

        const resultsContainer = document.getElementById('simulated-search-results');
        
        if (resultsContainer) {
            resultsContainer.innerHTML = '<li>Searching...</li>'; // Display loading indicator
        }

        if (generatedQuery && targetLang) {
            console.log(`Searching Wikipedia with query: "${generatedQuery}" in language: "${targetLang}"`);
            const searchResults = await performWikipediaSearch(generatedQuery, targetLang);
            if (resultsContainer) {
                resultsContainer.innerHTML = ''; // Clear loading message
            }

            if (searchResults && searchResults.length > 0) {
                console.log(`Found ${searchResults.length} search results.`);
                for (const result of searchResults) {
                    const summary = await fetchArticleSummary(result.title, targetLang);
                    const listItem = document.createElement('li');
                    // Link to the Wikipedia article
                    listItem.innerHTML = `
                        <a href="https://${targetLang}.wikipedia.org/wiki/${encodeURIComponent(result.title)}" target="_blank">
                            <strong>${result.title}</strong>
                        </a>
                        <p>${summary}</p>
                    `;
                    if (resultsContainer) {
                        resultsContainer.appendChild(listItem);
                    }
                }
            } else {
                console.log("No search results found.");
                if (resultsContainer) {
                    resultsContainer.innerHTML = '<li>No results found.</li>';
                }
            }
        } else {
            console.log("Search query or target language missing.");
            if (resultsContainer) {
                resultsContainer.innerHTML = '<li>Please enter some search parameters or select a target language.</li>';
            }
        }
    });
} else {
    console.error("Element with ID 'search-form' not found. Submit listener not attached.");
}

// Preset buttons functionality
// Using optional chaining for safety
document.getElementById('preset-easy')?.addEventListener('click', () => {
    document.getElementById('search-form')?.reset();
    // Toggle checkboxes off and on to ensure they are unchecked
    document.getElementById('option-intitle')?.checked && document.getElementById('option-intitle').click();
    document.getElementById('option-intext')?.checked && document.getElementById('option-intext').click();
    document.querySelectorAll('#namespaces-options input[type="checkbox"]').forEach(checkbox => {
        if (checkbox.checked) checkbox.click(); // Uncheck all namespaces
    });

    // Set easy preset: only main query
    const searchInput = document.getElementById('search-query');
    if (searchInput) searchInput.value = "Example Search";
    generateSearchString();
});

document.getElementById('preset-middle')?.addEventListener('click', () => {
    document.getElementById('search-form')?.reset();
    // Toggle checkboxes off and on to ensure they are unchecked
    document.getElementById('option-intitle')?.checked && document.getElementById('option-intitle').click();
    document.getElementById('option-intext')?.checked && document.getElementById('option-intext').click();
    document.querySelectorAll('#namespaces-options input[type="checkbox"]').forEach(checkbox => {
        if (checkbox.checked) checkbox.click(); // Uncheck all namespaces
    });

    // Set middle preset: main query, exact phrase, maybe one namespace
    const searchInput = document.getElementById('search-query');
    if (searchInput) searchInput.value = "Complex Query";
    const exactPhraseInput = document.getElementById('exact-phrase');
    if (exactPhraseInput) exactPhraseInput.value = "exact words";
    document.getElementById('ns-main')?.click(); // Check 'Article' namespace
    generateSearchString();
});

document.getElementById('preset-complex')?.addEventListener('click', () => {
    document.getElementById('search-form')?.reset();
    // Toggle checkboxes off and on to ensure they are unchecked
    document.getElementById('option-intitle')?.checked && document.getElementById('option-intitle').click();
    document.getElementById('option-intext')?.checked && document.getElementById('option-intext').click();
    document.querySelectorAll('#namespaces-options input[type="checkbox"]').forEach(checkbox => {
        if (checkbox.checked) checkbox.click(); // Uncheck all namespaces
    });

    // Set complex preset: multiple fields filled
    const searchInput = document.getElementById('search-query');
    if (searchInput) searchInput.value = "Advanced Topic";
    const exactPhraseInput = document.getElementById('exact-phrase');
    if (exactPhraseInput) exactPhraseInput.value = "specific phrase";
    const withoutWordsInput = document.getElementById('without-words');
    if (withoutWordsInput) withoutWordsInput.value = "unwanted";
    const anyWordsInput = document.getElementById('any-words');
    if (anyWordsInput) anyWordsInput.value = "optionA OR optionB";
    const incategoryValueInput = document.getElementById('incategory-value');
    if (incategoryValueInput) incategoryValueInput.value = "Science, Technology";
    document.getElementById('ns-main')?.click(); // Check 'Article' namespace
    document.getElementById('ns-file')?.click(); // Check 'File' namespace
    document.getElementById('option-fuzzy')?.click(); // Check fuzzy search
    generateSearchString();
});


// Initial load
document.addEventListener('DOMContentLoaded', async () => {
    console.log("DOM fully loaded. Initializing application...");
    await fetchTranslations(currentLang);
    applyTranslations();
    generateSearchString(); // Generate initial string on load
    addEnterKeySubmitListener(); // Add the new listener for Enter key
    console.log("Application initialized.");
});
