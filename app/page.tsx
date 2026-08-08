"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import questionBank from "../outputs/kerning-drill-question-bank.json";

type Level = "初級" | "中級" | "上級" | "超上級";
type DrillChoice = "おまかせ" | Level;
type Language = "英語" | "日本語";
type Pair = { index?: number; left: string; right: string; target: number; note: string; kind: "diagonal" | "round" | "tbar" | "kana" | "kanji" | "space" | "other" };
type Drill = { text: string; level: Level; pairs: Pair[] };
type HistoryEntry = { drill: Drill; values: number[]; accuracy: number; date: string };

const notes: Record<Pair["kind"], string> = {
  diagonal: "斜線同士には三角形の余白が生まれます。見かけの空白が均一になるまで、標準よりしっかり詰めます。",
  round: "丸い字形は輪郭が内側へ退くため、四角い字形よりも視覚的な余白が大きく見えます。少し詰めて整えます。",
  tbar: "Tの横棒が右側に空白を作ります。次の文字の形へ近づけ、横棒下の余白を落ち着かせます。",
  kana: "ひらがなは曲線が多く、文字ごとに見える余白が揺れます。輪郭の間だけでなく、単語全体のやわらかなリズムを見ます。",
  kanji: "漢字は文字面が四角に近く見えますが、画数や白場の量は異なります。隣り合う文字の黒みと余白が均一に見える位置を探します。",
  space: "単語間は文字間より明確に広く保ちつつ、語のかたまりが分断されない距離を探します。",
  other: "字形の外形と隣接する余白を比べ、文字列のリズムが均一に感じられる位置へ整えます。"
};

const seedDrills: Drill[] = [
  { text:"AVA", level:"初級", pairs:[{index:0,left:"A",right:"V",target:-78,note:notes.diagonal,kind:"diagonal"},{index:1,left:"V",right:"A",target:-72,note:notes.diagonal,kind:"diagonal"}] },
  { text:"TAT", level:"初級", pairs:[{index:0,left:"T",right:"A",target:-62,note:notes.tbar,kind:"tbar"},{index:1,left:"A",right:"T",target:-18,note:notes.tbar,kind:"tbar"}] },
  { text:"ToT", level:"初級", pairs:[{index:0,left:"T",right:"o",target:-48,note:notes.tbar,kind:"tbar"},{index:1,left:"o",right:"T",target:-8,note:notes.round,kind:"round"}] },
  { text:"YoY", level:"初級", pairs:[{index:0,left:"Y",right:"o",target:-58,note:notes.round,kind:"round"},{index:1,left:"o",right:"Y",target:-12,note:notes.round,kind:"round"}] },
  { text:"WAW", level:"初級", pairs:[{index:0,left:"W",right:"A",target:-42,note:notes.diagonal,kind:"diagonal"},{index:1,left:"A",right:"W",target:-25,note:notes.diagonal,kind:"diagonal"}] },
  { text:"TYPE", level:"中級", pairs:[{left:"T",right:"Y",target:-38,note:notes.tbar,kind:"tbar"},{left:"Y",right:"P",target:-30,note:notes.diagonal,kind:"diagonal"},{left:"P",right:"E",target:-12,note:notes.other,kind:"other"}] },
  { text:"LOGO", level:"中級", pairs:[{left:"L",right:"O",target:-18,note:notes.round,kind:"round"},{left:"O",right:"G",target:-8,note:notes.round,kind:"round"},{left:"G",right:"O",target:-13,note:notes.round,kind:"round"}] },
  { text:"VECTOR", level:"中級", pairs:[{left:"V",right:"E",target:-32,note:notes.diagonal,kind:"diagonal"},{left:"E",right:"C",target:-4,note:notes.round,kind:"round"},{left:"C",right:"T",target:-8,note:notes.tbar,kind:"tbar"},{left:"T",right:"O",target:-35,note:notes.tbar,kind:"tbar"},{left:"O",right:"R",target:-5,note:notes.round,kind:"round"}] },
  { text:"TYPOGRAPHY", level:"上級", pairs:[{left:"T",right:"Y",target:-38,note:notes.tbar,kind:"tbar"},{left:"Y",right:"P",target:-28,note:notes.diagonal,kind:"diagonal"},{left:"P",right:"O",target:-10,note:notes.round,kind:"round"},{left:"O",right:"G",target:-6,note:notes.round,kind:"round"},{left:"G",right:"R",target:-3,note:notes.round,kind:"round"},{left:"R",right:"A",target:-18,note:notes.diagonal,kind:"diagonal"},{left:"A",right:"P",target:-12,note:notes.diagonal,kind:"diagonal"},{left:"P",right:"H",target:-4,note:notes.other,kind:"other"},{left:"H",right:"Y",target:-18,note:notes.diagonal,kind:"diagonal"}] },
  { text:"Graphic Design Studio", level:"超上級", pairs:[{left:"G",right:"r",target:-5,note:notes.round,kind:"round"},{left:"c",right:" ",target:105,note:notes.space,kind:"space"},{left:" ",right:"D",target:85,note:notes.space,kind:"space"},{left:"n",right:" ",target:110,note:notes.space,kind:"space"},{left:" ",right:"S",target:90,note:notes.space,kind:"space"},{left:"t",right:"u",target:-12,note:notes.other,kind:"other"}] },
  { text:"Tokyo Coffee Stand", level:"超上級", pairs:[{left:"T",right:"o",target:-48,note:notes.tbar,kind:"tbar"},{left:"o",right:"k",target:-4,note:notes.round,kind:"round"},{left:"o",right:" ",target:105,note:notes.space,kind:"space"},{left:" ",right:"C",target:85,note:notes.space,kind:"space"},{left:"e",right:"e",target:-4,note:notes.round,kind:"round"},{left:"e",right:" ",target:108,note:notes.space,kind:"space"},{left:" ",right:"S",target:88,note:notes.space,kind:"space"}] }
];

