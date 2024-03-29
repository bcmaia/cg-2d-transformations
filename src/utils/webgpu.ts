export const initWebGPU = async (
    canvas: HTMLCanvasElement,
    powerPreference: GPUPowerPreference = "high-performance"
) => {
    // Check if the browser supports WebGPU
    if (!navigator.gpu) {
        console.error("WebGPU is not supported in your browser");
        return;
    }

    // Get the GPU adapter
    const adapter = await navigator.gpu.requestAdapter({powerPreference});

    if (!adapter) {
        console.error("Error: No GPU adapter found!");
        return;
    }

    // Get a locical representaion for the GPU Device
    const device = await adapter.requestDevice();

    if (!device) {
        console.error("Error: No GPU device found!");
        return;
    }

    // Get the canvas context
    const context = canvas.getContext("webgpu");

    if (!context) {
        console.error("Error: No WebGPU context found!");
        return;
    }

    // Getting preferred Format
    const format = navigator.gpu.getPreferredCanvasFormat();

    // Configuring the context
    context.configure({
        device,
        format,
    });

    // returning all useful objects
    return {
        adapter,
        device,
        context,
        format,
    };
};
