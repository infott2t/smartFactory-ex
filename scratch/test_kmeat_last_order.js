const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const storeSource = fs.readFileSync(path.join(root, 'js', 'store.js'), 'utf8');
const featureStart = storeSource.indexOf('// K-Meat 라스트오더 기능 테스트 설정');
const featureEnd = storeSource.indexOf('// ==========================================', featureStart);

assert(featureStart >= 0 && featureEnd > featureStart, '라스트오더 공통 설정 코드를 찾을 수 없습니다.');

const storage = new Map();
const context = {
    window: { MockData: {}, dispatchEvent() {} },
    localStorage: {
        getItem(key) {
            return storage.has(key) ? storage.get(key) : null;
        },
        setItem(key, value) {
            storage.set(key, String(value));
        }
    },
    Event: class Event {},
    Date,
    Number,
    Boolean,
    JSON,
    Math
};

vm.runInNewContext(storeSource.slice(featureStart, featureEnd), context);

const mockData = context.window.MockData;
assert.strictEqual(mockData.getKmeatLastOrderSettings().enabled, false, '기본값은 아니오여야 합니다.');

mockData.setKmeatLastOrderSettings({ enabled: true });
assert.strictEqual(mockData.getKmeatLastOrderSettings().enabled, true, '체크 시 예로 저장되어야 합니다.');
assert.strictEqual(mockData.isKmeatLastOrderClosed(new Date(2026, 6, 31, 19, 29)), false, '오후 7시 29분에는 주문 가능해야 합니다.');
assert.strictEqual(mockData.isKmeatLastOrderClosed(new Date(2026, 6, 31, 19, 30)), true, '오후 7시 30분부터 주문이 차단되어야 합니다.');

const testHtml = fs.readFileSync(path.join(root, 'test.html'), 'utf8');
const orderHtml = fs.readFileSync(path.join(root, 'bulgogi_order.html'), 'utf8');
const workDetailJs = fs.readFileSync(path.join(root, 'js', 'work_detail.js'), 'utf8');

assert(testHtml.includes('불고기 구이 라스트오더 기능 활성화'), '통합 테스트 체크리스트가 필요합니다.');
assert(orderHtml.includes('renderLastOrderButton(selectedCount)'), '주문 확인 버튼에 라스트오더 상태가 연결되어야 합니다.');
assert(workDetailJs.includes('updateBulgogiOfflineOrderButtons()'), '상세 화면 주문하기 버튼에 라스트오더 상태가 연결되어야 합니다.');

console.log('K-Meat 라스트오더 테스트 통과');
