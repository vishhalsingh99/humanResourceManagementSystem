import { Link } from 'react-router-dom';

export default function Signup() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f4f6fa] px-6 py-16">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-200/60">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-xl font-semibold text-white">HR</div>
        <h2 className="mt-6 text-2xl font-semibold text-slate-950">Account creation is disabled</h2>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          This workspace is configured for one company. New accounts are created by the company administrator.
        </p>
        <Link to="/login" className="mt-7 inline-flex rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700">
          Return to sign in
        </Link>
      </div>
    </div>
  );
}
