export function deg2rad(angle) {
  return (angle * Math.PI) / 180;
}

export function move({ x, y, speed, angle }) {
  return {
    x: x + Math.cos(deg2rad(angle)) * speed,
    y: y - Math.sin(deg2rad(angle)) * speed,
  };
}
