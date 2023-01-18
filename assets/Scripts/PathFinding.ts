import {
  _decorator, Component, Node, TiledLayer, Graphics, Color, Vec3, UITransform, math,
} from "cc";
const { ccclass, property } = _decorator;
import PF from "pathfinding";

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

@ccclass("PathFinding")
export class PathFinding extends Component {
  @property debug = false;
  private _target: Node = null!;
  private _tiledLayerWalkableNode: Node = null!;
  private _tiledLayer: TiledLayer | null = null;
  private debugGraphic: Graphics | null = null;
  private _tiledLayerBoundingBox: math.Rect;
  private _matrix: number[][] = [];
  private _matrixWidth: number = 0;
  private _matrixHeight: number = 0;
  private _tileWidth: number = 0;
  private _tileHeight: number = 0;
  private _path: number[][] = [];
  private _grid: PF.Grid;

  private finder: PF.AStarFinder = new PF.AStarFinder({
    allowDiagonal: true,
    dontCrossCorners: true,
  });

  public init() {
    this._tiledLayer = this._tiledLayerWalkableNode.getComponent(TiledLayer);
    this._getLayerSize();
    this._getTileSize();
    this._getTileLayerSize();
    this._createMatrix();
    this._populateMatrixFromVerticesData();
    this._createGrid();
    if (this.debug) {
      this._createDebugLayer();
    }
  }

  public setDebug(debug: boolean) {
    this.debug = debug;
  }

  public setTarget(target: Node) {
    this._target = target;
  }

  public setTiledLayerWalkableNode(tiledLayerWalkableNode: Node) {
    this._tiledLayerWalkableNode = tiledLayerWalkableNode;
  }

  public getNextPosition() {
    this._createPath();
    if (this.debug) {
      this.debugGraphic.clear();
      this._createMatrixDebug();
      this._createPathDebug();
    }
    const nextPosition = this._path[1];
    if (nextPosition) {
      const [x, y] = nextPosition;
      const position = this._convertMatrixPositionToPosition([x, y], true);
      return position;
    } else {
      console.log("no path");
      return null;
    }
  }

  private _getLayerSize() {
    const uitransform = this._tiledLayerWalkableNode.getComponent(UITransform);
    this._tiledLayerBoundingBox = uitransform.getBoundingBox();
  }

  private _getTileLayerSize() {
    const { width, height } = this._tiledLayer.getLayerSize();
    this._matrixWidth = width;
    this._matrixHeight = height;
  }

  private _getTileSize() {
    const { width: height } = this._tiledLayer.getMapTileSize();
    this._tileWidth = height;
    this._tileHeight = height;
  }

  private _createMatrix() {
    this._matrix = Array(this._matrixHeight).fill(BLOCKED).map(() => Array(this._matrixWidth).fill(BLOCKED));
  }

  private _populateMatrixFromVerticesData() {
    const { vertices } = this._tiledLayer;
    // fill the matrix with the vertices
    for (let row = 0; row < vertices.length; row++) {
      if (vertices[row] !== undefined) {
        const cols = Object.keys(vertices[row])
          .map((key) => parseInt(key))
          .filter((predicate) => !Number.isNaN(predicate));
        for (const col of cols) {
          this._matrix[row][col] = WALKABLE;
        }
      }
    }
  }

  private _createGrid() {
    this._grid = new PF.Grid(this._matrix);
  }

  private _convertPositionToMatrixPosition(worldPosition: Vec3): [number, number] {

    const x = Math.floor((worldPosition.x + Math.abs(this._tiledLayerBoundingBox.x)) / this._tileWidth);
    const y = Math.floor((worldPosition.y + Math.abs(this._tiledLayerBoundingBox.y)) / this._tileHeight);

    return [x, y];
  }

  private _convertMatrixPositionToPosition([x, y]: [number, number], centered = false): Vec3 {
    const xSpace = centered ? this._tileWidth / 2 : 0;
    const ySpace = centered ? this._tileHeight / 2 : 0;
    const worldPosition = new Vec3(
      x * this._tileWidth + this._tiledLayerBoundingBox.x + xSpace,
      y * this._tileHeight + this._tiledLayerBoundingBox.y + ySpace,
      0
    );
    return worldPosition;
  }



  private _createDebugLayer() {
    const canvas = this.node.parent;
    const uitransform = canvas.getComponent(UITransform);
    const node = new Node();
    canvas.addChild(node);
    const tiledLayerWorldPosition = this._tiledLayerWalkableNode.getWorldPosition();
    const position = uitransform.convertToNodeSpaceAR(tiledLayerWorldPosition);
    node.setPosition(position);
    node.layer = canvas.layer;
    this.debugGraphic = node.addComponent(Graphics);
  }

  private _createMatrixDebug() {
    this._matrix.forEach((row, y) => {
      row.forEach((col, x) => {
        if (col === BLOCKED) {
          this.debugGraphic.fillColor = BLOCKED_FILL_COLOR;
          this.debugGraphic.rect(
            x * this._tileWidth + this._tiledLayerBoundingBox.x,
            y * this._tileHeight + this._tiledLayerBoundingBox.y,
            this._tileWidth,
            this._tileHeight
          );
          this.debugGraphic.fill();
        }
        if (col === WALKABLE) {
          this.debugGraphic.fillColor = WALKABLE_FILL_COLOR;
          this.debugGraphic.rect(
            x * this._tileWidth + this._tiledLayerBoundingBox.x,
            y * this._tileHeight + this._tiledLayerBoundingBox.y,
            this._tileWidth,
            this._tileHeight
          );
          this.debugGraphic.fill();
        }
      });
    });
  }

  private _createPath() {

    // const t0 = performance.now();

    const targetWorldPosition = this._target.getWorldPosition();
    const ownerWorldPosition = this.node.getWorldPosition();

    const uitransform = this._tiledLayerWalkableNode.getComponent(UITransform);
    const targetPosition = uitransform.convertToNodeSpaceAR(targetWorldPosition);
    const ownerPosition = uitransform.convertToNodeSpaceAR(ownerWorldPosition);

    const [targetX, targetY] = this._convertPositionToMatrixPosition(targetPosition);
    const [ownerX, ownerY] = this._convertPositionToMatrixPosition(ownerPosition);

    const finder = new PF.AStarFinder();
    const clone = this._grid.clone();
    this._path = finder.findPath(ownerX, ownerY, targetX, targetY, this._grid);
    if (this._path.length === 0) {
      throw new Error("no path, probably target ouf of bounds or in blocked tile");
    }
    this._grid = clone;

    // const t1 = performance.now();
    // console.log("Call to doSomething took " + (t1 - t0) + " milliseconds.");
  }

  private _createPathDebug() {
    this._path.forEach(([x, y]) => {
          this.debugGraphic.fillColor = PATH_FILL_COLOR;
          this.debugGraphic.rect(
            x * this._tileWidth + this._tiledLayerBoundingBox.x,
            y * this._tileHeight + this._tiledLayerBoundingBox.y,
            this._tileWidth,
            this._tileHeight
          );
          this.debugGraphic.fill();
    });
  }

}
