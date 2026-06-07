import { useEffect, useMemo, useRef, useState } from 'react'
import HanziWriter from 'hanzi-writer'
import {
  ArrowLeft,
  BookOpen,
  Brush,
  ChevronLeft,
  Gamepad2,
  Lock,
  Play,
  RotateCcw,
  Star,
  Trophy,
  Volume2,
} from 'lucide-react'
import './App.css'

type Screen = 'home' | 'map' | 'practice'

type Lesson = {
  id: string
  title: string
  island: string
  icon: string
  unlocked: boolean
  characters: string[]
}

type WordInfo = {
  pinyin: string
  jyutping: string
  meaning: string
  hint: string
}

const lessons: Lesson[] = [
  {
    id: 'nature-one',
    title: '自然島',
    island: 'starter',
    icon: '🌳',
    unlocked: true,
    characters: ['人', '口', '日', '月', '山', '水'],
  },
  {
    id: 'body-one',
    title: '身體島',
    island: 'body',
    icon: '😊',
    unlocked: true,
    characters: ['手', '心', '目', '耳', '足', '女'],
  },
  {
    id: 'animal-one',
    title: '動物島',
    island: 'animal',
    icon: '🐼',
    unlocked: false,
    characters: ['牛', '羊', '馬', '鳥', '魚', '犬'],
  },
]

const wordInfo: Record<string, WordInfo> = {
  人: { pinyin: 'rén', jyutping: 'jan4', meaning: 'person', hint: '第一筆，向左！' },
  口: { pinyin: 'kǒu', jyutping: 'hau2', meaning: 'mouth', hint: '先寫左邊直線。' },
  日: { pinyin: 'rì', jyutping: 'jat6', meaning: 'sun; day', hint: '像小窗戶一樣慢慢寫。' },
  月: { pinyin: 'yuè', jyutping: 'jyut6', meaning: 'moon', hint: '左邊彎彎，再補裡面。' },
  山: { pinyin: 'shān', jyutping: 'saan1', meaning: 'mountain', hint: '中間高高像山峰。' },
  水: { pinyin: 'shuǐ', jyutping: 'seoi2', meaning: 'water', hint: '先中間，再兩邊水花。' },
  手: { pinyin: 'shǒu', jyutping: 'sau2', meaning: 'hand', hint: '短橫、長橫，再一撇一勾。' },
  心: { pinyin: 'xīn', jyutping: 'sam1', meaning: 'heart', hint: '小點點要排好。' },
  目: { pinyin: 'mù', jyutping: 'muk6', meaning: 'eye', hint: '外框方正，裡面兩橫。' },
  耳: { pinyin: 'ěr', jyutping: 'ji5', meaning: 'ear', hint: '橫線要像梯子。' },
  足: { pinyin: 'zú', jyutping: 'zuk1', meaning: 'foot', hint: '上面小口，下面站穩。' },
  女: { pinyin: 'nǚ', jyutping: 'neoi5', meaning: 'female', hint: '先撇點，再長橫。' },
  牛: { pinyin: 'niú', jyutping: 'ngau4', meaning: 'cow', hint: '像牛角和身體。' },
  羊: { pinyin: 'yáng', jyutping: 'joeng4', meaning: 'sheep', hint: '上面兩點像小角。' },
  馬: { pinyin: 'mǎ', jyutping: 'maa5', meaning: 'horse', hint: '慢慢跟着筆順跑。' },
  鳥: { pinyin: 'niǎo', jyutping: 'niu5', meaning: 'bird', hint: '先頭，再身體和尾巴。' },
  魚: { pinyin: 'yú', jyutping: 'jyu4', meaning: 'fish', hint: '魚身寬寬，下面四點。' },
  犬: { pinyin: 'quǎn', jyutping: 'hyun2', meaning: 'dog', hint: '大字加一點。' },
}

const learningPath = [
  { character: '人', x: 23, y: 72, unlocked: true },
  { character: '口', x: 43, y: 57, unlocked: true },
  { character: '日', x: 31, y: 37, unlocked: true },
  { character: '手', x: 61, y: 33, unlocked: true },
  { character: '月', x: 72, y: 53, unlocked: false },
  { character: '山', x: 63, y: 76, unlocked: false },
]

function getCuhkSoundUrl(jyutping: string) {
  return `/api/cuhk-sound?s=${encodeURIComponent(jyutping)}`
}

