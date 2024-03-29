// Declaring projection matrix uniform
// This will be used to transform the vertex positions from world space 
// to clip space
@group(0) @binding(0) var<uniform> mvp : mat4x4f;

struct VertexInput {
    @location(0) worldPos: vec2f,
    @builtin(instance_index) instance: u32,
};

struct VertexOutput {
    @builtin(position) clipPos: vec4f,
    @location(0) worldPos : vec4f,
};

struct FragmentOutput {
    @location(0) color: vec4f,
};

@vertex
fn vertexMain(input : VertexInput) -> VertexOutput {
    let worldPos = vec4f(input.worldPos, 0, 1);
    let clipPos = mvp * worldPos;

    var output : VertexOutput;
    output.clipPos = clipPos;
    output.worldPos = worldPos;

    return output;
}

@fragment
fn fragmentMain(input : VertexOutput) -> FragmentOutput {

    var output : FragmentOutput;
    // output.color = 0.5 * input.worldPos + 0.5;

    // color = red
    output.color = vec4f(1.0, 0.0, 0.0, 1.0);

    return output;
}
