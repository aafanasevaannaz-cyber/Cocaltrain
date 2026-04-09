import { useEffect, useMemo, useState } from 'react';
import { Activity, ChevronLeft, ChevronRight, Music, Settings, Trophy, Volume2 } from 'lucide-react';
import { demoSong } from './data/demoSong';
import { getAccuracy, midiToNoteName } from './lib/music';
import { AudioEngine } from './features/audio/audioEngine';
import { BrowserPitchDetector } from './features/pitch/pitchDetector';
import { getSemitoneDiff } from './features/training/trainingSession';

type ViewMode = 'home' | 'phrases' | 'notes';

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
  const [masterVolume, setMasterVolume] = useState(70);
  const [vocalVolume, setVocalVolume] = useState(50);
  const [instrumentalVolume, setInstrumentalVolume] = useState(60);
  const [transpose, setTranspose] = useState(0);
  const [tempo, setTempo] = useState(100);

  const currentPhrase = demoSong.phrases[phraseIndex];
  const currentNote = flatNotes[noteIndex];
  const targetMidi = view === 'phrases' ? currentPhrase?.notes[0]?.midi ?? null : view === 'notes' ? currentNote?.midi ?? null : null;
  const diff = getSemitoneDiff(targetMidi != null ? targetMidi + transpose : null, liveMidi);
  const accuracy = getAccuracy(diff);

  useEffect(() => {
    audioEngine.setSettings({
      masterVolume,
      vocalVolume,
      instrumentalVolume,
      transpose,
      tempo,
    });
  }, [audioEngine, masterVolume, vocalVolume, instrumentalVolume, transpose, tempo]);

  useEffect(() => {
    if (!isMicOn) {
      pitchDetector.stop();
      setLiveMidi(null);
      return;
    }

    let active = true;
    pitchDetector.start()
      .then(() => {
        const tick = () => {
          if (!active) {
            return;
          }
          setLiveMidi(pitchDetector.getCurrentSample().midi);
          requestAnimationFrame(tick);
        };
        tick();
      })
      .catch(() => {
        setIsMicOn(false);
      });

    return () => {
      active = false;
      pitchDetector.stop();
    };
  }, [isMicOn, pitchDetector]);

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
            </div>
          </>
        )}

        {view !== 'home' && (
          <>
            <section className="card panel stack">
              <div className="row">
                <div>
                  <div className="small">Режим</div>
                  <div style={{ fontSize: 22, fontWeight: 900 }}>{view === 'phrases' ? currentPhrase.text : currentNote.text}</div>
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
                <div className="meter-dot" style={{ left: '50%', background: accuracy.dot }} />
              </div>

              <div className="row">
                <div className="small">Статус</div>
                <div style={{ padding: '8px 12px', borderRadius: 999, background: accuracy.bg, color: accuracy.color, fontWeight: 800, fontSize: 12 }}>{accuracy.label}</div>
              </div>
            </section>

            <section className="card panel transport">
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
              }}>
                Назад
              </button>
              <button
                className={`control-btn ${isRefPlaying ? 'dark' : 'light'}`}
                onClick={() => {
                  const nextState = !isRefPlaying;
                  setIsRefPlaying(nextState);
                  if (nextState) {
                    audioEngine.play();
                  } else {
                    audioEngine.pause();
                  }
                }}
              >
                {isRefPlaying ? 'Стоп' : 'Слушать'}
              </button>
              <button className={`control-btn ${isMicOn ? 'dark' : 'light'}`} onClick={() => setIsMicOn((prev) => !prev)}>
                {isMicOn ? 'Микрофон: вкл' : 'Петь'}
              </button>
              <button className="control-btn light" onClick={() => {
                if (view === 'phrases') setPhraseIndex((prev) => Math.min(demoSong.phrases.length - 1, prev + 1));
                if (view === 'notes') setNoteIndex((prev) => Math.min(flatNotes.length - 1, prev + 1));
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
