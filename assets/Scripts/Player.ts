import {
  _decorator,
  Component,
  Vec2,
  RigidBody2D,
} from "cc";
import { AnimationManager } from "./AnimationManager";
const { ccclass, property } = _decorator;
@ccclass("Player")
export class Player extends Component {
  @property
  moveSpeed = 10;
  rigidBody: RigidBody2D;
  velocity = new Vec2(0, 0);
  AnimationManager: AnimationManager;

  public isMovingUp = false;
  public isMovingDown = false;
  public isMovingLeft = false;
  public isMovingRight = false;
  public isFiring = false;

  start() {
    this.rigidBody = this.node.getComponent(RigidBody2D);
    this.AnimationManager = this.node.getComponent(AnimationManager);
  }

  lateUpdate(deltaTime: number) {
    this.move(deltaTime);
  }

  private move(deltaTime: number) {
    if (this.isMovingLeft) {
      this.velocity.x = -1;
    } else if (this.isMovingRight) {
      this.velocity.x = 1;
    } else {
      this.velocity.x = 0;
    }

    if (this.isMovingUp) {
      this.velocity.y = 1;
    } else if (this.isMovingDown) {
      this.velocity.y = -1;
    } else {
      this.velocity.y = 0;
    }

    this.rigidBody.linearVelocity = new Vec2(
      this.velocity.x * deltaTime * this.moveSpeed,
      this.velocity.y * deltaTime * this.moveSpeed
    );
  }

  public animate() {
    if (this.isMovingLeft) {
      this.AnimationManager.playWalkLeft();
    } else if (this.isMovingRight) {
      this.AnimationManager.playWalkRight();
    } else if (this.isMovingUp) {
      this.AnimationManager.playWalkUp();
    } else if (this.isMovingDown) {
      this.AnimationManager.playWalkDown();
    } else {
      this.AnimationManager.playIdle();
    }
  }

  public gamepadMoving(movement: Vec2) {
    this.rigidBody.linearVelocity = movement;
  }

  onFire(inputValue: boolean) {}
}
