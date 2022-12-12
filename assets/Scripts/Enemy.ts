import {
  _decorator,
  Component,
  Node,
  TiledLayer,
  Vec2,
  Graphics,
  Color,
  Vec3,
  UITransform,
  math,
  tween,
  Tween,
} from "cc";
const { ccclass, property } = _decorator;
import PF, { DiagonalMovement, Finder, Heuristic } from "pathfinding";
import { AnimationManager } from "./AnimationManager";
import { PathFinding } from "./PathFinding";

@ccclass("Enemy")
export class Enemy extends Component {

  private _animationManager: AnimationManager;
  private _pathFinding: PathFinding;
  private _isMovingUp = false;
  private _isMovingDown = false;
  private _isMovingLeft = false;
  private _isMovingRight = false;
  private _tween: Tween<Node> = null;
  @property public moveDuration = 0.5;

  start() {
    this._animationManager = this.node.getComponent(AnimationManager);
    this._pathFinding = this.node.getComponent(PathFinding);
  }

  public followTarget(tiledLayerWalkableNode: Node, target: Node) {
    this._pathFinding.setTiledLayerWalkableNode(tiledLayerWalkableNode);
    this._pathFinding.setTarget(target);
    this._pathFinding.init();
    this._startMove();
  }

  _startMove() {
    const position = this._pathFinding.getNextPosition();
    if (position !== null) {
      this._tween = tween(this.node).to(this.moveDuration, { position }, {
        onStart: () => {
          this._setDirection(this.node.getPosition(), position);
          this._animate();
        },
        onComplete: () => {
          this._startMove();
          this._animate();
        },
      }).start();
    } else {}
  }

  private _setDirection(oldPosition: Vec3, newPosition: Vec3) {
    const { x: nextX, y: nextY } = newPosition;
    const { x: currentX, y: currentY } = oldPosition;
    if (nextX > currentX) {
      this._isMovingRight = true;
      this._isMovingLeft = false;
    } else if (nextX < currentX) {
      this._isMovingLeft = true;
      this._isMovingRight = false;
    } else {
      this._isMovingLeft = false;
      this._isMovingRight = false;
    }
    if (nextY > currentY) {
      this._isMovingUp = true;
      this._isMovingDown = false;
    } else if (nextY < currentY) {
      this._isMovingUp = false;
      this._isMovingDown = true;
    } else {
      this._isMovingUp = false;
      this._isMovingDown = false;
    }
  }

  private _animate() {
    if (this._animationManager === undefined) {
      return;
    }
    if (this._isMovingLeft) {
      this._animationManager.playWalkLeft();
    } else if (this._isMovingRight) {
      this._animationManager.playWalkRight();
    } else if (this._isMovingUp) {
      this._animationManager.playWalkUp();
    } else if (this._isMovingDown) {
      this._animationManager.playWalkDown();
    } else {
      this._animationManager.playIdle();
    }
  }

  private goToIdle() {
    this._isMovingUp = false;
    this._isMovingDown = false;
    this._isMovingLeft = false;
    this._isMovingRight = false;
    this._animate();
  }

  public stopMove() {
    if (this._tween !== null) {
      this._tween.stop();
      this.goToIdle();
    }
  }

  public startMove() {
    if (this._tween !== null) {
      this._tween.start();
    }
  }

}
