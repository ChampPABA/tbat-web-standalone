'use client';

import React from 'react';
// import { usePackages } from '@/hooks/usePackages'; // TEMPORARILY DISABLED
import { mockPackages } from '@/lib/mock-data';
import { Package } from '@/types/api';
import { PricingCardSkeleton } from '@/components/ui/skeleton';

interface PricingSectionProps {
  onSelectPackage?: (packageType: "FREE" | "ADVANCED") => void;
}

// Error retry component
const ErrorState: React.FC<{ 
  onRetry: () => void;
  error: Error;
}> = ({ onRetry, error }) => (
  <div className="text-center py-12">
    <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
      <h3 className="text-lg font-semibold text-red-800 mb-2">
        เกิดข้อผิดพลาด
      </h3>
      <p className="text-red-600 mb-4 text-sm">
        {error.message}
      </p>
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
      >
        ลองใหม่อีกครั้ง
      </button>
    </div>
  </div>
);

const PricingSection: React.FC<PricingSectionProps> = ({ onSelectPackage }) => {
  // TEMPORARILY DISABLED - Testing without hooks to isolate API spam issue
  // const { data: packages, loading, error, refetch } = usePackages();
  
  // Use static mock data instead of hook during isolation period
  const packages = mockPackages.map(mockPkg => ({
    type: mockPkg.type,
    name: mockPkg.name,
    price: mockPkg.price,
    originalPrice: mockPkg.originalPrice,
    features: mockPkg.features.map(f => f.text),
    is_active: mockPkg.availability.status !== 'full',
    max_users_per_session: mockPkg.availability.maxCapacity,
    description: mockPkg.description,
    badge: mockPkg.badge,
    badgeColor: mockPkg.badgeColor,
    features_detailed: mockPkg.features,
    limitations: mockPkg.limitations,
    availability: mockPkg.availability,
    buttonText: mockPkg.buttonText,
    buttonStyle: mockPkg.buttonStyle,
    footerNote: mockPkg.footerNote
  }));
  const loading = false;
  const error = null;
  const refetch = () => Promise.resolve();

  const handleSelectPackage = (packageType: "FREE" | "ADVANCED") => {
    if (onSelectPackage) {
      onSelectPackage(packageType);
    } else {
      console.log(`Selected package: ${packageType}`);
      alert(`เลือก Package: ${packageType} - จะเชื่อมต่อกับระบบสมัครในอนาคต`);
    }
  };

  // Loading state
  if (loading) {
    return (
      <section className="py-12 md:py-16 bg-white" id="pricing">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              เลือกแพ็กเกจที่เหมาะกับคุณ
            </h2>
            <p className="text-lg text-gray-600">
              กำลังโหลดข้อมูลแพ็กเกจ...
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <PricingCardSkeleton />
            <PricingCardSkeleton />
          </div>
        </div>
      </section>
    );
  }

  // Error state
  if (error) {
    return (
      <section className="py-12 md:py-16 bg-white" id="pricing">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              เลือกแพ็กเกจที่เหมาะกับคุณ
            </h2>
          </div>
          <ErrorState onRetry={refetch} error={error} />
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 md:py-16 bg-white" id="pricing">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            เลือกแพ็กเกจที่เหมาะกับคุณ
          </h2>
          <p className="text-lg text-gray-600">
            เริ่มต้นฟรี หรือปลดล็อกความสามารถเต็มรูปแบบ
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {packages?.map((pkg) => {
            const isAdvanced = pkg.type === "ADVANCED";
            const badgeColorMap = {
              "green": "bg-green-100 text-green-700",
              "yellow": "bg-yellow-400 text-yellow-900"
            };
            
            return (
              <div
                key={pkg.type}
                className={`rounded-2xl p-8 relative ${
                  isAdvanced
                    ? 'bg-gradient-to-br from-tbat-primary to-tbat-secondary text-white overflow-hidden'
                    : 'bg-white border-2 border-gray-200'
                }`}
              >
                {/* Status Badge */}
                {pkg.badge && (
                  <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-sm font-semibold ${badgeColorMap[pkg.badgeColor as keyof typeof badgeColorMap] || 'bg-gray-100 text-gray-700'}`}>
                    {pkg.badge}
                  </div>
                )}
                
                {/* Package Header */}
                <div className="text-center mb-6">
                  <h3 className={`text-2xl font-bold mb-2 ${isAdvanced ? 'text-white' : 'text-gray-800'}`}>
                    {pkg.name}
                  </h3>
                  <div className="mb-1">
                    {isAdvanced && pkg.originalPrice ? (
                      <div className="flex items-center justify-center space-x-2">
                        <span className={`text-2xl font-medium line-through text-gray-300`}>
                          ฿{pkg.originalPrice.toLocaleString()}
                        </span>
                        <span className={`text-4xl font-bold ${isAdvanced ? 'text-white' : 'text-gray-800'}`}>
                          ฿{pkg.price.toLocaleString()}
                        </span>
                      </div>
                    ) : (
                      <span className={`text-4xl font-bold ${isAdvanced ? 'text-white' : 'text-gray-800'}`}>
                        ฿{pkg.price.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <p className={`${isAdvanced ? 'text-tbat-light' : 'text-gray-600'}`}>
                    {pkg.description}
                  </p>
                  {/* Dynamic availability status */}
                  <p className={`text-sm font-semibold mt-2 ${
                    isAdvanced ? 'text-yellow-300' : 
                    pkg.availability.status === 'available' ? 'text-green-600' :
                    pkg.availability.status === 'limited' ? 'text-orange-600' : 'text-red-600'
                  }`}>
                    {pkg.availability.statusText}
                  </p>
                </div>
                
                {/* Features List */}
                <ul className="space-y-3 mb-8">
                  {pkg.features_detailed.map((feature, index) => (
                    <li
                      key={index}
                      className={`flex items-center ${
                        feature.included
                          ? isAdvanced
                            ? 'text-white'
                            : 'text-gray-700'
                          : 'text-gray-400'
                      }`}
                    >
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-sm mr-3 ${
                          feature.included
                            ? isAdvanced
                              ? 'bg-white text-tbat-primary font-bold'
                              : 'bg-green-100 text-green-600'
                            : 'bg-gray-100 text-gray-400'
                        }`}
                      >
                        {feature.included ? '✓' : '–'}
                      </span>
                      <span className={feature.highlight ? 'font-semibold' : ''}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>
                
                {/* CTA Button */}
                <button
                  onClick={() => handleSelectPackage(pkg.type)}
                  disabled={pkg.availability.status === 'full'}
                  className={`w-full py-3 px-6 rounded-xl font-semibold transition-colors duration-200 ${
                    pkg.buttonStyle === 'solid' 
                      ? 'bg-white text-tbat-primary hover:bg-gray-100'
                      : 'border-2 border-tbat-primary text-tbat-primary hover:bg-tbat-primary hover:text-white'
                  } ${pkg.availability.status === 'full' ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {pkg.availability.status === 'full' ? 'เต็มแล้ว' : pkg.buttonText}
                </button>
                
                {/* Package Description */}
                <p className={`text-xs text-center mt-4 ${isAdvanced ? 'text-tbat-light' : 'text-gray-500'}`}>
                  {pkg.footerNote}
                  {pkg.limitations && (
                    <>
                      <br />
                      <span className="text-orange-800 font-semibold">
                        {pkg.limitations.join(' • ')}
                      </span>
                    </>
                  )}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;