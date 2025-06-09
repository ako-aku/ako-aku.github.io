'use strict'

const sections = Array.from(document.querySelectorAll('section'));
let currentSection = 0;
let isScrolling = false;

const scrollDuration = 800;
const invertDuration = 700;
const fadeDuration = 700;
const pauseDuration = 150;

const fadeOverlay = document.querySelector('.fade-overlay');
const html = document.documentElement;

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function invertColors(enable = true, duration = invertDuration) {
    return new Promise(resolve => {
        if (enable) {
            html.classList.add('invert-colors');
            html.style.filter = '';
            setTimeout(resolve, duration);
        } else {
            html.style.transition = `filter ${duration}ms ease`;
            requestAnimationFrame(() => {
                html.style.filter = 'none';
            });
            setTimeout(() => {
                html.classList.remove('invert-colors');
                html.style.filter = '';
                html.style.transition = '';
                resolve();
            }, duration);
        }
    });
}

function fadeInOverlay(duration = fadeDuration) {
    return new Promise(resolve => {
        fadeOverlay.classList.add('visible');
        setTimeout(resolve, duration);
    });
}

function fadeOutOverlay(duration = fadeDuration) {
    return new Promise(resolve => {
        fadeOverlay.classList.remove('visible');
        setTimeout(resolve, duration);
    });
}

function animateScroll(targetY, duration = scrollDuration) {
    return new Promise(resolve => {
        const startY = window.scrollY;
        const distance = targetY - startY;
        const startTime = performance.now();

        function step(now) {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const ease = progress < 0.5 ?
                4 * progress * progress * progress :
                1 - Math.pow(-2 * progress + 2, 3) / 2;
            window.scrollTo(0, startY + distance * ease);
            if (progress < 1) {
                requestAnimationFrame(step);
            } else {
                resolve();
            }
        }
        requestAnimationFrame(step);
    });
}

async function scrollToSection(idx) {
    if (isScrolling || idx < 0 || idx >= sections.length) return;
    isScrolling = true;

    await invertColors(true, invertDuration);
    await delay(pauseDuration);
    await fadeInOverlay(fadeDuration);
    await delay(pauseDuration);

    const targetY = sections[idx].offsetTop;
    await animateScroll(targetY, scrollDuration);

    if (currentSection === 0 && idx !== 0 && typeof window.disableHint === 'function') {
        window.disableHint();
    }

    sections[currentSection].classList.add('hidden');
    sections[idx].classList.remove('hidden');

    currentSection = idx;
    sections[idx].setAttribute('tabindex', '-1');
    sections[idx].focus({
        preventScroll: true
    });

    await fadeOutOverlay(fadeDuration);
    await delay(pauseDuration);
    await invertColors(false, invertDuration);

    isScrolling = false;
}

function goToNextSection() {
    if (currentSection < sections.length - 1) scrollToSection(currentSection + 1);
}

function goToPrevSection() {
    if (currentSection > 0) scrollToSection(currentSection - 1);
}

function onWheel(e) {
    if (isScrolling) return e.preventDefault();
    e.preventDefault();
    if (e.deltaY > 0) goToNextSection();
    else if (e.deltaY < 0) goToPrevSection();
}

function onKeyDown(e) {
    if (isScrolling) return;
    if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault();
        goToNextSection();
    } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        goToPrevSection();
    }
}

let touchStartY = null;

function onTouchStart(e) {
    if (e.touches.length === 1) touchStartY = e.touches[0].clientY;
}

function onTouchEnd(e) {
    if (touchStartY === null) return;
    const touchEndY = e.changedTouches[0].clientY;
    const delta = touchStartY - touchEndY;
    if (Math.abs(delta) > 50) {
        if (delta > 0) goToNextSection();
        else goToPrevSection();
    }
    touchStartY = null;
}

window.onload = () => {
    window.scrollTo(0, 0);
    sections.forEach((section, idx) => {
        if (idx === 0) {
            section.classList.remove('hidden');
            section.setAttribute('tabindex', '-1');
            section.focus({
                preventScroll: true
            });
        } else {
            section.classList.add('hidden');
        }
    });
    currentSection = 0;
};

if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
}

window.addEventListener('wheel', onWheel, {
    passive: false
});
window.addEventListener('keydown', onKeyDown, {
    passive: false
});
window.addEventListener('touchstart', onTouchStart, {
    passive: false
});
window.addEventListener('touchend', onTouchEnd, {
    passive: false
});

document.documentElement.style.scrollBehavior = 'auto';

const h1 = document.getElementById('me');
const originalText = h1.textContent;
const hintText = "scroll down";
let hintShown = false;
let hintDisabled = window.scrollY > 0;

function setH1TextWithFade(newText) {
    h1.classList.add('fading');
    setTimeout(() => {
        h1.textContent = newText;
        requestAnimationFrame(() => {
            h1.classList.remove('fading');
        });
    }, 600);
}

function showHint() {
    if (hintDisabled || hintShown) return;
    hintShown = true;
    setH1TextWithFade(hintText);
}

function restoreTitle(delay = 0) {
    if (h1.textContent !== originalText) {
        setTimeout(() => {
            setH1TextWithFade(originalText);
        }, delay);
    }
}

function onFirstSectionLeave() {
    if (hintDisabled) return;
    hintDisabled = true;
    restoreTitle(500);
}

if (!hintDisabled) {
    setTimeout(showHint, 3500); //6666, 4000
}

window.disableHint = onFirstSectionLeave;

// EMAIL
document.getElementById("mail").addEventListener("click", function(event) {
    event.preventDefault();

    const textElement = event.target;
    const textToCopy = textElement.textContent;

    navigator.clipboard.writeText(textToCopy).then(() => {
        textElement.textContent = "COPIED";

        setTimeout(() => {
            textElement.textContent = textToCopy;
        }, 650);
    }).catch(err => console.error("ERROR: ", err));
});