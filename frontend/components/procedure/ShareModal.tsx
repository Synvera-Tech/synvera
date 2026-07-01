"use client";

import { Check, Copy, Share2, Smartphone, X } from "lucide-react";
import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";

interface ShareModalProps {
  shareUrl: string;
  onClose: () => void;
}

export function ShareModal({ shareUrl, onClose }: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-modal-title"
      onKeyDown={(e) => { if (e.key === "Escape") onClose(); }}
    >
      <button
        type="button"
        aria-label="Fechar"
        onClick={onClose}
        className="absolute inset-0 bg-stone-950/55 backdrop-blur-sm"
      />

      <div className="card-plush relative w-full max-w-sm rounded-3xl border border-stone-200/80 bg-white p-7 dark:border-stone-700 dark:bg-stone-900">
        <button
          type="button"
          aria-label="Fechar"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600 dark:hover:bg-stone-800 dark:hover:text-stone-300"
        >
          <X size={16} />
        </button>

        <div className="mb-5 flex items-center gap-2">
          <Share2 size={16} className="text-primary dark:text-[#A99876]" aria-hidden="true" />
          <h2 id="share-modal-title" className="m-0 text-[15px] font-bold text-stone-950 dark:text-stone-50">
            Compartilhar relatório
          </h2>
        </div>

        <button
          type="button"
          onClick={copyLink}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-primary/25 bg-primary/5 px-4 py-3 text-sm font-semibold text-primary transition-all hover:bg-primary/10 active:scale-[0.98] dark:border-[#A18C63]/20 dark:text-[#A99876] dark:hover:bg-[#A18C63]/10"
        >
          {copied ? <><Check size={16} /> Link copiado!</> : <><Copy size={16} /> Copiar link</>}
        </button>

        <p className="mt-3 break-all rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-center text-[11px] font-medium text-stone-500 dark:border-stone-700 dark:bg-stone-800/50 dark:text-stone-400">
          {shareUrl}
        </p>

        <div className="mt-6 flex flex-col items-center gap-3">
          <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-700">
            <QRCodeSVG
              value={shareUrl}
              size={148}
              level="M"
              marginSize={0}
              bgColor="#FFFFFF"
              fgColor="#282011"
              title="QR Code do relatório compartilhado"
              className="h-[148px] w-[148px]"
            />
          </div>
          <p className="flex items-center gap-1.5 text-[11px] font-medium text-stone-400 dark:text-stone-500">
            <Smartphone size={12} aria-hidden="true" /> Escaneie para abrir no celular
          </p>
        </div>
      </div>
    </div>
  );
}
