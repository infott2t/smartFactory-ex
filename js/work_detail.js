document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const workId = urlParams.get('id') || '1';

    if (window.MockData && window.MockData.workDetailJSON) {
        try {
            const detailMap = JSON.parse(window.MockData.workDetailJSON);
            const data = detailMap[workId];
            if (!data) return;

            // 1. Header
            const titleEl = document.querySelector('.menu-bar span.cursor-pointer');
            if(titleEl) titleEl.textContent = data.title;
            
            const iconEl = document.querySelector('.menu-bar img');
            if(iconEl) iconEl.src = data.iconUrl;

            const valEl = document.querySelector('.text0 span');
            if(valEl) valEl.textContent = data.value;

            const ratioEl = document.querySelector('.text0 span.ratio');
            if(ratioEl) ratioEl.textContent = data.change;

            // 2. Categories
            const catContainers = document.querySelectorAll('.categories');
            if(catContainers.length > 0) {
                const catContainer = catContainers[0].querySelector('div:nth-child(2)');
                if(catContainer && data.categories) {
                    catContainer.innerHTML = data.categories.map(c => `<button>${c}</button>`).join('');
                }
            }

            // 3. Work time
            const timeContainer = document.querySelector('.btn-worktime');
            if(timeContainer && data.workTime) {
                timeContainer.innerHTML = `<i class="bi bi-clock"></i> ${data.workTime}`;
            }

            // 4. Product slogan (Update all instances)
            const sloganContainers = document.querySelectorAll('.stats-card.alternate2 .stats-card-header');
            if(data.productSlogan) {
                sloganContainers.forEach(container => {
                    if (container.innerHTML.includes('bi-gift')) {
                        container.innerHTML = `<i class="bi bi-gift" style="color: #7b5cf5;"></i> ${data.productSlogan}`;
                    }
                });
            }

            // 5. Products (Update all product list containers)
            const productContainers = [document.getElementById('kimp-product-list-chart'), document.getElementById('kimp-product-list-stats')];
            if(data.products) {
                const productHtml = data.products.map((p, i) => {
                    const stockColor = p.status.includes('남음') ? '#ff7675' : '#7b92ff';
                    return `
                        <a class="box" href="kimp_detail.html?product=p${i}" style="width: 220px; min-width: 220px; flex-shrink: 0; background: #1a1a33; border: 1px solid #2d2d5e; border-radius: 14px; padding: 12px; display: flex; flex-direction: column; justify-content: space-between; text-decoration: none; color: #fff; transition: transform 0.2s;">
                            <div class="up" style="display: flex; align-items: center; margin-bottom: 8px;">
                                <img src="${p.imgUrl}" style="width: 80px; height: 80px; border-radius: 10px; object-fit: cover; flex-shrink: 0;" alt="${p.name}">
                                <div class="texts" style="display: flex; flex-direction: column; position: static; margin-left: 12px; justify-content: center; height: 80px; flex-grow: 1;">
                                    <span style="position: static; white-space: normal; font-size: 13px; font-weight: 700; color: #fff; line-height: 1.4; word-break: keep-all; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis;">${p.name}</span>
                                    <span style="position: static; font-size: 11px; color: #999; margin-top: 4px;">${p.brand}</span>
                                </div>
                            </div>
                            <div class="down" style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 8px; margin-top: 4px;">
                                <div style="font-size: 14px; font-weight: 700; color: #a29bfe;">${p.price}</div>
                                <div style="font-size: 11px; color: ${stockColor}; font-weight: 600; display: flex; align-items: center; gap: 2px;">
                                    <span>${p.status}</span>
                                </div>
                            </div>
                        </a>
                    `;
                }).join('');
                
                productContainers.forEach(container => {
                    if (container) container.innerHTML = productHtml;
                });
            }

            // 6. Workflows
            const taskList = document.querySelector('.task-list');
            if(taskList && data.workflows) {
                taskList.innerHTML = data.workflows.map(w => `
                    <div class="task-item">
                        <span class="task-label">Task ${w.step}.</span>
                        <span>${w.desc}</span>
                    </div>
                `).join('');
            }

            // 7. Stats
            if (data.stats) {
                try {
                    const worksData = window.MockData.worksJSON ? JSON.parse(window.MockData.worksJSON) : [];
                    const currentWork = worksData.find(w => String(w.workId) === String(workId));
                    if (currentWork && currentWork.brandName) {
                        const tagOrange = document.querySelector('.tag-orange');
                        if (tagOrange) tagOrange.textContent = currentWork.brandName;
                    }
                } catch(e) {}
                
                const addrEl = document.getElementById('address-text');
                if(addrEl) addrEl.textContent = data.stats.address;
                
                const startEl = document.getElementById('job-start-date');
                if(startEl) startEl.textContent = data.stats.startDate;
                
                const statsStongs = document.querySelectorAll('.stats-row strong');
                if(statsStongs.length > 3) {
                    statsStongs[2].textContent = data.stats.workingHours;
                    statsStongs[3].textContent = data.stats.participants + '명';
                }
                
                const ratingEl = document.querySelector('.rating-stars');
                if(ratingEl) {
                    ratingEl.innerHTML = `<i class="bi bi-star-fill"></i> ${data.stats.rating}`;
                }
            }

            // 8. Guidelines
            const guideList = document.querySelector('.guide-list');
            if (guideList && data.guidelines) {
                guideList.innerHTML = data.guidelines.map(g => `
                    <li class="guide-item ${g.bannerClass || ''}">
                        <span class="guide-icon ${g.iconColor || ''}"><i class="bi ${g.icon}"></i></span>
                        <span ${g.textColor ? `class="${g.textColor}"` : ''} style="${g.isBanner ? '' : 'white-space: pre-line;'}">${g.text}</span>
                    </li>
                `).join('');
            }

            // 9. Favorite (Star) Logic
            const starIcon = document.getElementById('work-stars');
            if (starIcon) {
                let favorites = JSON.parse(localStorage.getItem('kimp_favorites') || '[]');
                if (favorites.includes(workId)) {
                    starIcon.classList.remove('bi-star');
                    starIcon.classList.add('bi-star-fill');
                    starIcon.style.color = '#ffd700'; // Add gold color for filled star
                }

                function showToast(message, iconClass) {
                    $('.toast-message').remove();
                    var toastHtml = '<div class="toast-message"><i class="bi ' + iconClass + '"></i><span>' + message + '</span></div>';
                    $('body').append(toastHtml);
                    setTimeout(function () { $('.toast-message').addClass('show'); }, 10);
                    setTimeout(function () {
                        $('.toast-message').removeClass('show');
                        setTimeout(function () { $('.toast-message').remove(); }, 300);
                    }, 2000);
                }

                starIcon.addEventListener('click', () => {
                    favorites = JSON.parse(localStorage.getItem('kimp_favorites') || '[]');
                    const idx = favorites.indexOf(workId);
                    if (idx > -1) {
                        favorites.splice(idx, 1);
                        starIcon.classList.remove('bi-star-fill');
                        starIcon.classList.add('bi-star');
                        starIcon.style.color = '';
                        showToast('즐겨찾기에서 해제되었습니다.', 'bi-star');
                    } else {
                        favorites.push(workId);
                        starIcon.classList.remove('bi-star');
                        starIcon.classList.add('bi-star-fill');
                        starIcon.style.color = '#ffd700';
                        showToast('즐겨찾기에 추가되었습니다!', 'bi-star-fill');
                    }
                    localStorage.setItem('kimp_favorites', JSON.stringify(favorites));
                });
            }

        } catch (e) {
            console.error('Failed to parse workDetailJSON', e);
        }
    }
});
