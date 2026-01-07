import React, { useRef } from 'react';
import { UploadCloud, FileText, Image as ImageIcon, File } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  onUseSample: () => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, onUseSample }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-12 text-center">
      <div 
        className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-12 bg-white dark:bg-slate-900 hover:border-brand-400 dark:hover:border-brand-400 transition-colors cursor-pointer group"
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="w-16 h-16 bg-brand-50 dark:bg-slate-800 text-brand-500 dark:text-brand-400 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
          <UploadCloud size={32} />
        </div>
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Upload Financial Data</h3>
        <div className="flex justify-center gap-3 mt-3 mb-6 text-sm text-slate-400 dark:text-slate-500">
            <span className="flex items-center gap-1"><FileText size={14}/> CSV</span>
            <span className="flex items-center gap-1"><File size={14}/> PDF</span>
            <span className="flex items-center gap-1"><ImageIcon size={14}/> Images</span>
        </div>
        <button className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-2.5 rounded-lg font-medium shadow-sm transition-colors">
          Select File
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept=".csv,.txt,.pdf,.jpg,.jpeg,.png,.webp" 
          onChange={handleFileChange}
        />
      </div>

      <div className="mt-8 relative">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
        </div>
        <div className="relative flex justify-center">
          <span className="bg-slate-50 dark:bg-slate-950 px-4 text-sm text-slate-400 dark:text-slate-600">or start exploring immediately</span>
        </div>
      </div>

      <button 
        onClick={onUseSample}
        className="mt-6 inline-flex items-center gap-2 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 px-5 py-2.5 rounded-xl font-medium transition-colors shadow-sm text-sm"
      >
        <FileText size={16} />
        Use Demo Data
      </button>
    </div>
  );
};
