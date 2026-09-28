import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTelegram } from '../hooks/useTelegram';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { getTelegramUserId } from '../utils/telegram';
import TopBar from '../components/TopBar';

type L = 'uz' | 'ru' | 'en';

const WORK_TYPES: Record<L, string[]> = {
  uz: ['Mustaqil ish', 'Referat', 'Kurs ishi', 'Insho', 'Maqola', 'Tezis', 'Laboratoriya ishi', 'Amaliy ish', 'Hisobot'],
  ru: ['Самост. работа', 'Реферат', 'Курсовая', 'Эссе', 'Статья', 'Тезис', 'Лаб. работа', 'Практ. работа', 'Отчёт'],
  en: ['Independent work', 'Essay', 'Coursework', 'Essay', 'Article', 'Thesis', 'Lab work', 'Practical work', 'Report'],
};

const MINISTRY: Record<L, string> = {
  uz: "O'ZBEKISTON RESPUBLIKASI OLIY TA'LIM, FAN VA INNOVATSIYALAR VAZIRLIGI",
  ru: 'МИНИСТЕРСТВО ВЫСШЕГО ОБРАЗОВАНИЯ, НАУКИ И ИННОВАЦИЙ РЕСПУБЛИКИ УЗБЕКИСТАН',
  en: 'MINISTRY OF HIGHER EDUCATION, SCIENCE AND INNOVATION OF THE REPUBLIC OF UZBEKISTAN',
};

const TXT: Record<L, Record<string, string>> = {
  uz: {
    title: "Titul varag'i", subtitle: "Maydonlarni to'ldiring — pastdagi varaq o'sha zahoti o'zgaradi.",
    work: 'ISH', workType: 'Ish turi', topic: 'Mavzu', subject: 'Fan nomi — ixtiyoriy',
    inst: 'MUASSASA', university: 'Universitet — ixtiyoriy', faculty: 'Fakultet — ixtiyoriy', department: 'Kafedra — ixtiyoriy',
    people: 'KIMLAR', author: 'Bajardi — ixtiyoriy', group: 'Guruh — ixtiyoriy', advisor: 'Qabul qildi / Ilmiy rahbar — ixtiyoriy', teacherPos: "O'qituvchi lavozimi — ixtiyoriy", city: 'Shahar',
    border: 'Chetlariga ramka chizilsin', borderHint: "Rasmiy talab emas — ba'zi kafedralar so'raydi.",
    preview: 'SHUNDAY CHIQADI', price: 'Narx', free: 'Bepul', generate: 'Titul yaratish',
    sending: 'Yuborilmoqda…', sent: "✅ Titul varag'i Telegramга yuborildi!", topicPh: "Sun'iy intellektning ta'limdagi o'rni",
  },
  ru: {
    title: 'Титульный лист', subtitle: 'Заполните поля — лист ниже сразу меняется.',
    work: 'РАБОТА', workType: 'Тип работы', topic: 'Тема', subject: 'Предмет — необязательно',
    inst: 'УЧРЕЖДЕНИЕ', university: 'Университет — необязательно', faculty: 'Факультет — необязательно', department: 'Кафедра — необязательно',
    people: 'ЛЮДИ', author: 'Выполнил — необязательно', group: 'Группа — необязательно', advisor: 'Принял / Науч. рук. — необязательно', teacherPos: 'Должность — необязательно', city: 'Город',
    border: 'Нарисовать рамку', borderHint: 'Не обязательно — некоторые кафедры просят.',
    preview: 'ТАК БУДЕТ', price: 'Цена', free: 'Бесплатно', generate: 'Создать титул',
    sending: 'Отправка…', sent: '✅ Титульный лист отправлен в Telegram!', topicPh: 'Роль ИИ в образовании',
  },
  en: {
    title: 'Title page', subtitle: 'Fill the fields — the sheet below updates instantly.',
    work: 'WORK', workType: 'Work type', topic: 'Topic', subject: 'Subject — optional',
    inst: 'INSTITUTION', university: 'University — optional', faculty: 'Faculty — optional', department: 'Department — optional',
    people: 'PEOPLE', author: 'Done by — optional', group: 'Group — optional', advisor: 'Accepted by / Advisor — optional', teacherPos: 'Teacher position — optional', city: 'City',
    border: 'Draw a border', borderHint: 'Not required — some departments ask for it.',
    preview: 'PREVIEW', price: 'Price', free: 'Free', generate: 'Create title page',
    sending: 'Sending…', sent: '✅ Title page sent to Telegram!', topicPh: 'The role of AI in education',
  },
};

