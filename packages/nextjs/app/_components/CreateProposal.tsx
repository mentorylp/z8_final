"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

const durations = [
  { label: "1 час", hours: 1 },
  { label: "1 день", hours: 24 },
  { label: "3 дня", hours: 72 },
  { label: "7 дней", hours: 168 },
  { label: "14 дней", hours: 336 },
  { label: "30 дней", hours: 720 },
];

export const CreateProposal = ({ onClose }: { onClose: () => void }) => {
  const { address } = useAccount();
  const { writeContractAsync, isMining } = useScaffoldWriteContract({ contractName: "DecentralizedVoting" });
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [hours, setHours] = useState(24);

  const create = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleanTitle = title.trim();
    const cleanDescription = description.trim();
    const cleanOptions = options.map(option => option.trim());
    const bytes = (value: string) => new TextEncoder().encode(value).length;
    if (
      !cleanTitle ||
      bytes(cleanTitle) > 120 ||
      bytes(cleanDescription) > 1000 ||
      cleanOptions.some(option => !option || bytes(option) > 80)
    ) {
      notification.error("Проверьте длину вопроса, описания и вариантов ответа.");
      return;
    }
    try {
      const result = await writeContractAsync({
        functionName: "createProposal",
        args: [cleanTitle, cleanDescription, cleanOptions, BigInt(hours * 3600)],
      });
      if (result) {
        notification.success("Голосование создано и записано в блокчейн.");
        onClose();
      }
    } catch {
      // The Scaffold hook displays transaction errors.
    }
  };

  return (
    <section id="create" className="voting-panel scroll-mt-24" aria-labelledby="create-title">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="eyebrow">НОВОЕ ГОЛОСОВАНИЕ</div>
          <h2 id="create-title" className="text-2xl font-semibold tracking-tight mt-2">
            Создать вопрос
          </h2>
          <p className="text-sm text-base-content/60 mt-2 mb-0">После публикации изменить варианты и срок нельзя.</p>
        </div>
        <button type="button" className="btn btn-ghost btn-square" onClick={onClose} aria-label="Закрыть форму">
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={create} className="mt-7 grid gap-5">
        <label className="form-control grid gap-2">
          <span className="label-text font-medium">Вопрос *</span>
          <input
            className="input input-bordered w-full"
            placeholder="Какую идею реализовать следующей?"
            value={title}
            onChange={event => setTitle(event.target.value)}
            required
          />
          <span className="text-xs text-base-content/50">До 120 байт в UTF-8</span>
        </label>
        <label className="form-control grid gap-2">
          <span className="label-text font-medium">Описание</span>
          <textarea
            className="textarea textarea-bordered min-h-24 w-full"
            placeholder="Контекст, правила и важные детали"
            value={description}
            onChange={event => setDescription(event.target.value)}
          />
          <span className="text-xs text-base-content/50">До 1000 байт в UTF-8</span>
        </label>
        <div className="grid gap-3">
          <div className="flex items-center justify-between">
            <span className="font-medium text-sm">Варианты ответа *</span>
            <span className="text-xs text-base-content/50">От 2 до 8</span>
          </div>
          {options.map((option, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className="text-xs font-mono w-7 text-base-content/50">{String(index + 1).padStart(2, "0")}</span>
              <input
                className="input input-bordered w-full"
                value={option}
                onChange={event =>
                  setOptions(current => current.map((value, i) => (i === index ? event.target.value : value)))
                }
                placeholder={`Вариант ${index + 1}`}
                required
              />
              {options.length > 2 && (
                <button
                  type="button"
                  className="btn btn-ghost btn-square"
                  aria-label={`Удалить вариант ${index + 1}`}
                  onClick={() => setOptions(current => current.filter((_, i) => i !== index))}
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
          {options.length < 8 && (
            <button
              type="button"
              className="btn btn-ghost btn-sm justify-start w-fit"
              onClick={() => setOptions(current => [...current, ""])}
            >
              <PlusIcon className="w-4 h-4" /> Добавить вариант
            </button>
          )}
        </div>
        <label className="form-control grid gap-2">
          <span className="label-text font-medium">Продолжительность</span>
          <select
            className="select select-bordered w-full"
            value={hours}
            onChange={event => setHours(Number(event.target.value))}
          >
            {durations.map(duration => (
              <option key={duration.hours} value={duration.hours}>
                {duration.label}
              </option>
            ))}
          </select>
        </label>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-base-300 pt-5">
          <p className="text-xs text-base-content/55 m-0">
            {address
              ? "Публикация потребует подтверждения в кошельке и оплаты газа."
              : "Подключите кошелёк, чтобы опубликовать."}
          </p>
          <button type="submit" className="btn btn-primary" disabled={!address || isMining}>
            {isMining ? <span className="loading loading-spinner loading-sm" /> : <PlusIcon className="w-4 h-4" />}{" "}
            Опубликовать
          </button>
        </div>
      </form>
    </section>
  );
};
