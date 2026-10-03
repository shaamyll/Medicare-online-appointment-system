import {
  CalendarPlus,
  CheckCircle2,
  XCircle,
  CalendarClock,
  Bell,
  UserPlus,
  ShieldCheck,
  AlertTriangle,
  LucideIcon,
} from 'lucide-react';

export interface NotificationMeta {
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  defaultLink: string;
}

export function getNotificationMeta(type: string): NotificationMeta {
  switch (type) {
    case 'appointment_booked':
      return {
        icon: CalendarPlus,
        iconColor: 'text-sky-600',
        iconBg: 'bg-sky-50 border-sky-100',
        defaultLink: '/dashboard/appointments',
      };

    case 'appointment_approved':
      return {
        icon: CheckCircle2,
        iconColor: 'text-emerald-600',
        iconBg: 'bg-emerald-50 border-emerald-100',
        defaultLink: '/dashboard/appointments',
      };

    case 'appointment_rejected':
      return {
        icon: XCircle,
        iconColor: 'text-rose-600',
        iconBg: 'bg-rose-50 border-rose-100',
        defaultLink: '/dashboard/appointments',
      };

    case 'appointment_cancelled':
    case 'appointment_cancelled_by_patient':
      return {
        icon: CalendarClock,
        iconColor: 'text-amber-600',
        iconBg: 'bg-amber-50 border-amber-100',
        defaultLink: '/dashboard/appointments',
      };

    case 'appointment_completed':
      return {
        icon: CheckCircle2,
        iconColor: 'text-teal-600',
        iconBg: 'bg-teal-50 border-teal-100',
        defaultLink: '/dashboard/appointments',
      };

    case 'new_appointment_request':
      return {
        icon: CalendarPlus,
        iconColor: 'text-indigo-600',
        iconBg: 'bg-indigo-50 border-indigo-100',
        defaultLink: '/doctor/appointments',
      };

    case 'doctor_approved':
      return {
        icon: ShieldCheck,
        iconColor: 'text-emerald-600',
        iconBg: 'bg-emerald-50 border-emerald-100',
        defaultLink: '/doctor/dashboard',
      };

    case 'doctor_rejected':
    case 'doctor_deactivated':
      return {
        icon: AlertTriangle,
        iconColor: 'text-rose-600',
        iconBg: 'bg-rose-50 border-rose-100',
        defaultLink: '/doctor/login',
      };

    case 'doctor_activated':
      return {
        icon: ShieldCheck,
        iconColor: 'text-emerald-600',
        iconBg: 'bg-emerald-50 border-emerald-100',
        defaultLink: '/doctor/dashboard',
      };

    case 'new_doctor_registration':
      return {
        icon: UserPlus,
        iconColor: 'text-violet-600',
        iconBg: 'bg-violet-50 border-violet-100',
        defaultLink: '/admin/doctor-requests',
      };

    case 'new_patient_registered':
      return {
        icon: UserPlus,
        iconColor: 'text-cyan-600',
        iconBg: 'bg-cyan-50 border-cyan-100',
        defaultLink: '/admin/patients',
      };

    default:
      return {
        icon: Bell,
        iconColor: 'text-slate-600',
        iconBg: 'bg-slate-50 border-slate-100',
        defaultLink: '/dashboard',
      };
  }
}
