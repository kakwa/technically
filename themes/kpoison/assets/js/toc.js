/*
    Original Author: Bramus Van Damme
    Link to original: https://www.bram.us/2020/01/10/smooth-scrolling-sticky-scrollspy-navigation/

    Rewritten for reliability:
    - Uses rAF-throttled scrollspy instead of IntersectionObserver for deterministic ordering
    - Maps ToC links to headings once, handles encoded hrefs gracefully
    - Recomputes heading offsets on resize and when images load
*/

window.addEventListener('DOMContentLoaded', () => {
    const tocNav = document.querySelector("nav#TableOfContents");
    const post = document.querySelector(".post");
    const scrollContainer = document.querySelector('.container.content') || window;
    if (!tocNav || !post) {
        return;
    }

    const headings = Array.from(post.querySelectorAll("h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]"));
    if (headings.length === 0) {
        return;
    }

    const linkToLi = new Map();
    tocNav.querySelectorAll("li > a[href^='#']").forEach((a) => {
        const rawHref = a.getAttribute('href') || '';
        const id = rawHref.startsWith('#') ? decodeURIComponent(rawHref.slice(1)) : null;
        if (!id) return;
        const li = a.parentElement;
        if (li) linkToLi.set(id, li);
    });

    // Only consider headings that actually have corresponding ToC links
    const tocHeadings = headings.filter(h => h.id && linkToLi.has(h.id));
    if (tocHeadings.length === 0) {
        return;
    }

    let activeId = null;
    let ticking = false;
    let headingPositions = [];
    let scrollOffset = computeScrollOffset();

    function computeScrollOffset() {
        const containerEl = (scrollContainer === window) ? document.documentElement : scrollContainer;
        const style = getComputedStyle(containerEl);
        const spt = parseInt(style.scrollPaddingTop || '0', 10);
        if (!isNaN(spt) && spt > 0) return spt + 1;
        const header = document.querySelector('header, .site-header, nav.navbar, .navbar');
        if (header) return Math.ceil(header.getBoundingClientRect().height) + 16;
        return 96; // sensible default for sticky headers
    }

    function recomputePositions() {
        const containerEl = (scrollContainer === window) ? window : scrollContainer;
        const containerRect = (scrollContainer === window) ? { top: 0 } : scrollContainer.getBoundingClientRect();
        const containerScrollTop = (scrollContainer === window) ? window.scrollY : scrollContainer.scrollTop;
        headingPositions = tocHeadings.map((h) => {
            const rect = h.getBoundingClientRect();
            const top = (scrollContainer === window)
                ? rect.top + window.scrollY
                : rect.top - containerRect.top + containerScrollTop;
            return { id: h.id, top };
        }).sort((a, b) => a.top - b.top);
        scrollOffset = computeScrollOffset();
    }

    function setActive(id) {
        if (id === activeId) return;
        if (!linkToLi.has(id)) {
            return; // keep previous active state if target is unknown
        }
        // Clear all
        tocNav.querySelectorAll('li').forEach((li) => {
            li.classList.remove('active');
            li.classList.add('inactive');
        });
        // Activate target and its ancestors when present
        const li = linkToLi.get(id);
        if (li) {
            li.classList.remove('inactive');
            li.classList.add('active');
            let parent = li.parentElement;
            while (parent && parent !== tocNav) {
                if (parent.tagName && parent.tagName.toLowerCase() === 'ul') {
                    const pli = parent.closest('li');
                    if (pli) {
                        pli.classList.remove('inactive');
                        pli.classList.add('active');
                    }
                }
                parent = parent.parentElement;
            }
        }
        activeId = id;
    }

    function onScroll() {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(() => {
            const currentScrollTop = (scrollContainer === window) ? window.scrollY : scrollContainer.scrollTop;
            const pos = currentScrollTop + scrollOffset;
            let currentId = tocHeadings[0].id;
            for (let i = 0; i < headingPositions.length; i++) {
                if (headingPositions[i].top <= pos) {
                    currentId = headingPositions[i].id;
                } else {
                    break;
                }
            }
            setActive(currentId);
            ticking = false;
        });
    }

    // Initial setup
    recomputePositions();
    onScroll();

    // Recompute on resize
    let resizeTimer = null;
    window.addEventListener('resize', () => {
        window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(() => {
            recomputePositions();
            onScroll();
        }, 150);
    }, { passive: true });

    // Account for images changing layout
    post.querySelectorAll('img').forEach((img) => {
        img.addEventListener('load', () => {
            recomputePositions();
            onScroll();
        }, { once: true });
    });

    // Update on hash change as a fallback
    window.addEventListener('hashchange', () => {
        // Allow the browser to jump, then update
        window.requestAnimationFrame(() => {
            recomputePositions();
            onScroll();
        });
    });

    // Main scroll listener (passive)
    if (scrollContainer === window) {
        window.addEventListener('scroll', onScroll, { passive: true });
    } else {
        scrollContainer.addEventListener('scroll', onScroll, { passive: true });
    }
});
