"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import questionBank from "../outputs/kerning-drill-question-bank.json";

type Level = "初級" | "中級" | "上級" | "超上級";
type DrillChoice = "ランダム" | Level;
type Pair = { index?: number; left: string; right: string; target: number; note: string; kind: "diagonal" | "round" | "tbar" | "space" | "other" };
type Drill = { text: string; level: Level; pairs: Pair[] };

const notes: Record<Pair["kind"], string> = {
  diagonal: "斜線同士には三角形の余白が生まれます。見かけの空白が均一になるまで、標準よりしっかり詰めます。",
  round: "丸い字形は輪郭が内側へ退くため、四角い字形よりも視覚的な余白が大きく見えます。少し詰めて整えます。",
  tbar: "Tの横棒が右側に空白を作ります。次の文字の形へ近づけ、横棒下の余白を落ち着かせます。",
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

const targetByPair: Record<string, number> = { AV:-78, VA:-72, AW:-30, WA:-42, TA:-62, AT:-18, To:-48, TY:-38, Yo:-58, YA:-45, VE:-32, VO:-38, VA:-72, LA:-18, LO:-18, OT:-22, TO:-35, WO:-22, OW:-18, PA:-12, RA:-18, " ":95 };
const diagonal = new Set(["A","V","W","Y"]);
const tbar = new Set(["T"]);
const round = new Set(["O","o","C","c","G","g","Q","q","D","d","e"]);
const classify = (left:string,right:string): Pair["kind"] => left === " " || right === " " ? "space" : tbar.has(left) ? "tbar" : diagonal.has(left) || diagonal.has(right) ? "diagonal" : round.has(left) || round.has(right) ? "round" : "other";
const createDrill = (text:string, level:Level): Drill => ({ text, level, pairs:Array.from({length:text.length-1},(_,index) => { const left=text[index], right=text[index+1], kind=classify(left,right); const pair=left+right; const fallback=kind === "space" ? 95 : kind === "diagonal" ? -24 : kind === "tbar" ? -28 : kind === "round" ? -8 : 0; return { index,left,right,target:targetByPair[pair] ?? fallback,note:notes[kind],kind }; }) });
const drills: Drill[] = [
  ...questionBank.beginner.map(text => createDrill(text,"初級")),
  ...questionBank.intermediate.map(text => createDrill(text,"中級")),
  ...questionBank.advanced.map(text => createDrill(text,"上級")),
  ...questionBank.expert.map(text => createDrill(text,"超上級"))
];

const fonts = ["Inter", "Helvetica Neue", "Avenir Next", "Futura", "Noto Sans JP"];
const pairAt = (drill: Drill, index: number) => drill.pairs.find(p => (p.index ?? drill.text.indexOf(p.left + p.right)) === index) ?? { index, left:drill.text[index], right:drill.text[index + 1], target:0, note:notes.other, kind:"other" as const };

export default function KerningDrill() {
  const [screen, setScreen] = useState<"home"|"drill"|"result">("home");
  const [drill, setDrill] = useState<Drill>(drills[0]);
  const [choice, setChoice] = useState<DrillChoice>("ランダム");
  const [font, setFont] = useState(fonts[0]);
  const [values, setValues] = useState<number[]>([]);
  const [selected, setSelected] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [comparison, setComparison] = useState(0);
  const [history, setHistory] = useState<{ drill: Drill; values:number[]; accuracy:number }[]>([]);
  const drag = useRef<{x:number; value:number} | null>(null);

  const init = (next: Drill) => { setDrill(next); setValues(Array(next.text.length - 1).fill(0)); setSelected(0); setShowAnswer(false); setComparison(0); setScreen("drill"); };
  const start = (nextChoice: DrillChoice = choice) => { setChoice(nextChoice); const pool = nextChoice === "ランダム" ? drills : drills.filter(item => item.level === nextChoice); init(pool[Math.floor(Math.random() * pool.length)]); };
  const targets = useMemo(() => Array.from({length:drill.text.length-1},(_,i)=>pairAt(drill,i).target), [drill]);
  const accuracy = useMemo(() => Math.max(0, 100 - values.reduce((a,v,i)=>a+Math.min(100,Math.abs(v-targets[i]))/targets.length,0)*0.72),[values,targets]);
  const update = (index:number, value:number) => setValues(v=>v.map((x,i)=>i===index?Math.max(-150,Math.min(180,Math.round(value))):x));
  useEffect(() => { const handler=(e:KeyboardEvent)=>{ if(screen!=="drill" || !["ArrowLeft","ArrowRight"].includes(e.key)) return; e.preventDefault(); if(e.altKey) { update(selected, values[selected]+(e.key==="ArrowLeft"?-10:10)); return; } setSelected(current => Math.max(0, Math.min(drill.text.length-2, current+(e.key==="ArrowLeft"?-1:1)))); }; window.addEventListener("keydown",handler); return()=>window.removeEventListener("keydown",handler); });
  const submit = () => { setHistory(h=>[...h,{drill,values,accuracy}]); setScreen("result"); };
  const next = () => start(choice);
  const renderedValues = screen === "result" ? values.map((v,i)=> v+(targets[i]-v)*(comparison/100)) : values;
  const trouble = history.length ? ["斜線の組み合わせ", "T系の横棒", "右側を詰めすぎる傾向"].slice(0,Math.min(3,history.length+1)) : [];

  return <main className="min-h-screen px-5 py-5 sm:px-10 sm:py-8">
    <header className="mx-auto flex max-w-6xl items-center justify-between border-b pb-5 hairline"><div className="flex items-center gap-3"><span className="grid h-7 w-7 place-items-center rounded-md bg-[#171719] text-sm font-semibold text-white">K</span><span className="text-[15px] font-medium tracking-[-.01em]">Kerning Drill</span></div><div className="text-xs text-[#6e6e73]">Illustrator practice · 1/1000 em</div></header>
    {screen === "home" && <section className="mx-auto grid max-w-6xl gap-16 py-20 lg:grid-cols-[1.25fr_.75fr] lg:py-28"><div><p className="mb-5 text-xs font-medium tracking-[.14em] text-[#6e6e73]">DAILY TYPOGRAPHY PRACTICE</p><h1 className="max-w-2xl text-5xl font-medium leading-[1.06] tracking-[-.055em] sm:text-7xl">目で測る。<br/>余白を整える。</h1><p className="mt-8 max-w-md text-base leading-7 text-[#6e6e73]">Illustratorの感覚で、文字間の見え方を鍛える5分間のドリル。正解ではなく、字形のつくる余白を観察します。</p><div className="mt-9"><p className="mb-3 text-xs font-medium text-[#6e6e73]">難易度を選ぶ</p><div className="flex flex-wrap gap-2">{(["ランダム","初級","中級","上級","超上級"] as DrillChoice[]).map(item=><button key={item} onClick={()=>setChoice(item)} className={`border px-3 py-2 text-sm hairline ${choice===item?"border-[#171719] bg-[#171719] text-white":"bg-white text-[#505055]"}`}>{item}</button>)}</div></div><button onClick={()=>start()} className="mt-6 bg-[#171719] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#3d3d3f]">{choice}で開始 <span className="ml-5 text-[#b4b4b8]">⌘ ↵</span></button></div><div className="border-l pl-8 hairline"><p className="text-xs font-medium text-[#6e6e73]">今日のフォーカス</p><div className="mt-7 font-[Georgia] text-7xl tracking-[-.1em]">AV</div><p className="mt-7 text-sm leading-6 text-[#6e6e73]">斜線の間には、実際の距離より大きく見える三角形の空白があります。</p><div className="mt-12 border-t pt-5 hairline"><p className="text-xs text-[#6e6e73]">学習履歴</p><p className="mt-2 text-2xl tracking-[-.03em]">{history.length} <span className="text-sm text-[#6e6e73]">drills completed</span></p>{trouble.length>0&&<p className="mt-4 text-xs text-[#6e6e73]">復習候補：{trouble.join(" · ")}</p>}</div></div></section>}
    {screen !== "home" && <section className="mx-auto max-w-6xl py-9"><div className="flex items-center justify-between"><div><p className="text-xs font-medium tracking-[.12em] text-[#6e6e73]">{drill.level} · DRILL</p><h2 className="mt-1 text-xl font-medium tracking-[-.03em]">余白を見ながら、文字を選択</h2></div><label className="flex items-center gap-3 text-xs text-[#6e6e73]">Font<select value={font} onChange={e=>setFont(e.target.value)} className="border bg-white px-2 py-1.5 text-[#171719] hairline">{fonts.map(f=><option key={f}>{f}</option>)}</select></label></div>
      <div className="mt-8 min-h-[390px] border-y py-16 hairline"><div className="overflow-x-auto px-2 text-center"><div className="relative inline-block text-left"><KerningText text={drill.text} values={renderedValues} font={font} selected={selected} onSelect={setSelected} drag={drag} update={update} faded={screen==="result" && comparison>0} />{screen==="result" && <div className="pointer-events-none absolute left-0 top-0 opacity-85"><KerningText text={drill.text} values={targets} font={font} selected={-1} onSelect={()=>{}} drag={drag} update={()=>{}} blue /></div>}</div></div></div>
      {screen === "drill" ? <div className="mt-7 flex flex-col justify-between gap-7 sm:flex-row sm:items-end"><div><div className="flex items-center gap-3 text-sm"><span className="font-medium">{drill.text[selected] === " " ? "Space" : `${drill.text[selected]}${drill.text[selected+1]}`}</span><span className="font-mono text-[#6e6e73]">{values[selected] > 0 ? "+" : ""}{values[selected]}</span><span className="text-xs text-[#6e6e73]">/1000 em</span></div><div className="mt-3 flex items-center gap-4"><input className="track" type="range" min="-150" max="180" value={values[selected]} onChange={e=>update(selected,+e.target.value)} /><span className="text-xs text-[#6e6e73]">または <span className="key">⌥</span> + <span className="key">←</span><span className="key">→</span></span></div></div><button onClick={submit} className="bg-[#171719] px-5 py-3 text-sm font-medium text-white">採点する <span className="ml-5 text-[#b4b4b8]">→</span></button></div> : <Result drill={drill} values={values} targets={targets} accuracy={accuracy} comparison={comparison} setComparison={setComparison} showAnswer={showAnswer} setShowAnswer={setShowAnswer} next={next} />}</section>}
  </main>;
}

function KerningText({text,values,font,selected,onSelect,drag,update,blue=false,faded=false}:{text:string;values:number[];font:string;selected:number;onSelect:(n:number)=>void;drag:React.MutableRefObject<{x:number;value:number}|null>;update:(n:number,v:number)=>void;blue?:boolean;faded?:boolean}) { return <div aria-label="Kerning canvas" style={{fontFamily:font,color:blue?"#146ef5":"#171719",opacity:faded?.22:1}} className="inline-block whitespace-nowrap text-[clamp(56px,11vw,130px)] font-medium leading-none tracking-[-.055em]">{[...text].map((ch,i)=><span key={i} className={`char ${selected===i&&!blue?"active":""}`} style={{marginRight:i<text.length-1?`${values[i]/1000}em`:0, transition:"margin-right .4s cubic-bezier(.2,.8,.2,1)"}} onClick={()=>!blue&&i<text.length-1&&onSelect(i)} onPointerDown={e=>{if(blue||i>=text.length-1)return; onSelect(i); drag.current={x:e.clientX,value:values[i]}; e.currentTarget.setPointerCapture(e.pointerId)}} onPointerMove={e=>{if(!drag.current||blue)return; update(i,drag.current.value+(e.clientX-drag.current.x)*1.3)}} onPointerUp={()=>drag.current=null}>{ch===" "?" ":ch}{selected===i&&!blue&&<span className="kerning-caret" style={{transform:`translateX(${values[i]/2000}em)`}} />}</span>)}</div> }

function Result({drill,values,targets,accuracy,comparison,setComparison,showAnswer,setShowAnswer,next}:{drill:Drill;values:number[];targets:number[];accuracy:number;comparison:number;setComparison:(v:number)=>void;showAnswer:boolean;setShowAnswer:(v:boolean)=>void;next:()=>void}) { return <div className="mt-7"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center"><div><p className="text-xs font-medium tracking-[.12em] text-[#6e6e73]">ACCURACY</p><p className="mt-1 text-4xl font-medium tracking-[-.05em]">{accuracy.toFixed(1)}<span className="ml-1 text-xl">%</span></p></div><div className="flex gap-3"><button onClick={()=>setShowAnswer(!showAnswer)} className="border px-4 py-2.5 text-sm hairline">{showAnswer?"解説を閉じる":"答えと比較"}</button><button onClick={next} className="bg-[#171719] px-4 py-2.5 text-sm text-white">次のドリル →</button></div></div><div className="mt-7 border-t pt-6 hairline"><div className="flex max-w-sm items-center gap-4"><span className="text-xs">あなた</span><input className="track flex-1" type="range" value={comparison} onChange={e=>setComparison(+e.target.value)} /><span className="text-xs text-[#146ef5]">正解</span></div><p className="mt-3 text-xs text-[#6e6e73]">左端とベースラインを固定し、黒：あなたを青：正解へ補間</p></div>{showAnswer&&<div className="mt-8 grid gap-x-12 gap-y-6 border-t pt-7 hairline md:grid-cols-2">{drill.pairs.map((p,i)=>{const pos=p.index ?? drill.text.indexOf(p.left+p.right);const v=values[pos]??0;return <article key={i}><div className="flex items-baseline gap-4"><h3 className="text-lg font-medium">{p.left === " "?"Space":p.left}{p.right === " "?" Space":p.right}</h3><span className="font-mono text-xs text-[#6e6e73]">あなた {v>0?"+":""}{v}　正解 {p.target>0?"+":""}{p.target}　差分 {v-p.target>0?"+":""}{v-p.target}</span></div><p className="mt-2 max-w-md text-sm leading-6 text-[#6e6e73]">{p.note}</p></article>})}</div>}</div>}
