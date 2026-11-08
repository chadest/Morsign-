import React, { useState } from 'react';
import { Lock, Unlock, Key, RefreshCw, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { CipherType } from '../utils/crypto';
import { Translations } from '../utils/i18n';

interface SecurityPanelProps {
  cipherType: CipherType;
  setCipherType: (type: CipherType) => void;
  passphrase: string;
  setPassphrase: (pass: string) => void;
  error?: string | null;
  t: Translations;
}

/**
 * Security and Cipher configuration panel
 * Supports AES-256-GCM and historical radio ciphers
 */
export const SecurityPanel: React.FC<SecurityPanelProps> = ({
  cipherType,
  setCipherType,
  passphrase,
  setPassphrase,
  error,
  t,
}) => {
  const [showKey, setShowKey] = useState(false);

  // Generate a random secure key depending on the chosen cipher
  const generateRandomKey = () => {
    if (cipherType === 'aes-256') {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
      let result = '';
      for (let i = 0; i < 20; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      setPassphrase(result);
    } else if (cipherType === 'vigenere') {
      const keywords = ['ZEPHYR', 'PHOENIX', 'VALKYRIE', 'ENIGMA', 'SPARTAN', 'CITADEL', 'TITAN'];
      const pick = keywords[Math.floor(Math.random() * keywords.length)];
      setPassphrase(pick);
    } else if (cipherType === 'caesar') {
      const shift = Math.floor(Math.random() * 25) + 1;
      setPassphrase(shift.toString());
    }
  };

  return (
    <div className="dark:bg-zinc-900 bg-white border dark:border-zinc-800 border-zinc-200 rounded-xl p-4 shadow-sm transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          {cipherType === 'none' ? (
            <Unlock className="w-4 h-4 dark:text-zinc-400 text-zinc-500" />
          ) : (
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          )}
          <span className="text-sm font-semibold dark:text-zinc-200 text-zinc-800">
            {t.securityTitle}
          </span>
        </div>

        {/* Mode Selector */}
        <div className="grid grid-cols-2 sm:flex items-center gap-1.5 dark:bg-zinc-950 bg-zinc-100 p-1 rounded-lg border dark:border-zinc-800 border-zinc-300">
          <button
            onClick={() => setCipherType('none')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
              cipherType === 'none'
                ? 'dark:bg-zinc-800 bg-white dark:text-zinc-100 text-zinc-900 shadow-sm font-semibold'
                : 'dark:text-zinc-400 text-zinc-600 hover:dark:text-zinc-200 hover:text-zinc-900'
            }`}
          >
            {t.cipherNone}
          </button>
          <button
            onClick={() => {
              setCipherType('aes-256');
              if (!passphrase) setPassphrase('SecretCodeMorse2026!');
            }}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
              cipherType === 'aes-256'
                ? 'bg-emerald-600 text-white font-semibold'
                : 'dark:text-zinc-400 text-zinc-600 hover:dark:text-zinc-200 hover:text-zinc-900'
            }`}
          >
            {t.cipherAes}
          </button>
          <button
            onClick={() => {
              setCipherType('vigenere');
              if (!passphrase || !/^[A-Z]+$/i.test(passphrase)) setPassphrase('ECHO');
            }}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
              cipherType === 'vigenere'
                ? 'bg-amber-600 text-white font-semibold'
                : 'dark:text-zinc-400 text-zinc-600 hover:dark:text-zinc-200 hover:text-zinc-900'
            }`}
          >
            {t.cipherVigenere}
          </button>
          <button
            onClick={() => {
              setCipherType('caesar');
              if (!passphrase || isNaN(parseInt(passphrase, 10))) setPassphrase('7');
            }}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
              cipherType === 'caesar'
                ? 'bg-amber-600 text-white font-semibold'
                : 'dark:text-zinc-400 text-zinc-600 hover:dark:text-zinc-200 hover:text-zinc-900'
            }`}
          >
            {t.cipherCaesar}
          </button>
        </div>
      </div>

      {/* Secret Key Input if cipher is enabled */}
      {cipherType !== 'none' && (
        <div className="pt-2 border-t dark:border-zinc-800/80 border-zinc-200">
          <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none dark:text-zinc-500 text-zinc-400">
                <Key className="w-4 h-4" />
              </div>
              <input
                type={showKey ? 'text' : 'password'}
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                placeholder={
                  cipherType === 'aes-256'
                    ? t.placeholderAesKey
                    : cipherType === 'vigenere'
                    ? t.placeholderVigenereKey
                    : t.placeholderCaesarKey
                }
                className="w-full dark:bg-zinc-950 bg-zinc-50 border dark:border-zinc-700 border-zinc-300 rounded-lg pl-9 pr-10 py-1.5 text-xs sm:text-sm dark:text-zinc-100 text-zinc-900 dark:placeholder-zinc-500 placeholder-zinc-400 focus:outline-none focus:border-amber-500 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center dark:text-zinc-400 text-zinc-500 hover:dark:text-zinc-200 hover:text-zinc-800"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={generateRandomKey}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg dark:bg-zinc-800 bg-zinc-100 hover:dark:bg-zinc-700 hover:bg-zinc-200 dark:text-zinc-200 text-zinc-700 text-xs font-medium border dark:border-zinc-700 border-zinc-300 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                {t.generateKeyBtn}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between mt-2 text-xs">
            <span className="dark:text-zinc-400 text-zinc-600">
              {cipherType === 'aes-256' && t.descAes}
              {cipherType === 'vigenere' && t.descVigenere}
              {cipherType === 'caesar' && t.descCaesar}
            </span>
            {error && (
              <span className="text-rose-500 font-medium">
                {error}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
