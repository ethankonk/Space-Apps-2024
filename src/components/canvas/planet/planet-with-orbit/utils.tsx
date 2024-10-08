import { PlanetDataEntry } from '@/helpers/hooks/api/nasa/types';
import * as THREE from 'three';

export function getPlanetPosition(horizonData: PlanetDataEntry): [number, number, number] {
  const { x, y, z } = horizonData;

  return [x, y, z];
}

export function getNearestPointOnOrbit(
  currentPos: THREE.Vector3,
  sMajor: number,
  sMinor: number,
  inclination: number,
  longitudeOfAscendingNode: number,
  argumentOfPeriapsis: number,
  offset: number,
  orbitPosition?: THREE.Vector3, // Add orbit position as a parameter
): [THREE.Vector3, any[]] {
  // Generate points on the ellipse
  const ellipseCurve = new THREE.EllipseCurve(
    offset, // center X (relative to orbit center)
    0, // center Y (relative to orbit center)
    sMajor, // semi-major axis
    sMinor, // semi-minor axis
    0, // start angle
    2 * Math.PI, // end angle (full orbit)
    false, // clockwise
    0, // rotation angle
  );

  const points = ellipseCurve.getPoints(1000);
  const ellipsePoints = points.map((point) => new THREE.Vector3(point.x, point.y, 0));

  // Apply 3D rotations
  const apply3DRotations = (
    points: THREE.Vector3[],
    inclination: number,
    longitudeOfAscendingNode: number,
    argumentOfPeriapsis: number,
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
    argumentOfPeriapsis,
  );

  // Adjust points by the orbit's position

  const adjustedEllipsePoints = orbitPosition
    ? rotatedEllipsePoints.map((point) => point.add(orbitPosition))
    : rotatedEllipsePoints;

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

  return [nearestPoint, rotatedEllipsePoints];
}
