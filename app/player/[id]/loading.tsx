import HRLoadingAnim from "@/components/HRLoadingAnim";

export default function PlayerLoading() {
  return (
    <main className="min-h-screen bg-zinc-950 font-mono flex flex-col items-center justify-center gap-6">
      <h1 className="text-2xl font-bold tracking-tight text-zinc-100 text-center">
        loading{" "}
        <span className="underline underline-offset-4 decoration-zinc-600">player profile</span>...
      </h1>
      <HRLoadingAnim />
    </main>
  );
}
