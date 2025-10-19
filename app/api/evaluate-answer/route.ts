import { createAmazonBedrock } from '@ai-sdk/amazon-bedrock';
import { fromNodeProviderChain } from '@aws-sdk/credential-providers';
import { generateText } from 'ai';

const bedrock = createAmazonBedrock({
  region: 'ap-northeast-1',
  credentialProvider: fromNodeProviderChain(),
});

export async function POST(req: Request) {
  const { question, answer, keywords } = await req.json();

  const result = await generateText({
    model: bedrock('openai.gpt-oss-20b-1:0'),
    prompt: `You are an immigration officer evaluating English conversation practice. Be GENEROUS in your scoring.

Question: "${question}"
User's answer: "${answer}"
Expected keywords: ${keywords.join(', ')}

Evaluate the answer and return ONLY a JSON object:
{
  "score": "correct|partial|incorrect",
  "message": "Encouraging feedback in Japanese mentioning what they said"
}

Scoring criteria (BE GENEROUS):
- correct: Any reasonable attempt to answer the question, even short answers like "Yes", "No", "Tourism", "One week", etc. Give correct unless it's clearly wrong.
- partial: Somewhat related but unclear
- incorrect: ONLY for completely wrong answers (e.g. answering "5 days" to "What is your purpose?" or nonsensical responses)

Prioritize encouragement. Most answers should be "correct" unless obviously wrong.`,
  });

  try {
    const evaluation = JSON.parse(result.text);
    return Response.json(evaluation);
  } catch {
    return Response.json({ 
      score: 'correct', 
      message: '回答ありがとうございます！' 
    });
  }
}
