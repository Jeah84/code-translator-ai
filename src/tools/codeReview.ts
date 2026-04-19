export async function reviewCode(code: string, language: string, apiKey: string): Promise<string> {
  const response = await fetch('https://api.together.xyz/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
      max_tokens: 1000,
      messages: [
        {
          role: 'system',
          content: 'You are an expert code reviewer. Review for bugs, security issues, performance, and style. Format with sections: Bugs, Security, Performance, Style. Be concise and actionable.'
        },
        { role: 'user', content: `Language: ${language}\n\n${code}` }
      ],
    }),
  });
  const data = await response.json() as { choices?: { message: { content: string } }[]; error?: { message: string } };
  if (data.error) throw new Error(data.error.message);
  if (!data.choices || !data.choices[0]) throw new Error('Empty response from API');
  return data.choices[0].message.content;
}
