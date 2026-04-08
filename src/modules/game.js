import { cards } from './cards.js'

export const state = {
    mode: 'fiesta',
    level: 1,
    players: [],
    scores: {},
    currentTurn: 0,
    totalTurns: 0,
}

export function getRandomCard() {
    const pool = cards[state.mode][state.level]
    return pool[Math.floor(Math.random() * pool.length)]
}

export function nextPlayer() {
    state.currentTurn = (state.currentTurn + 1) % state.players.length
}

export function addScore(playerName) {
    state.scores[playerName] = (state.scores[playerName] || 0) + 1
}

export function resetGame() {
    state.currentTurn = 0
    state.totalTurns = 0
    state.players.forEach(p => state.scores[p] = 0)
}