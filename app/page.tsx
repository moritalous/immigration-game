'use client'

import { useState, useEffect } from 'react'

// Web Speech API型定義
interface SpeechRecognitionAlternative {
  readonly transcript: string
  readonly confidence: number
}

interface SpeechRecognitionResult {
  readonly length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
}

interface SpeechRecognitionResultList {
  readonly length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionEvent extends Event {
  readonly results: SpeechRecognitionResultList
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string
}

interface SpeechRecognition extends EventTarget {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onspeechend: (() => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  start(): void
  stop(): void
}

declare global {
  interface Window {
    SpeechRecognition?: {
      new (): SpeechRecognition
    }
    webkitSpeechRecognition?: {
      new (): SpeechRecognition
    }
  }
}

// 質問データ型定義
interface Question {
  question: string
  questionJa: string
  sampleAnswer: string
  keywords: string[]
}

// 評価結果型定義
interface EvaluationResult {
  score: 'correct' | 'partial' | 'incorrect'
  message: string
}

export default function Home() {
  // ゲーム状態管理
  const [gameStarted, setGameStarted] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [questions, setQuestions] = useState<Question[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [userAnswer, setUserAnswer] = useState('')
  const [hintsShown, setHintsShown] = useState(0)
  const [status, setStatus] = useState('準備完了')
  const [result, setResult] = useState<EvaluationResult | null>(null)
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  // 音声認識初期化
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      const recognitionInstance = new SpeechRecognition()
      recognitionInstance.lang = 'en-US'
      recognitionInstance.continuous = false
      recognitionInstance.interimResults = false

      recognitionInstance.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript
        setUserAnswer(transcript)
        setStatus('回答を確認して送信してください')
      }

      recognitionInstance.onspeechend = () => {
        recognitionInstance.stop()
        setIsRecording(false)
      }

      recognitionInstance.onerror = (event: SpeechRecognitionErrorEvent) => {
        setStatus(`エラー: ${event.error}`)
        setIsRecording(false)
      }

      setRecognition(recognitionInstance)
    }
  }, [])

  // 質問生成
  const generateQuestion = async (): Promise<Question | null> => {
    try {
      setIsGenerating(true)
      const previousQuestions = questions.map(q => q.question)
      const response = await fetch('/api/generate-question', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ previousQuestions })
      })
      const data = await response.json()
      return data.error ? null : data
    } catch {
      return null
    } finally {
      setIsGenerating(false)
    }
  }

  // ゲーム開始
  const startGame = async () => {
    setGameStarted(true)
    setCurrentQuestion(0)
    setQuestions([])
    await loadQuestion(0)
  }

  // 質問読み込み
  const loadQuestion = async (questionIndex: number) => {
    setUserAnswer('')
    setHintsShown(0)
    setResult(null)
    setStatus('新しい質問を生成中...')
    
    const newQuestion = await generateQuestion()
    if (!newQuestion) {
      setStatus('質問の生成に失敗しました')
      return
    }

    setQuestions(prev => {
      const updated = [...prev]
      updated[questionIndex] = newQuestion
      return updated
    })

    setStatus('審査官の質問を聞いてください')
    
    // 音声で質問を再生
    setTimeout(() => {
      speakOfficer(newQuestion.question)
    }, 500)
  }

  // 審査官の音声再生
  const speakOfficer = (text: string) => {
    const synth = window.speechSynthesis
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'en-US'
    utterance.rate = 0.9
    utterance.pitch = 1.0
    
    utterance.onstart = () => setStatus('🔊 審査官が話しています...')
    utterance.onend = () => setStatus('🎤 あなたの番です。回答してください')
    
    synth.speak(utterance)
  }

  // ヒント表示
  const showHint = (level: number) => {
    setHintsShown(level)
    if (level === 4 && questions[currentQuestion]) {
      speakOfficer(questions[currentQuestion].sampleAnswer)
    }
  }

  // 録音トグル
  const toggleRecording = () => {
    if (!recognition) return
    
    if (!isRecording) {
      recognition.start()
      setIsRecording(true)
      setStatus('🎤 録音中...')
    } else {
      recognition.stop()
      setIsRecording(false)
    }
  }

  // 回答評価（AI使用）
  const evaluateAnswer = async (answer: string, question: Question): Promise<EvaluationResult> => {
    try {
      const response = await fetch('/api/evaluate-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: question.question,
          answer,
          keywords: question.keywords
        })
      });
      
      const evaluation = await response.json();
      return evaluation;
    } catch {
      return { 
        score: 'partial', 
        message: '評価中にエラーが発生しました。もう一度お試しください。' 
      };
    }
  };

  // 回答送信
  const submitAnswer = async () => {
    const currentQ = questions[currentQuestion]
    if (!currentQ) return
    
    setStatus('回答を評価中...')
    const evaluationResult = await evaluateAnswer(userAnswer, currentQ)
    setResult(evaluationResult)
    setStatus('評価完了')
  }

  // 次の質問へ
  const nextQuestion = async () => {
    if (currentQuestion + 1 >= 5) {
      setGameStarted(false)
      setCurrentQuestion(0)
    } else {
      setCurrentQuestion(currentQuestion + 1)
      await loadQuestion(currentQuestion + 1)
    }
  }

  // スタート画面
  if (!gameStarted) {
    return (
      <div className="container">
        <div className="header">
          <h1>🛂 入国審査トレーニングゲーム</h1>
          <p>Immigration Officer Training Simulator</p>
        </div>
        <div className="game-area">
          {currentQuestion === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <p style={{ fontSize: '18px', marginBottom: '30px' }}>
                入国審査官との会話をシミュレーションします。<br />
                AIが生成する質問に英語で回答してください。
              </p>
              <button className="start-btn" onClick={startGame} disabled={isGenerating}>
                {isGenerating ? '準備中...' : 'ゲーム開始'}
              </button>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <h2 style={{ fontSize: '32px', marginBottom: '20px' }}>🎉 お疲れ様でした！</h2>
              <p style={{ fontSize: '18px', marginBottom: '30px' }}>
                全ての質問が完了しました。<br />
                実際の入国審査でも自信を持って答えられますね！
              </p>
              <button className="start-btn" onClick={() => window.location.reload()}>もう一度プレイ</button>
            </div>
          )}
        </div>
      </div>
    )
  }

  const currentQ = questions[currentQuestion]
  if (!currentQ) {
    return (
      <div className="container">
        <div className="header">
          <h1>🛂 入国審査トレーニングゲーム</h1>
          <p>Immigration Officer Training Simulator</p>
        </div>
        <div className="game-area">
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p>質問を生成中...</p>
          </div>
        </div>
      </div>
    )
  }

  // ゲーム画面
  return (
    <div className="container">
      <div className="header">
        <h1>🛂 入国審査トレーニングゲーム</h1>
        <p>Immigration Officer Training Simulator</p>
      </div>
      <div className="game-area">
        <div className="progress">
          <span>質問 {currentQuestion + 1} / 5</span>
        </div>

        <div className="officer-section">
          <div className="officer-avatar">👮</div>
          
          <div className="hints">
            <button className="hint-btn" onClick={() => showHint(1)}>ヒント1: 英文表示</button>
            <button className="hint-btn" onClick={() => showHint(2)} disabled={hintsShown < 1}>ヒント2: 日本語訳</button>
            <button className="hint-btn" onClick={() => showHint(3)} disabled={hintsShown < 2}>ヒント3: 模範解答</button>
            <button className="hint-btn" onClick={() => showHint(4)} disabled={hintsShown < 3}>ヒント4: 音声再生</button>
          </div>
          
          {hintsShown >= 1 && (
            <div className="hint-content">
              <strong>英文:</strong> {currentQ.question}
            </div>
          )}
          {hintsShown >= 2 && (
            <div className="hint-content">
              <strong>日本語:</strong> {currentQ.questionJa}
            </div>
          )}
          {hintsShown >= 3 && (
            <div className="hint-content">
              <strong>模範解答:</strong> {currentQ.sampleAnswer}
            </div>
          )}
        </div>

        <div className="user-section">
          <div className="status">{status}</div>
          
          <div className="controls">
            <button 
              className={`record-btn ${isRecording ? 'recording' : ''}`}
              onClick={toggleRecording}
            >
              {isRecording ? '⏹ 録音停止' : '🎤 回答を録音'}
            </button>
            <button 
              className="submit-btn" 
              onClick={submitAnswer}
              disabled={!userAnswer}
            >
              ✓ 回答を送信
            </button>
          </div>
          
          <div className="user-answer">
            {userAnswer || 'あなたの回答がここに表示されます'}
          </div>
        </div>

        {result && (
          <div className={`result ${result.score}`}>
            <div style={{ fontSize: '48px', marginBottom: '10px' }}>
              {result.score === 'correct' ? '⭕' : result.score === 'partial' ? '△' : '❌'}
            </div>
            <div>{result.message}</div>
            <div style={{ marginTop: '20px' }}>
              <button className="start-btn" onClick={nextQuestion}>次の質問へ</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
