(function (window, document) {
    'use strict';

    var modalId = 'shop-order-detail-modal';
    var lastTrigger = null;

    function esc(value) {
        return String(value === undefined || value === null ? '' : value)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    }

    function money(value) {
        return '₩' + (Number(value) || 0).toLocaleString('ko-KR');
    }

    function formatDate(value) {
        var date = new Date(value);
        if (!Number.isFinite(date.getTime())) return esc(value || '주문 시각 확인 중');
        return date.getFullYear() + '.' + String(date.getMonth() + 1).padStart(2, '0') + '.'
            + String(date.getDate()).padStart(2, '0') + ' '
            + String(date.getHours()).padStart(2, '0') + ':' + String(date.getMinutes()).padStart(2, '0');
    }

    function statusInfo(status, kitchenStatus) {
        if (status === 'cancelled' || kitchenStatus === 'cancelled') return { label: '주문 취소', cls: 'cancelled' };
        if (status === 'completed' || kitchenStatus === 'received') return { label: '수령 완료', cls: 'completed' };
        if (kitchenStatus === 'ready') return { label: '준비 완료', cls: 'ready' };
        if (kitchenStatus === 'preparing' || kitchenStatus === 'cooking') return { label: '조리 중', cls: 'preparing' };
        return { label: '조리 대기', cls: 'queued' };
    }

    function childStatusLabel(status) {
        return ({ ordered: '조리 대기', cooking: '조리 중', done: '준비 완료', received: '수령 완료', cancelled: '취소' })[status] || '';
    }

    function getOrders() {
        if (window.MockData && typeof window.MockData.syncBurgerShopRecords === 'function') {
            window.MockData.syncBurgerShopRecords();
        }
        if (window.FactoryStore && typeof window.FactoryStore.getShopOrders === 'function') {
            return window.FactoryStore.getShopOrders() || [];
        }
        if (window.MockData && typeof window.MockData.getShopHistoryRaw === 'function') {
            return window.MockData.getShopHistoryRaw() || [];
        }
        return [];
    }

    function getRecord(recordId) {
        return getOrders().find(function (item) {
            return item && String(item.id) === String(recordId);
        }) || null;
    }

    function detailLines(record) {
        if (String(record.workId || '') === '7' && window.MockData
            && typeof window.MockData.getBurgerOrdersByShopRecord === 'function') {
            var burgerOrders = window.MockData.getBurgerOrdersByShopRecord(record.id);
            if (burgerOrders.length) {
                return burgerOrders.map(function (order) {
                    return {
                        name: (order.menu || '버거') + (order.isSet ? ' 세트' : ' 단품'),
                        option: order.isSet ? '감자튀김 · 음료 ' + (order.drink || '콜라') : '단품',
                        quantity: Math.max(1, Number(order.qty) || 1),
                        unit: '개',
                        price: Number(order.unitPrice) || 0,
                        subtotal: Number(order.total) || 0,
                        status: childStatusLabel(order.status)
                    };
                });
            }
        }

        if (Array.isArray(record.items) && record.items.length) {
            return record.items.map(function (item) {
                var quantity = Math.max(1, Number(item.quantity !== undefined ? item.quantity : item.qty) || 1);
                var price = Number(item.price !== undefined ? item.price : item.unitPrice) || 0;
                return {
                    name: item.name || item.menu || item.productName || '주문 상품',
                    option: item.option || item.options || item.description || '',
                    quantity: quantity,
                    unit: item.unit || '개',
                    price: price,
                    subtotal: Number(item.subtotal) || price * quantity,
                    status: childStatusLabel(item.status)
                };
            });
        }

        var qty = Math.max(1, Number(record.qty) || 1);
        var unitPrice = Number(record.unitPrice) || ((Number(record.price) || 0) / qty);
        return [{
            name: record.productName || '주문 상품', option: record.option || '', quantity: qty,
            unit: record.unit || '개', price: unitPrice, subtotal: Number(record.price) || unitPrice * qty, status: ''
        }];
    }

    function ensureModal() {
        var existing = document.getElementById(modalId);
        if (existing) return existing;

        var style = document.createElement('style');
        style.textContent = `
            .shop-order-detail-trigger{flex:1;min-height:42px;padding:10px 13px;border-radius:10px;border:1px solid rgba(253,132,237,.42);background:rgba(253,132,237,.1);color:#f0abfc;font-family:inherit;font-size:13px;font-weight:700;cursor:pointer;white-space:nowrap}
            .shop-order-detail-trigger:hover{background:rgba(253,132,237,.18);color:#fff}
            .shop-order-detail-trigger.compact{flex:0 0 auto;min-height:28px;padding:4px 9px;border-radius:8px;font-size:10px;margin-left:7px;vertical-align:middle}
            .shop-detail-backdrop{display:none;position:fixed;inset:0;z-index:10000;background:rgba(3,5,15,.78);backdrop-filter:blur(5px);padding:18px;align-items:center;justify-content:center}
            .shop-detail-backdrop.show{display:flex}
            .shop-detail-dialog{width:min(460px,100%);max-height:min(760px,90vh);overflow:auto;background:#161822;color:#f8fafc;border:1px solid rgba(255,255,255,.13);border-radius:20px;box-shadow:0 24px 70px rgba(0,0,0,.5)}
            .shop-detail-head{position:sticky;top:0;z-index:2;display:flex;align-items:center;justify-content:space-between;padding:18px 18px 14px;background:rgba(22,24,34,.97);border-bottom:1px solid rgba(255,255,255,.09)}
            .shop-detail-head h2{margin:0;font-size:18px;font-weight:800;color:#fff}
            .shop-detail-close{width:34px;height:34px;border:0;border-radius:9px;background:rgba(255,255,255,.07);color:#cbd5e1;font-size:23px;line-height:1;cursor:pointer}
            .shop-detail-body{padding:16px 18px 20px}
            .shop-detail-summary{display:grid;grid-template-columns:1fr 1fr;gap:9px;padding:13px;border-radius:14px;background:rgba(99,102,241,.09);border:1px solid rgba(129,140,248,.18)}
            .shop-detail-meta{min-width:0}.shop-detail-meta span{display:block;font-size:10px;color:#94a3b8;margin-bottom:4px}.shop-detail-meta b{display:block;overflow-wrap:anywhere;font-size:12px;color:#e2e8f0}
            .shop-detail-status{display:inline-flex!important;width:max-content;padding:3px 8px;border-radius:999px;font-size:10px!important;font-weight:800}
            .shop-detail-status.queued{color:#fbbf24;background:rgba(245,158,11,.14)}.shop-detail-status.preparing{color:#a5b4fc;background:rgba(99,102,241,.16)}.shop-detail-status.ready{color:#34d399;background:rgba(16,185,129,.14)}.shop-detail-status.completed{color:#e2e8f0;background:rgba(148,163,184,.15)}.shop-detail-status.cancelled{color:#94a3b8;background:rgba(148,163,184,.12)}
            .shop-detail-title{margin:18px 0 9px;font-size:13px;font-weight:800;color:#fff}
            .shop-detail-line{padding:13px 0;border-bottom:1px solid rgba(255,255,255,.08)}.shop-detail-line:last-child{border-bottom:0}
            .shop-detail-line-top,.shop-detail-line-bottom{display:flex;justify-content:space-between;gap:12px}.shop-detail-line-name{font-size:14px;font-weight:800;color:#fff}.shop-detail-line-status{font-size:10px;color:#a5b4fc;white-space:nowrap}.shop-detail-line-option{margin-top:4px;font-size:11px;color:#94a3b8}.shop-detail-line-bottom{margin-top:8px;font-size:12px;color:#cbd5e1}.shop-detail-line-bottom b{color:#fff}
            .shop-detail-total{display:flex;justify-content:space-between;align-items:center;margin-top:12px;padding:14px;border-radius:12px;background:rgba(253,132,237,.09);font-size:13px}.shop-detail-total b{font-size:18px;color:#fff}
            .shop-detail-done{width:100%;margin-top:14px;min-height:46px;border:0;border-radius:12px;background:linear-gradient(135deg,#fd84ed,#818cf8);color:#09031f;font:800 14px inherit;cursor:pointer}
            @media(max-width:380px){.shop-detail-summary{grid-template-columns:1fr}.shop-detail-dialog{max-height:92vh}}
        `;
        document.head.appendChild(style);

        var modal = document.createElement('div');
        modal.id = modalId;
        modal.className = 'shop-detail-backdrop';
        modal.setAttribute('aria-hidden', 'true');
        modal.innerHTML = '<section class="shop-detail-dialog" role="dialog" aria-modal="true" aria-labelledby="shop-detail-title">'
            + '<header class="shop-detail-head"><h2 id="shop-detail-title">주문 전체 내역</h2>'
            + '<button type="button" class="shop-detail-close" aria-label="닫기">&times;</button></header>'
            + '<div class="shop-detail-body" id="shop-detail-body"></div></section>';
        modal.addEventListener('click', function (event) {
            if (event.target === modal || event.target.closest('.shop-detail-close')) close();
        });
        document.body.appendChild(modal);
        return modal;
    }

    function render(record) {
        var state = statusInfo(record.status, record.kitchenStatus);
        var lines = detailLines(record);
        var totalQty = lines.reduce(function (sum, line) { return sum + line.quantity; }, 0);
        var total = Number(record.price) || lines.reduce(function (sum, line) { return sum + line.subtotal; }, 0);
        var orderedAt = record.orderedAt || record.createdAt || record.dateStr
            || [record.orderDate, record.orderTime].filter(Boolean).join(' ');
        var payment = record.payMethod || (record.paymentMethod === 'online_settlement' ? '온라인 정산 금액 결제'
            : record.paymentMethod === 'offline' ? '현장 결제' : '결제 정보 확인 중');

        var lineHtml = lines.map(function (line) {
            return '<div class="shop-detail-line">'
                + '<div class="shop-detail-line-top"><div class="shop-detail-line-name">' + esc(line.name) + '</div>'
                + (line.status ? '<span class="shop-detail-line-status">' + esc(line.status) + '</span>' : '') + '</div>'
                + (line.option ? '<div class="shop-detail-line-option">' + esc(line.option) + '</div>' : '')
                + '<div class="shop-detail-line-bottom"><span>' + money(line.price) + ' × ' + line.quantity + esc(line.unit) + '</span>'
                + '<b>' + money(line.subtotal) + '</b></div></div>';
        }).join('');

        return '<div class="shop-detail-summary">'
            + '<div class="shop-detail-meta"><span>주문번호</span><b>#' + esc(record.orderNo || record.id || '-') + '</b></div>'
            + '<div class="shop-detail-meta"><span>현재 상태</span><b><span class="shop-detail-status ' + state.cls + '">' + state.label + '</span></b></div>'
            + '<div class="shop-detail-meta"><span>주문 일시</span><b>' + formatDate(orderedAt) + '</b></div>'
            + '<div class="shop-detail-meta"><span>결제 방법</span><b>' + esc(payment) + '</b></div>'
            + (record.tableId ? '<div class="shop-detail-meta"><span>수령 장소</span><b>' + esc(record.tableId) + '</b></div>' : '')
            + '<div class="shop-detail-meta"><span>주문 수량</span><b>총 ' + totalQty + '개</b></div></div>'
            + '<div class="shop-detail-title">주문 상품 ' + lines.length + '종</div>' + lineHtml
            + '<div class="shop-detail-total"><span>총 결제 금액</span><b>' + money(total) + '</b></div>'
            + '<button type="button" class="shop-detail-done">확인</button>';
    }

    function open(recordId, trigger) {
        var record = getRecord(recordId);
        if (!record) {
            window.alert('주문 상세 정보를 찾을 수 없습니다.');
            return;
        }
        lastTrigger = trigger || document.activeElement;
        var modal = ensureModal();
        modal.querySelector('#shop-detail-body').innerHTML = render(record);
        modal.querySelector('.shop-detail-done').onclick = close;
        modal.classList.add('show');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        modal.querySelector('.shop-detail-close').focus();
    }

    function close() {
        var modal = document.getElementById(modalId);
        if (!modal) return;
        modal.classList.remove('show');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        if (lastTrigger && typeof lastTrigger.focus === 'function') lastTrigger.focus();
    }

    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') close();
    });

    window.ShopOrderDetail = { open: open, close: close };
    window.openShopOrderDetail = function (recordId, trigger) { open(recordId, trigger); };
    window.closeShopOrderDetail = close;

    // 버튼이 그려질 때부터 디자인이 적용되도록 클릭 전에 스타일과 모달을 준비한다.
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', ensureModal, { once: true });
    } else {
        ensureModal();
    }
})(window, document);
