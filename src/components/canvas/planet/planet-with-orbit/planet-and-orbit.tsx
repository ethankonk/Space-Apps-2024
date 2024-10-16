import { PlanetDataEntry, PlanetDataEntryArray } from '@/helpers/hooks/api/nasa/types';
import { useGLTF } from '@react-three/drei';
import { useEffect, useState, useRef } from 'react';
import * as THREE from 'three';
import { Vector3 } from 'three';
import { PLANET_DATA, ORBIT_MULTIPLIER } from '../constants';
import { PlanetOrbit } from '../orbit';
import { Planet } from '../planet';
import { getPlanetPosition, getNearestPointOnOrbit } from './utils';
import { useFrame } from '@react-three/fiber';
import { rotate } from 'maath/dist/declarations/src/buffer';

interface PlanetAndOrbitProps {
  modelUrl: string;
  name: keyof typeof PLANET_DATA;
  type?: string;
  horizonData: PlanetDataEntry[];
  orbitPosition?: THREE.Vector3;
  orbitRotation?: THREE.Euler;
  modelPosition?: Vector3;
  scale?: number;
  orbitingPlanetHorizonData?: PlanetDataEntry[];
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
  const [rotatedEllipsePoints, setRotatedEllipsePoints] = useState<THREE.Vector3[]>([]);
  const offset = PLANET_DATA[name].offset * ORBIT_MULTIPLIER * -1;

  useEffect(() => {
    const planetData = PLANET_DATA[name];

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

      const [nearestPoint, rotatedEllipsePoints] = getNearestPointOnOrbit(
        scaledPosition,
        sMajor,
        sMinor,
        inclination,
        longitudeOfAscendingNode,
        argumentOfPeriapsis,
        offset,
      );
      setRotatedEllipsePoints(rotatedEllipsePoints);
      setPlanetPos([nearestPoint.x, nearestPoint.y, nearestPoint.z]);
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
        color={PLANET_DATA[name].color}
        hoverColor={PLANET_DATA[name].hoverColor}
        orbitingPlanetHorizonData={orbitingPlanetHorizonData}
      />
      {rotatedEllipsePoints?.length && (
        <PlanetOrbit
          name={name}
          rotation={new THREE.Euler(0, 0, 0)}
          color={PLANET_DATA[name].color}
          hoverColor={PLANET_DATA[name].hoverColor}
          rotatedEllipsePointsTest={rotatedEllipsePoints}
          onClick={() => onClick(new Vector3(planetPos[0], planetPos[1], planetPos[2]), scale)}
        />
      )}
    </group>
  );
}
