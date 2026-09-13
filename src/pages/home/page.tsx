import Navbar from '@/components/feature/Navbar';
import Footer from '@/components/feature/Footer';
import DocumentHead from '@/components/feature/DocumentHead';
import AdSlot from '@/components/feature/AdSlot';
import HeroSection from './components/HeroSection';
import CategoriesSection from './components/CategoriesSection';
import FeaturedJobsSection from './components/FeaturedJobsSection';
import HowItWorksSection from './components/HowItWorksSection';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <DocumentHead path="/" />
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <CategoriesSection />
        <div className="px-4 md:px-6 lg:px-8 max-w-6xl mx-auto py-4 md:py-6">
          <AdSlot placement="home" />
        </div>
        <FeaturedJobsSection />
        <HowItWorksSection />
      </main>
      <Footer />
    </div>
  );
}
