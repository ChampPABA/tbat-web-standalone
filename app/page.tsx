"use client";

import React, { Suspense } from 'react';
import { AuthProvider } from '@/providers/auth-provider';

// Lazy load all components to reduce initial bundle
const Navigation = React.lazy(() => import('@/components/landing/navigation'));
const HeroSection = React.lazy(() => import('@/components/landing/hero-section'));

// Lazy load all sections to minimize initial bundle
const ValidatorSection = React.lazy(() => import('@/components/landing/validator-section'));
const ExamDetailsSection = React.lazy(() => import('@/components/landing/exam-details-section'));
const FeaturesSection = React.lazy(() => import('@/components/landing/features-section'));
const PricingSection = React.lazy(() => import('@/components/landing/pricing-section'));
const CostSavingsSection = React.lazy(() => import('@/components/landing/cost-savings-section'));
const DentoriumSection = React.lazy(() => import('@/components/landing/dentorium-section'));
const TestimonialsSection = React.lazy(() => import('@/components/landing/testimonials-section'));
const FAQSection = React.lazy(() => import('@/components/landing/faq-section'));
const FinalCTASection = React.lazy(() => import('@/components/landing/final-cta-section'));
const Footer = React.lazy(() => import('@/components/landing/footer'));

// Minimal loading component
const LoadingSection = () => (
  <div className="h-32 bg-gray-100 animate-pulse rounded" />
);

function HomePage() {

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
      <Suspense fallback={<div className="h-16 bg-white shadow-sm" />}>
        <Navigation
          onRegisterClick={handleRegisterClick}
          onLoginClick={handleLoginClick}
        />
      </Suspense>

      {/* Hero Section */}
      <Suspense fallback={<div className="h-96 bg-gradient-to-r from-blue-600 to-blue-700" />}>
        <HeroSection
          onRegisterClick={handleRegisterClick}
          onViewPackagesClick={handleViewPackagesClick}
        />
      </Suspense>

      {/* Below-the-fold sections */}
      <Suspense fallback={<LoadingSection />}>
        <ValidatorSection />
      </Suspense>

      <Suspense fallback={<LoadingSection />}>
        <ExamDetailsSection />
      </Suspense>

      <Suspense fallback={<LoadingSection />}>
        <FeaturesSection />
      </Suspense>

      <Suspense fallback={<LoadingSection />}>
        <PricingSection onSelectPackage={handleSelectPackage} />
      </Suspense>

      <Suspense fallback={<LoadingSection />}>
        <CostSavingsSection />
      </Suspense>

      <Suspense fallback={<LoadingSection />}>
        <DentoriumSection />
      </Suspense>

      <Suspense fallback={<LoadingSection />}>
        <TestimonialsSection />
      </Suspense>

      <Suspense fallback={<LoadingSection />}>
        <FAQSection />
      </Suspense>

      <Suspense fallback={<LoadingSection />}>
        <FinalCTASection
          onRegisterFreeClick={handleRegisterFreeClick}
          onUpgradeClick={handleUpgradeClick}
        />
      </Suspense>

      <Suspense fallback={<LoadingSection />}>
        <Footer />
      </Suspense>
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