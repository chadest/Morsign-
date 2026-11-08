import React, { useState } from 'react';
import { Lock, Unlock, Key, RefreshCw, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { CipherType } from '../utils/crypto';

interface SecurityPanelProps {
  cipherType: CipherType;
  setCipherType: (type: CipherType) => void;
  passphrase: string;
  setPassphrase: (pass: string) => void;
  error?: string | null;
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
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          {cipherType === 'none' ? (
            <Unlock className="w-4 h-4 text-zinc-400" />
          ) : (
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          )}
          <span className="text-sm font-semibold text-zinc-200">
            Cryptage & Sécurisation du Message
          </span>
        </div>

        {/* Mode Selector */}
        <div className="grid grid-cols-2 sm:flex items-center gap-1.5 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
          <button
            onClick={() => setCipherType('none')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
              cipherType === 'none'
                ? 'bg-zinc-800 text-zinc-100 font-semibold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Désactivé
          </button>
          <button
            onClick={() => {
              setCipherType('aes-256');
              if (!passphrase) setPassphrase('SecretCodeMorse2026!');
            }}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
              cipherType === 'aes-256'
                ? 'bg-emerald-600 text-white font-semibold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            AES-256-GCM
          </button>
          <button
            onClick={() => {
              setCipherType('vigenere');
              if (!passphrase || !/^[A-Z]+$/i.test(passphrase)) setPassphrase('ECHO');
            }}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
              cipherType === 'vigenere'
                ? 'bg-amber-600 text-white font-semibold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Vigenère (Radio)
          </button>
          <button
            onClick={() => {
              setCipherType('caesar');
              if (!passphrase || isNaN(parseInt(passphrase, 10))) setPassphrase('7');
            }}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
              cipherType === 'caesar'
                ? 'bg-amber-600 text-white font-semibold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            César (ROT-N)
          </button>
        </div>
      </div>

      {/* Secret Key Input if cipher is enabled */}
      {cipherType !== 'none' && (
        <div className="pt-2 border-t border-zinc-800/80">
          <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                <Key className="w-4 h-4" />
              </div>
              <input
                type={showKey ? 'text' : 'password'}
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                placeholder={
                  cipherType === 'aes-256'
                    ? 'Clé secrète ou mot de passe AES-256...'
                    : cipherType === 'vigenere'
                    ? 'Mot-clé alphabétique (ex: VICTORY)...'
                    : 'Décalage numérique (1 à 25)...'
                }
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg pl-9 pr-10 py-1.5 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-200"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={generateRandomKey}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Générer clé
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between mt-2 text-xs">
            <span className="text-zinc-400">
              {cipherType === 'aes-256' && 'Chiffrement symétrique fort 256 bits avec dérivation PBKDF2'}
              {cipherType === 'vigenere' && 'Chiffre polyalphabétique traditionnel des transmissions radio'}
              {cipherType === 'caesar' && 'Décalage alphabétique circulaire ROT-N'}
            </span>
            {error && (
              <span className="text-rose-400 font-medium">
                {error}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
