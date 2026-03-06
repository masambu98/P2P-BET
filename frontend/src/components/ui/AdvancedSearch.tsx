import React, { useState, useEffect } from 'react';
import { Search, Filter, X, ChevronDown, Calendar, TrendingUp, Users, Trophy } from 'lucide-react';

interface SearchFilters {
  query: string;
  category: string;
  status: string;
  minAmount: number;
  maxAmount: number;
  dateRange: 'today' | 'week' | 'month' | 'all';
  sortBy: 'newest' | 'oldest' | 'amount_high' | 'amount_low' | 'popular';
  tags: string[];
}

interface AdvancedSearchProps {
  onSearch: (filters: SearchFilters) => void;
  loading?: boolean;
  resultCount?: number;
}

const CATEGORIES = ['Sports', 'Politics', 'Entertainment', 'Technology', 'Business', 'Other'];
const STATUSES = ['OPEN', 'ACCEPTED', 'SETTLED'];
const TAGS = ['High-Stakes', 'Quick-Bet', 'Beginner-Friendly', 'Expert-Only', 'Trending', 'Featured'];

export default function AdvancedSearch({ onSearch, loading = false, resultCount = 0 }: AdvancedSearchProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    category: '',
    status: '',
    minAmount: 0,
    maxAmount: 0,
    dateRange: 'all',
    sortBy: 'newest',
    tags: []
  });

  const [showFilters, setShowFilters] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(filters.query);
    }, 500);

    return () => clearTimeout(timer);
  }, [filters.query]);

  // Trigger search when debounced query or filters change
  useEffect(() => {
    onSearch({ ...filters, query: debouncedQuery });
  }, [debouncedQuery, filters.category, filters.status, filters.minAmount, filters.maxAmount, filters.dateRange, filters.sortBy, filters.tags]);

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const toggleTag = (tag: string) => {
    setFilters(prev => ({
      ...prev,
      tags: prev.tags.includes(tag) 
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  const clearFilters = () => {
    setFilters({
      query: '',
      category: '',
      status: '',
      minAmount: 0,
      maxAmount: 0,
      dateRange: 'all',
      sortBy: 'newest',
      tags: []
    });
  };

  const hasActiveFilters = filters.category || filters.status || filters.minAmount > 0 || filters.maxAmount > 0 || filters.dateRange !== 'all' || filters.tags.length > 0;

  return (
    <div className="space-y-4">
      {/* Main search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search bets, users, or tags..."
          value={filters.query}
          onChange={(e) => updateFilter('query', e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-dark-card border border-dark-border rounded-lg focus:outline-none focus:border-neon-green text-white placeholder-gray-500"
        />
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-lg transition-colors ${
            hasActiveFilters ? 'bg-neon-green/20 text-neon-green' : 'hover:bg-dark-border text-gray-400'
          }`}
        >
          <Filter className="w-4 h-4" />
        </button>
      </div>

      {/* Advanced filters panel */}
      {showFilters && (
        <div className="glass-card rounded-lg p-6 space-y-6 animate-fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Advanced Filters</h3>
            <div className="flex items-center space-x-2">
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Clear All
                </button>
              )}
              <button
                onClick={() => setShowFilters(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Category filter */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
              <select
                value={filters.category}
                onChange={(e) => updateFilter('category', e.target.value)}
                className="w-full px-3 py-2 bg-dark-card border border-dark-border rounded-lg focus:outline-none focus:border-neon-green text-white"
              >
                <option value="">All Categories</option>
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Status filter */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => updateFilter('status', e.target.value)}
                className="w-full px-3 py-2 bg-dark-card border border-dark-border rounded-lg focus:outline-none focus:border-neon-green text-white"
              >
                <option value="">All Statuses</option>
                {STATUSES.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            {/* Date range filter */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Date Range</label>
              <select
                value={filters.dateRange}
                onChange={(e) => updateFilter('dateRange', e.target.value as any)}
                className="w-full px-3 py-2 bg-dark-card border border-dark-border rounded-lg focus:outline-none focus:border-neon-green text-white"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            </div>

            {/* Amount range */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Min Amount (KES)</label>
              <input
                type="number"
                min="0"
                value={filters.minAmount}
                onChange={(e) => updateFilter('minAmount', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-dark-card border border-dark-border rounded-lg focus:outline-none focus:border-neon-green text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Max Amount (KES)</label>
              <input
                type="number"
                min="0"
                value={filters.maxAmount}
                onChange={(e) => updateFilter('maxAmount', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-dark-card border border-dark-border rounded-lg focus:outline-none focus:border-neon-green text-white"
              />
            </div>

            {/* Sort by */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Sort By</label>
              <select
                value={filters.sortBy}
                onChange={(e) => updateFilter('sortBy', e.target.value as any)}
                className="w-full px-3 py-2 bg-dark-card border border-dark-border rounded-lg focus:outline-none focus:border-neon-green text-white"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="amount_high">Highest Amount</option>
                <option value="amount_low">Lowest Amount</option>
                <option value="popular">Most Popular</option>
              </select>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Tags</label>
            <div className="flex flex-wrap gap-2">
              {TAGS.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1 rounded-full text-sm transition-all duration-200 ${
                    filters.tags.includes(tag)
                      ? 'bg-neon-green text-dark-bg font-medium'
                      : 'bg-dark-card border border-dark-border text-gray-400 hover:border-neon-green hover:text-white'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Search results summary */}
      {(filters.query || hasActiveFilters) && (
        <div className="flex items-center justify-between text-sm text-gray-400">
          <div>
            {loading ? 'Searching...' : `Found ${resultCount} results`}
            {filters.query && (
              <span> for "{filters.query}"</span>
            )}
          </div>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="hover:text-white transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// Quick search component for headers
export function QuickSearch({ onSearch }: { onSearch: (query: string) => void }) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (debouncedQuery) {
      onSearch(debouncedQuery);
    }
  }, [debouncedQuery, onSearch]);

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
      <input
        type="text"
        placeholder="Quick search..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="pl-9 pr-3 py-2 bg-dark-card border border-dark-border rounded-lg focus:outline-none focus:border-neon-green text-white placeholder-gray-500 text-sm w-64"
      />
    </div>
  );
}
