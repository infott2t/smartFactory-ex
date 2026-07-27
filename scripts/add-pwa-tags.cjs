/**
 * 모든 HTML 페이지에 PWA 태그(manifest, theme-color, 아이콘, pwa.js)를 주입한다.
 *
 * 이 저장소의 HTML 은 인코딩이 섞여 있으므로(UTF-8 / CP949 등) 'latin1' 로
 * 읽고 쓴다. latin1 은 바이트를 1:1 로 왕복시키기 때문에 주입한 ASCII 태그
 * 이외의 바이트는 원본 그대로 보존된다.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const BLOCK_LINES = [
    '<link rel="manifest" href="/manifest.json">',
    '<meta name="theme-color" content="#09031f">',
    '<link rel="apple-touch-icon" href="/icons/icon-192x192.png">',
    '<meta name="mobile-web-app-capable" content="yes">',
    '<meta name="apple-mobile-web-app-capable" content="yes">',
    '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">',
    '<script src="/js/pwa.js" defer></script>'
];

const results = { injected: [], partial: [], skipped: [], failed: [] };

for (const file of fs.readdirSync(ROOT).filter((f) => f.toLowerCase().endsWith('.html'))) {
    const full = path.join(ROOT, file);
    let text = fs.readFileSync(full, 'latin1');

    const hasManifest = /rel=["']manifest["']/i.test(text);
    const hasSwRegistration = /serviceWorker\s*\.\s*register|['"]serviceWorker['"]\s*in\s*navigator|serviceWorker' in navigator/i.test(text)
        || /js\/pwa\.js/i.test(text);

    if (hasManifest && hasSwRegistration) {
        results.skipped.push(file);
        continue;
    }

    const headClose = text.search(/<\/head\s*>/i);
    if (headClose === -1) {
        results.failed.push(file + ' (</head> 없음)');
        continue;
    }

    // 이미 있는 태그는 다시 넣지 않는다.
    const needed = BLOCK_LINES.filter((line) => {
        if (/rel="manifest"/.test(line)) return !hasManifest;
        if (/name="theme-color"/.test(line)) return !/name=["']theme-color["']/i.test(text);
        if (/apple-touch-icon/.test(line)) return !/apple-touch-icon/i.test(text);
        if (/name="mobile-web-app-capable"/.test(line)) return !/name=["']mobile-web-app-capable["']/i.test(text);
        if (/name="apple-mobile-web-app-capable"/.test(line)) return !/name=["']apple-mobile-web-app-capable["']/i.test(text);
        if (/status-bar-style/.test(line)) return !/apple-mobile-web-app-status-bar-style/i.test(text);
        if (/pwa\.js/.test(line)) return !hasSwRegistration;
        return true;
    });

    if (needed.length === 0) {
        results.skipped.push(file);
        continue;
    }

    // 닫는 </head> 의 들여쓰기를 그대로 따라간다.
    const lineStart = text.lastIndexOf('\n', headClose) + 1;
    const indent = text.slice(lineStart, headClose).match(/^[ \t]*/)[0] || '    ';

    const block = needed.map((line) => indent + line + '\n').join('');
    const updated = text.slice(0, lineStart) + block + text.slice(lineStart);

    fs.writeFileSync(full, updated, 'latin1');

    if (needed.length === BLOCK_LINES.length) results.injected.push(file);
    else results.partial.push(file + ' (' + needed.length + '개 추가)');
}

const show = (label, list) => {
    console.log('\n' + label + ': ' + list.length);
    list.forEach((f) => console.log('  - ' + f));
};

show('전체 주입', results.injected);
show('부분 주입', results.partial);
show('변경 없음', results.skipped);
show('실패', results.failed);
