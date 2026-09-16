const searchInput = document.querySelector('#game-search');
const notice = document.querySelector('.notice');
let noticeTimeout;
const searchForm = document.querySelector('.search-shell');
const suggestionsPanel = document.querySelector('.suggestions-panel');
const suggestionsList = document.querySelector('.suggestions-list');
const searchBackdrop = document.querySelector('.search-backdrop');
const emptySuggestions = document.querySelector('.suggestions-empty');
// Local demo data matching the supplied Figma state, not a live game catalog.
const demoGames = ['World of warcraft', 'World of Warships', 'World of Tanks', 'World War Z: Aftermath', 'Wolfenstein'];
let matches = [];
let activeIndex = -1;

function closeSuggestions() {
  searchForm.classList.remove('is-open');
  suggestionsPanel.hidden = true;
  searchBackdrop.hidden = true;
  searchInput.setAttribute('aria-expanded', 'false');
  searchInput.removeAttribute('aria-activedescendant');
  activeIndex = -1;
}

function showSuggestions() {
  const query = searchInput.value.trim().toLowerCase();
  if (!query) { matches = []; closeSuggestions(); return; }
  matches = demoGames.filter(name => name.toLowerCase().includes(query));
  activeIndex = -1;
  searchInput.removeAttribute('aria-activedescendant');
  suggestionsList.replaceChildren();
  matches.forEach((name, index) => {
    const option = document.createElement('li');
    option.id = `game-option-${index}`;
    option.setAttribute('role', 'option');
    option.setAttribute('aria-selected', 'false');
    option.className = 'suggestion';
    const icon = document.createElement('img');
    icon.src = 'assets/imgSearch.svg';
    icon.alt = '';
    icon.width = icon.height = 24;
    const label = document.createElement('span');
    const start = name.toLowerCase().indexOf(query);
    const highlight = document.createElement('mark');
    highlight.textContent = name.slice(start, start + query.length);
    label.append(name.slice(0, start), highlight, name.slice(start + query.length));
    option.append(icon, label);
    option.addEventListener('mousedown', event => event.preventDefault());
    option.addEventListener('click', () => selectSuggestion(index));
    suggestionsList.append(option);
  });
  emptySuggestions.hidden = matches.length > 0;
  searchForm.classList.add('is-open');
  suggestionsPanel.hidden = false;
  searchBackdrop.hidden = false;
  searchInput.setAttribute('aria-expanded', 'true');
}

function selectSuggestion(index) {
  const game = matches[index];
  if (!game) return;
  searchInput.value = game;
  closeSuggestions();
  searchInput.focus({ preventScroll: true });
  closeSuggestions();
  const request = new CustomEvent('kupidonat:search', { detail: { query: game }, cancelable: true });
  if (window.dispatchEvent(request)) announce(`Выбрано: ${game}`);
}

searchInput.addEventListener('input', showSuggestions);
searchInput.addEventListener('focus', () => { if (searchInput.value.trim()) showSuggestions(); });
searchInput.addEventListener('keydown', event => {
  if (event.isComposing) return;
  if (event.key === 'Escape') { closeSuggestions(); return; }
  if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
  event.preventDefault();
  if (suggestionsPanel.hidden) showSuggestions();
  if (!matches.length) return;
  activeIndex = event.key === 'ArrowDown' ? (activeIndex + 1) % matches.length : (activeIndex <= 0 ? matches.length - 1 : activeIndex - 1);
  [...suggestionsList.children].forEach((option, index) => option.setAttribute('aria-selected', String(index === activeIndex)));
  searchInput.setAttribute('aria-activedescendant', `game-option-${activeIndex}`);
  suggestionsList.children[activeIndex].scrollIntoView({ block: 'nearest' });
});
searchBackdrop.addEventListener('click', closeSuggestions);
searchForm.addEventListener('focusout', event => { if (!searchForm.contains(event.relatedTarget)) closeSuggestions(); });
document.querySelector('.clear-search').addEventListener('click', () => {
  searchInput.value = '';
  matches = [];
  suggestionsList.replaceChildren();
  closeSuggestions();
  searchInput.focus({ preventScroll: true });
});

function announce(message) {
  clearTimeout(noticeTimeout);
  notice.textContent = message;
  notice.hidden = false;
  noticeTimeout = setTimeout(() => { notice.hidden = true; }, 5500);
}

document.querySelector('.quick-search').addEventListener('click', () => {
  searchInput.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  searchInput.focus({ preventScroll: true });
});

// This handoff includes one screen. Real routes and a game catalog can be
// connected through these events without changing its presentation.
searchForm.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!suggestionsPanel.hidden && matches.length) { selectSuggestion(activeIndex < 0 ? 0 : activeIndex); return; }
  const query = searchInput.value.trim();
  if (!query) { searchInput.value = ''; searchInput.reportValidity(); return; }
  const request = new CustomEvent('kupidonat:search', { detail: { query }, cancelable: true });
  if (window.dispatchEvent(request)) announce('Поиск игр пока недоступен.');
});

document.querySelectorAll('[data-pending]').forEach((button) => {
  button.addEventListener('click', () => {
    const destination = button.dataset.pending;
    const request = new CustomEvent('kupidonat:navigate', { detail: { destination }, cancelable: true });
    if (window.dispatchEvent(request)) announce(`${destination}: раздел пока недоступен.`);
  });
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') notice.hidden = true;
});