function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [activeLesson, setActiveLesson] = useState(lessons[0])
  const [activeIndex, setActiveIndex] = useState(0)
  const [status, setStatus] = useState('跟着灰色筆劃，用手指或滑鼠描一描。')
  const [stars, setStars] = useState(1)
  const [completed, setCompleted] = useState(0)
  const [mistakes, setMistakes] = useState(0)
  const [audioUrl, setAudioUrl] = useState<{ jyutping: string; url: string } | null>(null)
  const [resetCount, setResetCount] = useState(0)
  const writerRef = useRef<HanziWriter | null>(null)
  const writerHostRef = useRef<HTMLDivElement | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const activeCharacter = activeLesson.characters[activeIndex] ?? activeLesson.characters[0]
  const info = wordInfo[activeCharacter]
  const progress = Math.round(((activeIndex + completed / 6) / activeLesson.characters.length) * 100)

  const practiceCharacters = useMemo(
    () => activeLesson.characters.map((character, index) => ({ character, done: index < activeIndex })),
    [activeIndex, activeLesson],
  )

  useEffect(() => {
    let isCancelled = false
    let objectUrl = ''
    const jyutping = info.jyutping

    fetch(getCuhkSoundUrl(info.jyutping))
      .then((response) => {
        if (!response.ok) throw new Error('Audio unavailable')
        return response.blob()
      })
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob)
        if (!isCancelled) setAudioUrl({ jyutping, url: objectUrl })
      })
      .catch(() => undefined)

    return () => {
      isCancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [info.jyutping])

  useEffect(() => {
    if (screen !== 'practice') return
    const host = writerHostRef.current
    if (!host) return

    host.innerHTML = ''
    setCompleted(0)
    setMistakes(0)
    setStatus(info.hint)

    const size = Math.min(Math.max(host.clientWidth, 260), 480)
    const writer = HanziWriter.create(host, activeCharacter, {
      width: size,
      height: size,
      padding: 20,
      showOutline: true,
      showCharacter: false,
      strokeAnimationSpeed: 1.05,
      delayBetweenStrokes: 130,
      drawingWidth: 32,
      strokeColor: '#6c6c6c',
      outlineColor: '#b7b7b7',
      radicalColor: '#55b636',
      drawingColor: '#23321f',
      highlightColor: '#72d44d',
    })

    writerRef.current = writer
    writer
      .quiz({
        leniency: 1.25,
        showHintAfterMisses: 2,
        highlightOnComplete: true,
        onCorrectStroke: (data) => {
          setCompleted(data.strokeNum + 1)
          setStatus(data.strokesRemaining === 0 ? 'PING! 棒極了！' : '好棒，下一筆。')
        },
        onMistake: (data) => {
          setMistakes(data.totalMistakes)
          setStatus('再試一次，留意起筆和方向。')
        },
        onComplete: () => {
          setStars((count) => Math.min(count + 1, 5))
          setStatus('完成！可以按下一個。')
        },
      })
      .catch(() => setStatus('這個字暫時未能載入筆順，請試下一個。'))

    return () => {
      writer.cancelQuiz()
    }
  }, [activeCharacter, info.hint, resetCount, screen])

  function openLesson(lesson: Lesson, character = lesson.characters[0]) {
    if (!lesson.unlocked) return
    setActiveLesson(lesson)
    setActiveIndex(Math.max(0, lesson.characters.indexOf(character)))
    setScreen('practice')
  }

  function replayQuiz() {
    setResetCount((count) => count + 1)
  }

  function showDemo() {
    setStatus('先看筆順，再一起寫。')
    writerRef.current?.cancelQuiz()
    writerRef.current?.hideCharacter({ duration: 120 })
    writerRef.current?.animateCharacter()
  }

  function playAudio() {
    if (!audioUrl || audioUrl.jyutping !== info.jyutping || !audioRef.current) {
      setStatus('讀音載入中，請稍等一下。')
      return
    }

    audioRef.current.src = audioUrl.url
    audioRef.current.currentTime = 0
    audioRef.current.play().catch(() => setStatus('未能播放讀音，請稍後再試。'))
  }

  function nextCharacter() {
    setActiveIndex((index) => (index + 1) % activeLesson.characters.length)
  }

  return (
    <main className="storybook-app">
      <audio ref={audioRef} preload="none" />
      {screen === 'home' && (
        <section className="home-screen" aria-label="Kindergarten Chinese home">
          <div className="bamboo-frame" aria-hidden="true" />
          <div className="ribbons" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <div className="sky-friends" aria-hidden="true">
            <span>🕊️</span>
            <span>🐥</span>
          </div>
          <div className="mascot-teacher" aria-hidden="true">
            <div className="teacher-head" />
            <div className="teacher-body">
              <Brush size={66} />
            </div>
          </div>
          <h1>熊貓字園</h1>
          <button type="button" className="start-button" onClick={() => setScreen('map')}>
            <BookOpen size={42} />
            開始學習
          </button>
          <nav className="home-dock" aria-label="Home activities">
            <button type="button" onClick={() => setScreen('map')}>
              <BookOpen size={34} />
              開始學習
            </button>
            <button type="button">
              <Trophy size={34} />
              我的星星
            </button>
            <button type="button">
              <Gamepad2 size={34} />
              趣味遊戲
            </button>
          </nav>
        </section>
      )}

      {screen === 'map' && (
        <section className="map-screen" aria-label="Chinese character journey">
          <button type="button" className="round-button back" onClick={() => setScreen('home')} aria-label="Back home">
            <ArrowLeft size={28} />
          </button>
          <div className="wood-title">漢字之旅</div>
          <div className="island-map">
            <svg className="path-svg" viewBox="0 0 100 100" aria-hidden="true">
              <path d="M22 74 C30 62 37 62 43 56 C51 47 52 36 62 33 C72 30 78 40 72 51 C66 64 64 69 64 77" />
            </svg>
            {lessons.map((lesson, index) => (
              <button
                type="button"
                key={lesson.id}
                className={`island island-${index + 1} ${lesson.unlocked ? '' : 'locked'}`}
                onClick={() => openLesson(lesson)}
              >
                <span className="island-icon">{lesson.unlocked ? lesson.icon : <Lock size={32} />}</span>
                <strong>{lesson.title}</strong>
              </button>
            ))}
            {learningPath.map((step) => (
              <button
                type="button"
                key={step.character}
                className={`map-bubble ${step.unlocked ? '' : 'locked'}`}
                style={{ left: `${step.x}%`, top: `${step.y}%` }}
                onClick={() => openLesson(lessons[0], step.character)}
              >
                {step.unlocked ? step.character : <Lock size={21} />}
              </button>
            ))}
          </div>
          <div className="level-strip">
            <Star size={44} fill="currentColor" />
            <span>等級 1-3</span>
            <div>
              <i style={{ width: `${Math.max(progress, 24)}%` }} />
            </div>
          </div>
        </section>
      )}

      {screen === 'practice' && (
        <section className="practice-screen" aria-label={`${activeCharacter} writing practice`}>
          <header className="practice-top">
            <div className="flash-card">{activeCharacter}</div>
            <div className="wood-title compact">和老師一起寫</div>
            <button type="button" className="sound-button" onClick={playAudio}>
              <Volume2 size={28} />
              <span>Audio</span>
            </button>
          </header>
          <div className="pinyin-pill">Pinyin {activeCharacter}: {info.pinyin}</div>
          <section className="paper-board">
            <div className="character-row" aria-label="Lesson characters">
              {practiceCharacters.map(({ character, done }) => (
                <button
                  type="button"
                  key={character}
                  className={character === activeCharacter ? 'current' : done ? 'done' : ''}
                  onClick={() => setActiveIndex(activeLesson.characters.indexOf(character))}
                >
                  {done && <Star size={16} fill="currentColor" />}
                  {character}
                </button>
              ))}
            </div>
            <div className="writer-card">
              <div className="writer-grid">
                <div ref={writerHostRef} className="writer-host" aria-label="Tracing area" />
              </div>
              <div className="coach-bubble">{status}</div>
              <div className="coach" aria-hidden="true">
                <div className="teacher-head small" />
                <div className="thumb">👍</div>
              </div>
            </div>
            <div className="score-row">
              <div className="stars">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star key={index} size={34} fill={index < stars ? 'currentColor' : 'transparent'} />
                ))}
              </div>
              <strong>{info.meaning}</strong>
              <span>{completed} 筆 · {mistakes} 次修正</span>
            </div>
          </section>
          <nav className="bottom-actions">
            <button type="button" onClick={() => setScreen('home')}>
              <ChevronLeft size={26} />
              主頁
            </button>
            <button type="button" className="retry" onClick={replayQuiz}>
              <RotateCcw size={25} />
              重試
            </button>
            <button type="button" className="demo" onClick={showDemo}>
              <Play size={25} />
              示範
            </button>
            <button type="button" className="next" onClick={nextCharacter}>
              下一個
            </button>
          </nav>
        </section>
      )}
    </main>
  )
}

export default App
