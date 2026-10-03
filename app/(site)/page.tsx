import { AboutPreview } from "@/components/home/about-preview";
import { CategoryGrid } from "@/components/home/category-grid";
import { FeaturedArtwork } from "@/components/home/featured-artwork";
import { Hero } from "@/components/home/hero";

export default function HomePage() {
  return (
    <>
      <Hero />
      <FeaturedArtwork />
      <CategoryGrid />
      <AboutPreview />
    </>
  );
}