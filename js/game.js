import {
  INGREDIENTS,
  SPIRITS,
  MIXERS,
  GARNISHES,
  RECIPES,
  RECIPE_BY_ID,
  sameSet,
  mixColor,
} from './data.js?v=DEV';
import { haptic } from './haptics.js?v=DEV';

const SHIFT_MS = 300_000;
const MAX_TICKETS = 4;
const COMBO_WINDOW = 4500;
const HOLD_KEY = 'tap-pop-highscore';
const POUR_MS = 420;
const BATCH_POUR_MS = 180;
const SPECIAL_MS = 5000;

let ticketSeq = 1;

function recipeIconHtml(id, checked) {
  const ing = INGREDIENTS[id];
  return `<span class="ing ${checked ? 'is-checked' : ''}" title="${ing.name}">
    <span class="ing-ico ico-${id}" aria-hidden="true"></span>
    <span class="ing-name">${ing.short}</span>
  </span>`;
}

export class Game {
  constructor(root, { audio }) {
    this.root = root;
    this.audio = audio;
    this.screen = 'start';
    this.raf = 0;
    this.lastTs = 0;
    this.pourUntil = 0;
    this.freezeUntil = 0;
    this.resetRun();
  }

  resetRun() {
    this.score = 0;
    this.combo = 0;
    this.bestCombo = 0;
    this.lastServeAt = 0;
    this.lives = 3;
    this.timeLeft = SHIFT_MS;
    this.tickets = [];
    this.selectedId = null;
    this.glass = [];
    this.spoiled = false;
    this.hold = null;
    this.batchMode = false;
    this.nextSpawnAt = 0;
    this.shiftEndAt = 0;
    this.lastWall = 0;
    this.drinksServed = 0;
    this.specialUsed = false;
    this.floaters = [];
    this.shiftOverReason = null;
    this.dirty = true;
  }

  mount() {
    this.els = {
      score: this.root.querySelector('[data-score]'),
      combo: this.root.querySelector('[data-combo]'),
      lives: this.root.querySelector('[data-lives]'),
      time: this.root.querySelector('[data-time]'),
      tickets: this.root.querySelector('[data-tickets]'),
      backbar: this.root.querySelector('[data-backbar]'),
      mixers: this.root.querySelector('[data-mixers]'),
      garnishes: this.root.querySelector('[data-garnishes]'),
      glass: this.root.querySelector('[data-glass]'),
      fill: this.root.querySelector('[data-fill]'),
      garnishLayer: this.root.querySelector('[data-glass-garnish]'),
      serve: this.root.querySelector('[data-serve]'),
      serveLabel: this.root.querySelector('[data-serve-label]'),
      batchBar: this.root.querySelector('[data-batch-bar]'),
      start: this.root.querySelector('[data-start]'),
      pause: this.root.querySelector('[data-pause]'),
      end: this.root.querySelector('[data-end]'),
      high: this.root.querySelector('[data-high]'),
      muteBtns: this.root.querySelectorAll('[data-mute]'),
    };
    this.buildBar();
    this.bind();
    this.refreshMute();
    this.showHigh();
    this.render(true);
  }

  buildBar() {
    this.els.backbar.innerHTML = SPIRITS.map((id) => {
      const i = INGREDIENTS[id];
      return `<button type="button" class="bottle bottle-${id}" data-ing="${id}" aria-label="${i.name}">
        <span class="bottle-neck"></span>
        <span class="bottle-body"><span class="bottle-label">${i.label}</span></span>
      </button>`;
    }).join('');

    this.els.mixers.innerHTML = MIXERS.map((id) => {
      const i = INGREDIENTS[id];
      return `<button type="button" class="chip" data-ing="${id}" aria-label="${i.name}">
        <span class="ing-ico ico-${id}"></span>
        <span>${i.short}</span>
      </button>`;
    }).join('');

    this.els.garnishes.innerHTML = GARNISHES.map((id) => {
      const i = INGREDIENTS[id];
      return `<button type="button" class="chip chip-g" data-ing="${id}" aria-label="${i.name}">
        <span class="ing-ico ico-${id}"></span>
        <span>${i.short}</span>
      </button>`;
    }).join('');
  }

