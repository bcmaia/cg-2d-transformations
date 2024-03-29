import { vec3, mat4 } from "gl-matrix";


export const calcTransformMatrix2D = (
    position: {x: number, y: number},
    rotation: number,
    scale: {x: number, y: number},
) => {
    const m = mat4.create();

    mat4.translate(m, m, vec3.fromValues(position.x, position.y, 0));
    mat4.rotateZ(m, m, rotation);
    mat4.scale(m, m, vec3.fromValues(scale.x, scale.y, 1));

    return m;
}

export const convertPosition = (
    position : {x: number, y: number},
    originSpace : {x: [number, number], y: [number, number]},
    targetSpace : {x: [number, number], y: [number, number]},
) => {
    const x = (
        (position.x - originSpace.x[0]) 
        / (originSpace.x[1] - originSpace.x[0]) 
        * (targetSpace.x[1] - targetSpace.x[0]) 
        + targetSpace.x[0]
    );
    
    const y = (
        (position.y - originSpace.y[0]) 
        / (originSpace.y[1] - originSpace.y[0]) 
        * (targetSpace.y[1] - targetSpace.y[0]) 
        + targetSpace.y[0]
    );

    return {x, y};
}

export const calcMagnitude = (vector: {x: number, y: number}) => {
    return Math.sqrt(vector.x ** 2 + vector.y ** 2);
};

export const normalize = (vector: {x: number, y: number}) => {
    const magnitude = calcMagnitude(vector);
    if (magnitude === 0) return {x: 0, y: 0};
    return {x: vector.x / magnitude, y: vector.y / magnitude};
};

export const rotateVec = (vector: {x: number, y: number}, angle: number) => {
    return {
        x: vector.x * Math.cos(angle) - vector.y * Math.sin(angle),
        y: vector.x * Math.sin(angle) + vector.y * Math.cos(angle),
    };
};

