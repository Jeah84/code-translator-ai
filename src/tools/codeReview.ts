export async function reviewCode(code: string, language: string, apiKey: string): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: 'You are an expert code reviewer. Review for bugs, security issues, performance, and style. Format with sections: Bugs, Security, Performance, Style. Be concise and actionable.',
      messages: [{ role: 'user', content: `Language: ${language}\n\n${code}` }],
    }),
  });
  const data = await response.json() as { content: { text: string }[] };
  return data.content[0].text;
}