  bind() {
    this.root.addEventListener('pointerdown', (e) => {
      const btn = e.target.closest('[data-ing]');
      if (!btn) return;
      e.preventDefault();
      this.addIngredient(btn.dataset.ing);
    });

    this.els.tickets.addEventListener('pointerdown', (e) => {
      const card = e.target.closest('[data-ticket]');
      if (!card) return;
      this.selectTicket(card.dataset.ticket);
      this.audio.tap();
      haptic.tap();
    });

    this.els.serve.addEventListener('click', () => this.serve());
    this.root.querySelector('[data-trash]').addEventListener('click', () => this.trash());
    this.root.querySelector('[data-hold]').addEventListener('click', () => this.toggleHold());
    this.root.querySelector('[data-batch]').addEventListener('click', () => this.toggleBatch());
    this.root.querySelector('[data-special]').addEventListener('click', () => this.useSpecial());
    this.root.querySelector('[data-pause-btn]').addEventListener('click', () => this.pause());
    this.root.querySelector('[data-resume]').addEventListener('click', () => this.resume());
    this.root.querySelector('[data-quit]').addEventListener('click', () => this.quitToMenu());
    this.root.querySelector('[data-play]').addEventListener('click', () => this.startShift());
    this.root.querySelector('[data-again]').addEventListener('click', () => this.startShift());
    this.root.querySelector('[data-menu]').addEventListener('click', () => this.quitToMenu());
    this.els.muteBtns.forEach((btn) => btn.addEventListener('click', () => {
      this.audio.toggle();
      this.refreshMute();
    }));
  }

  now() {
    return Date.now();
  }

  bumpDeadlines(ms) {
    if (!ms) return;
    this.shiftEndAt += ms;
    this.nextSpawnAt += ms;
    this.pourUntil += ms;
    this.freezeUntil += ms;
    this.lastServeAt += ms;
    for (const ticket of this.tickets) ticket.expireAt += ms;
    for (const floater of this.floaters) floater.at += ms;
  }

  refreshMute() {
    this.els.muteBtns.forEach((btn) => {
      btn.textContent = this.audio.muted ? 'Sound off' : 'Sound on';
      btn.setAttribute('aria-pressed', this.audio.muted ? 'true' : 'false');
    });
  }

  showHigh() {
    this.els.high.textContent = this.readHigh().toLocaleString();
  }

  readHigh() {
    try {
      return Number(localStorage.getItem(HOLD_KEY) || 0);
    } catch {
      return 0;
    }
  }

  writeHigh(score) {
    try {
      localStorage.setItem(HOLD_KEY, String(score));
    } catch {
      /* ignore */
    }
  }

  startShift() {
    this.resetRun();
    this.screen = 'play';
    const now = this.now();
    this.shiftEndAt = now + SHIFT_MS;
    this.nextSpawnAt = now + 900;
    this.lastWall = now;
    this.spawnTicket();
    this.spawnTicket();
    this.els.start.hidden = true;
    this.els.pause.hidden = true;
    this.els.end.hidden = true;
    this.render(true);
    this.raf = requestAnimationFrame(this.loop);
  }

  pause() {
    if (this.screen !== 'play') return;
    this.screen = 'pause';
    this.pauseAt = this.now();
    this.els.pause.hidden = false;
    cancelAnimationFrame(this.raf);
  }

  resume() {
    if (this.screen !== 'pause') return;
    this.screen = 'play';
    this.els.pause.hidden = true;
    this.bumpDeadlines(this.now() - this.pauseAt);
    this.lastWall = this.now();
    this.raf = requestAnimationFrame(this.loop);
  }

  quitToMenu() {
    this.screen = 'start';
    cancelAnimationFrame(this.raf);
    this.els.pause.hidden = true;
    this.els.end.hidden = true;
    this.els.start.hidden = false;
    this.showHigh();
  }

