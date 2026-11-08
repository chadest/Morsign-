/**
 * Internationalization (i18n) Dictionary & Helpers
 * Supports French (fr), English (en), and Spanish (es).
 */

export type Language = 'fr' | 'en' | 'es';

export interface Translations {
  // Header
  appSubtitle: string;
  tabTranslator: string;
  tabDecoder: string;
  tabKeyer: string;
  tabReference: string;
  torchActiveBadge: string;
  themeSystem: string;
  themeDark: string;
  themeLight: string;

  // Security Panel
  securityTitle: string;
  cipherNone: string;
  cipherAes: string;
  cipherVigenere: string;
  cipherCaesar: string;
  placeholderAesKey: string;
  placeholderVigenereKey: string;
  placeholderCaesarKey: string;
  generateKeyBtn: string;
  descAes: string;
  descVigenere: string;
  descCaesar: string;
  errorKeyRequired: string;
  errorAesDecrypt: string;
  encryptedIndicator: string;

  // Translator
  presetsLabel: string;
  swapDirection: string;
  clearAll: string;
  sourceTextLabel: string;
  sourceMorseLabel: string;
  willBeEncrypted: string;
  outputMorseLabel: string;
  outputTextLabel: string;
  placeholderText: string;
  placeholderMorse: string;
  morseAppearsHere: string;
  textAppearsHere: string;
  copyBtn: string;
  copiedBtn: string;
  pointsLabel: string;
  dashesLabel: string;
  symbolsLabel: string;
  charsLabel: string;
  wordsLabel: string;
  approxDuration: string;
  cryptogramLabel: string;

  // Signal Controller
  startSignal: string;
  stopSignal: string;
  exportWav: string;
  soundLabel: string;
  screenLabel: string;
  torchLabel: string;
  torchUnavailable: string;
  wpmLabel: string;
  frequencyLabel: string;
  wpmNovice: string;
  wpmStandard: string;
  wpmFast: string;
  freqLow: string;
  freqStandard: string;
  freqHigh: string;

  // Visual Beacon
  beaconTitle: string;
  fullscreenBtn: string;
  fullscreenTitle: string;
  stateActive: string;
  stateIdle: string;
  stateWaiting: string;
  dotName: string;
  dashName: string;
  pressEscToExit: string;

  // Signal Decoder (Mic & Camera)
  decoderTitle: string;
  decoderSubtitle: string;
  modeMic: string;
  modeCamera: string;
  startCapture: string;
  stopCapture: string;
  resetCapture: string;
  signalDetected: string;
  silenceWaiting: string;
  audioThreshold: string;
  luminanceThreshold: string;
  cameraStandby: string;
  cameraPrompt: string;
  roiLabel: string;
  receivedMorse: string;
  waitingForSignals: string;
  decodedTextLabel: string;
  rawReceivedLabel: string;
  decryptedMessageLabel: string;
  decryptingActive: string;

  // Manual Keyer
  keyerTitle: string;
  keyerSubtitle: string;
  keyerPadIdle: string;
  keyerPadActive: string;
  keyerHint: string;
  currentSymbol: string;
  detectedStream: string;
  keyerDecodedText: string;
  referenceRhythm: string;

  // Morse Table
  tableTitle: string;
  tableSubtitle: string;
  searchPlaceholder: string;
  catLetters: string;
  catNumbers: string;
  catSymbols: string;
  catAccents: string;

  // Footer
  footerNotice: string;
}

