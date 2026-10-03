import { AboutPreview } from "@/components/home/about-preview";
import { CategoryGrid } from "@/components/home/category-grid";
import { FeaturedArtwork } from "@/components/home/featured-artwork";
import { Hero } from "@/components/home/hero";
import { Gallery3DWrapper } from "@/components/gallery-3d/gallery-3d-wrapper";

export default function HomePage() {
  return (
    <>
      <Gallery3DWrapper fallback={<Hero />} />
      <FeaturedArtwork />
      <CategoryGrid />
      <AboutPreview />
    </>
  );
}