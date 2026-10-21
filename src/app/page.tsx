import Link from "next/link";
import Image from "next/image";
import { ArrowDown, ArrowRight, Heart, Sparkles } from "lucide-react";
import { games } from "@/lib/games/registry";

function SudokuPreview() {
  const cells = [5, 0, 8, 0, 4, 0, 1, 0, 7, 0, 2, 0, 6, 0, 9, 0, 3, 0, 9, 0, 1, 0, 7, 0, 4, 0, 6, 0, 8, 0, 2, 0, 5, 0, 1, 0, 7, 0, 3, 0, 9, 0, 6, 0, 2, 0, 4, 0, 6, 0, 8, 0, 1, 0, 9, 0, 1, 0, 5, 0, 3, 0, 7, 0, 6, 0, 8, 0, 2, 0, 5, 0, 3, 0, 9, 0, 4, 0, 1, 0, 8];
  return (
    <div aria-hidden="true" className="grid aspect-square w-full max-w-[228px] grid-cols-9 overflow-hidden rounded-xl border border-[#eccbd7] bg-white shadow-[0_8px_24px_-16px_rgba(120,63,85,.35)]">
      {cells.map((n, i) => <div key={i} className={`flex items-center justify-center border-r border-b border-[#f4e4ea] text-[10px] font-bold text-[#8d6d7b] ${i % 3 === 2 && i % 9 !== 8 ? "border-r-2 border-r-[#eac2d1]" : ""} ${Math.floor(i / 9) % 3 === 2 && i < 72 ? "border-b-2 border-b-[#eac2d1]" : ""} ${i === 31 ? "bg-[#fdebf1] text-[#d47799]" : ""}`}>{n || ""}</div>)}
    </div>
  );
}

export default function Home() {
  const featuredGame = games.find((game) => game.id === "sudoku")!;
  const otherGames = games.filter((game) => game.id !== featuredGame.id);
  const FeaturedIcon = featuredGame.icon;

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-5 pb-12 sm:px-8">
      <header className="flex h-[76px] items-center justify-between border-b border-[#f3e8ed]">
        <Link href="/" aria-label="Meni Games, início" className="flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <Image src="/brand/meni-games.webp" alt="Meni Games" width={2172} height={724} className="h-auto w-[180px]" priority />
        </Link>
        <span className="hidden items-center gap-1.5 text-xs font-semibold text-muted-foreground sm:flex"><Heart className="size-3.5 fill-[#f3c6d5] text-[#e9a9bf]" />feito para um tempinho seu</span>
      </header>

      <section className="relative overflow-hidden pb-10 pt-11 sm:pb-14 sm:pt-[68px]">
        <div className="relative max-w-[640px]">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#f2dce5] bg-white/90 px-3.5 py-1.5 text-[11px] font-extrabold tracking-[.04em] text-[#a45e77]"><Sparkles className="size-3.5" /> seu cantinho de pausa</p>
          <h1 className="max-w-[560px] text-[40px] font-extrabold leading-[1.08] tracking-[-.055em] sm:text-[58px]">Um respiro leve<br className="hidden sm:block" /> no meio do seu dia<span className="text-[#e99bb5]">.</span></h1>
          <p className="mt-4 max-w-[435px] text-[15px] leading-7 text-muted-foreground sm:mt-5 sm:text-[17px]">Jogos simples para desacelerar, se divertir e exercitar a mente — no seu tempo, do seu jeito.</p>
          <a href="#jogos" className="mt-7 inline-flex items-center gap-2 text-sm font-extrabold text-[#a45e77] transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">encontre seu próximo jogo <ArrowDown className="size-4" /></a>
        </div>
      </section>

      <section id="jogos" aria-labelledby="games-heading" className="scroll-mt-6">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div><p className="text-[11px] font-extrabold tracking-[.04em] text-[#a45e77]">coleção</p><h2 id="games-heading" className="mt-1 text-[24px] font-extrabold tracking-[-.04em] sm:text-[28px]">Escolha como quer pausar</h2></div>
          <span className="pb-1 text-xs font-semibold text-muted-foreground">{games.length} jogos</span>
        </div>

        <Link href={featuredGame.href} className="group grid overflow-hidden rounded-[22px] border border-[#f0dce4] bg-white shadow-[0_14px_40px_-30px_rgba(113,62,81,.4)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#e9bfce] hover:shadow-[0_18px_45px_-30px_rgba(113,62,81,.5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:grid-cols-[1fr_265px]">
          <div className="flex flex-col items-start justify-center p-6 sm:p-9">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#eaf5ee] px-2.5 py-1 text-[11px] font-extrabold text-[#3a7055]"><span className="size-1.5 rounded-full bg-[#69a780]" />Disponível agora</span>
            <div className="mt-5 flex items-center gap-3"><span className="flex size-11 items-center justify-center rounded-2xl bg-[#fff0f5] text-[#d47e9d]"><FeaturedIcon className="size-5" strokeWidth={1.9} /></span><h3 className="text-[25px] font-extrabold tracking-[-.04em]">{featuredGame.name}</h3></div>
            <p className="mt-2 max-w-[370px] text-sm leading-6 text-muted-foreground">{featuredGame.description} Respire fundo e encontre seu ritmo, número por número.</p>
            <span className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-foreground shadow-sm transition-colors group-hover:bg-[#dc82a2]">Começar a jogar <ArrowRight className="size-4" /></span>
          </div>
          <div className="flex min-h-[210px] items-center justify-center border-t border-[#f6e9ee] bg-[#fff8fa] px-8 py-5 sm:border-l sm:border-t-0"><SudokuPreview /></div>
        </Link>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {otherGames.map((game) => {
            const Icon = game.icon;
            return <article key={game.id} aria-label={`${game.name}, ${game.available ? "disponível" : "em breve"}`} className="flex min-h-[126px] items-start gap-3.5 rounded-2xl border border-[#f2e6eb] bg-white/70 p-4 sm:p-5">
              <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${game.accent === "lavender" ? "bg-[#f2effc] text-[#8779b6]" : game.accent === "peach" ? "bg-[#fff1e9] text-[#ca8c69]" : "bg-[#edf6f0] text-[#6b9879]"}`}><Icon className="size-[18px]" strokeWidth={1.8} /></span>
              <div className="min-w-0"><div className="flex flex-wrap items-center gap-x-2 gap-y-1"><h3 className="text-sm font-extrabold">{game.available ? <Link href={game.href} className="rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{game.name}</Link> : game.name}</h3><span className="rounded-full bg-[#f7f1f3] px-2 py-0.5 text-[10px] font-bold text-[#786b75]">{game.label}</span></div><p className="mt-1.5 text-xs leading-[1.55] text-muted-foreground">{game.description}</p></div>
            </article>;
          })}
        </div>
      </section>

      <footer className="mt-12 flex flex-col gap-2 border-t border-[#f3e8ed] pt-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between"><span>Um jogo de cada vez. Uma pausa de cada vez.</span><span>feito com carinho <Heart className="mx-0.5 inline size-3 fill-[#efbdd0] text-[#e8a3bb]" /> para você</span></footer>
    </main>
  );
}
