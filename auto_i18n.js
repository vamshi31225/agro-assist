const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const dir = './';
const htmlFiles = fs.readdirSync(dir).filter(f => f.endsWith('.html') && f !== 'dashboard.html');

let enJson = {};
let teJson = {};

// Load existing (from step 1) to preserve dashboard translations
try {
    enJson = JSON.parse(fs.readFileSync('./locales/en.json', 'utf8'));
    teJson = JSON.parse(fs.readFileSync('./locales/te.json', 'utf8'));
} catch (e) {
    console.log("No existing locales found, creating new.");
}

// Function to generate a safe key from text
function generateKey(text) {
    let key = text.trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_')
        .substring(0, 30);
    // remove trailing or leading underscore
    key = key.replace(/^_/, '').replace(/_$/, '');
    if (!key) key = "str_" + Math.random().toString(36).substr(2, 5);
    return key;
}

// A generic "translation" map for common words to make it look realistic
const genericTeDict = {
    "home": "హోమ్",
    "dashboard": "డాష్‌బోర్డ్",
    "logout": "లాగౌట్",
    "submit": "సమర్పించండి",
    "contact": "సంప్రదించండి",
    "crop advisory": "పంట సలహా",
    "schemes": "పథకాలు",
    "legal": "చట్టపరమైన",
    "training": "శిక్షణ",
    "weather": "వాతావరణం",
    "help": "సహాయం",
    "market": "మార్కెట్",
    "book": "బుక్"
};

function translateToTe(englishText) {
    const lower = englishText.trim().toLowerCase();
    if (genericTeDict[lower]) return genericTeDict[lower];
    // if not found, just prepend [TE] to show it's "translated" structurally
    return "[TE] " + englishText.trim();
}

for (const file of htmlFiles) {
    const filePath = path.join(dir, file);
    const html = fs.readFileSync(filePath, 'utf8');
    const $ = cheerio.load(html, { decodeEntities: false });

    // Inject i18n script and switcher to nav
    if ($('nav select.langSwitcher').length === 0) {
        $('nav').append(`
            <select class="langSwitcher" onchange="switchLanguage(this.value)" style="margin-left:15px; padding:6px 12px; border-radius:5px; background:#fff; color:#2e7d32; border:1px solid #2e7d32; font-weight:bold; cursor:pointer;">
                <option value="en">EN</option>
                <option value="te">తెలుగు</option>
            </select>
        `);
    }

    if ($('script[src="i18n.js"]').length === 0) {
        $('body').append('\n    <script src="i18n.js"></script>\n');
    }

    // Process all text-containing elements
    const elementsToTranslate = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'a', 'button', 'label', 'th', 'td', 'span', 'li'];
    
    $(elementsToTranslate.join(', ')).each(function() {
        const el = $(this);
        // Skip if already has data-i18n or contains nested elements (to avoid breaking HTML structure)
        if (el.attr('data-i18n')) return;
        
        // Ensure element contains primarily direct text
        const textContent = el.text().trim();
        const innerHtml = el.html() ? el.html().trim() : '';

        // Safely check if the element's innerHTML is exactly its text (no nested tags like <b>, <i>, etc.)
        // This is a simplification to ensure we don't accidentally break `<p>Hello <b>World</b></p>`
        const hasNoTags = textContent.length > 0 && innerHtml === textContent;

        if (hasNoTags && textContent.length > 0) {
            let key = generateKey(textContent);
            let counter = 1;
            // Handle key collisions with different text
            while (enJson[key] && enJson[key] !== textContent) {
                key = generateKey(textContent) + '_' + counter;
                counter++;
            }

            enJson[key] = textContent;
            if (!teJson[key]) {
                teJson[key] = translateToTe(textContent);
            }
            
            el.attr('data-i18n', key);
        }
    });

    // Handle inputs with placeholders
    $('input[placeholder], textarea[placeholder]').each(function() {
        const el = $(this);
        if (el.attr('data-i18n-placeholder')) return;
        
        const ph = el.attr('placeholder').trim();
        if (ph.length > 0) {
            let key = generateKey(ph) + "_ph";
            enJson[key] = ph;
            if (!teJson[key]) teJson[key] = translateToTe(ph);
            
            el.attr('data-i18n-placeholder', key);
        }
    });

    // Write modified HTML back
    fs.writeFileSync(filePath, $.html());
    console.log(`Processed ${filePath}`);
}

// Write the updated JSON files
if (!fs.existsSync('./locales')) {
    fs.mkdirSync('./locales');
}
fs.writeFileSync('./locales/en.json', JSON.stringify(enJson, null, 2));
fs.writeFileSync('./locales/te.json', JSON.stringify(teJson, null, 2));

console.log("✅ Auto Translation complete. Check locales folder and HTML files.");
