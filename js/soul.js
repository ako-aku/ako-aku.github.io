  function soul(canvasId) {
      const colorPalettes = [{
              mainColor: "#ef243a",
              accentColor: "#fff2df"
          },
          {
              mainColor: "#4aedff",
              accentColor: "#c4181f"
          },
          {
              mainColor: "#17141c",
              accentColor: "#b03e80"
          },
          {
              mainColor: "#040612",
              accentColor: "#d400ff"
          },
          {
              mainColor: "#405010",
              accentColor: "#d0d058"
          }
      ];

      const settings = {
          accentMix: 0.52,
          speed: 0.94,
          scale: 1.28,
          rotation: Math.PI / 11,
          noiseIntensity: 2.0,
          mouseDist: 0.26,
          mouseStrength: 1.24,
          smoothMouseLerp: 0.07,
          mouseFadeOut: 0.06,
          timeStep: 0.011,
          colorLerpSpeed: 0.025,
          invertLerpSpeed: 0.08,
          setColorLerpSpeed: function(val) {
              this.colorLerpSpeed = val;
          }
      };

      function hexToNormalizedRGB(hex) {
          hex = hex.replace("#", "");
          return [
              parseInt(hex.slice(0, 2), 16) / 255,
              parseInt(hex.slice(2, 4), 16) / 255,
              parseInt(hex.slice(4, 6), 16) / 255,
          ];
      }

      function invertColor(rgb) {
          return rgb.map(x => 1 - x);
      }

      const canvas = document.getElementById(canvasId);
      let width = window.innerWidth;
      let height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;

      const renderer = new THREE.WebGLRenderer({
          canvas,
          alpha: true,
          antialias: true
      });
      renderer.setClearColor(0x000000, 0);

      const scene = new THREE.Scene();
      const camera = new THREE.OrthographicCamera(
          width / -2, width / 2, height / 2, height / -2, 1, 1000
      );
      camera.position.z = 10;

      let paletteIndex = 0;
      let lastPaletteIndex = 0;
      let currentMainColor = hexToNormalizedRGB(colorPalettes[paletteIndex].mainColor);
      let currentAccentColor = hexToNormalizedRGB(colorPalettes[paletteIndex].accentColor);
      let targetMainColor = [...currentMainColor];
      let targetAccentColor = [...currentAccentColor];

      let animatingInvert = false;
      let invertMainColor = invertColor(currentMainColor);
      let invertAccentColor = invertColor(currentAccentColor);

      const vertexShader = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;
      const fragmentShader = `
    varying vec2 vUv;
    uniform float uTime;
    uniform vec3  uColor;
    uniform vec3  uAccent;
    uniform float uAccentMix;
    uniform float uSpeed;
    uniform float uScale;
    uniform float uRotation;
    uniform float uNoiseIntensity;
    uniform vec2  uMouse;
    uniform float uMouseDist;
    uniform float uMouseStrength;
    uniform float uMouseForce;
    const float e = 2.71828182845904523536;
    float noise(vec2 texCoord)
    {
      float G = e;
      vec2  r = (G * sin(G * texCoord));
      return fract(r.x * r.y * (1.0 + texCoord.x));
    }
    vec2 rotateUvs(vec2 uv, float angle)
    {
      float c = cos(angle);
      float s = sin(angle);
      mat2  rot = mat2(c, -s, s, c);
      return rot * uv;
    }
    float mouseDistort(vec2 uv, vec2 mouse, float dist, float strength, float force)
    {
      float d = distance(uv, mouse);
      float press = exp(-pow(d / dist, 2.0)) * strength * force * (1.05 + 0.18*sin(uv.x*6.0+uv.y*8.0+uTime*0.8));
      return press;
    }
    void main()
    {
      vec2 uv = rotateUvs(vUv * uScale, uRotation);
      float t = uSpeed * uTime;
      float wave1 = 0.11 * sin(13.0 * uv.x - t * 1.03 + cos(uv.y*2.4 + t*0.11));
      float wave2 = 0.11 * cos(11.0 * uv.y + t * 1.19 + sin(uv.x*2.9 + t*0.17));
      float wave3 = 0.13 * sin(7.0 * (uv.x + uv.y) + t * 1.11 + cos(uv.x*4.0 - uv.y*3.3 + t*0.13));
      uv.y += wave1 + 0.7 * wave3;
      uv.x += wave2 + 0.7 * wave3;

      float mDist = mouseDistort(vUv, uMouse, uMouseDist, uMouseStrength, uMouseForce);
      uv.y += mDist * 0.46 * sin(10.0 * uv.x + uTime * 0.7);
      uv.x += mDist * 0.36 * cos(12.0 * uv.y + uTime * 0.6);
      float pattern = 0.51 + 0.41 * sin(4.1 * (uv.x + uv.y + cos(2.0 * uv.x + 2.1 * uv.y) + 0.012 * t) + sin(11.0 * (uv.x + uv.y - 0.07 * t)));
      float waveMix = 0.5 + 0.5 * sin(uv.x * 7.1 + uTime * 0.13 + uv.y * 7.6 + pattern*0.8);
      vec3 silk = mix(uColor, uAccent, uAccentMix * waveMix);
      float vignette = smoothstep(0.72, 0.13, distance(vUv, vec2(0.5)));
      silk = mix(silk, uAccent, 0.06 * vignette);
      float rnd = noise(gl_FragCoord.xy);
      vec4 col = vec4(silk, 1.0) * vec4(pattern) * (0.91 + vignette * 0.19) - rnd / 12.0 * 2.0;
      col.rgb *= 1.0 - 0.17 * vignette;
      col.a = 1.0;
      gl_FragColor = col;
    }
  `;

      const uniforms = {
          uTime: {
              value: 0
          },
          uColor: {
              value: new THREE.Color(...currentMainColor)
          },
          uAccent: {
              value: new THREE.Color(...currentAccentColor)
          },
          uAccentMix: {
              value: settings.accentMix
          },
          uSpeed: {
              value: settings.speed
          },
          uScale: {
              value: settings.scale
          },
          uRotation: {
              value: settings.rotation
          },
          uNoiseIntensity: {
              value: settings.noiseIntensity
          },
          uMouse: {
              value: new THREE.Vector2(0.5, 0.5)
          },
          uMouseDist: {
              value: settings.mouseDist
          },
          uMouseStrength: {
              value: settings.mouseStrength
          },
          uMouseForce: {
              value: 0
          }
      };

      const geometry = new THREE.PlaneGeometry(width, height, 1, 1);
      const material = new THREE.ShaderMaterial({
          uniforms,
          vertexShader,
          fragmentShader
      });
      const mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);

      function resize() {
          width = window.innerWidth;
          height = window.innerHeight;
          renderer.setSize(width, height, false);
          camera.left = width / -2;
          camera.right = width / 2;
          camera.top = height / 2;
          camera.bottom = height / -2;
          camera.updateProjectionMatrix();
          mesh.geometry.dispose();
          mesh.geometry = new THREE.PlaneGeometry(width, height, 1, 1);
          canvas.width = width;
          canvas.height = height;
      }
      window.addEventListener('resize', resize);

      let mouseTarget = {
          x: 0.5,
          y: 0.5
      };
      let mouseInside = false;
      let desiredMouseForce = 0;
      let mouseForce = 0;
      let smoothMouse = {
          x: 0.5,
          y: 0.5
      };

      canvas.addEventListener('mousemove', (e) => {
          const rect = canvas.getBoundingClientRect();
          mouseTarget.x = (e.clientX - rect.left) / rect.width;
          mouseTarget.y = 1.0 - (e.clientY - rect.top) / rect.height;
          mouseInside = true;
          desiredMouseForce = 1;
      });
      canvas.addEventListener('mouseleave', () => {
          mouseInside = false;
          desiredMouseForce = 0;
      });
      canvas.addEventListener('mouseenter', () => {
          mouseInside = true;
          desiredMouseForce = 1;
      });

      function lerp(a, b, t) {
          return a + (b - a) * t;
      }

      function animate() {
          uniforms.uTime.value += settings.timeStep;
          smoothMouse.x += (mouseTarget.x - smoothMouse.x) * settings.smoothMouseLerp;
          smoothMouse.y += (mouseTarget.y - smoothMouse.y) * settings.smoothMouseLerp;
          uniforms.uMouse.value.set(smoothMouse.x, smoothMouse.y);
          mouseForce += (desiredMouseForce - mouseForce) * settings.mouseFadeOut;
          uniforms.uMouseForce.value = mouseForce;

          let lerpSpeed = animatingInvert ? settings.invertLerpSpeed : settings.colorLerpSpeed;

          for (let i = 0; i < 3; i++) {
              currentMainColor[i] = lerp(currentMainColor[i], targetMainColor[i], lerpSpeed);
              currentAccentColor[i] = lerp(currentAccentColor[i], targetAccentColor[i], lerpSpeed);
          }
          uniforms.uColor.value.setRGB(...currentMainColor);
          uniforms.uAccent.value.setRGB(...currentAccentColor);

          if (animatingInvert &&
              Math.abs(currentMainColor[0] - targetMainColor[0]) < 0.01 &&
              Math.abs(currentAccentColor[0] - targetAccentColor[0]) < 0.01) {
              animatingInvert = false;
              let newPalette = colorPalettes[paletteIndex];
              targetMainColor = hexToNormalizedRGB(newPalette.mainColor);
              targetAccentColor = hexToNormalizedRGB(newPalette.accentColor);
          }

          renderer.render(scene, camera);
          requestAnimationFrame(animate);
      }

      canvas.addEventListener('mousedown', () => {
          lastPaletteIndex = paletteIndex;
          paletteIndex = (paletteIndex + 1) % colorPalettes.length;

          invertMainColor = invertColor(currentMainColor);
          invertAccentColor = invertColor(currentAccentColor);
          targetMainColor = [...invertMainColor];
          targetAccentColor = [...invertAccentColor];
          animatingInvert = true;
      });

      animate();

      window.soulSettings = settings;
  }

  soul("soul");
  soul("no_soul");