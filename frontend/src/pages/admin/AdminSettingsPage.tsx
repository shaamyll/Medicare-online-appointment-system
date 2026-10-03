import React from 'react';
import { ShieldCheck, Database } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/PageHeader';

export const AdminSettingsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        title="System Configuration & Security"
        subtitle="Administrative environment settings, authentication parameters, and database status"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Authentication & Roles</h3>
              <p className="text-xs text-gray-500">JWT Token & Role-Based Access Control</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 border border-gray-100">
              <span className="text-gray-600 font-medium">Public Admin Registration:</span>
              <Badge variant="danger">Disabled (Strict)</Badge>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 border border-gray-100">
              <span className="text-gray-600 font-medium">Doctor Registration Verification:</span>
              <Badge variant="warning">Manual Admin Approval Required</Badge>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 border border-gray-100">
              <span className="text-gray-600 font-medium">Password Hashing Algorithm:</span>
              <span className="font-mono text-gray-800">BCRYPT (Cost 10)</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 border border-gray-100">
              <span className="text-gray-600 font-medium">Token Lifespan:</span>
              <span className="font-mono text-gray-800">24 Hours (86400s)</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-sky-50 text-sky-600">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Database & Architecture</h3>
              <p className="text-xs text-gray-500">PHP Custom MVC + MySQL</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 border border-gray-100">
              <span className="text-gray-600 font-medium">Database Name:</span>
              <span className="font-mono text-gray-800">medicare_appointment_db</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 border border-gray-100">
              <span className="text-gray-600 font-medium">Database Driver:</span>
              <span className="font-mono text-gray-800">PDO MySQL (Prepared Stmts)</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 border border-gray-100">
              <span className="text-gray-600 font-medium">Connection State:</span>
              <Badge variant="success">Connected & Healthy</Badge>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 border border-gray-100">
              <span className="text-gray-600 font-medium">Seeded Admin Account:</span>
              <span className="font-mono text-emerald-700">admin@medicare.com</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
