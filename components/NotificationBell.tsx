import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/initSupabase';
import { Bell } from 'lucide-react';

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
                .or(`user_id.eq.${session.user.id},nts_user_id.eq.${session.user.id}`) // Fetch notifications for both user_id and nts_user_id
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

    return (
        <div className="relative" ref={dropdownRef}>
            <button onClick={toggleDropdown}>
                <Bell className="h-9 w-auto mt-1 text-zinc-900 dark:text-stone-50" />
                {notifications.length > 0 && <span className="absolute top-6 left-0 h-2 w-2 bg-red-500 dark:bg-red-500 rounded-full"></span>}
            </button>
            {dropdownOpen && (
                <div className="absolute z-50 w-52 h-fit max-h-[600px] overflow-y-auto top-8 lg:left-0 transform -translate-x-1/2 bg-white dark:bg-zinc-800 shadow-lg rounded-md overflow-hidden">
                    <div className="p-1">
                        {notifications.length > 0 ? (
                            notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`p-2  xs:mr-3 sm:mr-0 border-b z-50 h-full overflow-y-auto border-zinc-200 ${notification.is_read ? 'bg-white dark:bg-zinc-600' : 'bg-zinc-300 dark:bg-zinc-900'}`}
                                >
                                    <div className="flex flex-col justify-between items-center w-full">
                                        <span
                                            className="dark:text-stone-100 text-sm px-2 text-center"
                                            dangerouslySetInnerHTML={{ __html: notification.message }}
                                        ></span>
                                        {!notification.is_read && (
                                            <button
                                                onClick={() => markAsRead(notification.id)}
                                                className="text-blue-500 text-sm"
                                            >
                                                Mark as Read
                                            </button>
                                        )}
                                        {!deletedNotifications.includes(notification.id) && (
                                            <button
                                                onClick={() => deleteNotification(notification.id)}
                                                className="text-red-500 text-sm"
                                            >
                                                Delete
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-2 text-nowrap">No new notifications</div>
                        )}
                    </div>
                </div>
            )}
            {errorText && <div className="text-red-500">{errorText}</div>}
        </div>
    );
};

export default NotificationBell;