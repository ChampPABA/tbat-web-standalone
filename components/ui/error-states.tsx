'use client';

import React from 'react';

// Network error state component
export const NetworkErrorState: React.FC<{
  onRetry: () => void;
  message?: string;
}> = ({ onRetry, message = 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้' }) => (
  <div className="text-center py-8">
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md mx-auto">
      <div className="text-yellow-600 text-3xl mb-3">📡</div>
      <h3 className="text-lg font-semibold text-yellow-800 mb-2 font-prompt">
        การเชื่อมต่อขัดข้อง
      </h3>
      <p className="text-yellow-700 mb-4 text-sm font-prompt">
        {message}
      </p>
      <div className="space-y-2">
        <button
          onClick={onRetry}
          className="w-full px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors duration-200 font-prompt"
        >
          ลองเชื่อมต่อใหม่
        </button>
        <p className="text-xs text-yellow-600 font-prompt">
          ตรวจสอบการเชื่อมต่ออินเทอร์เน็ตของคุณ
        </p>
      </div>
    </div>
  </div>
);

// Data validation error state
export const DataValidationErrorState: React.FC<{
  onRetry: () => void;
  details?: string;
}> = ({ onRetry, details }) => (
  <div className="text-center py-8">
    <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 max-w-md mx-auto">
      <div className="text-orange-600 text-3xl mb-3">⚠️</div>
      <h3 className="text-lg font-semibold text-orange-800 mb-2 font-prompt">
        ข้อมูลไม่ถูกต้อง
      </h3>
      <p className="text-orange-700 mb-4 text-sm font-prompt">
        ข้อมูลที่ได้รับจากเซิร์ฟเวอร์ไม่ถูกต้องหรือไม่สมบูรณ์
      </p>
      {details && (
        <details className="mb-4 text-left">
          <summary className="text-orange-700 text-xs cursor-pointer hover:text-orange-800 font-prompt">
            ดูรายละเอียด
          </summary>
          <pre className="mt-2 text-xs text-orange-600 bg-orange-100 p-2 rounded overflow-auto max-h-24">
            {details}
          </pre>
        </details>
      )}
      <button
        onClick={onRetry}
        className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors duration-200 font-prompt"
      >
        โหลดข้อมูลใหม่
      </button>
    </div>
  </div>
);

// Empty state component
export const EmptyDataState: React.FC<{
  title?: string;
  message?: string;
  actionText?: string;
  onAction?: () => void;
}> = ({ 
  title = 'ไม่พบข้อมูล',
  message = 'ขณะนี้ยังไม่มีข้อมูลที่จะแสดงผล',
  actionText,
  onAction
}) => (
  <div className="text-center py-12">
    <div className="max-w-md mx-auto">
      <div className="text-gray-400 text-4xl mb-4">📄</div>
      <h3 className="text-lg font-semibold text-gray-700 mb-2 font-prompt">
        {title}
      </h3>
      <p className="text-gray-600 mb-6 text-sm font-prompt">
        {message}
      </p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="px-6 py-2 bg-tbat-primary text-white rounded-lg hover:bg-tbat-secondary transition-colors duration-200 font-prompt"
        >
          {actionText}
        </button>
      )}
    </div>
  </div>
);

// Capacity full state component
export const CapacityFullState: React.FC<{
  sessionType?: 'morning' | 'afternoon' | 'both';
  advancedAvailable?: boolean;
  onUpgrade?: () => void;
}> = ({ 
  sessionType = 'both', 
  advancedAvailable = false,
  onUpgrade 
}) => {
  const getSessionText = () => {
    switch (sessionType) {
      case 'morning': return 'รอบเช้า (09:00-12:00)';
      case 'afternoon': return 'รอบบ่าย (13:00-16:00)';
      default: return 'ทุกรอบ';
    }
  };

  return (
    <div className="text-center py-8">
      <div className={`border rounded-lg p-6 max-w-md mx-auto ${
        advancedAvailable 
          ? 'bg-purple-50 border-purple-200' 
          : 'bg-red-50 border-red-200'
      }`}>
        <div className={`text-3xl mb-3 ${
          advancedAvailable ? 'text-purple-600' : 'text-red-600'
        }`}>
          {advancedAvailable ? '🔒' : '😔'}
        </div>
        <h3 className={`text-lg font-semibold mb-2 font-prompt ${
          advancedAvailable ? 'text-purple-800' : 'text-red-800'
        }`}>
          Free Package เต็มแล้ว
        </h3>
        <p className={`mb-4 text-sm font-prompt ${
          advancedAvailable ? 'text-purple-700' : 'text-red-700'
        }`}>
          {getSessionText()} สำหรับ Free Package เต็มแล้ว
        </p>
        
        {advancedAvailable ? (
          <div className="space-y-3">
            <p className="text-purple-700 text-sm font-prompt">
              🌟 ยังสามารถสมัคร Advanced Package ได้
            </p>
            {onUpgrade && (
              <button
                onClick={onUpgrade}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 font-prompt"
              >
                อัพเกรดเป็น Advanced Package
              </button>
            )}
          </div>
        ) : (
          <p className="text-red-600 text-sm font-prompt">
            ขออภัย ไม่มีที่นั่งว่างในขณะนี้
          </p>
        )}
      </div>
    </div>
  );
};

// Maintenance mode state
export const MaintenanceState: React.FC<{
  estimatedTime?: string;
  message?: string;
}> = ({ 
  estimatedTime,
  message = 'ระบบอยู่ระหว่างการปรับปรุง เพื่อให้บริการที่ดีขึ้น'
}) => (
  <div className="text-center py-12">
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-md mx-auto">
      <div className="text-blue-600 text-4xl mb-4">🔧</div>
      <h3 className="text-lg font-semibold text-blue-800 mb-2 font-prompt">
        ระบบอยู่ระหว่างปรับปรุง
      </h3>
      <p className="text-blue-700 mb-4 text-sm font-prompt">
        {message}
      </p>
      {estimatedTime && (
        <p className="text-blue-600 text-sm font-prompt">
          <strong>เวลาที่คาดว่าจะเสร็จสิ้น:</strong> {estimatedTime}
        </p>
      )}
      <p className="text-xs text-blue-500 mt-3 font-prompt">
        ขอบคุณสำหรับความอดทนของคุณ
      </p>
    </div>
  </div>
);

// Timeout error state
export const TimeoutErrorState: React.FC<{
  onRetry: () => void;
  timeout?: number;
}> = ({ onRetry, timeout = 30 }) => (
  <div className="text-center py-8">
    <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
      <div className="text-red-600 text-3xl mb-3">⏱️</div>
      <h3 className="text-lg font-semibold text-red-800 mb-2 font-prompt">
        หมดเวลาการเชื่อมต่อ
      </h3>
      <p className="text-red-700 mb-4 text-sm font-prompt">
        การโหลดข้อมูลใช้เวลานานเกิน {timeout} วินาที
      </p>
      <div className="space-y-2">
        <button
          onClick={onRetry}
          className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 font-prompt"
        >
          ลองใหม่อีกครั้ง
        </button>
        <p className="text-xs text-red-600 font-prompt">
          ตรวจสอบความเร็วอินเทอร์เน็ตของคุณ
        </p>
      </div>
    </div>
  </div>
);