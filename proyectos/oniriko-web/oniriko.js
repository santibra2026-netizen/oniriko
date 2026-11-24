/* =====================================================
   ONIRIKO · script compartido por todas las páginas
   (index.html, ropa.html, nosotros.html, contacto.html)
===================================================== */

/* ---------- CONFIGURACIÓN — edita aquí ---------- */
const WHATSAPP = '';            // tu número con indicativo, sin + ni espacios. Ej: '573001234567'
const CORREO = '';              // tu correo para el formulario de contacto (FormSubmit). Ej: 'hola@oniriko.co'
const ENVIO = 12000;            // costo de envío
const ENVIO_GRATIS = 250000;    // envío gratis desde este valor

/* Las rutas de imagen son las mismas que usabas en ropa.html.
   Si cambias el nombre de una foto en la carpeta img/, cámbialo aquí también. */
const PRODUCTS = [
  { id:'fragmentos', name:'Chaqueta Fragmentos', cat:'chaquetas', price:180000, size:'L', tag:'Pieza única',
    img:'img/WhatsApp Image 2026-10-21 at 10.22.40 PM.jpeg',
    desc:'Chaqueta intervenida con contrastes textiles y detalles de reconstrucción. Una pieza urbana con una historia propia.' },
  { id:'desfase', name:'Camisa Desfase', cat:'camisas', price:95000, size:'M', tag:'Reconstruida',
    img:'img/camsia.jpeg',
    desc:'Camisa recuperada e intervenida con una composición gráfica asimétrica. Pensada para vestir fuera de lo convencional.' },
  { id:'territorio', name:'Pantalón Territorio', cat:'pantalones', price:145000, size:'32', tag:'Rework',
    img:'img/WhatsApp Image 2026-10-21 at 10.04.07 PM.jpeg',
    desc:'Pantalón intervenido con una estética utilitaria y urbana. Sus detalles y materiales lo vuelven irrepetible.' },
  { id:'memoria', name:'Camisa Memoria', cat:'camisas', price:85000, size:'M', tag:'Pieza única',
    img:'img/camisa blanca.jfif',
    desc:'Prenda recuperada con una nueva identidad visual. Su intervención conserva el carácter de los materiales originales.' },
  { id:'archivo', name:'Chaqueta Archivo', cat:'chaquetas', price:195000, size:'XL', tag:'Edición única',
    img:'img/buzo.jpeg',
    desc:'Chaqueta de carácter experimental, creada combinando prendas y materiales existentes.' },
  { id:'retazo', name:'Accesorio Retazo', cat:'accesorios', price:65000, size:'Única', tag:'Recuperado',
    img:'img/acseosiros.jpeg',
    desc:'Accesorio confeccionado con materiales recuperados. Su mezcla de texturas le da a cada pieza un carácter diferente.' }
];

