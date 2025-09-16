import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-gray-200", className)}
      {...props}
    />
  );
}

// Specific skeleton components for TBAT pricing section
function PricingCardSkeleton() {
  return (
    <div className="rounded-2xl p-8 bg-white border-2 border-gray-200">
      {/* Status Badge Skeleton */}
      <div className="absolute top-4 right-4">
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      
      {/* Package Header Skeleton */}
      <div className="text-center mb-6">
        <Skeleton className="h-8 w-32 mx-auto mb-2" />
        <Skeleton className="h-10 w-24 mx-auto mb-1" />
        <Skeleton className="h-5 w-40 mx-auto" />
        <Skeleton className="h-4 w-36 mx-auto mt-2" />
      </div>
      
      {/* Features List Skeleton */}
      <div className="space-y-3 mb-8">
        {Array.from({ length: 7 }).map((_, index) => (
          <div key={index} className="flex items-center">
            <Skeleton className="w-5 h-5 rounded-full mr-3" />
            <Skeleton className="h-4 flex-1" />
          </div>
        ))}
      </div>
      
      {/* CTA Button Skeleton */}
      <Skeleton className="w-full h-12 rounded-xl mb-4" />
      
      {/* Package Description Skeleton */}
      <Skeleton className="h-3 w-full mb-1" />
      <Skeleton className="h-3 w-3/4 mx-auto" />
    </div>
  );
}

// Capacity status skeleton for hero section
function CapacityStatusSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="text-center mb-4">
        <Skeleton className="h-6 w-32 mx-auto mb-2" />
        <div className="grid grid-cols-2 gap-4">
          <div className="text-left">
            <Skeleton className="h-4 w-20 mb-1" />
            <Skeleton className="h-5 w-28 mb-1" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="text-left">
            <Skeleton className="h-4 w-16 mb-1" />
            <Skeleton className="h-5 w-32 mb-1" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Real-time capacity update indicator
function CapacityUpdateIndicator({ isUpdating }: { isUpdating?: boolean }) {
  if (!isUpdating) return null;
  
  return (
    <div className="flex items-center justify-center p-2">
      <div className="flex items-center space-x-2 text-blue-600">
        <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse"></div>
        <span className="text-xs font-medium">อัปเดตข้อมูลล่าสุด...</span>
      </div>
    </div>
  );
}

// Loading overlay for smooth transitions
function LoadingOverlay({ 
  isVisible, 
  message = "กำลังโหลด..." 
}: { 
  isVisible: boolean; 
  message?: string; 
}) {
  if (!isVisible) return null;
  
  return (
    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center rounded-xl transition-opacity duration-200">
      <div className="flex flex-col items-center space-y-2">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-sm text-gray-600 font-medium">{message}</span>
      </div>
    </div>
  );
}

// Package comparison skeleton
function PackageComparisonSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
      <PricingCardSkeleton />
      <PricingCardSkeleton />
    </div>
  );
}

export { 
  Skeleton, 
  PricingCardSkeleton, 
  CapacityStatusSkeleton, 
  PackageComparisonSkeleton,
  CapacityUpdateIndicator,
  LoadingOverlay
};