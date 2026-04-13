import './styles/main.css'
import { state, getRandomCard, nextPlayer, addScore, resetGame } from './modules/game.js'

const app = document.querySelector('#app')

app.innerHTML = `
  <div id="screen-home" class="screen active">
    <div class="logo">
      <h1>Spark</h1>
      <p>El juego que enciende la noche</p>
    </div>

    <div class="section-label">Modo de juego</div>
    <div class="mode-grid">
      <div class="mode-card selected" id="mode-fiesta" onclick="selectMode('fiesta')">
        <div class="mode-icon">🎉</div>
        <div class="mode-name">Fiesta</div>
        <div class="mode-desc">Grupos de amigos</div>
      </div>
      <div class="mode-card" id="mode-pareja" onclick="selectMode('pareja')">
        <div class="mode-icon">💑</div>
        <div class="mode-name">Parejas</div>
        <div class="mode-desc">Solo para dos</div>
      </div>
    </div>

    <div class="section-label">Intensidad</div>
    <div class="level-tabs">
      <div class="level-tab active l1" onclick="selectLevel(1, this)">😊 Suave</div>
      <div class="level-tab l2" onclick="selectLevel(2, this)">🔥 Picante</div>
      <div class="level-tab l3" onclick="selectLevel(3, this)">💋 Atrevido</div>
    </div>

    <div class="section-label">Jugadores</div>
    <div class="player-input-row">
      <input type="text" id="player-input" placeholder="Nombre del jugador..." maxlength="20" />
      <button class="btn-add" id="btn-add-player">+</button>
    </div>
    <div id="players-list"></div>

    <button class="btn-primary" id="btn-start" disabled>Iniciar juego</button>
  </div>

  <div id="screen-game" class="screen">
    <div class="game-header">
      <button class="btn-back" id="btn-back">&#8592;</button>
      <div class="turn-badge">Turno de <span id="current-player-name">—</span></div>
      <div class="turn-counter" id="turn-counter">Turno 1</div>
    </div>

    <div class="card-wrap">
      <div class="card-flipper" id="card-flipper">

        <div class="card-front" id="card-front">
          <div class="card-front-icon">🂠</div>
          <div class="card-player" id="card-player-front">—</div>
          <div class="card-front-hint">Toca para revelar</div>
        </div>

        <div class="card-back" id="game-card">
          <div class="card-type-label" id="card-type-label">Verdad</div>
          <div class="card-player" id="card-player">—</div>
          <div class="card-text" id="card-text">Cargando...</div>
        </div>

      </div>
    </div>

    <div class="card-actions locked" id="card-actions">
      <button class="btn-skip" id="btn-skip">Saltar</button>
      <button class="btn-next" id="btn-next">Completado ✓</button>
    </div>

    <div id="scoreboard"></div>
  </div>
`

// ── PANTALLAS ─────────────────────────────────────────────────
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'))
  document.getElementById(id).classList.add('active')
}

// ── MODO ──────────────────────────────────────────────────────
window.selectMode = function (mode) {
  state.mode = mode
  document.querySelectorAll('.mode-card').forEach(c => c.classList.remove('selected'))
  document.getElementById('mode-' + mode).classList.add('selected')
  checkStart()
}

// ── NIVEL ─────────────────────────────────────────────────────
window.selectLevel = function (lvl, el) {
  state.level = lvl
  document.querySelectorAll('.level-tab').forEach(t => t.classList.remove('active'))
  el.classList.add('active')
}

// ── JUGADORES ─────────────────────────────────────────────────
function renderPlayers() {
  const list = document.getElementById('players-list')
  list.innerHTML = state.players.map(p => `
    <div class="player-chip">
      <span>${p}</span>
      <button onclick="removePlayer('${p}')">×</button>
    </div>
  `).join('')
}

window.removePlayer = function (name) {
  state.players = state.players.filter(p => p !== name)
  delete state.scores[name]
  renderPlayers()
  checkStart()
}

function addPlayer() {
  const input = document.getElementById('player-input')
  const name = input.value.trim()
  if (!name || state.players.includes(name)) { input.value = ''; return }
  if (state.mode === 'pareja' && state.players.length >= 2) { input.value = ''; return }
  state.players.push(name)
  state.scores[name] = 0
  input.value = ''
  renderPlayers()
  checkStart()
}

function checkStart() {
  document.getElementById('btn-start').disabled = state.players.length < 2
}

document.getElementById('btn-add-player').addEventListener('click', addPlayer)
document.getElementById('player-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') addPlayer()
})

// ── JUEGO ─────────────────────────────────────────────────────
function loadCard() {
  const player = state.players[state.currentTurn % state.players.length]
  state.totalTurns++

  document.getElementById('current-player-name').textContent = player
  document.getElementById('turn-counter').textContent = `Turno ${state.totalTurns}`
  document.getElementById('card-player-front').textContent = player

  document.getElementById('card-actions').classList.add('locked')
  document.getElementById('card-flipper').classList.remove('flipped')

  const card = getRandomCard()
  if (!card) return

  const el = document.getElementById('game-card')
  const labels = { verdad: '✦ Verdad', reto: '⚡ Reto', accion: '⭐ Acción grupal' }

  el.className = 'card-back type-' + card.type
  document.getElementById('card-type-label').textContent = labels[card.type] || card.type
  document.getElementById('card-player').textContent = player
  document.getElementById('card-text').textContent = card.text
}

function renderScoreboard() {
  const sb = document.getElementById('scoreboard')
  if (state.totalTurns < 2) { sb.innerHTML = ''; return }
  const sorted = [...state.players].sort((a, b) => (state.scores[b] || 0) - (state.scores[a] || 0))
  sb.innerHTML = `
    <div class="section-label" style="margin-top:24px">Puntuación</div>
    ${sorted.map((p, i) => `
      <div class="score-row">
        <span class="score-name">${i === 0 ? '👑 ' : ''}${p}</span>
        <span class="score-pts">${state.scores[p] || 0} pts</span>
      </div>
    `).join('')}
  `
}

// ── EVENTOS ───────────────────────────────────────────────────
document.getElementById('btn-start').addEventListener('click', () => {
  resetGame()
  showScreen('screen-game')
  loadCard()
})

document.getElementById('btn-next').addEventListener('click', () => {
  const player = state.players[state.currentTurn % state.players.length]
  addScore(player)
  nextPlayer()
  renderScoreboard()
  loadCard()
})

document.getElementById('btn-skip').addEventListener('click', () => {
  nextPlayer()
  loadCard()
})

document.getElementById('btn-back').addEventListener('click', () => {
  showScreen('screen-home')
})

document.getElementById('card-front').addEventListener('click', () => {
  document.getElementById('card-flipper').classList.add('flipped')
  document.getElementById('card-actions').classList.remove('locked')
})