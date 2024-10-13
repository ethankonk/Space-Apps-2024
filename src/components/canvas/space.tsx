import { useHorizonsRouteQuery } from '@/helpers/hooks/nasa/query';
import { useScreenSize } from '@/helpers/hooks/screen-size';
import { CameraControls, PerspectiveCamera, useGLTF } from '@react-three/drei';
import { useRef } from 'react';
import * as THREE from 'three';
import { useCameraMovement } from '../provider/camera';
import { Planet } from './planet/planet';
import { Sun } from './planet/sun';
import { StarBackground } from './star-background';
import { Vector3 } from 'three';
import useSound from 'use-sound';
import click from '../../sounds/click-1.mp3';
import fly from '../../sounds/fly-1.mp3';
import { MAX_DOLLY_DISTANCE, MIN_DOLLY_DISTANCE, PLANET_DATA } from './planet/constants';
import { PlanetAndOrbit } from './planet/planet-with-orbit/planet-and-orbit';
import { onLoadable } from '@/helpers/hooks/api/query'; // Import onLoadable
import { EffectComposer, Bloom, GodRays } from '@react-three/postprocessing'; // Import Bloom effect
import { BlurPass, Resizer, KernelSize, Resolution } from 'postprocessing';
import { SatelliteAndOrbit } from './planet/planet-with-orbit/satellite-and-orbit';

export interface SpaceProps {
  showStartScreen: boolean;
  onPlanetClick: (planetName: string) => void;
}

