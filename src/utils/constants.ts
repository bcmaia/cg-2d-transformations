
const pointA = - Math.PI / 2;
const pointB = pointA + 2 * Math.PI / 3;
const pointC = pointB + 2 * Math.PI / 3;

export const TRIANGLE_VERTICES = new Float32Array([
//    x,      y
    +Math.cos(pointA),   +Math.sin(pointA),
    +Math.cos(pointB),   +Math.sin(pointB),
    +Math.cos(pointC),   +Math.sin(pointC),
]);