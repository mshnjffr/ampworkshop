import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'system';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  timestamp: Date;
  read: boolean;
  actionable?: boolean;
  actions?: NotificationAction[];
  metadata?: Record<string, any>;
  expiresAt?: Date;
  persistent?: boolean;
  category?: string;
  sender?: string;
  avatar?: string;
  link?: string;
}

interface NotificationAction {
  id: string;
  label: string;
  type: 'primary' | 'secondary' | 'danger';
  handler: (notificationId: string) => void | Promise<void>;
}

interface NotificationGroup {
  category: string;
  notifications: Notification[];
  collapsed: boolean;
}

interface NotificationCenterProps {
  notifications: Notification[];
  onMarkAsRead?: (notificationIds: string[]) => void;
  onMarkAllAsRead?: () => void;
  onDelete?: (notificationIds: string[]) => void;
  onClearAll?: () => void;
  onActionClick?: (notificationId: string, actionId: string) => void;
  onNotificationClick?: (notification: Notification) => void;
  maxNotifications?: number;
  enableSound?: boolean;
  enableGrouping?: boolean;
  enableFiltering?: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'center';
  autoMarkAsRead?: boolean;
  autoMarkDelay?: number;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onClearAll,
  onActionClick,
  onNotificationClick,
  maxNotifications = 50,
  enableSound = true,
  enableGrouping = true,
  enableFiltering = true,
  position = 'top-right',
  autoMarkAsRead = false,
  autoMarkDelay = 3000
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'actionable'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set());
  const [groupedView, setGroupedView] = useState(enableGrouping);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'date' | 'priority'>('date');
  const [showSettings, setShowSettings] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(enableSound);
  const [animatingNotifications, setAnimatingNotifications] = useState<Set<string>>(new Set());
  
  const notificationRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const autoMarkTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const lastNotificationCount = useRef(notifications.length);

  useEffect(() => {
    if (enableSound && !audioRef.current) {
      audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhEgYAAA==');
    }
  }, [enableSound]);

  useEffect(() => {
    const newNotifications = notifications.filter(n => 
      !lastNotificationCount.current || 
      notifications.length > lastNotificationCount.current
    );
    
    if (newNotifications.length > 0 && soundEnabled && audioRef.current) {
      audioRef.current.play().catch(console.error);
      
      newNotifications.forEach(notification => {
        setAnimatingNotifications(prev => new Set(prev).add(notification.id));
        setTimeout(() => {
          setAnimatingNotifications(prev => {
            const newSet = new Set(prev);
            newSet.delete(notification.id);
            return newSet;
          });
        }, 1000);
      });
    }
    
    lastNotificationCount.current = notifications.length;
  }, [notifications, soundEnabled]);

  useEffect(() => {
    if (autoMarkAsRead && isOpen) {
      const unreadNotifications = filteredNotifications.filter(n => !n.read);
      
      unreadNotifications.forEach(notification => {
        if (!autoMarkTimers.current.has(notification.id)) {
          const timer = setTimeout(() => {
            onMarkAsRead?.([notification.id]);
            autoMarkTimers.current.delete(notification.id);
          }, autoMarkDelay);
          
          autoMarkTimers.current.set(notification.id, timer);
        }
      });
      
      return () => {
        autoMarkTimers.current.forEach(timer => clearTimeout(timer));
        autoMarkTimers.current.clear();
      };
    }
  }, [isOpen, autoMarkAsRead, autoMarkDelay, onMarkAsRead]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    
    const handleClickOutside = (e: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const filteredNotifications = useMemo(() => {
    let filtered = [...notifications];
    
    // Apply expiration filter
    const now = new Date();
    filtered = filtered.filter(n => !n.expiresAt || new Date(n.expiresAt) > now);
    
    // Apply selected filter
    switch (filter) {
      case 'unread':
        filtered = filtered.filter(n => !n.read);
        break;
      case 'actionable':
        filtered = filtered.filter(n => n.actionable && n.actions && n.actions.length > 0);
        break;
    }
    
    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(n =>
        n.title.toLowerCase().includes(query) ||
        n.message.toLowerCase().includes(query) ||
        n.category?.toLowerCase().includes(query) ||
        n.sender?.toLowerCase().includes(query)
      );
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      if (sortBy === 'priority') {
        const priorityOrder = { urgent: 4, high: 3, normal: 2, low: 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
      }
      
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
    
    // Apply max limit
    return filtered.slice(0, maxNotifications);
  }, [notifications, filter, searchQuery, sortBy, maxNotifications]);

  const groupedNotifications = useMemo((): NotificationGroup[] => {
    if (!groupedView) {
      return [{
        category: 'All',
        notifications: filteredNotifications,
        collapsed: false
      }];
    }
    
    const groups = new Map<string, Notification[]>();
    
    filteredNotifications.forEach(notification => {
      const category = notification.category || 'Uncategorized';
      if (!groups.has(category)) {
        groups.set(category, []);
      }
      groups.get(category)!.push(notification);
    });
    
    return Array.from(groups.entries()).map(([category, notifications]) => ({
      category,
      notifications,
      collapsed: collapsedGroups.has(category)
    }));
  }, [filteredNotifications, groupedView, collapsedGroups]);

  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.read).length;
  }, [notifications]);

  const handleNotificationClick = useCallback((notification: Notification) => {
    if (!notification.read) {
      onMarkAsRead?.([notification.id]);
    }
    
    if (notification.link) {
      window.open(notification.link, '_blank');
    } else {
      onNotificationClick?.(notification);
    }
    
    setSelectedNotifications(new Set());
  }, [onMarkAsRead, onNotificationClick]);

  const handleActionClick = useCallback(async (notification: Notification, action: NotificationAction) => {
    setAnimatingNotifications(prev => new Set(prev).add(notification.id));
    
    try {
      await action.handler(notification.id);
      onActionClick?.(notification.id, action.id);
    } catch (error) {
      console.error('Action failed:', error);
    } finally {
      setAnimatingNotifications(prev => {
        const newSet = new Set(prev);
        newSet.delete(notification.id);
        return newSet;
      });
    }
  }, [onActionClick]);

  const handleBulkAction = useCallback((action: 'read' | 'delete') => {
    const ids = Array.from(selectedNotifications);
    
    if (ids.length === 0) return;
    
    if (action === 'read') {
      onMarkAsRead?.(ids);
    } else if (action === 'delete') {
      onDelete?.(ids);
    }
    
    setSelectedNotifications(new Set());
  }, [selectedNotifications, onMarkAsRead, onDelete]);

  const toggleNotificationSelection = useCallback((notificationId: string) => {
    setSelectedNotifications(prev => {
      const newSet = new Set(prev);
      if (newSet.has(notificationId)) {
        newSet.delete(notificationId);
      } else {
        newSet.add(notificationId);
      }
      return newSet;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedNotifications.size === filteredNotifications.length) {
      setSelectedNotifications(new Set());
    } else {
      setSelectedNotifications(new Set(filteredNotifications.map(n => n.id)));
    }
  }, [selectedNotifications, filteredNotifications]);

  const toggleGroupCollapse = useCallback((category: string) => {
    setCollapsedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  }, []);

  const getNotificationIcon = (type: Notification['type']): string => {
    const icons = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      system: '🔔'
    };
    return icons[type];
  };

  const getPriorityBadge = (priority: Notification['priority']): string => {
    const badges = {
      urgent: '🔴',
      high: '🟠',
      normal: '🟡',
      low: '🟢'
    };
    return badges[priority];
  };

  const formatTimestamp = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return new Date(date).toLocaleDateString();
  };

  const getTypeColor = (type: Notification['type']): string => {
    const colors = {
      info: '#2196F3',
      success: '#4CAF50',
      warning: '#FF9800',
      error: '#F44336',
      system: '#9C27B0'
    };
    return colors[type];
  };

  const calculateNotificationScore = useCallback((notification: Notification): number => {
    let score = 0;
    
    // Priority scoring
    const priorityScores = { urgent: 40, high: 30, normal: 20, low: 10 };
    score += priorityScores[notification.priority];
    
    // Unread bonus
    if (!notification.read) score += 20;
    
    // Actionable bonus
    if (notification.actionable) score += 15;
    
    // Recency bonus
    const ageInHours = (Date.now() - new Date(notification.timestamp).getTime()) / 3600000;
    if (ageInHours < 1) score += 10;
    else if (ageInHours < 24) score += 5;
    
    return score;
  }, []);

  const mostImportantNotification = useMemo(() => {
    if (filteredNotifications.length === 0) return null;
    
    return filteredNotifications.reduce((prev, current) => 
      calculateNotificationScore(current) > calculateNotificationScore(prev) ? current : prev
    );
  }, [filteredNotifications, calculateNotificationScore]);

  return (
    <div className={`notification-center position-${position}`} ref={notificationRef}>
      <button
        className={`notification-toggle ${unreadCount > 0 ? 'has-unread' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
      >
        🔔
        {unreadCount > 0 && (
          <span className="unread-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-panel">
          <div className="notification-header">
            <h3>
              Notifications
              {unreadCount > 0 && <span className="unread-count">({unreadCount} unread)</span>}
            </h3>
            
            <div className="notification-actions">
              {showSettings ? (
                <button onClick={() => setShowSettings(false)}>✕</button>
              ) : (
                <>
                  <button onClick={() => setShowSettings(true)} title="Settings">
                    ⚙️
                  </button>
                  {onMarkAllAsRead && unreadCount > 0 && (
                    <button onClick={onMarkAllAsRead} title="Mark all as read">
                      ✓✓
                    </button>
                  )}
                  {onClearAll && (
                    <button onClick={onClearAll} title="Clear all">
                      🗑️
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {showSettings ? (
            <div className="notification-settings">
              <label>
                <input
                  type="checkbox"
                  checked={soundEnabled}
                  onChange={(e) => setSoundEnabled(e.target.checked)}
                />
                Enable sound
              </label>
              
              <label>
                <input
                  type="checkbox"
                  checked={groupedView}
                  onChange={(e) => setGroupedView(e.target.checked)}
                />
                Group by category
              </label>
              
              <label>
                Sort by:
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}>
                  <option value="date">Date</option>
                  <option value="priority">Priority</option>
                </select>
              </label>
            </div>
          ) : (
            <>
              {enableFiltering && (
                <div className="notification-filters">
                  <div className="filter-tabs">
                    <button
                      className={filter === 'all' ? 'active' : ''}
                      onClick={() => setFilter('all')}
                    >
                      All ({filteredNotifications.length})
                    </button>
                    <button
                      className={filter === 'unread' ? 'active' : ''}
                      onClick={() => setFilter('unread')}
                    >
                      Unread ({unreadCount})
                    </button>
                    <button
                      className={filter === 'actionable' ? 'active' : ''}
                      onClick={() => setFilter('actionable')}
                    >
                      Action Required
                    </button>
                  </div>
                  
                  <input
                    type="text"
                    placeholder="Search notifications..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input"
                  />
                </div>
              )}

              {selectedNotifications.size > 0 && (
                <div className="bulk-actions">
                  <span>{selectedNotifications.size} selected</span>
                  <button onClick={() => handleBulkAction('read')}>Mark as read</button>
                  <button onClick={() => handleBulkAction('delete')}>Delete</button>
                  <button onClick={() => setSelectedNotifications(new Set())}>Cancel</button>
                </div>
              )}

              {mostImportantNotification && filter === 'all' && (
                <div className="important-notification">
                  <span className="important-badge">⚡ Most Important</span>
                  <div className="notification-preview">
                    {getNotificationIcon(mostImportantNotification.type)} {mostImportantNotification.title}
                  </div>
                </div>
              )}

              <div className="notification-list">
                {filteredNotifications.length === 0 ? (
                  <div className="no-notifications">
                    {searchQuery ? 'No notifications match your search' : 'No notifications'}
                  </div>
                ) : (
                  groupedNotifications.map(group => (
                    <div key={group.category} className="notification-group">
                      {groupedView && (
                        <div 
                          className="group-header"
                          onClick={() => toggleGroupCollapse(group.category)}
                        >
                          <span>{group.collapsed ? '▶' : '▼'} {group.category}</span>
                          <span className="group-count">{group.notifications.length}</span>
                        </div>
                      )}
                      
                      {!group.collapsed && group.notifications.map(notification => (
                        <div
                          key={notification.id}
                          className={`notification-item ${notification.read ? 'read' : 'unread'} ${
                            animatingNotifications.has(notification.id) ? 'animating' : ''
                          } priority-${notification.priority}`}
                          style={{ borderLeftColor: getTypeColor(notification.type) }}
                        >
                          <input
                            type="checkbox"
                            checked={selectedNotifications.has(notification.id)}
                            onChange={() => toggleNotificationSelection(notification.id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                          
                          <div 
                            className="notification-content"
                            onClick={() => handleNotificationClick(notification)}
                          >
                            <div className="notification-header-row">
                              {notification.avatar && (
                                <img src={notification.avatar} alt="" className="notification-avatar" />
                              )}
                              <span className="notification-icon">
                                {getNotificationIcon(notification.type)}
                              </span>
                              <span className="notification-title">
                                {notification.title}
                              </span>
                              {notification.priority !== 'normal' && (
                                <span className="priority-badge">
                                  {getPriorityBadge(notification.priority)}
                                </span>
                              )}
                            </div>
                            
                            <div className="notification-message">
                              {notification.message}
                            </div>
                            
                            <div className="notification-footer">
                              <span className="notification-time">
                                {formatTimestamp(notification.timestamp)}
                              </span>
                              {notification.sender && (
                                <span className="notification-sender">
                                  from {notification.sender}
                                </span>
                              )}
                              {notification.category && (
                                <span className="notification-category">
                                  {notification.category}
                                </span>
                              )}
                            </div>
                            
                            {notification.actions && notification.actions.length > 0 && (
                              <div className="notification-actions-row">
                                {notification.actions.map(action => (
                                  <button
                                    key={action.id}
                                    className={`action-button action-${action.type}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleActionClick(notification, action);
                                    }}
                                  >
                                    {action.label}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                          
                          {onDelete && (
                            <button
                              className="delete-button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDelete([notification.id]);
                              }}
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
