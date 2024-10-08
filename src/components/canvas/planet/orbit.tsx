import { Line } from '@react-three/drei';
import { Euler, Vector3 } from '@react-three/fiber';
import { useState, useEffect } from 'react';
import * as THREE from 'three';
import useSound from 'use-sound';
import hover from '../../../sounds/hover-1.mp3';

interface PlanetOrbitProps {
  name?: string;
  rotation?: Euler;
  position?: Vector3;
  color?: string;
  hoverColor?: string;
  lineWidth?: number;
  rotatedEllipsePointsTest?: any[];
  onClick?: VoidFunction;
}

export function PlanetOrbit(props: PlanetOrbitProps) {
  const {
    name,
    rotation = [0, 0, 0],
    position,
    color = 'white',
    hoverColor = '',
    lineWidth,
    rotatedEllipsePointsTest,
    onClick,
  } = props;

  const [currentColor, setCurrentColor] = useState(color);
  const [currentLineWidth, setCurrentLineWidth] = useState(lineWidth);

  const [playHover] = useSound(hover, { volume: 0.2 });

  return (
    <group rotation={rotation}>
      <Line points={rotatedEllipsePointsTest} color={currentColor} lineWidth={currentLineWidth} onClick={onClick} />
      <Line
        points={rotatedEllipsePointsTest}
        color={currentColor}
        visible={false}
        lineWidth={lineWidth + 25}
        onPointerOver={() => {
          playHover({ playbackRate: 0.7 + Math.random() * (1.1 - 0.7) });
          setCurrentColor(hoverColor);
          setCurrentLineWidth(lineWidth + 2);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setCurrentColor(color);
          setCurrentLineWidth(lineWidth);
          document.body.style.cursor = 'auto';
        }}
        onClick={onClick}
      />
    </group>
  );
}
