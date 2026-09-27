import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Marquee from './components/Marquee';
import Features from './components/Features';
import HowItWorks from './components/HowItWorks';
import PriceTable from './components/PriceTable';
import Pricing from './components/Pricing';
import WhyUs from './components/WhyUs';
import LanguagesSection from './components/LanguagesSection';
import FAQ from './components/FAQ';
import FinalCTA from './components/FinalCTA';
import Footer from './components/Footer';

export default function App() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        <Hero />
        <Marquee />
        <Features />
        <HowItWorks />
        <PriceTable />
        <Pricing />
        <WhyUs />
        <LanguagesSection />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
