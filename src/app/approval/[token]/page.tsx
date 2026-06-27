"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/authContext";

type ApprovalDecision = "APPROVED" | "REJECTED";

interface ApprovalRequest {
  id: string;
  type: string;
  startDate: string;
  endDate?: string | null;
  description?: string | null;
  status: string;
  createdAt: string;
  requester: { name: string; nip: string; position?: string | null };
  swapWithUser?: { name: string; nip: string; position?: string | null } | null;
}

const requestLabels: Record<string, string> = {
  SHIFT_PAGI: "Shift Pagi",
  SHIFT_MIDDLE: "Shift Middle",
  SHIFT_SIANG: "Shift Siang",
  SHIFT_MALAM: "Shift Malam",
  CUTI_TAHUNAN: "Cuti Tahunan",
  CUTI_SAKIT: "Izin / Sakit",
  LIBUR: "Libur",
  TUKAR_SHIFT: "Tukar Shift",
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  });
}

export default function ApprovalLinkPage() {
  const params = useParams<{ token: string }>();
  const approvalToken = params.token;
  const { token: loginToken, user, isLoading: authLoading } = useAuth();
  const [requestData, setRequestData] = useState<ApprovalRequest | null>(null);
  const [approverRole, setApproverRole] = useState<"ADMIN" | "EMPLOYEE" | null>(null);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState<ApprovalDecision | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (authLoading || !approvalToken) return;
    const headers: HeadersInit = loginToken
      ? { Authorization: `Bearer ${loginToken}` }
      : {};

    fetch(`/api/approval-link?token=${encodeURIComponent(approvalToken)}`, { headers })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Link approval tidak dapat dibuka.");
        setRequestData(data.request);
        setApproverRole(data.approverRole);
      })
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Link approval tidak dapat dibuka."))
      .finally(() => setLoading(false));
  }, [approvalToken, authLoading, loginToken]);

  const respond = async (decision: ApprovalDecision) => {
    if (!requestData || responding) return;
    const confirmation = decision === "APPROVED"
      ? "Setujui pengajuan ini?"
      : "Tolak pengajuan ini?";
    if (!confirm(confirmation)) return;

    setResponding(decision);
    setError("");
    try {
      const response = await fetch("/api/approval-link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(loginToken ? { Authorization: `Bearer ${loginToken}` } : {}),
        },
        body: JSON.stringify({ token: approvalToken, decision }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Gagal menyimpan keputusan.");
      setRequestData((current) => current ? { ...current, status: decision } : current);
      setSuccess(decision === "APPROVED" ? "Pengajuan berhasil disetujui." : "Pengajuan berhasil ditolak.");
    } catch (responseError) {
      setError(responseError instanceof Error ? responseError.message : "Gagal menyimpan keputusan.");
    } finally {
      setResponding(null);
    }
  };

  return (
    <main className="min-h-screen bg-background px-container-margin py-8 flex items-center justify-center">
      <section className="w-full max-w-lg rounded-2xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-xl bg-primary-container text-primary flex items-center justify-center">
            <span className="material-symbols-outlined">approval</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-on-surface">Detail Pengajuan</h1>
            <p className="text-sm text-on-surface-variant">BR PharmaShift</p>
          </div>
        </div>

        {loading ? (
          <div className="h-52 rounded-xl bg-surface-container animate-pulse" />
        ) : error && !requestData ? (
          <div className="rounded-xl border border-error/20 bg-error-container p-4 text-sm text-on-error-container">
            {error}
          </div>
        ) : requestData ? (
          <>
            {user && (
              <div className="mb-4 rounded-xl bg-primary/5 px-3 py-2 text-xs text-on-surface-variant">
                Login sebagai <strong>{user.name}</strong> ({user.role === "ADMIN" ? "Admin" : "Pegawai"}).
              </div>
            )}
            <dl className="grid grid-cols-[110px_1fr] gap-x-3 gap-y-3 text-sm">
              <dt className="text-outline">Pemohon</dt>
              <dd className="font-semibold text-on-surface">{requestData.requester.name}</dd>
              <dt className="text-outline">NIP</dt>
              <dd className="text-on-surface">{requestData.requester.nip}</dd>
              <dt className="text-outline">Jenis</dt>
              <dd className="font-semibold text-on-surface">{requestLabels[requestData.type] || requestData.type}</dd>
              <dt className="text-outline">Tanggal</dt>
              <dd className="text-on-surface">
                {formatDate(requestData.startDate)}
                {requestData.endDate ? ` – ${formatDate(requestData.endDate)}` : ""}
              </dd>
              {requestData.swapWithUser && (
                <>
                  <dt className="text-outline">Tukar dengan</dt>
                  <dd className="text-on-surface">{requestData.swapWithUser.name}</dd>
                </>
              )}
              <dt className="text-outline">Keterangan</dt>
              <dd className="text-on-surface">{requestData.description || "-"}</dd>
              <dt className="text-outline">Status</dt>
              <dd className="font-bold text-primary">{requestData.status}</dd>
            </dl>

            {success && (
              <div className="mt-5 rounded-xl bg-green-50 border border-green-200 p-3 text-sm font-semibold text-green-700">
                {success}
              </div>
            )}
            {error && (
              <div className="mt-5 rounded-xl bg-error-container border border-error/20 p-3 text-sm text-on-error-container">
                {error}
              </div>
            )}

            {requestData.status === "PENDING" && !success && (
              <div className="grid grid-cols-2 gap-3 mt-6">
                <button
                  onClick={() => respond("REJECTED")}
                  disabled={Boolean(responding)}
                  className="h-12 rounded-xl border border-error/30 text-error font-bold disabled:opacity-50"
                >
                  {responding === "REJECTED" ? "Memproses..." : "Tolak"}
                </button>
                <button
                  onClick={() => respond("APPROVED")}
                  disabled={Boolean(responding)}
                  className="h-12 rounded-xl bg-primary text-on-primary font-bold disabled:opacity-50"
                >
                  {responding === "APPROVED" ? "Memproses..." : "Setujui"}
                </button>
              </div>
            )}

            <p className="text-[11px] text-outline text-center mt-5">
              Link ini khusus untuk {approverRole === "ADMIN" ? "administrator" : "pegawai tujuan"} dan tidak perlu membuka menu aplikasi.
            </p>
          </>
        ) : null}
      </section>
    </main>
  );
}
