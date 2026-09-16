// Demo layout: no exchange or wallet API connections.
const toggle = document.querySelector('.sidebar-toggle');
toggle.addEventListener('click', () => {
  const collapsed = document.body.classList.toggle('menu-collapsed');
  toggle.setAttribute('aria-expanded', String(!collapsed));
  toggle.setAttribute('aria-label', collapsed ? 'Развернуть меню' : 'Свернуть меню');
});
