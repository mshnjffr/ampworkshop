import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
  icon?: string;
  color?: string;
}

export interface FilterGroup {
  id: string;
  label: string;
  type: 'select' | 'multiselect' | 'range' | 'date' | 'boolean' | 'text' | 'custom';
  options?: FilterOption[];
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: any;
  validator?: (value: any) => boolean;
  formatter?: (value: any) => string;
  customComponent?: React.ComponentType<any>;
}

export interface FilterState {
  [key: string]: any;
}

interface FilterPanelProps {
  filters: FilterGroup[];
  initialState?: FilterState;
  onFilterChange: (filters: FilterState) => void;
  onReset?: () => void;
  onSave?: (name: string, filters: FilterState) => void;
  onLoad?: (name: string) => FilterState | null;
  savedFilters?: Array<{ name: string; filters: FilterState }>;
  showApplyButton?: boolean;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  maxHeight?: string;
  enableSearch?: boolean;
  enableExport?: boolean;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  initialState = {},
  onFilterChange,
  onReset,
  onSave,
  onLoad,
  savedFilters = [],
  showApplyButton = false,
  collapsible = true,
  defaultCollapsed = false,
  maxHeight = '500px',
  enableSearch = true,
  enableExport = false
}) => {
  const [filterState, setFilterState] = useState<FilterState>(initialState);
  const [pendingState, setPendingState] = useState<FilterState>(initialState);
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [savedFilterName, setSavedFilterName] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);
  
  const filterRefs = useRef<Map<string, HTMLElement>>(new Map());
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const count = calculateActiveFilters(filterState);
    setActiveFiltersCount(count);
  }, [filterState]);

  useEffect(() => {
    const hasChanges = JSON.stringify(filterState) !== JSON.stringify(initialState);
    setIsDirty(hasChanges);
  }, [filterState, initialState]);

  const calculateActiveFilters = useCallback((state: FilterState): number => {
    let count = 0;
    
    filters.forEach(filter => {
      const value = state[filter.id];
      const defaultVal = filter.defaultValue;
      
      if (value === undefined || value === null || value === defaultVal) {
        return;
      }
      
      if (filter.type === 'multiselect' && Array.isArray(value) && value.length > 0) {
        count += value.length;
      } else if (filter.type === 'range' && Array.isArray(value)) {
        if (value[0] !== filter.min || value[1] !== filter.max) {
          count++;
        }
      } else if (filter.type === 'boolean' && typeof value === 'boolean') {
        count++;
      } else if (filter.type === 'text' && value.trim() !== '') {
        count++;
      } else if (value) {
        count++;
      }
    });
    
    return count;
  }, [filters]);

  const validateFilter = useCallback((filterId: string, value: any): string | null => {
    const filter = filters.find(f => f.id === filterId);
    if (!filter) return null;
    
    if (filter.validator && !filter.validator(value)) {
      return `Invalid value for ${filter.label}`;
    }
    
    if (filter.type === 'range') {
      if (Array.isArray(value)) {
        const [min, max] = value;
        if (min > max) {
          return 'Minimum value cannot be greater than maximum';
        }
        if (filter.min !== undefined && min < filter.min) {
          return `Minimum value must be at least ${filter.min}`;
        }
        if (filter.max !== undefined && max > filter.max) {
          return `Maximum value cannot exceed ${filter.max}`;
        }
      }
    }
    
    if (filter.type === 'date') {
      if (Array.isArray(value)) {
        const [start, end] = value;
        if (start && end && new Date(start) > new Date(end)) {
          return 'Start date must be before end date';
        }
      }
    }
    
    return null;
  }, [filters]);

  const handleFilterChange = useCallback((filterId: string, value: any) => {
    const error = validateFilter(filterId, value);
    
    if (error) {
      setValidationErrors(prev => ({ ...prev, [filterId]: error }));
      return;
    }
    
    setValidationErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[filterId];
      return newErrors;
    });
    
    if (showApplyButton) {
      setPendingState(prev => ({ ...prev, [filterId]: value }));
    } else {
      const newState = { ...filterState, [filterId]: value };
      setFilterState(newState);
      onFilterChange(newState);
    }
  }, [filterState, showApplyButton, onFilterChange, validateFilter]);

  const handleApply = useCallback(() => {
    if (Object.keys(validationErrors).length > 0) {
      const firstErrorField = Object.keys(validationErrors)[0];
      const element = filterRefs.current.get(firstErrorField);
      element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    
    setFilterState(pendingState);
    onFilterChange(pendingState);
  }, [pendingState, onFilterChange, validationErrors]);

  const handleReset = useCallback(() => {
    const resetState = filters.reduce((acc, filter) => {
      acc[filter.id] = filter.defaultValue ?? null;
      return acc;
    }, {} as FilterState);
    
    setFilterState(resetState);
    setPendingState(resetState);
    setValidationErrors({});
    setSelectedPreset(null);
    
    if (onReset) {
      onReset();
    } else {
      onFilterChange(resetState);
    }
  }, [filters, onFilterChange, onReset]);

  const handleSaveFilter = useCallback(() => {
    if (!savedFilterName.trim()) return;
    
    onSave?.(savedFilterName, filterState);
    setSaveModalOpen(false);
    setSavedFilterName('');
  }, [savedFilterName, filterState, onSave]);

  const handleLoadFilter = useCallback((name: string) => {
    const loadedFilters = onLoad?.(name) || savedFilters.find(sf => sf.name === name)?.filters;
    
    if (loadedFilters) {
      setFilterState(loadedFilters);
      setPendingState(loadedFilters);
      setSelectedPreset(name);
      
      if (!showApplyButton) {
        onFilterChange(loadedFilters);
      }
    }
  }, [onLoad, savedFilters, showApplyButton, onFilterChange]);

  const handleExport = useCallback(() => {
    const exportData = {
      filters: filterState,
      metadata: {
        exportedAt: new Date().toISOString(),
        activeFilters: activeFiltersCount,
        filterGroups: filters.map(f => ({
          id: f.id,
          label: f.label,
          type: f.type
        }))
      }
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `filters-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [filterState, activeFiltersCount, filters]);

  const toggleGroup = useCallback((groupId: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  }, []);

  const filteredFilters = useMemo(() => {
    if (!searchQuery) return filters;
    
    const query = searchQuery.toLowerCase();
    return filters.filter(filter => 
      filter.label.toLowerCase().includes(query) ||
      filter.options?.some(opt => opt.label.toLowerCase().includes(query))
    );
  }, [filters, searchQuery]);

  const renderFilterControl = useCallback((filter: FilterGroup) => {
    const currentValue = showApplyButton ? pendingState[filter.id] : filterState[filter.id];
    const error = validationErrors[filter.id];
    
    switch (filter.type) {
      case 'select':
        return (
          <select
            value={currentValue || ''}
            onChange={(e) => handleFilterChange(filter.id, e.target.value || null)}
            className={error ? 'error' : ''}
          >
            <option value="">All</option>
            {filter.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.icon} {option.label}
                {option.count !== undefined && ` (${option.count})`}
              </option>
            ))}
          </select>
        );
      
      case 'multiselect':
        const selectedValues = currentValue || [];
        return (
          <div className="multiselect-container">
            <div className="selected-count">
              {selectedValues.length} selected
            </div>
            <div className="multiselect-options">
              {filter.options?.map(option => (
                <label key={option.value} className="multiselect-option">
                  <input
                    type="checkbox"
                    checked={selectedValues.includes(option.value)}
                    onChange={(e) => {
                      const newValues = e.target.checked
                        ? [...selectedValues, option.value]
                        : selectedValues.filter((v: string) => v !== option.value);
                      handleFilterChange(filter.id, newValues.length > 0 ? newValues : null);
                    }}
                  />
                  <span style={{ color: option.color }}>
                    {option.icon} {option.label}
                    {option.count !== undefined && ` (${option.count})`}
                  </span>
                </label>
              ))}
            </div>
          </div>
        );
      
      case 'range':
        const [minValue, maxValue] = currentValue || [filter.min || 0, filter.max || 100];
        return (
          <div className="range-container">
            <div className="range-inputs">
              <input
                type="number"
                value={minValue}
                onChange={(e) => {
                  const newMin = parseFloat(e.target.value);
                  handleFilterChange(filter.id, [newMin, maxValue]);
                }}
                min={filter.min}
                max={filter.max}
                step={filter.step}
                className={error ? 'error' : ''}
              />
              <span>to</span>
              <input
                type="number"
                value={maxValue}
                onChange={(e) => {
                  const newMax = parseFloat(e.target.value);
                  handleFilterChange(filter.id, [minValue, newMax]);
                }}
                min={filter.min}
                max={filter.max}
                step={filter.step}
                className={error ? 'error' : ''}
              />
            </div>
            <div className="range-slider">
              <input
                type="range"
                value={minValue}
                onChange={(e) => {
                  const newMin = parseFloat(e.target.value);
                  if (newMin <= maxValue) {
                    handleFilterChange(filter.id, [newMin, maxValue]);
                  }
                }}
                min={filter.min}
                max={filter.max}
                step={filter.step}
              />
              <input
                type="range"
                value={maxValue}
                onChange={(e) => {
                  const newMax = parseFloat(e.target.value);
                  if (newMax >= minValue) {
                    handleFilterChange(filter.id, [minValue, newMax]);
                  }
                }}
                min={filter.min}
                max={filter.max}
                step={filter.step}
              />
            </div>
            {filter.formatter && (
              <div className="range-display">
                {filter.formatter([minValue, maxValue])}
              </div>
            )}
          </div>
        );
      
      case 'date':
        const [startDate, endDate] = currentValue || ['', ''];
        return (
          <div className="date-range-container">
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                handleFilterChange(filter.id, [e.target.value, endDate]);
              }}
              max={new Date().toISOString().split('T')[0]}
              className={error ? 'error' : ''}
            />
            <span>to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                handleFilterChange(filter.id, [startDate, e.target.value]);
              }}
              max={new Date().toISOString().split('T')[0]}
              className={error ? 'error' : ''}
            />
            <button
              onClick={() => {
                const today = new Date();
                const lastWeek = new Date(today);
                lastWeek.setDate(today.getDate() - 7);
                handleFilterChange(filter.id, [
                  lastWeek.toISOString().split('T')[0],
                  today.toISOString().split('T')[0]
                ]);
              }}
            >
              Last 7 days
            </button>
            <button
              onClick={() => {
                const today = new Date();
                const lastMonth = new Date(today);
                lastMonth.setMonth(today.getMonth() - 1);
                handleFilterChange(filter.id, [
                  lastMonth.toISOString().split('T')[0],
                  today.toISOString().split('T')[0]
                ]);
              }}
            >
              Last month
            </button>
          </div>
        );
      
      case 'boolean':
        return (
          <div className="boolean-container">
            <label className="switch">
              <input
                type="checkbox"
                checked={currentValue || false}
                onChange={(e) => handleFilterChange(filter.id, e.target.checked || null)}
              />
              <span className="slider"></span>
            </label>
            <span className="boolean-label">
              {currentValue ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        );
      
      case 'text':
        return (
          <input
            type="text"
            value={currentValue || ''}
            onChange={(e) => handleFilterChange(filter.id, e.target.value || null)}
            placeholder={`Enter ${filter.label.toLowerCase()}...`}
            className={error ? 'error' : ''}
          />
        );
      
      case 'custom':
        if (filter.customComponent) {
          const CustomComponent = filter.customComponent;
          return (
            <CustomComponent
              value={currentValue}
              onChange={(value: any) => handleFilterChange(filter.id, value)}
              error={error}
              {...filter}
            />
          );
        }
        return null;
      
      default:
        return null;
    }
  }, [filterState, pendingState, showApplyButton, validationErrors, handleFilterChange]);

  const hasActiveFilters = activeFiltersCount > 0;
  const canApply = showApplyButton && JSON.stringify(pendingState) !== JSON.stringify(filterState);

  return (
    <div className="filter-panel" ref={panelRef}>
      <div className="filter-panel-header">
        <h3>
          Filters
          {hasActiveFilters && (
            <span className="active-filters-badge">{activeFiltersCount}</span>
          )}
        </h3>
        
        <div className="filter-panel-actions">
          {collapsible && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="collapse-button"
              aria-label={isCollapsed ? 'Expand filters' : 'Collapse filters'}
            >
              {isCollapsed ? '▼' : '▲'}
            </button>
          )}
        </div>
      </div>

      {!isCollapsed && (
        <>
          {enableSearch && filteredFilters.length > 5 && (
            <div className="filter-search">
              <input
                type="text"
                placeholder="Search filters..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="filter-search-input"
              />
            </div>
          )}

          {(savedFilters.length > 0 || onSave) && (
            <div className="saved-filters">
              <div className="saved-filters-header">
                <span>Presets</span>
                {onSave && (
                  <button onClick={() => setSaveModalOpen(true)}>
                    💾 Save Current
                  </button>
                )}
              </div>
              
              {savedFilters.length > 0 && (
                <div className="saved-filters-list">
                  {savedFilters.map(saved => (
                    <button
                      key={saved.name}
                      onClick={() => handleLoadFilter(saved.name)}
                      className={`preset-button ${selectedPreset === saved.name ? 'active' : ''}`}
                    >
                      {saved.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div 
            className="filter-groups"
            style={{ maxHeight, overflowY: 'auto' }}
          >
            {filteredFilters.map(filter => {
              const isExpanded = expandedGroups.has(filter.id) || 
                                filteredFilters.length <= 5 ||
                                validationErrors[filter.id];
              
              return (
                <div 
                  key={filter.id}
                  ref={(el) => {
                    if (el) filterRefs.current.set(filter.id, el);
                  }}
                  className={`filter-group ${validationErrors[filter.id] ? 'has-error' : ''}`}
                >
                  <div 
                    className="filter-group-header"
                    onClick={() => toggleGroup(filter.id)}
                  >
                    <label>{filter.label}</label>
                    {filteredFilters.length > 5 && (
                      <span className="expand-icon">
                        {isExpanded ? '−' : '+'}
                      </span>
                    )}
                  </div>
                  
                  {isExpanded && (
                    <div className="filter-control">
                      {renderFilterControl(filter)}
                      {validationErrors[filter.id] && (
                        <div className="error-message">
                          {validationErrors[filter.id]}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="filter-panel-footer">
            {showApplyButton && (
              <button 
                onClick={handleApply}
                disabled={!canApply || Object.keys(validationErrors).length > 0}
                className="apply-button"
              >
                Apply Filters
              </button>
            )}
            
            <button 
              onClick={handleReset}
              disabled={!hasActiveFilters && !isDirty}
              className="reset-button"
            >
              Reset All
            </button>
            
            {enableExport && hasActiveFilters && (
              <button onClick={handleExport} className="export-button">
                📥 Export
              </button>
            )}
          </div>

          {isDirty && !showApplyButton && (
            <div className="unsaved-changes">
              ⚠️ Filters applied
            </div>
          )}
        </>
      )}

      {saveModalOpen && (
        <div className="modal-overlay" onClick={() => setSaveModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Save Filter Preset</h3>
            <input
              type="text"
              value={savedFilterName}
              onChange={(e) => setSavedFilterName(e.target.value)}
              placeholder="Enter preset name..."
              autoFocus
              onKeyPress={(e) => {
                if (e.key === 'Enter') handleSaveFilter();
              }}
            />
            <div className="modal-actions">
              <button onClick={handleSaveFilter} disabled={!savedFilterName.trim()}>
                Save
              </button>
              <button onClick={() => {
                setSaveModalOpen(false);
                setSavedFilterName('');
              }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
