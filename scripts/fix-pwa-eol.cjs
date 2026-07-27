/**
 * 주입한 PWA 태그 줄의 줄바꿈을 원본 파일의 지배적인 줄바꿈에 맞춘다.
 * (CRLF 파일에 LF 줄을 넣어 혼용이 생긴 것을 교정)
 * 내가 주입한 파일(= /js/pwa.js 를 포함한 파일)만 대상으로 한다.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const INJECTED = [
    '<link rel="manifest" href="/manifest.json">',
    '<meta name="theme-color" content="#09031f">',
    '<link rel="apple-touch-icon" href="/icons/icon-192x192.png">',
    '<meta name="mobile-web-app-capable" content="yes">',
    '<meta name="apple-mobile-web-app-capable" content="yes">',
    '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">',
    '<script src="/js/pwa.js" defer></script>'
];

let changed = 0;

for (const f of fs.readdirSync(ROOT).filter((x) => x.toLowerCase().endsWith('.html'))) {
    const full = path.join(ROOT, f);
    let text = fs.readFileSync(full, 'latin1');

    if (!text.includes('<script src="/js/pwa.js" defer></script>')) continue;

    const crlf = (text.match(/\r\n/g) || []).length;
    const bareLf = (text.match(/(^|[^\r])\n/g) || []).length;
    if (crlf === 0 || crlf < bareLf) continue; // LF 파일이면 그대로 둔다

    let hits = 0;
    for (const line of INJECTED) {
        const needle = line + '\n';
        let idx = text.indexOf(needle);
        while (idx !== -1) {
            if (text[idx + line.length - 1] !== '\r') {
                text = text.slice(0, idx + line.length) + '\r\n' + text.slice(idx + needle.length);
                hits++;
            }
            idx = text.indexOf(needle, idx + line.length + 2);
        }
    }

    if (hits > 0) {
        fs.writeFileSync(full, text, 'latin1');
        changed++;
        console.log('교정: ' + f + ' (' + hits + '줄)');
    }
}

console.log('\n총 ' + changed + '개 파일 교정');
