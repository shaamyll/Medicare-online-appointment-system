import React, { useState, useMemo } from 'react';
import {
  Building2,
  Plus,
  Edit2,
  Trash2,
  Power,
  PowerOff,
  Users,
  AlertCircle,
  Activity,
  Heart,
  Stethoscope,
  Brain,
  Bone,
  Eye,
  Baby,
  Pill,
  Microscope,
  Syringe,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button, IconButton } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/Badge';
import { FilterBar } from '@/components/ui/FilterBar';
import { SearchInput } from '@/components/ui/SearchInput';
import { Select } from '@/components/ui/Select';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import { useDepartments } from '@/features/departments/hooks/useDepartments';
import {
  useCreateDepartment,
  useUpdateDepartment,
  useDeleteDepartment,
} from '@/features/admin/hooks/useAdmin';
import { cn } from '@/lib/utils';

// Supported Lucide icon tokens for departments
const ICON_COMPONENTS: Record<string, React.ElementType> = {
  Activity,
  Heart,
  Stethoscope,
  Brain,
  Bone,
  Eye,
  Baby,
  Pill,
  Microscope,
  Syringe,
  Sparkles,
  ShieldAlert,
  Building2,
};

const AVAILABLE_ICONS = [
  'Activity',
  'Heart',
  'Stethoscope',
  'Brain',
  'Bone',
  'Eye',
  'Baby',
  'Pill',
  'Microscope',
  'Syringe',
  'Sparkles',
  'ShieldAlert',
  'Building2',
];

