import React, { useEffect, useState } from 'react';
import { Calendar, momentLocalizer, Event } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { supabase } from '@/lib/initSupabase';
import { Database } from '@/lib/database.types';

type ShippingCalendarProps = {
    // Add props here if needed
};

type Schedule = Database['public']['Tables']['shippingquotes']['Row'];

const localizer = momentLocalizer(moment);

const ShippingCalendar: React.FC<ShippingCalendarProps> = () => {
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [events, setEvents] = useState<Event[]>([]);
    const [errorText, setErrorText] = useState<string>('');

    useEffect(() => {
        const fetchSchedules = async () => {
            try {
                // Fetch schedules with status 'Order'
                const { data: schedules, error } = await supabase
                    .from('shippingquotes')
                    .select('id, earliest_pickup_date, latest_pickup_date')
                    .eq('status', 'Order');

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
            id: schedule.id,
            title: `Order ${schedule.id}`,
            start: new Date(schedule.earliest_pickup_date),
            end: new Date(schedule.latest_pickup_date),
        }));

        setEvents(calendarEvents);
    }, [schedules]);

    return (
        <div>
            <h1 className='text-zinc-900 font-semibold text-xl'>Shipping Calendar</h1>
            {errorText && <p className="error">{errorText}</p>}
            <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{ height: 500 }}
            />
        </div>
    );
};

export default ShippingCalendar;