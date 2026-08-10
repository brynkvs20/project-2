/**
 * EJT Portfolio Gallery — year filter, company cards, lightbox, lazy loading.
 */
(function ($) {
  'use strict';

  var IMAGE_EXT = /\.(jpe?g|png|webp|gif)$/i;
  var currentYear = 'all';
  var currentProject = null;
  var lightboxIndex = 0;

  function getBasePath() {
    return 'portfolio/';
  }

  function slugify(name) {
    return name.replace(/[^\w\s-]/g, '').replace(/\s+/g, ' ').trim();
  }

  function buildImagePaths(project) {
    var paths = [];
    var base = getBasePath() + project.year + '/' + project.folder + '/';
    /* If manifest images exist in data */
    if (project.images && project.images.length) {
      project.images.forEach(function (img) {
        paths.push(base + img);
      });
    }
    return { base: base, paths: paths };
  }

  function tryDiscoverImages(project) {
    return $.ajax({
      url: 'php/list-portfolio-images.php',
      method: 'GET',
      data: { year: project.year, folder: project.folder },
      dataType: 'json'
    }).then(function (res) {
      if (res && res.images && res.images.length) {
        return res.images.map(function (img) {
          return getBasePath() + project.year + '/' + project.folder + '/' + img;
        });
      }
      return [];
    }).catch(function (err) {
      console.error('Failed to load portfolio images:', err);
      return [];
    });
  }

  function renderStats() {
    var isPortfolioPage = $('#portfolioGrid').length > 0;
    var stats = isPortfolioPage && EJT_PORTFOLIO.portfolioPageStats
      ? EJT_PORTFOLIO.portfolioPageStats
      : EJT_PORTFOLIO.stats;

    if (!stats) return;

    $('[data-counter="years"]').attr('data-target', stats.yearsExperience);
    $('[data-counter="projects"]').attr('data-target', stats.featuredProjects || stats.projectsCompleted);
    $('[data-counter="clients"]').attr('data-target', stats.clientsServed);
    $('[data-counter="services"]').attr('data-target', stats.qualityCommitment || stats.servicesOffered);

    if (typeof window.EJTAnimateCounters === 'function') {
      $('[data-counter]').each(function () {
        this.dataset.animated = 'false';
        this.textContent = '0';
      });
      window.EJTAnimateCounters();
    }
  }

  function renderProjectCards(year) {
    var $grid = $('#portfolioGrid');
    if (!$grid.length) return;

    $grid.empty();
    var projects = EJT_PORTFOLIO.projects.filter(function (p) {
      return year === 'all' || String(p.year) === String(year);
    });

    if (!projects.length) {
      $grid.html('<p class="portfolio-empty">No projects found for this year.</p>');
      return;
    }

    projects.forEach(function (project, i) {
      var cardClass = 'portfolio-card' + (project.placeholder ? ' portfolio-card--placeholder' : '');
      var servicesHtml = project.services.map(function (s) {
        return '<li>' + escapeHtml(s) + '</li>';
      }).join('');

      var html =
        '<article class="' + cardClass + '" data-aos="fade-up" data-aos-delay="' + (i % 4) * 100 + '">' +
          '<div class="portfolio-card__header">' +
            '<span class="portfolio-card__year">' + escapeHtml(project.year) + '</span>' +
            (project.placeholder ? '<span class="portfolio-card__badge">Placeholder</span>' : '') +
          '</div>' +
          '<div class="portfolio-card__body">' +
            '<h3 class="portfolio-card__title">' + escapeHtml(project.name) + '</h3>' +
            '<p class="portfolio-card__type"><i class="fa fa-briefcase" aria-hidden="true"></i> ' + escapeHtml(project.type) + '</p>' +
            '<ul class="portfolio-card__services">' + servicesHtml + '</ul>' +
          '</div>' +
          '<div class="portfolio-card__footer">' +
            '<span class="portfolio-card__count"><i class="fa fa-image" aria-hidden="true"></i> <span class="img-count">' + (project.imageCount || 0) + '</span> Photos</span>' +
            '<button type="button" class="portfolio-card__btn btn-view-gallery" data-index="' + getProjectIndex(project) + '">' +
              'View Gallery <i class="fa fa-arrow-right" aria-hidden="true"></i>' +
            '</button>' +
          '</div>' +
        '</article>';

      $grid.append(html);
    });
  }

  function getProjectIndex(project) {
    return EJT_PORTFOLIO.projects.findIndex(function (p) {
      return p.year === project.year && p.folder === project.folder && p.name === project.name;
    });
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function openGallery(projectIndex) {
    var project = EJT_PORTFOLIO.projects[projectIndex];
    if (!project) return;

    currentProject = project;
    lightboxIndex = 0;

    var $modal = $('#portfolioLightbox');
    var $gallery = $('#lightboxGallery');
    var $title = $('#lightboxTitle');
    var $subtitle = $('#lightboxSubtitle');

    $title.text(project.name);
    $subtitle.text(project.type + ' · ' + project.year);
    $gallery.html('<div class="gallery-loading"><i class="fa fa-spinner fa-spin"></i> Loading gallery...</div>');
    $modal.addClass('active').attr('aria-hidden', 'false');
    $('body').addClass('modal-open');

    tryDiscoverImages(project).then(function (images) {
      if (!images.length && project.images) {
        images = buildImagePaths(project).paths;
      }

      if (!images.length) {
        /* Try numbered placeholders or show empty state */
        $gallery.html(
          '<div class="gallery-empty">' +
            '<i class="fa fa-folder-open-o" aria-hidden="true"></i>' +
            '<p>No photos uploaded yet.</p>' +
            '<p class="gallery-empty__path">Add images to: <code>portfolio/' + escapeHtml(project.year) + '/' + escapeHtml(project.folder) + '/</code></p>' +
          '</div>'
        );
        return;
      }

      project._loadedImages = images;
      renderGalleryGrid(images);
    });
  }

  function renderGalleryGrid(images) {
    var $gallery = $('#lightboxGallery');
    $gallery.empty().addClass('gallery-masonry');

    images.forEach(function (src, idx) {
      var html =
        '<div class="gallery-item" data-index="' + idx + '">' +
          '<img src="' + escapeHtml(src) + '" alt="Project photo" loading="lazy" onerror="this.parentElement.classList.add(\'gallery-item--error\')">' +
          '<div class="gallery-item__overlay"><i class="fa fa-search-plus" aria-hidden="true"></i></div>' +
        '</div>';
      $gallery.append(html);
    });
  }

  /* ==========================================================================
   LIGHTBOX PREVIEW
   ========================================================================== */

function openLightboxPreview(index) {

  if (!currentProject || !currentProject._loadedImages) {
      return;
  }

  lightboxIndex = index;

  var images = currentProject._loadedImages;

  var $preview = $('#lightboxPreview');
  var $img = $preview.find('img');

  if (!$img.length) {
      console.error('No <img> found inside #lightboxPreview');
      return;
  }

  $img.attr('src', images[index]);
  $img.attr('alt', currentProject.name + ' Photo ' + (index + 1));

  $('#portfolioLightbox')
      .addClass('is-behind-preview')
      .attr('aria-hidden', 'true');

  $preview
      .addClass('active')
      .attr('aria-hidden', 'false');

  $('body').addClass('modal-open');

  $('.lightbox-preview__close').trigger('focus');
}


function showPreviousImage() {

  if (!currentProject || !currentProject._loadedImages) {
      return;
  }

  lightboxIndex--;

  if (lightboxIndex < 0) {
      lightboxIndex = currentProject._loadedImages.length - 1;
  }

  openLightboxPreview(lightboxIndex);
}

function showNextImage() {

  if (!currentProject || !currentProject._loadedImages) {
      return;
  }

  lightboxIndex++;

  if (lightboxIndex >= currentProject._loadedImages.length) {
      lightboxIndex = 0;
  }

  openLightboxPreview(lightboxIndex);
}
function closeLightboxPreview() {

  $('#lightboxPreview')
      .removeClass('active')
      .attr('aria-hidden', 'true');

  $('#portfolioLightbox')
      .removeClass('is-behind-preview')
      .addClass('active')
      .attr('aria-hidden', 'false');
}

function closeModals() {

  $('#lightboxPreview')
      .removeClass('active')
      .attr('aria-hidden', 'true');

  $('#portfolioLightbox')
      .removeClass('active is-behind-preview')
      .attr('aria-hidden', 'true');

  $('body').removeClass('modal-open');

  currentProject = null;
  lightboxIndex = 0;
}
  function initFilters() {
    $(document).on('click', '.portfolio-year-filter .filter-btn', function (e) {
      e.preventDefault();
      var year = $(this).data('year');
      $('.portfolio-year-filter .filter-btn').removeClass('active');
      $(this).addClass('active');
      currentYear = year;
      renderProjectCards(year);
      if (typeof AOS !== 'undefined') AOS.refresh();
    });
  }

  function initEvents() {

    // Open Gallery
    $(document).on('click', '.btn-view-gallery', function () {
        openGallery(parseInt($(this).data('index'), 10));
    });

    // Open Preview
    $(document).on('click', '.gallery-item', function () {
        openLightboxPreview(parseInt($(this).data('index'), 10));
    });

    // Close Gallery
    $(document).on(
        'click',
        '#portfolioLightbox .lightbox-close, #portfolioLightbox .lightbox-backdrop',
        function () {
            closeModals();
        }
    );

    // Close fullscreen preview (X or backdrop) — return to gallery modal
    $(document).on('click', '#lightboxPreview .lightbox-preview__close, #lightboxPreview .lightbox-preview__backdrop', function (e) {
      e.preventDefault();
      closeLightboxPreview();
    });

    // Prevent clicking the image from closing preview
    $(document).on('click', '#lightboxPreview .lightbox-preview__content', function (e) {
      e.stopPropagation();
    });

    // Previous / Next
    $(document).on('click', '#lightboxPreview .lightbox-preview__prev', function () {
      showPreviousImage();
    });

    $(document).on('click', '#lightboxPreview .lightbox-preview__next', function () {
      showNextImage();
    });

    // Keyboard
    $(document).on('keydown', function (e) {
      if ($('#lightboxPreview').hasClass('active')) {
        switch (e.key) {
          case 'Escape':
            closeLightboxPreview();
            break;
          case 'ArrowLeft':
            showPreviousImage();
            break;
          case 'ArrowRight':
            showNextImage();
            break;
        }
      } else if ($('#portfolioLightbox').hasClass('active')) {
        if (e.key === 'Escape') {
          closeModals();
        }
      }
    });
  }

  function initHomePreview() {
    var $preview = $('#portfolioPreview');
    if (!$preview.length) return;

    var featured = EJT_PORTFOLIO.projects.filter(function (p) { return !p.placeholder; }).slice(0, 6);
    featured.forEach(function (project) {
      $preview.append(
        '<div class="portfolio-preview-card" data-aos="fade-up">' +
          '<div class="portfolio-preview-card__icon"><i class="fa fa-building-o" aria-hidden="true"></i></div>' +
          '<h4>' + escapeHtml(project.name) + '</h4>' +
          '<p>' + escapeHtml(project.type) + '</p>' +
          '<a href="portfolio.html" class="portfolio-preview-card__link">View Portfolio</a>' +
        '</div>'
      );
    });
  }

  function refreshImageCounts() {
    EJT_PORTFOLIO.projects.forEach(function (project, idx) {
      if (project.placeholder) return;
      $.ajax({
        url: 'php/list-portfolio-images.php',
        data: { year: project.year, folder: project.folder },
        dataType: 'json'
      }).done(function (res) {
        if (res && typeof res.count === 'number') {
          project.imageCount = res.count;
          $('.btn-view-gallery[data-index="' + idx + '"]')
            .closest('.portfolio-card')
            .find('.img-count')
            .text(res.count);
        }
      });
    });
  }

  $(document).ready(function () {
    if (typeof EJT_PORTFOLIO === 'undefined') return;

    renderStats();
    initFilters();
    initEvents();
    initHomePreview();

    if ($('#portfolioGrid').length) {
      renderProjectCards('all');
      refreshImageCounts();
    }
  });

  window.EJTPortfolio = {
    renderProjectCards: renderProjectCards,
    openGallery: openGallery
  };

})(jQuery);
