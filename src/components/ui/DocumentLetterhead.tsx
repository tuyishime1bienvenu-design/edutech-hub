import React from 'react';

interface DocumentLetterheadProps {
  children: React.ReactNode;
}

export const DocumentLetterhead: React.FC<DocumentLetterheadProps> = ({ children }) => {
  return (
    <div className="border-b-2 border-gray-200 pb-4 mb-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-800">EduTech Hub</h1>
        <p className="text-sm text-gray-600">Professional Training Center</p>
        <p className="text-xs text-gray-500">Kigali, Rwanda</p>
      </div>
    </div>
  );
};
