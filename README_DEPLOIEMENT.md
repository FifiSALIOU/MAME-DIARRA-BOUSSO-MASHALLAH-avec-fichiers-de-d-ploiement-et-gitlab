# 📦 Guide Rapide de Déploiement

Ce fichier résume rapidement les étapes pour déployer l'application.

## 🎯 Choix de la méthode d'hébergement

### Pour débutants → Services Cloud Managés
**Recommandé : Railway ou Render**
- ✅ Le plus simple
- ✅ Configuration automatique
- ✅ SSL/HTTPS inclus
- ✅ Pas besoin de serveur dédié
- 📖 Voir `DEPLOIEMENT_CLOUD.md`

### Pour contrôle total → Docker Compose
**Recommandé si vous avez un VPS**
- ✅ Isolation des services
- ✅ Facile à maintenir
- ✅ Configuration centralisée
- 📖 Voir `DEPLOIEMENT_DOCKER.md`

### Pour performance maximale → Déploiement Manuel
**Recommandé pour production critique**
- ✅ Performance native
- ✅ Contrôle total
- ⚠️ Plus complexe à configurer
- 📖 Voir `DEPLOIEMENT_MANUEL.md`

## 📋 Checklist avant déploiement

### 1. Préparer les fichiers de configuration

- [ ] Copier `.env.example` en `.env` et remplir toutes les valeurs
- [ ] Générer une `SECRET_KEY` sécurisée :
  ```bash
  python -c "import secrets; print(secrets.token_urlsafe(32))"
  ```
- [ ] Configurer les credentials PostgreSQL
- [ ] Configurer les credentials SMTP pour les emails

### 2. Configuration CORS

- [ ] Mettre à jour `ALLOWED_ORIGINS` dans `.env` avec votre domaine de production
- [ ] Ou modifier directement `backend/app/main.py` si vous préférez

### 3. Configuration Frontend

- [ ] Créer `.env.production` dans `frontend/ticket-frontend/`
- [ ] Définir `VITE_API_URL` avec l'URL de votre backend de production

### 4. Base de données

- [ ] Créer la base de données PostgreSQL
- [ ] Exécuter `python init_db.py` pour initialiser les tables
- [ ] (Optionnel) Exécuter `python create_test_users.py` pour créer des utilisateurs de test

## 🚀 Déploiement rapide avec Docker (5 minutes)

```bash
# 1. Cloner le projet
git clone <votre-repo> tickets-app
cd tickets-app/BARKI-MAME-DIARRA-BOUSSO

# 2. Créer le fichier .env
cp .env.example .env
nano .env  # Modifier les valeurs

# 3. Construire et démarrer
docker-compose up -d --build

# 4. Initialiser la base de données
docker-compose exec backend python init_db.py

# 5. Vérifier que tout fonctionne
docker-compose ps
docker-compose logs -f
```

## 🌐 Déploiement sur Railway (10 minutes)

1. **Créer un compte** sur [railway.app](https://railway.app)
2. **Nouveau projet** → Connecter votre repo GitHub
3. **Ajouter PostgreSQL** (automatique)
4. **Configurer les variables d'environnement** (voir `DEPLOIEMENT_CLOUD.md`)
5. **Déployer** → Railway fait le reste automatiquement

## 🔒 Sécurité - Points critiques

### ⚠️ À faire ABSOLUMENT avant la production

1. **Changer `SECRET_KEY`** : Utiliser une clé générée aléatoirement
2. **Changer les mots de passe PostgreSQL** : Ne jamais utiliser les valeurs par défaut
3. **Configurer HTTPS** : Obligatoire pour la production
4. **Configurer CORS** : Autoriser uniquement votre domaine de production
5. **Sauvegardes** : Configurer des sauvegardes automatiques de la base de données

### 🔐 Génération de SECRET_KEY sécurisée

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

## 📊 Vérification après déploiement

### Tests à effectuer

1. **Backend accessible** :
   ```bash
   curl https://api.votre-domaine.com/docs
   ```

2. **Frontend accessible** :
   - Ouvrir `https://votre-domaine.com` dans un navigateur

3. **Connexion fonctionne** :
   - Tester la connexion avec un utilisateur de test
   - Vérifier que les données se chargent

4. **API fonctionne** :
   - Tester quelques endpoints depuis le frontend
   - Vérifier les logs pour les erreurs

## 🆘 Problèmes courants

### Backend ne démarre pas
- Vérifier les variables d'environnement
- Vérifier les logs : `docker-compose logs backend`
- Vérifier que PostgreSQL est accessible

### Erreur CORS
- Vérifier que votre domaine est dans `ALLOWED_ORIGINS`
- Vérifier que `VITE_API_URL` pointe vers le bon backend
- Redémarrer le backend après modification

### Erreur de connexion à la base de données
- Vérifier les credentials PostgreSQL
- Vérifier que PostgreSQL est démarré
- Vérifier les règles de firewall

## 📚 Documentation complète

- **Guide général** : `GUIDE_HEBERGEMENT.md`
- **Docker** : `DEPLOIEMENT_DOCKER.md`
- **Manuel** : `DEPLOIEMENT_MANUEL.md`
- **Cloud** : `DEPLOIEMENT_CLOUD.md`

## 💡 Conseils

1. **Commencez par un déploiement de test** avant la production
2. **Testez toutes les fonctionnalités** après déploiement
3. **Configurez les sauvegardes** dès le début
4. **Surveillez les logs** régulièrement
5. **Mettez à jour** régulièrement les dépendances

## 📞 Support

En cas de problème :
1. Vérifier les logs des services
2. Consulter la documentation détaillée
3. Vérifier la configuration des variables d'environnement
4. Vérifier la connectivité réseau
