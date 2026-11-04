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
// Track only fixed page categories and element positions, never form values.
function placementFor(link){
  const area=link.closest('section,main,header,footer,.mobile-cta');
  const section=area?.id || (area?.classList.contains('hero')?'hero':area?.classList.contains('mobile-cta')?'mobile_sticky':area?.tagName.toLowerCase() || 'page');
  const peers=Array.from((area || document).querySelectorAll('[data-track],[data-proof]'));
  return section+'_'+(peers.indexOf(link)+1);
}
const measuredLinks=document.querySelectorAll('[data-track],[data-proof]');
measuredLinks.forEach(link=>{
  const eventType=link.dataset.track?'inquiry_cta':'proof';
  const category=link.dataset.track || link.dataset.proof;
  const params={content_type:category,placement:placementFor(link),page_path:location.pathname};
  link.addEventListener('click',()=>{
    if(typeof window.gtag==='function')window.gtag('event',eventType+'_click',{...params,...(link.dataset.track?{inquiry_type:category}:{proof_type:category})});
  });
});
// One impression per visible element per page load; 50% must enter the viewport.
if('IntersectionObserver' in window){
  const measured=new WeakSet();
  const visibility=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if(!entry.isIntersecting || entry.intersectionRatio<0.5 || measured.has(entry.target))return;
      const link=entry.target;
      if(typeof window.gtag!=='function')return;
      window.gtag('event',link.dataset.track?'inquiry_cta_view':'proof_view',{content_type:link.dataset.track || link.dataset.proof,placement:placementFor(link),page_path:location.pathname});
      measured.add(link);visibility.unobserve(link);
    });
  },{threshold:0.5});
  measuredLinks.forEach(link=>visibility.observe(link));
}
