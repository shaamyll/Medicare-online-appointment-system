import React, { useState } from 'react';
import { Building2, Plus, Edit2, Trash2, LayoutGrid, List } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { StatusBadge } from '@/components/ui/Badge';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell, TableHeadSerial, TableCellSerial } from '@/components/ui/Table';
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

  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
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

        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => setViewMode('table')}
              title="Table View"
              className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1 transition ${
                viewMode === 'table' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              title="Grid View"
              className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1 transition ${
                viewMode === 'grid' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          <Button
            onClick={openCreateModal}
            leftIcon={<Plus className="w-4 h-4" />}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            Add Department
          </Button>
        </div>
      </div>

      {viewMode === 'table' ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHeadSerial />
                  <TableHead>Department Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Doctors Practicing</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {departments && departments.length > 0 ? (
                  departments.map((dept: any, idx: number) => (
                    <TableRow key={dept.id}>
                      <TableCellSerial index={idx} />
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 text-sm">{dept.name}</p>
                            <p className="text-xs text-slate-400">ID #{dept.id}</p>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="max-w-md">
                        <p className="text-xs text-slate-600 truncate">
                          {dept.description || 'Specialized outpatient clinical care.'}
                        </p>
                      </TableCell>

                      <TableCell>
                        <span className="font-semibold text-xs text-emerald-700">
                          {dept.doctorCount || 0} Doctors
                        </span>
                      </TableCell>

                      <TableCell>
                        <StatusBadge status={dept.isActive ? 'active' : 'inactive'} />
                      </TableCell>

                      <TableCell className="text-right pr-6">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(dept)}
                            title="Edit Department"
                            aria-label="Edit Department"
                            className="w-8 h-8 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition flex items-center justify-center cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(dept.id, dept.name)}
                            title="Delete Department"
                            aria-label="Delete Department"
                            className="w-8 h-8 rounded-lg border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:border-rose-300 transition flex items-center justify-center cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-slate-400 text-xs">
                      No departments found. Create your first clinical department.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments?.map((dept: any) => (
            <Card key={dept.id} hover className="border-slate-200/90 flex flex-col justify-between">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="h-12 w-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <StatusBadge status={dept.isActive ? 'active' : 'inactive'} />
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
      )}

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
