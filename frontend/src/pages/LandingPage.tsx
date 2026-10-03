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
  CheckCircle2,
  Calendar,
  Star,
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
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50/70 via-gray-50/50 to-gray-50 pt-10 pb-16 md:pt-16 md:pb-24">
        {/* Subtle background glow effect */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-100/40 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute top-1/3 left-10 w-72 h-72 bg-sky-100/40 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Column: Headline, Value Proposition & Actions */}
            <div className="lg:col-span-7 text-left space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100/80 border border-emerald-200/90 text-emerald-800 text-xs font-semibold shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Next-Gen Healthcare Appointment Platform</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900 leading-[1.12]">
                Book Trusted Doctor Consultations in{' '}
                <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  Minutes
                </span>
              </h1>

              <p className="text-base sm:text-lg text-gray-600 max-w-xl leading-relaxed">
                Connect with verified independent physicians and specialized clinic doctors. Browse live availability, choose suitable consultation slots, and book your visit securely.
              </p>

              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
                <Button
                  size="lg"
                  onClick={() => navigate('/login?tab=register')}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                  className="shadow-md shadow-emerald-600/20 px-7"
                >
                  Book an Appointment
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => navigate('/doctor/login')}
                  className="bg-white hover:bg-gray-50 border-gray-300 text-gray-800 px-6"
                >
                  Join as a Doctor &rarr;
                </Button>
              </div>

              {/* Trust Badges */}
              <div className="pt-4 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-gray-500 font-medium">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Verified Medical Licenses</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Independent & Clinic Specialists</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Instant Slot Confirmation</span>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Visual with Overlay Cards */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                
                {/* Decorative background element */}
                <div className="absolute -inset-2 bg-gradient-to-tr from-emerald-500/20 to-teal-500/10 rounded-3xl blur-xl" />

                {/* Main Hero Card Container */}
                <div className="relative rounded-3xl overflow-hidden border border-gray-200/90 bg-white shadow-2xl shadow-gray-900/10">
                  <img
                    src="https://t3.ftcdn.net/jpg/06/99/65/88/360_F_699658885_S0IIHvw0YNa2o6tVtf65hRlaAxoWEwMe.jpg"
                    alt="Professional healthcare doctor consultation"
                    className="w-full h-80 sm:h-96 lg:h-[420px] object-cover object-center transform hover:scale-[1.02] transition-transform duration-500"
                    loading="eager"
                  />
                  
                  {/* Subtle bottom gradient scrim */}
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-950/60 via-transparent to-transparent pointer-events-none" />

                  {/* Bottom Text Overlay */}
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <p className="text-sm font-bold drop-shadow-sm">Verified Healthcare Professionals</p>
                    <p className="text-xs text-gray-200/90 drop-shadow-xs">Schedule clinical consultations with certified physicians</p>
                  </div>
                </div>

                {/* Floating Micro-Card 1: Top Right - Live Availability */}
                <div className="absolute -top-4 -right-3 sm:-right-5 bg-white/95 backdrop-blur-md px-3.5 py-2.5 rounded-2xl border border-gray-100 shadow-xl flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <p className="text-xs font-bold text-gray-900 leading-none">Live Scheduling</p>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-1 leading-none">Instant slot confirmation</p>
                  </div>
                </div>

                {/* Floating Micro-Card 2: Bottom Left - Top Rating */}
                <div className="absolute -bottom-4 -left-3 sm:-left-5 bg-white/95 backdrop-blur-md px-3.5 py-2.5 rounded-2xl border border-gray-100 shadow-xl flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900 leading-none">4.9 / 5.0 Rating</p>
                    <p className="text-[10px] text-gray-500 mt-1 leading-none">Over 1,200+ verified patients</p>
                  </div>
                </div>

              </div>
            </div>

          </div>

          {/* Key Metric Highlights Row */}
          <div className="mt-14 sm:mt-16 grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-gray-200/90 shadow-xs hover:border-emerald-200 transition-colors">
              <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600">50+</p>
              <p className="text-xs text-gray-500 mt-1 font-medium">Certified Specialists</p>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-gray-200/90 shadow-xs hover:border-sky-200 transition-colors">
              <p className="text-2xl sm:text-3xl font-extrabold text-sky-600">12+</p>
              <p className="text-xs text-gray-500 mt-1 font-medium">Medical Specialties</p>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-gray-200/90 shadow-xs hover:border-indigo-200 transition-colors">
              <p className="text-2xl sm:text-3xl font-extrabold text-indigo-600">&lt; 15 min</p>
              <p className="text-xs text-gray-500 mt-1 font-medium">Average Confirmation</p>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-gray-200/90 shadow-xs hover:border-amber-200 transition-colors">
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
