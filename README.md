# Jarvis — assistant IA 100 % gratuit pour GitHub Pages

Inspiré de la vidéo « I Built A Real Life Jarvis That Can Design Parts! » (Naz Louis) : un assistant vocal qui gère vos projets par phases, garde un tableau d'inspiration et conçoit des pièces en 3D.

## Déploiement (2 minutes)
1. Créez un dépôt GitHub public et déposez-y ces fichiers à la racine.
2. **Settings → Pages → Deploy from a branch → `main` / `(root)`**.
3. Ouvrez `https://<vous>.github.io/<dépôt>/`, collez votre clé gratuite de <https://console.groq.com/keys> dans les réglages.

Aucun serveur : tout tourne dans le navigateur (clé, mémoire et projets restent dans `localStorage`).

## Fonctions
- **Chat en streaming** via l'API Groq (liste des modèles chargée dynamiquement).
- **Mémoire** : faits durables enregistrés par Jarvis (modifiables dans le panneau), injectés à chaque requête.
- **Projets par phases** + **tableau d'inspiration** (notes, liens, images) connus de Jarvis.
- **Voix** : synthèse vocale et dictée du navigateur, mode mains libres, repli Whisper (Groq) sans Web Speech.
- **3D** : Three.js, pièces paramétriques, export **STL** pour l'impression 3D.
- **Visualisations** : Chart.js, pages HTML/SVG, exécution de JavaScript, le tout dans un bac à sable isolé.

## Fichiers
`index.html` · `style.css` · `app.js` · `.nojekyll`
