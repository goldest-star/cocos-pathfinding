import {
  _decorator,
  Component,
  Graphics,
  Node,
  TiledObjectGroup,
  Vec2,
  UITransform,
  Vec3,
  Color,
  Prefab,
  instantiate,
} from "cc";
const { ccclass, property } = _decorator;
import { EnemyBehavior } from "./EnemyBehavior";

export interface TiledObject {
  id: string;
  name: string;
  width: number;
  height: number;
  x: number;
  y: number;
  rotation: number;
  visible: boolean;
  type: number;
  offset: Offset;
}

export interface Offset {
  x: number;
  y: number;
}

const PATH_FILL_COLOR = new Color(0, 0, 255, 128);

@ccclass("EnemyManager")
export class EnemyManager extends Component {
  @property({ type: Node }) spawnPointObjectLayer: Node = null;
  @property({ type: Node }) WalkableTiledLayer: Node = null;
  @property({ type: Node }) Target: Node = null;
  tiledObjectGroup: TiledObjectGroup = null;
  enememySpawnPoints: Vec3[] = [];
  uitransform: UITransform = null;
  debugGraphic: Graphics | null = null;
  @property({ type: Prefab }) enemyPrefab: Prefab = null;
  @property debug = false;

  start() {
    this.tiledObjectGroup = this.spawnPointObjectLayer.getComponent(TiledObjectGroup);
    this.uitransform = this.node.getComponent(UITransform);
    this.tiledObjectGroup.getObjects().forEach((object) => {
      const tiledObject = object as TiledObject;
      console.log(tiledObject);
      const point = this.spawnPointToWorldPosition(tiledObject);
      this.enememySpawnPoints.push(point);
    });
    if (this.debug) {
      this.createDebugLayer();
      this.creteSpawnPointDebug();
    }
    this.schedule(this.spawnEnemy, 1);
  }

  public spawnEnemy() {
    const enemy = instantiate(this.enemyPrefab);
    const enemyBehavior = enemy.getComponent(EnemyBehavior);
    console.log(enemyBehavior);
    enemyBehavior.setTarget(this.Target);
    enemyBehavior.setTiledLayerNode(this.WalkableTiledLayer);
    enemyBehavior.setDebug(this.debug);
    enemyBehavior.setMoveDuration(0.3);
    const spawnPoint = this.enememySpawnPoints.at(Math.random() * this.enememySpawnPoints.length);
    enemy.setPosition(spawnPoint);
    const canvas = this.node.parent;
    canvas.addChild(enemy);
    enemyBehavior.init();
}

  spawnPointToWorldPosition(spawnPoint: TiledObject) {
    const { height } = spawnPoint;
    const position = new Vec3(spawnPoint.x, spawnPoint.y - height, 0);
    const worldPosition = this.uitransform.convertToNodeSpaceAR(position);
    return worldPosition;
  }

  createDebugLayer() {
    const canvas = this.node.parent;
    const node = new Node();
    canvas.addChild(node);
    const tiledLayerWorldPosition = this.node.parent.getWorldPosition();
    const position = this.uitransform.convertToNodeSpaceAR(
      tiledLayerWorldPosition
    );
    node.setPosition(position);
    node.layer = canvas.layer;
    this.debugGraphic = node.addComponent(Graphics);
  }

  creteSpawnPointDebug() {
    this.enememySpawnPoints.forEach((spawnPoint) => {
      this.debugGraphic.fillColor = PATH_FILL_COLOR;
      this.debugGraphic.rect(spawnPoint.x, spawnPoint.y, 16, 16);
      this.debugGraphic.fill();
    });
  }
}
