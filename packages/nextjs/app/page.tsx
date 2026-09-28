"use client";

import { useEffect, useState } from "react";
import type { NextPage } from "next";
import { PlusIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";
import { CreateProposal } from "~~/app/_components/CreateProposal";
import { ProposalCard } from "~~/app/_components/ProposalCard";
import type { Filter } from "~~/app/_components/ProposalCard";
import { useDeployedContractInfo, useScaffoldReadContract, useTargetNetwork } from "~~/hooks/scaffold-eth";

const PAGE_SIZE = 9;

const Home: NextPage = () => {
  const { data: count, isLoading } = useScaffoldReadContract({
    contractName: "DecentralizedVoting",
    functionName: "proposalCount",
  });
  const { data: contract } = useDeployedContractInfo({ contractName: "DecentralizedVoting" });
  const { targetNetwork } = useTargetNetwork();
  const [filter, setFilter] = useState<Filter>("all");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [showCreate, setShowCreate] = useState(false);
  const [now, setNow] = useState(0);

  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);

  const total = Number(count ?? 0n);
  const proposalIds = Array.from({ length: Math.min(total, visibleCount) }, (_, index) => BigInt(total - index - 1));

  const openCreate = () => {
    setShowCreate(true);
    setTimeout(() => document.getElementById("create")?.scrollIntoView({ behavior: "smooth" }), 0);
  };

  return (
    <main className="grow">
      <section className="hero-surface">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 py-16 md:py-24 grid lg:grid-cols-[1.25fr_0.75fr] gap-12 items-end">
          <div>
            <div className="hero-kicker">
              <span className="hero-kicker-dot" /> ГОЛОСОВАНИЕ БЕЗ ПОСРЕДНИКОВ
            </div>
            <h1 className="hero-title mt-7">
              Ваш голос.
              <br />
              <span>Общее решение.</span>
            </h1>
            <p className="text-lg text-base-content/65 max-w-xl leading-relaxed mt-6 mb-8">
              Создавайте опросы, выбирайте варианты и проверяйте результаты прямо в блокчейне. Каждая транзакция
              публична и доступна для проверки.
            </p>
            <button className="btn btn-primary btn-lg" onClick={openCreate}>
              <PlusIcon className="w-5 h-5" /> Создать голосование
            </button>
          </div>
          <div className="hero-stat-card">
            <div className="flex items-center justify-between">
              <span className="eyebrow">СЕТЬ / {targetNetwork.name.toUpperCase()}</span>
              <ShieldCheckIcon className="w-6 h-6 text-primary" />
            </div>
            <div className="text-7xl font-semibold tracking-tighter mt-8">
              {isLoading ? "—" : total.toLocaleString("ru-RU")}
            </div>
            <p className="m-0 mt-2 text-base-content/60">голосований в сети</p>
            <div className="border-t border-base-300 mt-9 pt-5 flex justify-between text-xs text-base-content/55">
              <span>Данные из смарт-контракта</span>
              <span className="inline-flex items-center gap-2">
                <span className="status-dot bg-success" /> ONCHAIN
              </span>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-5 sm:px-8 py-12 md:py-16">
        {showCreate && (
          <div className="mb-12">
            <CreateProposal onClose={() => setShowCreate(false)} />
          </div>
        )}
        <div className="flex flex-wrap items-end justify-between gap-5 mb-7">
          <div>
            <div className="eyebrow">РЕШЕНИЯ СООБЩЕСТВА</div>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mt-3 mb-0">Голосования</h2>
          </div>
          <div role="tablist" aria-label="Фильтр голосований" className="tabs tabs-box bg-base-200 p-1">
            {(
              [
                ["all", "Все"],
                ["active", "Активные"],
                ["closed", "Завершённые"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={filter === value}
                className={`tab ${filter === value ? "tab-active" : ""}`}
                onClick={() => setFilter(value)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {!contract && !isLoading ? (
          <div className="empty-state">
            <ShieldCheckIcon className="w-10 h-10 mb-4 text-primary" />
            <h3 className="text-xl font-semibold">Контракт пока не развёрнут</h3>
            <p>
              Запустите локальную сеть командой <code>yarn chain</code>, затем выполните <code>yarn deploy</code>.
            </p>
          </div>
        ) : total === 0 && !isLoading ? (
          <div className="empty-state">
            <div className="text-5xl mb-4">✳</div>
            <h3 className="text-xl font-semibold">Здесь пока тихо</h3>
            <p>Создайте первое голосование и пригласите участников.</p>
            <button className="btn btn-primary mt-3" onClick={openCreate}>
              Создать голосование
            </button>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
              {proposalIds.map(proposalId => (
                <ProposalCard key={proposalId.toString()} proposalId={proposalId} filter={filter} now={now} />
              ))}
            </div>
            {visibleCount < total && (
              <div className="text-center mt-9">
                <button className="btn btn-outline" onClick={() => setVisibleCount(current => current + PAGE_SIZE)}>
                  Показать ещё
                </button>
              </div>
            )}
          </>
        )}

        <div className="mt-16 border-t border-base-300 pt-7 flex flex-col md:flex-row justify-between gap-4 text-sm text-base-content/55">
          <p className="m-0 max-w-xl">
            Один адрес может проголосовать один раз в каждом опросе. Создание нескольких адресов не ограничено, поэтому
            система не подтверждает личность участника.
          </p>
          <p className="m-0 md:text-right">Голоса и результаты открыты для всех.</p>
        </div>
      </div>
    </main>
  );
};

export default Home;
