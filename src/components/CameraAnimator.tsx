import { useFrame, useThree } from '@react-three/fiber';
import { useScroll } from '@react-three/drei';

const CameraAnimator: React.FC = () => {
  const { camera } = useThree();
  const scroll = useScroll();

  useFrame(() => {
    const page = scroll.offset * 4; // 4 is (number of sections - 1)
    camera.position.y = -page * 5; // 5 is the distance between verts
  });

  return null;
};

export default CameraAnimator;
