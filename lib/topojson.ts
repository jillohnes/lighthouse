/** Minimal topojson decoder — enough for us-atlas state boundaries. */

type Topology = {
  transform: { scale: [number, number]; translate: [number, number] };
  arcs: number[][][];
  objects: Record<
    string,
    {
      type: string;
      geometries: Array<{
        type: "Polygon" | "MultiPolygon";
        arcs: number[][] | number[][][];
        id?: string;
      }>;
    }
  >;
};

function decodeArc(topology: Topology, index: number): [number, number][] {
  const arc = topology.arcs[index < 0 ? ~index : index];
  const points: [number, number][] = [];
  let x = 0;
  let y = 0;

  for (const delta of arc) {
    x += delta[0];
    y += delta[1];
    points.push([
      x * topology.transform.scale[0] + topology.transform.translate[0],
      y * topology.transform.scale[1] + topology.transform.translate[1],
    ]);
  }

  if (index < 0) points.reverse();
  return points;
}

function decodeRing(topology: Topology, ring: number[]): [number, number][] {
  const points: [number, number][] = [];
  for (const arcIndex of ring) {
    const arcPoints = decodeArc(topology, arcIndex);
    if (points.length > 0) {
      arcPoints.shift();
    }
    points.push(...arcPoints);
  }
  return points;
}

export function decodeStateGeometries(topology: Topology) {
  const { geometries } = topology.objects.states;
  const states: Array<{ id: string; rings: [number, number][][] }> = [];

  for (const geometry of geometries) {
    const rings: [number, number][][] = [];

    if (geometry.type === "Polygon") {
      for (const ring of geometry.arcs as number[][]) {
        rings.push(decodeRing(topology, ring));
      }
    } else {
      for (const polygon of geometry.arcs as number[][][]) {
        for (const ring of polygon) {
          rings.push(decodeRing(topology, ring));
        }
      }
    }

    states.push({ id: String(geometry.id ?? ""), rings });
  }

  return states;
}