(function(){
'use strict';

/* ---------- utilidades ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const money = n => '$' + n.toLocaleString('es-CO');
const pad = n => String(n).padStart(2, '0');
const byId = id => PRODUCTS.find(p => p.id === id);
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const restart = (el, c) => { el.classList.remove(c); void el.offsetWidth; el.classList.add(c); };
const CAT = { camisas:'Camisas', chaquetas:'Chaquetas', pantalones:'Pantalones', accesorios:'Accesorios' };
const store = {
  get(k){ try { return JSON.parse(localStorage.getItem(k)) || []; } catch(e){ return []; } },
  set(k, v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch(e){} }
};

/* ---------- imágenes que no cargan: se marca cuál falta ---------- */
function markMissing(img){
  const box = img.parentElement;
  const path = decodeURI(img.getAttribute('src') || '');
  img.style.visibility = 'hidden';
  console.warn('[ONIRIKO] No se encontró la imagen:', path);
  if (!box || box.matches('.logo, .line-thumb')) { if (box && box.matches('.logo')) img.style.display = 'none'; return; }
  { box.classList.add('img-missing'); box.setAttribute('data-missing', path); }
}
document.addEventListener('error', e => { if (e.target.tagName === 'IMG') markMissing(e.target); }, true);
$$('img').forEach(img => { if (img.complete && img.naturalWidth === 0 && img.getAttribute('src')) markMissing(img); });

let cart = store.get('oniriko-cart').filter(byId);
let favs = store.get('oniriko-favs').filter(byId);
let state = { filter:'all', q:'', sort:'default' };
let current = null, lastFocus = null;

/* ---------- capas comunes (se insertan en todas las páginas) ---------- */
document.body.insertAdjacentHTML('beforeend', `
<div class="progress" id="progress"></div>
<div class="overlay" id="overlay"></div>
<div class="modal" id="modal" role="dialog" aria-modal="true" aria-labelledby="mName" aria-hidden="true">
  <div class="modal-card">
    <button class="close" id="mClose" aria-label="Cerrar">×</button>
    <div class="modal-img">
      <img id="mImg" src="" alt="">
      <div class="modal-nav">
        <button id="mPrev" aria-label="Pieza anterior">←</button>
        <button id="mNext" aria-label="Pieza siguiente">→</button>
      </div>
    </div>
    <div class="modal-info">
      <div class="eyebrow rust" id="mTag"></div>
      <h3 id="mName"></h3>
      <div class="price" id="mPrice"></div>
      <p id="mDesc"></p>
      <ul class="detail-list">
        <li><span>Categoría</span><span id="mCat"></span></li>
        <li><span>Talla</span><span id="mSize"></span></li>
        <li><span>Unidades</span><span>1 · no se repite</span></li>
        <li><span>Envío</span><span>Toda Colombia</span></li>
      </ul>
      <div class="modal-actions">
        <button class="btn primary" id="mAdd">Agregar a la bolsa</button>
        <button class="btn" id="mFav" aria-label="Guardar en favoritos">♡</button>
      </div>
    </div>
  </div>
</div>
<aside class="drawer" id="drawer" aria-label="Bolsa de compras" aria-hidden="true">
  <div class="drawer-head">
    <h3>Tu bolsa <span id="dCount" style="color:var(--rust)"></span></h3>
    <button class="close" id="dClose" aria-label="Cerrar bolsa">×</button>
  </div>
  <div class="drawer-body" id="dBody"></div>
  <div class="drawer-foot" id="dFoot">
    <div class="ship-msg" id="shipMsg"></div>
    <div class="ship-bar"><i id="shipBar"></i></div>
    <div class="sum"><span>Subtotal</span><span id="dSub"></span></div>
    <div class="sum"><span>Envío</span><span id="dShip"></span></div>
    <div class="sum total"><span>Total</span><span id="dTotal"></span></div>
    <button class="btn green block" id="checkout">${WHATSAPP ? 'Finalizar pedido por WhatsApp ↗' : 'Finalizar pedido ↗'}</button>
    <p class="drawer-note">Te confirmamos disponibilidad, pago y envío antes de cerrar la compra.</p>
  </div>
</aside>
<div class="toast" id="toast" role="status" aria-live="polite"></div>`);

/* ---------- toast ---------- */
let toastT;
function toast(msg){
  const t = $('#toast'); t.textContent = msg; t.classList.add('on');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 2600);
}

/* ---------- catálogo (solo si la página tiene #products) ---------- */
const grid = $('#products');
const limit = grid ? parseInt(grid.dataset.limit || '0', 10) : 0;

function visible(){
  const q = state.q.trim().toLowerCase();
  let list = PRODUCTS.filter(p =>
    (state.filter === 'all' || (state.filter === 'favoritos' ? favs.includes(p.id) : p.cat === state.filter)) &&
    (!q || (p.name + ' ' + p.cat + ' ' + p.desc).toLowerCase().includes(q)));
  if (state.sort === 'low')  list = list.slice().sort((a,b) => a.price - b.price);
  if (state.sort === 'high') list = list.slice().sort((a,b) => b.price - a.price);
  if (state.sort === 'name') list = list.slice().sort((a,b) => a.name.localeCompare(b.name, 'es'));
  return list;
}

function cardHTML(p, i){
  const inBag = cart.includes(p.id), fav = favs.includes(p.id);
  return `
  <article class="product${reduce ? '' : ' card-in'}" style="--i:${Math.min(i,8)}" data-id="${p.id}">
    <div class="product-visual" data-open>
      <span class="tag">${p.tag}</span>
      <button class="fav${fav ? ' on' : ''}" data-fav aria-pressed="${fav}" aria-label="Guardar ${p.name} en favoritos">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21s-7-4.5-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6c-2.5 4.5-9.5 9-9.5 9z"/></svg>
      </button>
      <img src="${p.img}" alt="${p.name}" loading="lazy">
      <button class="quick${inBag ? ' in' : ''}" data-add>${inBag ? '✓ En tu bolsa' : '+ Agregar a la bolsa'}</button>
    </div>
    <div class="product-info">
      <span class="product-cat">${CAT[p.cat]} / Rework</span>
      <div class="product-name">${p.name}</div>
      <div class="product-meta">
        <span class="price">${money(p.price)}</span>
        <span class="size">Talla ${p.size}</span>
      </div>
      <button class="view" data-open>Ver pieza ↗</button>
    </div>
  </article>`;
}

function render(){
  if (!grid) return;
  let list = visible();
  if (limit) list = list.slice(0, limit);
  grid.innerHTML = list.length ? list.map(cardHTML).join('')
    : `<div class="empty"><b>${state.filter === 'favoritos' ? 'Aún no tienes favoritos.' : 'No encontramos esa pieza.'}</b>
       ${state.filter === 'favoritos' ? 'Toca el ♥ de una prenda para guardarla aquí.' : 'Prueba con otra búsqueda o categoría.'}</div>`;
  const count = $('#count');
  if (count) count.textContent = pad(list.length) + (list.length === 1 ? ' pieza' : ' piezas');
}

function updateFilterCounts(){
  $$('.filter').forEach(b => {
    const f = b.dataset.filter;
    const n = f === 'all' ? PRODUCTS.length : f === 'favoritos' ? favs.length : PRODUCTS.filter(p => p.cat === f).length;
    let sup = b.querySelector('sup'); if (!sup) { sup = document.createElement('sup'); b.appendChild(sup); }
    sup.textContent = n;
  });
}

function setFilter(f){
  state.filter = f;
  $$('.filter').forEach(x => { const on = x.dataset.filter === f; x.classList.toggle('active', on); x.setAttribute('aria-pressed', on); });
  render();
}

if (grid) grid.addEventListener('click', e => {
  const card = e.target.closest('.product'); if (!card) return;
  const id = card.dataset.id;
  if (e.target.closest('[data-fav]')) return toggleFav(id);
  if (e.target.closest('[data-add]')) return addToCart(id);
  if (e.target.closest('[data-open]')) openModal(id);
});
const filters = $('#filters');
if (filters) filters.addEventListener('click', e => { const b = e.target.closest('.filter'); if (b) setFilter(b.dataset.filter); });
const search = $('#search');
let searchT;
if (search) search.addEventListener('input', e => { clearTimeout(searchT); searchT = setTimeout(() => { state.q = e.target.value; render(); }, 180); });
const sort = $('#sort');
if (sort) sort.addEventListener('change', e => { state.sort = e.target.value; render(); });

/* ropa.html?cat=camisas abre con ese filtro */
const urlCat = new URLSearchParams(location.search).get('cat');
if (urlCat && $('.filter[data-filter="' + urlCat + '"]')) state.filter = urlCat;

/* ---------- favoritos ---------- */
function toggleFav(id){
  const had = favs.includes(id);
  favs = had ? favs.filter(x => x !== id) : favs.concat(id);
  store.set('oniriko-favs', favs);
  toast(had ? 'Quitada de favoritos.' : 'Guardada en favoritos ♥');
  refreshBadges(); updateFilterCounts(); syncCard(id);
  if (current === id) syncModal();
  if (state.filter === 'favoritos') render();
}
$('#favBtn').addEventListener('click', () => {
  if (filters) { setFilter('favoritos'); $('#tienda').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); }
  else location.href = 'ropa.html?cat=favoritos#tienda';
});

