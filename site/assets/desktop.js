document.documentElement.classList.add('js');

const windows = [...document.querySelectorAll('.workspace .window')];
const zoomDialog = document.querySelector('#window-zoom');
let zoomedWindow = null;
let zoomPlaceholder = null;
let zoomTrigger = null;

function activateWindow(window) {
  windows.forEach((item) => item.classList.toggle('is-active', item === window));
  document.querySelectorAll('.dock-link[data-window]').forEach((link) => {
    const active = link.dataset.window === window.id;
    link.classList.toggle('is-active', active);
    if (active) link.setAttribute('aria-current', 'true');
    else link.removeAttribute('aria-current');
  });
}

function restoreBody(window) {
  const body = window.querySelector('.window-body');
  if (body) body.hidden = false;
  const button = window.querySelector('[data-action="minimize"]');
  if (button) {
    button.setAttribute('aria-expanded', 'true');
    button.setAttribute('aria-label', `Minimize ${window.querySelector('.window-title').textContent} window`);
    button.title = 'Minimize';
  }
}

function restoreZoom() {
  if (!zoomedWindow || !zoomPlaceholder) return;
  const window = zoomedWindow;
  zoomPlaceholder.replaceWith(window);
  window.querySelector('[data-action="maximize"]').setAttribute('aria-label', `Expand ${window.querySelector('.window-title').textContent} window`);
  window.querySelector('[data-action="maximize"]').title = 'Expand';
  zoomedWindow = null;
  zoomPlaceholder = null;
  if (zoomTrigger?.isConnected) zoomTrigger.focus({ preventScroll: true });
  zoomTrigger = null;
}

zoomDialog?.addEventListener('close', restoreZoom);

document.querySelectorAll('[data-window]').forEach((link) => {
  link.addEventListener('click', (event) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const window = document.getElementById(link.dataset.window);
    if (!window || !windows.includes(window)) return;
    event.preventDefault();
    window.hidden = false;
    restoreBody(window);
    activateWindow(window);
    window.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    history.replaceState(null, '', `#${window.id}`);
    window.querySelector('.window-title').setAttribute('tabindex', '-1');
    window.querySelector('.window-title').focus({ preventScroll: true });
  });
});

windows.forEach((window) => {
  window.addEventListener('pointerdown', () => activateWindow(window));
  window.querySelectorAll('[data-action]').forEach((button) => {
    button.addEventListener('click', () => {
      const action = button.dataset.action;
      const body = window.querySelector('.window-body');
      const name = window.querySelector('.window-title').textContent;
      if (action === 'minimize') {
        body.hidden = !body.hidden;
        button.setAttribute('aria-expanded', String(!body.hidden));
        button.setAttribute('aria-label', `${body.hidden ? 'Restore' : 'Minimize'} ${name} window`);
        button.title = body.hidden ? 'Restore' : 'Minimize';
      }
      if (action === 'close') {
        if (zoomedWindow === window) zoomDialog.close();
        window.hidden = true;
        const link = document.querySelector(`.dock-link[data-window="${window.id}"]`);
        link?.classList.remove('is-active');
        link?.removeAttribute('aria-current');
        (link || document.querySelector('[data-reset]'))?.focus({ preventScroll: true });
      }
      if (action === 'maximize' && zoomDialog) {
        if (zoomedWindow === window) {
          zoomDialog.close();
          return;
        }
        restoreBody(window);
        zoomPlaceholder = document.createComment(`Home position for ${window.id}`);
        window.before(zoomPlaceholder);
        zoomTrigger = button;
        zoomedWindow = window;
        zoomDialog.append(window);
        zoomDialog.setAttribute('aria-label', `${name} — expanded window`);
        button.setAttribute('aria-label', `Restore ${name} window size`);
        button.title = 'Restore size';
        zoomDialog.showModal();
        button.focus();
      }
    });
  });
});

