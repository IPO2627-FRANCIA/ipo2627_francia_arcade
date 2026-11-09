import { CanvasView } from './view/CanvasView.js';
import { HudView } from './view/HudView.js';
import { OverlayView } from './view/OverlayView.js';
import { KeyboardView } from './view/KeyboardView.js';
import { GameController } from './controller/GameController.js';

const controller = new GameController({
  canvas: new CanvasView(document.getElementById('appCanvas')),
  hud: new HudView(),
  overlay: new OverlayView(),
  keyboard: new KeyboardView(),
});

controller.start();
