import { Transaction, ChartDataPoint, CategorySummary } from '../types';

// Heuristic for categorizing spending type
const DISCRETIONARY_KEYWORDS = ['coffee', 'starbucks', 'amazon', 'restaurant', 'dining', 'uber', 'entertainment', 'clothing', 'retail', 'bar', 'movie', 'swiggy', 'zomato', 'blinkit', 'ola', 'myntra'];
const ESSENTIAL_KEYWORDS = ['rent', 'mortgage', 'utility', 'grocery', 'groceries', 'insurance', 'medical', 'bill', 'gas', 'fuel', 'internet', 'phone', 'electricity', 'tuition'];

export const parseCSV = (csvText: string): Transaction[] => {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
  
  const dateIndex = headers.findIndex(h => h.includes('date'));
  const amountIndex = headers.findIndex(h => h.includes('amount') || h.includes('debit') || h.includes('cost'));
  const categoryIndex = headers.findIndex(h => h.includes('category') || h.includes('description') || h.includes('merchant'));
  const merchantIndex = headers.findIndex(h => h.includes('merchant') || h.includes('description'));

  if (dateIndex === -1 || amountIndex === -1) {
    throw new Error("CSV must have at least 'Date' and 'Amount' columns.");
  }

  return lines.slice(1).map((line, idx) => {
    // Handle quotes in CSV roughly
    const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.replace(/^"|"$/g, '').trim());
    
    const amountStr = values[amountIndex]?.replace(/[^0-9.-]/g, '') || "0";
    const amount = parseFloat(amountStr);
    const category = values[categoryIndex] || "Uncategorized";
    const date = values[dateIndex];
    
    // Auto-tag discretionary
    const lowerCat = category.toLowerCase();
    const isDiscretionary = DISCRETIONARY_KEYWORDS.some(k => lowerCat.includes(k)) && !ESSENTIAL_KEYWORDS.some(k => lowerCat.includes(k));

    return {
      id: `tx-${idx}`,
      date,
      amount: Math.abs(amount), // Treat all as positive spending for analysis unless explicit credit
      category,
      merchant: values[merchantIndex],
      isDiscretionary
    };
  }).filter(t => !isNaN(t.amount) && t.amount > 0);
};

export const aggregateDailySpending = (transactions: Transaction[]): ChartDataPoint[] => {
  const map = new Map<string, { essential: number, discretionary: number }>();
  
  // Sort by date
  const sorted = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  sorted.forEach(t => {
    const prev = map.get(t.date) || { essential: 0, discretionary: 0 };
    if (t.isDiscretionary) {
      prev.discretionary += t.amount;
    } else {
      prev.essential += t.amount;
    }
    map.set(t.date, prev);
  });

  return Array.from(map.entries()).map(([date, vals]) => ([
    { date, amount: vals.essential, type: 'Essential' as const },
    { date, amount: vals.discretionary, type: 'Discretionary' as const }
  ])).flat();
};

export const aggregateCategories = (transactions: Transaction[]): CategorySummary[] => {
  const map = new Map<string, number>();
  transactions.forEach(t => {
    const val = map.get(t.category) || 0;
    map.set(t.category, val + t.amount);
  });
  
  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8); // Top 8 categories
};

export const generateSampleData = (): Transaction[] => {
  const today = new Date();
  const data: Transaction[] = [];
  
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    // Simulate some essential bills (Values in INR)
    if (i % 30 === 0) data.push({ id: `rent-${i}`, date: dateStr, amount: 15000, category: 'Rent', isDiscretionary: false });
    if (i % 7 === 0) data.push({ id: `grocery-${i}`, date: dateStr, amount: 1500 + Math.random() * 1000, category: 'Groceries', isDiscretionary: false });
    
    // Simulate discretionary spikes (impulse buying)
    const isStressedWeek = i < 7; // Recent week is stressed
    const impulseChance = isStressedWeek ? 0.7 : 0.2;
    
    if (Math.random() < impulseChance) {
      data.push({ 
        id: `coffee-${i}`, 
        date: dateStr, 
        amount: 250 + Math.random() * 200, 
        category: 'Cafe/Dining', 
        isDiscretionary: true 
      });
    }
    if (Math.random() < (isStressedWeek ? 0.4 : 0.1)) {
       data.push({ 
        id: `shop-${i}`, 
        date: dateStr, 
        amount: 800 + Math.random() * 3000, 
        category: 'Online Shopping', 
        isDiscretionary: true 
      });
    }
  }
  return data;
};