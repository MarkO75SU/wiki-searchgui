// src/js/modules/ui.js
import { getTranslation, getLanguage } from './state.js';
import { generateSearchString } from './search.js';
import { performWikipediaSearch, fetchArticleSummary } from './api.js';
import { presetCategories } from './presets.js';

const wikipediaSearchHelpUrls = {
    'de': 'https://de.wikipedia.org/wiki/Hilfe:Suche',
    'en': 'https://en.wikipedia.org/wiki/Help:Searching',
    'fr': 'https://fr.wikipedia.org/wiki/Aide:Recherche',
    'es': 'https://es.wikipedia.org/wiki/Ayuda:Búsqueda',
    'zh': 'https://zh.wikipedia.org/wiki/Help:Search',
    'hi': 'https://hi.wikipedia.org/wiki/Help:Search',
    'ar': 'https://ar.wikipedia.org/wiki/Help:Search',
    'ru': 'https://ru.wikipedia.org/wiki/Help:Search',
    'pt': 'https://pt.wikipedia.org/wiki/Ajuda:Pesquisa'
};

export function populatePresetCategories(categorySelectElement) {
    categorySelectElement.innerHTML = `<option value="">${getTranslation('placeholder-preset-category')}</option>`;
    for (const key in presetCategories) {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = presetCategories[key][`name_${getLanguage()}`] || presetCategories[key].name_en;
        categorySelectElement.appendChild(option);
    }
}

export function populatePresets(categorySelectElement, presetSelectElement) {
    presetSelectElement.innerHTML = `<option value="">${getTranslation('placeholder-select-preset')}</option>`;
    const selectedCategoryKey = categorySelectElement.value;
    if (selectedCategoryKey && presetCategories[selectedCategoryKey]) {
        const categoryPresets = presetCategories[selectedCategoryKey].presets;
        for (const key in categoryPresets) {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = getTranslation(key); // Translate preset name
            presetSelectElement.appendChild(option);
        }
    }
}

export function applyPreset(preset) {
    clearForm(); // Clear all form fields first

    for (const key in preset) {
        const element = document.getElementById(key);
        if (element) {
            if (element.type === 'checkbox') {
                element.checked = preset[key];
            } else {
                element.value = getTranslation(preset[key], preset[key]);
            }
        }
    }
    generateSearchString();
}

export function applyTranslations() {
    const lang = getLanguage();
    document.documentElement.lang = lang;

    document.querySelectorAll('[id]').forEach(element => {
        const key = element.id;
        const translation = getTranslation(key);
        if (translation) {
            if (element.hasAttribute('placeholder')) {
                element.placeholder = translation;
            } else {
                element.textContent = translation;
            }
        }
    });

    // Translate preset category and preset select labels
    const presetCategorySelect = document.getElementById('preset-category-select');
    const presetSelect = document.getElementById('preset-select');
    if (presetCategorySelect && presetSelect) {
        populatePresetCategories(presetCategorySelect);
        populatePresets(presetCategorySelect, presetSelect); // Re-populate based on current selection
    }

    const officialDocLink = document.getElementById('official-doc-link');
    if (officialDocLink) {
        officialDocLink.href = wikipediaSearchHelpUrls[lang] || wikipediaSearchHelpUrls['en'];
    }

    const targetLangSelect = document.getElementById('target-wiki-lang');
    if (targetLangSelect) {
        targetLangSelect.value = lang;
    }
    
    // Update footer links
    const footerLinkIds = ['link-license-agreement', 'link-terms-of-use', 'link-non-commercial-use', 'link-faq', 'link-report-issue'];
    footerLinkIds.forEach(id => {
        const link = document.getElementById(id);
        if (link) {
            const originalHref = link.getAttribute('href').replace('_de.html', '.html');
            if (lang === 'de') {
                link.href = originalHref.replace('.html', '_de.html');
            } else {
                link.href = originalHref;
            }
        }
    });
}
