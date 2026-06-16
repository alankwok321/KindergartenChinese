import { useEffect, useMemo, useRef, useState } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { motion } from 'framer-motion'
import HanziWriter from 'hanzi-writer'
import {
  ChevronLeft,
  Play,
  RotateCcw,
  Star,
  Volume2,
} from 'lucide-react'
import './App.css'
import { cn } from './lib/utils'

type Screen = 'home' | 'map' | 'practice'

type Lesson = {
  id: string
  title: string
  tone: string
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
    tone: 'from-emerald-300 via-lime-300 to-yellow-200',
    unlocked: true,
    characters: ['人', '口', '日', '月', '山', '水'],
  },
  {
    id: 'body-one',
    title: '身體島',
    tone: 'from-sky-300 via-cyan-200 to-emerald-200',
    unlocked: true,
    characters: ['手', '心', '目', '耳', '足', '女'],
  },
  {
    id: 'animal-one',
    title: '動物島',
    tone: 'from-amber-200 via-orange-200 to-rose-200',
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

const buttonVariants = cva(
  'group relative isolate inline-flex items-center justify-center gap-2 overflow-hidden rounded-2xl border font-black tracking-wide shadow-lg outline-none transition duration-300 hover:-translate-y-0.5 focus-visible:ring-4 active:translate-y-0 disabled:pointer-events-none disabled:opacity-60',
  {
    variants: {
      tone: {
        green:
          'border-emerald-300/70 bg-gradient-to-b from-lime-300 via-emerald-400 to-green-600 text-white shadow-emerald-900/30 focus-visible:ring-lime-300/50',
        gold:
          'border-amber-200/80 bg-gradient-to-b from-yellow-200 via-amber-300 to-orange-500 text-amber-950 shadow-amber-900/30 focus-visible:ring-amber-300/50',
        coral:
          'border-rose-200/80 bg-gradient-to-b from-rose-200 via-orange-300 to-red-500 text-white shadow-red-900/30 focus-visible:ring-rose-300/50',
        glass:
          'border-white/35 bg-white/20 text-white shadow-slate-950/20 backdrop-blur-xl focus-visible:ring-white/50',
      },
      size: {
        sm: 'min-h-11 px-4 text-sm',
        md: 'min-h-14 px-5 text-base sm:text-lg',
        lg: 'min-h-20 px-8 text-2xl sm:text-3xl',
        square: 'size-14 p-0',
      },
    },
    defaultVariants: {
      tone: 'green',
      size: 'md',
    },
  },
)

type MagicButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    children: React.ReactNode
  }

function getCuhkSoundUrl(jyutping: string) {
  return `/api/cuhk-sound?s=${encodeURIComponent(jyutping)}`
}

function MagicButton({ className, tone, size, children, ...props }: MagicButtonProps) {
  return (
    <button className={cn(buttonVariants({ tone, size }), className)} {...props}>
      <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/35 to-transparent opacity-0 transition-opacity duration-300 group-hover:animate-shimmer group-hover:opacity-100" />
      <span className="relative z-10 inline-flex items-center justify-center gap-2">{children}</span>
    </button>
  )
}

function ReferenceBackdrop({ screen }: { screen: Screen }) {
  const backgroundSrc = `/backgrounds/${screen}-panel.png`
  return (
    <div className="screen-image-bg" aria-hidden="true">
      <img className="screen-image-blur" src={backgroundSrc} alt="" />
      <img className="screen-image-panel" src={backgroundSrc} alt="" />
    </div>
  )
}

function GlowPanel({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn('relative rounded-[2rem] p-[1px]', className)}>
      <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-r from-white/80 via-lime-300/80 to-cyan-200/80 opacity-80 blur-sm" />
      <div className="relative rounded-[2rem] border border-white/35 bg-white/55 shadow-glow backdrop-blur-2xl">
        {children}
      </div>
    </div>
  )
}

function WoodSign({ children, compact = false }: { children: React.ReactNode; compact?: boolean }) {
  return (
    <div
      className={cn(
        'relative mx-auto overflow-hidden rounded-3xl border border-amber-100/40 bg-gradient-to-b from-amber-500 via-orange-600 to-yellow-900 px-7 py-4 text-center font-display font-black text-white shadow-gold',
        compact ? 'text-3xl sm:text-5xl' : 'text-4xl sm:text-7xl',
      )}
    >
      <div className="absolute inset-x-0 top-0 h-1/2 bg-white/16" />
      <div className="absolute inset-y-2 left-3 w-2 rounded-full bg-lime-400/80" />
      <div className="absolute inset-y-2 right-3 w-2 rounded-full bg-lime-400/80" />
      <span className="relative drop-shadow-[0_4px_0_rgba(69,26,3,0.75)]">{children}</span>
    </div>
  )
}

