import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';

export interface SearchResult {
  id: string;
  title: string;
  description?: string;
  type: 'task' | 'user' | 'project' | 'document' | 'tag';
  category?: string;
  metadata?: Record<string, any>;
  score?: number;
  highlight?: string;
}

interface SearchHistory {
  query: string;
  timestamp: Date;
  resultsCount: number;
}

interface SearchSuggestion {
  text: string;
  type: 'recent' | 'popular' | 'command' | 'autocomplete';
  icon?: string;
  action?: () => void;
}

interface SearchBarProps {
  onSearch: (query: string, filters?: SearchFilters) => Promise<SearchResult[]>;
  onResultClick?: (result: SearchResult) => void;
  onClear?: () => void;
  placeholder?: string;
  maxResults?: number;
  debounceDelay?: number;
  enableHistory?: boolean;
  enableSuggestions?: boolean;
  enableAdvancedSearch?: boolean;
  searchCommands?: Map<string, (args: string[]) => void>;
  customFilters?: React.ReactNode;
}

interface SearchFilters {
  type?: string[];
  category?: string[];
  dateRange?: { start: Date; end: Date };
  sortBy?: 'relevance' | 'date' | 'alphabetical';
  includeArchived?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  onResultClick,
  onClear,
  placeholder = 'Search...',
  maxResults = 10,
  debounceDelay = 300,
  enableHistory = true,
  enableSuggestions = true,
  enableAdvancedSearch = false,
  searchCommands = new Map(),
  customFilters
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [history, setHistory] = useState<SearchHistory[]>([]);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [error, setError] = useState<string | null>(null);
  const [searchMode, setSearchMode] = useState<'normal' | 'command' | 'regex'>('normal');
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const abortController = useRef<AbortController | null>(null);

