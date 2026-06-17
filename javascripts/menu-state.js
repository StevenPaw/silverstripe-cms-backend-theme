/**
 * Custom menu panel collapse/expand functionality with localStorage persistence
 */
(function($) {
  const STORAGE_KEY = 'custom-cms-menu-state';
  const MENU_SELECTOR = '#cms-menu';
  const BUTTON_SELECTOR = '.cms-panel-toggle__button';
  const COLLAPSED_CLASS = 'custom-collapsed';
  
  // Restore state immediately on DOM ready
  $(document).ready(function() {
    const savedState = localStorage.getItem(STORAGE_KEY);
    const $menu = $(MENU_SELECTOR);

    if (savedState === 'collapsed') {
      $menu.addClass(COLLAPSED_CLASS);
    } else if (savedState === 'expanded') {
      $menu.removeClass(COLLAPSED_CLASS);
    }

    updateButtonState($menu);
    // Re-sync after Silverstripe's entwine may have reset the button
    setTimeout(function() { updateButtonState($menu); }, 0);

    // Hand off from the pre-collapsed CSS class (set inline in <head>) to our JS-driven class
    document.documentElement.classList.remove('cms-pre-collapsed');

    // Prevent Silverstripe's panel system from adding its native 'collapsed' class to #cms-menu.
    // Silverstripe calls togglePanel(false) when loading the page editor, which would conflict
    // with our custom-collapsed mechanism.
    const menuEl = document.querySelector(MENU_SELECTOR);
    if (menuEl) {
      new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
          if (mutation.target.classList.contains('collapsed')) {
            mutation.target.classList.remove('collapsed');
          }
        });
      }).observe(menuEl, { attributes: true, attributeFilter: ['class'] });
    }
  });
  
  // Intercept parent menu item clicks while collapsed — toggle submenu instead of navigating
  document.addEventListener('click', function(e) {
    const $menu = $(MENU_SELECTOR);
    if (!$menu.hasClass(COLLAPSED_CLASS)) return;

    const link = e.target.closest('.cms-menu__list li.branded-menu__list-item--children > a');
    if (!link) return;
    if (e.target.closest('.toggle-children')) return;

    e.preventDefault();
    e.stopImmediatePropagation();

    const $li = $(link).closest('li');
    const isOpened = $li.hasClass('opened');

    if (isOpened) {
      $li.removeClass('opened').find('ul').hide();
      $li.find('.toggle-children').removeClass('opened');
    } else {
      $li.addClass('opened').find('ul').show();
      $li.find('.toggle-children').addClass('opened');
    }
  }, true);

  // Handle button clicks
  $(document).on('click', BUTTON_SELECTOR, function(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const $menu = $(MENU_SELECTOR);
    const isCollapsed = $menu.hasClass(COLLAPSED_CLASS);
    
    if (isCollapsed) {
      // Expand
      $menu.removeClass(COLLAPSED_CLASS);
      localStorage.setItem(STORAGE_KEY, 'expanded');
    } else {
      // Collapse
      $menu.addClass(COLLAPSED_CLASS);
      localStorage.setItem(STORAGE_KEY, 'collapsed');
    }
    
    updateButtonState($menu);
    
    // Trigger resize event for content area adjustment
    setTimeout(function() {
      $(window).trigger('resize');
      $('.cms-container').trigger('windowresize');
    }, 50);
  });
  
  function updateButtonState($menu) {
    const $button = $(BUTTON_SELECTOR);
    const isCollapsed = $menu.hasClass(COLLAPSED_CLASS);
    
    if ($button.length) {
      if (isCollapsed) {
        $button.html('&raquo;');
        $button.attr('title', $button.data('collapsed-title') || 'Expand panel');
        $button.attr('aria-expanded', 'false');
      } else {
        $button.html('&laquo;');
        $button.attr('title', $button.data('expanded-title') || 'Collapse panel');
        $button.attr('aria-expanded', 'true');
      }
    }
  }
})(jQuery);
