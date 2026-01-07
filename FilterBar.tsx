import React from 'react';
import { Filter, X } from 'lucide-react';

export interface FilterState {
  startDate: string;
  endDate: string;
  category: string;
  minAmount: string;
  maxAmount: string;
}

interface FilterBarProps {
  categories: string[];
  filters: FilterState;
  onFilterChange: (key: keyof FilterState, value: string) => void;
  onReset: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({ categories, filters, onFilterChange, onReset }) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 mb-8 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide">
            <Filter size={16} className="text-brand-500" />
            <span>Filter Data</span>
        </div>
        <button 
            onClick={onReset}
            className="text-xs font-medium text-slate-500 hover:text-brand-500 dark:text-slate-400 dark:hover:text-brand-400 flex items-center gap-1 transition-colors"
        >
            <X size={14} /> Reset
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Date Range */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Start Date</label>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => onFilterChange('startDate', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">End Date</label>
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => onFilterChange('endDate', e.target.value)}
             className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
          />
        </div>

        {/* Category */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Category</label>
          <select
            value={filters.category}
            onChange={(e) => onFilterChange('category', e.target.value)}
             className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all appearance-none"
          >
            <option value="All">All Categories</option>
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Amount Range */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Min Amount</label>
          <div className="relative">
             <span className="absolute left-3 top-2 text-slate-400 text-xs">₹</span>
             <input
                type="number"
                placeholder="0"
                value={filters.minAmount}
                onChange={(e) => onFilterChange('minAmount', e.target.value)}
                className="w-full pl-6 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
            />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
           <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Max Amount</label>
           <div className="relative">
             <span className="absolute left-3 top-2 text-slate-400 text-xs">₹</span>
             <input
              type="number"
              placeholder="Any"
              value={filters.maxAmount}
              onChange={(e) => onFilterChange('maxAmount', e.target.value)}
              className="w-full pl-6 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
            />
           </div>
        </div>
      </div>
    </div>
  );
};