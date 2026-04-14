export interface RegexResult {
  matches: string[];
  count: number;
  groups: Record<string, string>[];
  error?: string;
}

export function testRegex(pattern: string, flags: string, input: string): RegexResult {
  try {
    const regex = new RegExp(pattern, flags);
    const matches: string[] = [];
    const groups: Record<string, string>[] = [];
    let match;
    const globalRegex = new RegExp(pattern, flags.includes('g') ? flags : flags + 'g');
    while ((match = globalRegex.exec(input)) !== null) {
      matches.push(match[0]);
      if (match.groups) groups.push(match.groups);
      if (!flags.includes('g')) break;
    }
    return { matches, count: matches.length, groups };
  } catch (e) {
    return { matches: [], count: 0, groups: [], error: (e as Error).message };
  }
}
