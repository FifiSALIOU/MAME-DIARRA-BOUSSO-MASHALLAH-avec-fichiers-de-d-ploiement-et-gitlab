# Variables à créer dans GitLab (Settings → CI/CD → Variables)

Les variables ne sont **pas** dans `.gitlab-ci.yml` ; elles doivent être créées dans GitLab.

**Où :** Projet GitLab → **Settings** → **CI/CD** → section **Variables** → **Add variable**.

---

## Liste des variables à ajouter

Cliquez sur **Add variable** pour chaque ligne ci-dessous.

| Key | Value | Options |
|-----|--------|--------|
| `DOCKER_DRIVER` | `overlay2` | Protégée : non, Masquée : non |
| `DOCKER_TLS_CERTDIR` | *(laisser vide)* | Protégée : non, Masquée : non |
| `DOCKER_BUILDKIT` | `1` | Protégée : non, Masquée : non |
| `BACKEND_IMAGE` | `$CI_REGISTRY_IMAGE/backend:$CI_COMMIT_REF_SLUG` | **Expand variable reference : coché** |
| `FRONTEND_IMAGE` | `$CI_REGISTRY_IMAGE/frontend:$CI_COMMIT_REF_SLUG` | **Expand variable reference : coché** |
| `BACKEND_IMAGE_LATEST` | `$CI_REGISTRY_IMAGE/backend:$CI_COMMIT_REF_SLUG` | **Expand variable reference : coché** |
| `FRONTEND_IMAGE_LATEST` | `$CI_REGISTRY_IMAGE/frontend:$CI_COMMIT_REF_SLUG` | **Expand variable reference : coché** |

---

## Important pour les 4 variables d’images

Pour **BACKEND_IMAGE**, **FRONTEND_IMAGE**, **BACKEND_IMAGE_LATEST** et **FRONTEND_IMAGE_LATEST** :

- Cochez **Expand variable reference** pour que GitLab remplace `$CI_REGISTRY_IMAGE` et `$CI_COMMIT_REF_SLUG` au moment du job.
- Ne cochez pas **Mask variable** (les valeurs contiennent des références `$...`).

---

## Optionnel (build frontend)

| Key | Value |
|-----|--------|
| `VITE_API_URL` | `http://localhost:8000` ou l’URL de votre API en production |

Une fois ces variables ajoutées, le pipeline utilisera celles de GitLab et plus aucune variable d’image dans le fichier.
