import { _decorator, Component, Node, Animation } from 'cc';
import { Player } from './Player';
const { ccclass, property } = _decorator;

@ccclass('AnimationManager')
export class AnimationManager extends Component {

    animationComponent: Animation = null;
    start() {
        const child = this.node.getChildByName('Sprite');
        this.animationComponent = child.getComponent(Animation);
        const [Idle, WalkDown, WalkUp, WalkLeft, WalkRight] = this.animationComponent.clips;
        const idleState = this.animationComponent.getState(Idle.name);
        console.log(Idle.tracks);
        for (const iterator of Idle.tracks) {
            console.log(iterator.path);
            console.log(iterator.proxy);
            console.log(iterator.range());
            console.log(iterator.channels());
        }

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

