import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import { createRole, deleteRole, getPermissions, getRoles, updateRole } from '../../api/rolesApi';
import { useApp } from '../../context/AppContext';
import DeleteConfirmationModal from '../../components/ui/DeleteConfirmationModal';

const emptyForm = {
  id: null,
  name: '',
  description: '',
  permissions: [],
};

const groupPermissions = (permissions = []) => permissions.reduce((groups, permission) => {
  const moduleName = permission.module || 'Other';
  if (!groups[moduleName]) groups[moduleName] = [];
  groups[moduleName].push(permission);
  return groups;
}, {});

export default function RolesPermissions() {
  const { showToast, hasPermission } = useApp();
  const canEditRoles = hasPermission('settings.edit');
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const permissionsByModule = useMemo(() => groupPermissions(permissions), [permissions]);

  const loadPage = useCallback(async () => {
    setLoading(true);
    try {
      const [rolesResponse, permissionsResponse] = await Promise.all([
        getRoles(),
        getPermissions(),
      ]);
      setRoles(rolesResponse.data || []);
      setPermissions(permissionsResponse.data || []);
    } catch (error) {
      showToast(error.response?.data?.error || 'Unable to load roles and permissions', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadPage();
  }, [loadPage]);

  const openCreate = () => {
    if (!canEditRoles) return;
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEdit = (role) => {
    if (!canEditRoles) return;
    setForm({
      id: role.id,
      name: role.name || '',
      description: role.description || '',
      permissions: role.permissions || [],
    });
    setFormOpen(true);
  };

  const togglePermission = (permissionKey) => {
    if (!canEditRoles) return;
    setForm((current) => ({
      ...current,
      permissions: current.permissions.includes(permissionKey)
        ? current.permissions.filter((key) => key !== permissionKey)
        : [...current.permissions, permissionKey],
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canEditRoles) return;
    const name = form.name.trim();
    if (!name) {
      showToast('Role name is required', 'error');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name,
        description: form.description.trim(),
        permissions: form.permissions,
      };
      if (form.id) await updateRole(form.id, payload);
      else await createRole(payload);
      setFormOpen(false);
      setForm(emptyForm);
      await loadPage();
      showToast(form.id ? 'Role updated' : 'Role created', 'success');
    } catch (error) {
      showToast(error.response?.data?.error || 'Unable to save role', 'error');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    if (!canEditRoles) return;
    try {
      await deleteRole(deleteTarget.id);
      setDeleteTarget(null);
      await loadPage();
      showToast('Role deleted', 'success');
    } catch (error) {
      showToast(error.response?.data?.error || 'Unable to delete role', 'error');
    }
  };

  return (
    <div className="p-4 sm:p-6 mt-18 lg:p-10">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Roles & Permissions</h1>
          <p className="text-slate-600">Manage company roles and the permissions inherited by employees.</p>
        </div>
        {canEditRoles && (
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <Plus size={18} />
            Create Role
          </button>
        )}
      </div>

      <div className="overflow-hidden rounded border border-slate-200 bg-white shadow-sm">
        <div className="grid grid-cols-[1.2fr_1.5fr_.7fr_.7fr_120px] gap-4 border-b border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
          <span>Role Name</span>
          <span>Description</span>
          <span>Users</span>
          <span>Status</span>
          <span>Actions</span>
        </div>

        {loading && <p className="px-4 py-6 text-sm text-slate-500">Loading roles...</p>}
        {!loading && !roles.length && <p className="px-4 py-6 text-sm text-slate-500">No roles available.</p>}
        {!loading && roles.map((role) => (
          <div key={role.id} className="grid grid-cols-[1.2fr_1.5fr_.7fr_.7fr_120px] gap-4 border-b border-slate-100 px-4 py-4 text-sm text-slate-700 last:border-b-0">
            <span className="font-semibold text-slate-900">{role.name}</span>
            <span>{role.description || '-'}</span>
            <span>{role.userCount || 0} users</span>
            <span>{role.isSystem ? 'Protected' : 'Active'}</span>
            <span className="flex gap-2">
              <button type="button" disabled={!canEditRoles || role.isSystem} onClick={() => openEdit(role)} className="rounded border border-slate-300 p-2 text-slate-700 disabled:cursor-not-allowed disabled:opacity-40" title="Edit role">
                <Pencil size={16} />
              </button>
              <button type="button" disabled={!canEditRoles || role.isSystem} onClick={() => setDeleteTarget(role)} className="rounded border border-red-200 p-2 text-red-600 disabled:cursor-not-allowed disabled:opacity-40" title="Delete role">
                <Trash2 size={16} />
              </button>
            </span>
          </div>
        ))}
      </div>

      {formOpen && (
        <div className="fixed inset-0 z-80 flex items-center justify-center bg-black/40 p-4">
          <form onSubmit={handleSubmit} className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-semibold text-slate-900">{form.id ? 'Edit Role' : 'Create Role'}</h2>
              <button type="button" onClick={() => setFormOpen(false)} className="rounded border border-slate-300 p-2 text-slate-700">
                <X size={18} />
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-800">Role Name *</label>
                <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="w-full rounded border border-slate-300 px-3 py-3 text-sm outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-800">Description</label>
                <input value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="w-full rounded border border-slate-300 px-3 py-3 text-sm outline-none focus:border-blue-500" />
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <button type="button" onClick={() => setForm({ ...form, permissions: permissions.map((permission) => permission.permissionKey) })} className="rounded border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700">Select All</button>
              <button type="button" onClick={() => setForm({ ...form, permissions: [] })} className="rounded border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700">Clear All</button>
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              {Object.entries(permissionsByModule).map(([moduleName, modulePermissions]) => (
                <section key={moduleName} className="rounded border border-slate-200 p-4">
                  <h3 className="font-semibold text-slate-900">{moduleName} Management</h3>
                  <div className="mt-3 grid gap-2">
                    {modulePermissions.map((permission) => (
                      <label key={permission.permissionKey} className="flex items-center gap-3 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={form.permissions.includes(permission.permissionKey)}
                          onChange={() => togglePermission(permission.permissionKey)}
                          className="h-4 w-4"
                        />
                        <span>{permission.description || permission.permissionKey}</span>
                      </label>
                    ))}
                  </div>
                </section>
              ))}
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 pt-5">
              <button type="button" onClick={() => setFormOpen(false)} className="rounded border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700">Cancel</button>
              <button type="submit" disabled={saving} className="rounded bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:bg-slate-300">
                {saving ? 'Saving...' : form.id ? 'Save Role' : 'Create Role'}
              </button>
            </div>
          </form>
        </div>
      )}

      {deleteTarget && (
        <DeleteConfirmationModal
          title={`Delete ${deleteTarget.name}?`}
          message={`This role is currently assigned to ${deleteTarget.userCount || 0} employees. Assigned roles cannot be deleted.`}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}
