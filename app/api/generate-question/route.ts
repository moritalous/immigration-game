import { createAmazonBedrock } from '@ai-sdk/amazon-bedrock';
import { fromNodeProviderChain } from '@aws-sdk/credential-providers';
import { generateText } from 'ai';
import { commonQuestions, officerPersonas } from '../../data/questions';

const bedrock = createAmazonBedrock({
  region: 'ap-northeast-1',
  credentialProvider: fromNodeProviderChain(),
});

export async function POST(req: Request) {
  const { usedQuestionIds = [], selectedPersona } = await req.json();

  // 未使用の質問からランダム選択
  const availableQuestions = commonQuestions.filter(q => !usedQuestionIds.includes(q.id));
  if (availableQuestions.length === 0) {
    return Response.json({ error: 'No more questions available' }, { status: 400 });
  }

  const selectedQuestion = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];

  // 選択されたペルソナを使用（指定がない場合はランダム）
  const persona = selectedPersona ? officerPersonas.find(p => p.id === selectedPersona) : officerPersonas[Math.floor(Math.random() * officerPersonas.length)];
  if (!persona) {
    return Response.json({ error: 'Invalid persona' }, { status: 400 });
  }

  const result = await generateText({
    model: bedrock('openai.gpt-oss-20b-1:0'),
    prompt: `You are STRICTLY a ${persona.tone} immigration officer. You MUST maintain this exact personality throughout.

Persona: ${persona.name} (${persona.tone})
Topic: "${selectedQuestion.topic}"
Base question: "${selectedQuestion.baseQuestion}"

IMPORTANT: You MUST create a question that is ONLY ${persona.tone}. Do NOT mix other tones.

CONTEXT: The traveler is attending AWS re:Invent conference in Las Vegas. Generate sample answers that reflect this specific scenario.

Return ONLY a JSON object:
{
  "question": "English question in STRICTLY ${persona.tone} style",
  "questionJa": "Japanese translation", 
  "sampleAnswer": "Sample English answer for AWS re:Invent attendee",
  "keywords": ${JSON.stringify(selectedQuestion.keywords)},
  "questionId": ${selectedQuestion.id},
  "persona": "${persona.id}"
}

Sample answer guidelines for AWS re:Invent context:
- Purpose: "I'm attending AWS re:Invent conference" or "Business conference"
- Duration: "5 days" or "One week" 
- Hotel: "Harrah's Hotel and Casino Las Vegas" or "MGM Grand Hotel & Casino"
- Conference: "AWS re:Invent" or "Amazon Web Services conference"
- Job: "Software engineer" or "Cloud architect" or "IT professional"
- Company: Use generic tech company names
- Money: "$2000" or "$3000" for Vegas

STRICT tone guidelines for ${persona.tone}:
${persona.tone === 'friendly and polite' ? '- Use "Could you please...", "I\'d like to know...", "Would you mind..."' : ''}
${persona.tone === 'professional and neutral' ? '- Use "What is...", "How long...", "Where will..."' : ''}
${persona.tone === 'strict and demanding' ? '- Use "I need to know...", "Tell me...", "Explain immediately..."' : ''}

You MUST use ONLY the ${persona.tone} style. Do NOT deviate.`,
  });

  try {
    const questionData = JSON.parse(result.text);
    return Response.json(questionData);
  } catch {
    return Response.json({ error: 'Failed to generate question' }, { status: 500 });
  }
}
