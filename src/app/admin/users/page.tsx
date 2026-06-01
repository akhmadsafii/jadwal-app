"use client";

import { useEffect, useMemo, useState } from "react";
import AdminTopBar from "@/components/admin/AdminTopBar";
import AdminBottomNav from "@/components/admin/AdminBottomNav";

type Role = "ADMIN" | "EMPLOYEE";
type RoleFilter = "ALL" | Role;

interface UserItem {
  id: string;
  nip: string;
  name: string;
  email?: string | null;
  role: Role;
  position?: string | null;
  avatarUrl?: string | null;
  isActive: boolean;
}

interface UserFormState {
  id?: string;
  nip: string;
  name: string;
  email: string;
  role: Role;
  position: string;
  avatarUrl: string;
  isActive: boolean;
  password: string;
}

const emptyForm: UserFormState = {
  nip: "",
  name: "",
  email: "",
  role: "EMPLOYEE",
  position: "",
  avatarUrl: "",
  isActive: true,
  password: "",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("ALL");
  const [form, setForm] = useState<UserFormState>(emptyForm);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  const filteredUsers = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return users.filter((user) => {
      const roleMatches = roleFilter === "ALL" || user.role === roleFilter;
      const searchMatches =
        !keyword ||
        user.name.toLowerCase().includes(keyword) ||
        user.nip.toLowerCase().includes(keyword) ||
        (user.position || "").toLowerCase().includes(keyword);
      return roleMatches && searchMatches;
    });
  }, [users, search, roleFilter]);

  const stats = useMemo(() => {
    return users.reduce(
      (acc, user) => {
        acc.total += 1;
        if (user.role === "EMPLOYEE") acc.employee += 1;
        if (user.role === "ADMIN") acc.admin += 1;
        if (!user.isActive) acc.inactive += 1;
        return acc;
      },
      { total: 0, employee: 0, admin: 0, inactive: 0 }
    );
  }, [users]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/users");
      if (!response.ok) return;
      const data = await response.json();
      setUsers(data.users || []);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openCreateForm = () => {
    setForm(emptyForm);
    setMessage("");
    setIsFormOpen(true);
  };

  const openEditForm = (user: UserItem) => {
    setForm({
      id: user.id,
      nip: user.nip,
      name: user.name,
      email: user.email || "",
      role: user.role,
      position: user.position || "",
      avatarUrl: user.avatarUrl || "",
      isActive: user.isActive,
      password: "",
    });
    setMessage("");
    setIsFormOpen(true);
  };

  const saveUser = async () => {
    setIsSaving(true);
    setMessage("");

    const payload = {
      nip: form.nip.trim(),
      name: form.name.trim(),
      email: form.email.trim(),
      role: form.role,
      position: form.position.trim(),
      avatarUrl: form.avatarUrl.trim(),
      isActive: form.isActive,
      password: form.password.trim() || undefined,
    };

    try {
      const response = await fetch(form.id ? `/api/users/${form.id}` : "/api/users", {
        method: form.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || "User gagal disimpan");
        return;
      }

      await fetchUsers();
      setIsFormOpen(false);
    } catch {
      setMessage("Terjadi kesalahan koneksi");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleActive = async (user: UserItem) => {
    const response = await fetch(`/api/users/${user.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...user,
        isActive: !user.isActive,
      }),
    });

    if (response.ok) {
      setUsers((prev) =>
        prev.map((item) => item.id === user.id ? { ...item, isActive: !user.isActive } : item)
      );
    }
  };

  return (
    <div className="min-h-screen pb-[132px] bg-background">
      <AdminTopBar />

      <main className="px-container-margin py-4 space-y-4 max-w-4xl mx-auto">
        <section className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-outline">Admin</p>
            <h1 className="text-2xl font-bold text-on-surface">Manage Users</h1>
            <p className="text-sm text-on-surface-variant mt-1">Tambah, edit, dan aktifkan user aplikasi.</p>
          </div>
          <button
            type="button"
            onClick={openCreateForm}
            className="h-11 px-4 rounded-xl bg-primary text-on-primary flex items-center gap-2 text-sm font-bold active:scale-[0.98] transition-transform"
          >
            <span className="material-symbols-outlined text-[20px]">person_add</span>
            Tambah
          </button>
        </section>

        <section className="grid grid-cols-4 gap-2">
          <div className="rounded-xl bg-surface-container-lowest border border-outline-variant p-3 text-center">
            <p className="text-lg font-bold text-primary">{stats.total}</p>
            <p className="text-[10px] text-outline">Total</p>
          </div>
          <div className="rounded-xl bg-surface-container-lowest border border-outline-variant p-3 text-center">
            <p className="text-lg font-bold text-secondary">{stats.employee}</p>
            <p className="text-[10px] text-outline">Pegawai</p>
          </div>
          <div className="rounded-xl bg-surface-container-lowest border border-outline-variant p-3 text-center">
            <p className="text-lg font-bold text-tertiary">{stats.admin}</p>
            <p className="text-[10px] text-outline">Admin</p>
          </div>
          <div className="rounded-xl bg-surface-container-lowest border border-outline-variant p-3 text-center">
            <p className="text-lg font-bold text-error">{stats.inactive}</p>
            <p className="text-[10px] text-outline">Nonaktif</p>
          </div>
        </section>

        <section className="rounded-xl bg-surface-container-lowest border border-outline-variant p-3 space-y-3">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[20px] text-outline">search</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari nama, NIP, atau posisi"
              className="w-full h-11 rounded-lg border border-outline-variant bg-surface pl-10 pr-3 text-sm outline-none focus:border-primary"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto hide-scrollbar">
            {(["ALL", "EMPLOYEE", "ADMIN"] as RoleFilter[]).map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => setRoleFilter(role)}
                className={`h-9 flex-none rounded-full px-4 text-xs font-bold ${
                  roleFilter === role ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant"
                }`}
              >
                {role === "ALL" ? "Semua" : role === "EMPLOYEE" ? "Pegawai" : "Admin"}
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-2">
          {isLoading ? (
            Array.from({ length: 5 }, (_, index) => (
              <div key={index} className="h-[86px] rounded-xl bg-surface-container animate-pulse" />
            ))
          ) : filteredUsers.length === 0 ? (
            <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-8 text-center text-sm text-outline">
              Tidak ada user yang cocok.
            </div>
          ) : (
            filteredUsers.map((user) => (
              <article
                key={user.id}
                className={`rounded-xl border p-3 flex items-center gap-3 ${
                  user.isActive ? "bg-surface-container-lowest border-outline-variant" : "bg-surface-container border-outline-variant opacity-70"
                }`}
              >
                <div className="w-11 h-11 rounded-full overflow-hidden bg-primary-container flex-shrink-0">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="material-symbols-outlined text-primary flex items-center justify-center h-full">person</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-on-surface truncate">{user.name}</h2>
                    <span className={`flex-none rounded px-2 py-0.5 text-[10px] font-bold ${
                      user.role === "ADMIN" ? "bg-primary-container text-on-primary-container" : "bg-secondary-container text-on-secondary-container"
                    }`}>
                      {user.role === "ADMIN" ? "ADMIN" : "PEGAWAI"}
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant truncate">{user.position || "-"}</p>
                  <p className="text-[10px] text-outline">NIP. {user.nip}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => toggleActive(user)}
                    className={`w-9 h-9 rounded-full flex items-center justify-center ${
                      user.isActive ? "bg-green-100 text-green-700" : "bg-error-container text-on-error-container"
                    }`}
                    aria-label={user.isActive ? "Nonaktifkan user" : "Aktifkan user"}
                  >
                    <span className="material-symbols-outlined text-[20px]">{user.isActive ? "toggle_on" : "toggle_off"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => openEditForm(user)}
                    className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant"
                    aria-label="Edit user"
                  >
                    <span className="material-symbols-outlined text-[20px]">edit</span>
                  </button>
                </div>
              </article>
            ))
          )}
        </section>
      </main>

      {isFormOpen && (
        <div className="fixed inset-0 z-[100] bg-black/40 flex items-end sm:items-center justify-center">
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            onClick={() => setIsFormOpen(false)}
            aria-label="Tutup form"
          />
          <section className="relative w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl bg-surface-container-lowest border border-outline-variant p-4 shadow-xl">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-outline">{form.id ? "Edit User" : "User Baru"}</p>
                <h2 className="text-lg font-bold text-on-surface">{form.id ? form.name : "Tambah User"}</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center"
                aria-label="Tutup"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {message && (
              <div className="mb-3 rounded-lg bg-error-container border border-error/20 p-3 text-sm text-on-error-container">
                {message}
              </div>
            )}

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-[10px] uppercase text-on-surface-variant">NIP / Username</span>
                  <input value={form.nip} onChange={(e) => setForm({ ...form, nip: e.target.value })} className="mt-1 w-full h-10 rounded-lg border border-outline-variant bg-surface px-3 text-sm outline-none focus:border-primary" />
                </label>
                <label className="block">
                  <span className="text-[10px] uppercase text-on-surface-variant">Role</span>
                  <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })} className="mt-1 w-full h-10 rounded-lg border border-outline-variant bg-surface px-3 text-sm outline-none focus:border-primary">
                    <option value="EMPLOYEE">Pegawai</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </label>
              </div>

              <label className="block">
                <span className="text-[10px] uppercase text-on-surface-variant">Nama</span>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 w-full h-10 rounded-lg border border-outline-variant bg-surface px-3 text-sm outline-none focus:border-primary" />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-[10px] uppercase text-on-surface-variant">Email</span>
                  <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1 w-full h-10 rounded-lg border border-outline-variant bg-surface px-3 text-sm outline-none focus:border-primary" />
                </label>
                <label className="block">
                  <span className="text-[10px] uppercase text-on-surface-variant">Posisi</span>
                  <input value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} className="mt-1 w-full h-10 rounded-lg border border-outline-variant bg-surface px-3 text-sm outline-none focus:border-primary" />
                </label>
              </div>

              <label className="block">
                <span className="text-[10px] uppercase text-on-surface-variant">Avatar URL</span>
                <input value={form.avatarUrl} onChange={(e) => setForm({ ...form, avatarUrl: e.target.value })} className="mt-1 w-full h-10 rounded-lg border border-outline-variant bg-surface px-3 text-sm outline-none focus:border-primary" />
              </label>

              <label className="block">
                <span className="text-[10px] uppercase text-on-surface-variant">
                  Password {form.id ? "baru (opsional)" : "awal"}
                </span>
                <input
                  type="text"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder={form.id ? "Kosongkan jika tidak diganti" : "Default: 12345678"}
                  className="mt-1 w-full h-10 rounded-lg border border-outline-variant bg-surface px-3 text-sm outline-none focus:border-primary"
                />
              </label>

              <label className="flex items-center justify-between rounded-lg border border-outline-variant bg-surface p-3">
                <span className="text-sm font-medium text-on-surface">User aktif</span>
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="h-5 w-5" />
              </label>

              <button
                type="button"
                onClick={saveUser}
                disabled={isSaving}
                className="w-full h-12 rounded-xl bg-primary text-on-primary font-bold active:scale-[0.98] transition-transform disabled:opacity-60"
              >
                {isSaving ? "Menyimpan..." : "Simpan User"}
              </button>
            </div>
          </section>
        </div>
      )}

      <AdminBottomNav />
    </div>
  );
}
