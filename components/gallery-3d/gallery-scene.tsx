import { useFrame, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useRef } from "react";
import { MathUtils, PMREMGenerator } from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { Artworks } from "@/components/gallery-3d/artworks";
import { Facade, Room } from "@/components/gallery-3d/building";
import { CameraRig } from "@/components/gallery-3d/camera-rig";
import type { ProgressRef } from "@/components/gallery-3d/gallery-layout";

// Runs first on every frame: glides the scroll value so motion feels smooth
function ProgressDriver({
  target,
  smoothRef,
}: {
  target: ProgressRef;
  smoothRef: ProgressRef;
}) {
  useFrame((_, delta) => {
    smoothRef.current = MathUtils.damp(
      smoothRef.current,
      target.current,
      4,
      delta,
    );
  }, -1);
  return null;
}

// A built-in studio environment gives the floor and frames realistic reflections
function GalleryEnvironment() {
  const gl = useThree((state) => state.gl);
  const get = useThree((state) => state.get);

  useEffect(() => {
    const { scene } = get();
    const pmrem = new PMREMGenerator(gl);
    const room = new RoomEnvironment();
    const target = pmrem.fromScene(room, 0.04);
    scene.environment = target.texture;
    scene.environmentIntensity = 0.55;

    return () => {
      scene.environment = null;
      target.dispose();
      room.dispose();
      pmrem.dispose();
    };
  }, [gl, get]);

  return null;
}

// Mounts only after everything inside the same <Suspense> has finished loading
function SceneReady({ onReady }: { onReady: () => void }) {
  useEffect(() => {
    onReady();
  }, [onReady]);
  return null;
}

export function GalleryScene({
  progress,
  onReady,
}: {
  progress: ProgressRef;
  onReady: () => void;
}) {
  const smoothRef = useRef(0);
  const heroSizeRef = useRef({ width: 6, height: 4 });

  return (
    <>
      <ProgressDriver target={progress} smoothRef={smoothRef} />

      {/* General soft light (the spotlights live with the artworks) */}
      <hemisphereLight color="#ffffff" groundColor="#e6dfd2" intensity={0.45} />
      <ambientLight intensity={0.15} />
      <GalleryEnvironment />

      <Room />

      {/* Things that load image files: the screen stays on "Entering the gallery" until all are ready */}
      <Suspense fallback={null}>
        <Facade smooth={smoothRef} />
        <Artworks heroSize={heroSizeRef} />
        <SceneReady onReady={onReady} />
      </Suspense>

      <CameraRig smoothRef={smoothRef} heroSizeRef={heroSizeRef} />
    </>
  );
}