  endShift(reason) {
    if (this.screen === 'end') return;
    this.screen = 'end';
    cancelAnimationFrame(this.raf);
    const high = this.readHigh();
    const isHigh = this.score > high;
    if (isHigh) this.writeHigh(this.score);
    this.els.end.hidden = false;
    this.els.end.querySelector('[data-end-title]').textContent =
      reason === 'lives' ? 'Walked out' : 'Shift complete';
    this.els.end.querySelector('[data-end-score]').textContent = this.score.toLocaleString();
    this.els.end.querySelector('[data-end-drinks]').textContent = String(this.drinksServed);
    this.els.end.querySelector('[data-end-combo]').textContent = `x${this.bestCombo || 1}`;
    this.els.end.querySelector('[data-end-high]').textContent = isHigh
      ? 'New high score!'
      : `Best ${Math.max(high, this.score).toLocaleString()}`;
  }

  loop = () => {
    if (this.screen !== 'play') return;
    const now = this.now();
    if (document.hidden) {
      this.bumpDeadlines(now - this.lastWall);
      this.lastWall = now;
      this.raf = requestAnimationFrame(this.loop);
      return;
    }
    this.tick(now);
    this.lastWall = now;
    this.render(this.dirty);
    this.dirty = false;
    this.raf = requestAnimationFrame(this.loop);
  };

  difficulty() {
    // t is 0 at the start of a 5-minute shift and 1 at the end.
    // Keep the opening calm; only reach v1's late-shift pressure in the last minute.
    const t = 1 - this.timeLeft / SHIFT_MS;
    return {
      spawn: 9000 - t * 4200,
      patience: 30000 - t * 10000,
    };
  }

  tick(now) {
    this.timeLeft = Math.max(0, this.shiftEndAt - now);
    if (this.timeLeft <= 0) {
      this.endShift('time');
      return;
    }

    if (now < this.freezeUntil) {
      const dt = now - this.lastWall;
      for (const ticket of this.tickets) ticket.expireAt += dt;
    }

    const expired = this.tickets.filter((t) => t.expireAt <= now);
    if (expired.length) {
      this.tickets = this.tickets.filter((t) => t.expireAt > now);
      this.lives -= expired.length;
      this.audio.expire();
      haptic.expire();
      this.combo = 0;
      this.dirty = true;
      if (this.selectedId && !this.tickets.some((t) => t.id === this.selectedId)) {
        this.selectedId = this.tickets[0]?.id || null;
      }
      if (this.lives <= 0) {
        this.lives = 0;
        this.endShift('lives');
        return;
      }
    }

    if (now >= this.nextSpawnAt) {
      if (this.tickets.length < MAX_TICKETS) this.spawnTicket();
      this.nextSpawnAt = now + this.difficulty().spawn;
    }

    this.floaters = this.floaters.filter((f) => now - f.at < 900);
  }

  spawnTicket() {
    const recipe = RECIPES[Math.floor(Math.random() * RECIPES.length)];
    const counts = {};
    for (const t of this.tickets) counts[t.recipeId] = (counts[t.recipeId] || 0) + 1;
    let pick = recipe;
    if ((counts[recipe.id] || 0) >= 3) {
      pick = RECIPES[Math.floor(Math.random() * RECIPES.length)];
    }
    if (this.tickets.length >= 1 && Math.random() < 0.28) {
      const existing = this.tickets[Math.floor(Math.random() * this.tickets.length)];
      pick = RECIPE_BY_ID[existing.recipeId];
    }
    const patience = this.difficulty().patience;
    const ticket = {
      id: `t${ticketSeq++}`,
      recipeId: pick.id,
      expireAt: this.now() + patience,
      maxPatience: patience,
    };
    this.tickets.push(ticket);
    if (!this.selectedId) this.selectedId = ticket.id;
    this.dirty = true;
  }

  selected() {
    return this.tickets.find((t) => t.id === this.selectedId) || this.tickets[0] || null;
  }

  batchMates(ticket = this.selected()) {
    if (!ticket) return [];
    return this.tickets.filter((t) => t.recipeId === ticket.recipeId);
  }

  batchSize() {
    return this.batchMates().length;
  }

  selectTicket(id) {
    this.selectedId = id;
  }

  busy() {
    return this.screen !== 'play' || this.now() < this.pourUntil;
  }

