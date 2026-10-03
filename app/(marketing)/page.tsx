import { Hero } from "@/features/landing/hero";
import { HowItWorks } from "@/features/landing/how-it-works";
import { Faq } from "@/features/landing/faq";
import { BeforeAfter, DriversSection, FinalCta, NigeriaSection, Preview, Products, SafetySection } from "@/features/landing/sections";

export default function LandingPage() {
  return (
    <>
      <Hero />
      {/*<BeforeAfter />*/}
      <HowItWorks />
      <Products />
      <Preview />
      <NigeriaSection />
      {/*<SafetySection />*/}
      <DriversSection />
      <Faq />
      <FinalCta />
    </>
  );
}
