import React, { useState, useEffect, useMemo } from 'react';
import { Transaction, AIAnalysisResult } from './types';
import { parseCSV, generateSampleData, aggregateDailySpending, aggregateCategories } from './services/dataUtils';
import { analyzeSpendingHabits, extractTransactionsFromFile } from './services/geminiService';
import { FileUpload } from './components/FileUpload';
import { Charts } from './components/Charts';
import { AnalysisCard } from './components/AnalysisCard';
import { LoginPage } from './components/LoginPage';
import { FilterBar, FilterState } from './components/FilterBar';
import { Wallet, ShieldCheck, RefreshCw, X, Sun, Moon, LogOut } from 'lucide-react';

const App: React.FC = () => {
  // Auth State
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // App State
  const [transactions, setTransactions] = useState<Transaction[] | null>(null);
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  
  // Filter State
  const [filters, setFilters] = useState<FilterState>({
    startDate: '',
    endDate: '',
    category: 'All',
    minAmount: '',
    maxAmount: ''
  });
  
  // Theme Management
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' ||
        (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const toggleTheme = () => setDarkMode(!darkMode);

  const processData = async (data: Transaction[]) => {
    setTransactions(data);
    setFilters({ startDate: '', endDate: '', category: 'All', minAmount: '', maxAmount: '' }); // Reset filters
    setLoading(true);
    setLoadingMessage("Analyzing behavior & stress patterns...");
    setError(null);
    try {
      const result = await analyzeSpendingHabits(data);
      setAnalysis(result);
    } catch (err) {
      setError("Failed to analyze data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (file: File) => {
    setError(null);
    
    // CSV Handler
    if (file.type === 'text/csv' || file.name.endsWith('.csv') || file.type === 'text/plain') {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
            if (event.target?.result) {
                const data = parseCSV(event.target.result as string);
                if (data.length === 0) throw new Error("No valid transactions found.");
                processData(data);
            }
        } catch(err) {
            setError((err as Error).message);
        }
      };
      reader.readAsText(file);
      return;
    }

    // PDF/Image Handler (AI Extraction)
    if (file.type.includes('image') || file.type === 'application/pdf') {
        setLoading(true);
        setLoadingMessage("Extracting transaction data from document...");
        
        const reader = new FileReader();
        reader.onloadend = async () => {
            try {
                const base64String = reader.result as string;
                const extractedTransactions = await extractTransactionsFromFile(base64String, file.type);
                if (extractedTransactions.length === 0) throw new Error("No transactions could be identified in this file.");
                processData(extractedTransactions);
            } catch (err) {
                setError((err as Error).message);
                setLoading(false);
            }
        };
        reader.readAsDataURL(file);
        return;
    }

    setError("Unsupported file format. Please upload CSV, PDF, or Image.");
  };

  const handleSampleData = () => {
    const data = generateSampleData();
    processData(data);
  };

  const reset = () => {
    setTransactions(null);
    setAnalysis(null);
    setError(null);
    setFilters({ startDate: '', endDate: '', category: 'All', minAmount: '', maxAmount: '' });
  };

  const handleLogout = () => {
      setIsLoggedIn(false);
      reset();
  };

  // --- Filtering Logic ---
  
  const filteredTransactions = useMemo(() => {
      if (!transactions) return [];
      
      return transactions.filter(t => {
          const tDate = new Date(t.date);
          const fStart = filters.startDate ? new Date(filters.startDate) : null;
          const fEnd = filters.endDate ? new Date(filters.endDate) : null;
          
          if (fStart && tDate < fStart) return false;
          if (fEnd && tDate > fEnd) return false;
          if (filters.category !== 'All' && t.category !== filters.category) return false;
          
          const min = filters.minAmount ? parseFloat(filters.minAmount) : 0;
          const max = filters.maxAmount ? parseFloat(filters.maxAmount) : Infinity;
          
          if (t.amount < min) return false;
          if (t.amount > max) return false;

          return true;
      });
  }, [transactions, filters]);

  const uniqueCategories = useMemo(() => {
      if (!transactions) return [];
      return Array.from(new Set(transactions.map(t => t.category))).sort();
  }, [transactions]);

  // Derived state for charts based on FILTERED data
  const dailyData = useMemo(() => aggregateDailySpending(filteredTransactions), [filteredTransactions]);
  const categoryData = useMemo(() => aggregateCategories(filteredTransactions), [filteredTransactions]);

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilters({ startDate: '', endDate: '', category: 'All', minAmount: '', maxAmount: '' });
  };

  if (!isLoggedIn) {
      return (
        <div className="relative">
             <div className="absolute top-4 right-4 z-50">
                <button 
                    onClick={toggleTheme}
                    className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
                >
                    {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                </button>
             </div>
            <LoginPage onLogin={() => setIsLoggedIn(true)} />
        </div>
      );
  }

  return (
    <div className="min-h-screen pb-12 transition-colors duration-300">
      {/* Navbar */}
      <nav className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 sticky top-0 z-50 bg-opacity-90 dark:bg-opacity-90 backdrop-blur-md transition-colors duration-300">
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center text-white shadow-lg shadow-brand-500/30">
              <Wallet size={18} fill="currentColor" />
            </div>
            <span className="font-bold text-slate-800 dark:text-slate-100 text-lg tracking-tight">FinEase AI</span>
          </div>
          
          <div className="flex items-center gap-4">
            {transactions && !loading && (
                <button 
                    onClick={reset}
                    className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 text-sm font-medium flex items-center gap-2"
                >
                    <RefreshCw size={14} /> <span className="hidden sm:inline">New Analysis</span>
                </button>
            )}
            <button 
                onClick={toggleTheme}
                className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
                aria-label="Toggle Dark Mode"
            >
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button
                onClick={handleLogout}
                className="p-2 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors"
                aria-label="Logout"
            >
                <LogOut size={20} />
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 md:px-6 pt-8">
        
        {/* Error Banner */}
        {error && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-4 rounded-xl border border-red-100 dark:border-red-900/50 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                <span className="text-sm font-medium">{error}</span>
                <button onClick={() => setError(null)}><X size={16} /></button>
            </div>
        )}

        {/* Loading Overlay */}
        {loading && (
            <div className="fixed inset-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm z-40 flex flex-col items-center justify-center animate-in fade-in duration-300">
                 <div className="w-16 h-16 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mb-4"></div>
                 <p className="text-slate-600 dark:text-slate-300 font-medium animate-pulse">{loadingMessage}</p>
            </div>
        )}

        {!transactions && !loading ? (
          /* Hero / Upload State */
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
             <div className="text-center max-w-2xl mx-auto mb-12 mt-8">
                <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6 tracking-tight">
                    Analyze your financial <span className="text-brand-500">stress levels</span>.
                </h1>
                <p className="text-lg text-slate-500 dark:text-slate-400 leading-relaxed">
                    Upload your bank statements (CSV, PDF, or Image) to get a private, AI-powered behavioral analysis. 
                    No judgment, just clarity.
                </p>
                <div className="flex items-center justify-center gap-6 mt-8 text-sm text-slate-400 dark:text-slate-500">
                    <span className="flex items-center gap-1"><ShieldCheck size={14}/> Private & Secure</span>
                    <span className="flex items-center gap-1"><Wallet size={14}/> FinEase AI</span>
                </div>
             </div>
             
             <FileUpload onFileSelect={handleFileSelect} onUseSample={handleSampleData} />
          </div>
        ) : (
          /* Dashboard State */
          transactions && !loading && (
            <div className="space-y-8 animate-in fade-in duration-500">
                {/* Filters */}
                <FilterBar 
                    categories={uniqueCategories} 
                    filters={filters} 
                    onFilterChange={handleFilterChange} 
                    onReset={handleResetFilters} 
                />

                {/* Analysis Card with Internal Graph (Uses Filtered Data for Graph, Original for Text) */}
                <AnalysisCard result={analysis} loading={loading} graphData={dailyData} />

                {/* Detailed Charts (Uses Filtered Data) */}
                <Charts dailyData={dailyData} categoryData={categoryData} isDarkMode={darkMode} />
                
                {/* Raw Transaction Preview */}
                <div className="text-center text-slate-400 dark:text-slate-500 text-sm py-4">
                    Showing {filteredTransactions.length} of {transactions.length} transactions
                    {filteredTransactions.length > 0 && ` from ${filteredTransactions[filteredTransactions.length-1].date} to ${filteredTransactions[0].date}`}
                </div>
            </div>
          )
        )}
      </main>
    </div>
  );
};

export default App;