  addIngredient(id) {
    if (this.busy()) return;
    const ticket = this.selected();
    if (!ticket) return;
    const recipe = RECIPE_BY_ID[ticket.recipeId];
    this.audio.tap();
    haptic.tap();

    if (this.spoiled) {
      this.pulse('[data-trash]');
      return;
    }
    if (this.glass.includes(id)) return;

    const pour = this.batchMode && this.batchSize() >= 2 ? BATCH_POUR_MS : POUR_MS;
    this.pourUntil = this.now() + pour;
    this.els.glass.classList.add('is-pouring');
    setTimeout(() => this.els.glass.classList.remove('is-pouring'), pour);
    this.audio.pour();
    haptic.pour();

    if (!recipe.ingredients.includes(id)) {
      this.glass.push(id);
      this.spoiled = true;
      this.audio.spoil();
      haptic.spoil();
      this.combo = 0;
      this.render(true);
      return;
    }
    this.glass.push(id);
    this.render(true);
  }

  trash() {
    if (this.screen !== 'play') return;
    this.glass = [];
    this.spoiled = false;
    this.audio.trash();
    haptic.tap();
    this.render(true);
  }

  toggleHold() {
    if (this.screen !== 'play') return;
    const current = { glass: this.glass, spoiled: this.spoiled };
    if (this.hold) {
      this.glass = this.hold.glass;
      this.spoiled = this.hold.spoiled;
      this.hold = current.glass.length || current.spoiled ? current : null;
    } else {
      if (!this.glass.length && !this.spoiled) return;
      this.hold = current;
      this.glass = [];
      this.spoiled = false;
    }
    this.audio.tap();
    haptic.tap();
    this.render(true);
  }

  toggleBatch() {
    this.batchMode = !this.batchMode;
    this.audio.tap();
    haptic.tap();
    this.render(true);
  }

  useSpecial() {
    if (this.screen !== 'play' || this.specialUsed) return;
    this.specialUsed = true;
    this.freezeUntil = this.now() + SPECIAL_MS;
    this.audio.special();
    haptic.combo();
    this.render(true);
  }

  canServe() {
    const ticket = this.selected();
    if (!ticket || this.spoiled) return false;
    const recipe = RECIPE_BY_ID[ticket.recipeId];
    return sameSet(this.glass, recipe.ingredients);
  }

  serve() {
    if (this.busy() || !this.canServe()) {
      if (this.screen === 'play') this.pulse('[data-serve]');
      return;
    }
    const ticket = this.selected();
    const recipe = RECIPE_BY_ID[ticket.recipeId];
    const now = this.now();
    const mates = this.batchMode ? this.batchMates(ticket) : [ticket];
    const n = mates.length;
    const comboAlive = this.lastServeAt && now - this.lastServeAt < COMBO_WINDOW;
    this.combo = comboAlive ? this.combo + 1 : 1;
    this.bestCombo = Math.max(this.bestCombo, this.combo);
    this.lastServeAt = now;

    let gained = 0;
    for (const mate of mates) {
      const patienceRatio = Math.max(0, (mate.expireAt - now) / mate.maxPatience);
      const tip = Math.round(recipe.base * 0.55 * patienceRatio);
      const batchBonus = n >= 2 ? 1.25 : 1;
      gained += Math.round((recipe.base + tip) * this.combo * batchBonus);
    }
    this.score += gained;
    this.drinksServed += n;
    this.tickets = this.tickets.filter((t) => !mates.includes(t));
    this.selectedId = this.tickets[0]?.id || null;
    this.glass = [];
    this.spoiled = false;
    this.floaters.push({ at: now, text: `+${gained.toLocaleString()}` });
    if (this.combo > 1) {
      this.audio.combo();
      haptic.combo();
    } else {
      this.audio.serve();
      haptic.serve();
    }
    this.render(true);
  }

  pulse(sel) {
    const el = this.root.querySelector(sel);
    el?.classList.remove('pulse');
    void el?.offsetWidth;
    el?.classList.add('pulse');
  }

