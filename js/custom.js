// to get current year
function getYear() {
    var currentDate = new Date();
    var currentYear = currentDate.getFullYear();
    var el = document.querySelector("#displayYear");
    if (el) el.innerHTML = currentYear;
}

getYear();

/* ── Page Loader ── */
window.addEventListener('load', function () {
    var loader = document.querySelector('.page-loader');
    if (loader) loader.classList.add('loaded');
});

/* ── Sticky Navigation ── */
(function () {
    var header = document.querySelector('.header_section');
    if (!header) return;
    var threshold = 100;

    window.addEventListener('scroll', function () {
        if (window.scrollY > threshold) {
            header.classList.add('header-sticky');
            document.body.classList.add('has-sticky-nav');
        } else {
            header.classList.remove('header-sticky');
            document.body.classList.remove('has-sticky-nav');
        }
    });
})();

/* ── Back to Top ── */
(function () {
    var btn = document.querySelector('.back-to-top');
    if (!btn) return;

    window.addEventListener('scroll', function () {
        btn.classList.toggle('visible', window.scrollY > 400);
    });

    btn.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
})();

/* ── Animated Counters ── */
(function () {
    var counters = document.querySelectorAll('[data-counter]');
    if (!counters.length) return;

    function animateCounter(el) {
        if (el.dataset.animated === 'true') return;
        el.dataset.animated = 'true';

        var target = parseInt(el.getAttribute('data-target') || el.textContent, 10);
        if (isNaN(target)) return;

        var suffix = el.getAttribute('data-suffix') || '';
        var duration = 2000;
        var startTime = null;

        function step(timestamp) {
            if (!startTime) startTime = timestamp;
            var progress = Math.min((timestamp - startTime) / duration, 1);
            var eased = 1 - Math.pow(1 - progress, 3);
            el.textContent = Math.floor(eased * target) + suffix;
            if (progress < 1) requestAnimationFrame(step);
            else el.textContent = target + suffix;
        }

        requestAnimationFrame(step);
    }

    function checkCounters() {
        counters.forEach(function (el) {
            if (el.dataset.animated === 'true') return;
            var rect = el.getBoundingClientRect();
            if (rect.top < window.innerHeight && rect.bottom > 0) {
                animateCounter(el);
            }
        });
    }

    window.EJTAnimateCounters = checkCounters;

    function initCounters() {
        window.addEventListener('scroll', checkCounters);
        checkCounters();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCounters);
    } else {
        initCounters();
    }
})();

/* ── Smooth scroll for anchor links ── */
document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
        var targetId = this.getAttribute('href');
        if (targetId === '#') return;
        var target = document.querySelector(targetId);
        if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});

/* ── Close mobile nav on link click ── */
document.querySelectorAll('.navbar-nav .nav-link').forEach(function (link) {
    link.addEventListener('click', function () {
        var collapse = document.querySelector('#navbarSupportedContent');
        if (collapse && collapse.classList.contains('show')) {
            if (typeof $ !== 'undefined') {
                $(collapse).collapse('hide');
            }
        }
    });
});

// owl carousel slider js (legacy portfolio carousel — kept for backward compatibility)
if ($('.portfolio_carousel').length) {
    var owl = $('.portfolio_carousel').owlCarousel({
        loop: true,
        margin: 15,
        dots: false,
        center: true,
        autoplay: true,
        navText: [
            '<i class="fa fa-arrow-left" aria-hidden="true"></i>',
            '<i class="fa fa-arrow-right" aria-hidden="true"></i>'
        ],
        autoplayHoverPause: true,
        responsive: {
            0: { center: false, items: 1, margin: 0 },
            576: { items: 2 },
            991: { center: true, items: 3 }
        }
    });

    $('.owl-filter-bar').on('click', '.item', function (e) {
        var $items = $('.owl-filter-bar a');
        var $item = $(this);
        var filter = $item.data('owl-filter');
        $items.removeClass("active");
        $item.addClass("active");
        owl.owlcarousel2_filter(filter);
        e.preventDefault();
    });
}

/** google_map js **/
function myMap() {
    var mapEl = document.getElementById("googleMap");
    if (!mapEl || typeof google === 'undefined') return;
    var mapProp = {
        center: new google.maps.LatLng(14.320176387993648, 120.98668257312744),
        zoom: 18,
    };
    new google.maps.Map(mapEl, mapProp);
}

// nice select
$(document).ready(function () {
    if ($('select').length) $('select').niceSelect();
});

// AOS init (when library is loaded)
$(document).ready(function () {
    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 800,
            once: true,
            offset: 60,
            easing: 'ease-in-out'
        });
    }
});
