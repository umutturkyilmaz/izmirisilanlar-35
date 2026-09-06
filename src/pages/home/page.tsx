import Navbar from '@/components/feature/Navbar';
import Footer from '@/components/feature/Footer';
import DocumentHead from '@/components/feature/DocumentHead';
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
        <FeaturedJobsSection />
        <HowItWorksSection />
      </main>
      <Footer />
    </div>
  );
}