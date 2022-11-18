import { _decorator, Component, Node, Animation } from 'cc';
import { Player } from './Player';
const { ccclass, property } = _decorator;

@ccclass('AnimationManager')
export class AnimationManager extends Component {

    animationComponent: Animation = null;
    start() {
        const child = this.node.getChildByName('Sprite');
        this.animationComponent = child.getComponent(Animation);
    }

    public playIdle() {
        this.animationComponent.play('Idle');
    }

    public playWalkDown() {
        this.animationComponent.play('WalkDown');
    }

    public playWalkUp() {
        this.animationComponent.play('WalkUp');
    }

    public playWalkLeft() {
        this.animationComponent.play('WalkLeft');
    }

    public playWalkRight() {
        this.animationComponent.play('WalkRight');
    }

}

