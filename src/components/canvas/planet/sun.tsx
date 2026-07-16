import { Billboard, Text } from '@react-three/drei';
import { ObjectMap, useFrame } from '@react-three/fiber';
import { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Color, MathUtils, Vector3 } from 'three';
import { GLTF } from 'three-stdlib';
import useSound from 'use-sound';
import hover from '../../../sounds/hover-1.mp3';
import { MAX_VISIBLE_DISTANCE, MIN_VISIBLE_DISTANCE } from './constants';

interface SunProps {
  model?: GLTF & ObjectMap;
  position?: Vector3;
  name?: string;
  modelPosition?: Vector3;
  scale?: number;
  color?: string;
  hoverColor?: string;
  onClick?: (position: Vector3, scale?: number) => void;
}

export function Sun(props: SunProps) {
  const { name, model, position, modelPosition, scale, color, hoverColor, onClick } = props;
  const starSize = 0.015;

  const groupRef = useRef<THREE.Group>();
  const shapeRef = useRef<THREE.Points>();
  const hitboxRef = useRef<THREE.Mesh>();
  const textRef = useRef<THREE.Group>();
  const circleRef = useRef<THREE.Mesh>();
  const pooRef = useRef<THREE.Mesh>();
  const circleMaterialRef = useRef<THREE.MeshBasicMaterial>();

  const [hovered, setHovered] = useState(false);

  const [playHover] = useSound(hover);

  const origin = new THREE.Vector3(0, 0, 0);
  const planetFromOrigin = position.distanceTo(origin);

  // Make the sun's material glow "brighter than white" so the Bloom pass in
  // <Space> picks it out (and only it). toneMapped=false lets the emissive value
  // exceed 1.0, which is what the bloom luminance threshold keys off of.
  useMemo(() => {
    model?.scene.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh) return;
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      materials.forEach((mat) => {
        const m = mat as THREE.MeshStandardMaterial;
        m.emissive = new Color('#ffca61');
        m.emissiveIntensity = 6;
        m.toneMapped = false;
        m.needsUpdate = true;
      });
    });
  }, [model]);

  // How far the glow halo extends, as a multiple of the sun's radius. Bump this
  // for a bigger halo; drop it for a tighter one.
  const GLOW_SIZE = 10;

  // A soft radial-gradient sprite that sits over the sun and always faces the
  // camera, giving a real glow/corona independent of any postprocessing. The
  // gradient is drawn to a canvas so there's no image asset to ship, and the
  // sprite uses additive blending so it reads as emitted light.
  const glow = useMemo(() => {
    if (typeof document === 'undefined' || !model) return null;

    const res = 256;
    const canvas = document.createElement('canvas');
    canvas.width = res;
    canvas.height = res;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const gradient = ctx.createRadialGradient(res / 2, res / 2, 0, res / 2, res / 2, res / 2);
    gradient.addColorStop(0.0, 'rgba(0, 0, 0, 0)'); // hot white-gold core
    gradient.addColorStop(0.05, 'rgba(255, 245, 214, 1)'); // hot white-gold core
    gradient.addColorStop(0.18, 'rgba(255, 202, 97, 0.85)');
    gradient.addColorStop(0.45, 'rgba(255, 150, 46, 0.3)');
    gradient.addColorStop(1.0, 'rgba(255, 120, 20, 0)'); // fades fully to transparent
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, res, res);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;

    // Size the halo off the sun model's actual bounding radius so it scales with
    // whatever model/scale is used.
    const boundingSphere = new THREE.Box3().setFromObject(model.scene).getBoundingSphere(new THREE.Sphere());
    const radius = boundingSphere.radius * (scale ?? 1);

    return { texture, radius };
  }, [model, scale]);

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

    const distance = state.camera.position.distanceTo(textRef.current.position);
    textRef.current.scale.setScalar(distance * 0.03);
    circleRef.current.scale.setScalar(distance * 0.01);
    pooRef.current.scale.setScalar(distance * 0.01);

    const adjustedMaxDistance = MAX_VISIBLE_DISTANCE * (planetFromOrigin / 50);
    const adjustedMinDistance = MIN_VISIBLE_DISTANCE * scale;
    const isRingVisible = distance <= adjustedMaxDistance && distance >= adjustedMinDistance;
    const isTextVisible = distance <= adjustedMaxDistance && distance >= adjustedMinDistance;

    textRef.current.visible = isTextVisible;
    circleRef.current.visible = isRingVisible;
    // textRef.current.size =
  });

  const handlePointerEnter = () => {
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

      {glow && (
        <sprite scale={[glow.radius * GLOW_SIZE, glow.radius * GLOW_SIZE, 1]} renderOrder={-1}>
          <spriteMaterial
            map={glow.texture}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </sprite>
      )}

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
