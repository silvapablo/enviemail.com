import React, { useState } from 'react';
import { Bell, X, Shield, Mail, TrendingUp, AlertTriangle, CheckCircle, Settings } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useAuth } from '../../hooks/useAuth';

export const NotificationCenter: React.FC = () => {
  const { user } = useAuth();
  
  // Placeholder data until notification system is properly integrated
  const notifications: any[] = [];
  const unreadCount = 0;
  const markNotificationRead = (id: string) => {};
  const clearNotifications = () => {};
  const securityConfig = { encryptionKey: '' };
  
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'security' | 'transaction' | 'campaign' | 'system'>('all');

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'security':
        return <Shield className="h-5 w-5 text-red-400" />;
      case 'transaction':
        return <TrendingUp className="h-5 w-5 text-green-400" />;
      case 'campaign':
        return <Mail className="h-5 w-5 text-blue-400" />;
      case 'system':
        return <Settings className="h-5 w-5 text-gray-400" />;
      default:
        return <Bell className="h-5 w-5 text-gray-400" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'text-red-400 border-red-400';
      case 'high':
        return 'text-orange-400 border-orange-400';
      case 'medium':
        return 'text-yellow-400 border-yellow-400';
      case 'low':
        return 'text-green-400 border-green-400';
      default:
        return 'text-gray-400 border-gray-400';
    }
  };

  const decryptContent = (encryptedContent: string): string => {
    try {
      return encryptedContent; // Simplified until encryption is properly integrated
    } catch {
      return 'Unable to decrypt notification content';
    }
  };

  const filteredNotifications = notifications.filter(notification => 
    filter === 'all' || notification.type === filter
  );

  const handleNotificationClick = (notificationId: string) => {
    markNotificationRead(notificationId);
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge 
            variant="error" 
            size="sm" 
            className="absolute -top-2 -right-2 min-w-[20px] h-5 flex items-center justify-center text-xs"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 z-50">
          <Card className="max-h-96 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h3 className="text-lg font-semibold text-white">Notifications</h3>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearNotifications}
                  className="text-gray-400 hover:text-white"
                >
                  Clear All
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex border-b border-gray-700">
              {['all', 'security', 'transaction', 'campaign', 'system'].map((filterType) => (
                <button
                  key={filterType}
                  onClick={() => setFilter(filterType as any)}
                  className={`flex-1 px-3 py-2 text-sm font-medium capitalize transition-colors ${
                    filter === filterType
                      ? 'text-yellow-400 border-b-2 border-yellow-400'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {filterType}
                </button>
              ))}
            </div>

            {/* Notifications List */}
            <div className="max-h-64 overflow-y-auto">
              {filteredNotifications.length === 0 ? (
                <div className="p-4 text-center text-gray-400">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No notifications</p>
                </div>
              ) : (
                filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification.id)}
                    className={`p-4 border-b border-gray-700 cursor-pointer transition-colors hover:bg-gray-800/50 ${
                      !notification.read ? 'bg-gray-800/30' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-sm font-medium text-white truncate">
                            {notification.title}
                          </h4>
                          <div className="flex items-center space-x-2">
                            <Badge
                              variant={notification.priority === 'critical' ? 'error' : 
                                     notification.priority === 'high' ? 'warning' : 'info'}
                              size="sm"
                            >
                              {notification.priority}
                            </Badge>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-gray-400 line-clamp-2">
                          {decryptContent(notification.encryptedContent)}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-500">
                            {new Date(notification.timestamp).toLocaleString()}
                          </span>
                          <div className="flex items-center space-x-1">
                            {notification.delivered && (
                              <CheckCircle className="h-3 w-3 text-green-400" />
                            )}
                            {notification.expiresAt < Date.now() && (
                              <AlertTriangle className="h-3 w-3 text-yellow-400" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};