'use strict';
(() => {
  const header = document.getElementById('jw-site-header');
  if (!header) return;
  const toggle = header.querySelector('#jw-menu-toggle');
  const links = header.querySelector('#jw-site-links');
  const resourceToggle = header.querySelector('.jw-resource-toggle');
  const resourceLinks = header.querySelector('#jw-resource-links');
  const mobile = window.matchMedia('(max-width:1199px)');
  function closeResources() {
    resourceLinks.hidden = true;
    resourceToggle.setAttribute('aria-expanded', 'false');
    resourceToggle.setAttribute('aria-label', '무료 자료 하위 메뉴 열기');
  }
  function closeMenu() {
    links.hidden = mobile.matches;
    toggle.setAttribute('aria-expanded', 'false');
    toggle.textContent = '메뉴';
    closeResources();
  }
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    links.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.textContent = open ? '닫기' : '메뉴';
    if (!open) closeResources();
  });
  resourceToggle.addEventListener('click', () => {
    const open = resourceLinks.hidden;
    resourceLinks.hidden = !open;
    resourceToggle.setAttribute('aria-expanded', String(open));
    resourceToggle.setAttribute('aria-label', '무료 자료 하위 메뉴 ' + (open ? '닫기' : '열기'));
  });
  header.addEventListener('click', event => {
    if (event.target.closest('a')) closeMenu();
  });
  document.addEventListener('click', event => {
    if (!header.contains(event.target)) closeMenu();
  });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    if (toggle.getAttribute('aria-expanded') === 'true') {
      closeMenu(); toggle.focus();
    } else if (!resourceLinks.hidden) {
      closeResources(); resourceToggle.focus();
    }
  });
  mobile.addEventListener('change', closeMenu);
  window.addEventListener('pageshow', closeMenu);
  // Only mark exact paths, so cross-page section links do not all appear active.
  links.querySelectorAll('a').forEach(link => {
    const target = new URL(link.href, location.href);
    if (target.pathname === location.pathname && !target.hash) link.setAttribute('aria-current', 'page');
  });
  closeMenu();
})();
