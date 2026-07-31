(function () {
    var script = document.currentScript;
    var workId = script && script.dataset ? String(script.dataset.workId || '') : '';
    if (!window.MockData || typeof window.MockData.validateRealWorkEntry !== 'function') return;

    var result = window.MockData.validateRealWorkEntry({ workId: workId });
    if (result.allowed) return;

    document.documentElement.style.visibility = 'hidden';
    try {
        alert(result.message || '예약한 날짜와 시간에 입장하기 절차를 완료한 후 출근할 수 있습니다.');
    } catch (e) {}
    window.location.replace('check-in-announce.html');
})();
