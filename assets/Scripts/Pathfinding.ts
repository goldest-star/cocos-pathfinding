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
} from "cc";
const { ccclass, property } = _decorator;
import PF, { DiagonalMovement, Finder, Heuristic } from "pathfinding";

declare module "pathfinding" {
  interface FinderOptions extends Heuristic {
    diagonalMovement?: DiagonalMovement;
    weight?: number;
    allowDiagonal?: boolean;
    dontCrossCorners?: boolean;
  }

  interface AStarFinder extends Finder {
    new (): AStarFinder;
    new (opt: FinderOptions): AStarFinder;
  }
}

const BLOCKED = 1;
const WALKABLE = 0;
const BLOCKED_FILL_COLOR = new Color(255, 0, 0, 128);
const WALKABLE_FILL_COLOR = new Color(0, 255, 0, 128);
const PATH_FILL_COLOR = new Color(0, 0, 255, 128);

@ccclass("Pathfinding")
export class Pathfinding extends Component {
  @property({ type: Node }) target: Node = null!;
  @property({ type: Node }) tiledLayerNode: Node = null!;
  @property debug = false;
  @property moveDuration = 0.5;

  tiledLayer: TiledLayer | null = null;
  targetPosition: Vec2 = new Vec2();
  debugGraphic: Graphics | null = null;
  tiledLayerBoundingBox: math.Rect;
  nodeHeight: number = 0;
  matrix: number[][] = [];
  matrixWidth: number = 0;
  matrixHeight: number = 0;

  tileWidth: number = 0;
  tileHeight: number = 0;
  path: number[][] = [];
  grid: PF.Grid;

  finder: PF.AStarFinder = new PF.AStarFinder({
    allowDiagonal: true,
    dontCrossCorners: false,
  });

  start() {
    this.tiledLayer = this.tiledLayerNode.getComponent(TiledLayer);
    this.getLayerSize();
    this.getTileSize();
    this.getTileLayerSize();
    this.createMatrix();
    this.populateMatrixFromVerticesData();
    this.createGrid();
    this.createPath();
    if (this.debug) {
      this.createDebugLayer();
    }
    this.startFollowingPath();
  }

  startFollowingPath() {
    this.createPath();
    if (this.debug) {
      this.debugGraphic.clear();
      this.createMatrixDebug();
      this.createPathDebug();
    }
    const nextPosition = this.path[1];
    if (nextPosition) {
      const [x, y] = nextPosition;
      const position = this.convertMatrixPositionToPosition([x, y]);
      tween(this.node).to(this.moveDuration, { position }, {
        onComplete: this.startFollowingPath.bind(this)
      }).start();
    } else {
      console.log("no path");
      // this.startFollowingPath();
    }
  }

  getLayerSize() {
    const uitransform = this.tiledLayerNode.getComponent(UITransform);
    this.tiledLayerBoundingBox = uitransform.getBoundingBox();
  }

  getTileLayerSize() {
    const { width, height } = this.tiledLayer.getLayerSize();
    this.matrixWidth = width;
    this.matrixHeight = height;
  }

  getTileSize() {
    const { width: height } = this.tiledLayer.getMapTileSize();
    this.tileWidth = height;
    this.tileHeight = height;
  }

  createMatrix() {
    this.matrix = Array(this.matrixHeight).fill(BLOCKED).map(() => Array(this.matrixWidth).fill(BLOCKED));
  }

  populateMatrixFromVerticesData() {
    const { vertices } = this.tiledLayer;
    // fill the matrix with the vertices
    for (let row = 0; row < vertices.length; row++) {
      if (vertices[row] !== undefined) {
        const cols = Object.keys(vertices[row])
          .map((key) => parseInt(key))
          .filter((predicate) => predicate !== NaN);
        for (const col of cols) {
          this.matrix[row][col] = WALKABLE;
        }
      }
    }
  }

  createGrid() {
    this.grid = new PF.Grid(this.matrix);
  }

  convertPositionToMatrixPosition(worldPosition: Vec3): [number, number] {

    const x = Math.floor((worldPosition.x + Math.abs(this.tiledLayerBoundingBox.x)) / this.tileWidth);
    const y = Math.floor((worldPosition.y + Math.abs(this.tiledLayerBoundingBox.y)) / this.tileHeight);

    return [x, y];
  }

  convertMatrixPositionToPosition([x, y]: [number, number]): Vec3 {
    const worldPosition = new Vec3(
      x * this.tileWidth + this.tiledLayerBoundingBox.x,
      y * this.tileHeight + this.tiledLayerBoundingBox.y,
      0
    );
    return worldPosition;
  }



  createDebugLayer() {
    const canvas = this.node.parent;
    const uitransform = canvas.getComponent(UITransform);
    const node = new Node();
    canvas.addChild(node);
    const tiledLayerWorldPosition = this.tiledLayerNode.getWorldPosition();
    const position = uitransform.convertToNodeSpaceAR(tiledLayerWorldPosition);
    node.setPosition(position);
    node.layer = canvas.layer;
    this.debugGraphic = node.addComponent(Graphics);
  }

  createMatrixDebug() {
    this.matrix.forEach((row, y) => {
      row.forEach((col, x) => {
        if (col === BLOCKED) {
          this.debugGraphic.fillColor = BLOCKED_FILL_COLOR;
          this.debugGraphic.rect(
            x * this.tileWidth + this.tiledLayerBoundingBox.x,
            y * this.tileHeight + this.tiledLayerBoundingBox.y,
            this.tileWidth,
            this.tileHeight
          );
          this.debugGraphic.fill();
        }
        if (col === WALKABLE) {
          this.debugGraphic.fillColor = WALKABLE_FILL_COLOR;
          this.debugGraphic.rect(
            x * this.tileWidth + this.tiledLayerBoundingBox.x,
            y * this.tileHeight + this.tiledLayerBoundingBox.y,
            this.tileWidth,
            this.tileHeight
          );
          this.debugGraphic.fill();
        }
      });
    });
  }

  createPath() {

    // const t0 = performance.now();

    const targetWorldPosition = this.target.getWorldPosition();
    const ownerWorldPosition = this.node.getWorldPosition();

    const uitransform = this.tiledLayerNode.getComponent(UITransform);
    const targetPosition = uitransform.convertToNodeSpaceAR(targetWorldPosition);
    const ownerPosition = uitransform.convertToNodeSpaceAR(ownerWorldPosition);

    const [targetX, targetY] = this.convertPositionToMatrixPosition(targetPosition);
    const [ownerX, ownerY] = this.convertPositionToMatrixPosition(ownerPosition);

    const finder = new PF.AStarFinder();
    const clone = this.grid.clone();
    this.path = finder.findPath(ownerX, ownerY, targetX, targetY, this.grid);
    if (this.path.length === 0) {
      throw new Error("no path, probably target ouf of bounds or in blocked tile");
    }
    this.grid = clone;

    // const t1 = performance.now();
    // console.log("Call to doSomething took " + (t1 - t0) + " milliseconds.");
  }

  createPathDebug() {
    this.path.forEach(([x, y]) => {
          this.debugGraphic.fillColor = PATH_FILL_COLOR;
          this.debugGraphic.rect(
            x * this.tileWidth + this.tiledLayerBoundingBox.x,
            y * this.tileHeight + this.tiledLayerBoundingBox.y,
            this.tileWidth,
            this.tileHeight
          );
          this.debugGraphic.fill();
    });
  }

  update(deltaTime: number) {}
}
