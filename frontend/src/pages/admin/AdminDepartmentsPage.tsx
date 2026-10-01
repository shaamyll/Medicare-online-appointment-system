import React, { useState } from 'react';
import { Building2, Plus, Edit2, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { LoadingState } from '@/components/ui/LoadingState';
import { useToast } from '@/components/ui/Toast';
import { useDepartments } from '@/features/departments/hooks/useDepartments';
import {
  useCreateDepartment,
  useUpdateDepartment,
  useDeleteDepartment,
} from '@/features/admin/hooks/useAdmin';

export const AdminDepartmentsPage: React.FC = () => {
  const { toast } = useToast();
  const { data: departments, isLoading } = useDepartments();
  const createMutation = useCreateDepartment();
  const updateMutation = useUpdateDepartment();
  const deleteMutation = useDeleteDepartment();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('Activity');

  const openCreateModal = () => {
    setEditingId(null);
    setName('');
    setDescription('');
    setIcon('Activity');
    setIsModalOpen(true);
  };

  const openEditModal = (dept: any) => {
    setEditingId(dept.id);
    setName(dept.name);
    setDescription(dept.description || '');
    setIcon(dept.icon || 'Activity');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast('Department name is required', 'error');
      return;
    }

    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, data: { name, description, icon } });
        toast('Department updated successfully', 'success');
      } else {
        await createMutation.mutateAsync({ name, description, icon });
        toast('Department created successfully', 'success');
      }
      setIsModalOpen(false);
    } catch (err: any) {
      toast(err.message || 'Operation failed', 'error');
    }
  };

  const handleDelete = async (id: number, deptName: string) => {
    if (!window.confirm(`Are you sure you want to delete the department "${deptName}"?`)) {
      return;
    }
    try {
      await deleteMutation.mutateAsync(id);
      toast(`Department "${deptName}" removed`, 'info');
    } catch (err: any) {
      toast(err.message || 'Failed to delete department', 'error');
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading hospital departments..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Hospital Departments</h1>
          <p className="text-sm text-slate-500">
            Define medical specialties, clinic wings, and clinical descriptions for patient scheduling
          </p>
        </div>

        <Button
          onClick={openCreateModal}
          leftIcon={<Plus className="w-4 h-4" />}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          Add Department
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {departments?.map((dept: any) => (
          <Card key={dept.id} hover className="border-slate-200/90 flex flex-col justify-between">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="h-12 w-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700">
                  <Building2 className="w-6 h-6" />
                </div>
                <Badge variant={dept.isActive ? 'success' : 'default'}>
                  {dept.isActive ? 'Active Clinic' : 'Inactive'}
                </Badge>
              </div>

              <h3 className="text-base font-bold text-slate-900">{dept.name}</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed min-h-[3rem]">
                {dept.description || 'Specialized clinical outpatient and inpatient medical care.'}
              </p>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                <span className="font-semibold text-emerald-700">
                  {dept.doctorCount || 0} Doctors practicing
                </span>
              </div>
            </div>

            <div className="p-3 px-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-2 rounded-b-xl">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openEditModal(dept)}
                leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                className="text-slate-600 hover:text-slate-900 text-xs"
              >
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(dept.id, dept.name)}
                leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 text-xs"
              >
                Delete
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Edit Department' : 'Create New Department'}
        description="Clinical specialties help patients find the right medical care."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Department Name"
            placeholder="e.g. Oncology, Ophthalmology"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Overview of medical services offered in this clinic..."
              className="w-full rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={createMutation.isPending || updateMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {editingId ? 'Save Changes' : 'Create Department'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
