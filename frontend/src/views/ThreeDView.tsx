import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useApp } from '../context/AppContext';
import {
  Box,
  Play,
  Square,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  ShieldCheck,
  Flame,
  Zap,
  Info,
  Droplets,
  Layers,
  Sparkles,
} from 'lucide-react';
import { api } from '../services/api';
import { PageHeader } from '../components/ui/PageHeader';

export const ThreeDView: React.FC = () => {
  const { selectedField, t, language } = useApp();
  const mountRef = useRef<HTMLDivElement>(null);

  // Simulation Controls State
  const [simState, setSimState] = useState<'idle' | 'infesting' | 'spraying' | 'completed'>('idle');
  const [pestIntensity, setPestIntensity] = useState<number>(75); // 0 - 100
  const [selectedScenario, setSelectedScenario] = useState<string>('Whitefly Surge');
  const [simProgress, setSimProgress] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>('Ready for simulation');

  // Three.js object references
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sprayerRigRef = useRef<THREE.Group | null>(null);
  const mistParticlesRef = useRef<THREE.Points | null>(null);
  const pestCloudRef = useRef<THREE.Points | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // 1. Scene, Camera, Renderer Setup
    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight || 520;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#141f17'); // Rich dark agricultural night/twilight
    scene.fog = new THREE.FogExp2('#141f17', 0.025);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, 14, 22);
    camera.lookAt(0, 1, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    rendererRef.current = renderer;
    mountRef.current.appendChild(renderer.domElement);

    // 2. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfff4e0, 1.2);
    dirLight.position.set(15, 25, 15);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    // Accent agricultural light
    const pointLight = new THREE.PointLight(0x10b981, 1.5, 30);
    pointLight.position.set(-8, 5, 0);
    scene.add(pointLight);

    // 3. Field Ground (Dark Rich Soil)
    const groundGeo = new THREE.PlaneGeometry(36, 36, 32, 32);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x3d2817,
      roughness: 0.9,
      metalness: 0.1,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // 4. Crop Rows & Plants
    const plantGeo = new THREE.ConeGeometry(0.45, 1.2, 5);
    const plantMat = new THREE.MeshStandardMaterial({ color: 0x2d6a4f, roughness: 0.7 });
    const rowGroup = new THREE.Group();

    for (let row = -10; row <= 10; row += 2.5) {
      // Row soil ridge
      const ridgeGeo = new THREE.BoxGeometry(0.8, 0.25, 28);
      const ridgeMat = new THREE.MeshStandardMaterial({ color: 0x4a3525, roughness: 0.9 });
      const ridge = new THREE.Mesh(ridgeGeo, ridgeMat);
      ridge.position.set(row, 0.1, 0);
      ridge.receiveShadow = true;
      rowGroup.add(ridge);

      // Plants along the ridge
      for (let z = -13; z <= 13; z += 1.4) {
        const plant = new THREE.Mesh(plantGeo, plantMat);
        plant.position.set(row + (Math.random() - 0.5) * 0.15, 0.7, z);
        plant.scale.set(
          0.9 + Math.random() * 0.3,
          0.8 + Math.random() * 0.4,
          0.9 + Math.random() * 0.3
        );
        plant.castShadow = true;
        rowGroup.add(plant);
      }
    }
    scene.add(rowGroup);

    // 5. Smart Optical Trap Post (ESP32-CAM Node)
    const trapGroup = new THREE.Group();
    // Metal post
    const postGeo = new THREE.CylinderGeometry(0.08, 0.08, 3.8);
    const postMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.8 });
    const post = new THREE.Mesh(postGeo, postMat);
    post.position.set(-6, 1.9, -4);
    trapGroup.add(post);

    // Camera box
    const boxGeo = new THREE.BoxGeometry(0.6, 0.5, 0.4);
    const boxMat = new THREE.MeshStandardMaterial({ color: 0xf3f4f6 });
    const camBox = new THREE.Mesh(boxGeo, boxMat);
    camBox.position.set(-6, 3.4, -4);
    trapGroup.add(camBox);

    // Solar Panel on top
    const solarGeo = new THREE.BoxGeometry(0.9, 0.05, 0.7);
    const solarMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, metalness: 0.9, roughness: 0.2 });
    const solar = new THREE.Mesh(solarGeo, solarMat);
    solar.position.set(-6, 3.8, -4);
    solar.rotation.x = 0.3;
    trapGroup.add(solar);

    // Sticky Card Frame (Yellow)
    const cardGeo = new THREE.PlaneGeometry(0.8, 1.1);
    const cardMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, side: THREE.DoubleSide });
    const stickyCard = new THREE.Mesh(cardGeo, cardMat);
    stickyCard.position.set(-6, 2.4, -3.7);
    trapGroup.add(stickyCard);

    // Status LED Beacon (Green)
    const ledGeo = new THREE.SphereGeometry(0.08, 8, 8);
    const ledMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
    const led = new THREE.Mesh(ledGeo, ledMat);
    led.position.set(-6, 3.7, -3.8);
    trapGroup.add(led);

    scene.add(trapGroup);

    // 6. Automated Precision Spraying Rig / Boom
    const sprayerRig = new THREE.Group();
    // Overhead horizontal truss
    const boomGeo = new THREE.CylinderGeometry(0.12, 0.12, 18);
    const boomMat = new THREE.MeshStandardMaterial({ color: 0xeab308, metalness: 0.6 });
    const boom = new THREE.Mesh(boomGeo, boomMat);
    boom.rotation.z = Math.PI / 2;
    boom.position.set(0, 3.5, 0);
    sprayerRig.add(boom);

    // Support towers
    const towerGeo = new THREE.CylinderGeometry(0.15, 0.15, 3.8);
    const towerMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const leftTower = new THREE.Mesh(towerGeo, towerMat);
    leftTower.position.set(-9, 1.9, 0);
    const rightTower = new THREE.Mesh(towerGeo, towerMat);
    rightTower.position.set(9, 1.9, 0);
    sprayerRig.add(leftTower);
    sprayerRig.add(rightTower);

    sprayerRig.position.z = -12;
    scene.add(sprayerRig);
    sprayerRigRef.current = sprayerRig;

    // 7. Spray Mist Particle System (Fine aqueous mist droplets)
    const mistCount = 1200;
    const mistGeo = new THREE.BufferGeometry();
    const mistPos = new Float32Array(mistCount * 3);
    for (let i = 0; i < mistCount * 3; i += 3) {
      mistPos[i] = (Math.random() - 0.5) * 16;
      mistPos[i + 1] = 0.5 + Math.random() * 2.8;
      mistPos[i + 2] = (Math.random() - 0.5) * 2;
    }
    mistGeo.setAttribute('position', new THREE.BufferAttribute(mistPos, 3));
    const mistMat = new THREE.PointsMaterial({
      color: 0x93c5fd,
      size: 0.18,
      transparent: true,
      opacity: 0.0, // Invisible initially
    });
    const mistParticles = new THREE.Points(mistGeo, mistMat);
    scene.add(mistParticles);
    mistParticlesRef.current = mistParticles;

    // 8. Pest Swarm Particle System (Simulated pest activity cloud)
    const pestCount = 600;
    const pestGeo = new THREE.BufferGeometry();
    const pestPos = new Float32Array(pestCount * 3);
    for (let i = 0; i < pestCount * 3; i += 3) {
      pestPos[i] = (Math.random() - 0.5) * 20;
      pestPos[i + 1] = 0.8 + Math.random() * 2.2;
      pestPos[i + 2] = (Math.random() - 0.5) * 22;
    }
    pestGeo.setAttribute('position', new THREE.BufferAttribute(pestPos, 3));
    const pestMat = new THREE.PointsMaterial({
      color: 0xf59e0b,
      size: 0.22,
      transparent: true,
      opacity: 0.7,
    });
    const pestCloud = new THREE.Points(pestGeo, pestMat);
    scene.add(pestCloud);
    pestCloudRef.current = pestCloud;

    // Animation Loop
    let angle = 0;
    const animate = () => {
      animationFrameIdRef.current = requestAnimationFrame(animate);

      // Subtle camera orbit for dynamic depth
      angle += 0.0015;
      camera.position.x = Math.sin(angle) * 3;

      // Animate pest flutter
      if (pestCloudRef.current) {
        const positions = pestCloudRef.current.geometry.attributes.position.array as Float32Array;
        for (let i = 0; i < pestCount * 3; i += 3) {
          positions[i] += (Math.random() - 0.5) * 0.04;
          positions[i + 1] += Math.sin(Date.now() * 0.005 + i) * 0.01;
          positions[i + 2] += (Math.random() - 0.5) * 0.04;
        }
        pestCloudRef.current.geometry.attributes.position.needsUpdate = true;
      }

      renderer.render(scene, camera);
    };
    animate();

    // Handle Window Resize
    const handleResize = () => {
      if (!mountRef.current || !rendererRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight || 520;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Simulation Controller Execution
  const handleStartSimulation = async () => {
    if (simState === 'spraying') return;

    setSimState('infesting');
    setStatusMessage('Simulating rapid pest outbreak threshold breach...');

    // 1. Show glowing red/amber pest swarm
    if (pestCloudRef.current) {
      (pestCloudRef.current.material as THREE.PointsMaterial).color.setHex(0xef4444);
      (pestCloudRef.current.material as THREE.PointsMaterial).size = 0.35;
      (pestCloudRef.current.material as THREE.PointsMaterial).opacity = 0.95;
    }

    // After 1.5s, trigger automated precision spraying rig
    setTimeout(() => {
      setSimState('spraying');
      setStatusMessage('Precision automated spraying rig activated across crop rows...');

      if (mistParticlesRef.current) {
        (mistParticlesRef.current.material as THREE.PointsMaterial).opacity = 0.85;
      }

      let zPos = -12;
      const interval = setInterval(() => {
        zPos += 0.3;
        setSimProgress(Math.min(100, Math.round(((zPos + 12) / 24) * 100)));

        if (sprayerRigRef.current) {
          sprayerRigRef.current.position.z = zPos;
        }
        if (mistParticlesRef.current) {
          mistParticlesRef.current.position.z = zPos;
        }

        // Gradually diminish pest swarm as spray moves across
        if (pestCloudRef.current) {
          const mat = pestCloudRef.current.material as THREE.PointsMaterial;
          mat.opacity = Math.max(0.1, mat.opacity - 0.015);
        }

        if (zPos >= 12) {
          clearInterval(interval);
          setSimState('completed');
          setStatusMessage('Simulation Complete: Pests safely suppressed below action threshold.');

          if (mistParticlesRef.current) {
            (mistParticlesRef.current.material as THREE.PointsMaterial).opacity = 0.0;
          }
          if (pestCloudRef.current) {
            (pestCloudRef.current.material as THREE.PointsMaterial).color.setHex(0x10b981);
            (pestCloudRef.current.material as THREE.PointsMaterial).size = 0.15;
            (pestCloudRef.current.material as THREE.PointsMaterial).opacity = 0.2;
          }

          // Record simulation event to backend
          api.startSimulation({
            field_id: selectedField?.field_id || 'field_001',
            scenario: selectedScenario,
            pest_before: `HIGH (${pestIntensity} insects/card)`,
            pest_after: 'LOW (4 insects/card)',
          }).catch(console.error);
        }
      }, 50);
    }, 1500);
  };

  const handleResetSimulation = () => {
    setSimState('idle');
    setSimProgress(0);
    setStatusMessage('Simulation reset to initial field state.');

    if (sprayerRigRef.current) {
      sprayerRigRef.current.position.z = -12;
    }
    if (mistParticlesRef.current) {
      (mistParticlesRef.current.material as THREE.PointsMaterial).opacity = 0.0;
      mistParticlesRef.current.position.z = -12;
    }
    if (pestCloudRef.current) {
      (pestCloudRef.current.material as THREE.PointsMaterial).color.setHex(0xf59e0b);
      (pestCloudRef.current.material as THREE.PointsMaterial).size = 0.22;
      (pestCloudRef.current.material as THREE.PointsMaterial).opacity = 0.7;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <PageHeader
        category="Interactive WebGL Automated Spraying Rig"
        icon={Box}
        title={t('demo_simulation_title') || '3D Smart Spraying Demonstration'}
        description={
          language === 'kn'
            ? 'ಕೀಟ ಹೆಚ್ಚಳದ ಸಮಯದಲ್ಲಿ ಸ್ಮಾರ್ಟ್ ಸಿಂಪಡಣೆಯ 3D ಪ್ರಾತ್ಯಕ್ಷಿಕೆ (ಪ್ರಸ್ತುತಿಗಾಗಿ ಮಾತ್ರ)'
            : 'Interactive WebGL 3D demonstration illustrating automated precision targeted crop protection'
        }
        action={
          <span className="px-3 py-1.5 rounded-full bg-amber-400 text-stone-950 text-xs font-black uppercase tracking-wider shadow-sm">
            {t('demo_simulation_badge')}
          </span>
        }
      />


      {/* Mandatory Prototype Safety Banner */}
      <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 text-xs space-y-1">
        <div className="font-extrabold text-amber-950 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Statutory Safety Notice — Demonstration Mode:</span>
        </div>
        <p className="text-amber-900 leading-relaxed font-medium">
          {t('demo_simulation_warning')}
        </p>
      </div>

      {/* Main 3D Canvas Area */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Canvas 3 Cols */}
        <div className="lg:col-span-3 bg-stone-950 rounded-3xl overflow-hidden shadow-2xl border border-stone-800 relative h-[520px]">
          <div ref={mountRef} className="w-full h-full" />

          {/* Canvas Floating Overlay Controls */}
          <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-stone-900/80 backdrop-blur-md text-emerald-300 text-xs font-bold border border-emerald-500/30 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Field: {selectedField?.name || 'Polyhouse Tomato'}</span>
            </span>
            <span className="px-3 py-1 rounded-full bg-stone-900/80 backdrop-blur-md text-stone-300 text-xs font-mono border border-stone-700">
              Trap Node: trap1 (Active)
            </span>
          </div>

          <div className="absolute bottom-4 left-4 right-4 z-10 bg-stone-900/85 backdrop-blur-md rounded-2xl p-4 border border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${
                  simState === 'spraying'
                    ? 'bg-amber-400 animate-ping'
                    : simState === 'completed'
                    ? 'bg-emerald-400'
                    : 'bg-stone-400'
                }`}></span>
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  {simState === 'idle'
                    ? t('demo_status_idle')
                    : simState === 'infesting'
                    ? 'Pest Outbreak Rising'
                    : simState === 'spraying'
                    ? t('demo_status_running')
                    : t('demo_status_complete')}
                </span>
              </div>
              <p className="text-[11px] text-stone-300 font-medium">{statusMessage}</p>
            </div>

            {/* Progress bar */}
            {simState === 'spraying' && (
              <div className="w-full sm:w-48 bg-stone-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full transition-all duration-75"
                  style={{ width: `${simProgress}%` }}
                ></div>
              </div>
            )}
          </div>
        </div>

        {/* Control Panel 1 Col */}
        <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm space-y-6 text-xs flex flex-col justify-between">
          <div className="space-y-5">
            <div className="pb-3 border-b border-stone-200 flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-stone-900 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-emerald-600" />
                <span>Simulation Parameters</span>
              </h2>
              <span className="font-mono text-[10px] text-stone-400">v1.2-sim</span>
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1">{t('demo_scenario')}</label>
              <select
                value={selectedScenario}
                onChange={(e) => setSelectedScenario(e.target.value)}
                disabled={simState === 'spraying'}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 font-medium focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Whitefly Surge">Whitefly Sudden Surge</option>
                <option value="Fruit Borer Influx">Fruit Borer Moth Influx</option>
                <option value="Tuta Pinworm Mine Outbreak">Tuta Pinworm Rapid Mine</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-bold text-stone-700">{t('demo_pest_level')}</label>
                <span className="font-mono font-bold text-emerald-800">{pestIntensity} / 100</span>
              </div>
              <input
                type="range"
                min="20"
                max="100"
                value={pestIntensity}
                onChange={(e) => setPestIntensity(parseInt(e.target.value))}
                disabled={simState === 'spraying'}
                className="w-full accent-emerald-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-stone-400 mt-0.5">
                <span>Threshold (20)</span>
                <span>Critical (100)</span>
              </div>
            </div>

            <div className="p-3 bg-stone-50 rounded-xl space-y-1.5 border border-stone-100">
              <div className="flex justify-between font-medium">
                <span className="text-stone-500">Rig Velocity:</span>
                <span className="font-bold text-stone-800">1.2 m/s</span>
              </div>
              <div className="flex justify-between font-medium">
                <span className="text-stone-500">Droplet Micron:</span>
                <span className="font-bold text-stone-800">120 µm Micro-mist</span>
              </div>
              <div className="flex justify-between font-medium">
                <span className="text-stone-500">Physical Actuation:</span>
                <span className="font-bold text-red-600">DISABLED (Demo Only)</span>
              </div>
            </div>
          </div>

          <div className="space-y-2.5 pt-4 border-t border-stone-200">
            <button
              onClick={handleStartSimulation}
              disabled={simState === 'spraying'}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{simState === 'spraying' ? 'Simulating...' : t('action_start_3d')}</span>
            </button>

            <button
              onClick={handleResetSimulation}
              className="w-full py-2.5 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-700 font-bold transition-all flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t('action_reset')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
