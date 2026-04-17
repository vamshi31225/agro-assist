// i18n.js - Custom context-based translation system matching Option 2
const preferredLang = localStorage.getItem('agroLang') || 'en';
let currentTranslations = {};

async function loadTranslations(lang) {
    try {
        const response = await fetch(`/locales/${lang}.json`);
        if (!response.ok) throw new Error("Translation file not found. Falling back to default.");
        currentTranslations = await response.json();
        
        // Replace all nodes with data-i18n attribute
        document.querySelectorAll("[data-i18n]").forEach(el => {
            const key = el.getAttribute("data-i18n");
            if (currentTranslations[key]) {
                if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                    if (el.type === 'button' || el.type === 'submit') {
                        el.value = currentTranslations[key];
                    } else {
                        el.placeholder = currentTranslations[key];
                    }
                } else {
                    // Check if there are nested elements, if yes, just replace the first text node, else replace innerText
                    // For simplicity, mostly replacing innerText
                    el.innerText = currentTranslations[key];
                }
            }
        });

        // Additional handler for text inputs with placeholders
        document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
            const key = el.getAttribute("data-i18n-placeholder");
            if (currentTranslations[key]) {
                el.placeholder = currentTranslations[key];
            }
        });
        
        localStorage.setItem('agroLang', lang);
        document.querySelectorAll('.langSwitcher').forEach(switcher => {
            switcher.value = lang;
        });
        
    } catch (error) {
        console.error("Language Load Error:", error);
        // Fallback to english translation if anything crashes
        if(lang !== 'en') loadTranslations('en');
    }
}

function switchLanguage(lang) {
    loadTranslations(lang);
}

window.t = function(keyOrString) {
    if (!currentTranslations) return keyOrString;
    // If exact match found
    if (currentTranslations[keyOrString]) return currentTranslations[keyOrString];
    
    // Partial Match logic for dynamically concatenated alerts (fallback)
    // E.g. "Thank you for contacting us, " + name -> "Thank you..."
    for (const key in currentTranslations) {
        if (keyOrString.startsWith(key) && key.length > 10) {
            return currentTranslations[key] + keyOrString.slice(key.length);
        }
    }
    
    // For pure generic string match trying to convert from en mapping values in memory
    for (const key in currentTranslations) {
        if (currentTranslations[key] === keyOrString) return currentTranslations[key]; // if it was meant to map back
    }

    return keyOrString;
};

// Initialize language on load
document.addEventListener('DOMContentLoaded', () => {
    loadTranslations(preferredLang);
});
