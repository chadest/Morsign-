# Morsign

## Description

**Morsign** est une application web complète de transmission et de réception en Code Morse International (conforme à la recommandation ITU-R M.1677-1). Elle permet de convertir du texte en Morse et inversement, d'émettre des signaux sonores et lumineux (via l'écran et la torche flash de l'appareil), de décoder en temps réel des signaux acoustiques par le microphone et des signaux optiques par la caméra, tout en intégrant des mécanismes de chiffrement militaire (AES-256-GCM) et historique pour sécuriser les communications.

---

## Fonctionnalités

### 1. Traduction & Encodage International (ITU-R)
* **Conversion bidirectionnelle** : Traduction instantanée de texte vers code Morse et de code Morse vers texte en temps réel.
* **Jeu de caractères complet** : Prise en charge des lettres (A–Z), chiffres (0–9), ponctuation, symboles radio officiels et caractères accentués européens (É, À, È, Ç, Ñ, Ö, Ü).
* **Cadence PARIS normalisée** : Calcul précis des durées d'impulsions (1 point = 1200 / WPM ms, 1 trait = 3 points, espacements normalisés).
* **Mesures et statistiques** : Décompte des points, traits, mots et estimation précise de la durée de transmission.

### 2. Émission Sonore & Optique
* **Synthèse audio Web Audio API** : Générateur de signal d'onde sinusoïdale pure avec enveloppe d'attaque et de relâchement (anti-clics) et fréquence ajustable (400 Hz à 900 Hz).
* **Vitesse de transmission réglable** : Vitesse modulable de 5 à 40 WPM (Words Per Minute).
* **Balise optique d'écran** : Voyant lumineux haute luminance et mode stroboscopique plein écran pour la signalisation à distance.
* **Flash LED de l'appareil** : Pilotage matériel de la torche arrière sur smartphones et tablettes via l'API MediaStream ImageCapture / Torch.
* **Exportation audio WAV** : Génération et téléchargement direct d'un fichier audio `.wav` PCM non compressé à 44,1 kHz.

### 3. Décodage en Direct (Microphone & Caméra)
* **Décodeur acoustique (Microphone)** :
  * Analyse spectrale en continu avec filtre passe-bande centré sur la tonalité Morse.
  * VU-mètre en direct et potentiomètre de seuil de sensibilité audio.
  * Détection automatique des durées d'impulsions et transcription en temps réel en texte.
* **Décodeur optique (Caméra)** :
  * Traitement vidéo en direct avec viseur et zone de mesure centrale (ROI).
  * Analyse de la luminance (Rec. 601) avec seuil d'hystérésis pour détecter les impulsions d'une lampe, d'un écran ou d'un flash externe.
  * Conversion en flux Morse et transcription textuelle instantanée.

### 4. Cryptage & Sécurité des Messages
* **Chiffrement AES-256-GCM** : Sécurisation moderne des messages avec dérivation de clé PBKDF2 (100 000 itérations), sel (salt) cryptographique et vecteur d'initialisation (IV) aléatoires.
* **Chiffres radio classiques** :
  * Chiffre de Vigenère polyalphabétique avec mot-clé.
  * Chiffre de César circulaire (ROT-N).
* **Déchiffrement automatique** : Déchiffrement à la volée des messages reçus par le traducteur ou décodés via le microphone et la caméra.

### 5. Manipulateur Télégraphique Manuel (Straight Key)
* **Clé télégraphique interactive** : Émission manuelle en pressant la barre d'espace ou le bouton tactile.
* **Reconnaissance du rythme** : Mesure de la durée d'appui pour classifier automatiquement les points et les traits et retranscrire le texte dicté.

### 6. Table Officielle de Référence
* **Répertoire complet ITU-R** classé par catégories (alphabet, chiffres, ponctuation, accents).
* **Écoute interactive** : Lecture instantanée du signal audio et visuel pour chaque caractère au rythme WPM sélectionné.
* **Recherche intégrée** : Filtrage rapide par lettre ou motif Morse.
