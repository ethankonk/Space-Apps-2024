import { PlanetDataEntry, PlanetDataEntryArray } from '@/helpers/hooks/api/nasa/types';
import { useGLTF } from '@react-three/drei';
import { useEffect, useState } from 'react';
import * as THREE from 'three';
import { Vector3 } from 'three';
import { hoverColor, ORBIT_MULTIPLIER, planetColors } from '../constants';
import { PlanetOrbit } from '../orbit';
import { Planet } from '../planet';
import { planetOrbitalData } from './types';
import { getPlanetPosition } from './utils';

interface PlanetAndOrbitProps {
  modelUrl: string;
  name: keyof typeof planetOrbitalData;
  type?: string;
  horizonData: PlanetDataEntry[];
  orbitPosition?: THREE.Vector3;
  orbitRotation?: THREE.Euler;
  modelPosition?: Vector3;
  scale?: number;
  orbitingPlanetHorizonData?: PlanetDataEntry[];
  // orbitersHorizonData?: any;
  onClick?: (position: Vector3, scale?: number) => void;
}

export function PlanetAndOrbit({
  modelUrl,
  name,
  type = 'planet',
  horizonData,
  orbitPosition,
  orbitRotation = new THREE.Euler(0, 0, 0),
  modelPosition,
  scale = 1,
  orbitingPlanetHorizonData = [{ time: '', datetime: '', x: 0, y: 0, z: 0 }],
  onClick,
}: PlanetAndOrbitProps) {
  const planetModel = useGLTF(modelUrl);
  const [sMajor, setSMajor] = useState(1);
  const [sMinor, setSMinor] = useState(1);
  const [planetPos, setPlanetPos] = useState<[number, number, number]>([0, 0, 0]);
  const [inclination, setInclination] = useState(0);
  const [longitudeOfAscendingNode, setLongitudeOfAscendingNode] = useState(0);
  const [argumentOfPeriapsis, setArgumentOfPeriapsis] = useState(0);

  console.log(`${name}'s orbitingPlanetHorizonData`, orbitingPlanetHorizonData[0]);
  // console.log(`${name}'s horizonData: `, horizonData);

  // console.log(`${name}'s stuff: `, sMajor, sMinor, inclination, longitudeOfAscendingNode, argumentOfPeriapsis);

  useEffect(() => {
    const planetData = planetOrbitalData[name];

    if (planetData) {
      setSMajor(planetData.semiMajorAxis * ORBIT_MULTIPLIER);
      setSMinor(planetData.semiMinorAxis * ORBIT_MULTIPLIER);
      setInclination(planetData.inclination);
      setLongitudeOfAscendingNode(planetData.longitudeOfAscendingNode);
      setArgumentOfPeriapsis(planetData.argumentOfPeriapsis);
    }

    if (horizonData && horizonData.length) {
      const latestPositionData = horizonData[0];
      const latestPosition = getPlanetPosition(latestPositionData);
      const scaledPosition = new THREE.Vector3(
        latestPosition[0] * ORBIT_MULTIPLIER,
        latestPosition[1] * ORBIT_MULTIPLIER,
        latestPosition[2] * ORBIT_MULTIPLIER,
      );
      setPlanetPos([scaledPosition.x, scaledPosition.y, scaledPosition.z]);
    } else {
      // fallback to a random orbit position when Horizon data is not available
      const angle = Math.random() * 2 * Math.PI;
      const x = sMajor * Math.cos(angle);
      const y = sMinor * Math.sin(angle);
      const position = new THREE.Vector3(x, y, 0);
      setPlanetPos([position.x, position.y, position.z]);
    }
  }, [name, horizonData, sMajor, sMinor, inclination]);

  return (
    <group>
      <Planet
        model={planetModel}
        type={type}
        position={new Vector3(planetPos[0], planetPos[1], planetPos[2])}
        name={name}
        modelPosition={modelPosition}
        scale={scale}
        onClick={onClick}
        color={planetColors[name]}
        hoverColor={hoverColor[name]}
        orbitingPlanetHorizonData={orbitingPlanetHorizonData}
      />
      <PlanetOrbit
        name={name}
        sMajor={sMajor}
        sMinor={sMinor}
        inclination={inclination}
        longitudeOfAscendingNode={longitudeOfAscendingNode}
        argumentOfPeriapsis={argumentOfPeriapsis}
        position={[
          orbitingPlanetHorizonData[0].x * ORBIT_MULTIPLIER,
          orbitingPlanetHorizonData[0].y * ORBIT_MULTIPLIER,
          orbitingPlanetHorizonData[0].z * ORBIT_MULTIPLIER,
        ]}
        rotation={new THREE.Euler(0, 0, 0)}
        color={planetColors[name]}
        hoverColor={hoverColor[name]}
        onClick={() => onClick(new Vector3(planetPos[0], planetPos[1], planetPos[2]), scale)}
      />
    </group>
  );
}
