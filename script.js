"use strict";
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.createElement('div');
    modal.className = 'card-modal';
    modal.hidden = true;
    modal.innerHTML = `
        <div class="card-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="card-modal-title">
            <button type="button" class="card-modal-close" aria-label="Close">&times;</button>
            <div class="card-modal-header">
                <img class="company-logo" alt="" hidden />
                <div>
                    <h3 id="card-modal-title"></h3>
                    <h4></h4>
                    <span></span>
                </div>
            </div>
            <div class="card-modal-body"></div>
        </div>
    `;
    document.body.appendChild(modal);
    const dialog = modal.querySelector('.card-modal-dialog');
    const closeBtn = modal.querySelector('.card-modal-close');
    let lastFocus = null;

    const closeModal = () => {
        modal.hidden = true;
        document.body.classList.remove('modal-open');
        if (lastFocus) lastFocus.focus();
    };
    const openModal = (item) => {
        lastFocus = document.activeElement;
        const logo = modal.querySelector('.company-logo');
        logo.hidden = !item.logo;
        if (item.logo) {
            logo.src = item.logo;
            logo.alt = `${item.company} logo`;
        }
        const title = modal.querySelector('h3');
        title.textContent = '';
        if (item.link) {
            const a = document.createElement('a');
            a.href = item.link;
            a.target = '_blank';
            a.rel = 'noopener';
            a.textContent = item.title;
            title.appendChild(a);
        } else {
            title.textContent = item.title;
        }
        modal.querySelector('h4').textContent = item.company;
        modal.querySelector('.card-modal-header span').textContent = item.period;
        // moreInfo may contain HTML; falls back to the short description
        modal.querySelector('.card-modal-body').innerHTML = item.moreInfo || item.description || '';
        modal.hidden = false;
        document.body.classList.add('modal-open');
        closeBtn.focus();
    };
    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !modal.hidden) closeModal();
    });

    const renderTimeline =(timelineId, items) => {
        const timeline = document.getElementById(timelineId);
        if (!timeline) return;
        items.forEach((item) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'experience-card-wrapper';

            const gearImg = document.createElement('img');
            gearImg.className = 'card-gear';
            gearImg.src = 'gear.png';
            gearImg.alt = 'Gear';
            gearImg.setAttribute('aria-hidden', 'true');
            wrapper.appendChild(gearImg);

            const gearImgRight = document.createElement('img');
            gearImgRight.className = 'card-gear-right';
            gearImgRight.src = 'gear.png';
            gearImgRight.alt = 'Gear';
            gearImgRight.setAttribute('aria-hidden', 'true');
            wrapper.appendChild(gearImgRight);

            const card = document.createElement('div');
            card.className = 'experience-card';
            card.innerHTML = `
                <div class="card-content-row">
                    ${item.logo ? `<img class="company-logo" src="${item.logo}" alt="${item.company} logo" />` : ''}
                    <div class="card-details">
                        <h3>${item.link ? `<a href="${item.link}" target="_blank" rel="noopener">${item.title}</a>` : item.title}</h3>
                        <h4>${item.company}</h4>
                        <span>${item.period}</span>
                        <p>${item.description}</p>
                    </div>
                </div>
                ${item.moreInfo ? '<button type="button" class="more-info-btn">More info</button>' : ''}
            `;
            if (item.moreInfo) {
                card.style.cursor = 'pointer';
                card.addEventListener('click', (e) => {
                    if (e.target.closest('a')) return;
                    openModal(item);
                });
            }
            wrapper.appendChild(card);
            timeline.appendChild(wrapper);
        });
    };

    renderTimeline('timeline', window.experiences || []);
    renderTimeline('education-timeline', window.education || []);
    renderTimeline('talks-timeline', window.talks || []);

    const hero = document.querySelector('.hero');
    if (hero && !document.querySelector('.parallax-overlay')) {
        const overlay = document.createElement('div');
        overlay.className = 'parallax-overlay';
        hero.appendChild(overlay);
    }
    const wrappers = document.querySelectorAll('.experience-card-wrapper');
    const animateCards = () => {
        const windowHeight = window.innerHeight;
        wrappers.forEach(wrapper => {
            const card = wrapper.querySelector('.experience-card');
            const gear = wrapper.querySelector('.card-gear');
            const gearRight = wrapper.querySelector('.card-gear-right');
            if (!card || !gear || !gearRight) return;
            const rect = card.getBoundingClientRect();
            const cardHeight = rect.height || 160;
            const enter = windowHeight;
            const exit = -cardHeight;
            let progress = (enter - rect.top) / (enter - exit);
            progress = Math.max(0, Math.min(1, progress));
            let cardOffset;
            if (progress < 0.5) {
                cardOffset = (1 - progress * 2) * 80;
            } else {
                cardOffset = -(progress - 0.5) * 2 * 80;
            }
            card.style.transform = `translateY(${cardOffset}px)`;
            const isVisible = rect.bottom > 0 && rect.top < windowHeight;
            card.style.opacity = isVisible ? 1 : 0;
            const pitchDiameter = 97;
            const angle = (cardOffset / (Math.PI * pitchDiameter)) * 360;
            gear.classList.add('rotating');
            gear.style.transform = `translateY(calc(-50% + ${cardOffset}px)) rotate(${angle}deg)`;
            gearRight.classList.add('rotating');
            gearRight.style.transform = `translateY(calc(-50% + ${cardOffset}px)) scaleX(-1) rotate(${angle}deg)`;
            if (!isVisible) {
                card.style.pointerEvents = 'none';
                gear.style.opacity = 0;
                gearRight.style.opacity = 0;
            } else {
                card.style.pointerEvents = '';
                gear.style.opacity = 1;
                gearRight.style.opacity = 1;
            }
        });
    };
    let scrollTicking = false;
    const onScroll = () => {
        if (window.scrollY > 60) {
            document.body.classList.add('scrolled');
        }
        else {
            document.body.classList.remove('scrolled');
        }
        animateCards();
        scrollTicking = false;
    };
    window.addEventListener('scroll', () => {
        if (!scrollTicking) {
            scrollTicking = true;
            requestAnimationFrame(onScroll);
        }
    }, { passive: true });
    animateCards();
});
