'use strict';
const menuButton = document.querySelector('[data-menu-toggle]');
const mobileMenu = document.getElementById('mobile-nav');
function closeMenu(){if(!menuButton || !mobileMenu)return;mobileMenu.hidden=true;menuButton.setAttribute('aria-expanded','false');menuButton.textContent='메뉴';}
if(menuButton && mobileMenu){
  menuButton.addEventListener('click',()=>{const open=menuButton.getAttribute('aria-expanded')!=='true';mobileMenu.hidden=!open;menuButton.setAttribute('aria-expanded',String(open));menuButton.textContent=open?'닫기':'메뉴';});
  mobileMenu.addEventListener('click',e=>{if(e.target.closest('a'))closeMenu();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeMenu();menuButton.focus();}});
  window.matchMedia('(min-width:901px)').addEventListener('change',e=>{if(e.matches)closeMenu();});
}
// Only event names and page categories are sent to analytics; never form values.
document.querySelectorAll('[data-track]').forEach(link=>link.addEventListener('click',()=>{
  if(typeof window.gtag==='function')window.gtag('event','inquiry_cta_click',{inquiry_type:link.dataset.track,page_path:location.pathname});
}));
