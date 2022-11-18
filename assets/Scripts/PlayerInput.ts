import {
  _decorator,
  Component,
  EventKeyboard,
  input,
  Input,
  Node,
  EventGamepad,
  KeyCode,
  v2,
  director,
} from "cc";
const { ccclass, property } = _decorator;
import { Player } from "./Player";

@ccclass("PlayerInput")
export class PlayerInput extends Component {
  @property gamepadDeadZone = 0.2;
  player: Player;
  onLoad() {
    input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
    input.on(Input.EventType.KEY_UP, this.onKeyUp, this);
    input.on(Input.EventType.GAMEPAD_INPUT, this.gamepadInput, this);
  }

  start() {
    this.player = this.node.getComponent(Player);
  }

  onKeyDown(event: EventKeyboard) {
    switch (event.keyCode) {
      case KeyCode.ARROW_LEFT:
        this.player.isMovingLeft = true;
        break;
      case KeyCode.ARROW_RIGHT:
        this.player.isMovingRight = true;
        break;
      case KeyCode.ARROW_UP:
        this.player.isMovingUp = true;
        break;
      case KeyCode.ARROW_DOWN:
        this.player.isMovingDown = true;
        break;
      case KeyCode.SPACE:
        this.player.isFiring = true;
    }
    this.player.animate();
  }

  onKeyUp(event: EventKeyboard) {
    switch (event.keyCode) {
      case KeyCode.ARROW_LEFT:
        this.player.isMovingLeft = false;
        break;
      case KeyCode.ARROW_RIGHT:
        this.player.isMovingRight = false;
        break;
      case KeyCode.ARROW_UP:
        this.player.isMovingUp = false;
        break;
      case KeyCode.ARROW_DOWN:
        this.player.isMovingDown = false;
        break;
      case KeyCode.SPACE:
        this.player.isFiring = false;
        break;
    }
    this.player.animate();
  }

  gamepadInput(e: EventGamepad) {
    const gp = e.gamepad;
    const a = gp.buttonSouth.getValue();
    const { x, y } = gp.leftStick.getValue();
    if (a === 1) this.player.isFiring = true;
    if (a === 0) this.player.isFiring = false;
    if (x !== 0 || y !== 0) {
      const xDir = x > this.gamepadDeadZone || x < -this.gamepadDeadZone ? x : 0;
      const yDir = y > this.gamepadDeadZone || y < -this.gamepadDeadZone ? y : 0;
      this.player.gamepadMoving(v2(xDir, yDir));
    }
  }

}
