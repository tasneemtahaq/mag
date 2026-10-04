import { SRGBColorSpace } from "three";
import type { Texture } from "three";

// Makes a loaded image look right: correct colors and sharp at angles
export function prepareTexture<T extends Texture>(texture: T, anisotropy = 8): T {
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = anisotropy;
  texture.needsUpdate = true;
  return texture;
}

export function textureAspect(texture: Texture) {
  const image = texture.image as { width: number; height: number };
  return image.width / image.height;
}

// The largest rectangle with this aspect ratio that fits inside the box
export function fitInside(aspect: number, maxWidth: number, maxHeight: number) {
  let width = maxWidth;
  let height = width / aspect;
  if (height > maxHeight) {
    height = maxHeight;
    width = height * aspect;
  }
  return { width, height };
}
