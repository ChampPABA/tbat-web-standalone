"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Navigation from '@/components/landing/navigation';
import HeroSection from '@/components/landing/hero-section';
import { AuthProvider } from '@/providers/auth-provider';
import { toast } from 'sonner';

// Dynamic imports for below-the-fold sections with better error handling
const ValidatorSection = dynamic(() => import('@/components/landing/validator-section'), {
  loading: () => <div className="h-32 bg-gray-100 animate-pulse" />,
  ssr: false
});
const ExamDetailsSection = dynamic(() => import('@/components/landing/exam-details-section'), {
  loading: () => <div className="h-32 bg-gray-100 animate-pulse" />,
  ssr: false
});
const FeaturesSection = dynamic(() => import('@/components/landing/features-section'), {
  loading: () => <div className="h-32 bg-gray-100 animate-pulse" />,
  ssr: false
});
const PricingSection = dynamic(() => import('@/components/landing/pricing-section'), {
  loading: () => <div className="h-32 bg-gray-100 animate-pulse" />,
  ssr: false
});
const CostSavingsSection = dynamic(() => import('@/components/landing/cost-savings-section'), {
  loading: () => <div className="h-32 bg-gray-100 animate-pulse" />,
  ssr: false
});
const DentoriumSection = dynamic(() => import('@/components/landing/dentorium-section'), {
  loading: () => <div className="h-32 bg-gray-100 animate-pulse" />,
  ssr: false
});
const TestimonialsSection = dynamic(() => import('@/components/landing/testimonials-section'), {
  loading: () => <div className="h-32 bg-gray-100 animate-pulse" />,
  ssr: false
});
const FAQSection = dynamic(() => import('@/components/landing/faq-section'), {
  loading: () => <div className="h-32 bg-gray-100 animate-pulse" />,
  ssr: false
});
const FinalCTASection = dynamic(() => import('@/components/landing/final-cta-section'), {
  loading: () => <div className="h-32 bg-gray-100 animate-pulse" />,
  ssr: false
});
const Footer = dynamic(() => import('@/components/landing/footer'), {
  loading: () => <div className="h-32 bg-gray-100 animate-pulse" />,
  ssr: false
});

function HomePage() {
  const router = useRouter();

  const handleRegisterClick = () => {
    // Use window.location for more reliable navigation
    window.location.href = '/register';
  };

  const handleLoginClick = () => {
    // This will be handled by the LoginModal component in Navigation
    // No need for alert anymore - modal will open
    console.log('Login clicked!');
  };

  const handleViewPackagesClick = () => {
    console.log('View packages clicked!');
    // Scroll to pricing section
    const element = document.getElementById('pricing');
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  const handleSelectPackage = (packageType: "FREE" | "ADVANCED") => {
    console.log(`Package selected: ${packageType}`);
    window.location.href = '/register';
  };

  const handleRegisterFreeClick = () => {
    window.location.href = '/register';
  };

  const handleUpgradeClick = () => {
    window.location.href = '/register';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <Navigation
        onRegisterClick={handleRegisterClick}
        onLoginClick={handleLoginClick}
      />

      {/* Hero Section */}
      <HeroSection
        onRegisterClick={handleRegisterClick}
        onViewPackagesClick={handleViewPackagesClick}
      />

      {/* Validator Section */}
      <ValidatorSection />

      {/* Exam Details Section */}
      <ExamDetailsSection />

      {/* Features Section */}
      <FeaturesSection />

      {/* Pricing Section */}
      <PricingSection onSelectPackage={handleSelectPackage} />

      {/* Cost Savings Section */}
      <CostSavingsSection />

      {/* Dentorium Section */}
      <DentoriumSection />

      {/* Testimonials Section */}
      <TestimonialsSection />

      {/* FAQ Section */}
      <FAQSection />

      {/* Final CTA Section */}
      <FinalCTASection
        onRegisterFreeClick={handleRegisterFreeClick}
        onUpgradeClick={handleUpgradeClick}
      />

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default function Home() {
  return (
    <AuthProvider>
      <HomePage />
    </AuthProvider>
  );
}