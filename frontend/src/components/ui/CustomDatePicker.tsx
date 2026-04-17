import { useState, useRef, useEffect } from "react";
import { FaCalendarAlt, FaChevronLeft, FaChevronRight } from "react-icons/fa";

interface CustomDatePickerProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  disabled?: boolean;
}

export default function CustomDatePicker({
  value,
  onChange,
  placeholder = "Select date",
  className = "",
  required,
  disabled,
}: CustomDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const calendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: '2-digit', 
      day: '2-digit', 
      year: 'numeric' 
    });
  };

  const handleDateSelect = (day: number) => {
    const selectedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const formattedDate = selectedDate.toISOString().split('T')[0];
    onChange?.(formattedDate);
    setIsOpen(false);
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const navigateMonth = (direction: number) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + direction, 1));
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];
    const selectedDay = value ? new Date(value).getDate() : null;
    const isCurrentMonth = currentMonth.getMonth() === new Date().getMonth() && 
                          currentMonth.getFullYear() === new Date().getFullYear();
    const today = new Date().getDate();

    // Add empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-8"></div>);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const isSelected = selectedDay === day && 
                        currentMonth.getMonth() === new Date(value || '').getMonth() &&
                        currentMonth.getFullYear() === new Date(value || '').getFullYear();
      const isToday = isCurrentMonth && day === today;

      days.push(
        <button
          key={day}
          onClick={() => handleDateSelect(day)}
          className={`h-8 w-8 rounded-lg text-xs font-medium transition-all hover:bg-blue-500/20 ${
            isSelected 
              ? 'bg-blue-600 text-white hover:bg-blue-500' 
              : isToday 
              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
              : 'text-gray-300 hover:text-white'
          }`}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  const inputClassName = `w-full px-3.5 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all ${className}`;

  return (
    <div className="relative" ref={calendarRef}>
      <div className="relative">
        <input
          type="text"
          value={formatDate(value || '')}
          onChange={(e) => {
            // Parse input and update value if valid
            const match = e.target.value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
            if (match) {
              const [, month, day, year] = match;
              const date = new Date(`${year}-${month}-${day}`);
              if (!isNaN(date.getTime())) {
                onChange?.(date.toISOString().split('T')[0]);
              }
            }
          }}
          placeholder={placeholder}
          className={inputClassName}
          required={required}
          disabled={disabled}
          onFocus={() => !disabled && setIsOpen(true)}
          readOnly
        />
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
        >
          <FaCalendarAlt size={14} />
        </button>
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden">
          {/* Calendar Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-600">
            <button
              type="button"
              onClick={() => navigateMonth(-1)}
              className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-all"
            >
              <FaChevronLeft size={12} />
            </button>
            <h3 className="text-sm font-semibold text-white">
              {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h3>
            <button
              type="button"
              onClick={() => navigateMonth(1)}
              className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-all"
            >
              <FaChevronRight size={12} />
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="p-4">
            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                <div key={day} className="h-6 text-xs font-semibold text-gray-500 text-center">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Calendar days */}
            <div className="grid grid-cols-7 gap-1">
              {renderCalendar()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
