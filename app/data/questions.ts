// よく聞かれる質問10問
export const commonQuestions = [
  {
    id: 1,
    topic: "滞在期間",
    baseQuestion: "How long will you stay in the U.S.?",
    keywords: ["duration", "stay", "days", "weeks", "months"]
  },
  {
    id: 2,
    topic: "目的・場所",
    baseQuestion: "What is the purpose of your visit?",
    keywords: ["purpose", "business", "tourism", "visit", "vacation"]
  },
  {
    id: 3,
    topic: "カンファレンス詳細",
    baseQuestion: "What conference are you attending?",
    keywords: ["conference", "event", "meeting", "name", "purpose"]
  },
  {
    id: 4,
    topic: "ホテル",
    baseQuestion: "Where will you stay?",
    keywords: ["hotel", "accommodation", "address", "stay", "lodging"]
  },
  {
    id: 5,
    topic: "同行者",
    baseQuestion: "Are you traveling with anyone?",
    keywords: ["traveling", "group", "alone", "family", "friends"]
  },
  {
    id: 6,
    topic: "食べ物",
    baseQuestion: "Are you carrying any food items?",
    keywords: ["food", "agricultural", "products", "carrying", "bringing"]
  },
  {
    id: 7,
    topic: "所持金",
    baseQuestion: "How much money are you carrying?",
    keywords: ["money", "cash", "dollars", "funds", "currency"]
  },
  {
    id: 8,
    topic: "職業",
    baseQuestion: "What do you do for work?",
    keywords: ["job", "work", "occupation", "profession", "career"]
  },
  {
    id: 9,
    topic: "会社名",
    baseQuestion: "What company do you work for?",
    keywords: ["company", "employer", "organization", "business", "firm"]
  },
  {
    id: 10,
    topic: "連絡先情報",
    baseQuestion: "How can we contact you if needed?",
    keywords: ["contact", "phone", "email", "address", "information"]
  }
];

// 入国審査官のペルソナ
export const officerPersonas = [
  {
    id: "kind",
    name: "優しい審査官",
    description: "親切で丁寧な対応をする審査官",
    tone: "friendly and polite"
  },
  {
    id: "normal",
    name: "普通の審査官",
    description: "標準的な対応をする審査官",
    tone: "professional and neutral"
  },
  {
    id: "strict",
    name: "厳しい審査官",
    description: "厳格で詳細を求める審査官",
    tone: "strict and demanding"
  }
];
