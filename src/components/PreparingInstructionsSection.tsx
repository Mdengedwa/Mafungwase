import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Square,
  Play,
  Pause,
  RotateCcw,
  Copy,
  Check,
  Trash2,
  Volume2,
  FileText,
  Clock,
  Flame,
  ShieldAlert,
  Sparkles,
  Download,
  Utensils,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { Accompaniment } from '../types';

interface PreparingInstructionsSectionProps {
  activeAccompaniment: Accompaniment;
  accompaniments: Accompaniment[];
  activeAccIndex: number;
  onSelectAccompaniment: (index: number) => void;
  onUpdateInstructions: (instructions: string) => void;
  onUpdateVoiceNote: (voiceUrl?: string, duration?: number) => void;
}

// Check for Web Speech API support
const SpeechRecognition =
  typeof window !== 'undefined'
    ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    : null;

export const PreparingInstructionsSection: React.FC<PreparingInstructionsSectionProps> = ({
  activeAccompaniment,
  accompaniments,
  activeAccIndex,
  onSelectAccompaniment,
  onUpdateInstructions,
  onUpdateVoiceNote,
}) => {
  const [instructionsText, setInstructionsText] = useState<string>(
    activeAccompaniment.preparingInstructions || ''
  );
  const instructionsRef = useRef<string>(activeAccompaniment.preparingInstructions || '');
  const [copied, setCopied] = useState<boolean>(false);

  // Live Speech-to-Text Dictation State
  const [isDictating, setIsDictating] = useState<boolean>(false);
  const [dictationError, setDictationError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  // Audio Recording (MediaRecorder) State
  const [isRecordingAudio, setIsRecordingAudio] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const recordingSecondsRef = useRef<number>(0);
  const [audioError, setAudioError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);

  // Audio Playback State
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [playbackTime, setPlaybackTime] = useState<number>(0);
  const [audioDuration, setAudioDuration] = useState<number>(
    activeAccompaniment.voiceNoteDuration || 0
  );
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Keep instructionsRef and local state synced when active accompaniment changes
  useEffect(() => {
    const currentNotes = activeAccompaniment.preparingInstructions || '';
    instructionsRef.current = currentNotes;
    setInstructionsText(currentNotes);
    setAudioDuration(activeAccompaniment.voiceNoteDuration || 0);
    setIsPlayingAudio(false);
    setPlaybackTime(0);
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current.currentTime = 0;
    }
  }, [activeAccompaniment.id, activeAccIndex]);

  // Clean up timers and audio recording on unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  // Propagate text changes safely
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    instructionsRef.current = val;
    setInstructionsText(val);
    onUpdateInstructions(val);
  };

  // Quick Insert Helper tags
  const insertSnippet = (snippet: string) => {
    const prev = instructionsRef.current;
    const updated = prev ? `${prev.trim()}\n${snippet}` : snippet;
    instructionsRef.current = updated;
    setInstructionsText(updated);
    onUpdateInstructions(updated);
  };

  const addStepNumber = () => {
    const lines = instructionsRef.current.split('\n').filter((l) => l.trim().length > 0);
    const stepNumber = lines.length + 1;
    insertSnippet(`Step ${stepNumber}: `);
  };

  // Copy to clipboard
  const handleCopy = () => {
    if (!instructionsRef.current) return;
    navigator.clipboard.writeText(instructionsRef.current);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Clear instructions
  const handleClear = () => {
    if (confirm('Clear all preparation instructions for this accompaniment?')) {
      instructionsRef.current = '';
      setInstructionsText('');
      onUpdateInstructions('');
    }
  };

  // -------------------------------------------------------------
  // 1. LIVE SPEECH-TO-TEXT DICTATION (Voice Typing)
  // -------------------------------------------------------------
  const toggleDictation = () => {
    setDictationError(null);

    if (isDictating) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsDictating(false);
      return;
    }

    if (!SpeechRecognition) {
      setDictationError(
        'Speech recognition is not supported in this browser. Please use Google Chrome or record an audio memo below.'
      );
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-ZA'; // South African English default or fallback

      recognition.onstart = () => {
        setIsDictating(true);
        setDictationError(null);
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }

        if (finalTranscript) {
          const prev = instructionsRef.current;
          const separator = prev && !prev.endsWith(' ') && !prev.endsWith('\n') ? ' ' : '';
          const updated = prev + separator + finalTranscript.trim();
          instructionsRef.current = updated;
          setInstructionsText(updated);
          onUpdateInstructions(updated);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setDictationError('Microphone access blocked. Please enable microphone permissions in your browser.');
        } else if (event.error !== 'no-speech') {
          setDictationError(`Voice dictation error: ${event.error}`);
        }
        setIsDictating(false);
      };

      recognition.onend = () => {
        setIsDictating(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition', err);
      setDictationError('Could not start speech recognition. Please check your mic settings.');
      setIsDictating(false);
    }
  };

  // -------------------------------------------------------------
  // 2. VOICE MEMO AUDIO RECORDER (MediaRecorder)
  // -------------------------------------------------------------
  const startAudioRecording = async () => {
    setAudioError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const finalDuration = recordingSecondsRef.current;
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64Audio = reader.result as string;
          onUpdateVoiceNote(base64Audio, finalDuration);
          setAudioDuration(finalDuration);
        };
        // Stop all audio tracks to release microphone
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(200); // chunk every 200ms
      setIsRecordingAudio(true);
      setRecordingSeconds(0);
      recordingSecondsRef.current = 0;

      recordingTimerRef.current = setInterval(() => {
        recordingSecondsRef.current += 1;
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Error starting audio recording:', err);
      setAudioError(
        'Could not access microphone. Please check browser permissions and allow microphone access.'
      );
      setIsRecordingAudio(false);
    }
  };

  const stopAudioRecording = () => {
    if (mediaRecorderRef.current && isRecordingAudio) {
      mediaRecorderRef.current.stop();
    }
    setIsRecordingAudio(false);
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }
  };

  const handleDeleteVoiceNote = () => {
    if (confirm('Delete the recorded voice note?')) {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
      setIsPlayingAudio(false);
      setPlaybackTime(0);
      setAudioDuration(0);
      onUpdateVoiceNote(undefined, 0);
    }
  };

  // Audio Player Controls
  const togglePlayAudio = () => {
    if (!audioPlayerRef.current) return;

    if (isPlayingAudio) {
      audioPlayerRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioPlayerRef.current.play().catch((e) => console.error('Audio play error', e));
      setIsPlayingAudio(true);
    }
  };

  const handleAudioTimeUpdate = () => {
    if (audioPlayerRef.current) {
      setPlaybackTime(audioPlayerRef.current.currentTime);
      if (audioPlayerRef.current.duration && !isNaN(audioPlayerRef.current.duration)) {
        setAudioDuration(Math.round(audioPlayerRef.current.duration));
      }
    }
  };

  const handleAudioEnded = () => {
    setIsPlayingAudio(false);
    setPlaybackTime(0);
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Word count & line count
  const wordCount = instructionsText.trim()
    ? instructionsText.trim().split(/\s+/).length
    : 0;
  const charCount = instructionsText.length;

  return (
    <div
      id="preparing-instructions-section"
      className="bg-white rounded-3xl p-5 sm:p-6 shadow-xs border-2 border-black space-y-4"
    >
      {/* Header with Title & Accompaniment indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-100 rounded-xl text-emerald-900 border border-emerald-300">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-stone-900 flex items-center gap-2">
              Preparing Instructions
              <span className="text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Kitchen Guide
              </span>
            </h3>
            <p className="text-xs text-stone-500">
              Type or voice record culinary prep methods, timings, and chef notes for this item.
            </p>
          </div>
        </div>

        {/* Accompaniment Selector Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-thin">
          {accompaniments.map((acc, idx) => {
            const isActive = idx === activeAccIndex;
            const hasNotes = !!acc.preparingInstructions?.trim();
            const hasVoice = !!acc.voiceNoteUrl;

            return (
              <button
                key={acc.id}
                type="button"
                onClick={() => onSelectAccompaniment(idx)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all whitespace-nowrap border ${
                  isActive
                    ? 'bg-emerald-900 text-white border-emerald-950 shadow-xs'
                    : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                }`}
              >
                <span>{acc.name}</span>
                {(hasNotes || hasVoice) && (
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isActive ? 'bg-amber-400' : 'bg-emerald-600'
                    }`}
                    title={hasVoice ? 'Has Voice Memo & Notes' : 'Has Notes'}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Accompaniment Banner */}
      <div className="flex items-center justify-between bg-stone-50 px-3.5 py-2 rounded-2xl border border-stone-200 text-xs">
        <div className="flex items-center gap-2 font-bold text-stone-800">
          <Utensils className="w-3.5 h-3.5 text-emerald-700" />
          <span>Instructions for:</span>
          <span className="text-emerald-900 bg-white px-2 py-0.5 rounded-md border border-stone-200 font-black">
            {activeAccompaniment.name}
          </span>
        </div>
        <div className="flex items-center gap-3 text-stone-500 text-[11px] font-semibold">
          <span>{wordCount} words</span>
          <span>•</span>
          <span>{charCount} chars</span>
        </div>
      </div>

      {/* Quick Insert Snippet Buttons */}
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        <button
          type="button"
          onClick={addStepNumber}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200 font-bold hover:bg-emerald-100 transition-all text-[11px]"
        >
          <span>+ Step</span>
        </button>
        <button
          type="button"
          onClick={() => insertSnippet('⏱️ Prep Time: 15 mins | Cook Temp: 180°C')}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-100 text-stone-800 border border-stone-200 font-bold hover:bg-stone-200 transition-all text-[11px]"
        >
          <Clock className="w-3 h-3 text-amber-600" />
          <span>Time & Temp</span>
        </button>
        <button
          type="button"
          onClick={() => insertSnippet('🧂 Seasoning: Salt, ground black pepper, and fresh thyme to taste.')}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-100 text-stone-800 border border-stone-200 font-bold hover:bg-stone-200 transition-all text-[11px]"
        >
          <Flame className="w-3 h-3 text-red-500" />
          <span>Seasoning</span>
        </button>
        <button
          type="button"
          onClick={() => insertSnippet('⚠️ Cross-Contamination / Allergen Note: Keep sanitized & refrigerated under 4°C.')}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 font-bold hover:bg-amber-100 transition-all text-[11px]"
        >
          <ShieldAlert className="w-3 h-3 text-amber-600" />
          <span>Allergen / Safety</span>
        </button>
      </div>

      {/* Textarea Area */}
      <div className="relative">
        <textarea
          id="preparing-instructions-textarea"
          value={instructionsText}
          onChange={handleTextChange}
          rows={5}
          placeholder={`Enter preparation steps, cooking instructions, temperature guides, or click the mic button below to record voice instructions...\n\nExample:\n1. Soak basmati rice for 20 mins, drain and rinse.\n2. Bring 2L salted water to a rolling boil, add whole cloves & cardamom.\n3. Simmer on low heat for 12 minutes until fluffy.`}
          className={`w-full p-4 rounded-2xl border text-sm text-stone-900 leading-relaxed font-mono focus:outline-none transition-all placeholder:text-stone-400 placeholder:font-sans ${
            isDictating
              ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/20'
              : 'border-stone-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 bg-white'
          }`}
        />

        {/* Live Dictating Indicator Badge */}
        {isDictating && (
          <div className="absolute top-3 right-3 flex items-center gap-2 bg-red-600 text-white px-2.5 py-1 rounded-full text-xs font-bold shadow-md animate-pulse">
            <span className="w-2 h-2 rounded-full bg-white animate-ping" />
            <span>Listening... Speak Now</span>
          </div>
        )}
      </div>

      {/* Dictation / Mic Error Notice */}
      {dictationError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
          <Info className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span>{dictationError}</span>
        </div>
      )}

      {/* Actions Toolbar: Voice Dictate, Audio Memo Recording, Copy, Clear */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        {/* Left Side: Voice Options */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Live Voice-to-Text Dictation Button */}
          <button
            type="button"
            id="voice-dictation-btn"
            onClick={toggleDictation}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all border shadow-xs ${
              isDictating
                ? 'bg-red-600 hover:bg-red-700 text-white border-red-700 animate-pulse'
                : 'bg-emerald-700 hover:bg-emerald-800 text-white border-emerald-800'
            }`}
            title="Speak into your microphone to type automatically"
          >
            {isDictating ? (
              <>
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Stop Voice Typing</span>
              </>
            ) : (
              <>
                <Mic className="w-3.5 h-3.5" />
                <span>Voice Dictate (Live)</span>
              </>
            )}
          </button>

          {/* Audio Memo Recorder Button */}
          {!isRecordingAudio ? (
            <button
              type="button"
              id="record-audio-memo-btn"
              onClick={startAudioRecording}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold bg-stone-900 hover:bg-black text-white border border-black shadow-xs transition-all"
              title="Record a voice audio note for the kitchen team"
            >
              <Mic className="w-3.5 h-3.5 text-amber-400" />
              <span>Record Voice Note</span>
            </button>
          ) : (
            <button
              type="button"
              id="stop-audio-memo-btn"
              onClick={stopAudioRecording}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold bg-red-600 hover:bg-red-700 text-white border border-red-700 shadow-xs animate-pulse transition-all"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Stop Recording ({formatTimer(recordingSeconds)})</span>
            </button>
          )}
        </div>

        {/* Right Side: Copy & Clear */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            disabled={!instructionsText}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-extrabold bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-300 disabled:opacity-40 transition-all"
            title="Copy preparation instructions"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-stone-600" />
                <span>Copy</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleClear}
            disabled={!instructionsText}
            className="p-2 rounded-xl text-stone-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 disabled:opacity-30 transition-all"
            title="Clear text"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Audio Recording Error */}
      {audioError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
          <Info className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span>{audioError}</span>
        </div>
      )}

      {/* Active Audio Voice Note Player Card */}
      {activeAccompaniment.voiceNoteUrl && (
        <div className="mt-3 p-4 bg-emerald-950 text-white rounded-2xl border border-emerald-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <audio
            ref={audioPlayerRef}
            src={activeAccompaniment.voiceNoteUrl}
            onTimeUpdate={handleAudioTimeUpdate}
            onEnded={handleAudioEnded}
            className="hidden"
          />

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={togglePlayAudio}
              className="w-10 h-10 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-emerald-950 flex items-center justify-center font-bold shadow-md transition-all shrink-0"
              title={isPlayingAudio ? 'Pause Voice Memo' : 'Play Voice Memo'}
            >
              {isPlayingAudio ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current ml-0.5" />
              )}
            </button>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold text-emerald-200 flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                  Voice Note Memo
                </span>
                <span className="text-[10px] bg-emerald-800/80 px-2 py-0.5 rounded-md text-emerald-300 font-mono">
                  {formatTimer(playbackTime)} / {formatTimer(audioDuration || 0)}
                </span>
              </div>
              <p className="text-[11px] text-emerald-100/70 mt-0.5">
                Spoken preparation instructions for {activeAccompaniment.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <a
              href={activeAccompaniment.voiceNoteUrl}
              download={`${activeAccompaniment.name.toLowerCase().replace(/\s+/g, '_')}_prep_note.webm`}
              className="p-2 rounded-xl bg-emerald-900/80 hover:bg-emerald-800 text-emerald-200 border border-emerald-700/60 transition-all"
              title="Download audio file"
            >
              <Download className="w-3.5 h-3.5" />
            </a>

            <button
              type="button"
              onClick={handleDeleteVoiceNote}
              className="p-2 rounded-xl bg-red-950/60 hover:bg-red-900 text-red-300 border border-red-800/50 transition-all"
              title="Delete voice note"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
