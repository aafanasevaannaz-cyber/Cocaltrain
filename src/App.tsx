import { useEffect, useMemo, useState } from 'react';
import { Activity, ChevronLeft, ChevronRight, Music, Settings, Trophy, Volume2 } from 'lucide-react';
import { demoSong } from './data/demoSong';
import { getAccuracy, midiToNoteName } from './lib/music';
import { AudioEngine, type ToneProfile } from './features/audio/audioEngine';
import { BrowserPitchDetector } from './features/pitch/pitchDetector';
import { getAccuracyPercent, getIntonationVerdict, getSemitoneDiff, type TrainingProgress } from './features/training/trainingSession';

type ViewMode = 'home' | 'phrases' | 'notes' | 'full';
type PhraseProgressMap = Record<number, TrainingProgress>;
const PROGRESS_KEY = 'cocaltrain_progress_v1';
type MicState = 'idle' | 'connecting' | 'connected' | 'error';

const flatNotes = demoSong.phrases.flatMap((phrase) => phrase.notes.map((note) => ({ ...note, phraseId: phrase.id })));

export default function App() {
  const audioEngine = useMemo(() => new AudioEngine(), []);
  const pitchDetector = useMemo(() => new BrowserPitchDetector(), []);
  const [view, setView] = useState<ViewMode>('home');
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [noteIndex, setNoteIndex] = useState(0);
  const [isMicOn, setIsMicOn] = useState(false);
  const [isRefPlaying, setIsRefPlaying] = useState(false);
  const [liveMidi, setLiveMidi] = useState<number | null>(null);
  const [fullIndex, setFullIndex] = useState(0);
  const [phraseProgress, setPhraseProgress] = useState<PhraseProgressMap>({});
  const [bestScore, setBestScore] = useState(0);
  const [toneProfile, setToneProfile] = useState<ToneProfile>('wave');
  const [micError, setMicError] = useState<string | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [micState, setMicState] = useState<MicState>('idle');
  const [masterVolume, setMasterVolume] = useState(70);
  const [vocalVolume, setVocalVolume] = useState(50);
  const [instrumentalVolume, setInstrumentalVolume] = useState(60);
  const [transpose, setTranspose] = useState(0);
  const [tempo, setTempo] = useState(100);

  const currentPhrase = demoSong.phrases[phraseIndex];
  const currentNote = flatNotes[noteIndex];
  const fullModeNote = flatNotes[fullIndex];
  const activeNote = view === 'notes' ? currentNote : view === 'full' ? fullModeNote : null;
  const targetMidi = view === 'phrases' ? currentPhrase?.notes[0]?.midi ?? null : activeNote?.midi ?? null;
  const diff = getSemitoneDiff(targetMidi != null ? targetMidi + transpose : null, liveMidi);
  const accuracy = getAccuracy(diff);
  const meterLeft = (() => {
    if (diff == null || Number.isNaN(diff)) {
      return 50;
    }
    const clamped = Math.max(-0.8, Math.min(0.8, diff));
    return 50 + (clamped / 0.8) * 40;
  })();
  const singingState = liveMidi == null ? 'Не слышу голос' : `Слышу: ${midiToNoteName(liveMidi)}`;
  const totalAccuracy = getAccuracyPercent({
    attempts: Object.values(phraseProgress).reduce((sum, item) => sum + item.attempts, 0),
    correct: Object.values(phraseProgress).reduce((sum, item) => sum + item.correct, 0),
  });

  const markAttempt = () => {
    const verdict = getIntonationVerdict(diff);
    const isCorrect = verdict === 'in_tune' || verdict === 'close';
    const phraseId = view === 'phrases' ? currentPhrase?.id : activeNote?.phraseId;

    if (phraseId == null || verdict === 'waiting') {
      return;
    }

    setPhraseProgress((prev) => {
      const current = prev[phraseId] ?? { attempts: 0, correct: 0 };
      return {
        ...prev,
        [phraseId]: {
          attempts: current.attempts + 1,
          correct: current.correct + (isCorrect ? 1 : 0),
        },
      };
    });
  };

  useEffect(() => {
    audioEngine.setSettings({
      masterVolume,
      vocalVolume,
      instrumentalVolume,
      transpose,
      tempo,
      toneProfile,
    });
  }, [audioEngine, masterVolume, vocalVolume, instrumentalVolume, transpose, tempo, toneProfile]);

  useEffect(() => {
    if (!isMicOn) {
      pitchDetector.stop();
      setLiveMidi(null);
      setMicError(null);
      setMicState('idle');
      return;
    }

    let active = true;
    setMicState('connecting');
    pitchDetector.start()
      .then(() => {
        setMicState('connected');
        const tick = () => {
          if (!active) {
            return;
          }
          setLiveMidi(pitchDetector.getCurrentSample().midi);
          requestAnimationFrame(tick);
        };
        tick();
      })
      .catch((error: unknown) => {
        let message = 'Не удалось подключить микрофон.';
        if (error instanceof DOMException && error.name === 'NotAllowedError') {
          message = 'Доступ к микрофону запрещен. Разреши доступ в браузере.';
        } else if (error instanceof DOMException && error.name === 'NotFoundError') {
          message = 'Микрофон не найден. Подключи устройство и попробуй снова.';
        } else if (error instanceof DOMException && error.name === 'NotReadableError') {
          message = 'Микрофон занят другим приложением. Освободи его и попробуй снова.';
        }
        setMicState('error');
        setMicError(message);
        setIsMicOn(false);
      });

    return () => {
      active = false;
      pitchDetector.stop();
      setMicState('idle');
    };
  }, [isMicOn, pitchDetector]);

  useEffect(() => {
    const raw = window.localStorage.getItem(PROGRESS_KEY);
    if (!raw?.trim()) {
      return;
    }

    try {
      const parsed = JSON.parse(raw) as { phraseProgress: PhraseProgressMap; bestScore: number };
      setPhraseProgress(parsed.phraseProgress ?? {});
      setBestScore(parsed.bestScore ?? 0);
    } catch {
      setAudioError('Данные прогресса повреждены. История будет создана заново.');
      window.localStorage.removeItem(PROGRESS_KEY);
    }
  }, []);

  useEffect(() => {
    const nextBest = Math.max(bestScore, totalAccuracy);
    if (nextBest !== bestScore) {
      setBestScore(nextBest);
      return;
    }

    window.localStorage.setItem(PROGRESS_KEY, JSON.stringify({ phraseProgress, bestScore }));
  }, [phraseProgress, bestScore, totalAccuracy]);

  const playReference = () => {
    if (isRefPlaying) {
      audioEngine.stop();
      setIsRefPlaying(false);
      return;
    }

    const notes = view === 'phrases'
      ? currentPhrase.notes
      : view === 'notes'
        ? [currentNote]
        : flatNotes;

    try {
      setAudioError(null);
      setIsRefPlaying(true);
      audioEngine.playSequence(
        notes.map((item) => ({ midi: item.midi, duration: item.duration })),
        {
          onNoteStart: (index) => {
            if (view === 'phrases') {
              return;
            }
            if (view === 'notes') {
              setNoteIndex(Math.min(flatNotes.length - 1, noteIndex + index));
            }
            if (view === 'full') {
              setFullIndex(Math.min(flatNotes.length - 1, index));
            }
          },
          onEnd: () => setIsRefPlaying(false),
        },
      );
    } catch {
      setAudioError('Не удалось запустить звук. Кликни по экрану и попробуй снова.');
      setIsRefPlaying(false);
    }
  };

  const singTogether = () => {
    if (!isMicOn) {
      setIsMicOn(true);
    }
    if (!isRefPlaying) {
      playReference();
    }
  };

  return (
    <div className="app-shell">
      <div className="phone">
        <header className="header">
          {view !== 'home' ? (
            <button className="icon-btn" onClick={() => setView('home')}>
              <ChevronLeft size={22} />
            </button>
          ) : <div style={{ width: 48 }} />}
          <strong style={{ fontSize: 20, fontWeight: 900 }}>Cocaltrain</strong>
          <button className="icon-btn">
            <Settings size={20} />
          </button>
        </header>

        {view === 'home' && (
          <>
            <section className="card hero">
              <div className="badge"><Music size={14} /> слух • фразы • интонация</div>
              <h1>{demoSong.title}</h1>
              <p>Стартовый каркас приложения для разучивания песни и тренировки слуха.</p>
            </section>

            <div className="grid">
              <button className="menu-btn" style={{ background: '#0f172a' }} onClick={() => setView('phrases')}>
                <Activity />
                <div style={{ textAlign: 'left' }}>
                  <div className="title">По фразам</div>
                  <div className="sub">Разучивание кусков песни</div>
                </div>
                <ChevronRight style={{ marginLeft: 'auto', opacity: 0.7 }} />
              </button>

              <button className="menu-btn" style={{ background: '#2563eb' }} onClick={() => setView('notes')}>
                <Trophy />
                <div style={{ textAlign: 'left' }}>
                  <div className="title">Точные ноты</div>
                  <div className="sub">Работа с высотой звука</div>
                </div>
                <ChevronRight style={{ marginLeft: 'auto', opacity: 0.7 }} />
              </button>

              <button className="menu-btn" style={{ background: '#0f766e' }} onClick={() => setView('full')}>
                <Music />
                <div style={{ textAlign: 'left' }}>
                  <div className="title">Полный проход</div>
                  <div className="sub">Вся песня без остановок</div>
                </div>
                <ChevronRight style={{ marginLeft: 'auto', opacity: 0.7 }} />
              </button>
            </div>
          </>
        )}

        {view !== 'home' && (
          <>
            {(micError || audioError) && (
              <section className="card panel stack">
                {micError && <div style={{ color: '#b91c1c', fontWeight: 700 }}>{micError}</div>}
                {audioError && <div style={{ color: '#b91c1c', fontWeight: 700 }}>{audioError}</div>}
              </section>
            )}
            <section className="card panel stack">
              <div className="row">
                <div>
                  <div className="small">Режим</div>
                  <div style={{ fontSize: 22, fontWeight: 900 }}>{view === 'phrases' ? currentPhrase.text : activeNote?.text ?? '--'}</div>
                </div>
                <div className={`mic-pill mic-pill--${micState}`}>
                  {micState === 'connected' ? 'Микрофон подключен' : micState === 'connecting' ? 'Подключение микрофона...' : micState === 'error' ? 'Ошибка микрофона' : 'Микрофон отключен'}
                </div>
                <button className="icon-btn">
                  <Volume2 size={20} />
                </button>
              </div>

              <div className="row">
                <div>
                  <div className="small">Нужно</div>
                  <div style={{ fontSize: 28, fontWeight: 900 }}>{midiToNoteName(targetMidi != null ? targetMidi + transpose : null)}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="small">Поешь</div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: '#94a3b8' }}>{midiToNoteName(liveMidi)}</div>
                </div>
              </div>

              <div className="meter">
                <div className="meter-center" />
                <div className="meter-dot" style={{ left: `${meterLeft}%`, background: accuracy.dot }} />
              </div>

              <div className="row">
                <div className="small">Статус</div>
                <div style={{ padding: '8px 12px', borderRadius: 999, background: accuracy.bg, color: accuracy.color, fontWeight: 800, fontSize: 12 }}>{accuracy.label}</div>
              </div>
              <div className="row">
                <div className="small">Детектор</div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{singingState}</div>
              </div>

              <div className="row">
                <div className="small">Прогресс</div>
                <div style={{ fontSize: 14, fontWeight: 800 }}>{totalAccuracy}% • best {bestScore}%</div>
              </div>
            </section>

            <section className="card panel transport">
              <label>Звук эталона: {toneProfile === 'wave' ? 'Волны' : toneProfile === 'piano' ? 'Пианино' : 'Голос'}</label>
              <div className="tone-selector">
                <button className={`control-btn ${toneProfile === 'wave' ? 'dark' : 'light'}`} onClick={() => setToneProfile('wave')}>Волны</button>
                <button className={`control-btn ${toneProfile === 'piano' ? 'dark' : 'light'}`} onClick={() => setToneProfile('piano')}>Пианино</button>
                <button className={`control-btn ${toneProfile === 'voice' ? 'dark' : 'light'}`} onClick={() => setToneProfile('voice')}>Голос</button>
              </div>

              <label>Общая громкость: {masterVolume}%</label>
              <input type="range" min="0" max="100" value={masterVolume} onChange={(e) => setMasterVolume(Number(e.target.value))} />

              <label>Вокал-референс: {vocalVolume}%</label>
              <input type="range" min="0" max="100" value={vocalVolume} onChange={(e) => setVocalVolume(Number(e.target.value))} />

              <label>Минус: {instrumentalVolume}%</label>
              <input type="range" min="0" max="100" value={instrumentalVolume} onChange={(e) => setInstrumentalVolume(Number(e.target.value))} />

              <label>Тональность: {transpose > 0 ? `+${transpose}` : transpose} полутонов</label>
              <input type="range" min="-6" max="6" value={transpose} onChange={(e) => setTranspose(Number(e.target.value))} />

              <label>Темп: {tempo}%</label>
              <input type="range" min="60" max="120" value={tempo} onChange={(e) => setTempo(Number(e.target.value))} />
            </section>

            <section className="controls">
              <button className="control-btn light" onClick={() => {
                if (view === 'phrases') setPhraseIndex((prev) => Math.max(0, prev - 1));
                if (view === 'notes') setNoteIndex((prev) => Math.max(0, prev - 1));
                if (view === 'full') setFullIndex((prev) => Math.max(0, prev - 1));
              }}>
                Назад
              </button>
              <button
                className={`control-btn ${isRefPlaying ? 'dark' : 'light'}`}
                onClick={playReference}
              >
                {isRefPlaying ? 'Стоп' : 'Слушать'}
              </button>
              <button className={`control-btn ${isMicOn ? 'dark' : 'light'}`} onClick={() => setIsMicOn((prev) => !prev)}>
                {isMicOn ? 'Микрофон: вкл' : 'Петь'}
              </button>
              <button className="control-btn dark" onClick={singTogether}>
                Петь вместе
              </button>
              <button className="control-btn light" onClick={() => {
                markAttempt();
                if (view === 'phrases') setPhraseIndex((prev) => Math.min(demoSong.phrases.length - 1, prev + 1));
                if (view === 'notes') setNoteIndex((prev) => Math.min(flatNotes.length - 1, prev + 1));
                if (view === 'full') setFullIndex((prev) => Math.min(flatNotes.length - 1, prev + 1));
              }}>
                Дальше
              </button>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
