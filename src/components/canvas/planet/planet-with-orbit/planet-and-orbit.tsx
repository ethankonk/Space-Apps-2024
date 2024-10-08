import { PlanetDataEntry, PlanetDataEntryArray } from '@/helpers/hooks/api/nasa/types';
import { useGLTF } from '@react-three/drei';
import { useEffect, useState, useRef } from 'react';
import * as THREE from 'three';
import { Vector3 } from 'three';
import { hoverColor, ORBIT_MULTIPLIER, planetColors, PLANET_OFFSETS } from '../constants';
import { PlanetOrbit } from '../orbit';
import { Planet } from '../planet';
import { planetOrbitalData } from './types';
import { getPlanetPosition } from './utils';
import { useFrame } from '@react-three/fiber';

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
  onClick?: (position: Vector3, scale?: number) => void;
}

function getNearestPointOnOrbit(
  currentPos: THREE.Vector3,
  sMajor: number,
  sMinor: number,
  inclination: number,
  longitudeOfAscendingNode: number,
  argumentOfPeriapsis: number,
  offset: number,
  orbitPosition: THREE.Vector3 // Add orbit position as a parameter
): THREE.Vector3 {
  // Generate points on the ellipse
  const ellipseCurve = new THREE.EllipseCurve(
    offset, // center X (relative to orbit center)
    0, // center Y (relative to orbit center)
    sMajor, // semi-major axis
    sMinor, // semi-minor axis
    0, // start angle
    2 * Math.PI, // end angle (full orbit)
    false, // clockwise
    0 // rotation angle
  );

  const points = ellipseCurve.getPoints(1000);
  const ellipsePoints = points.map((point) => new THREE.Vector3(point.x, point.y, 0));

  // Apply 3D rotations
  const apply3DRotations = (
    points: THREE.Vector3[],
    inclination: number,
    longitudeOfAscendingNode: number,
    argumentOfPeriapsis: number
  ) => {
    const rotationMatrix = new THREE.Matrix4();

    // Apply argument of periapsis (ω) rotation around Z-axis
    rotationMatrix.makeRotationZ(argumentOfPeriapsis);
    points.forEach((point) => point.applyMatrix4(rotationMatrix));

    // Apply inclination (i) rotation around X-axis
    rotationMatrix.makeRotationX(inclination);
    points.forEach((point) => point.applyMatrix4(rotationMatrix));

    // Apply longitude of ascending node (Ω) rotation around Z-axis
    rotationMatrix.makeRotationZ(longitudeOfAscendingNode);
    points.forEach((point) => point.applyMatrix4(rotationMatrix));

    return points;
  };

  const rotatedEllipsePoints = apply3DRotations(
    ellipsePoints,
    inclination,
    longitudeOfAscendingNode,
    argumentOfPeriapsis
  );

  // Adjust points by the orbit's position
  const adjustedEllipsePoints = rotatedEllipsePoints.map((point) =>
    point.add(orbitPosition)
  );

  // Find the nearest point on the ellipse
  let nearestPoint = adjustedEllipsePoints[0];
  let minDistance = currentPos.distanceTo(nearestPoint);

  for (const point of adjustedEllipsePoints) {
    const distance = currentPos.distanceTo(point);
    if (distance < minDistance) {
      nearestPoint = point;
      minDistance = distance;
    }
  }

  return nearestPoint;
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
  const offset = PLANET_OFFSETS[name] * ORBIT_MULTIPLIER * -1;

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

      const orbitPositionAdjusted = orbitingPlanetHorizonData.length
        ? new THREE.Vector3(
            orbitingPlanetHorizonData[0].x * ORBIT_MULTIPLIER,
            orbitingPlanetHorizonData[0].y * ORBIT_MULTIPLIER,
            orbitingPlanetHorizonData[0].z * ORBIT_MULTIPLIER
          )
        : new THREE.Vector3(0, 0, 0);

      const nearestPoint = getNearestPointOnOrbit(
        scaledPosition,
        sMajor,
        sMinor,
        inclination,
        longitudeOfAscendingNode,
        argumentOfPeriapsis,
        offset,
        orbitPositionAdjusted // Pass the orbit position
      );

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