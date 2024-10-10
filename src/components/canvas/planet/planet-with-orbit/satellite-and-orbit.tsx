import { PlanetDataEntry, PlanetDataEntryArray } from '@/helpers/hooks/api/nasa/types';
import { useGLTF } from '@react-three/drei';
import { useEffect, useState, useRef } from 'react';
import * as THREE from 'three';
import { Vector3 } from 'three';
import { PLANET_DATA, ORBIT_MULTIPLIER } from '../constants';
import { PlanetOrbit } from '../orbit';
import { Satellite } from '../satellite';
import { getPlanetPosition, getNearestPointOnOrbit } from './utils';
import { useFrame } from '@react-three/fiber';
import { rotate } from 'maath/dist/declarations/src/buffer';

interface SatelliteAndOrbitProps {
  modelUrl: string;
  name: keyof typeof PLANET_DATA;
  orbitingBodyName: keyof typeof PLANET_DATA;
  horizonData: PlanetDataEntry[];
  orbitPosition?: THREE.Vector3;
  orbitRotation?: THREE.Euler;
  modelPosition?: Vector3;
  scale?: number;
  orbitingPlanetHorizonData?: PlanetDataEntry[];
  onClick?: (position: Vector3, scale?: number) => void;
}

export function SatelliteAndOrbit({
  modelUrl,
  name,
  orbitingBodyName,
  horizonData,
  orbitPosition,
  orbitRotation = new THREE.Euler(0, 0, 0),
  modelPosition,
  scale = 1,
  orbitingPlanetHorizonData = [{ time: '', datetime: '', x: 0, y: 0, z: 0 }],
  onClick,
}: SatelliteAndOrbitProps) {
  const planetModel = useGLTF(modelUrl);
  const [sMajor, setSMajor] = useState(1);
  const [sMinor, setSMinor] = useState(1);
  const [planetPos, setPlanetPos] = useState<[number, number, number]>([0, 0, 0]);
  const [inclination, setInclination] = useState(0);
  const [longitudeOfAscendingNode, setLongitudeOfAscendingNode] = useState(0);
  const [argumentOfPeriapsis, setArgumentOfPeriapsis] = useState(0);
  const [rotatedEllipsePoints, setRotatedEllipsePoints] = useState<THREE.Vector3[]>([]);
  const offset = PLANET_DATA[name].offset * ORBIT_MULTIPLIER * -1;

  const [orbitingBodySMajor, setOrbitingBodySMajor] = useState(1);
  const [orbitingBodySMinor, setOrbitingBodySMinor] = useState(1);
  const [orbitingBodyInclination, setOrbitingBodyInclination] = useState(0);
  const [orbitingBodyLongitudeOfAscendingNode, setOrbitingBodyLongitudeOfAscendingNode] = useState(0);
  const [orbitingBodyArgumentOfPeriapsis, setOrbitingBodyArgumentOfPeriapsis] = useState(0);
  const [orbitingBodyNearestPoint, setOrbitingBodyNearestPoint] = useState<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const orbitingBodyOffset = PLANET_DATA[orbitingBodyName].offset * ORBIT_MULTIPLIER * -1;

  useEffect(() => {
    const planetData = PLANET_DATA[name];
    const orbitingBodyData = PLANET_DATA[orbitingBodyName];

    if (planetData) {
      setSMajor(planetData.semiMajorAxis * ORBIT_MULTIPLIER);
      setSMinor(planetData.semiMinorAxis * ORBIT_MULTIPLIER);
      setInclination(planetData.inclination);
      setLongitudeOfAscendingNode(planetData.longitudeOfAscendingNode);
      setArgumentOfPeriapsis(planetData.argumentOfPeriapsis);
    }

    if (orbitingBodyData) {
      setOrbitingBodySMajor(orbitingBodyData.semiMajorAxis * ORBIT_MULTIPLIER);
      setOrbitingBodySMinor(orbitingBodyData.semiMinorAxis * ORBIT_MULTIPLIER);
      setOrbitingBodyInclination(orbitingBodyData.inclination);
      setOrbitingBodyLongitudeOfAscendingNode(orbitingBodyData.longitudeOfAscendingNode);
      setOrbitingBodyArgumentOfPeriapsis(orbitingBodyData.argumentOfPeriapsis);
    }

    if (horizonData && horizonData.length) {
      const latestPositionData = horizonData[0];
      const latestPosition = getPlanetPosition(latestPositionData);
      const scaledPosition = new THREE.Vector3(
        latestPosition[0] * ORBIT_MULTIPLIER,
        latestPosition[1] * ORBIT_MULTIPLIER,
        latestPosition[2] * ORBIT_MULTIPLIER,
      );

      const orbitPositionAdjusted = orbitingPlanetHorizonData.length
        ? new THREE.Vector3(
            orbitingPlanetHorizonData[0].x * ORBIT_MULTIPLIER,
            orbitingPlanetHorizonData[0].y * ORBIT_MULTIPLIER,
            orbitingPlanetHorizonData[0].z * ORBIT_MULTIPLIER,
          )
        : new THREE.Vector3(0, 0, 0);

      const [orbitingBodyNearestPoint] = getNearestPointOnOrbit(
        orbitPositionAdjusted,
        orbitingBodySMajor,
        orbitingBodySMinor,
        orbitingBodyInclination,
        orbitingBodyLongitudeOfAscendingNode,
        orbitingBodyArgumentOfPeriapsis,
        orbitingBodyOffset,
      );
      setOrbitingBodyNearestPoint(orbitingBodyNearestPoint);

      const [nearestPoint, rotatedEllipsePoints] = getNearestPointOnOrbit(
        scaledPosition,
        sMajor,
        sMinor,
        inclination,
        longitudeOfAscendingNode,
        argumentOfPeriapsis,
        offset,
        new Vector3(0, 0, 0), // Pass the orbit position
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
    <group position={orbitingBodyNearestPoint}>
      <Satellite
        model={planetModel}
        position={new Vector3(planetPos[0], planetPos[1], planetPos[2])}
        // position={new Vector3(0, 0, 0)}
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
          position={new Vector3(0, 0, 0)}
          color={PLANET_DATA[name].color}
          hoverColor={PLANET_DATA[name].hoverColor}
          rotatedEllipsePointsTest={rotatedEllipsePoints}
          onClick={() => onClick(new Vector3(planetPos[0], planetPos[1], planetPos[2]), scale)}
        />
      )}
    </group>
  );
}
