import { onMount } from "solid-js";
import { initWebGPU } from "./utils/webgpu";
import {
    createBindings,
    createBuffers,
    createPipelines,
    createTextures,
    renderFrame,
} from "./utils/cg";
import shaderCode from "./shaders/spaceship.wgsl?raw";
import { calcAngle, calcMagnitude, calcTransformMatrix2D, normalize, rotateVec } from "./utils/geometry";
import { vec3 } from "gl-matrix";


const App = () => {
    let canvasRef: HTMLCanvasElement | undefined;

    onMount(async () => {
        // Error handling: if no canvas is found
        if (!canvasRef) return;

        // Getting canvas dimensions
        const width = canvasRef.clientWidth;
        const height = canvasRef.clientHeight;
        

        // Note: here we are setting the canvas dimensions to be the same as the
        // client dimensions. This should not change the dimensions of the 
        // canvas, but I had to do this to avoid an webgpu error during the 
        // depthstencil creation, for some reason ¯\_(ツ)_/¯
        canvasRef.width = width;
        canvasRef.height = height;

        const canvasXOffset = canvasRef.getBoundingClientRect().x;
        const canvasYOffset = canvasRef.getBoundingClientRect().y;

        // Important values
        const BG_COLOR = { r: 0.1, g: 0.1, b: 0.1, a: 1.0 };
        const SPACESHIP_ACCELERATION = 0.00001;
        const BORDER = 1.05;
        const SCALE_FACTOR = 0.1;

        // Initializing webgpu
        const webgpuObjects = await initWebGPU(canvasRef);

        // Error handling: if webgpu was not properly initialized
        if (!webgpuObjects) return;

        // Destructuring the webgpu objects
        const { device, context, format } = webgpuObjects;

        // Creating buffers
        const { vertexBuffer, matrixBuffer } = createBuffers(device);

        // Creating textures
        const { depthTexture } = createTextures(device, width, height);

        // Creating binding groups
        const { bindGroup, bindGroupLayout, vertexBufferLayout } =
            createBindings(device, matrixBuffer);

        // Creating the render pipeline
        const { renderPipeline } = createPipelines(
            device,
            format,
            shaderCode,
            bindGroupLayout,
            vertexBufferLayout as GPUVertexBufferLayout
        );

        // Execution
        // Note: worldspace goes from 0 to 1
        let deltaTime = 1.0;
        let previus_timestamp = 0.0;

        let position = { x: 0.0, y: 0.0 };
        let angleOffset = 0.0;
        let cursorPosition = { x: 0.0, y: 2.0 };
        let angle = 0.0;
        let inputAngle = 0.0;
        let scale = { x: 0.25, y: 0.25 };
        let velocity = { x: 0.0, y: 0.0 };

        let input = { x: 0.0, y: 0.0 };

        const BREAK_FORCE = 10.0;
        let breaking = false;

        // Keyboard input event listener
        window.addEventListener("keydown", (event) => {
            const key = event.key;

            input = { x: 0.0, y: 0.0 };

            if (key === "ArrowRight" || key === "d") {
                input.x = +1.0;
            } else if (key === "ArrowLeft" || key === "a") {
                input.x = -1.0;
            }

            if (key === "ArrowUp" || key === "w") {
                input.y = -1.0;
            } else if (key === "ArrowDown" || key === "s") {
                input.y = +1.0;
            }

            if (key === "-" || key === "_") {
                scale.x -= SCALE_FACTOR;
                scale.y -= SCALE_FACTOR;
                // angleOffset -= 0.01;

            } else if (key === "+" || key === "=") {
                scale.x += SCALE_FACTOR;
                scale.y += SCALE_FACTOR;
                // angleOffset += 0.01;
                
            } else if (key === "r") {
                console.log(`Angle offset = ${angleOffset}`)
            }

            breaking = (key === " ");
        });

        // Mouse input event listener
        window.addEventListener("mousemove", (event) => {
            const mousePosition = {
                x: event.clientX - canvasXOffset,
                y: event.clientY - canvasYOffset,
            };

            const targetPosition = {
                x: 2.0 * mousePosition.x / width - 1.0,
                y: 2.0 * mousePosition.y / height - 1.0,
            };

            cursorPosition = targetPosition;
        });
        
        // Render Loop
        const renderLoop = (timestamp: number) => {
            // Updating the delta time
            deltaTime = timestamp - previus_timestamp;
            previus_timestamp = timestamp;

            if (deltaTime > 1000) deltaTime = 1.0;

            // Physics update
            // Applying break force
            if (breaking) {
                velocity.x = 0;
                velocity.y = 0;
            }

            // Applying acceleration
            const normalizedInput = normalize(input);
            input = { x: 0.0, y: 0.0 };
            const rotatedInput = rotateVec(normalizedInput, angle);
            const acceleration = {
                x: rotatedInput.x * SPACESHIP_ACCELERATION,
                y: rotatedInput.y * SPACESHIP_ACCELERATION,
            };

            velocity.x += acceleration.x * deltaTime;
            velocity.y += acceleration.y * deltaTime;

            // Apply velocity
            position.x += velocity.x * deltaTime;
            position.y += velocity.y * deltaTime;

            // Keeping everithing inside the box
            if (position.x < -BORDER) {
                position.x = +BORDER;
            } else if (position.x > BORDER) {
                position.x = -BORDER;
            }

            if (position.y < -BORDER) {
                position.y = +BORDER;
            } else if (position.y > BORDER) {
                position.y = -BORDER;
            }

            // Calculating the angle
            let v = vec3.fromValues(cursorPosition.x, cursorPosition.y, 0);
            vec3.normalize(v, v);

            inputAngle = Math.atan2(v[0], v[1]);
            angle = inputAngle + angleOffset;
            

            // Calculating the 2D transformation matrix
            const m = calcTransformMatrix2D(position, angle, scale);

            // Writing the transformation matrix to the buffer
            device.queue.writeBuffer(matrixBuffer, 0, m as Float32Array);

            // Rendering the frame
            renderFrame(
                device,
                context,
                BG_COLOR,
                vertexBuffer,
                bindGroup,
                depthTexture,
                renderPipeline
            );
            console.log(angle);
            // Requesting the browser to execute the render loop as soon as 
            // the next ui frame can be rendered.
            requestAnimationFrame(renderLoop);
        };

        // Starting the render loop
        renderLoop(1.0);
    });

    return <canvas ref={canvasRef}></canvas>;
};

export default App;
