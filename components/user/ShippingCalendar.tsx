import React, { useEffect, useState, useCallback } from 'react';
import { Calendar, momentLocalizer, Event as BigCalendarEvent } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { supabase } from '@/lib/initSupabase';
import { Database } from '@/lib/database.types';
import { useRouter } from 'next/router';
import { useSession } from '@supabase/auth-helpers-react';

type ShippingCalendarProps = {
    // Add props here if needed
};

type Schedule = Database['public']['Tables']['shippingquotes']['Row'];

const localizer = momentLocalizer(moment);

type Event = BigCalendarEvent & {
    id: string;
    originCity: string;
    originState: string;
    destinationCity: string;
    destinationState: string;
    status: string;
};

const getStatusClasses = (status: string): string => {
    switch (status) {
        case 'In Progress':
            return 'bg-in-progress';
        case 'Dispatched':
            return 'bg-dispatched';
        case 'Picked Up':
            return 'bg-picked-up';
        case 'Delivered':
            return 'bg-delivered';
        case 'Completed':
            return 'bg-completed';
        case 'Cancelled':
            return 'bg-cancelled';
        default:
            return '';
    }
};

const ShippingCalendar: React.FC<ShippingCalendarProps> = () => {
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [events, setEvents] = useState<Event[]>([]);
    const [errorText, setErrorText] = useState<string>('');
    const router = useRouter();
    const session = useSession();

    const fetchSchedulesForCompany = useCallback(async (companyId: string) => {
        const { data: schedules, error } = await supabase
            .from('shippingquotes')
            .select('id, earliest_pickup_date, latest_pickup_date, origin_city, origin_state, destination_city, destination_state, brokers_status')
            .eq('company_id', companyId)
            .eq('status', 'Order')
            .or('is_complete.is.null,is_complete.eq.false')
            .or('is_archived.is.null,is_archived.eq.false');

        if (error) {
            console.error('Error fetching schedules:', error.message);
            setErrorText('Error fetching schedules');
            return [];
        }

        return schedules;
    }, []);

    useEffect(() => {
        const fetchSchedules = async () => {
            if (!session?.user?.id) return;

            // Fetch the user's profile
            const { data: userProfile, error: userProfileError } = await supabase
                .from("profiles")
                .select("company_id")
                .eq("id", session.user.id)
                .single();

            if (userProfileError) {
                console.error("Error fetching user profile:", userProfileError.message);
                setErrorText('Error fetching user profile');
                return;
            }

            if (!userProfile) {
                console.error("No profile found for user");
                setErrorText('No profile found for user');
                return;
            }

            const companyId = userProfile.company_id;
            const schedulesData = await fetchSchedulesForCompany(companyId);

            setSchedules(schedulesData.filter(schedule => schedule.id !== null && schedule.earliest_pickup_date !== null && schedule.latest_pickup_date !== null) as Schedule[]);
        };

        fetchSchedules();
    }, [session, fetchSchedulesForCompany]);

    useEffect(() => {
        // Convert schedules to events for the calendar
        const calendarEvents = schedules.map(schedule => ({
            id: schedule.id.toString(),
            title: `Order #${schedule.id}`,
            start: new Date(schedule.earliest_pickup_date),
            end: new Date(schedule.latest_pickup_date),
            originCity: schedule.origin_city,
            originState: schedule.origin_state,
            destinationCity: schedule.destination_city,
            destinationState: schedule.destination_state,
            status: schedule.brokers_status,
        }));

        setEvents(calendarEvents);
    }, [schedules]);

    const handleSelectEvent = (event: Event) => {
        router.push(`/user/logistics-management?tab=orders&searchTerm=${event.id}&searchColumn=id`);
    };

    return (
        <div className="w-full">
            {errorText && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-sm font-medium">{errorText}</p>
                </div>
            )}
            <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{ 
                    height: 'clamp(400px, 60vh, 700px)',
                    fontSize: '12px'
                }}
                onSelectEvent={handleSelectEvent}
                className="rounded-lg shadow-inner bg-white dark:bg-gray-800"
                eventPropGetter={(event) => ({
                    className: `custom-event ${getStatusClasses(event.status)}`,
                    style: {
                        fontSize: '11px',
                        padding: '2px 4px',
                        borderRadius: '4px',
                        border: 'none',
                        fontWeight: '500'
                    }
                })}
                components={{
                    event: ({ event }) => (
                        <div className="flex items-center justify-start gap-1 px-1 py-0.5">
                            <div className="text-white text-xs font-medium truncate">
                                #{event.id} - {event.status}
                            </div>
                        </div>
                    ),
                    toolbar: (props) => (
                        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => props.onNavigate('PREV')}
                                    className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                                    aria-label="Previous"
                                >
                                    ←
                                </button>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white px-2">
                                    {props.label}
                                </h3>
                                <button
                                    onClick={() => props.onNavigate('NEXT')}
                                    className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                                    aria-label="Next"
                                >
                                    →
                                </button>
                            </div>
                            <div className="flex gap-2">
                                {(['month', 'week', 'day', 'agenda'] as const).map((viewName) => (
                                    <button
                                        key={viewName}
                                        onClick={() => props.onView(viewName)}
                                        className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                                            props.view === viewName
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-500'
                                        }`}
                                    >
                                        {viewName.charAt(0).toUpperCase() + viewName.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ),
                }}
                views={['month', 'week', 'day', 'agenda']}
                defaultView="month"
                popup={true}
                popupOffset={30}
                messages={{
                    allDay: 'All Day',
                    previous: '←',
                    next: '→',
                    today: 'Today',
                    month: 'Month',
                    week: 'Week',
                    day: 'Day',
                    agenda: 'Agenda',
                    date: 'Date',
                    time: 'Time',
                    event: 'Event',
                    noEventsInRange: 'No shipments scheduled for this period',
                    showMore: (count) => `+${count} more`
                }}
            />
        </div>
    );
};

export default ShippingCalendar;