export const AdminDepartmentsPage: React.FC = () => {
  const { toast } = useToast();
  // Fetch all departments including inactive for administrative management
  const { data: departments, isLoading, isError, refetch } = useDepartments(true);
  const createMutation = useCreateDepartment();
  const updateMutation = useUpdateDepartment();
  const deleteMutation = useDeleteDepartment();

  // Filters state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Modal form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('Activity');
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete modal state
  const [deletingDept, setDeletingDept] = useState<{ id: number; name: string; doctorCount: number } | null>(null);

  const openCreateModal = () => {
    setEditingId(null);
    setName('');
    setDescription('');
    setIcon('Activity');
    setIsActive(true);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (dept: any) => {
    setEditingId(dept.id);
    setName(dept.name);
    setDescription(dept.description || '');
    setIcon(dept.icon || 'Activity');
    setIsActive(dept.isActive !== false);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmed = name.trim();
    if (!trimmed) {
      setFormError('Department name is required.');
      return;
    }

    try {
      if (editingId) {
        await updateMutation.mutateAsync({
          id: editingId,
          data: { name: trimmed, description: description.trim(), icon, isActive },
        });
        toast('Department updated successfully', 'success');
      } else {
        await createMutation.mutateAsync({
          name: trimmed,
          description: description.trim(),
          icon,
        });
        toast('Department created successfully', 'success');
      }
      setIsModalOpen(false);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Operation failed';
      setFormError(msg);
      toast(msg, 'error');
    }
  };

  const handleToggleActive = async (dept: any) => {
    try {
      await updateMutation.mutateAsync({
        id: dept.id,
        data: { isActive: !dept.isActive },
      });
      toast(`Department "${dept.name}" ${dept.isActive ? 'deactivated' : 'activated'} successfully`, 'success');
    } catch (err: any) {
      toast(err.response?.data?.message || err.message || 'Failed to update department status', 'error');
    }
  };

  const confirmDelete = async () => {
    if (!deletingDept) return;
    try {
      await deleteMutation.mutateAsync(deletingDept.id);
      toast(`Department "${deletingDept.name}" removed successfully`, 'info');
      setDeletingDept(null);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to delete department';
      toast(msg, 'error');
    }
  };

  // Filtered department list
  const filteredDepartments = useMemo(() => {
    if (!departments) return [];
    return departments.filter((d: any) => {
      const matchesSearch =
        search === '' ||
        d.name.toLowerCase().includes(search.toLowerCase()) ||
        (d.description && d.description.toLowerCase().includes(search.toLowerCase()));

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && d.isActive) ||
        (statusFilter === 'inactive' && !d.isActive);

      return matchesSearch && matchesStatus;
    });
  }, [departments, search, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Clinical Departments & Specialties"
        subtitle="Manage hospital medical divisions, clinical specialties, and patient-facing department filters"
        actions={
          <Button onClick={openCreateModal} leftIcon={<Plus className="w-4 h-4" />}>
            Add Department
          </Button>
        }
      />

      {/* Filter Bar with Search and Status Filter */}
      <FilterBar>
        <div className="w-full md:w-80">
          <SearchInput
            placeholder="Search departments by name or description..."
            value={search}
            onChange={(val) => setSearch(val)}
            onClear={() => setSearch('')}
          />
        </div>
        <div className="w-full sm:w-48">
          <Select
            value={statusFilter}
            onChange={(val) => setStatusFilter(val as any)}
            options={[
              { value: 'all', label: 'All Statuses' },
              { value: 'active', label: 'Active', dot: 'bg-emerald-500' },
              { value: 'inactive', label: 'Inactive', dot: 'bg-gray-400' },
            ]}
          />
        </div>
      </FilterBar>

      {/* Loading Skeleton Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Card key={i} className="p-6 rounded-2xl border border-gray-200 animate-pulse flex flex-col justify-between h-56">
              <div className="space-y-3">
                <div className="h-11 w-11 rounded-xl bg-gray-200" />
                <div className="h-5 w-3/4 bg-gray-200 rounded" />
                <div className="h-3 w-full bg-gray-200 rounded" />
                <div className="h-3 w-5/6 bg-gray-200 rounded" />
              </div>
              <div className="h-8 w-full bg-gray-100 rounded-xl" />
            </Card>
          ))}
        </div>
      ) : isError ? (
        <Card className="p-10 text-center rounded-2xl border-rose-200 bg-rose-50/20">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-gray-900 mb-1">Failed to load departments</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mb-4">
            Could not retrieve department data from the server. Please check your connection and try again.
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </Card>
      ) : filteredDepartments.length === 0 ? (
        <Card className="p-12 text-center rounded-2xl border border-gray-200 shadow-xs">
          <EmptyState
            title={search || statusFilter !== 'all' ? 'No Matching Departments' : 'No Departments Found'}
            description={
              search || statusFilter !== 'all'
                ? 'Try adjusting your search criteria or clearing filters to see existing specialties.'
                : 'Get started by creating your hospital’s clinical departments and medical divisions.'
            }
            actionLabel="Add Department"
            onAction={openCreateModal}
          />
        </Card>
      ) : (
        /* Responsive Card Grid: 1 col on mobile, 2 on sm, 3 on lg, 4 on 2xl */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
          {filteredDepartments.map((dept: any) => {
            const IconComponent = ICON_COMPONENTS[dept.icon] || Building2;
            return (
              <Card
                key={dept.id}
                className="bg-white rounded-2xl border border-gray-200 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between overflow-hidden"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="h-11 w-11 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 shadow-2xs shrink-0">
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <StatusBadge status={dept.isActive ? 'active' : 'inactive'} />
                  </div>

                  <h3 className="text-base font-bold text-gray-900 truncate" title={dept.name}>
                    {dept.name}
                  </h3>
                  <p
                    className="text-xs text-gray-500 line-clamp-2 mt-1.5 leading-relaxed min-h-[2.5rem]"
                    title={dept.description}
                  >
                    {dept.description || 'Specialized outpatient and inpatient clinical care.'}
                  </p>
                </div>

                {/* Footer Strip on bg-gray-50 */}
                <div className="p-3 px-4 bg-gray-50/90 rounded-b-2xl border-t border-gray-100 flex items-center justify-between">
                  <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-700">
                    <Users className="w-3.5 h-3.5 text-gray-400" />
                    <span>
                      {dept.doctorCount || 0} {dept.doctorCount === 1 ? 'doctor' : 'doctors'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <IconButton
                      icon={<Edit2 className="w-3.5 h-3.5" />}
                      variant="ghost"
                      size="sm"
                      title="Edit department"
                      aria-label="Edit department"
                      onClick={() => openEditModal(dept)}
                      className="border border-blue-200 text-blue-600 hover:bg-blue-50 shadow-2xs rounded-lg"
                    />
                    <IconButton
                      icon={dept.isActive ? <PowerOff className="w-3.5 h-3.5" /> : <Power className="w-3.5 h-3.5" />}
                      variant="ghost"
                      size="sm"
                      title={dept.isActive ? 'Deactivate department' : 'Activate department'}
                      aria-label={dept.isActive ? 'Deactivate department' : 'Activate department'}
                      onClick={() => handleToggleActive(dept)}
                      className={cn(
                        'border shadow-2xs rounded-lg',
                        dept.isActive
                          ? 'border-amber-200 text-amber-600 hover:bg-amber-50'
                          : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                      )}
                    />
                    <IconButton
                      icon={<Trash2 className="w-3.5 h-3.5" />}
                      variant="ghost"
                      size="sm"
                      title="Delete department"
                      aria-label="Delete department"
                      onClick={() =>
                        setDeletingDept({
                          id: dept.id,
                          name: dept.name,
                          doctorCount: dept.doctorCount || 0,
                        })
                      }
                      className="border border-rose-200 text-rose-600 hover:bg-rose-50 shadow-2xs rounded-lg"
                    />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Edit Clinical Department' : 'Create New Department'}
        description="Clinical specialties group medical physicians, practice divisions, and patient consultation categories."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">
              Department Name *
            </label>
            <Input
              placeholder="e.g. Cardiology, Neurology, Pediatrics"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">
              Clinical Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief overview of medical services, specialty clinics, and treatments offered..."
              className="w-full rounded-lg border border-gray-300 bg-white p-3 text-sm text-gray-900 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wider">
              Specialty Icon
            </label>
            <div className="grid grid-cols-6 sm:grid-cols-7 gap-2 p-2.5 rounded-xl border border-gray-200 bg-gray-50/60 max-h-36 overflow-y-auto">
              {AVAILABLE_ICONS.map((iconKey) => {
                const IconComp = ICON_COMPONENTS[iconKey] || Building2;
                const isSelected = icon === iconKey;
                return (
                  <button
                    key={iconKey}
                    type="button"
                    title={iconKey}
                    onClick={() => setIcon(iconKey)}
                    className={cn(
                      'h-10 w-10 rounded-lg flex items-center justify-center transition-all',
                      isSelected
                        ? 'border-2 border-teal-600 bg-teal-50 text-teal-700 shadow-2xs scale-105'
                        : 'border border-gray-200 bg-white text-gray-500 hover:text-gray-900 hover:border-gray-300'
                    )}
                  >
                    <IconComp className="w-4 h-4" />
                  </button>
                );
              })}
            </div>
          </div>

          {editingId && (
            <div className="pt-2">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded border-gray-300 text-teal-600 focus:ring-teal-500 h-4 w-4"
                />
                <span className="text-xs font-semibold text-gray-700">Active Department</span>
              </label>
              <p className="text-[11px] text-gray-400 ml-6 mt-0.5">
                Deactivated departments are hidden from patient-facing doctor directory filters.
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
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

      {/* Delete / Reassign Warning Modal */}
      {deletingDept && (
        <ConfirmModal
          isOpen={!!deletingDept}
          onClose={() => setDeletingDept(null)}
          title="Delete Department"
          description={
            deletingDept.doctorCount > 0
              ? `Cannot delete "${deletingDept.name}" because it currently has ${deletingDept.doctorCount} doctors assigned. Reassign or remove its ${deletingDept.doctorCount} doctors first, or deactivate the department instead.`
              : `Are you sure you want to permanently delete the department "${deletingDept.name}"? This action cannot be undone.`
          }
          confirmLabel={deletingDept.doctorCount > 0 ? 'Deactivate Department Instead' : 'Delete Department'}
          variant={deletingDept.doctorCount > 0 ? 'warning' : 'danger'}
          isLoading={deleteMutation.isPending || updateMutation.isPending}
          onConfirm={async () => {
            if (deletingDept.doctorCount > 0) {
              await updateMutation.mutateAsync({
                id: deletingDept.id,
                data: { isActive: false },
              });
              toast(`Department "${deletingDept.name}" deactivated instead`, 'info');
              setDeletingDept(null);
            } else {
              await confirmDelete();
            }
          }}
        />
      )}
    </div>
  );
};
