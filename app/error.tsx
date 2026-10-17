"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="state-page">
      <h1>Something went off the path</h1>
      <p>That didn’t work. Please try again in a moment.</p>
      <button className="btn primary" onClick={reset}>Try again</button>
    </main>
  );
}
