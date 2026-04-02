import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4">
      <h1 className="text-3xl font-semibold tracking-tight">
        404 &mdash; Page Not Found
      </h1>
      <Link href="/" className="text-blue-600 underline hover:text-blue-800">
        Go back home
      </Link>
    </div>
  );
}
