"use client";

import Link from "next/link";
import { hardhat } from "viem/chains";
import { SwitchTheme } from "~~/components/SwitchTheme";
import { Faucet } from "~~/components/scaffold-eth";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";

export const Footer = () => {
  const { targetNetwork } = useTargetNetwork();
  return (
    <footer className="border-t border-base-300 bg-base-100 px-5 sm:px-8 py-5">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 text-xs text-base-content/55">
        <span>Голос · Данные хранятся в сети {targetNetwork.name}</span>
        <div className="flex items-center gap-3">
          {targetNetwork.id === hardhat.id && (
            <>
              <Faucet />
              <Link href="/blockexplorer" className="link">
                Обозреватель
              </Link>
            </>
          )}
          <SwitchTheme />
        </div>
      </div>
    </footer>
  );
};
