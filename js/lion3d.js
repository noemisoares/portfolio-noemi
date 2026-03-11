function initLion3D() {
    const container = document.getElementById('lion-canvas-container');
    if (!container) return;

    const scene = new THREE.Scene();
    
    const ratio = container.clientWidth / container.clientHeight;
    const viewSize = 10; 
    const camera = new THREE.OrthographicCamera(
        -viewSize * ratio / 2, viewSize * ratio / 2,
        viewSize / 2, -viewSize / 2, 
        0.1, 1000
    );
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ 
        alpha: true, 
        antialias: true 
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    let mouse = new THREE.Vector2(0, 0);
    let targetMouse = new THREE.Vector2(0, 0);

    const vertexShader = `
        uniform vec2 uMouse;
        uniform float uTime;
        varying vec2 vUv;
        
        void main() {
            vUv = uv;
            vec3 pos = position;
            
            float distFromCenter = distance(uv, vec2(0.5, 0.5));
            float depthFocus = 1.0 - smoothstep(0.0, 0.7, distFromCenter);
            
            float mouseImpactX = uMouse.x * depthFocus * 0.4; 
            float mouseImpactY = uMouse.y * depthFocus * 0.4;
            
            float breathe = sin(uTime * 1.5) * 0.02 * depthFocus;
            
            float tailMask = (1.0 - smoothstep(0.0, 0.3, uv.x)) * (1.0 - smoothstep(0.0, 0.35, uv.y));
            float tailSway = sin(uTime * 2.0 + uv.x * 10.0) * 0.03 * tailMask;
            
            float maneMask = smoothstep(0.2, 0.6, distFromCenter) * smoothstep(0.4, 1.0, uv.y);
            float maneFlowX = sin(uTime * 1.2 + uv.y * 5.0) * 0.015 * maneMask;
            float maneFlowY = cos(uTime * 1.4 + uv.x * 5.0) * 0.015 * maneMask;
            
            pos.x += mouseImpactX + tailSway + maneFlowX;
            pos.y += mouseImpactY + breathe + maneFlowY;
            
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
    `;

    const fragmentShader = `
        uniform sampler2D uTexture;
        uniform vec3 uColorBlue;
        uniform vec3 uColorCyan;
        uniform float uTime;
        varying vec2 vUv;

        float getLuminance(vec3 color) {
            return dot(color, vec3(0.299, 0.587, 0.114));
        }

        void main() {
            vec4 texColor = texture2D(uTexture, vUv);
            float luma = getLuminance(texColor.rgb);
            
            float maskInkTight = 1.0 - smoothstep(0.7, 0.9, luma);
            
            vec2 uvCentered = vUv - vec2(0.5, 0.5);
            vec2 uvPortrait = uvCentered;
            uvPortrait.x *= 1.25; 
            float dist = length(uvPortrait);
            
            float backglowMask = 1.0 - smoothstep(0.0, 1.3, dist); 
            
            float coreSolid = 1.0 - smoothstep(0.2, 0.6, dist); 
            
            float vignette = 1.0 - smoothstep(0.35, 0.7, dist);
            
            float alpha = max(maskInkTight, coreSolid) * texColor.a * vignette;
            
            alpha = max(alpha, backglowMask * 0.18 * vignette);

            vec3 blackInk = vec3(0.0, 0.0, 0.0);
            vec3 royalBlue = uColorBlue; 
            
            vec3 mappedColor = mix(blackInk, royalBlue, smoothstep(0.18, 0.68, luma));
            
            vec3 blueGlow = uColorBlue * backglowMask * 0.08;
            
            float pulse = 1.0 + sin(uTime * 1.5) * 0.01; 
            vec3 finalColor = (mappedColor + blueGlow) * pulse;

            if (alpha < 0.005) {
                discard;
            }

            gl_FragColor = vec4(finalColor * alpha, alpha);
        }
    `;

    const textureLoader = new THREE.TextureLoader();
    
    const imagePath = 'imagens/leao.jpg'; 
    const uniforms = {
        uTexture: { value: null },
        uMouse: { value: mouse },
        uTime: { value: 0 },
        uColorBlue: { value: new THREE.Vector3(59/255, 130/255, 246/255) },
        uColorCyan: { value: new THREE.Vector3(0, 200/255, 240/255) }
    };

    const material = new THREE.ShaderMaterial({
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        uniforms: uniforms,
        transparent: true
    });

    const geometry = new THREE.PlaneGeometry(viewSize, viewSize, 128, 128); 
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    textureLoader.load(imagePath, (texture) => {
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        
        uniforms.uTexture.value = texture;
        
        const imgAspect = texture.image.width / texture.image.height;
        if (imgAspect > 1) {
            mesh.scale.set(1, 1 / imgAspect, 1);
        } else {
            mesh.scale.set(imgAspect, 1, 1);
        }
    }, undefined, (error) => {
        console.warn('Textura do leão não encontrada no caminho', imagePath, 'Verifique se o arquivo existe.');
    });


    const particleGeometry = new THREE.BufferGeometry();
    const particleCount = 80;
    const posArray = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i+=3) {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.pow(Math.random(), 1.5) * (viewSize * 0.6);
        
        posArray[i] = Math.cos(angle) * radius;     
        posArray[i+1] = Math.sin(angle) * radius;   
        posArray[i+2] = (Math.random() - 0.5) * 4 - 2; 
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

    const particleMaterial = new THREE.PointsMaterial({
        size: 0.06,
        color: 0x5da8ff, 
        transparent: true,
        opacity: 0.35, 
        blending: THREE.AdditiveBlending
    });

    const particlesMesh = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particlesMesh);

    container.addEventListener('mousemove', (event) => {
        const rect = container.getBoundingClientRect();
        targetMouse.x = ((event.clientX - rect.left) / container.clientWidth) * 2 - 1;
        targetMouse.y = -(((event.clientY - rect.top) / container.clientHeight) * 2 - 1);
    });

    container.addEventListener('mouseleave', () => {
        targetMouse.x = 0;
        targetMouse.y = 0;
    });

    const clock = new THREE.Clock();

    function animate() {
        requestAnimationFrame(animate);

        const elapsedTime = clock.getElapsedTime();
        uniforms.uTime.value = elapsedTime;

        mouse.lerp(targetMouse, 0.05);
        uniforms.uMouse.value = mouse;

        camera.position.x = mouse.x * 0.05;
        camera.position.y = mouse.y * 0.05;
        camera.lookAt(0,0,0); 

        const parts = particlesMesh.geometry.attributes.position.array;
        for(let i=1; i<particleCount*3; i+=3) {
            parts[i] += 0.005; 
            if(parts[i] > viewSize) {
                parts[i] = -viewSize; 
            }
        }
        particlesMesh.geometry.attributes.position.needsUpdate = true;

        renderer.render(scene, camera);
    }

    animate();

    window.addEventListener('resize', () => {
        if (container.clientWidth > 0 && container.clientHeight > 0) {
            const aspect = container.clientWidth / container.clientHeight;
            
            camera.left = -viewSize * aspect / 2;
            camera.right = viewSize * aspect / 2;
            camera.top = viewSize / 2;
            camera.bottom = -viewSize / 2;
            camera.updateProjectionMatrix();

            renderer.setSize(container.clientWidth, container.clientHeight);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

            if (uniforms.uTexture.value) {
                const imgAspect = uniforms.uTexture.value.image.width / uniforms.uTexture.value.image.height;
                if (imgAspect > 1) {
                    mesh.scale.set(1, 1 / imgAspect, 1);
                } else {
                    mesh.scale.set(imgAspect, 1, 1);
                }
            }
        }
    });

    setTimeout(() => window.dispatchEvent(new Event('resize')), 100);
}
