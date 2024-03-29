import { TRIANGLE_VERTICES } from "./constants";

export const createBuffers = (device: GPUDevice) => {
    // Creating the vertex buffer
    const vertices = TRIANGLE_VERTICES;

    const vertexBuffer = device.createBuffer({
        label: "Space Ship Vertex Buffer",
        size: vertices.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });

    device.queue.writeBuffer(vertexBuffer, 0, vertices);

    // Trama: TRAnsformation MAtrix Buffer
    const matrixBuffer = device.createBuffer({
        label: "Transformation Matrix Buffer (trama)",
        size: 4 * 4 * 4, // 4x4 matrix of 4 bytes floats (f32)
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    return { vertexBuffer, matrixBuffer };
};

export const createTextures = (
    device: GPUDevice,
    width: number,
    height: number
) => {
    // Creating the depth texture
    const depthTexture = device.createTexture({
        label: "Depth Texture",
        size: { width, height }, // Same size as the canvas
        format: "depth24plus",
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });

    return { depthTexture };
};

export const createBindings = (device: GPUDevice, matrixBuffer: GPUBuffer) => {
    //====| Layouts
    // Creating the bind group layout
    const bindGroupLayout = device.createBindGroupLayout({
        label: "Spaceship Bind Group Layout",
        entries: [
            {
                binding: 0,
                visibility: GPUShaderStage.VERTEX,
                buffer: { type: "uniform" },
            },
        ],
    });

    // Creating the vertex buffer layout
    const vertexBufferLayout = {
        arrayStride: 2 * 4, // 2 floats * 4 bytes
        attributes: [
            {
                // Position
                format: "float32x2",
                offset: 0,
                shaderLocation: 0, // Position, see vertex shader
            },
        ],
    };

    //====| Binding Groups
    // Creating the bind group
    const bindGroup = device.createBindGroup({
        label: "Spaceship Bind Group",
        layout: bindGroupLayout,
        entries: [
            {
                binding: 0,
                resource: { buffer: matrixBuffer },
            },
        ],
    });

    return { bindGroup, bindGroupLayout, vertexBufferLayout };
};

export const createPipelines = (
    device: GPUDevice,
    format: GPUTextureFormat,
    shaderCode: string,
    bindGroupLayout: GPUBindGroupLayout,
    vertexBufferLayout: GPUVertexBufferLayout
) => {
    // Creating a shader module
    const shaderModule = device.createShaderModule({
        label: "Spaceship Shader Module",
        code: shaderCode,
    });

    // Creating the pipeline layout
    const pipelineLayout = device.createPipelineLayout({
        label: "Spaceship Pipeline Layout",
        bindGroupLayouts: [bindGroupLayout],
    });

    // Creating the render pipeline
    const renderPipeline = device.createRenderPipeline({
        label: "Spaceship Render Pipeline",
        layout: pipelineLayout,

        // Vertex stage configuration
        vertex: {
            module: shaderModule,
            entryPoint: "vertexMain",
            buffers:
                // Note: Keep the type assertion here, or typescript will not
                // let you rest!
                [vertexBufferLayout] as Iterable<GPUVertexBufferLayout | null>,
        },

        // Fragment stage configuration
        fragment: {
            module: shaderModule,
            entryPoint: "fragmentMain",
            targets: [{ format }],
        },

        // Primitive topology configuration
        primitive: {
            topology: "triangle-list",
            cullMode: "back",
        },

        // Depth stencil configuration
        depthStencil: {
            depthWriteEnabled: true,
            depthCompare: "less",
            format: "depth24plus",
        },
    });

    return { renderPipeline };
};

export const renderFrame = (
    device: GPUDevice,
    context: GPUCanvasContext,
    bgColor: GPUColorDict,
    vertexBuffer: GPUBuffer,
    bindGroup: GPUBindGroup,
    depthTexture: GPUTexture,
    renderPipeline: GPURenderPipeline,
    vertexCount: number = 3,
    instanceCount: number = 1,
) => {
    // Creating a comand enconder
    const encoder = device.createCommandEncoder();

    // Creating the render pass
    const renderpass = encoder.beginRenderPass({

        // Configuring the color attachments
        colorAttachments: [
            {
                view: context.getCurrentTexture().createView(),
                loadOp: "clear",
                clearValue: bgColor,
                storeOp: "store",
            },
        ],

        // Configuring the depth attachment
        depthStencilAttachment: {
            view: depthTexture.createView() as GPUTextureView,
            depthClearValue: 1.0,
            depthLoadOp: "clear",
            depthStoreOp: "store",
        },

    });

    // Configuring the pipeline
    renderpass.setPipeline(renderPipeline);
    renderpass.setVertexBuffer(0, vertexBuffer);
    renderpass.setBindGroup(0, bindGroup);

    // Sketching the draw operation
    renderpass.draw(vertexCount, instanceCount);
    renderpass.end();

    // Submitting the command
    const commandBuffer = encoder.finish();
    device.queue.submit([commandBuffer]);
};
