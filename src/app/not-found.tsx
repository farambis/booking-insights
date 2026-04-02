import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
      <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
        Not yet built
      </h1>
      <p className="mt-2 max-w-md text-neutral-500">
        This page doesn&apos;t exist yet. Northscope is under active
        development.
      </p>
      <Link
        href="/"
        className="bg-brand hover:bg-brand-dim mt-6 rounded-lg px-5 py-2.5 text-sm font-medium text-white transition-colors"
      >
        Go to Dashboard
      </Link>
    </div>
  );
}
