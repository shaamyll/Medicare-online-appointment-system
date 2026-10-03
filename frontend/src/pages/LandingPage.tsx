import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  HeartPulse,
  Brain,
  Baby,
  Bone,
  Stethoscope,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Navbar } from '@/components/layout/Navbar';
import { DoctorCard } from '@/features/doctors/components/DoctorCard';
import { DoctorDetailsModal } from '@/features/doctors/components/DoctorDetailsModal';
import { Doctor } from '@/features/doctors/types/doctor.types';
import { useDepartments } from '@/features/departments/hooks/useDepartments';
import { useDoctors } from '@/features/doctors/hooks/useDoctors';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const { data: departments } = useDepartments();
  const { data: doctors } = useDoctors();

  const departmentIcons: Record<string, React.ReactNode> = {
    Cardiology: <HeartPulse className="w-6 h-6 text-rose-500" />,
    Neurology: <Brain className="w-6 h-6 text-indigo-500" />,
    Pediatrics: <Baby className="w-6 h-6 text-amber-500" />,
    Orthopedics: <Bone className="w-6 h-6 text-emerald-500" />,
    'General Medicine': <Stethoscope className="w-6 h-6 text-sky-500" />,
  };

  const defaultDepartments = [
    { id: 1, name: 'Cardiology', description: 'Advanced heart & cardiovascular treatment.' },
    { id: 2, name: 'Neurology', description: 'Expert neurological consultation & diagnostics.' },
    { id: 3, name: 'Pediatrics', description: 'Compassionate pediatric healthcare for children.' },
    { id: 4, name: 'Orthopedics', description: 'Joint, spine, and bone trauma specialists.' },
  ];

  const displayedDepartments = departments && departments.length > 0 ? departments : defaultDepartments;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50/60 via-gray-50 to-gray-50 pt-16 pb-20 md:pt-24 md:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100/70 border border-emerald-200/80 text-emerald-800 text-xs font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Smarter, Faster Healthcare Scheduling</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-gray-900 max-w-4xl mx-auto leading-tight">
            Book Trusted Doctor Consultations in <span className="text-emerald-600">Minutes</span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Medi-Care streamlines online healthcare appointment booking. Connect with verified medical specialists, select ideal time slots, and manage your health records effortlessly.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              onClick={() => navigate('/login?tab=register')}
              rightIcon={<ArrowRight className="w-4 h-4" />}
              className="w-full sm:w-auto shadow-md"
            >
              Book an Appointment
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate('/doctor/login')}
              className="w-full sm:w-auto bg-white hover:bg-gray-50 border-gray-300 text-gray-800"
            >
              For Doctors &rarr;
            </Button>
          </div>

          {/* Key Metric Highlights */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-sm">
              <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600">50+</p>
              <p className="text-xs text-gray-500 mt-1 font-medium">Expert Doctors</p>
            </div>
            <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-sm">
              <p className="text-2xl sm:text-3xl font-extrabold text-sky-600">12+</p>
              <p className="text-xs text-gray-500 mt-1 font-medium">Specialized Clinics</p>
            </div>
            <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-sm">
              <p className="text-2xl sm:text-3xl font-extrabold text-indigo-600">15 min</p>
              <p className="text-xs text-gray-500 mt-1 font-medium">Avg. Wait Time</p>
            </div>
            <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-sm">
              <p className="text-2xl sm:text-3xl font-extrabold text-amber-600">99.8%</p>
              <p className="text-xs text-gray-500 mt-1 font-medium">Patient Satisfaction</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Clinical Departments */}
      <section className="py-16 bg-white border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
              Specialized Medical Departments
            </h2>
            <p className="text-gray-500 text-sm mt-2">
              Browse top medical specialties and schedule with board-certified independent and clinic physicians.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {displayedDepartments.map((dept) => (
              <Card key={dept.id} hover className="border-gray-200 flex flex-col justify-between">
                <div>
                  <div className="p-3 w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center mb-4">
                    {departmentIcons[dept.name] || <Stethoscope className="w-6 h-6 text-emerald-600" />}
                  </div>
                  <h3 className="text-base font-semibold text-gray-900">{dept.name}</h3>
                  <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                    {dept.description || 'Specialized consultation and continuous care.'}
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => navigate('/login?tab=register')}
                    className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1 cursor-pointer"
                  >
                    <span>Find Doctors</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Doctors Section */}
      {doctors && doctors.length > 0 && (
        <section className="py-16 bg-gray-50 border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                Featured Medical Specialists
              </h2>
              <p className="text-gray-500 text-sm mt-2">
                Connect with board-certified physicians and schedule your appointment today.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {doctors.slice(0, 4).map((doctor) => (
                <DoctorCard
                  key={doctor.id}
                  doctor={doctor}
                  onBook={(docId) =>
                    navigate(`/login?redirect=${encodeURIComponent(`/dashboard/doctors?bookDoctor=${docId}`)}`)
                  }
                  onViewProfile={(doc) => setSelectedDoctor(doc)}
                />
              ))}
            </div>

            {/* Doctor Details Modal showing all information */}
            <DoctorDetailsModal
              isOpen={selectedDoctor !== null}
              onClose={() => setSelectedDoctor(null)}
              doctor={selectedDoctor}
              onBookAppointment={(docId) => {
                setSelectedDoctor(null);
                navigate(`/login?redirect=${encodeURIComponent(`/dashboard/doctors?bookDoctor=${docId}`)}`);
              }}
            />
          </div>
        </section>
      )}

      {/* How Medi-Care Works */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
              Simplified 3-Step Appointment Workflow
            </h2>
            <p className="text-gray-500 text-sm mt-2">
              Say goodbye to long phone queues and waiting rooms.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-xl bg-gray-50 border border-gray-200 shadow-sm text-center">
              <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-lg mb-4">
                1
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">Select Doctor & Department</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Filter through verified medical profiles, qualifications, and consultation fees.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-gray-50 border border-gray-200 shadow-sm text-center">
              <div className="w-12 h-12 mx-auto rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-lg mb-4">
                2
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">Choose Available Time Slot</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Select your convenient date and confirmed doctor shift with zero slot conflicts.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-gray-50 border border-gray-200 shadow-sm text-center">
              <div className="w-12 h-12 mx-auto rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-lg mb-4">
                3
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">Instant Confirmation</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Receive an appointment reference token and access updates directly from your dashboard.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-gray-200 bg-white py-8 text-center text-xs text-gray-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 Medi-Care Online Appointment System. All rights reserved.</p>
          <div className="flex gap-6 text-gray-400">
            <span className="hover:text-gray-600 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-gray-600 cursor-pointer">Terms of Service</span>
            <span className="hover:text-gray-600 cursor-pointer">Support</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
