import { Link } from 'react-router-dom';

export default function Signup() {
  return (
    <div className="flex min-h-screen items-center justify-center t-page px-6 py-16">
      <div className="w-full max-w-md rounded-2xl ui-card p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500 text-xl font-semibold text-white">HR</div>
        <h2 className="mt-6 text-2xl font-semibold t-text-heading">Account creation is disabled</h2>
        <p className="mt-3 text-sm leading-6 t-text-muted">
          This workspace is configured for one company. New accounts are created by the company administrator.
        </p>
        <Link to="/login" className="mt-7 inline-flex rounded-xl bg-red-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-400">
          Return to sign in
        </Link>
      </div>
    </div>
  );
}