/* ---------- bolsa ---------- */
function addToCart(id){
  if (cart.includes(id)) { toast('Esta pieza ya está en tu bolsa — es única.'); openDrawer(); return; }
  cart = cart.concat(id); store.set('oniriko-cart', cart);
  toast(byId(id).name + ' agregada a tu bolsa.');
  refreshBadges(); syncCard(id); renderDrawer();
  if (current === id) syncModal();
  if (!reduce) restart($('#bagBtn'), 'bump');
}
function removeFromCart(id){
  cart = cart.filter(x => x !== id); store.set('oniriko-cart', cart);
  refreshBadges(); syncCard(id);
  if (current === id) syncModal();
}
function syncCard(id){
  if (!grid) return;
  const card = grid.querySelector(`[data-id="${id}"]`); if (!card) return;
  const inBag = cart.includes(id), fav = favs.includes(id);
  const q = card.querySelector('.quick');
  q.classList.toggle('in', inBag); q.textContent = inBag ? '✓ En tu bolsa' : '+ Agregar a la bolsa';
  const f = card.querySelector('.fav'); f.classList.toggle('on', fav); f.setAttribute('aria-pressed', fav);
}
function refreshBadges(){
  const b = $('#bagCount'), f = $('#favCount');
  b.textContent = cart.length; b.classList.toggle('on', cart.length > 0);
  f.textContent = favs.length; f.classList.toggle('on', favs.length > 0);
}
const totals = () => {
  const sub = cart.reduce((s, id) => s + byId(id).price, 0);
  const ship = sub >= ENVIO_GRATIS ? 0 : ENVIO;
  return { sub, ship, total: sub + ship };
};
function renderDrawer(){
  const body = $('#dBody'), foot = $('#dFoot');
  $('#dCount').textContent = cart.length ? '(' + cart.length + ')' : '';
  if (!cart.length){
    body.innerHTML = `<div class="drawer-empty"><b>Tu bolsa está vacía.</b>Cada pieza es única: si te gusta una, no la dejes ir.
      <br><a href="ropa.html" class="btn primary">Ver la tienda ↘</a></div>`;
    foot.style.display = 'none'; return;
  }
  foot.style.display = '';
  body.innerHTML = cart.map((id, i) => { const p = byId(id); return `
    <div class="line-item" style="animation-delay:${i * 60}ms" data-id="${id}">
      <div class="line-thumb"><img src="${p.img}" alt=""></div>
      <div><h4>${p.name}</h4><small>${CAT[p.cat]} · Talla ${p.size}</small><span class="price">${money(p.price)}</span></div>
      <button class="remove" data-remove>Quitar</button>
    </div>`; }).join('');
  const t = totals();
  $('#dSub').textContent = money(t.sub);
  $('#dShip').textContent = t.ship ? money(t.ship) : 'Gratis';
  $('#dTotal').textContent = money(t.total);
  $('#shipBar').style.width = Math.min(100, t.sub / ENVIO_GRATIS * 100) + '%';
  $('#shipMsg').textContent = t.ship ? 'Te faltan ' + money(ENVIO_GRATIS - t.sub) + ' para envío gratis.' : '¡Tienes envío gratis!';
}
$('#dBody').addEventListener('click', e => {
  const btn = e.target.closest('[data-remove]'); if (!btn) return;
  const row = btn.closest('.line-item'), id = row.dataset.id;
  row.classList.add('leaving');
  setTimeout(() => { removeFromCart(id); renderDrawer(); }, reduce ? 0 : 280);
});
function orderText(){
  const t = totals();
  return 'Hola ONIRIKO, quiero comprar estas piezas:\n' +
    cart.map(id => { const p = byId(id); return '• ' + p.name + ' (talla ' + p.size + ') — ' + money(p.price); }).join('\n') +
    '\n\nSubtotal: ' + money(t.sub) + '\nEnvío: ' + (t.ship ? money(t.ship) : 'gratis') + '\nTotal: ' + money(t.total) + '\n\n¿Siguen disponibles?';
}
$('#checkout').addEventListener('click', () => {
  if (!cart.length) return;
  if (WHATSAPP) window.open('https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(orderText()), '_blank', 'noopener');
  else location.href = 'contacto.html?pedido=1#formulario';
});

/* ---------- modal y bolsa ---------- */
const modal = $('#modal'), drawer = $('#drawer'), overlay = $('#overlay');
function lock(on){ overlay.classList.toggle('on', on); document.body.classList.toggle('locked', on); }
function openModal(id){
  current = id; lastFocus = document.activeElement; fillModal();
  modal.classList.add('on'); modal.setAttribute('aria-hidden', 'false'); lock(true);
  setTimeout(() => $('#mClose').focus(), 50);
}
function fillModal(){
  const p = byId(current), img = $('#mImg');
  img.parentElement.classList.remove('img-missing'); img.style.visibility = '';
  img.src = p.img; img.alt = p.name;
  $('#mTag').textContent = p.tag + ' / ONIRIKO';
  $('#mName').textContent = p.name;
  $('#mPrice').textContent = money(p.price);
  $('#mDesc').textContent = p.desc;
  $('#mCat').textContent = CAT[p.cat];
  $('#mSize').textContent = p.size;
  syncModal();
}
function syncModal(){
  const inBag = cart.includes(current), fav = favs.includes(current), add = $('#mAdd');
  add.textContent = inBag ? '✓ Ver en la bolsa' : 'Agregar a la bolsa';
  add.classList.toggle('green', inBag); add.classList.toggle('primary', !inBag);
  $('#mFav').textContent = fav ? '♥' : '♡';
  $('#mFav').style.color = fav ? 'var(--rust)' : '';
}
function stepModal(dir){
  const list = grid && visible().length ? visible() : PRODUCTS;
  let i = list.findIndex(p => p.id === current);
  current = list[(i + dir + list.length) % list.length].id;
  const card = $('.modal-card');
  if (reduce) return fillModal();
  card.style.opacity = .4; setTimeout(() => { fillModal(); card.style.opacity = ''; }, 150);
}
function openDrawer(){
  modal.classList.remove('on'); modal.setAttribute('aria-hidden', 'true');
  lastFocus = lastFocus || document.activeElement;
  renderDrawer();
  drawer.classList.add('on'); drawer.setAttribute('aria-hidden', 'false'); lock(true);
  setTimeout(() => $('#dClose').focus(), 50);
}
function closeAll(){
  modal.classList.remove('on'); modal.setAttribute('aria-hidden', 'true');
  drawer.classList.remove('on'); drawer.setAttribute('aria-hidden', 'true');
  lock(false); current = null;
  if (lastFocus && lastFocus.focus) lastFocus.focus();
  lastFocus = null;
}
$('#mClose').addEventListener('click', closeAll);
$('#dClose').addEventListener('click', closeAll);
overlay.addEventListener('click', closeAll);
modal.addEventListener('click', e => { if (e.target === modal) closeAll(); });
$('#mPrev').addEventListener('click', () => stepModal(-1));
$('#mNext').addEventListener('click', () => stepModal(1));
$('#mAdd').addEventListener('click', () => cart.includes(current) ? openDrawer() : addToCart(current));
$('#mFav').addEventListener('click', () => toggleFav(current));
$('#bagBtn').addEventListener('click', openDrawer);
$$('[data-open-piece]').forEach(b => b.addEventListener('click', () => openModal(b.dataset.openPiece)));
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeAll();
  if (modal.classList.contains('on')) { if (e.key === 'ArrowRight') stepModal(1); if (e.key === 'ArrowLeft') stepModal(-1); }
});

