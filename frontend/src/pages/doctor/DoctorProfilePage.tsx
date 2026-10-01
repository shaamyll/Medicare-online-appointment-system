import React, { useState, useEffect } from 'react';
import { User, Phone, Save } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingState } from '@/components/ui/LoadingState';
import { useToast } from '@/components/ui/Toast';
import { useDoctorProfile, useUpdateDoctorProfile } from '@/features/doctors/hooks/useDoctors';
import { useDepartments } from '@/features/departments/hooks/useDepartments';

export const DoctorProfilePage: React.FC = () => {
  const { toast } = useToast();
  const { data: doctor, isLoading } = useDoctorProfile();
  const { data: departments } = useDepartments();
  const updateProfileMutation = useUpdateDoctorProfile();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [departmentId, setDepartmentId] = useState<number | undefined>(undefined);
  const [qualification, setQualification] = useState('');
  const [experienceYears, setExperienceYears] = useState(0);
  const [consultationFee, setConsultationFee] = useState(0);
  const [roomNumber, setRoomNumber] = useState('');
  const [bio, setBio] = useState('');

  useEffect(() => {
    if (doctor) {
      setName(doctor.user?.name || '');
      setPhone(doctor.user?.phone || '');
      setSpecialization(doctor.specialization || '');
      setDepartmentId(doctor.department?.id);
      setQualification(doctor.qualification || '');
      setExperienceYears(doctor.experienceYears || 0);
      setConsultationFee(doctor.consultationFee || 0);
      setRoomNumber(doctor.roomNumber || '');
      setBio(doctor.bio || '');
    }
  }, [doctor]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfileMutation.mutateAsync({
        specialization,
        qualification,
        experienceYears,
        consultationFee,
        roomNumber,
        bio,
        user: { name, phone } as any,
      });
      toast('Professional profile updated successfully!', 'success');
    } catch (err: any) {
      toast(err.message || 'Failed to update profile', 'error');
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading your clinical profile..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Physician Professional Profile</h1>
          <p className="text-sm text-slate-500">
            Public doctor credentials, consultation fees, and clinical room information shown to patients
          </p>
        </div>
      </div>

      <Card className="max-w-4xl p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Doctor Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              leftIcon={<User className="w-4 h-4 text-slate-400" />}
              required
            />

            <Input
              label="Contact Phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              leftIcon={<Phone className="w-4 h-4 text-slate-400" />}
              placeholder="+1 (555) 019-2831"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                Clinical Department
              </label>
              <select
                value={departmentId || ''}
                onChange={(e) => setDepartmentId(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs text-slate-900 focus:border-teal-500 focus:outline-none"
              >
                <option value="">Select Department</option>
                {departments?.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Medical Specialization"
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
              placeholder="e.g. Interventional Cardiology, Spine Surgery"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Qualifications / Degrees"
              value={qualification}
              onChange={(e) => setQualification(e.target.value)}
              placeholder="e.g. MD, FACC, MBBS"
              required
            />

            <Input
              label="Experience (Years)"
              type="number"
              value={experienceYears}
              onChange={(e) => setExperienceYears(Number(e.target.value))}
              min={0}
              required
            />

            <Input
              label="Consultation Fee ($)"
              type="number"
              step="0.01"
              value={consultationFee}
              onChange={(e) => setConsultationFee(Number(e.target.value))}
              min={0}
              required
            />
          </div>

          <Input
            label="Room / Clinic Wing Location"
            value={roomNumber}
            onChange={(e) => setRoomNumber(e.target.value)}
            placeholder="e.g. Suite 402, West Wing Floor 4"
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
              Doctor Professional Biography & Clinical Focus
            </label>
            <textarea
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Summary of medical expertise, research credentials, clinical experience..."
              className="w-full rounded-lg border border-slate-300 p-3 text-xs text-slate-900 focus:border-teal-500 focus:outline-none leading-relaxed"
            />
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <Button
              type="submit"
              isLoading={updateProfileMutation.isPending}
              leftIcon={<Save className="w-4 h-4" />}
              className="bg-teal-600 hover:bg-teal-700 text-white"
            >
              Update Profile Information
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
