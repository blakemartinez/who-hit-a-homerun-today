import { Suspense } from "react";
import HRLoadingAnim from "@/components/HRLoadingAnim";
import LoadingTitle from "@/components/LoadingTitle";

function DefaultTitle() {
  return (
    <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
      who hit a homerun{" "}
      <span className="underline underline-offset-4 decoration-zinc-600">today</span>?
    </h1>
  );
}

export default function Loading() {
  return (
    <main className="min-h-screen bg-zinc-950 font-mono flex flex-col items-center justify-center gap-6">
      <Suspense fallback={<DefaultTitle />}>
        <LoadingTitle />
      </Suspense>
      <HRLoadingAnim />
    </main>
  );
}
