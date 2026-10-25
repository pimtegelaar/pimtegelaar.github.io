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
    const wrappers = Array.from(document.querySelectorAll('.experience-card-wrapper')).map(wrapper => ({
        wrapper,
        card: wrapper.querySelector('.experience-card'),
        gear: wrapper.querySelector('.card-gear'),
        gearRight: wrapper.querySelector('.card-gear-right'),
        rack: wrapper.closest('.timeline') && wrapper.closest('.timeline').querySelector('.gear-rack'),
        centerOnRack: 0,
        target: null,
        current: null,
        visible: null
    })).filter(w => w.card && w.gear && w.gearRight);

    // Card and both gears are driven by ONE smoothed value per wrapper, in one rAF loop, with no CSS
    // transitions. That keeps them in lockstep and independent of how often a browser fires scroll events.
    const SMOOTHING_MS = 120; // time constant of the follow-up smoothing; 0 = follow scroll exactly
    // gear.png has 22 teeth and the rack tile (see .gear-rack) has a 14px tooth pitch
    const GEAR_TEETH = 22;
    const RACK_TEETH = 30;      // teeth per tile of gear_rack.png (98 x 1701)
    const RACK_ASPECT = 98 / 1701;
    let pitchCircumference = 0;

    // Chrome rounds a background tile to whole DEVICE pixels, which drifts on fractional densities
    // (e.g. 2.8x phones). Size the tile to a whole number of device pixels and derive the pitch from it.
    const fitRackTile = () => {
        const dpr = window.devicePixelRatio || 1;
        const tileCss = Math.round(420 * dpr) / dpr;
        const widthCss = tileCss * RACK_ASPECT;
        document.querySelectorAll('.gear-rack').forEach(rack => {
            rack.style.backgroundSize = `${widthCss}px ${tileCss}px`;
        });
        pitchCircumference = GEAR_TEETH * (tileCss / RACK_TEETH);
    };
    fitRackTile();
    const GEAR_PHASE_DEG = 0; // fine-tune: rotates every gear relative to the rack teeth
    const maxOffset = 80;
    let lastTime = null;
    let rafId = 0;

    // Where each gear sits along the rack. Scroll-invariant, so measured only when layout changes.
    let firstCenter = null;
    const measureLayout = () => {
        wrappers.forEach(w => {
            const rect = w.wrapper.getBoundingClientRect();
            const rackTop = w.rack ? w.rack.getBoundingClientRect().top : 0;
            w.centerOnRack = rect.top + rect.height / 2 - rackTop;
        });
        firstCenter = wrappers.length ? wrappers[0].centerOnRack : 0;
    };

    const updateTargets = () => {
        // clientHeight ignores the collapsing mobile address bar, unlike innerHeight
        const windowHeight = document.documentElement.clientHeight;
        wrappers.forEach(w => {
            // measure the wrapper: the card is transformed, which would feed back into the result
            const rect = w.wrapper.getBoundingClientRect();
            const cardHeight = rect.height || 160;
            const enter = windowHeight;
            const exit = -cardHeight;
            const progress = Math.max(0, Math.min(1, (enter - rect.top) / (enter - exit)));
            w.target = progress < 0.5
                ? (1 - progress * 2) * maxOffset
                : -(progress - 0.5) * 2 * maxOffset;
            w.visible = rect.bottom > 0 && rect.top < windowHeight;
            if (w.current === null) w.current = w.target;
        });
    };

    // gears sit this many px lower on phones/small screens (same breakpoint as the mobile layout in styles.css)
    const MOBILE_GEAR_SHIFT = 2;
    const mobileQuery = window.matchMedia('(max-width: 1000px)');

    const render = () => {
        const dpr = window.devicePixelRatio || 1;
        const gearShift = mobileQuery.matches ? MOBILE_GEAR_SHIFT : 0;
        wrappers.forEach(w => {
            // snap to whole device pixels so every browser rasterizes the same positions
            const offset = Math.round(w.current * dpr) / dpr;
            // rolling on a fixed rack: rotation follows the gear's travel along it, measured from the first
            // gear so the rest stay in phase with the teeth however far down the page they are
            const angle = ((w.centerOnRack - firstCenter + offset) / pitchCircumference) * 360 + GEAR_PHASE_DEG;
            w.card.style.transform = `translateY(${offset}px)`;
            w.gear.style.transform = `translateY(calc(-50% + ${offset + gearShift}px)) rotate(${angle}deg)`;
            w.gearRight.style.transform = `translateY(calc(-50% + ${offset + gearShift}px)) scaleX(-1) rotate(${angle}deg)`;
            const opacity = w.visible ? 1 : 0;
            w.card.style.opacity = opacity;
            w.gear.style.opacity = opacity;
            w.gearRight.style.opacity = opacity;
            w.card.style.pointerEvents = w.visible ? '' : 'none';
        });
    };

    const tick = (now) => {
        rafId = 0;
        const dt = lastTime === null ? 16 : Math.min(now - lastTime, 100);
        lastTime = now;
        const k = SMOOTHING_MS > 0 ? 1 - Math.exp(-dt / SMOOTHING_MS) : 1;
        let moving = false;
        wrappers.forEach(w => {
            const diff = w.target - w.current;
            if (Math.abs(diff) < 0.01) {
                w.current = w.target;
            } else {
                w.current += diff * k;
                moving = true;
            }
        });
        render();
        if (moving) {
            rafId = requestAnimationFrame(tick);
        } else {
            lastTime = null;
        }
    };
    const requestTick = () => {
        if (!rafId) rafId = requestAnimationFrame(tick);
    };

    const onScroll = () => {
        document.body.classList.toggle('scrolled', window.scrollY > 60);
        updateTargets();
        requestTick();
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    const onLayout = () => {
        fitRackTile();
        measureLayout();
        onScroll();
    };
    window.addEventListener('resize', onLayout);
    window.addEventListener('load', onLayout);
    measureLayout();
    updateTargets();
    render();
});
