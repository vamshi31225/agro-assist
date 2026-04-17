const fs = require('fs');
const path = require('path');

const dir = process.cwd();

// Corrupted text to Emojis
const emojiMap = {
    "🌾": "🌾",
    "🌾": "🌾",
    "🎤": "🎤",
    "🎙️": "🎙️",
    "📩": "📩",
    "🚜": "🚜",
    "🚜": "🚜",
    "🚜": "🚜",
    "🌱": "🌱",
    "🌱": "🌱",
    "📸": "📸",
    "📊": "📊",
    "💰": "💰",
    "⚖️": "⚖️",
    "🎥": "🎥",
    "🤝": "🤝",
    "🌟": "🌟",
    "🌤️": "🌤️",
    "📞": "📞",
    "▶": "▶",
    "📖": "📖",
    "📅": "📅",
    "📤": "📤",
    "⬇️": "⬇️",
    "✅": "✅",
    "❌": "❌",
    "©": "©",
    "🌤": "🌤",
    "मंडी": "मंडी", // Hindi strings
    "ट्रैक्टर": "ट्रैक्टर",
    "बीमारी": "बीमारी",
    "ऋण": "ऋण",
    "मौसम": "मौसम",
    // Sometimes  space is used for   
    " ": " "
};

function restoreText(text) {
    let restored = text;

    for (const [corrupted, fixed] of Object.entries(emojiMap)) {
        // use split join to replace all
        restored = restored.split(corrupted).join(fixed);
    }
    return restored;
}

function fixFile(file) {
    if (!file.endsWith('.html') && !file.endsWith('.js') && !file.endsWith('.css')) return;
    
    let content = fs.readFileSync(file, 'utf8');
    const original = content;

    // Remove Google Translate widgets entirely
    content = content.replace(/<div(?:(?!<div|<\/div>).)*id="google_translate_element"(?:(?!<div|<\/div>).)*><\/div>/gs, '');
    content = content.replace(/<script[^>]*src="[^"]*translate\.google\.com[^"]*"[^>]*><\/script>/gi, '');
    
    // Remove explicit language switchers for the Voice Assistant Feature
    content = content.replace(/<div style="margin-bottom: 15px;">\s*<label for="voiceLang">.*?<\/select>\s*<\/div>/gs, '');

    // Replace JS refs to voiceLang
    content = content.replace(/recognition\.lang\s*=\s*voiceLang\.value;/g, "recognition.lang = 'en-US';");

    // Remove intent matching for local language
    content = content.replace(/\s*\|\|\s*transcript\.includes\('मंडी'\)/g, '');
    content = content.replace(/\s*\|\|\s*transcript\.includes\('bajar'\)/g, '');
    content = content.replace(/\s*\|\|\s*transcript\.includes\('ट्रैक्टर'\)/g, '');
    content = content.replace(/\s*\|\|\s*transcript\.includes\('बीमारी'\)/g, '');
    content = content.replace(/\s*\|\|\s*transcript\.includes\('ऋण'\)/g, '');
    content = content.replace(/\s*\|\|\s*transcript\.includes\('मौसम'\)/g, '');
    content = content.replace(/\s*\|\|\s*transcript\.includes\('mausam'\)/g, '');

    // Now restore encoded text
    content = restoreText(content);

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        console.log('Fixed:', path.basename(file));
    }
}

fs.readdirSync(dir).forEach(f => {
    const fullPath = path.join(dir, f);
    if (fs.statSync(fullPath).isFile()) {
        fixFile(fullPath);
    }
});

console.log('Done restoring emojis and removing multi-language switchers.');