/* ---------- menú móvil ---------- */
const menuBtn = $('#menuBtn'), mobileMenu = $('#mobileMenu');
menuBtn.addEventListener('click', () => { const o = mobileMenu.classList.toggle('open'); menuBtn.setAttribute('aria-expanded', o); });
$$('a', mobileMenu).forEach(a => a.addEventListener('click', () => { mobileMenu.classList.remove('open'); menuBtn.setAttribute('aria-expanded', false); }));

/* ---------- formularios ---------- */
const quick = $('#contactForm');   // formulario corto del inicio
if (quick) quick.addEventListener('submit', e => { e.preventDefault(); e.target.reset(); toast('Mensaje enviado. Gracias por escribirnos.'); });

const full = $('#fullForm');       // formulario de contacto.html
if (full) {
  if (CORREO) { full.action = 'https://formsubmit.co/' + CORREO; full.method = 'POST'; }
  const params = new URLSearchParams(location.search);
  if (params.get('pedido') && cart.length) {
    $('#asunto').value = 'Pedido';
    $('#mensaje').value = orderText();
  }
  full.addEventListener('submit', e => {
    if (CORREO) return;               // se envía de verdad a FormSubmit
    e.preventDefault(); e.target.reset();
    toast('Mensaje listo. Configura CORREO en oniriko.js para recibirlo.');
  });
}

