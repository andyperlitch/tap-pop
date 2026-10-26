import { createAudio } from './audio.js?v=DEV';
import { Game } from './game.js?v=DEV';
import { initUpdatePrompt } from './update.js?v=DEV';

const audio = createAudio();
const game = new Game(document.getElementById('app'), { audio });
game.mount();
window.tapPop = game;
initUpdatePrompt();
