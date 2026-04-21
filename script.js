"use strict";
document.addEventListener('DOMContentLoaded', () => {
    const timeline = document.getElementById('timeline');
    const experiences = window.experiences || [];
    if (timeline) {
        experiences.forEach((exp, idx) => {

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
                    ${exp.logo ? `<img class="company-logo" src="${exp.logo}" alt="${exp.company} logo" />` : ''}
                    <div class="card-details">
                        <h3>${exp.title}</h3>
                        <h4>${exp.company}</h4>
                        <span>${exp.period}</span>
                        <p>${exp.description}</p>
                    </div>
                </div>
            `;
            wrapper.appendChild(card);
            timeline.appendChild(wrapper);
        });
    }
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
    window.addEventListener('scroll', animateCards);
    animateCards();
    window.addEventListener('scroll', () => {
        if (window.scrollY > 60) {
            document.body.classList.add('scrolled');
        }
        else {
            document.body.classList.remove('scrolled');
        }
    });
});
