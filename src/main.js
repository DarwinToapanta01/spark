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

        <div class="card-back game-card" id="game-card">
          <div class="card-type-label" id="card-type-label">Verdad</div>
          <div class="card-player" id="card-player">—</div>
          <div class="card-text" id="card-text">Cargando...</div>
          <div class="timer-wrap hidden" id="timer-wrap">
            <div class="timer-ring">
              <svg viewBox="0 0 80 80">
                <circle class="ring-bg" cx="40" cy="40" r="35"/>
                <circle class="ring-progress" id="ring-progress" cx="40" cy="40" r="35"/>
              </svg>
              <div class="timer-number" id="timer-number">30</div>
            </div>
            <button class="btn-timer" id="btn-timer">▶ Iniciar tiempo</button>
          </div>
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

// ── TEMPORIZADOR ──────────────────────────────────────────────
const TIMER_SECONDS = 30
const CIRCUMFERENCE = 2 * Math.PI * 35

let timerInterval = null
let currentCardType = 'verdad'

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
}

function resetTimer() {
  stopTimer()
  const ring = document.getElementById('ring-progress')
  const number = document.getElementById('timer-number')
  const btn = document.getElementById('btn-timer')
  if (!ring) return
  ring.style.strokeDashoffset = 0
  ring.classList.remove('warning', 'danger')
  number.textContent = TIMER_SECONDS
  btn.textContent = '▶ Iniciar tiempo'
  btn.disabled = false
  btn.onclick = () => startTimer()
}

function startTimer() {
  const ring = document.getElementById('ring-progress')
  const number = document.getElementById('timer-number')
  const btn = document.getElementById('btn-timer')

  let remaining = TIMER_SECONDS
  btn.textContent = '⏹ Detener'
  btn.disabled = false

  const unlockActions = () => {
    document.getElementById('card-actions').classList.remove('locked')
  }

  btn.onclick = () => {
    stopTimer()
    number.textContent = '✓'
    btn.textContent = '✅ Completado'
    btn.disabled = true
    btn.onclick = null
    unlockActions()
  }

  timerInterval = setInterval(() => {
    remaining--
    number.textContent = remaining

    const offset = CIRCUMFERENCE * (1 - remaining / TIMER_SECONDS)
    ring.style.strokeDashoffset = offset

    ring.classList.remove('warning', 'danger')
    if (remaining <= 10) ring.classList.add('warning')
    if (remaining <= 5) ring.classList.add('danger')

    if (remaining <= 0) {
      stopTimer()
      number.textContent = '✓'
      btn.textContent = '⏰ ¡Tiempo!'
      btn.disabled = true
      btn.onclick = null
      if (navigator.vibrate) navigator.vibrate([200, 100, 200])
      unlockActions()
    }
  }, 1000)
}

// ── JUEGO ─────────────────────────────────────────────────────
function loadCard() {
  const player = state.players[state.currentTurn % state.players.length]
  state.totalTurns++

  document.getElementById('current-player-name').textContent = player
  document.getElementById('turn-counter').textContent = `Turno ${state.totalTurns}`
  document.getElementById('card-player-front').textContent = player

  // Bloquear botones y resetear flip
  document.getElementById('card-actions').classList.add('locked')
  document.getElementById('card-flipper').classList.remove('flipped')

  // Resetear temporizador
  stopTimer()
  resetTimer()

  const card = getRandomCard()
  if (!card) return
  currentCardType = card.type

  const el = document.getElementById('game-card')
  const typeLabel = document.getElementById('card-type-label')
  const cardText = document.getElementById('card-text')
  const cardPlayer = document.getElementById('card-player')
  const timerWrap = document.getElementById('timer-wrap')

  el.className = 'card-back game-card type-' + card.type
  const labels = { verdad: '✦ Verdad', reto: '⚡ Reto', accion: '⭐ Acción grupal' }
  typeLabel.textContent = labels[card.type] || card.type
  cardPlayer.textContent = player
  cardText.textContent = card.text

  // Mostrar temporizador solo en retos
  timerWrap.classList.toggle('hidden', card.type !== 'reto')
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
  stopTimer()
  showScreen('screen-home')
})

document.getElementById('card-front').addEventListener('click', () => {
  document.getElementById('card-flipper').classList.add('flipped')
  if (currentCardType !== 'reto') {
    document.getElementById('card-actions').classList.remove('locked')
  }
})