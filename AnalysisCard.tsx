import React from 'react';
import { AIAnalysisResult, StressLevel, ChartDataPoint } from '../types';
import { AlertTriangle, CheckCircle2, TrendingUp, Activity, ArrowRight, ShieldAlert, Target } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip as RechartsTooltip, Cell } from 'recharts';
import clsx from 'clsx';

interface AnalysisCardProps {
  result: AIAnalysisResult | null;
  loading: boolean;
  graphData: ChartDataPoint[];
}

const getScoreDetails = (score: number) => {
    if (score <= 30) return { color: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' };
    if (score <= 60) return { color: 'bg-yellow-500', text: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-900/20' };
    if (score <= 80) return { color: 'bg-orange-500', text: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/20' };
    return { color: 'bg-red-500', text: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20' };
};

export const AnalysisCard: React.FC<AnalysisCardProps> = ({ result, loading, graphData }) => {
  if (loading) {
    return (
      <div className="w-full h-96 flex flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-8 animate-pulse">
        <div className="relative w-16 h-16 mb-4">
             <div className="absolute inset-0 border-4 border-slate-100 dark:border-slate-800 rounded-full"></div>
             <div className="absolute inset-0 border-4 border-t-brand-500 rounded-full animate-spin"></div>
        </div>
        <h3 className="text-slate-800 dark:text-slate-200 font-semibold text-lg">Running Forensic Analysis...</h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 max-w-xs text-center">
            Cross-referencing transactions with behavioral stress patterns.
        </p>
      </div>
    );
  }

  if (!result) return null;

  const { color: scoreBarColor, text: scoreTextColor, bg: scoreBg } = getScoreDetails(result.score);
  
  // Calculate Volatility Data (Total spent per day)
  const volatilityData = graphData.reduce((acc, curr) => {
      const found = acc.find(a => a.date === curr.date);
      if (found) {
          found.amount += curr.amount;
      } else {
          acc.push({ date: curr.date, amount: curr.amount, type: 'Essential' });
      }
      return acc;
  }, [] as any[]).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(-14); // Last 14 days

  // Calculate Spending Mix
  const totalAmount = graphData.reduce((sum, item) => sum + item.amount, 0);
  const discretionaryAmount = graphData.filter(i => i.type === 'Discretionary').reduce((sum, item) => sum + item.amount, 0);
  const discretionaryPercent = totalAmount > 0 ? (discretionaryAmount / totalAmount) * 100 : 0;
  const essentialPercent = 100 - discretionaryPercent;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      
      {/* Top Section: Score & Volatility */}
      <div className="grid grid-cols-1 lg:grid-cols-12 border-b border-slate-100 dark:border-slate-800">
        
        {/* Score Column */}
        <div className="lg:col-span-4 p-8 bg-slate-50/50 dark:bg-slate-800/20 border-r border-slate-100 dark:border-slate-800 flex flex-col justify-between">
            <div>
                <h2 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-6">
                    <Activity size={16} /> Financial Stress Index
                </h2>
                
                <div className="flex items-baseline gap-1 mb-2">
                    <span className={clsx("text-6xl font-black tracking-tighter", scoreTextColor)}>{result.score}</span>
                    <span className="text-lg font-medium text-slate-400 dark:text-slate-500">/100</span>
                </div>
                
                {/* Visual Progress Bar for Score */}
                <div className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full mb-4 overflow-hidden">
                    <div 
                        className={clsx("h-full rounded-full transition-all duration-1000 ease-out", scoreBarColor)} 
                        style={{ width: `${result.score}%` }}
                    />
                </div>

                <div className={clsx("inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border", scoreBg, scoreTextColor.replace('text-', 'border-').replace('dark:text-', 'dark:border-opacity-30 '))} >
                    {result.level === StressLevel.Stable ? <CheckCircle2 size={16}/> : <AlertTriangle size={16}/>}
                    {result.level} Risk Level
                </div>
            </div>

            <div className="mt-8">
                 <h4 className="text-xs font-semibold text-slate-500 mb-2 uppercase">Spending Mix</h4>
                 <div className="flex h-4 w-full rounded-md overflow-hidden">
                     <div className="bg-slate-300 dark:bg-slate-600 transition-all duration-700" style={{ width: `${essentialPercent}%` }} title="Essential"></div>
                     <div className="bg-brand-400 dark:bg-brand-500 transition-all duration-700" style={{ width: `${discretionaryPercent}%` }} title="Discretionary"></div>
                 </div>
                 <div className="flex justify-between text-xs text-slate-500 mt-1 font-mono">
                     <span>Essential {essentialPercent.toFixed(0)}%</span>
                     <span>Discretionary {discretionaryPercent.toFixed(0)}%</span>
                 </div>
            </div>
        </div>

        {/* Volatility Graph Column */}
        <div className="lg:col-span-8 p-8 relative">
            <h2 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-4">
                <TrendingUp size={16} /> Transaction Volatility (Last 14 Days)
            </h2>
            <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={volatilityData}>
                        <XAxis 
                            dataKey="date" 
                            hide 
                        />
                        <RechartsTooltip 
                            cursor={{fill: 'transparent'}}
                            contentStyle={{ 
                                borderRadius: '8px', 
                                border: 'none', 
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                fontSize: '12px'
                            }}
                            formatter={(value: number) => [`₹${value.toFixed(2)}`, 'Total Spent']}
                            labelFormatter={(label) => new Date(label).toLocaleDateString(undefined, {weekday: 'short', month: 'short', day: 'numeric'})}
                        />
                        <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                            {volatilityData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.amount > (totalAmount / volatilityData.length) * 1.5 ? '#f87171' : '#cbd5e1'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <div className="absolute bottom-6 right-8 text-xs text-slate-400">
                <span className="inline-block w-2 h-2 rounded-full bg-red-400 mr-1"></span> High Volatility
                <span className="inline-block w-2 h-2 rounded-full bg-slate-300 ml-3 mr-1"></span> Normal
            </div>
            <div className="mt-2 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-lg p-3">
                <p className="text-sm text-blue-800 dark:text-blue-300 flex items-start gap-2">
                    <Target size={16} className="mt-0.5 shrink-0"/>
                    <span className="font-medium">Primary Driver:</span> 
                    <span className="ml-1 font-normal opacity-90">{result.importance}</span>
                </p>
            </div>
        </div>
      </div>

      {/* Analysis Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
        
        {/* Left: Observations */}
        <div className="p-8 border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800">
           <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
            <ShieldAlert size={18} className="text-brand-500"/> Forensic Observations
           </h3>
           <ul className="space-y-4">
             {result.observations.map((obs, i) => (
               <li key={i} className="flex gap-3 text-slate-600 dark:text-slate-400 text-sm leading-relaxed group">
                 <span className="font-mono text-brand-400 font-bold opacity-60 group-hover:opacity-100 transition-opacity">
                    0{i+1}
                 </span>
                 <span>{obs}</span>
               </li>
             ))}
           </ul>
           
           <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
               <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Recent Shift</h4>
               <p className="text-sm text-slate-700 dark:text-slate-300 italic">"{result.recentChanges}"</p>
           </div>
        </div>

        {/* Right: Recommendations */}
        <div className="p-8 bg-slate-50/30 dark:bg-slate-800/10">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                <CheckCircle2 size={18} className="text-emerald-500"/> Strategic Actions
            </h3>
            <div className="space-y-3">
                {result.recommendations.map((rec, i) => (
                    <div key={i} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-300 group">
                        <div className="flex items-start gap-3">
                            <ArrowRight size={16} className="text-emerald-500 mt-1 shrink-0 group-hover:translate-x-1 transition-transform" />
                            <p className="text-slate-700 dark:text-slate-300 text-sm font-medium">{rec}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};