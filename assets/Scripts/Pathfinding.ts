import { _decorator, Component, Node, TiledLayer, Vec2, Graphics, Color, Vec3, UITransform } from "cc";
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

@ccclass("Pathfinding")
export class Pathfinding extends Component {
  @property({ type: Node }) target: Node = null!;
  @property({ type: Node }) tiledLayerNode: Node = null!;

  @property debug = false;

  tiledLayer: TiledLayer | null = null;

  targetPosition: Vec2 = new Vec2();

  matrix: number[][] = [];
  grid: PF.Grid;

  finder: PF.AStarFinder = new PF.AStarFinder({
    allowDiagonal: true,
    dontCrossCorners: true,
  });

  start() {
    this.tiledLayer = this.tiledLayerNode.getComponent(TiledLayer);
    this.createMatrixFromTiledLayer();
    if (this.debug) this.createMatrixDebug();
  }

  createMatrixFromTiledLayer() {
    console.log(this.tiledLayer);
    const { width: matrixWidth, height: matrixHeight } =
      this.tiledLayer.getLayerSize();
      const vertices = this.tiledLayer.vertices;

    // create a matrix of 0s
    this.matrix = Array(matrixHeight)
      .fill(0)
      .map(() => Array(matrixWidth).fill(0));

    for (let row = 0; row < vertices.length; row++) {
        if (vertices[row] !== undefined) {
            const cols = Object.keys(vertices[row]).map((key) => parseInt(key)).filter(predicate => predicate !== NaN);
            for (const col of cols) {
                this.matrix[row][col] = 1;
            }
        }
    }

}

createMatrixDebug() {
    const { width: tileSizeWidth, height: tileSizeHeight } = this.tiledLayer.getMapTileSize();
    const canvas = this.node.parent;
    const node = new Node();
    canvas.addChild(node);
    const tiledLayerWorldPosition = this.tiledLayerNode.getWorldPosition();
    node.setWorldPosition(tiledLayerWorldPosition);
    node.layer = canvas.layer;
    const graphic = node.addComponent(Graphics);

    const { width: matrixWidth, height: matrixHeight } =
        this.tiledLayer.getLayerSize();

    graphic.lineWidth = 10;
    graphic.strokeColor = new Color(255, 0, 0, 255);
    graphic.rect(0, 0, matrixWidth * tileSizeWidth, matrixHeight * tileSizeHeight);
    graphic.stroke();

    graphic.lineWidth = 1;
    graphic.strokeColor = new Color(0, 255, 0, 255);
    graphic.fillColor = new Color(0, 255, 0, 128);
    this.matrix.forEach((row, y) => {
        row.forEach((col, x) => {
            if (col === 1) {
                graphic.rect(x * tileSizeWidth, y * tileSizeHeight, tileSizeWidth, tileSizeHeight);
                graphic.stroke();
                graphic.fill();
            }
        });
    });
  }

  update(deltaTime: number) {}
}
