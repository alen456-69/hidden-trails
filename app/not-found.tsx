import Link from "next/link";

export default function NotFound() {
  return (
    <main className="state-page">
      <h1>This trail doesn’t exist</h1>
      <p>The page you’re looking for has moved, or it was never on the map.</p>
      <Link className="btn primary" href="/">Back to exploring</Link>
    </main>
  );
}