export function Space(props: SpaceProps) {
  const sun = useGLTF('/planets/sun/scene.glb');

  const { showStartScreen, onPlanetClick } = props;

  const cameraRef = useRef<THREE.PerspectiveCamera>();
  const { cameraControlRef, cameraDefaultRotation, handleZoomCamera } = useCameraMovement();

  const horizonDataLoadable = useHorizonsRouteQuery({ enabled: true });

  const screenSize = useScreenSize();
  const isSmallScreen = screenSize.width < 1280;

  const [playClick] = useSound(click, { interrupt: true });
  const [playFly] = useSound(fly, { interrupt: true });

  const sunRef = useRef();

  const handlePlanetClick = (planetName: string, position: Vector3, scale?: number) => {
    if (position) {
      playClick();
      playFly();
      handleZoomCamera(position, scale);
      onPlanetClick(planetName);
    } else {
      console.warn(`Unknown planet: ${planetName}`);
    }
  };

  return onLoadable(horizonDataLoadable)(
    () => null,
    () => null,
    (horizonData) => (
      <group>
        <PerspectiveCamera
          ref={cameraRef}
          makeDefault
          position={[0, 0, 1]}
          rotation={cameraDefaultRotation}
          far={10000000}
        />

        <StarBackground />
        <ambientLight intensity={0.2} />
        <group>
          <CameraControls minDistance={MIN_DOLLY_DISTANCE} maxDistance={MAX_DOLLY_DISTANCE} ref={cameraControlRef} />

          {/* Sun */}
          <Sun
            model={sun}
            position={new Vector3(0, 0, 0)}
            scale={1} // Sun's base scale
            name='Sun'
            onClick={(pos) => handlePlanetClick('Sun', pos, 1)}
          />
          <pointLight position={[0, 0, 0]} intensity={5} distance={0} decay={0} castShadow={true} />

          {/* Mercury */}
          <group>
            <PlanetAndOrbit
              modelUrl='/planets/mercury/scene.glb'
              scale={PLANET_DATA['Mercury'].scale} // Mercury scale: 0.0035x
              name='Mercury'
              horizonData={horizonData.data['Mercury']}
              onClick={(pos) => handlePlanetClick('Mercury', pos, PLANET_DATA['Mercury'].scale)}
            />
          </group>

          {/* Venus */}
          <PlanetAndOrbit
            modelUrl='/planets/venus/scene.glb'
            scale={PLANET_DATA['Venus'].scale} // Venus scale: 0.0087x
            name='Venus'
            horizonData={horizonData.data['Venus']}
            onClick={(pos) => handlePlanetClick('Venus', pos, PLANET_DATA['Venus'].scale)}
          />

          {/* Earth */}
          <PlanetAndOrbit
            modelUrl='/planets/earth/scene.glb'
            scale={PLANET_DATA['Earth'].scale} // Earth scale: 0.0092x
            name='Earth'
            horizonData={horizonData.data['Earth']}
            onClick={(pos) => handlePlanetClick('Earth', pos, PLANET_DATA['Earth'].scale)}
          />

          <SatelliteAndOrbit
            modelUrl='/planets/earth/moon/scene.glb'
            scale={PLANET_DATA['Moon'].scale} // Moon scale: 0.0025x
            name='Moon'
            orbitingBodyName='Earth'
            horizonData={horizonData.data['Moon']}
            onClick={(pos, scale) => handlePlanetClick('Moon', pos, scale)}
            orbitingPlanetHorizonData={horizonData.data['Earth']}
          />

          {/* Mars */}
          <PlanetAndOrbit
            modelUrl='/planets/mars/scene.glb'
            scale={PLANET_DATA['Mars'].scale} // Mars scale: 0.0048x
            name='Mars'
            horizonData={horizonData.data['Mars']}
            onClick={(pos) => handlePlanetClick('Mars', pos, PLANET_DATA['Mars'].scale)}
          />

          <SatelliteAndOrbit
            modelUrl='/planets/mars/phobos/scene.glb'
            scale={PLANET_DATA['Phobos'].scale}
            name='Phobos'
            orbitingBodyName='Mars'
            horizonData={horizonData.data['Phobos']}
            onClick={(pos, scale) => handlePlanetClick('Phobos', pos, scale)}
            orbitingPlanetHorizonData={horizonData.data['Mars']}
          />

          <SatelliteAndOrbit
            modelUrl='/planets/mars/deimos/scene.glb'
            scale={PLANET_DATA['Deimos'].scale}
            name='Deimos'
            orbitingBodyName='Mars'
            horizonData={horizonData.data['Deimos']}
            onClick={(pos, scale) => handlePlanetClick('Deimos', pos, scale)}
            orbitingPlanetHorizonData={horizonData.data['Mars']}
          />

          {/* Jupiter */}
          <PlanetAndOrbit
            modelUrl='/planets/jupiter/scene.glb'
            scale={PLANET_DATA['Jupiter'].scale}
            name='Jupiter'
            horizonData={horizonData.data['Jupiter']}
            onClick={(pos) => handlePlanetClick('Jupiter', pos, PLANET_DATA['Jupiter'].scale)}
          />

          <SatelliteAndOrbit
            modelUrl='/planets/jupiter/io/scene.glb'
            scale={PLANET_DATA['Io'].scale}
            name='Io'
            orbitingBodyName='Jupiter'
            horizonData={horizonData.data['Io']}
            onClick={(pos, scale) => handlePlanetClick('Io', pos, scale)}
            orbitingPlanetHorizonData={horizonData.data['Jupiter']}
          />

          <SatelliteAndOrbit
            modelUrl='/planets/jupiter/europa/scene.glb'
            scale={PLANET_DATA['Europa'].scale}
            name='Europa'
            orbitingBodyName='Jupiter'
            horizonData={horizonData.data['Europa']}
            onClick={(pos, scale) => handlePlanetClick('Europa', pos, scale)}
            orbitingPlanetHorizonData={horizonData.data['Jupiter']}
          />

          <SatelliteAndOrbit
            modelUrl='/planets/jupiter/ganymede/scene.glb'
            scale={PLANET_DATA['Ganymede'].scale}
            name='Ganymede'
            orbitingBodyName='Jupiter'
            horizonData={horizonData.data['Ganymede']}
            onClick={(pos, scale) => handlePlanetClick('Ganymede', pos, scale)}
            orbitingPlanetHorizonData={horizonData.data['Jupiter']}
          />

          <SatelliteAndOrbit
            modelUrl='/planets/jupiter/callisto/scene.glb'
            scale={PLANET_DATA['Callisto'].scale}
            name='Callisto'
            orbitingBodyName='Jupiter'
            horizonData={horizonData.data['Callisto']}
            onClick={(pos, scale) => handlePlanetClick('Callisto', pos, scale)}
            orbitingPlanetHorizonData={horizonData.data['Jupiter']}
          />

          {/* Saturn */}
          <PlanetAndOrbit
            modelUrl='/planets/saturn/scene.glb'
            scale={PLANET_DATA['Saturn'].scale} // Saturn scale: 0.0837x
            name='Saturn'
            horizonData={horizonData.data['Saturn']}
            onClick={(pos) => handlePlanetClick('Saturn', pos, PLANET_DATA['Saturn'].scale)}
          />

          <SatelliteAndOrbit
            modelUrl='/planets/saturn/titan/scene.glb'
            scale={PLANET_DATA['Titan'].scale}
            name='Titan'
            orbitingBodyName='Saturn'
            horizonData={horizonData.data['Titan']}
            onClick={(pos, scale) => handlePlanetClick('Titan', pos, scale)}
            orbitingPlanetHorizonData={horizonData.data['Saturn']}
          />

          <SatelliteAndOrbit
            modelUrl='/planets/saturn/rhea/scene.glb'
            scale={PLANET_DATA['Rhea'].scale}
            name='Rhea'
            orbitingBodyName='Saturn'
            horizonData={horizonData.data['Rhea']}
            onClick={(pos, scale) => handlePlanetClick('Rhea', pos, scale)}
            orbitingPlanetHorizonData={horizonData.data['Saturn']}
          />

          <SatelliteAndOrbit
            modelUrl='/planets/saturn/iapetus/scene.glb'
            scale={PLANET_DATA['Iapetus'].scale}
            name='Iapetus'
            orbitingBodyName='Saturn'
            horizonData={horizonData.data['Iapetus']}
            onClick={(pos, scale) => handlePlanetClick('Iapetus', pos, scale)}
            orbitingPlanetHorizonData={horizonData.data['Saturn']}
          />

          <SatelliteAndOrbit
            modelUrl='/planets/saturn/dione/scene.glb'
            scale={PLANET_DATA['Dione'].scale}
            name='Dione'
            orbitingBodyName='Saturn'
            horizonData={horizonData.data['Dione']}
            onClick={(pos, scale) => handlePlanetClick('Dione', pos, scale)}
            orbitingPlanetHorizonData={horizonData.data['Saturn']}
          />

          <SatelliteAndOrbit
            modelUrl='/planets/saturn/tethys/scene.glb'
            scale={PLANET_DATA['Tethys'].scale}
            name='Tethys'
            orbitingBodyName='Saturn'
            horizonData={horizonData.data['Tethys']}
            onClick={(pos, scale) => handlePlanetClick('Tethys', pos, scale)}
            orbitingPlanetHorizonData={horizonData.data['Saturn']}
          />

          <SatelliteAndOrbit
            modelUrl='/planets/saturn/enceladus/scene.glb'
            scale={PLANET_DATA['Enceladus'].scale}
            name='Enceladus'
            orbitingBodyName='Saturn'
            horizonData={horizonData.data['Enceladus']}
            onClick={(pos, scale) => handlePlanetClick('Enceladus', pos, scale)}
            orbitingPlanetHorizonData={horizonData.data['Saturn']}
          />

          <SatelliteAndOrbit
            modelUrl='/planets/saturn/mimas/scene.glb'
            scale={PLANET_DATA['Mimas'].scale}
            name='Mimas'
            orbitingBodyName='Saturn'
            horizonData={horizonData.data['Mimas']}
            onClick={(pos, scale) => handlePlanetClick('Mimas', pos, scale)}
            orbitingPlanetHorizonData={horizonData.data['Saturn']}
          />

          {/* Uranus */}
          <PlanetAndOrbit
            modelUrl='/planets/uranus/scene.glb'
            name='Uranus'
            scale={PLANET_DATA['Uranus'].scale} // Uranus scale: 0.0365x
            horizonData={horizonData.data['Uranus']}
            onClick={(pos) => handlePlanetClick('Uranus', pos, PLANET_DATA['Uranus'].scale)}
          />

          <SatelliteAndOrbit
            modelUrl='/planets/uranus/miranda/scene.glb'
            scale={PLANET_DATA['Miranda'].scale}
            name='Miranda'
            orbitingBodyName='Uranus'
            horizonData={horizonData.data['Miranda']}
            onClick={(pos, scale) => handlePlanetClick('Miranda', pos, scale)}
            orbitingPlanetHorizonData={horizonData.data['Uranus']}
          />
          <SatelliteAndOrbit
            modelUrl='/planets/uranus/ariel/scene.glb'
            scale={PLANET_DATA['Ariel'].scale}
            name='Ariel'
            orbitingBodyName='Uranus'
            horizonData={horizonData.data['Ariel']}
            onClick={(pos, scale) => handlePlanetClick('Ariel', pos, scale)}
            orbitingPlanetHorizonData={horizonData.data['Uranus']}
          />
          <SatelliteAndOrbit
            modelUrl='/planets/uranus/umbriel/scene.glb'
            scale={PLANET_DATA['Umbriel'].scale}
            name='Umbriel'
            orbitingBodyName='Uranus'
            horizonData={horizonData.data['Umbriel']}
            onClick={(pos, scale) => handlePlanetClick('Umbriel', pos, scale)}
            orbitingPlanetHorizonData={horizonData.data['Uranus']}
          />
          <SatelliteAndOrbit
            modelUrl='/planets/uranus/titania/scene.glb'
            scale={PLANET_DATA['Titania'].scale}
            name='Titania'
            orbitingBodyName='Uranus'
            horizonData={horizonData.data['Titania']}
            onClick={(pos, scale) => handlePlanetClick('Titania', pos, scale)}
            orbitingPlanetHorizonData={horizonData.data['Uranus']}
          />
          <SatelliteAndOrbit
            modelUrl='/planets/uranus/oberon/scene.glb'
            scale={PLANET_DATA['Oberon'].scale}
            name='Oberon'
            orbitingBodyName='Uranus'
            horizonData={horizonData.data['Oberon']}
            onClick={(pos, scale) => handlePlanetClick('Oberon', pos, scale)}
            orbitingPlanetHorizonData={horizonData.data['Uranus']}
          />

          {/* Neptune */}
          <PlanetAndOrbit
            modelUrl='/planets/neptune/scene.glb'
            scale={PLANET_DATA['Neptune'].scale} // Neptune scale: 0.0354x
            name='Neptune'
            horizonData={horizonData.data['Neptune']}
            onClick={(pos) => handlePlanetClick('Neptune', pos, PLANET_DATA['Neptune'].scale)}
          />

          <SatelliteAndOrbit
            modelUrl='/planets/neptune/triton/scene.glb'
            scale={PLANET_DATA['Triton'].scale}
            name='Triton'
            orbitingBodyName='Neptune'
            horizonData={horizonData.data['Triton']}
            onClick={(pos, scale) => handlePlanetClick('Triton', pos, scale)}
            orbitingPlanetHorizonData={horizonData.data['Neptune']}
          />
        </group>
        {/* <EffectComposer>
          <Bloom
            intensity={2.0} // The bloom intensity.
            luminanceThreshold={0} // luminance threshold. Raise this value to mask out darker elements in the scene.
            luminanceSmoothing={1} // smoothness of the luminance threshold. Range is [0, 1]
            kernelSize={KernelSize.HUGE}
          />
        </EffectComposer> */}
      </group>
    ),
  );
}
