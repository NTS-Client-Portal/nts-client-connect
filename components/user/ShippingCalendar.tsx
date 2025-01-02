import React, { useEffect, useState } from 'react';
import { Calendar, momentLocalizer, Event as BigCalendarEvent } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { supabase } from '@/lib/initSupabase';
import { Database } from '@/lib/database.types';
import { useRouter } from 'next/router';

type ShippingCalendarProps = {
    // Add props here if needed
};

type Schedule = Database['public']['Tables']['shippingquotes']['Row'];

const localizer = momentLocalizer(moment);

type Event = BigCalendarEvent & { id: string };

const ShippingCalendar: React.FC<ShippingCalendarProps> = () => {
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [events, setEvents] = useState<Event[]>([]);
    const [errorText, setErrorText] = useState<string>('');
    const router = useRouter();

    useEffect(() => {
        const fetchSchedules = async () => {
            try {
                // Fetch schedules with status 'Order'
                const { data: schedules, error } = await supabase
                    .from('shippingquotes')
                    .select('id, earliest_pickup_date, latest_pickup_date')
                    .eq('status', 'Order')
                    .or('is_complete.is.null,is_complete.eq.false')
                    .or('is_archived.is.null,is_archived.eq.false');

                if (error) {
                    setErrorText(error.message);
                    console.error('Error fetching schedules:', error.message);
                    return;
                }

                console.log('Fetched schedules:', schedules); // Debugging log

                setSchedules(schedules.filter(schedule => schedule.id !== null && schedule.earliest_pickup_date !== null && schedule.latest_pickup_date !== null) as Schedule[]);
            } catch (error) {
                console.error('Error fetching schedules:', error);
                setErrorText('Error fetching schedules');
            }
        };

        fetchSchedules();
    }, []);

    useEffect(() => {
        // Convert schedules to events for the calendar
        const calendarEvents = schedules.map(schedule => ({
            id: schedule.id.toString(),
            title: `Order ${schedule.id}`,
            start: new Date(schedule.earliest_pickup_date),
            end: new Date(schedule.latest_pickup_date),
        }));

        setEvents(calendarEvents);
    }, [schedules]);

    const handleSelectEvent = (event: Event) => {
        router.push(`/user/logistics-management?tab=orders&searchTerm=${event.id}&searchColumn=id`);
    };

    return (
        <div className="px-4">
            <h1 className='text-zinc-900 font-semibold text-xl text-center md:text-normal mb-4'>Shipping Calendar</h1>
            {errorText && <p className="error">{errorText}</p>}
            <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{ height: '75vh' }}
                onSelectEvent={handleSelectEvent}
                className="sm:rounded-lg shadow-lg"
            />
        </div>
    );
};

export default ShippingCalendar;