document.querySelectorAll('[data-reset]').forEach((button) => {
  if (!windows.length) {
    button.hidden = true;
    return;
  }
  button.addEventListener('click', () => {
    if (zoomDialog?.open) zoomDialog.close();
    windows.forEach((window) => {
      window.hidden = false;
      restoreBody(window);
    });
    activateWindow(windows[0]);
  });
});

const scenes = {
  teaching: {
    image: 'assets/concepts/teaching-v2.png',
    title: 'Teaching & applied AI',
    caption: 'An imagined classroom scene · AI-generated concept',
    alt: 'AI-generated classroom concept of Thiago beside a Centennial-style COMP308 slide about generative adversarial networks.',
  },
  'castle-talk': {
    image: 'assets/concepts/castle-talk-v2.png',
    title: 'A Castle technology talk',
    caption: 'An imagined talk · AI-generated concept',
    alt: 'AI-generated concept of Thiago in a navy suit and tie speaking beside an applied AI slide with the Castle logo.',
  },
  'games4fun-pitch': {
    image: 'assets/concepts/games4fun-games.png',
    title: 'ORBOLTA & 21 Rifts',
    caption: 'Games4Fun · Game showcase artwork',
    alt: 'Game showcase artwork featuring the ORBOLTA and 21 Rifts logos, without people.',
  },
};

const sceneTabs = [...document.querySelectorAll('[data-scene]')];
function selectScene(button, focus = false) {
  const scene = scenes[button.dataset.scene];
  if (!scene) return;
  sceneTabs.forEach((tab) => {
    tab.setAttribute('aria-selected', String(tab === button));
    tab.tabIndex = tab === button ? 0 : -1;
  });
  const image = document.getElementById('context-image');
  image.src = scene.image;
  image.alt = scene.alt;
  document.getElementById('context-title').textContent = scene.title;
  document.getElementById('context-caption').textContent = scene.caption;
  document.getElementById('context-panel').setAttribute('aria-labelledby', button.id);
  if (focus) button.focus();
}
sceneTabs.forEach((button, index) => {
  button.addEventListener('click', () => selectScene(button));
  button.addEventListener('keydown', (event) => {
    let next;
    if (event.key === 'ArrowRight') next = (index + 1) % sceneTabs.length;
    if (event.key === 'ArrowLeft') next = (index - 1 + sceneTabs.length) % sceneTabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = sceneTabs.length - 1;
    if (next !== undefined) {
      event.preventDefault();
      selectScene(sceneTabs[next], true);
    }
  });
});

const lifePhotos = {
  family: {
    image: 'assets/personal/wedding.jpg',
    alt: 'Thiago and his wife on their wedding day, holding their dog.',
    caption: 'The dog made the announcement.',
    description: 'A favourite photo from our wedding.',
    position: '50% 60%',
  },
  cycling: {
    image: 'assets/personal/cycling.jpg',
    alt: 'Cycling by a tree-lined waterfront.',
    caption: 'Yes, I do go outside.',
    description: 'A little time away from the keyboard.',
    position: '50% 71%',
  },
  games: {
    image: 'assets/personal/games-collection.jpg',
    alt: 'A display cabinet of game consoles, controllers, boxed games, and character figures.',
    caption: 'I kept the old consoles.',
    description: 'And apparently made room for the new ones.',
    position: '50% 38%',
  },
};
document.querySelectorAll('[data-life]').forEach((button) => {
  button.addEventListener('click', () => {
    const photo = lifePhotos[button.dataset.life];
    document.querySelectorAll('[data-life]').forEach((tab) => tab.setAttribute('aria-pressed', String(tab === button)));
    const image = document.getElementById('life-image');
    image.src = photo.image;
    image.alt = photo.alt;
    image.style.objectPosition = photo.position;
    document.getElementById('life-caption').textContent = photo.caption;
    document.getElementById('life-description').textContent = photo.description;
    document.getElementById('life-full').href = photo.image;
  });
});

if (windows.length) {
  const hashWindow = document.getElementById(location.hash.slice(1));
  activateWindow(windows.includes(hashWindow) ? hashWindow : windows[0]);
}
