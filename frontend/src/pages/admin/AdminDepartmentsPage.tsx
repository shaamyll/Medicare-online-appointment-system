import React, { useState } from 'react';
import { Building2, Plus, Edit2, Trash2, LayoutGrid, List } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/Card';
import { Button, IconButton } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { PageHeader } from '@/components/ui/PageHeader';
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
  const [deletingDept, setDeletingDept] = useState<{ id: number; name: string } | null>(null);
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

  const confirmDelete = async () => {
    if (!deletingDept) return;
    try {
      await deleteMutation.mutateAsync(deletingDept.id);
      toast(`Department "${deletingDept.name}" removed`, 'info');
      setDeletingDept(null);
    } catch (err: any) {
      toast(err.message || 'Failed to delete department', 'error');
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading medical specialties & departments..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Medical Specialties & Departments"
        subtitle="Define clinical specialties, practice divisions, and medical categories for provider registration and patient scheduling"
        actions={
          <div className="flex items-center gap-3">
            <div className="flex bg-gray-100 p-0.5 rounded-lg border border-gray-200">
              <IconButton
                icon={<List className="w-4 h-4" />}
                variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                size="sm"
                title="Table View"
                aria-label="Table View"
                onClick={() => setViewMode('table')}
                className={viewMode === 'table' ? 'bg-white shadow-xs' : 'text-gray-500'}
              />
              <IconButton
                icon={<LayoutGrid className="w-4 h-4" />}
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="sm"
                title="Grid View"
                aria-label="Grid View"
                onClick={() => setViewMode('grid')}
                className={viewMode === 'grid' ? 'bg-white shadow-xs' : 'text-gray-500'}
              />
            </div>

            <Button
              onClick={openCreateModal}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Add Department
            </Button>
          </div>
        }
      />

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
                        <div className="flex items-center justify-end gap-1">
                          <IconButton
                            icon={<Edit2 className="w-4 h-4" />}
                            variant="ghost"
                            size="sm"
                            title="Edit Department"
                            aria-label="Edit Department"
                            onClick={() => openEditModal(dept)}
                          />
                          <IconButton
                            icon={<Trash2 className="w-4 h-4" />}
                            variant="ghost"
                            size="sm"
                            title="Delete Department"
                            aria-label="Delete Department"
                            onClick={() => setDeletingDept({ id: dept.id, name: dept.name })}
                            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-gray-400 text-xs">
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
            <Card key={dept.id} hover className="border-gray-200 flex flex-col justify-between">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="h-12 w-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <StatusBadge status={dept.isActive ? 'active' : 'inactive'} />
                </div>

                <h3 className="text-base font-bold text-gray-900">{dept.name}</h3>
                <p className="text-xs text-gray-500 mt-2 leading-relaxed min-h-[3rem]">
                  {dept.description || 'Specialized clinical outpatient and inpatient medical care.'}
                </p>

                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-600">
                  <span className="font-semibold text-emerald-700">
                    {dept.doctorCount || 0} Doctors practicing
                  </span>
                </div>
              </div>

              <CardFooter className="flex items-center justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openEditModal(dept)}
                  leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                  className="text-gray-600 hover:text-gray-900 text-xs"
                >
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeletingDept({ id: dept.id, name: dept.name })}
                  leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                  className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 text-xs"
                >
                  Delete
                </Button>
              </CardFooter>
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
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Overview of medical services offered in this clinic..."
              className="w-full rounded-lg border border-gray-200 bg-white p-3 text-sm text-gray-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={createMutation.isPending || updateMutation.isPending}
            >
              {editingId ? 'Save Changes' : 'Create Department'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      {deletingDept && (
        <ConfirmModal
          isOpen={!!deletingDept}
          onClose={() => setDeletingDept(null)}
          title="Delete Department"
          description={`Are you sure you want to permanently remove the department "${deletingDept.name}"? Doctors assigned to this department may need to be reassigned.`}
          confirmLabel="Delete Department"
          variant="danger"
          isLoading={deleteMutation.isPending}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
};
