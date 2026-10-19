import * as THREE from "three";

export function makeOutlineMesh(geometry, color, outlineColor = 0x0c0a09, thickness = 0.045) {
  const mesh = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({ color }));
  const outline = new THREE.Mesh(
    geometry.clone(),
    new THREE.MeshBasicMaterial({ color: outlineColor, side: THREE.BackSide })
  );
  outline.scale.multiplyScalar(1 + thickness);
  const group = new THREE.Group();
  group.add(mesh, outline);
  return group;
}

export function flat(baseColor, { w = 1, h = 1, d = 1, x = 0, y = 0, z = 0 } = {}) {
  const g = makeOutlineMesh(new THREE.BoxGeometry(w, h, d), baseColor);
  g.position.set(x, y, z);
  return g;
}

export function edgeMat(color) {
  return new THREE.LineBasicMaterial({ color });
}

export function key(d, dx, dy, dz) {
  const geo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(dx, dy, dz),
  ]);
  return geo;
}

export function rand(a, b) { return a + Math.random() * (b - a); }
export function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
export function lerpAngle(a, b, t) {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}
