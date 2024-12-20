import { Billboard, Text } from '@react-three/drei';
import { ObjectMap, useFrame } from '@react-three/fiber';
import { Color, Vector3 } from 'three';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { MathUtils } from 'three';
import { GLTF } from 'three-stdlib';
import useSound from 'use-sound';
import hover from '../../../sounds/hover-1.mp3';
import { MAX_VISIBLE_DISTANCE, MIN_VISIBLE_DISTANCE } from './constants';
import { PlanetDataEntry, PlanetDataEntryArray } from '@/helpers/hooks/api/nasa/types';
import { PlanetAndOrbit } from './planet-with-orbit/planet-and-orbit';
import { group } from 'console';

interface PlanetProps {
  model?: GLTF & ObjectMap;
  type?: string;
  position?: Vector3;
  name?: string;
  modelPosition?: Vector3;
  scale?: number;
  color?: string;
  hoverColor?: string;
  orbitingPlanetHorizonData?: PlanetDataEntry[];
  onClick?: (position: Vector3, scale?: number) => void;
}

export function Planet(props: PlanetProps) {
  const { name, type, model, position, modelPosition, scale, color, hoverColor, orbitingPlanetHorizonData, onClick } =
    props;

  const groupRef = useRef<THREE.Group>();
  const shapeRef = useRef<THREE.Points>();
  const hitboxRef = useRef<THREE.Mesh>();
  const textRef = useRef<THREE.Group>();
  const circleRef = useRef<THREE.Mesh>();
  const pooRef = useRef<THREE.Mesh>();
  const circleMaterialRef = useRef<THREE.MeshBasicMaterial>();

  const [hovered, setHovered] = useState(false);
  const [isClickable, setIsClickable] = useState(true);

  const [playHover] = useSound(hover);

  const origin = new THREE.Vector3(0, 0, 0);
  const planetFromOrigin = position.distanceTo(origin);

  useFrame((state, delta) => {
    const hoverEffectSpeed = 15 * delta;
    const hoverScale = 1.1;

    const time = state.clock.getElapsedTime();
    shapeRef.current.rotation.y = time / 10;

    groupRef.current.scale.x = hovered
      ? MathUtils.lerp(groupRef.current.scale.x, hoverScale, hoverEffectSpeed)
      : MathUtils.lerp(groupRef.current.scale.x, 1, hoverEffectSpeed);

    groupRef.current.scale.y = hovered
      ? MathUtils.lerp(groupRef.current.scale.y, hoverScale, hoverEffectSpeed)
      : MathUtils.lerp(groupRef.current.scale.y, 1, hoverEffectSpeed);

    groupRef.current.scale.z = hovered
      ? MathUtils.lerp(groupRef.current.scale.z, hoverScale, hoverEffectSpeed)
      : MathUtils.lerp(groupRef.current.scale.z, 1, hoverEffectSpeed);

    // Apply inverse scaling to the shapeRef to counteract group scaling
    shapeRef.current.scale.x = scale / groupRef.current.scale.x;
    shapeRef.current.scale.y = scale / groupRef.current.scale.y;
    shapeRef.current.scale.z = scale / groupRef.current.scale.z;

    const distance = state.camera.position.distanceTo(groupRef.current.position);
    textRef.current.scale.setScalar(distance * 0.03);
    circleRef.current.scale.setScalar(distance * 0.01);
    pooRef.current.scale.setScalar(distance * 0.01);

    const adjustedMaxDistance = MAX_VISIBLE_DISTANCE * (planetFromOrigin / 50) * 0.1;
    const adjustedMinDistance = MIN_VISIBLE_DISTANCE * (5 + scale);
    const isRingVisible = distance <= adjustedMaxDistance && distance >= adjustedMinDistance;
    const isTextVisible = distance <= adjustedMaxDistance && distance >= adjustedMinDistance;

    textRef.current.visible = isTextVisible;
    circleRef.current.visible = isRingVisible;

    setIsClickable(distance > adjustedMinDistance);
  });

  const handlePointerEnter = () => {
    if (!isClickable) return;
    playHover({ playbackRate: 0.7 + Math.random() * (1.1 - 0.7) });
    document.body.style.cursor = 'pointer';
    circleMaterialRef.current.color = new Color(hoverColor);
    setHovered(true);
  };

  const handlePointerLeave = () => {
    document.body.style.cursor = 'auto';
    setHovered(false);
  };

  const handleClick = () => {
    if (!isClickable) return;
    onClick(groupRef.current.position, scale);
  };

  return (
    <group
      ref={groupRef}
      position={position}
      onClick={handleClick}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
    >
      <primitive
        ref={shapeRef}
        object={model.scene}
        rotation={[1.5708, 0, 0]}
        scale={[1 * scale, 1 * scale, 1 * scale]}
        position={modelPosition}
      />
      <Billboard>
        <Text
          ref={textRef}
          scale={0.1}
          position={[5 * scale, 6 * scale, 0]}
          anchorX='left'
          anchorY='top'
          font='/Montserrat-SemiBold.ttf'
          fontWeight='medium'
        >
          {name.toUpperCase()}
        </Text>

        <mesh ref={circleRef} position={[0, 0, 0]} scale={0.1}>
          <ringGeometry args={[1, 1.1, 64]} />

          <meshBasicMaterial ref={circleMaterialRef} color={color} side={THREE.DoubleSide} />
        </mesh>
        <mesh ref={pooRef} position={[0, 0, 0]} scale={0.1}>
          <circleGeometry args={[1.1, 64]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
      </Billboard>
    </group>
  );
}
