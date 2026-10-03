import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { Select } from '@/components/ui/Select';
import { LoadingState } from '@/components/ui/LoadingState';
import { useToast } from '@/components/ui/Toast';
import { useDoctorSchedule, useUpdateDoctorSchedule } from '@/features/doctors/hooks/useDoctors';
import { DoctorSchedule } from '@/features/doctors/types/doctor.types';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const DURATION_OPTIONS = [
  { value: '15', label: '15 minutes' },
  { value: '20', label: '20 minutes' },
  { value: '30', label: '30 minutes' },
  { value: '45', label: '45 minutes' },
  { value: '60', label: '60 minutes' },
];

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
      <PageHeader
        title="Weekly Shift Availability"
        subtitle="Define your working days, consultation shift hours, and appointment slot durations"
        actions={
          <Button
            onClick={handleSaveAll}
            isLoading={updateScheduleMutation.isPending}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Save Availability
          </Button>
        }
      />

      <div className="space-y-3">
        {schedules.map((item) => (
          <Card
            key={item.dayOfWeek}
            className={`border transition-all ${
              item.isAvailable
                ? 'border-emerald-200 bg-white shadow-sm'
                : 'border-gray-200 bg-gray-50/60 opacity-80'
            }`}
          >
            <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <input
                  type="checkbox"
                  checked={item.isAvailable}
                  onChange={() => handleToggleDay(item.dayOfWeek)}
                  className="h-5 w-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <div>
                  <h3 className="text-base font-bold text-gray-900">{item.dayOfWeek}</h3>
                  <span className="text-xs text-gray-500">
                    {item.isAvailable ? (
                      <span className="text-emerald-700 font-semibold">Available for Appointments</span>
                    ) : (
                      'Clinic Shift Off'
                    )}
                  </span>
                </div>
              </div>

              {item.isAvailable && (
                <div className="flex flex-wrap items-center gap-4 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 font-medium">Shift Hours:</span>
                    <input
                      type="time"
                      value={item.startTime}
                      onChange={(e) => handleTimeChange(item.dayOfWeek, 'startTime', e.target.value)}
                      className="h-10 rounded-lg border border-gray-200 bg-gray-50 px-3 font-mono text-sm text-gray-800 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                    />
                    <span className="text-gray-400">to</span>
                    <input
                      type="time"
                      value={item.endTime}
                      onChange={(e) => handleTimeChange(item.dayOfWeek, 'endTime', e.target.value)}
                      className="h-10 rounded-lg border border-gray-200 bg-gray-50 px-3 font-mono text-sm text-gray-800 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 font-medium">Slot Interval:</span>
                    <div className="w-36">
                      <Select
                        value={String(item.slotDurationMinutes)}
                        onChange={(val) => handleDurationChange(item.dayOfWeek, Number(val))}
                        options={DURATION_OPTIONS}
                      />
                    </div>
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