  render(full) {
    const ticket = this.selected();
    const recipe = ticket ? RECIPE_BY_ID[ticket.recipeId] : null;
    const batchN = this.batchSize();
    const servingBatch = this.batchMode && batchN >= 2;

    this.els.score.textContent = this.score.toLocaleString();
    this.els.combo.textContent = `COMBO x${Math.max(1, this.combo)}`;
    this.els.combo.classList.toggle('hot', this.combo >= 2);
    this.els.lives.innerHTML = Array.from({ length: 3 }, (_, i) =>
      `<span class="life ${i < this.lives ? 'on' : ''}"></span>`
    ).join('');
    const sec = Math.ceil(this.timeLeft / 1000);
    this.els.time.textContent = `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;

    if (full) this.renderTickets();

    const now = this.now();
    for (const card of this.els.tickets.querySelectorAll('[data-ticket]')) {
      const t = this.tickets.find((x) => x.id === card.dataset.ticket);
      if (!t) continue;
      const bar = card.querySelector('.patience span');
      const ratio = Math.max(0, (t.expireAt - now) / t.maxPatience);
      bar.style.transform = `scaleX(${ratio})`;
      card.classList.toggle('urgent', ratio < 0.28);
    }

    const fillPct = this.spoiled ? 88 : Math.min(90, this.glass.length * 18 + (this.glass.length ? 16 : 0));
    this.els.fill.style.height = `${fillPct}%`;
    this.els.fill.style.background = this.spoiled ? '#5a1024' : mixColor(this.glass);
    this.els.glass.classList.toggle('spoiled', this.spoiled);
    this.els.glass.classList.toggle('ready', this.canServe());
    this.els.glass.dataset.glass = recipe?.glass || 'highball';

    const garnishes = this.glass.filter((id) => INGREDIENTS[id].kind === 'garnish');
    this.els.garnishLayer.innerHTML = garnishes.map((id) => `<span class="ing-ico ico-${id}"></span>`).join('');

    this.els.serve.classList.toggle('is-batch', servingBatch);
    this.els.serveLabel.textContent = servingBatch ? 'BATCH POUR' : 'SERVE';
    this.els.serve.disabled = !this.canServe();
    this.els.batchBar.hidden = !servingBatch;
    if (servingBatch) this.els.batchBar.textContent = `BATCH ${batchN}/${batchN}`;

    this.root.querySelector('[data-batch]').classList.toggle('active', this.batchMode);
    this.root.querySelector('[data-special]').classList.toggle('used', this.specialUsed);
    this.root.querySelector('[data-hold]').classList.toggle('active', !!this.hold);
    this.root.querySelector('[data-hold] .hold-dot')?.classList.toggle('on', !!this.hold);

    const floater = this.root.querySelector('[data-floaters]');
    floater.innerHTML = this.floaters
      .map((f) => `<span class="floater" style="animation-delay:${(now - f.at) / -1000}s">${f.text}</span>`)
      .join('');

    this.root.classList.toggle('is-frozen', now < this.freezeUntil);
  }

  renderTickets() {
    const groups = {};
    for (const t of this.tickets) groups[t.recipeId] = (groups[t.recipeId] || 0) + 1;
    this.els.tickets.innerHTML = this.tickets
      .map((t) => {
        const recipe = RECIPE_BY_ID[t.recipeId];
        const selected = t.id === this.selectedId;
        const n = groups[t.recipeId];
        const inBatch = n >= 2;
        const checks = new Set(selected || (this.batchMode && inBatch && recipe.id === this.selected()?.recipeId) ? this.glass : []);
        return `<button type="button" class="ticket ${selected ? 'selected' : ''} ${inBatch ? 'batched' : ''}" data-ticket="${t.id}">
          ${inBatch ? `<span class="batch-badge">x${n} BATCH</span>` : ''}
          <span class="ticket-name">${recipe.name}</span>
          <span class="patience"><span></span></span>
          <span class="ticket-ings">${recipe.ingredients.map((id) => recipeIconHtml(id, checks.has(id) && recipe.ingredients.includes(id) && !this.spoiled)).join('')}</span>
        </button>`;
      })
      .join('');
  }
}
