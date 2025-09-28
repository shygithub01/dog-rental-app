import React, { useState, useEffect } from 'react';
import { useCalendarService, type AvailabilityStatus, type DogAvailability } from '../../services/calendarService';
import { useIsMobile } from '../../hooks/useIsMobile';

interface DogCalendarProps {
  dogId: string;
  ownerId: string;
  mode: 'owner' | 'renter';
  onDateSelect?: (dates: Date[]) => void;
  selectedDates?: Date[];
}

const DogCalendar: React.FC<DogCalendarProps> = ({
  dogId,
  ownerId,
  mode,
  onDateSelect,
  selectedDates = []
}) => {
  const isMobile = useIsMobile();
  const calendarService = useCalendarService();
  
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [availability, setAvailability] = useState<DogAvailability | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDatesState, setSelectedDatesState] = useState<Date[]>(selectedDates);
  const [selectionMode, setSelectionMode] = useState<'available' | 'blocked'>('available');

  useEffect(() => {
    loadAvailability();
  }, [dogId]);

  useEffect(() => {
    setSelectedDatesState(selectedDates);
  }, [selectedDates]);

  const loadAvailability = async () => {
    try {
      setLoading(true);
      const data = await calendarService.getDogAvailability(dogId);
      setAvailability(data);
    } catch (error) {
      console.error('Error loading availability:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getDateStatus = (date: Date): AvailabilityStatus => {
    if (!availability) {
      return {
        available: true,
        blocked: false,
        booked: false
      };
    }

    const dateString = date.toISOString().split('T')[0];
    const dayStatus = availability.availability[dateString];
    
    if (!dayStatus) {
      return {
        available: availability.defaultAvailable,
        blocked: false,
        booked: false
      };
    }
    
    return dayStatus;
  };

  const isDateSelected = (date: Date): boolean => {
    return selectedDatesState.some(selectedDate => 
      selectedDate.toDateString() === date.toDateString()
    );
  };

  const handleDateClick = (date: Date) => {
    if (mode === 'renter') {
      // For renters, just select dates for booking
      const isSelected = isDateSelected(date);
      let newSelection: Date[];
      
      if (isSelected) {
        newSelection = selectedDatesState.filter(d => d.toDateString() !== date.toDateString());
      } else {
        newSelection = [...selectedDatesState, date];
      }
      
      setSelectedDatesState(newSelection);
      onDateSelect?.(newSelection);
      return;
    }

    // For owners, toggle availability
    const isSelected = isDateSelected(date);
    let newSelection: Date[];
    
    if (isSelected) {
      newSelection = selectedDatesState.filter(d => d.toDateString() !== date.toDateString());
    } else {
      newSelection = [...selectedDatesState, date];
    }
    
    setSelectedDatesState(newSelection);
  };

  const handleBulkUpdate = async () => {
    if (mode !== 'owner' || selectedDatesState.length === 0) return;

    try {
      const status: Omit<AvailabilityStatus, 'booked'> = {
        available: selectionMode === 'available',
        blocked: selectionMode === 'blocked',
        reason: selectionMode === 'blocked' ? 'Owner blocked' : undefined
      };

      await calendarService.setAvailability(dogId, ownerId, selectedDatesState, status);
      await loadAvailability();
      setSelectedDatesState([]);
    } catch (error) {
      console.error('Error updating availability:', error);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  const getDayStyle = (date: Date | null) => {
    if (!date) return { visibility: 'hidden' as const };

    const status = getDateStatus(date);
    const isSelected = isDateSelected(date);
    const isToday = date.toDateString() === new Date().toDateString();
    const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));

    let backgroundColor = '#ffffff';
    let color = '#374151';
    let border = '1px solid #e5e7eb';

    if (isPast) {
      backgroundColor = '#f3f4f6';
      color = '#9ca3af';
    } else if (status.booked) {
      backgroundColor = '#fef3c7';
      color = '#92400e';
      border = '2px solid #f59e0b';
    } else if (status.blocked) {
      backgroundColor = '#fee2e2';
      color = '#991b1b';
      border = '2px solid #ef4444';
    } else if (status.available) {
      backgroundColor = '#f0fdf4';
      color = '#166534';
      border = '2px solid #22c55e';
    }

    if (isSelected) {
      border = '3px solid #3b82f6';
      backgroundColor = '#dbeafe';
    }

    if (isToday) {
      border = '2px solid #ff6b35';
    }

    return {
      backgroundColor,
      color,
      border,
      cursor: isPast ? 'not-allowed' : 'pointer',
      opacity: isPast ? 0.5 : 1
    };
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📅</div>
        <p>Loading calendar...</p>
      </div>
    );
  }

  const days = getDaysInMonth(currentMonth);
  const monthYear = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      maxWidth: '600px',
      margin: '0 auto'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <button
          onClick={() => navigateMonth('prev')}
          style={{
            padding: '8px 12px',
            backgroundColor: '#f3f4f6',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '1.2rem'
          }}
        >
          ←
        </button>
        
        <h3 style={{
          fontSize: '1.25rem',
          fontWeight: '600',
          color: '#1f2937',
          margin: 0
        }}>
          {monthYear}
        </h3>
        
        <button
          onClick={() => navigateMonth('next')}
          style={{
            padding: '8px 12px',
            backgroundColor: '#f3f4f6',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '1.2rem'
          }}
        >
          →
        </button>
      </div>

      {/* Owner Controls */}
      {mode === 'owner' && (
        <div style={{
          marginBottom: '20px',
          padding: '15px',
          backgroundColor: '#f8fafc',
          borderRadius: '8px',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ marginBottom: '10px' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>
              Selection Mode:
            </label>
            <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
              <button
                onClick={() => setSelectionMode('available')}
                style={{
                  padding: '6px 12px',
                  backgroundColor: selectionMode === 'available' ? '#22c55e' : '#e5e7eb',
                  color: selectionMode === 'available' ? 'white' : '#374151',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  cursor: 'pointer'
                }}
              >
                ✅ Available
              </button>
              <button
                onClick={() => setSelectionMode('blocked')}
                style={{
                  padding: '6px 12px',
                  backgroundColor: selectionMode === 'blocked' ? '#ef4444' : '#e5e7eb',
                  color: selectionMode === 'blocked' ? 'white' : '#374151',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  cursor: 'pointer'
                }}
              >
                ❌ Blocked
              </button>
            </div>
          </div>
          
          {selectedDatesState.length > 0 && (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                {selectedDatesState.length} dates selected
              </span>
              <button
                onClick={handleBulkUpdate}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  cursor: 'pointer'
                }}
              >
                Update Selected
              </button>
              <button
                onClick={() => setSelectedDatesState([])}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  cursor: 'pointer'
                }}
              >
                Clear
              </button>
            </div>
          )}
        </div>
      )}

      {/* Days of week header */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '2px',
        marginBottom: '10px'
      }}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div
            key={day}
            style={{
              textAlign: 'center',
              padding: '8px',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#6b7280'
            }}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '2px'
      }}>
        {days.map((date, index) => (
          <div
            key={index}
            onClick={() => date && handleDateClick(date)}
            style={{
              ...getDayStyle(date),
              textAlign: 'center',
              padding: '12px 4px',
              borderRadius: '6px',
              fontSize: '0.875rem',
              fontWeight: '500',
              minHeight: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
          >
            {date?.getDate()}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div style={{
        marginTop: '20px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '15px',
        fontSize: '0.75rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <div style={{ width: '12px', height: '12px', backgroundColor: '#f0fdf4', border: '1px solid #22c55e', borderRadius: '2px' }}></div>
          <span>Available</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <div style={{ width: '12px', height: '12px', backgroundColor: '#fee2e2', border: '1px solid #ef4444', borderRadius: '2px' }}></div>
          <span>Blocked</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <div style={{ width: '12px', height: '12px', backgroundColor: '#fef3c7', border: '1px solid #f59e0b', borderRadius: '2px' }}></div>
          <span>Booked</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <div style={{ width: '12px', height: '12px', backgroundColor: '#dbeafe', border: '2px solid #3b82f6', borderRadius: '2px' }}></div>
          <span>Selected</span>
        </div>
      </div>
    </div>
  );
};

export default DogCalendar;