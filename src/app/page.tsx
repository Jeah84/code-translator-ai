import TranslatorPanel from "@/components/translator/TranslatorPanel";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 flex flex-col items-center py-16 px-4">
      <h1 className="text-4xl font-bold mb-2 tracking-tight">
        Code Translator AI
      </h1>
      <p className="text-gray-400 mb-10 text-center max-w-lg">
        Paste your code, choose the languages, and let AI handle the rest.
      </p>
      <TranslatorPanel />
    </main>
  );
}