function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [activeLesson] = useState(lessons[0])
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

    const size = Math.min(Math.max(host.clientWidth, 250), 450)
    const writer = HanziWriter.create(host, activeCharacter, {
      width: size,
      height: size,
      padding: 18,
      showOutline: true,
      showCharacter: false,
      strokeAnimationSpeed: 1.05,
      delayBetweenStrokes: 130,
      drawingWidth: 32,
      strokeColor: '#64748b',
      outlineColor: '#cbd5e1',
      radicalColor: '#22c55e',
      drawingColor: '#172554',
      highlightColor: '#facc15',
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
    <main className="relative min-h-svh overflow-hidden bg-slate-950 text-ink">
      <audio ref={audioRef} preload="none" />
      <ReferenceBackdrop screen={screen} />

      {screen === 'home' && (
        <section className="relative z-10 min-h-svh px-4 py-6" aria-label="Kindergarten Chinese home">
          <motion.div
            className="absolute inset-x-0 bottom-[5svh] mx-auto grid w-full max-w-3xl justify-items-center gap-4 px-4 sm:bottom-[6svh]"
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
          >
            <button
              type="button"
              className="start-image-button"
              onClick={() => setScreen('map')}
              aria-label="開始學習"
            >
              <img src="/backgrounds/start-learning-button.png" alt="" aria-hidden="true" />
            </button>
          </motion.div>
        </section>
      )}

      {screen === 'map' && (
        <section className="relative z-10 min-h-svh" aria-label="Level selection background" />
      )}

      {screen === 'practice' && (
        <section className="relative z-10 grid min-h-svh grid-rows-[auto_auto_1fr_auto] gap-2 px-3 py-2 sm:px-5" aria-label={`${activeCharacter} writing practice`}>
          <header className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
            <div className="grid size-20 place-items-center rounded-3xl border border-white/55 bg-white/70 font-han text-5xl font-black text-slate-600 shadow-gold backdrop-blur-xl sm:size-28 sm:text-7xl">
              {activeCharacter}
            </div>
            <WoodSign compact>和老師一起寫</WoodSign>
            <MagicButton tone="gold" size="square" className="size-16 flex-col rounded-full text-xs sm:size-20" onClick={playAudio}>
              <Volume2 className="size-6" />
              Audio
            </MagicButton>
          </header>
          <div className="mx-auto rounded-full border border-white/25 bg-emerald-950/50 px-5 py-2 text-center text-base font-black text-lime-50 shadow-lg backdrop-blur-xl sm:text-2xl">
            Pinyin {activeCharacter}: {info.pinyin}
          </div>
          <GlowPanel className="mx-auto w-full max-w-3xl">
            <div className="grid gap-3 p-3 sm:p-4">
              <div className="grid auto-cols-[4.6rem] grid-flow-col gap-2 overflow-x-auto pb-1 sm:grid-flow-row sm:grid-cols-6">
                {practiceCharacters.map(({ character, done }) => (
                  <button
                    type="button"
                    key={character}
                    className={cn(
                      'relative grid aspect-[1.15] place-items-center rounded-2xl border border-slate-200 bg-white/85 font-han text-3xl font-black text-amber-950 shadow-inner transition hover:-translate-y-0.5 sm:aspect-[1.55] sm:text-5xl',
                      character === activeCharacter && 'border-lime-400 bg-lime-100 shadow-glow',
                    )}
                    onClick={() => setActiveIndex(activeLesson.characters.indexOf(character))}
                  >
                    {done && <Star className="absolute left-2 top-2 size-4 text-yellow-400" fill="currentColor" />}
                    {character}
                  </button>
                ))}
              </div>
              <div className="relative mx-auto grid aspect-square w-full max-w-[min(34svh,360px)] place-items-center overflow-hidden rounded-[1.6rem] border border-slate-200 bg-white shadow-2xl">
                <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_calc(50%-1px),#cbd5e1_calc(50%-1px),#cbd5e1_calc(50%+1px),transparent_calc(50%+1px)),linear-gradient(-45deg,transparent_calc(50%-1px),#cbd5e1_calc(50%-1px),#cbd5e1_calc(50%+1px),transparent_calc(50%+1px))]" />
                <div className="absolute left-1/2 top-0 h-full w-px bg-slate-300" />
                <div className="absolute left-0 top-1/2 h-px w-full bg-slate-300" />
                <div ref={writerHostRef} className="writer-host relative z-10 size-full touch-none" aria-label="Tracing area" />
              </div>
              <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
                <div className="rounded-3xl border border-white/50 bg-white/70 p-4 shadow-lg backdrop-blur-xl">
                  <p className="text-lg font-black text-amber-950">{status}</p>
                  <p className="mt-1 text-sm font-bold text-amber-950/65">{info.meaning} · {completed} 筆 · {mistakes} 次修正</p>
                </div>
                <div className="flex text-yellow-400 drop-shadow">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star key={index} className="size-8" fill={index < stars ? 'currentColor' : 'transparent'} />
                  ))}
                </div>
              </div>
            </div>
          </GlowPanel>
          <nav className="mx-auto grid w-full max-w-3xl grid-cols-4 gap-2" aria-label="Practice controls">
            <MagicButton tone="gold" size="sm" className="min-h-10" onClick={() => setScreen('home')}>
              <ChevronLeft className="size-5" />
              主頁
            </MagicButton>
            <MagicButton tone="coral" size="sm" className="min-h-10" onClick={replayQuiz}>
              <RotateCcw className="size-5" />
              重試
            </MagicButton>
            <MagicButton tone="gold" size="sm" className="min-h-10" onClick={showDemo}>
              <Play className="size-5" />
              示範
            </MagicButton>
            <MagicButton tone="green" size="sm" className="min-h-10" onClick={nextCharacter}>
              下一個
            </MagicButton>
          </nav>
        </section>
      )}
    </main>
  )
}

export default App