  useEffect(() => {
    if (enableHistory) {
      const savedHistory = localStorage.getItem('searchHistory');
      if (savedHistory) {
        try {
          const parsed = JSON.parse(savedHistory);
          setHistory(parsed.map((h: any) => ({ ...h, timestamp: new Date(h.timestamp) })));
        } catch (e) {
          console.error('Failed to load search history:', e);
        }
      }
    }
  }, [enableHistory]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.length > 0) {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      debounceTimer.current = setTimeout(() => {
        performSearch(query);
      }, debounceDelay);

      return () => {
        if (debounceTimer.current) {
          clearTimeout(debounceTimer.current);
        }
      };
    } else {
      setResults([]);
      setSuggestions([]);
    }
  }, [query, filters]);

  const detectSearchMode = useCallback((input: string): 'normal' | 'command' | 'regex' => {
    if (input.startsWith('/') && searchCommands.size > 0) {
      return 'command';
    }
    if (input.startsWith('~') || (input.startsWith('/') && input.endsWith('/'))) {
      return 'regex';
    }
    return 'normal';
  }, [searchCommands]);

  const parseCommand = useCallback((input: string): { command: string; args: string[] } | null => {
    if (!input.startsWith('/')) return null;
    
    const parts = input.slice(1).split(' ');
    const command = parts[0];
    const args = parts.slice(1);
    
    if (searchCommands.has(command)) {
      return { command, args };
    }
    return null;
  }, [searchCommands]);

  const validateRegex = useCallback((pattern: string): boolean => {
    try {
      new RegExp(pattern);
      return true;
    } catch {
      return false;
    }
  }, []);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (abortController.current) {
      abortController.current.abort();
    }

    const mode = detectSearchMode(searchQuery);
    setSearchMode(mode);

    if (mode === 'command') {
      const parsed = parseCommand(searchQuery);
      if (parsed) {
        searchCommands.get(parsed.command)?.(parsed.args);
        return;
      }
    }

    if (mode === 'regex') {
      const pattern = searchQuery.startsWith('~') ? searchQuery.slice(1) : searchQuery.slice(1, -1);
      if (!validateRegex(pattern)) {
        setError('Invalid regex pattern');
        return;
      }
      setError(null);
    }

    setIsLoading(true);
    setError(null);
    abortController.current = new AbortController();

    try {
      const searchResults = await onSearch(searchQuery, filters);
      
      if (!abortController.current.signal.aborted) {
        const limitedResults = searchResults.slice(0, maxResults);
        setResults(limitedResults);
        setIsOpen(true);
        
        if (enableHistory && searchQuery.trim()) {
          addToHistory(searchQuery, limitedResults.length);
        }
        
        if (enableSuggestions) {
          generateSuggestions(searchQuery, limitedResults);
        }
      }
    } catch (error) {
      if (!abortController.current?.signal.aborted) {
        setError(error instanceof Error ? error.message : 'Search failed');
        setResults([]);
      }
    } finally {
      setIsLoading(false);
      abortController.current = null;
    }
  }, [onSearch, filters, maxResults, enableHistory, enableSuggestions, detectSearchMode, parseCommand, validateRegex, searchCommands]);

  const addToHistory = useCallback((searchQuery: string, resultsCount: number) => {
    const newEntry: SearchHistory = {
      query: searchQuery,
      timestamp: new Date(),
      resultsCount
    };

    const updatedHistory = [
      newEntry,
      ...history.filter(h => h.query !== searchQuery).slice(0, 9)
    ];

    setHistory(updatedHistory);
    
    if (enableHistory) {
      localStorage.setItem('searchHistory', JSON.stringify(updatedHistory));
    }
  }, [history, enableHistory]);

  const generateSuggestions = useCallback((searchQuery: string, searchResults: SearchResult[]) => {
    const newSuggestions: SearchSuggestion[] = [];

    // Recent searches
    if (enableHistory) {
      const recentSearches = history
        .filter(h => h.query.toLowerCase().includes(searchQuery.toLowerCase()))
        .slice(0, 3)
        .map(h => ({
          text: h.query,
          type: 'recent' as const,
          icon: '🕐'
        }));
      newSuggestions.push(...recentSearches);
    }

    // Command suggestions
    if (searchCommands.size > 0 && searchQuery.startsWith('/')) {
      const commandSuggestions = Array.from(searchCommands.keys())
        .filter(cmd => cmd.startsWith(searchQuery.slice(1)))
        .slice(0, 3)
        .map(cmd => ({
          text: `/${cmd}`,
          type: 'command' as const,
          icon: '⚡',
          action: () => setQuery(`/${cmd} `)
        }));
      newSuggestions.push(...commandSuggestions);
    }

    // Autocomplete based on results
    const uniqueTypes = [...new Set(searchResults.map(r => r.type))];
    const typeFilters = uniqueTypes.slice(0, 3).map(type => ({
      text: `Filter: ${type}`,
      type: 'autocomplete' as const,
      icon: '🔍',
      action: () => {
        setFilters(prev => ({ ...prev, type: [type] }));
        performSearch(searchQuery);
      }
    }));
    newSuggestions.push(...typeFilters);

    // Popular related searches (mock implementation)
    if (searchQuery.length > 2) {
      const popularSearches = [
        `${searchQuery} tutorial`,
        `${searchQuery} examples`,
        `${searchQuery} documentation`
      ].slice(0, 2).map(text => ({
        text,
        type: 'popular' as const,
        icon: '🔥'
      }));
      newSuggestions.push(...popularSearches);
    }

    setSuggestions(newSuggestions.slice(0, 5));
  }, [history, searchCommands, enableHistory, performSearch]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    const totalItems = results.length + suggestions.length;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % Math.max(1, totalItems));
        break;
      
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev <= 0 ? totalItems - 1 : prev - 1);
        break;
      
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          handleResultClick(results[selectedIndex]);
        } else if (selectedIndex >= results.length && selectedIndex < totalItems) {
          const suggestion = suggestions[selectedIndex - results.length];
          if (suggestion.action) {
            suggestion.action();
          } else {
            setQuery(suggestion.text);
            performSearch(suggestion.text);
          }
        } else if (query) {
          performSearch(query);
        }
        break;
      
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
      
      case 'Tab':
        if (e.shiftKey) {
          e.preventDefault();
          setShowAdvanced(!showAdvanced);
        } else if (suggestions.length > 0 && selectedIndex === -1) {
          e.preventDefault();
          setQuery(suggestions[0].text);
        }
        break;
      
      case '/':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          inputRef.current?.focus();
        }
        break;
    }
  }, [results, suggestions, selectedIndex, query, performSearch, showAdvanced]);

  const handleResultClick = useCallback((result: SearchResult) => {
    onResultClick?.(result);
    setIsOpen(false);
    setSelectedIndex(-1);
    
    // Optionally clear search after selection
    if (onClear) {
      setQuery('');
      onClear();
    }
  }, [onResultClick, onClear]);

  const handleClear = useCallback(() => {
    setQuery('');
    setResults([]);
    setSuggestions([]);
    setIsOpen(false);
    setSelectedIndex(-1);
    setError(null);
    onClear?.();
    inputRef.current?.focus();
  }, [onClear]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    if (enableHistory) {
      localStorage.removeItem('searchHistory');
    }
  }, [enableHistory]);

  const highlightMatch = useCallback((text: string, searchTerm: string): React.ReactNode => {
    if (!searchTerm) return text;
    
    const parts = text.split(new RegExp(`(${searchTerm})`, 'gi'));
    return parts.map((part, index) => 
      part.toLowerCase() === searchTerm.toLowerCase() 
        ? <mark key={index}>{part}</mark> 
        : part
    );
  }, []);

  const getResultIcon = (type: SearchResult['type']): string => {
    const icons: Record<SearchResult['type'], string> = {
      task: '📋',
      user: '👤',
      project: '📁',
      document: '📄',
      tag: '🏷️'
    };
    return icons[type] || '📌';
  };

  const calculateRelevanceScore = useMemo(() => {
    return (result: SearchResult): number => {
      let score = result.score || 0;
      
      // Boost exact matches
      if (result.title.toLowerCase() === query.toLowerCase()) {
        score += 10;
      }
      
      // Boost title matches over description
      if (result.title.toLowerCase().includes(query.toLowerCase())) {
        score += 5;
      }
      
      // Recent items get a small boost
      if (result.metadata?.lastModified) {
        const daysOld = (Date.now() - new Date(result.metadata.lastModified).getTime()) / (1000 * 60 * 60 * 24);
        if (daysOld < 7) score += 2;
      }
      
      return score;
    };
  }, [query]);

  const sortedResults = useMemo(() => {
    if (filters.sortBy === 'alphabetical') {
      return [...results].sort((a, b) => a.title.localeCompare(b.title));
    }
    if (filters.sortBy === 'date' && results[0]?.metadata?.date) {
      return [...results].sort((a, b) => {
        const dateA = new Date(a.metadata?.date || 0).getTime();
        const dateB = new Date(b.metadata?.date || 0).getTime();
        return dateB - dateA;
      });
    }
    return [...results].sort((a, b) => calculateRelevanceScore(b) - calculateRelevanceScore(a));
  }, [results, filters.sortBy, calculateRelevanceScore]);

  return (
    <div className="search-bar-container">
      <div className="search-input-wrapper">
        <span className="search-icon">🔍</span>
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className={`search-input ${error ? 'error' : ''} ${searchMode !== 'normal' ? `mode-${searchMode}` : ''}`}
          aria-label="Search"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls="search-results"
          autoComplete="off"
          spellCheck="false"
        />
        
        {searchMode !== 'normal' && (
          <span className="search-mode-badge">
            {searchMode === 'command' ? '⚡ Command' : '~ Regex'}
          </span>
        )}
        
        {isLoading && <span className="loading-spinner">⏳</span>}
        
        {query && (
          <button 
            onClick={handleClear}
            className="clear-button"
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
        
        {enableAdvancedSearch && (
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="advanced-toggle"
            aria-label="Toggle advanced search"
          >
            ⚙️
          </button>
        )}
      </div>

      {error && (
        <div className="search-error">
          ⚠️ {error}
        </div>
      )}

      {showAdvanced && enableAdvancedSearch && (
        <div className="advanced-search-panel">
          <div className="filter-group">
            <label>Type:</label>
            <select 
              multiple
              value={filters.type || []}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions, option => option.value);
                setFilters(prev => ({ ...prev, type: selected }));
              }}
            >
              <option value="task">Tasks</option>
              <option value="user">Users</option>
              <option value="project">Projects</option>
              <option value="document">Documents</option>
              <option value="tag">Tags</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>Sort by:</label>
            <select
              value={filters.sortBy || 'relevance'}
              onChange={(e) => setFilters(prev => ({ 
                ...prev, 
                sortBy: e.target.value as SearchFilters['sortBy'] 
              }))}
            >
              <option value="relevance">Relevance</option>
              <option value="date">Date</option>
              <option value="alphabetical">Alphabetical</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>
              <input
                type="checkbox"
                checked={filters.includeArchived || false}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  includeArchived: e.target.checked 
                }))}
              />
              Include archived items
            </label>
          </div>
          
          {customFilters}
        </div>
      )}

      {isOpen && (query || history.length > 0) && (
        <div 
          ref={dropdownRef}
          className="search-dropdown"
          id="search-results"
          role="listbox"
        >
          {sortedResults.length > 0 && (
            <div className="search-results">
              <div className="dropdown-section-header">
                Results ({sortedResults.length})
              </div>
              {sortedResults.map((result, index) => (
                <div
                  key={result.id}
                  className={`search-result-item ${selectedIndex === index ? 'selected' : ''}`}
                  onClick={() => handleResultClick(result)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  role="option"
                  aria-selected={selectedIndex === index}
                >
                  <span className="result-icon">{getResultIcon(result.type)}</span>
                  <div className="result-content">
                    <div className="result-title">
                      {highlightMatch(result.title, query)}
                    </div>
                    {result.description && (
                      <div className="result-description">
                        {highlightMatch(result.description, query)}
                      </div>
                    )}
                    <div className="result-metadata">
                      <span className="result-type">{result.type}</span>
                      {result.category && (
                        <span className="result-category">{result.category}</span>
                      )}
                      {result.score !== undefined && (
                        <span className="result-score">
                          Score: {calculateRelevanceScore(result).toFixed(0)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {suggestions.length > 0 && (
            <div className="search-suggestions">
              <div className="dropdown-section-header">
                Suggestions
              </div>
              {suggestions.map((suggestion, index) => {
                const actualIndex = results.length + index;
                return (
                  <div
                    key={index}
                    className={`suggestion-item ${selectedIndex === actualIndex ? 'selected' : ''}`}
                    onClick={() => {
                      if (suggestion.action) {
                        suggestion.action();
                      } else {
                        setQuery(suggestion.text);
                        performSearch(suggestion.text);
                      }
                    }}
                    onMouseEnter={() => setSelectedIndex(actualIndex)}
                    role="option"
                    aria-selected={selectedIndex === actualIndex}
                  >
                    <span className="suggestion-icon">{suggestion.icon}</span>
                    <span className="suggestion-text">{suggestion.text}</span>
                    <span className="suggestion-type">{suggestion.type}</span>
                  </div>
                );
              })}
            </div>
          )}

          {!query && enableHistory && history.length > 0 && (
            <div className="search-history">
              <div className="dropdown-section-header">
                Recent Searches
                <button onClick={clearHistory} className="clear-history">
                  Clear
                </button>
              </div>
              {history.slice(0, 5).map((item, index) => (
                <div
                  key={index}
                  className="history-item"
                  onClick={() => {
                    setQuery(item.query);
                    performSearch(item.query);
                  }}
                >
                  <span className="history-icon">🕐</span>
                  <span className="history-query">{item.query}</span>
                  <span className="history-results">
                    {item.resultsCount} results
                  </span>
                </div>
              ))}
            </div>
          )}

          {query && sortedResults.length === 0 && !isLoading && (
            <div className="no-results">
              No results found for "{query}"
              {suggestions.length === 0 && (
                <div className="search-tips">
                  <p>Try:</p>
                  <ul>
                    <li>Using different keywords</li>
                    <li>Checking your spelling</li>
                    {searchCommands.size > 0 && <li>Using /command for quick actions</li>}
                    <li>Using ~ for regex search</li>
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="search-shortcuts">
        <span>⌘K to focus</span>
        <span>↑↓ to navigate</span>
        <span>Enter to select</span>
        <span>Esc to close</span>
      </div>
    </div>
  );
};