export default function TitlePage() {
  const navigate = useNavigate();
  const { webApp, haptic } = useTelegram();
  const { theme } = useTheme();
  const { language } = useLanguage();
  const L = (['uz', 'ru', 'en'].includes(language) ? language : 'uz') as L;
  const T = TXT[L];

  const [f, setF] = useState({
    workType: WORK_TYPES[L][0], topic: '', subject: '', university: '', faculty: '',
    department: '', author: '', group: '', advisor: '', teacherPosition: '', city: 'Toshkent', border: false,
  });
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');

  const telegramId = webApp?.initDataUnsafe?.user?.id || getTelegramUserId();
  const set = (k: string, v: string | boolean) => setF((p) => ({ ...p, [k]: v }));

  const authorLine = useMemo(
    () => (f.author ? `${f.author}${f.group ? ` (${f.group})` : ''}` : ''),
    [f.author, f.group],
  );

  const generate = async () => {
    if (!telegramId || status === 'sending') return;
    haptic('medium');
    setStatus('sending');
    try {
      const res = await fetch('/api/mini-app/title-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegramId, fields: { ...f, language: L } }),
      });
      if (!res.ok) throw new Error('failed');
      haptic('success');
      setStatus('sent');
    } catch {
      haptic('error');
      setStatus('idle');
    }
  };

  const field = (label: string, key: string, ph = '', textarea = false) => (
    <div>
      <label className="block text-sm font-bold mb-1.5">{label}</label>
      {textarea ? (
        <textarea
          value={(f as never)[key]}
          onChange={(e) => set(key, e.target.value)}
          placeholder={ph}
          rows={3}
          className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      ) : (
        <input
          value={(f as never)[key]}
          onChange={(e) => set(key, e.target.value)}
          placeholder={ph}
          className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      )}
    </div>
  );

  const card = 'rounded-2xl p-5 bg-white dark:bg-slate-800/70 border border-slate-100 dark:border-slate-700 space-y-4';
  const heading = 'text-xs font-bold tracking-widest text-purple-600 dark:text-purple-400';

  return (
    <div className={theme === 'dark' ? 'dark flex-1 flex flex-col overflow-hidden' : 'flex-1 flex flex-col overflow-hidden'}>
      <div className="flex-1 overflow-auto bg-slate-50 dark:bg-[#0b0f14] text-slate-900 dark:text-slate-100">
        <TopBar onBack={() => navigate('/')} />

        <div className="px-5 pb-40">
          <h1 className="text-3xl font-extrabold mt-1">{T.title}</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">{T.subtitle}</p>

          {/* ISH */}
          <div className={`${card} mt-5`}>
            <div className={heading}>{T.work}</div>
            <div>
              <label className="block text-sm font-bold mb-1.5">{T.workType}</label>
              <select
                value={f.workType}
                onChange={(e) => set('workType', e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {WORK_TYPES[L].map((w, i) => <option key={i} value={w}>{w}</option>)}
              </select>
            </div>
            {field(T.topic, 'topic', T.topicPh, true)}
            {field(T.subject, 'subject', 'Dasturlash asoslari')}
          </div>

          {/* MUASSASA */}
          <div className={`${card} mt-4`}>
            <div className={heading}>{T.inst}</div>
            {field(T.university, 'university', 'Andijon davlat universiteti')}
            {field(T.faculty, 'faculty', 'Fizika-matematika')}
            {field(T.department, 'department', 'Axborot texnologiyalari')}
          </div>

          {/* KIMLAR */}
          <div className={`${card} mt-4`}>
            <div className={heading}>{T.people}</div>
            {field(T.author, 'author', "Jo'raqo'zi")}
            {field(T.group, 'group', '101-guruh')}
            {field(T.advisor, 'advisor', 'Karimov B.')}
            {field(T.teacherPos, 'teacherPosition', "katta o'qituvchi")}
            {field(T.city, 'city', 'Toshkent')}
          </div>

          {/* Border */}
          <div className={`${card} mt-4`}>
            <button
              onClick={() => set('border', !f.border)}
              className="w-full flex items-center gap-3 text-left"
            >
              <span className={`w-6 h-6 rounded-md border-2 flex items-center justify-center ${f.border ? 'bg-purple-600 border-purple-600 text-white' : 'border-slate-300 dark:border-slate-600'}`}>
                {f.border && '✓'}
              </span>
              <span className="font-bold">{T.border}</span>
            </button>
            <p className="text-xs text-slate-500 dark:text-slate-400">{T.borderHint}</p>
          </div>

          {/* Preview */}
          <div className="mt-6">
            <div className="text-xs font-bold tracking-widest text-slate-400 mb-2">{T.preview}</div>
            <motion.div
              layout
              className={`bg-white text-black rounded-xl shadow-lg mx-auto aspect-[1/1.414] max-w-sm p-5 flex flex-col text-center ${f.border ? 'ring-2 ring-black/70 ring-inset' : ''}`}
              style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
            >
              <div className="text-[9px] font-bold leading-tight">{MINISTRY[L]}</div>
              {f.university && <div className="text-[9px] font-bold mt-1">{f.university}</div>}
              {f.faculty && <div className="text-[8px] mt-0.5">{f.faculty} {L === 'uz' ? 'FAKULTETI' : ''}</div>}
              {f.department && <div className="text-[8px]">{f.department} {L === 'uz' ? 'kafedrasi' : ''}</div>}

              <div className="flex-1 flex flex-col items-center justify-center">
                <div className="text-base font-extrabold tracking-[0.2em]">{(f.workType || '').toUpperCase()}</div>
                <div className="text-[10px] mt-2">
                  <span className="font-bold">{T.topic}:</span> <span className={f.topic ? '' : 'text-gray-400'}>{f.topic || T.topicPh}</span>
                </div>
              </div>

              <div className="text-right text-[9px] space-y-0.5 mb-2">
                {authorLine && <div><span className="font-bold">{L === 'uz' ? 'Bajardi:' : L === 'ru' ? 'Выполнил:' : 'Done by:'}</span> {authorLine}</div>}
                <div><span className="font-bold">{L === 'uz' ? 'Qabul qildi:' : L === 'ru' ? 'Принял:' : 'Accepted by:'}</span> {f.advisor || '______'}</div>
              </div>
              <div className="text-[9px] font-bold">{(f.city || 'Toshkent').toUpperCase()} — 2026</div>
            </motion.div>
          </div>
        </div>

        {/* Sticky bottom */}
        <div className="sticky bottom-0 px-5 py-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">{T.price}</div>
            <div className="text-2xl font-extrabold">{T.free}</div>
          </div>
          {status === 'sent' ? (
            <div className="text-emerald-600 dark:text-emerald-400 font-bold text-sm text-right max-w-[60%]">{T.sent}</div>
          ) : (
            <button
              onClick={generate}
              disabled={status === 'sending'}
              className="px-7 py-3.5 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold active:scale-95 transition-transform disabled:opacity-60"
            >
              {status === 'sending' ? T.sending : T.generate}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