/* ---------- animaciones de entrada ---------- */
function splitLines(h){
  const lines = [[]];
  Array.from(h.childNodes).forEach(n => {
    if (n.nodeName === 'BR') lines.push([]);
    else if (!(n.nodeType === 3 && !n.textContent.trim())) lines[lines.length - 1].push(n);
  });
  h.setAttribute('aria-label', h.textContent.replace(/\s+/g, ' ').trim());
  h.textContent = '';
  lines.forEach((nodes, i) => {
    if (!nodes.length) return;
    const o = document.createElement('span'), inn = document.createElement('span');
    o.className = 'line'; o.setAttribute('aria-hidden', 'true'); inn.style.setProperty('--i', i);
    nodes.forEach(n => inn.appendChild(n)); o.appendChild(inn); h.appendChild(o);
  });
}
if (!reduce && 'IntersectionObserver' in window){
  document.documentElement.classList.add('js');
  $$('.split').forEach(splitLines);
  $$('.reveal').forEach(el => {
    if (el.style.getPropertyValue('--i')) return;
    const sibs = Array.from(el.parentNode.children).filter(c => c.classList.contains('reveal'));
    el.style.setProperty('--i', Math.min(sibs.indexOf(el), 5));
  });
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: .15, rootMargin: '0px 0px -8% 0px' });
  $$('.split, .reveal, .hero').forEach(el => io.observe(el));
  setTimeout(() => $$('.split, .reveal, .hero').forEach(el => el.classList.add('in')), 4000);
}

/* ---------- progreso + navegación ---------- */
const bar = $('#progress'), nav = $('.nav');
const sections = $$('main section[id]');
const hashLinks = $$('.navlinks a[href^="#"]');
let lastY = scrollY, ticking = false;
addEventListener('scroll', () => {
  if (ticking) return; ticking = true;
  requestAnimationFrame(() => {
    const y = scrollY, h = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = 'scaleX(' + (h > 0 ? y / h : 0) + ')';
    if (!mobileMenu.classList.contains('open')) {
      if (y > lastY + 4 && y > 200) nav.classList.add('hide');
      else if (y < lastY - 4 || y < 200) nav.classList.remove('hide');
    }
    if (hashLinks.length && sections.length) {
      let cur = sections[0].id;
      sections.forEach(s => { if (s.getBoundingClientRect().top < innerHeight * .4) cur = s.id; });
      hashLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + cur));
    }
    lastY = y; ticking = false;
  });
}, { passive: true });

/* ---------- inicio ---------- */
$$('[data-stat="pieces"]').forEach(el => el.textContent = pad(PRODUCTS.length));
if (state.filter !== 'all') setFilter(state.filter); else render();
updateFilterCounts();
refreshBadges();
renderDrawer();
})();
