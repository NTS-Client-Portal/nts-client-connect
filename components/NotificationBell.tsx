import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/initSupabase';
import { Bell, X, Check, Trash2, Clock, AlertCircle } from 'lucide-react';

const NotificationBell = ({ session }) => {
    const [notifications, setNotifications] = useState([]);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [errorText, setErrorText] = useState('');
    const [deletedNotifications, setDeletedNotifications] = useState([]);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const fetchNotifications = async () => {
            if (!session?.user?.id) {
                console.error('User ID is undefined');
                return;
            }

            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .or(`user_id.eq.${session.user.id},nts_user_id.eq.${session.user.id}`)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching notifications:', error.message);
            } else {
                setNotifications(data);
            }
        };

        if (session?.user?.id) {
            fetchNotifications();
        }
    }, [session]);

    const toggleDropdown = () => {
        setDropdownOpen(!dropdownOpen);
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const markAsRead = async (notificationId: number) => {
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', notificationId);

        if (error) {
            console.error('Error marking notification as read:', error.message);
        } else {
            setNotifications((prevNotifications) =>
                prevNotifications.map((notification) =>
                    notification.id === notificationId ? { ...notification, is_read: true } : notification
                )
            );
        }
    };

    const deleteNotification = async (notificationId: number) => {
        const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('id', notificationId);

        if (error) {
            console.error('Error deleting notification:', error.message);
        } else {
            setNotifications((prevNotifications) =>
                prevNotifications.filter((notification) => notification.id !== notificationId)
            );
            setDeletedNotifications((prevDeleted) => [...prevDeleted, notificationId]);
        }
    };

    const markAllAsRead = async () => {
        const unreadNotifications = notifications.filter(n => !n.is_read);
        if (unreadNotifications.length === 0) return;

        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .in('id', unreadNotifications.map(n => n.id));

        if (error) {
            console.error('Error marking all notifications as read:', error.message);
        } else {
            setNotifications((prevNotifications) =>
                prevNotifications.map((notification) => ({ ...notification, is_read: true }))
            );
        }
    };

    const clearAll = async () => {
        const { error } = await supabase
            .from('notifications')
            .delete()
            .or(`user_id.eq.${session.user.id},nts_user_id.eq.${session.user.id}`);

        if (error) {
            console.error('Error clearing all notifications:', error.message);
        } else {
            setNotifications([]);
        }
    };

    const formatTimeAgo = (dateString) => {
        const now = new Date();
        const notificationDate = new Date(dateString);
        const diffInMinutes = Math.floor((now.getTime() - notificationDate.getTime()) / (1000 * 60));
        
        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours}h ago`;
        
        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 7) return `${diffInDays}d ago`;
        
        return notificationDate.toLocaleDateString();
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Button */}
            <button 
                onClick={toggleDropdown}
                className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors duration-200 group"
                aria-label="Notifications"
            >
                <Bell className="h-6 w-6 text-slate-700 group-hover:text-slate-900" />
                
                {/* Notification Badge */}
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse px-1">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown Overlay */}
            {dropdownOpen && (
                <>
                    {/* Mobile/Tablet Backdrop */}
                    <div
                        className="fixed inset-0 bg-black bg-opacity-20 z-40 lg:hidden"
                        onClick={() => setDropdownOpen(false)}
                    />
                    
                    {/* Mobile/Tablet Centered Container */}
                    <div className="md:hidden fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 lg:hidden">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm border border-slate-200">
                            {/* Header */}
                            <div className="p-4 border-b border-slate-200 bg-white rounded-t-xl">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                                        <Bell className="h-5 w-5" />
                                        Notifications
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        {unreadCount > 0 && (
                                            <button
                                                onClick={markAllAsRead}
                                                className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                                            >
                                                Mark all read
                                            </button>
                                        )}
                                        <button
                                            onClick={() => setDropdownOpen(false)}
                                            className="p-1 rounded-lg hover:bg-slate-100 transition-colors"
                                        >
                                            <X className="h-4 w-4 text-slate-500" />
                                        </button>
                                    </div>
                                </div>
                                {unreadCount > 0 && (
                                    <p className="text-sm text-slate-600 mt-1">
                                        You have {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                                    </p>
                                )}
                            </div>

                            {/* Notifications List */}
                            <div className=" max-h-80 overflow-y-auto">
                                {notifications.length > 0 ? (
                                    <div className="divide-y divide-slate-100">
                                        {notifications.map((notification) => (
                                            <div
                                                key={notification.id}
                                                className={`p-4 hover:bg-slate-50 transition-colors duration-150 ${
                                                    !notification.is_read 
                                                        ? 'bg-blue-50/50 border-l-4 border-blue-500' 
                                                        : ''
                                                }`}
                                            >
                                                <div className="flex items-start gap-3">
                                                    {/* Status Icon */}
                                                    <div className={`shrink-0 mt-1 ${!notification.is_read ? 'text-blue-500' : 'text-slate-400'}`}>
                                                        {!notification.is_read ? (
                                                            <AlertCircle className="h-5 w-5" />
                                                        ) : (
                                                            <Check className="h-5 w-5" />
                                                        )}
                                                    </div>

                                                    {/* Content */}
                                                    <div className="flex-1 min-w-0">
                                                        <div 
                                                            className="text-sm text-slate-900 leading-relaxed mb-2"
                                                            dangerouslySetInnerHTML={{ __html: notification.message }}
                                                        />
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-xs text-slate-500 flex items-center gap-1">
                                                                <Clock className="h-3 w-3" />
                                                                {formatTimeAgo(notification.created_at)}
                                                            </span>
                                                            <div className="flex items-center gap-1">
                                                                {!notification.is_read && (
                                                                    <button
                                                                        onClick={() => markAsRead(notification.id)}
                                                                        className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-100 transition-colors"
                                                                    >
                                                                        Mark read
                                                                    </button>
                                                                )}
                                                                <button
                                                                    onClick={() => deleteNotification(notification.id)}
                                                                    className="text-xs text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-100 transition-colors"
                                                                    title="Delete notification"
                                                                >
                                                                    <Trash2 className="h-3 w-3" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-8 text-center">
                                        <Bell className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                                        <h4 className="text-sm font-medium text-slate-900 mb-1">
                                            No notifications yet
                                        </h4>
                                        <p className="text-sm text-slate-500">
                                            We'll notify you when something important happens
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            {notifications.length > 0 && (
                                <div className="p-3 border-t border-slate-200 bg-slate-50 rounded-b-xl">
                                    <button
                                        onClick={clearAll}
                                        className="w-full text-sm text-red-600 hover:text-red-800 font-medium py-2 px-3 rounded-lg hover:bg-red-50 transition-colors duration-200"
                                    >
                                        Clear all notifications
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Desktop Dropdown */}
                    <div className="hidden lg:block absolute right-0 top-full mt-2 z-50">
                        <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-80 xl:w-96">
                            {/* Arrow pointer */}
                            <div className="absolute -top-2 right-6 w-4 h-4 bg-white border-l border-t border-slate-200 transform rotate-45"></div>
                            
                            {/* Header */}
                            <div className="p-4 border-b border-slate-200 bg-white rounded-t-xl">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                                        <Bell className="h-5 w-5" />
                                        Notifications
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        {unreadCount > 0 && (
                                            <button
                                                onClick={markAllAsRead}
                                                className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                                            >
                                                Mark all read
                                            </button>
                                        )}
                                        <button
                                            onClick={() => setDropdownOpen(false)}
                                            className="p-1 rounded-lg hover:bg-slate-100 transition-colors"
                                        >
                                            <X className="h-4 w-4 text-slate-500" />
                                        </button>
                                    </div>
                                </div>
                                {unreadCount > 0 && (
                                    <p className="text-sm text-slate-600 mt-1">
                                        You have {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                                    </p>
                                )}
                            </div>

                            {/* Notifications List */}
                            <div className="max-h-80 overflow-y-auto">
                                {notifications.length > 0 ? (
                                    <div className="divide-y divide-slate-100">
                                        {notifications.map((notification) => (
                                            <div
                                                key={notification.id}
                                                className={`p-4 hover:bg-slate-50 transition-colors duration-150 ${
                                                    !notification.is_read 
                                                        ? 'bg-blue-50/50 border-l-4 border-blue-500' 
                                                        : ''
                                                }`}
                                            >
                                                <div className="flex items-start gap-3">
                                                    {/* Status Icon */}
                                                    <div className={`shrink-0 mt-1 ${!notification.is_read ? 'text-blue-500' : 'text-slate-400'}`}>
                                                        {!notification.is_read ? (
                                                            <AlertCircle className="h-5 w-5" />
                                                        ) : (
                                                            <Check className="h-5 w-5" />
                                                        )}
                                                    </div>

                                                    {/* Content */}
                                                    <div className="flex-1 min-w-0">
                                                        <div 
                                                            className="text-sm text-slate-900 leading-relaxed mb-2"
                                                            dangerouslySetInnerHTML={{ __html: notification.message }}
                                                        />
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-xs text-slate-500 flex items-center gap-1">
                                                                <Clock className="h-3 w-3" />
                                                                {formatTimeAgo(notification.created_at)}
                                                            </span>
                                                            <div className="flex items-center gap-1">
                                                                {!notification.is_read && (
                                                                    <button
                                                                        onClick={() => markAsRead(notification.id)}
                                                                        className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-100 transition-colors"
                                                                    >
                                                                        Mark read
                                                                    </button>
                                                                )}
                                                                <button
                                                                    onClick={() => deleteNotification(notification.id)}
                                                                    className="text-xs text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-100 transition-colors"
                                                                    title="Delete notification"
                                                                >
                                                                    <Trash2 className="h-3 w-3" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-8 text-center">
                                        <Bell className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                                        <h4 className="text-sm font-medium text-slate-900 mb-1">
                                            No notifications yet
                                        </h4>
                                        <p className="text-sm text-slate-500">
                                            We'll notify you when something important happens
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            {notifications.length > 0 && (
                                <div className="p-3 border-t border-slate-200 bg-slate-50 rounded-b-xl">
                                    <button
                                        onClick={clearAll}
                                        className="w-full text-sm text-red-600 hover:text-red-800 font-medium py-2 px-3 rounded-lg hover:bg-red-50 transition-colors duration-200"
                                    >
                                        Clear all notifications
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}

            {/* Error Display */}
            {errorText && (
                <div className="absolute top-full right-0 mt-2 p-3 bg-red-100 border border-red-200 text-red-700 text-sm rounded-lg shadow-lg max-w-xs z-50">
                    {errorText}
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
