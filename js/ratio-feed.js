/**
 * 시급 가중치 실시간 피드 (공용 모듈).
 *
 * 값은 "현재 시각"과 "일(work) 번호"만으로 결정된다.
 *  - 새로고침해도 같은 시각이면 같은 값 → 페이지끼리 숫자가 어긋나지 않는다.
 *  - 시간이 흐르면 값이 흐른다.
 *  - 일마다 시드가 달라 서로 다른 곡선을 그린다. (예: 6 = 불고기구이)
 *  - 변동 범위는 항상 MIN ~ MAX.
 *
 * 쓰는 곳
 *  - main.html / explore.html : 목록의 일별 가중치 (10초 단위)
 *  - work_detail.html         : 차트 (1초 ~ 1년 단위)
 */
(function (global) {
    'use strict';

    var MIN = 1.1;
    var MAX = 1.5;
    var DAY_MS = 86400000;

    // 시간대별 버킷 크기와 시드 오프셋.
    // 시드 오프셋이 다르면 같은 일이라도 시간대별로 다른 파형이 나온다.
    var STEPS = {
        '1s': { stepMs: 1000, seed: 0 },
        '10s': { stepMs: 10000, seed: 5 },
        '1m': { stepMs: 60000, seed: 11 },
        '1h': { stepMs: 3600000, seed: 23 },
        '1d': { stepMs: DAY_MS, seed: 37 },
        '1w': { stepMs: 7 * DAY_MS, seed: 53 },
        '1mo': { stepMs: 30 * DAY_MS, seed: 71 },
        '1y': { stepMs: 365 * DAY_MS, seed: 97 }
    };

    // 목록 화면(main/explore)의 갱신 단위
    var LIST_KEY = '10s';

    // 등락 색상 (explore.css 의 status-up / status-down 과 동일한 값)
    var COLOR_UP = '#00b894';
    var COLOR_DOWN = '#ff6b6b';

    // 가중치 숫자 자체는 등락과 무관하게 항상 흰색으로 보여준다.
    // (등락 방향은 화살표와 등락률 텍스트에서만 색으로 표현)
    var COLOR_VALUE = '#ffffff';

    // 정수 해시 → 0~1 (결정론적 난수 대용)
    function hash01(n) {
        var x = n | 0;
        x = (x ^ 61) ^ (x >>> 16);
        x = x + (x << 3);
        x = x ^ (x >>> 4);
        x = Math.imul(x, 0x27d4eb2d);
        x = x ^ (x >>> 15);
        return (x >>> 0) / 4294967295;
    }

    /*
     * 특정 시간 버킷의 가중치.
     * 주기가 다른 사인파 3개로 추세를 만들고 해시 노이즈로 잔떨림을 준다.
     * 결과는 항상 MIN ~ MAX 안이며 소수 둘째 자리로 정리된다.
     */
    function ratioAt(bucket, seed) {
        var n = bucket + seed;
        var wave =
            Math.sin(n / 7) * 0.5 +
            Math.sin(n / 3.1 + seed) * 0.3 +
            Math.sin(n / 17.3) * 0.2;
        var noise = (hash01(n) - 0.5) * 0.5;

        // wave+noise 는 대략 -1.25 ~ 1.25 → 0~1 로 정규화
        var unit = (wave + noise + 1.25) / 2.5;
        unit = Math.min(1, Math.max(0, unit));

        var value = MIN + unit * (MAX - MIN);
        return Math.min(MAX, Math.max(MIN, Math.round(value * 100) / 100));
    }

    /** 일(work)별 기본 시드 */
    function workSeed(workId) {
        return (parseInt(workId, 10) || 1) * 1013;
    }

    /** 일 + 시간대 조합의 최종 시드 */
    function seedFor(workId, intervalKey) {
        var step = STEPS[intervalKey] || STEPS['1s'];
        return workSeed(workId) + step.seed;
    }

    /** 주어진 시각(기본: 지금)에 해당 시간대 버킷의 가중치 */
    function valueAt(workId, intervalKey, atMs) {
        var step = STEPS[intervalKey] || STEPS['1s'];
        var t = (atMs === undefined || atMs === null) ? Date.now() : atMs;
        var bucket = Math.floor(t / step.stepMs);
        return ratioAt(bucket, seedFor(workId, intervalKey));
    }

    /** 초 단위 실시간 값 (상세 페이지 헤더용) */
    function liveValue(workId, atMs) {
        return valueAt(workId, '1s', atMs);
    }

    /** 목록 화면 값 (10초 단위). 같은 10초 구간에서는 값이 고정된다. */
    function listValue(workId, atMs) {
        return valueAt(workId, LIST_KEY, atMs);
    }

    /** 다음 버킷 경계까지 남은 ms. 경계에 맞춰 갱신하려고 쓴다. */
    function msUntilNext(stepMs, atMs) {
        var t = (atMs === undefined || atMs === null) ? Date.now() : atMs;
        return stepMs - (t % stepMs);
    }

    /* ------------------------------------------------------------------
     * 목록 화면 DOM 연동
     *
     * 마크업 규칙 (일별로 data-work-id 를 붙인다)
     *   .work-ratio        → 가중치 숫자
     *   .work-ratio-arrow  → 등락 화살표 아이콘
     *   .work-ratio-change → 등락률 텍스트 (선택)
     *
     * data-ratio-digits 로 소수 자릿수를 지정할 수 있다 (기본 2).
     * ------------------------------------------------------------------ */
    function refreshRatioElements(root) {
        var scope = root || document;
        var stepMs = STEPS[LIST_KEY].stepMs;
        var nowMs = Date.now();

        var nodes = scope.querySelectorAll('.work-ratio[data-work-id]');
        Array.prototype.forEach.call(nodes, function (el) {
            var workId = el.getAttribute('data-work-id');

            var current = listValue(workId, nowMs);
            var previous = listValue(workId, nowMs - stepMs); // 직전 구간
            var diff = current - previous;
            var up = diff >= 0;

            var digitsAttr = el.getAttribute('data-ratio-digits');
            var digits = digitsAttr === null ? 2 : parseInt(digitsAttr, 10);
            el.textContent = current.toFixed(isNaN(digits) ? 2 : digits);
            el.style.color = COLOR_VALUE;

            var selector = '[data-work-id="' + workId + '"]';

            var arrows = scope.querySelectorAll('.work-ratio-arrow' + selector);
            Array.prototype.forEach.call(arrows, function (arrow) {
                arrow.classList.toggle('bi-caret-up-fill', up);
                arrow.classList.toggle('bi-caret-down-fill', !up);
                arrow.classList.toggle('status-up', up);
                arrow.classList.toggle('status-down', !up);
                arrow.style.color = up ? COLOR_UP : COLOR_DOWN;
            });

            var changes = scope.querySelectorAll('.work-ratio-change' + selector);
            Array.prototype.forEach.call(changes, function (node) {
                var pct = previous ? (diff / previous) * 100 : 0;
                node.textContent = (pct >= 0 ? '+' : '') + pct.toFixed(2) + '%';
                node.classList.toggle('status-up', up);
                node.classList.toggle('status-down', !up);
                node.style.color = up ? COLOR_UP : COLOR_DOWN;
            });
        });
    }

    var listTimer = null;

    /**
     * 목록 화면의 가중치를 10초 버킷 경계에 맞춰 계속 갱신한다.
     * 단순 10초 간격이 아니라 경계에 정렬하므로, 페이지를 언제 열어도
     * 모든 화면이 같은 순간에 같은 값으로 바뀐다.
     */
    function startListFeed() {
        refreshRatioElements();

        if (listTimer) clearTimeout(listTimer);

        var stepMs = STEPS[LIST_KEY].stepMs;

        function tick() {
            refreshRatioElements();
            listTimer = setTimeout(tick, msUntilNext(stepMs));
        }
        listTimer = setTimeout(tick, msUntilNext(stepMs));

        if (!startListFeed._visBound) {
            document.addEventListener('visibilitychange', function () {
                if (!document.hidden) refreshRatioElements();
            });
            startListFeed._visBound = true;
        }
    }

    global.RatioFeed = {
        MIN: MIN,
        MAX: MAX,
        STEPS: STEPS,
        LIST_KEY: LIST_KEY,
        hash01: hash01,
        ratioAt: ratioAt,
        workSeed: workSeed,
        seedFor: seedFor,
        valueAt: valueAt,
        liveValue: liveValue,
        listValue: listValue,
        msUntilNext: msUntilNext,
        refreshRatioElements: refreshRatioElements,
        startListFeed: startListFeed
    };
})(window);
