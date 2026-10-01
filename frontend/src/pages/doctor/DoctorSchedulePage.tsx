import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/LoadingState';
import { useToast } from '@/components/ui/Toast';
import { useDoctorSchedule, useUpdateDoctorSchedule } from '@/features/doctors/hooks/useDoctors';
import { DoctorSchedule } from '@/features/doctors/types/doctor.types';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const DoctorSchedulePage: React.FC = () => {
  const { toast } = useToast();
  const { data: serverSchedules, isLoading } = useDoctorSchedule();
  const updateScheduleMutation = useUpdateDoctorSchedule();

  const [schedules, setSchedules] = useState<DoctorSchedule[]>([]);

  useEffect(() => {
    const defaultSchedules: DoctorSchedule[] = DAYS.map((day) => {
      const existing = (serverSchedules || []).find((s) => s.dayOfWeek.toLowerCase() === day.toLowerCase());
      if (existing) {
        return {
          dayOfWeek: day,
          startTime: existing.startTime.slice(0, 5),
          endTime: existing.endTime.slice(0, 5),
          slotDurationMinutes: existing.slotDurationMinutes || 30,
          isAvailable: existing.isAvailable,
        };
      }
      return {
        dayOfWeek: day,
        startTime: '09:00',
        endTime: '17:00',
        slotDurationMinutes: 30,
        isAvailable: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].includes(day),
      };
    });
    setSchedules(defaultSchedules);
  }, [serverSchedules]);

  const handleToggleDay = (day: string) => {
    setSchedules((prev) =>
      prev.map((s) => (s.dayOfWeek === day ? { ...s, isAvailable: !s.isAvailable } : s))
    );
  };

  const handleTimeChange = (day: string, field: 'startTime' | 'endTime', value: string) => {
    setSchedules((prev) =>
      prev.map((s) => (s.dayOfWeek === day ? { ...s, [field]: value } : s))
    );
  };

  const handleDurationChange = (day: string, duration: number) => {
    setSchedules((prev) =>
      prev.map((s) => (s.dayOfWeek === day ? { ...s, slotDurationMinutes: duration } : s))
    );
  };

  const handleSaveAll = async () => {
    try {
      const formatted = schedules.map((s) => ({
        ...s,
        startTime: s.startTime.length === 5 ? `${s.startTime}:00` : s.startTime,
        endTime: s.endTime.length === 5 ? `${s.endTime}:00` : s.endTime,
      }));
      await updateScheduleMutation.mutateAsync(formatted);
      toast('Weekly availability schedule saved successfully!', 'success');
    } catch (err: any) {
      toast(err.message || 'Failed to update schedule', 'error');
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading weekly consultation schedule..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Weekly Shift Availability</h1>
          <p className="text-sm text-slate-500">
            Define your working days, consultation shift hours, and appointment slot durations
          </p>
        </div>

        <Button
          onClick={handleSaveAll}
          isLoading={updateScheduleMutation.isPending}
          leftIcon={<Save className="w-4 h-4" />}
          className="bg-teal-600 hover:bg-teal-700 text-white shadow-sm"
        >
          Save Availability
        </Button>
      </div>

      <div className="space-y-3">
        {schedules.map((item) => (
          <Card
            key={item.dayOfWeek}
            className={`border transition-all ${
              item.isAvailable
                ? 'border-teal-200 bg-white shadow-sm'
                : 'border-slate-200 bg-slate-50/60 opacity-80'
            }`}
          >
            <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <input
                  type="checkbox"
                  checked={item.isAvailable}
                  onChange={() => handleToggleDay(item.dayOfWeek)}
                  className="h-5 w-5 rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                />
                <div>
                  <h3 className="text-base font-bold text-slate-900">{item.dayOfWeek}</h3>
                  <span className="text-xs text-slate-500">
                    {item.isAvailable ? (
                      <span className="text-teal-700 font-semibold">Available for Appointments</span>
                    ) : (
                      'Clinic Shift Off'
                    )}
                  </span>
                </div>
              </div>

              {item.isAvailable && (
                <div className="flex flex-wrap items-center gap-4 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 font-medium">Shift Hours:</span>
                    <input
                      type="time"
                      value={item.startTime}
                      onChange={(e) => handleTimeChange(item.dayOfWeek, 'startTime', e.target.value)}
                      className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-mono text-slate-800 focus:border-teal-500 focus:outline-none"
                    />
                    <span className="text-slate-400">to</span>
                    <input
                      type="time"
                      value={item.endTime}
                      onChange={(e) => handleTimeChange(item.dayOfWeek, 'endTime', e.target.value)}
                      className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-mono text-slate-800 focus:border-teal-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 font-medium">Slot Interval:</span>
                    <select
                      value={item.slotDurationMinutes}
                      onChange={(e) => handleDurationChange(item.dayOfWeek, Number(e.target.value))}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 focus:border-teal-500 focus:outline-none"
                    >
                      <option value={15}>15 minutes</option>
                      <option value={20}>20 minutes</option>
                      <option value={30}>30 minutes</option>
                      <option value={45}>45 minutes</option>
                      <option value={60}>60 minutes</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
