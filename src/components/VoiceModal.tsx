import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, X, Plus, Search, AlertCircle, Volume2 } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { getTranslation } from '../i18n/translations';

interface VoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct: (name: string, action: 'add' | 'search') => void;
}

export const VoiceModal: React.FC<VoiceModalProps> = ({ isOpen, onClose, onSelectProduct }) => {
  const { profile } = useShop();
  const lang = profile?.language || 'hi';
  const t = getTranslation(lang);

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  // Map app language to SpeechRecognition BCP-47 tag
  const speechLang = lang === 'hi' ? 'hi-IN' : lang === 'pa' ? 'pa-IN' : 'en-IN';

  useEffect(() => {
    if (!isOpen) {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      setIsListening(false);
      setTranscript('');
      setErrorMessage(null);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      setErrorMessage(t.voiceUnsupported);
      return;
    }

    setIsSupported(true);
    try {
      const recognition = new SpeechRecognition();
      recognition.lang = speechLang;
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
        setErrorMessage(null);
      };

      recognition.onresult = (event: any) => {
        const current = event.resultIndex;
        const text = event.results[current][0].transcript;
        setTranscript(text);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setErrorMessage(
            lang === 'hi'
              ? 'माइक की अनुमति नहीं मिली। कृपया ब्राउज़र सेटिंग्स में अनुमति दें।'
              : lang === 'pa'
              ? 'ਮਾਈਕ ਦੀ ਇਜਾਜ਼ਤ ਨਹੀਂ ਮਿਲੀ। ਬ੍ਰਾਊਜ਼ਰ ਸੈਟਿੰਗਜ਼ ਵਿੱਚ ਇਜਾਜ਼ਤ ਦਿਓ।'
              : 'Microphone access was denied. Please allow microphone permissions in browser settings.'
          );
        } else if (event.error === 'no-speech') {
          setErrorMessage(
            lang === 'hi'
              ? 'आवाज़ सुनाई नहीं दी। माइक दबाकर दोबारा बोलें।'
              : lang === 'pa'
              ? 'ਕੋਈ ਆਵਾਜ਼ ਨਹੀਂ ਸੁਣੀ। ਮਾਈਕ ਦਬਾ ਕੇ ਦੁਬਾਰਾ ਬੋਲੋ।'
              : 'No voice detected. Please tap mic and speak again.'
          );
        } else {
          setErrorMessage(
            lang === 'hi'
              ? 'माइक बंद हुआ। लिखकर या माइक दबाकर फिर कोशिश करें।'
              : lang === 'pa'
              ? 'ਮਾਈਕ ਬੰਦ ਹੋਇਆ। ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ।'
              : 'Listening ended. You can type or tap mic to try again.'
          );
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error('Failed to init speech recognition:', err);
      setIsListening(false);
      setErrorMessage(
        lang === 'hi'
          ? 'माइक शुरू नहीं हो सका।'
          : lang === 'pa'
          ? 'ਮਾਈਕ ਸ਼ੁਰੂ ਨਹੀਂ ਹੋ ਸਕਿਆ।'
          : err?.message || 'Could not start speech recognition.'
      );
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [isOpen, speechLang]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      setErrorMessage(null);
      try {
        recognitionRef.current?.start();
      } catch (e) {
        // restart instance if needed
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-2xl border border-[#E4DFD2] relative flex flex-col items-center text-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 p-1.5 rounded-full text-[#726C60] hover:bg-[#E7F0EA] hover:text-[#1E4632] transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-2 mb-1 text-[#1E4632]">
          <Volume2 className="w-5 h-5 text-[#2F6B4F]" />
          <h3 className="font-bold text-base text-[#1E4632]">
            {lang === 'hi' ? 'बोलकर सामान खोजें या जोड़ें' : lang === 'pa' ? 'ਬੋਲ ਕੇ ਸਮਾਨ ਲੱਭੋ ਜਾਂ ਜੋੜੋ' : 'Voice Input'}
          </h3>
        </div>
        <p className="text-xs text-[#726C60] mb-6">
          {isListening ? t.voiceListening : t.voicePrompt}
        </p>

        {/* Mic Pulse Animation */}
        <div className="relative mb-6 flex items-center justify-center">
          {isListening && (
            <>
              <div className="absolute w-24 h-24 rounded-full bg-[#E7F0EA] animate-ping opacity-60" />
              <div className="absolute w-20 h-20 rounded-full bg-[#2F6B4F]/20 animate-pulse" />
            </>
          )}

          <button
            onClick={toggleListening}
            className={`w-16 h-16 rounded-full flex items-center justify-center shadow-md transition-transform active:scale-95 cursor-pointer relative z-10 ${
              isListening
                ? 'bg-[#C1443B] text-white hover:bg-[#a93a32]'
                : 'bg-[#1E4632] text-white hover:bg-[#2F6B4F]'
            }`}
            aria-label={isListening ? 'Stop listening' : 'Start listening'}
          >
            {isListening ? <Mic className="w-8 h-8 animate-bounce" /> : <Mic className="w-8 h-8" />}
          </button>
        </div>

        {/* Transcript text box */}
        <div className="w-full mb-4">
          <label className="block text-[11px] font-medium text-[#726C60] text-left mb-1">
            {lang === 'hi' ? 'पहचाना गया नाम (ज़रूरत हो तो बदलें):' : lang === 'pa' ? 'ਸੁਣਿਆ ਗਿਆ ਨਾਂ:' : 'Recognized Item Name:'}
          </label>
          <input
            type="text"
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder={
              lang === 'hi'
                ? 'जैसे: अमूल दूध, पारले जी, साबुन...'
                : lang === 'pa'
                ? 'ਜਿਵੇਂ: ਅਮੂਲ ਦੁੱਧ, ਪਾਰਲੇ ਜੀ, ਸਾਬਣ...'
                : 'e.g. Amul Milk, Parle-G, Dettol Soap...'
            }
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#E4DFD2] bg-[#FAF7F0] text-sm font-semibold text-[#262421] text-center focus:border-[#1E4632] focus:bg-white focus:outline-hidden"
          />
        </div>

        {/* Error / Instruction feedback */}
        {errorMessage && (
          <div className="flex items-center gap-1.5 text-[11px] text-[#C1443B] mb-4 bg-[#F8E6E4] px-2.5 py-1.5 rounded-lg w-full text-left">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 w-full mt-1">
          <button
            disabled={!transcript.trim()}
            onClick={() => {
              if (transcript.trim()) {
                onSelectProduct(transcript.trim(), 'search');
                onClose();
              }
            }}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-[#2F6B4F] text-[#2F6B4F] text-xs font-bold hover:bg-[#E7F0EA] disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer"
          >
            <Search className="w-4 h-4" />
            <span>{lang === 'hi' ? 'स्टॉक में खोजें' : lang === 'pa' ? 'ਸਟਾਕ \'ਚ ਲੱਭੋ' : 'Search Stock'}</span>
          </button>

          <button
            disabled={!transcript.trim()}
            onClick={() => {
              if (transcript.trim()) {
                onSelectProduct(transcript.trim(), 'add');
                onClose();
              }
            }}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-[#1E4632] text-white text-xs font-bold hover:bg-[#2F6B4F] disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>{lang === 'hi' ? 'सीधा जोड़ें' : lang === 'pa' ? 'ਸਿੱਧਾ ਜੋੜੋ' : 'Add to Stock'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
