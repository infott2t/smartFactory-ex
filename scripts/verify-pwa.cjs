/** PWA 설치 요건 및 주입 결과 검증. */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
let problems = 0;
const fail = (msg) => { problems++; console.log('  [실패] ' + msg); };
const ok = (msg) => console.log('  [정상] ' + msg);

console.log('\n== manifest.json ==');
let manifest;
try {
    manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'manifest.json'), 'utf8'));
    ok('JSON 파싱 성공');
} catch (e) {
    fail('JSON 파싱 실패: ' + e.message);
}

if (manifest) {
    for (const key of ['name', 'short_name', 'start_url', 'display', 'icons']) {
        if (manifest[key]) ok(key + ' = ' + JSON.stringify(manifest[key]).slice(0, 60));
        else fail(key + ' 누락');
    }
    if (!['standalone', 'fullscreen', 'minimal-ui'].includes(manifest.display)) {
        fail('display 가 설치 가능한 값이 아님: ' + manifest.display);
    }

    // 설치 요건: 192px 및 512px 아이콘, 그리고 purpose 에 any 를 가진 아이콘 1개 이상
    const sizes = (manifest.icons || []).map((i) => i.sizes);
    for (const need of ['192x192', '512x512']) {
        if (sizes.includes(need)) ok('아이콘 ' + need + ' 선언됨');
        else fail('아이콘 ' + need + ' 없음');
    }
    const hasAny = (manifest.icons || []).some((i) => !i.purpose || i.purpose.split(/\s+/).includes('any'));
    hasAny ? ok('purpose="any" 아이콘 있음') : fail('purpose="any" 아이콘 없음 (설치 차단 원인)');

    // 아이콘 파일 실제 존재 및 크기 확인
    for (const icon of manifest.icons || []) {
        const p = path.join(ROOT, icon.src.replace(/^\//, ''));
        if (!fs.existsSync(p)) { fail('아이콘 파일 없음: ' + icon.src); continue; }
        const b = fs.readFileSync(p);
        const w = b.readUInt32BE(16), h = b.readUInt32BE(20);
        if (icon.sizes === w + 'x' + h) ok(icon.src + ' 실제 크기 ' + w + 'x' + h + ' (purpose=' + icon.purpose + ')');
        else fail(icon.src + ' 선언 ' + icon.sizes + ' vs 실제 ' + w + 'x' + h);
    }

    // start_url 이 scope 안에 있고 실제 파일이 존재해야 한다
    const startFile = path.join(ROOT, manifest.start_url.replace(/^\//, '').split('?')[0]);
    fs.existsSync(startFile) ? ok('start_url 파일 존재: ' + manifest.start_url)
        : fail('start_url 파일 없음: ' + manifest.start_url);
    manifest.start_url.startsWith(manifest.scope || '/') ? ok('start_url 이 scope 내부')
        : fail('start_url 이 scope 밖');
}

console.log('\n== sw.js ==');
const sw = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
/addEventListener\(\s*['"]fetch['"]/.test(sw)
    ? ok('fetch 핸들러 존재 (설치 필수 요건)')
    : fail('fetch 핸들러 없음 — 브라우저가 설치 버튼을 숨김');
/addEventListener\(\s*['"]install['"]/.test(sw) ? ok('install 핸들러 존재') : fail('install 핸들러 없음');
// 주석은 제외하고 실제 코드에서의 사용만 검사한다
const swCode = sw.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
/cache\.addAll/.test(swCode)
    ? fail('cache.addAll 사용 — 자산 1개 404 시 설치 실패')
    : ok('사전 캐시가 개별 처리되어 404 에 내구성 있음');

// 사전 캐시 목록의 파일들이 실제로 있는지 확인
const listMatch = sw.match(/CORE_ASSETS\s*=\s*\[([^\]]*)\]/);
if (listMatch) {
    const urls = [...listMatch[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
    for (const u of urls) {
        if (u === '/') continue;
        const p = path.join(ROOT, u.replace(/^\//, ''));
        if (!fs.existsSync(p)) fail('사전 캐시 대상 파일 없음: ' + u);
    }
    ok('사전 캐시 대상 ' + urls.length + '개 확인');
}

console.log('\n== HTML 페이지 ==');
const files = fs.readdirSync(ROOT).filter((f) => f.toLowerCase().endsWith('.html'));
const missing = [];
const mixedEol = [];
const badUtf8 = [];

for (const f of files) {
    const buf = fs.readFileSync(path.join(ROOT, f));
    const utf16 = buf[0] === 0xff && buf[1] === 0xfe || buf[0] === 0xfe && buf[1] === 0xff
        || (buf.length > 1 && buf[1] === 0x00);
    const text = utf16 ? buf.toString('utf16le') : buf.toString('latin1');

    const hasManifest = /rel=["']manifest["']/i.test(text);
    const hasSw = /js\/pwa\.js/i.test(text) || /serviceWorker/i.test(text);
    if (!hasManifest || !hasSw) missing.push(f + ' (manifest=' + hasManifest + ', sw=' + hasSw + ')');

    // 줄바꿈 혼용 확인 (주입한 줄이 원본과 다른 줄바꿈을 쓰지 않았는지)
    const crlf = (text.match(/\r\n/g) || []).length;
    const bareLf = (text.match(/(^|[^\r])\n/g) || []).length;
    if (crlf > 0 && bareLf > 0) mixedEol.push(f + ' (CRLF=' + crlf + ', LF=' + bareLf + ')');

    // UTF-8 무결성: 되돌렸을 때 동일해야 한다 (UTF-8 파일에 한함)
    if (!utf16) {
        const asUtf8 = buf.toString('utf8');
        if (!asUtf8.includes('\uFFFD')) {
            if (Buffer.from(asUtf8, 'utf8').equals(buf)) { /* 정상 */ }
            else badUtf8.push(f);
        }
    }
}

missing.length === 0
    ? ok('HTML ' + files.length + '개 모두 manifest + 서비스워커 등록 보유')
    : (console.log('  누락 페이지:'), missing.forEach((m) => fail(m)));

mixedEol.length === 0 ? ok('줄바꿈 혼용 없음')
    : (console.log('  줄바꿈 혼용:'), mixedEol.forEach((m) => console.log('    - ' + m)));

badUtf8.length === 0 ? ok('UTF-8 인코딩 손상 없음')
    : (console.log('  인코딩 이상:'), badUtf8.forEach((m) => fail(m)));

console.log('\n결과: ' + (problems === 0 ? '문제 없음' : problems + '건 문제'));
process.exit(problems === 0 ? 0 : 1);
