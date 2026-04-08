import './styles/main.css'
import { state, getRandomCard, nextPlayer, addScore, resetGame } from './modules/game.js'

document.querySelector('#app').innerHTML = `
  <p style="color:white;text-align:center;padding:40px"> Spark cargando...</p>
`
console.log('Spark iniciado correctamente')