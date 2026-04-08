export interface Language {
  id: string;
  name: string;
  extensions: string[];
  aliases: string[];
  compileCheck?: string;
}

export const LANGUAGES: Language[] = [
  { id: "python", name: "Python", extensions: [".py"], aliases: ["py", "python3"], compileCheck: "python3 -m py_compile" },
  { id: "typescript", name: "TypeScript", extensions: [".ts", ".tsx"], aliases: ["ts", "tsx"] },
  { id: "javascript", name: "JavaScript", extensions: [".js", ".jsx", ".mjs"], aliases: ["js", "jsx", "node"] },
  { id: "rust", name: "Rust", extensions: [".rs"], aliases: ["rs"], compileCheck: "rustc --edition 2021" },
  { id: "cpp", name: "C++", extensions: [".cpp", ".cc", ".cxx", ".hpp"], aliases: ["c++", "cxx", "cc"] },
  { id: "c", name: "C", extensions: [".c", ".h"], aliases: [], compileCheck: "gcc -fsyntax-only" },
  { id: "java", name: "Java", extensions: [".java"], aliases: [], compileCheck: "javac" },
  { id: "csharp", name: "C#", extensions: [".cs"], aliases: ["cs", "c#", "dotnet"] },
  { id: "go", name: "Go", extensions: [".go"], aliases: ["golang"], compileCheck: "go build" },
  { id: "ruby", name: "Ruby", extensions: [".rb"], aliases: ["rb"], compileCheck: "ruby -c" },
  { id: "php", name: "PHP", extensions: [".php"], aliases: [], compileCheck: "php -l" },
  { id: "swift", name: "Swift", extensions: [".swift"], aliases: [] },
  { id: "kotlin", name: "Kotlin", extensions: [".kt", ".kts"], aliases: ["kt"] },
  { id: "dart", name: "Dart", extensions: [".dart"], aliases: [] },
  { id: "r", name: "R", extensions: [".r", ".R"], aliases: [] },
  { id: "matlab", name: "MATLAB", extensions: [".m"], aliases: ["octave"] },
  { id: "scala", name: "Scala", extensions: [".scala"], aliases: [] },
  { id: "haskell", name: "Haskell", extensions: [".hs", ".lhs"], aliases: ["hs"] },
  { id: "bash", name: "Bash", extensions: [".sh", ".bash"], aliases: ["sh", "shell"], compileCheck: "bash -n" },
  { id: "sql", name: "SQL", extensions: [".sql"], aliases: [] },
  { id: "lua", name: "Lua", extensions: [".lua"], aliases: [] },
  { id: "perl", name: "Perl", extensions: [".pl", ".pm"], aliases: ["pl"], compileCheck: "perl -c" },
  { id: "elixir", name: "Elixir", extensions: [".ex", ".exs"], aliases: ["ex"] },
  { id: "clojure", name: "Clojure", extensions: [".clj", ".cljs"], aliases: ["clj"] },
  { id: "fsharp", name: "F#", extensions: [".fs", ".fsx"], aliases: ["fs", "f#"] },
  { id: "zig", name: "Zig", extensions: [".zig"], aliases: [] },
];

export function resolveLanguage(input: string): Language | undefined {
  const normalized = input.toLowerCase().trim();
  return LANGUAGES.find(
    (lang) =>
      lang.id === normalized ||
      lang.name.toLowerCase() === normalized ||
      lang.aliases.includes(normalized)
  );
}

export function getOutputExtension(lang: Language): string {
  return lang.extensions[0];
}

export function listLanguages(): void {
  console.log("\nSupported languages:\n");
  LANGUAGES.forEach((l) => {
    console.log(`  ${l.name.padEnd(15)} (${l.id})`);
  });
  console.log();
}