export const TRANSLATIONS: Record<Language, Translations> = {
  fr: {
    appSubtitle: 'Traducteur International • Signaux Audio & Optique • Chiffrement AES-256',
    tabTranslator: 'Traducteur',
    tabDecoder: 'Décodeur (Micro/Caméra)',
    tabKeyer: 'Manipulateur',
    tabReference: 'Table Morse',
    torchActiveBadge: 'Flash LED',
    themeSystem: 'Système',
    themeDark: 'Sombre',
    themeLight: 'Clair',

    securityTitle: 'Cryptage & Sécurisation du Message',
    cipherNone: 'Désactivé',
    cipherAes: 'AES-256-GCM',
    cipherVigenere: 'Vigenère (Radio)',
    cipherCaesar: 'César (ROT-N)',
    placeholderAesKey: 'Clé secrète ou mot de passe AES-256...',
    placeholderVigenereKey: 'Mot-clé alphabétique (ex: VICTORY)...',
    placeholderCaesarKey: 'Décalage numérique (1 à 25)...',
    generateKeyBtn: 'Générer clé',
    descAes: 'Chiffrement symétrique fort 256 bits avec dérivation PBKDF2',
    descVigenere: 'Chiffre polyalphabétique traditionnel des transmissions radio',
    descCaesar: 'Décalage alphabétique circulaire ROT-N',
    errorKeyRequired: 'Clé ou mot de passe requis',
    errorAesDecrypt: 'Échec du déchiffrement AES-256 (clé incorrecte ou données altérées)',
    encryptedIndicator: 'Sécurisé',

    presetsLabel: 'Exemples :',
    swapDirection: 'Inverser le sens',
    clearAll: 'Effacer tout',
    sourceTextLabel: 'Texte source (Clair)',
    sourceMorseLabel: "Code Morse d'entrée",
    willBeEncrypted: '(sera chiffré)',
    outputMorseLabel: 'Signal Code Morse',
    outputTextLabel: 'Texte Décodé',
    placeholderText: 'Tapez votre message ici (ex: SOS NAVIRE EN DÉTRESSE)...',
    placeholderMorse: 'Entrez le code morse (ex: ... --- ... / -.-. --.-)...',
    morseAppearsHere: 'Le code morse apparaîtra ici...',
    textAppearsHere: 'Le texte décodé apparaîtra ici...',
    copyBtn: 'Copier',
    copiedBtn: 'Copié',
    pointsLabel: 'points',
    dashesLabel: 'traits',
    symbolsLabel: 'symboles',
    charsLabel: 'caractères',
    wordsLabel: 'mots',
    approxDuration: 'Durée estimée',
    cryptogramLabel: 'Cryptogramme :',

    startSignal: 'Émettre le signal',
    stopSignal: "Arrêter l'émission",
    exportWav: 'Exporter WAV',
    soundLabel: 'Son',
    screenLabel: 'Écran',
    torchLabel: 'Flash LED',
    torchUnavailable: 'Flash LED indisponible ou refusé',
    wpmLabel: 'Vitesse de transmission (WPM)',
    frequencyLabel: 'Fréquence sonore (Tonalité CW)',
    wpmNovice: '5 (Apprentissage)',
    wpmStandard: '20 (Standard ITU)',
    wpmFast: '40 (Rapide)',
    freqLow: '400 Hz (Grave)',
    freqStandard: '650 Hz (Standard Radio)',
    freqHigh: '900 Hz (Aigu)',

    beaconTitle: 'Balise Optique / Signal Lumineux',
    fullscreenBtn: 'Plein écran',
    fullscreenTitle: 'TRANSMISSION OPTIQUE PLEIN ÉCRAN',
    stateActive: 'SIGNAL ACTIF',
    stateIdle: 'VEILLE',
    stateWaiting: 'Attente',
    dotName: 'POINT (TI)',
    dashName: 'TRAIT (TAAH)',
    pressEscToExit: 'Appuyez sur Échap pour quitter',

    decoderTitle: 'Récepteur & Décodeur en Direct',
    decoderSubtitle: 'Écoute acoustique par microphone ou analyse optique des impulsions lumineuses par caméra.',
    modeMic: 'Microphone (Sonore)',
    modeCamera: 'Caméra (Optique)',
    startCapture: 'Activer la capture',
    stopCapture: 'Arrêter la capture',
    resetCapture: 'Réinitialiser',
    signalDetected: 'SIGNAL DÉTECTÉ',
    silenceWaiting: 'SILENCE / VEILLE',
    audioThreshold: 'Seuil Audio',
    luminanceThreshold: 'Seuil Luminance',
    cameraStandby: 'Caméra en veille',
    cameraPrompt: 'Cliquez sur "Activer la capture" pour viser la source lumineuse (lampe, écran ou torche)',
    roiLabel: 'ZONE DE MESURE ROI',
    receivedMorse: 'Code Morse Reçu',
    waitingForSignals: 'En attente de signaux (points • et traits —)...',
    decodedTextLabel: 'Texte Décodé',
    rawReceivedLabel: 'Données brutes reçues :',
    decryptedMessageLabel: 'Message déchiffré :',
    decryptingActive: 'Déchiffrement actif',

    keyerTitle: 'Manipulateur Télégraphique Manuel',
    keyerSubtitle: "Pressez la barre d'espace ou le bouton pour émettre en direct. L'algorithme décode automatiquement votre rythme.",
    keyerPadIdle: 'CLIQUEZ OU ESPACE',
    keyerPadActive: 'CONTACT ÉTABLI',
    keyerHint: 'Court = Point (•) | Long = Trait (—)',
    currentSymbol: 'Symbole en cours :',
    detectedStream: 'Flux Morse Détecté',
    keyerDecodedText: 'Texte Décodé',
    referenceRhythm: 'Rythme de référence :',

    tableTitle: 'Table Officielle du Code Morse International (ITU-R)',
    tableSubtitle: "Cliquez sur n'importe quel caractère pour écouter son signal sonore.",
    searchPlaceholder: 'Rechercher (lettre ou morse)...',
    catLetters: "Lettres de l'Alphabet (A — Z)",
    catNumbers: 'Chiffres (0 — 9)',
    catSymbols: 'Ponctuation & Symboles Radio',
    catAccents: 'Caractères Accentués (Norme ITU)',

    footerNotice: 'Code Morse International (ITU-R M.1677-1) • Standard PARIS 50 unités • Cryptage AES-256-GCM',
  },
  en: {
    appSubtitle: 'International Translator • Audio & Optical Signals • AES-256 Encryption',
    tabTranslator: 'Translator',
    tabDecoder: 'Decoder (Mic/Camera)',
    tabKeyer: 'Straight Key',
    tabReference: 'Morse Table',
    torchActiveBadge: 'LED Flash',
    themeSystem: 'System',
    themeDark: 'Dark',
    themeLight: 'Light',

    securityTitle: 'Message Encryption & Security',
    cipherNone: 'Disabled',
    cipherAes: 'AES-256-GCM',
    cipherVigenere: 'Vigenère (Radio)',
    cipherCaesar: 'Caesar (ROT-N)',
    placeholderAesKey: 'Secret passphrase for AES-256...',
    placeholderVigenereKey: 'Alphabetic keyword (e.g. VICTORY)...',
    placeholderCaesarKey: 'Shift number (1 to 25)...',
    generateKeyBtn: 'Generate Key',
    descAes: 'Strong 256-bit symmetric encryption with PBKDF2 key derivation',
    descVigenere: 'Traditional polyalphabetic radio communications field cipher',
    descCaesar: 'Circular alphabetic shift ROT-N',
    errorKeyRequired: 'Key or passphrase is required',
    errorAesDecrypt: 'AES-256 decryption failed (invalid key or tampered data)',
    encryptedIndicator: 'Secured',

    presetsLabel: 'Samples:',
    swapDirection: 'Swap direction',
    clearAll: 'Clear all',
    sourceTextLabel: 'Source Text (Plain)',
    sourceMorseLabel: 'Input Morse Code',
    willBeEncrypted: '(will be encrypted)',
    outputMorseLabel: 'Morse Code Signal',
    outputTextLabel: 'Decoded Text',
    placeholderText: 'Type your message here (e.g. SOS VESSEL IN DISTRESS)...',
    placeholderMorse: 'Enter morse code (e.g. ... --- ... / -.-. --.-)...',
    morseAppearsHere: 'Morse code will appear here...',
    textAppearsHere: 'Decoded text will appear here...',
    copyBtn: 'Copy',
    copiedBtn: 'Copied',
    pointsLabel: 'dots',
    dashesLabel: 'dashes',
    symbolsLabel: 'symbols',
    charsLabel: 'chars',
    wordsLabel: 'words',
    approxDuration: 'Estimated duration',
    cryptogramLabel: 'Ciphertext:',

    startSignal: 'Transmit Signal',
    stopSignal: 'Stop Signal',
    exportWav: 'Export WAV',
    soundLabel: 'Sound',
    screenLabel: 'Screen',
    torchLabel: 'LED Flash',
    torchUnavailable: 'LED Flash unavailable or denied',
    wpmLabel: 'Transmission Speed (WPM)',
    frequencyLabel: 'Tone Frequency (CW Pitch)',
    wpmNovice: '5 (Beginner)',
    wpmStandard: '20 (Standard ITU)',
    wpmFast: '40 (Fast)',
    freqLow: '400 Hz (Low)',
    freqStandard: '650 Hz (Standard Radio)',
    freqHigh: '900 Hz (High)',

    beaconTitle: 'Optical Beacon / Light Signal',
    fullscreenBtn: 'Fullscreen',
    fullscreenTitle: 'FULLSCREEN OPTICAL TRANSMISSION',
    stateActive: 'SIGNAL ACTIVE',
    stateIdle: 'STANDBY',
    stateWaiting: 'Waiting',
    dotName: 'DOT (DIT)',
    dashName: 'DASH (DAH)',
    pressEscToExit: 'Press Escape to exit',

    decoderTitle: 'Live Receiver & Decoder',
    decoderSubtitle: 'Acoustic listening via microphone or optical pulse detection via camera.',
    modeMic: 'Microphone (Audio)',
    modeCamera: 'Camera (Optical)',
    startCapture: 'Start Capture',
    stopCapture: 'Stop Capture',
    resetCapture: 'Reset',
    signalDetected: 'SIGNAL DETECTED',
    silenceWaiting: 'SILENCE / STANDBY',
    audioThreshold: 'Audio Threshold',
    luminanceThreshold: 'Luma Threshold',
    cameraStandby: 'Camera Standby',
    cameraPrompt: 'Click "Start Capture" and aim towards light source (lamp, screen or torch)',
    roiLabel: 'ROI MEASUREMENT ZONE',
    receivedMorse: 'Received Morse Code',
    waitingForSignals: 'Waiting for incoming signals (dots • and dashes —)...',
    decodedTextLabel: 'Decoded Text',
    rawReceivedLabel: 'Raw incoming data:',
    decryptedMessageLabel: 'Decrypted message:',
    decryptingActive: 'Decryption active',

    keyerTitle: 'Manual Telegraph Straight Key',
    keyerSubtitle: 'Tap Spacebar or the button to transmit live. Rhythm algorithm decodes in real time.',
    keyerPadIdle: 'CLICK OR SPACEBAR',
    keyerPadActive: 'CONTACT CLOSED',
    keyerHint: 'Short = Dot (•) | Long = Dash (—)',
    currentSymbol: 'Current Symbol:',
    detectedStream: 'Detected Morse Stream',
    keyerDecodedText: 'Decoded Text',
    referenceRhythm: 'Reference cadence:',

    tableTitle: 'Official International Morse Code Table (ITU-R)',
    tableSubtitle: 'Click any character to hear its sound signal.',
    searchPlaceholder: 'Search (letter or morse)...',
    catLetters: 'Alphabet Letters (A — Z)',
    catNumbers: 'Numbers (0 — 9)',
    catSymbols: 'Punctuation & Radio Symbols',
    catAccents: 'Accented Characters (ITU Standard)',

    footerNotice: 'International Morse Code (ITU-R M.1677-1) • PARIS 50 Units Standard • AES-256-GCM Encryption',
  },
  es: {
    appSubtitle: 'Traductor Internacional • Señales de Audio y Ópticas • Cifrado AES-256',
    tabTranslator: 'Traductor',
    tabDecoder: 'Decodificador (Mic/Cámara)',
    tabKeyer: 'Manipulador',
    tabReference: 'Tabla Morse',
    torchActiveBadge: 'Flash LED',
    themeSystem: 'Sistema',
    themeDark: 'Oscuro',
    themeLight: 'Claro',

    securityTitle: 'Cifrado y Seguridad del Mensaje',
    cipherNone: 'Desactivado',
    cipherAes: 'AES-256-GCM',
    cipherVigenere: 'Vigenère (Radio)',
    cipherCaesar: 'César (ROT-N)',
    placeholderAesKey: 'Contraseña secreta para AES-256...',
    placeholderVigenereKey: 'Palabra clave alfabética (ej: VICTORIA)...',
    placeholderCaesarKey: 'Número de desplazamiento (1 a 25)...',
    generateKeyBtn: 'Generar Clave',
    descAes: 'Cifrado simétrico robusto de 256 bits con derivación PBKDF2',
    descVigenere: 'Cifra polialfabética clásica de comunicaciones de radio',
    descCaesar: 'Desplazamiento alfabético circular ROT-N',
    errorKeyRequired: 'Se requiere clave o contraseña',
    errorAesDecrypt: 'Error en el descifrado AES-256 (clave incorrecta o datos alterados)',
    encryptedIndicator: 'Asegurado',

    presetsLabel: 'Ejemplos:',
    swapDirection: 'Invertir sentido',
    clearAll: 'Borrar todo',
    sourceTextLabel: 'Texto de origen (Claro)',
    sourceMorseLabel: 'Código Morse de entrada',
    willBeEncrypted: '(será cifrado)',
    outputMorseLabel: 'Señal Código Morse',
    outputTextLabel: 'Texto Decodificado',
    placeholderText: 'Escriba su mensaje aquí (ej: SOS BARCO EN PELIGRO)...',
    placeholderMorse: 'Ingrese código morse (ej: ... --- ... / -.-. --.-)...',
    morseAppearsHere: 'El código morse aparecerá aquí...',
    textAppearsHere: 'El texto decodificado aparecerá aquí...',
    copyBtn: 'Copiar',
    copiedBtn: 'Copiado',
    pointsLabel: 'puntos',
    dashesLabel: 'rayas',
    symbolsLabel: 'símbolos',
    charsLabel: 'caracteres',
    wordsLabel: 'palabras',
    approxDuration: 'Duración estimada',
    cryptogramLabel: 'Criptograma:',

    startSignal: 'Transmitir señal',
    stopSignal: 'Detener emisión',
    exportWav: 'Exportar WAV',
    soundLabel: 'Sonido',
    screenLabel: 'Pantalla',
    torchLabel: 'Flash LED',
    torchUnavailable: 'Flash LED no disponible o denegado',
    wpmLabel: 'Velocidad de transmisión (WPM)',
    frequencyLabel: 'Frecuencia de tono (Tono CW)',
    wpmNovice: '5 (Principiante)',
    wpmStandard: '20 (Estándar ITU)',
    wpmFast: '40 (Rápido)',
    freqLow: '400 Hz (Grave)',
    freqStandard: '650 Hz (Estándar Radio)',
    freqHigh: '900 Hz (Agudo)',

    beaconTitle: 'Baliza Óptica / Señal Luminosa',
    fullscreenBtn: 'Pantalla completa',
    fullscreenTitle: 'TRANSMISIÓN ÓPTICA PANTALLA COMPLETA',
    stateActive: 'SEÑAL ACTIVA',
    stateIdle: 'ESPERA',
    stateWaiting: 'Esperando',
    dotName: 'PUNTO (TI)',
    dashName: 'RAYA (TAAH)',
    pressEscToExit: 'Presione Escape para salir',

    decoderTitle: 'Receptor y Decodificador en Vivo',
    decoderSubtitle: 'Escucha acústica por micrófono o análisis óptico de pulsos de luz por cámara.',
    modeMic: 'Micrófono (Audio)',
    modeCamera: 'Cámara (Óptico)',
    startCapture: 'Activar captura',
    stopCapture: 'Detener captura',
    resetCapture: 'Reiniciar',
    signalDetected: 'SEÑAL DETECTADA',
    silenceWaiting: 'SILENCIO / ESPERA',
    audioThreshold: 'Umbral Audio',
    luminanceThreshold: 'Umbral Luminancia',
    cameraStandby: 'Cámara en espera',
    cameraPrompt: 'Haga clic en "Activar captura" y apunte a la fuente de luz',
    roiLabel: 'ZONA DE MEDIDA ROI',
    receivedMorse: 'Código Morse Recibido',
    waitingForSignals: 'Esperando señales entrantes (puntos • y rayas —)...',
    decodedTextLabel: 'Texto Decodificado',
    rawReceivedLabel: 'Datos crudos recibidos:',
    decryptedMessageLabel: 'Mensaje descifrado:',
    decryptingActive: 'Descifrado activo',

    keyerTitle: 'Manipulador Telegráfico Manual',
    keyerSubtitle: 'Presione la barra espaciadora o el botón para transmitir. El ritmo se decodifica en tiempo real.',
    keyerPadIdle: 'HAGA CLIC O ESPACIO',
    keyerPadActive: 'CONTACTO CERRADO',
    keyerHint: 'Corto = Punto (•) | Largo = Raya (—)',
    currentSymbol: 'Símbolo actual:',
    detectedStream: 'Flujo Morse Detectado',
    keyerDecodedText: 'Texto Decodificado',
    referenceRhythm: 'Cadencia de referencia:',

    tableTitle: 'Tabla Oficial del Código Morse Internacional (ITU-R)',
    tableSubtitle: 'Haga clic en cualquier carácter para escuchar su señal sonora.',
    searchPlaceholder: 'Buscar (letra o morse)...',
    catLetters: 'Letras del Alfabeto (A — Z)',
    catNumbers: 'Números (0 — 9)',
    catSymbols: 'Puntuación y Símbolos de Radio',
    catAccents: 'Caracteres con Acento (Norma ITU)',

    footerNotice: 'Código Morse Internacional (ITU-R M.1677-1) • Estándar PARIS 50 unidades • Cifrado AES-256-GCM',
  },
};
