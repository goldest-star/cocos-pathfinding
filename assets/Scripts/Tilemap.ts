import {
  _decorator,
  Component,
  Node,
  PhysicsSystem2D,
  EPhysics2DDrawFlags,
  TiledLayer,
  PolygonCollider2D,
  Vec2,
  RigidBody2D,
} from "cc";
const { ccclass, property, requireComponent } = _decorator;
import hull from "hull.js";
import clustering from "density-clustering";

@ccclass("Tilemap")
@requireComponent(RigidBody2D)
export class Tilemap extends Component {
  @property debug = true;
  @property hullConcavity = 1;
  @property neighborhoodRadius = 50;
  @property clusterNeighborsPoints = 10;

  onLoad() {
    if (this.debug) {
    PhysicsSystem2D.instance.debugDrawFlags =
      EPhysics2DDrawFlags.Aabb |
      EPhysics2DDrawFlags.Pair |
      EPhysics2DDrawFlags.CenterOfMass |
      EPhysics2DDrawFlags.Joint |
      EPhysics2DDrawFlags.Shape;
    }
  }

  start() {
    const tiledLayer = this.node.getComponent(TiledLayer);
    const { leftDownToCenterX, leftDownToCenterY } = tiledLayer;
    const { width, height } = tiledLayer.getMapTileSize();
    const vertices = tiledLayer.vertices;
    const points: [number, number][] = [];
    if (this.debug) console.log("vertices", vertices);
    for (const vertex of vertices) {
      if (vertex !== undefined) {
        const entries = Object.entries(vertex);

        for (const [key, value] of entries) {
          if (typeof value === "object") {
            const { left, bottom } = value;

            const tileVertices = [
              [left, bottom],
              [left + width, bottom],
              [left + width, bottom + height],
              [left, bottom + height],
            ];

            // push vertices
            for (const tileVertex of tileVertices) {
              points.push([
                tileVertex[0] - leftDownToCenterX,
                tileVertex[1] - leftDownToCenterY,
              ]);
            }
          }
        }
      }
    }

    const dbscan = new clustering.DBSCAN();
    const clusters = dbscan.run(
      points,
      this.neighborhoodRadius,
      this.clusterNeighborsPoints
    );

    if (this.debug) console.log("clusters", clusters);

    const polygons = clusters.map((cluster) =>
      cluster.map((index) => points[index])
    );

    for (const polygon of polygons) {
      const hullPolygon = hull(polygon, this.hullConcavity);
      const collider = this.node.addComponent(PolygonCollider2D);
      collider.points = hullPolygon.map(([x, y]) => new Vec2(x, y));
      collider.apply();
    }
  }
}