const targetByPair: Record<string, number> = { AV:-78, VA:-72, AW:-30, WA:-42, TA:-62, AT:-18, To:-48, TY:-38, Yo:-58, YA:-45, VE:-32, VO:-38, LA:-18, LO:-18, OT:-22, TO:-35, WO:-22, OW:-18, PA:-12, RA:-18, " ":95 };
const diagonal = new Set(["A","V","W","Y"]);
const tbar = new Set(["T"]);
const round = new Set(["O","o","C","c","G","g","Q","q","D","d","e"]);
const hiragana = /[ぁ-ゖ]/;
const kanji = /[一-龠々]/;
const classify = (left:string,right:string): Pair["kind"] => left === " " || right === " " ? "space" : kanji.test(left) || kanji.test(right) ? "kanji" : hiragana.test(left) || hiragana.test(right) ? "kana" : tbar.has(left) ? "tbar" : diagonal.has(left) || diagonal.has(right) ? "diagonal" : round.has(left) || round.has(right) ? "round" : "other";
const japanesePairNote = (left: string, right: string, kind: Pair["kind"]) => {
  if (!hiragana.test(left) && !hiragana.test(right) && !kanji.test(left) && !kanji.test(right)) return notes[kind];
  if (/[がぎぐげござじずぜぞだぢづでどばびぶべぼぱぴぷぺぽ]/.test(left + right)) return "濁点・半濁点は文字の上側にも黒みをつくります。文字間だけでなく、上部の密度が詰まりすぎたり離れすぎたりしていないかを見ます。";
  if (/[ぁぃぅぇぉゃゅょっ]/.test(left + right)) return "小書き文字は小さいぶん、前後に白場が生まれやすくなります。文字面の大きさではなく、単語全体の流れが途切れない距離を探します。";
  if (kanji.test(left) && kanji.test(right)) return "漢字どうしは、画数と内側の白場の量を比べます。四角い文字面の端だけで測らず、並んだときの黒みが均一に見えるよう整えます。";
  if (kanji.test(left) && hiragana.test(right)) return "漢字の強い黒みに、やわらかなひらがなが続きます。漢字側の密度に引っ張られすぎず、語尾が自然にほどける余白を保ちます。";
  if (hiragana.test(left) && kanji.test(right)) return "ひらがなの曲線から、文字面の大きい漢字へ切り替わります。境目だけが空いて見えないよう、次の漢字の黒みまで含めて観察します。";
  if (/[あおこすなぬのはほまもゆよろわ]/.test(left) && /[あおこすなぬのはほまもゆよろわ]/.test(right)) return "曲線の多いひらがなどうしは、実際の距離より白場がふくらんで見えます。輪郭の最も近い場所だけでなく、内側の空きも比べます。";
  if (/[いうけせたちにねひへめりれ]/.test(left + right)) return "縦線や直線を含むひらがなは、曲線だけの文字より間隔が硬く見えます。線の向きによる白場の偏りをならします。";
  if (/[ん]/.test(left + right)) return "「ん」は終わりへ向かう丸い量感を持つ文字です。前後を機械的に均等にせず、単語の終わり方が自然に見える余白を探します。";
  return "ひらがなは曲線が多く、文字ごとに見える余白が揺れます。輪郭の間だけでなく、単語全体のやわらかなリズムを見ます。";
};
const englishPairNote = (left: string, right: string, kind: Pair["kind"]) => {
  if (kind === "space") return notes.space;
  if (tbar.has(left)) return "Tの横棒は次の文字の上に大きな白場をつくります。横棒の端と次の字形が離れて見えすぎないよう、下側だけでなく上側の余白も見ます。";
  if (diagonal.has(left) && diagonal.has(right)) return "斜線どうしは三角形の空白をつくるため、数値以上に離れて見えます。斜線の最も近い部分だけでなく、内側へ広がる白場を詰めます。";
  if (diagonal.has(left) || diagonal.has(right)) return "斜線と直線・丸文字の組み合わせは、片側だけに白場が偏ります。文字の中心ではなく、向かい合う輪郭の量感がそろう位置を探します。";
  if (round.has(left) && round.has(right)) return "丸文字どうしは輪郭が内側へ退くため、同じ数値でも広く感じられます。外側の端ではなく、丸みが最も近づく部分の余白を比べます。";
  if (round.has(left) || round.has(right)) return "丸文字と直線的な文字では、左右の余白の性格が異なります。直線の端に合わせるのではなく、丸い輪郭がつくる見かけの空白を整えます。";
  if (/[ILHENF]/.test(left + right)) return "縦線を中心に持つ文字どうしは、隙間が硬く、機械的に見えやすい組み合わせです。黒い線の間隔だけでなく、単語のリズムが均一かを確認します。";
  if (/[a-z]/.test(left) !== /[a-z]/.test(right)) return "大文字と小文字では文字面の高さと黒みが変わります。ベースライン付近だけで測らず、上部まで含めた文字の量感をそろえます。";
  if (/[gjpqy]/.test(left + right)) return "ディセンダーを持つ小文字は、下へ伸びる線が隣接する余白の印象を変えます。下部の動きが窮屈にならないかも見ながら整えます。";
  return "字形の外形と隣接する余白を比べ、文字列のリズムが均一に感じられる位置へ整えます。";
};
const createDrill = (text:string, level:Level): Drill => ({ text, level, pairs:Array.from({length:text.length-1},(_,index) => { const left=text[index], right=text[index+1], kind=classify(left,right); const pair=left+right; const fallback=kind === "space" ? 95 : kind === "diagonal" ? -24 : kind === "tbar" ? -28 : kind === "round" ? -8 : kind === "kana" ? -10 : kind === "kanji" ? -6 : 0; const containsJapanese = hiragana.test(left) || hiragana.test(right) || kanji.test(left) || kanji.test(right); return { index,left,right,target:targetByPair[pair] ?? fallback,note:containsJapanese ? japanesePairNote(left,right,kind) : englishPairNote(left,right,kind),kind }; }) });
const englishDrills: Drill[] = [
  ...questionBank.beginner.map(text => createDrill(text,"初級")),
  ...questionBank.intermediate.map(text => createDrill(text,"中級")),
  ...questionBank.advanced.map(text => createDrill(text,"上級")),
  ...questionBank.expert.map(text => createDrill(text,"超上級"))
];
const japaneseDrills: Drill[] = [
  ...questionBank.japanese.beginner.map(text => createDrill(text,"初級")),
  ...questionBank.japanese.intermediate.map(text => createDrill(text,"中級")),
  ...questionBank.japanese.advanced.map(text => createDrill(text,"上級")),
  ...questionBank.japanese.expert.map(text => createDrill(text,"超上級"))
];
const levelOrder: Level[] = ["初級", "中級", "上級", "超上級"];
const chooseThree = (pool: Drill[]) => [...pool].sort(() => Math.random() - 0.5).slice(0, 3);
const randomInitialKerning = () => Math.round((Math.random() * 50) / 5) * 5;
const localDateKey = () => { const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`; };

const englishFonts = ["Lato", "Poppins", "Libre Baskerville", "Albert Sans"];
const japaneseFonts = ["Noto Sans JP", "Zen Kaku Gothic New", "BIZ UDPMincho", "Shippori Mincho"];
const metricTargetsForFont = (item: Drill, font: string) => {
  if (typeof document === "undefined") return Array(item.text.length - 1).fill(0);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) return Array(item.text.length - 1).fill(0);
  context.font = `1000px "${font}"`;
  return Array.from({ length: item.text.length - 1 }, (_, index) => {
    const pair = `${item.text[index]}${item.text[index + 1]}`;
    if (pair.includes(" ")) return pairAt(item, index).target;
    context.fontKerning = "none";
    const withoutKerning = context.measureText(pair).width;
    context.fontKerning = "normal";
    const withKerning = context.measureText(pair).width;
    return Math.round(withKerning - withoutKerning);
  });
};
const pairAt = (drill: Drill, index: number) => drill.pairs.find(p => (p.index ?? drill.text.indexOf(p.left + p.right)) === index) ?? { index, left:drill.text[index], right:drill.text[index + 1], target:0, note:notes.other, kind:"other" as const };

export default function KerningDrill() {
  const [screen, setScreen] = useState<"home"|"drill"|"result">("home");
  const [language, setLanguage] = useState<Language>("英語");
  const [drill, setDrill] = useState<Drill>(englishDrills[0]);
  const [choice, setChoice] = useState<DrillChoice>("おまかせ");
  const [guidedQueue, setGuidedQueue] = useState<Drill[]>([]);
  const [guidedIndex, setGuidedIndex] = useState(0);
  const [isReview, setIsReview] = useState(false);
  const [font, setFont] = useState(englishFonts[0]);
  const [values, setValues] = useState<number[]>([]);
  const [touchedPairs, setTouchedPairs] = useState<boolean[]>([]);
  const [metricTargets, setMetricTargets] = useState<number[]>([]);
  const [selected, setSelected] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [showMetrics, setShowMetrics] = useState(false);
  const [comparison, setComparison] = useState(0);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [customTargets, setCustomTargets] = useState<Record<string, number[]>>({});
  const [caretVisible, setCaretVisible] = useState(false);
  const drag = useRef<{x:number; value:number} | null>(null);
  const activeDrills = language === "英語" ? englishDrills : japaneseDrills;
  const availableFonts = language === "英語" ? englishFonts : japaneseFonts;
  const reviewableHistory = history.filter(item => (language === "日本語") === /[ぁ-んァ-ヶ一-龠々]/.test(item.drill.text) && item.accuracy < 90);
  const isFixedSpace = (index: number, item: Drill = drill) => item.text[index] === " " || item.text[index + 1] === " ";
  const firstEditablePair = (item: Drill) => Array.from({ length: item.text.length - 1 }, (_, index) => index).find(index => !isFixedSpace(index, item)) ?? 0;

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("kerning-drill-custom-targets");
      if (saved) setCustomTargets(JSON.parse(saved));
      const savedHistory = window.localStorage.getItem("kerning-drill-history");
      if (savedHistory) setHistory(JSON.parse(savedHistory).map((entry: HistoryEntry) => ({ ...entry, date: entry.date ?? localDateKey() })));
    } catch { /* 保存できない環境では通常の正解を使う */ }
  }, []);
  useEffect(() => {
    let cancelled = false;
    const measure = () => {
      if (!cancelled) setMetricTargets(metricTargetsForFont(drill, font));
    };
    if (typeof document !== "undefined" && document.fonts) {
      document.fonts.load(`1000px "${font}"`, drill.text).then(measure).catch(measure);
    } else {
      measure();
    }
    return () => { cancelled = true; };
  }, [drill, font]);
  const init = (next: Drill) => {
    setDrill(next);
    setValues(Array.from({ length: next.text.length - 1 }, (_, index) => isFixedSpace(index, next) ? pairAt(next, index).target : randomInitialKerning()));
    setTouchedPairs(Array.from({ length: next.text.length - 1 }, () => false));
    setSelected(firstEditablePair(next));
    setCaretVisible(true);
    setShowAnswer(false);
    setShowMetrics(false);
    setComparison(0);
    setScreen("drill");
  };
  const start = (nextChoice: DrillChoice = choice) => {
    setChoice(nextChoice);
    setIsReview(false);
    if (nextChoice === "おまかせ") {
      const queue = levelOrder.flatMap(level => chooseThree(activeDrills.filter(item => item.level === level)));
      setGuidedQueue(queue);
      setGuidedIndex(0);
      init(queue[0]);
      return;
    }
    const pool = activeDrills.filter(item => item.level === nextChoice);
    init(pool[Math.floor(Math.random() * pool.length)]);
  };
  const startReview = () => {
    const seen = new Set<string>();
    const queue = [...reviewableHistory].sort((a, b) => a.accuracy - b.accuracy).map(item => item.drill).filter(item => {
      const key = `${item.level}:${item.text}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 12);
    if (!queue.length) return;
    setIsReview(true);
    setGuidedQueue(queue);
    setGuidedIndex(0);
    init(queue[0]);
  };
  const customTargetKey = `${language}:${font}:${drill.text}`;
  const targets = useMemo(() => customTargets[customTargetKey]?.length === drill.text.length - 1 ? customTargets[customTargetKey] : metricTargets.length === drill.text.length - 1 ? metricTargets : Array(drill.text.length - 1).fill(0), [drill, metricTargets, customTargets, customTargetKey]);
  const saveCurrentAnswerAsTarget = () => {
    const next = { ...customTargets, [customTargetKey]: [...values] };
    setCustomTargets(next);
    try { window.localStorage.setItem("kerning-drill-custom-targets", JSON.stringify(next)); } catch { /* 画面内では反映済み */ }
  };
  const restoreTeachingTarget = () => {
    const next = { ...customTargets };
    delete next[customTargetKey];
    setCustomTargets(next);
    try { window.localStorage.setItem("kerning-drill-custom-targets", JSON.stringify(next)); } catch { /* 画面内では反映済み */ }
  };
  const resetAllCustomTargets = () => {
    if (!window.confirm("保存した自分の正解をすべて削除し、メトリクス基準へ戻します。よろしいですか？")) return;
    setCustomTargets({});
    try { window.localStorage.removeItem("kerning-drill-custom-targets"); } catch { /* 画面内では反映済み */ }
  };
  const exportCustomTargets = () => {
    const payload = { app: "Kerning Drill", exportedAt: new Date().toISOString(), targets: customTargets };
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "kerning-drill-my-answers.json";
    link.click();
    URL.revokeObjectURL(url);
  };
  const activatePair = (index: number) => { setSelected(index); setCaretVisible(true); };
  const accuracy = useMemo(() => Math.max(0, 100 - values.reduce((a,v,i)=>a+Math.min(100,Math.abs(v-targets[i]))/targets.length,0)*0.72),[values,targets]);
  const update = (index:number, value:number) => {
    if (index < 0 || index >= values.length || isFixedSpace(index)) return;
    setCaretVisible(true);
    setValues(v=>v.map((x,i)=>i===index?Math.max(-150,Math.min(180,Math.round(value))):x));
    setTouchedPairs(touched => touched.map((wasTouched, i) => i === index ? true : wasTouched));
  };
  useEffect(() => { const handler=(e:KeyboardEvent)=>{ if(screen!=="drill" || !["ArrowLeft","ArrowRight"].includes(e.key)) return; e.preventDefault(); if(e.altKey) { update(selected, values[selected]+(e.key==="ArrowLeft"?-10:10)); return; } const direction=e.key==="ArrowLeft"?-1:1; setCaretVisible(true); setSelected(current => { let next=current+direction; while(next>=0 && next<values.length && isFixedSpace(next)) next+=direction; return Math.max(-1,Math.min(values.length,next)); }); }; window.addEventListener("keydown",handler); return()=>window.removeEventListener("keydown",handler); });
  useEffect(() => {
    if (screen !== "drill" || !caretVisible) return;
    const timer = window.setTimeout(() => setCaretVisible(false), 1000);
    return () => window.clearTimeout(timer);
  }, [screen, selected, values, caretVisible]);
  const submit = () => { const entry = { drill, values, accuracy, date: localDateKey() }; setHistory(h => { const next = [...h, entry]; try { window.localStorage.setItem("kerning-drill-history", JSON.stringify(next)); } catch { /* 保存できない環境では画面内の履歴を使う */ } return next; }); setScreen("result"); };
  const goHome = () => { setScreen("home"); setShowAnswer(false); setShowMetrics(false); setCaretVisible(false); };
  const next = () => {
    if (choice === "おまかせ" && guidedIndex < guidedQueue.length - 1) {
      const nextIndex = guidedIndex + 1;
      setGuidedIndex(nextIndex);
      init(guidedQueue[nextIndex]);
      return;
    }
    if (choice === "おまかせ" || isReview) { start("おまかせ"); return; }
    start(choice);
  };
  const renderedValues = screen === "result" ? values.map((v,i)=> v+(targets[i]-v)*(comparison/100)) : values;
  const trouble = history.length ? ["斜線の組み合わせ", "T系の横棒", "右側を詰めすぎる傾向"].slice(0,Math.min(3,history.length+1)) : [];
  const learningDay = Math.max(1, new Set(history.map(item => item.date)).size);

  return <main className="min-h-screen px-5 py-5 sm:px-10 sm:py-8">
    <header className="mx-auto flex max-w-6xl items-center border-b pb-4 hairline"><button onClick={goHome} aria-label="ホームへ戻る" className="flex items-center gap-3"><span className="grid h-7 w-7 place-items-center rounded-md bg-[#171719] text-sm font-semibold text-white">K</span><span className="text-[15px] font-medium tracking-[-.01em]">Kerning Drill</span></button></header>
    {screen === "home" && <section className="mx-auto grid max-w-6xl gap-10 py-10 lg:min-h-[calc(100vh-92px)] lg:grid-cols-[1.25fr_.75fr] lg:items-center lg:py-12">
      <div>
        <p className="mb-5 text-xs font-medium tracking-[.14em] text-[#6e6e73]">DAILY TYPOGRAPHY PRACTICE</p>
        <h1 className="max-w-3xl text-6xl font-medium leading-[.95] tracking-[-.065em] sm:text-8xl">Kerning Drill</h1>
        <p className="mt-5 max-w-md text-sm leading-6 text-[#6e6e73]">文字間の見え方と字形がつくる余白を観察し、カーニング力を鍛える5分間のドリル。</p>
        <div className="mt-6"><p className="mb-3 text-xs font-medium text-[#6e6e73]">文字を選ぶ</p><div className="flex gap-2">{(["英語","日本語"] as Language[]).map(item=><button key={item} onClick={()=>{ setLanguage(item); setFont(item === "英語" ? englishFonts[0] : japaneseFonts[0]); }} className={`border px-4 py-2 text-sm hairline ${language===item?"border-[#171719] bg-[#171719] text-white":"bg-white text-[#505055]"}`}>{item}</button>)}</div><p className="mt-3 text-xs text-[#6e6e73]">{language === "日本語" ? "初級・中級はひらがなのみ。上級から漢字まじりの語句を扱います。" : "英字の字形による余白と、単語全体のリズムを見ます。"}</p></div>
        <div className="mt-7 max-w-xl"><p className="mb-3 text-xs font-medium text-[#6e6e73]">フォントを選ぶ</p><div className="flex flex-wrap gap-2">{availableFonts.map(item=><button key={item} onClick={()=>setFont(item)} style={{fontFamily:item}} className={`border px-4 py-2 text-sm hairline ${font===item ? "border-[#171719] bg-[#171719] text-white" : "bg-white text-[#505055]"}`}>{item}</button>)}</div><p style={{fontFamily:font,fontKerning:"normal"}} className="mt-5 text-4xl leading-none tracking-[-.035em]">{language === "英語" ? "Abcdef" : "あいうえお"}</p><p className="mt-4 text-xs text-[#6e6e73]">初級 → 中級 → 上級 → 超上級を、各3問ずつ出題します。</p></div>
        <div className="mt-6 flex flex-wrap gap-3"><button onClick={()=>start("おまかせ")} className="bg-[#171719] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#3d3d3f]">ドリルを始める <span className="ml-5 text-[#b4b4b8]">⌘ ↵</span></button>{reviewableHistory.length > 0 && <button onClick={startReview} className="border px-5 py-3 text-sm font-medium hairline">苦手を復習</button>}</div>{Object.keys(customTargets).length > 0 && <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2"><button onClick={exportCustomTargets} className="text-xs text-[#6e6e73] underline underline-offset-4">自分の正解を出力</button><button onClick={resetAllCustomTargets} className="text-xs text-[#6e6e73] underline underline-offset-4">自分の正解をすべてメトリクスに戻す</button></div>}
      </div>
      <div className="border-l pl-8 hairline"><p className="text-xs font-medium text-[#6e6e73]">今日のフォーカス</p><div className={`mt-7 text-7xl ${language === "英語" ? "font-[Georgia] tracking-[-.1em]" : "font-sans tracking-[-.04em]"}`}>{language === "英語" ? "AV" : "あさひ"}</div><p className="mt-7 text-sm leading-6 text-[#6e6e73]">{language === "英語" ? "斜線の間には、実際の距離より大きく見える三角形の空白があります。" : "ひらがなは曲線が多く、字形によって余白の見え方がゆっくり変化します。"}</p><div className="mt-12 border-t pt-5 hairline"><p className="text-xs text-[#6e6e73]">学習履歴</p><p className="mt-2 text-2xl tracking-[-.03em]">DAY {learningDay}</p>{trouble.length>0&&<p className="mt-4 text-xs text-[#6e6e73]">復習候補：{trouble.join(" · ")}</p>}</div></div>
    </section>}
    {screen !== "home" && <section className="mx-auto max-w-6xl py-9"><div className="flex items-center justify-between"><div><p className="text-xs font-medium tracking-[.12em] text-[#6e6e73]">{isReview ? "復習" : drill.level} · DRILL　{guidedIndex + 1}/{guidedQueue.length || 12}</p><h2 className="mt-1 text-xl font-medium tracking-[-.03em]">余白を見ながら、文字を選択</h2></div><p className="text-xs text-[#6e6e73]">フォント　<span className="text-[#171719]">{font}</span></p></div>
      <div className="mt-8 min-h-[390px] border-y py-16 hairline"><div className="overflow-x-auto px-2 text-center"><div className="relative inline-block text-left"><KerningText text={drill.text} values={renderedValues} font={font} selected={selected} onSelect={activatePair} drag={drag} update={update} isFixedSpace={isFixedSpace} caretVisible={screen === "drill" && caretVisible} faded={screen==="result" && comparison>0} />{(screen==="result" || showMetrics) && <div className="pointer-events-none absolute left-0 top-0 opacity-85"><KerningText text={drill.text} values={targets} font={font} selected={-1} onSelect={()=>{}} drag={drag} update={()=>{}} isFixedSpace={isFixedSpace} caretVisible={false} blue /></div>}</div></div></div>
      {screen === "drill" && <div className="mt-5 flex flex-wrap items-center gap-3"><button onClick={()=>setShowMetrics(!showMetrics)} className="border px-4 py-2 text-sm font-medium hairline">{showMetrics ? "メトリクスを隠す" : "メトリクスを見る"}</button>{showMetrics && selected >= 0 && selected < targets.length && <p className="text-xs text-[#146ef5]">メトリクス　{targets[selected] > 0 ? "+" : ""}{targets[selected]} /1000 em</p>}</div>}
      {screen === "drill" ? <div className="mt-7 flex flex-col justify-between gap-7 sm:flex-row sm:items-end"><div>{selected < 0 || selected >= values.length ? <div className="text-sm text-[#6e6e73]">{selected < 0 ? "単語の先頭" : "単語の末尾"}　<span className="text-xs">この位置ではカーニングできません</span></div> : <><div className="flex items-center gap-3 text-sm"><span className="font-medium">{`${drill.text[selected]}${drill.text[selected+1]}`}</span><span className="font-mono text-[#6e6e73]">{touchedPairs[selected] ? <>{values[selected] > 0 ? "+" : ""}{values[selected]}</> : "—"}</span><span className="text-xs text-[#6e6e73]">/1000 em</span></div><div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4"><input className="track" type="range" min="-150" max="180" value={values[selected]} onChange={e=>update(selected,+e.target.value)} /><span className="hidden text-xs text-[#6e6e73] sm:inline">または <span className="key">⌥</span> + <span className="key">←</span><span className="key">→</span><span className="ml-2">単語間スペースは固定</span></span><span className="text-xs leading-5 text-[#6e6e73] sm:hidden">文字間をタップして、スライダーまたは左右ドラッグで調整</span></div></>}</div><button onClick={submit} className="bg-[#171719] px-5 py-3 text-sm font-medium text-white">採点する <span className="ml-5 text-[#b4b4b8]">→</span></button></div> : <Result drill={drill} values={values} targets={targets} accuracy={accuracy} comparison={comparison} setComparison={setComparison} showAnswer={showAnswer} setShowAnswer={setShowAnswer} next={next} saveCurrentAnswerAsTarget={saveCurrentAnswerAsTarget} restoreTeachingTarget={restoreTeachingTarget} hasCustomTarget={Boolean(customTargets[customTargetKey])} />}</section>}
  </main>;
}

function KerningText({text,values,font,selected,onSelect,drag,update,isFixedSpace,caretVisible,blue=false,faded=false}:{text:string;values:number[];font:string;selected:number;onSelect:(n:number)=>void;drag:React.MutableRefObject<{x:number;value:number}|null>;update:(n:number,v:number)=>void;isFixedSpace:(index:number)=>boolean;caretVisible:boolean;blue?:boolean;faded?:boolean}) { const isJapanese = /[ぁ-んァ-ヶ一-龠々]/.test(text); return <div aria-label="Kerning canvas" style={{fontFamily:font,color:blue?"#146ef5":"#171719",opacity:faded?.22:1}} className={`inline-block whitespace-nowrap text-[clamp(56px,11vw,130px)] font-medium leading-none ${isJapanese ? "tracking-normal" : "tracking-[-.055em]"}`}>{[...text].map((ch,i)=>{const fixed=i>=text.length-1 || isFixedSpace(i);const atStart=selected===-1&&i===0;const atEnd=selected===values.length&&i===text.length-1;return <span key={i} className={`char ${selected===i&&!blue&&!fixed?"active":""}`} style={{marginRight:i<text.length-1?`${values[i]/1000}em`:0, transition:"margin-right .4s cubic-bezier(.2,.8,.2,1)"}} onClick={()=>!blue&&!fixed&&onSelect(i)} onPointerDown={e=>{if(blue||fixed)return; onSelect(i); drag.current={x:e.clientX,value:values[i]}; e.currentTarget.setPointerCapture(e.pointerId)}} onPointerMove={e=>{if(!drag.current||blue||fixed)return; update(i,drag.current.value+(e.clientX-drag.current.x)*1.3)}} onPointerUp={()=>drag.current=null}>{ch===" "?" ":ch}{selected===i&&!blue&&!fixed&&caretVisible&&<span className="kerning-caret" style={{transform:`translateX(${values[i]/2000}em)`}} />}{!blue&&caretVisible&&atStart&&<span className="kerning-caret" style={{left:0,right:"auto"}} />}{!blue&&caretVisible&&atEnd&&<span className="kerning-caret" />}</span>})}</div> }

function Result({drill,values,targets,accuracy,comparison,setComparison,showAnswer,setShowAnswer,next,saveCurrentAnswerAsTarget,restoreTeachingTarget,hasCustomTarget}:{drill:Drill;values:number[];targets:number[];accuracy:number;comparison:number;setComparison:(v:number)=>void;showAnswer:boolean;setShowAnswer:(v:boolean)=>void;next:()=>void;saveCurrentAnswerAsTarget:()=>void;restoreTeachingTarget:()=>void;hasCustomTarget:boolean}) { return <div className="mt-7"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center"><div><p className="text-xs font-medium tracking-[.12em] text-[#6e6e73]">ACCURACY</p><p className="mt-1 text-4xl font-medium tracking-[-.05em]">{accuracy.toFixed(1)}<span className="ml-1 text-xl">%</span></p></div><div className="flex flex-wrap gap-3"><button onClick={saveCurrentAnswerAsTarget} className="border px-4 py-2.5 text-sm hairline">{hasCustomTarget?"この回答を正解として更新":"この回答を正解にする"}</button>{hasCustomTarget&&<button onClick={restoreTeachingTarget} className="border px-4 py-2.5 text-sm hairline">教材の正解に戻す</button>}<button onClick={()=>setShowAnswer(!showAnswer)} className="border px-4 py-2.5 text-sm hairline">{showAnswer?"解説を閉じる":"解説を見る"}</button><button onClick={next} className="bg-[#171719] px-4 py-2.5 text-sm text-white">次のドリル →</button></div></div><p className="mt-3 text-xs text-[#6e6e73]">保存した正解は、このブラウザで次回以降の同じ問題に使われます。</p><div className="mt-7 border-t pt-6 hairline"><div className="flex max-w-sm items-center gap-4"><span className="text-xs">あなた</span><input className="track flex-1" type="range" value={comparison} onChange={e=>setComparison(+e.target.value)} /><span className="text-xs text-[#146ef5]">正解</span></div><p className="mt-3 text-xs text-[#6e6e73]">左端とベースラインを固定し、黒：あなたを青：正解へ補間</p></div>{showAnswer&&<div className="mt-8 grid gap-x-12 gap-y-6 border-t pt-7 hairline md:grid-cols-2">{drill.pairs.map((p,i)=>{const pos=p.index ?? drill.text.indexOf(p.left+p.right);const v=values[pos]??0;const target=targets[pos]??p.target;return <article key={i}><div className="flex items-baseline gap-4"><h3 className="text-lg font-medium">{p.left === " "?"Space":p.left}{p.right === " "?" Space":p.right}</h3><span className="font-mono text-xs text-[#6e6e73]">あなた {v>0?"+":""}{v}　正解 {target>0?"+":""}{target}　差分 {v-target>0?"+":""}{v-target}</span></div><p className="mt-2 max-w-md text-sm leading-6 text-[#6e6e73]">{p.note}</p></article>})}</div>}</div>}
