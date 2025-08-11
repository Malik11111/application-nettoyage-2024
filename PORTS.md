# 🔧 Gestion des Ports - Application Nettoyage

## 🎯 Solutions pour éviter les conflits

### 1. **Script Intelligent (Recommandé)**
Utilisez `start.bat` - il vous laisse choisir :
- Ports par défaut (3000/4000)
- Ports alternatifs (8080/8081)  
- Ports personnalisés
- Ports automatiques (évite conflits)

### 2. **Changement manuel des ports**

#### Frontend (React/Vite) :
```bash
npm run dev -- --port 8080    # Change vers port 8080
npm run dev -- --port 9000    # Change vers port 9000
npm run dev                    # Port automatique (évite conflits)
```

#### Backend (Node.js) :
```bash
set PORT=8081 && npm run dev   # Windows
PORT=8081 npm run dev          # Linux/Mac
```

### 3. **Variables d'environnement**

Créez un fichier `.env.local` dans le frontend :
```
VITE_PORT=8080
VITE_BACKEND_URL=http://localhost:8081
```

### 4. **Configuration proxy automatique**

Le `start.bat` met à jour automatiquement :
- Le CORS du backend
- Le proxy Vite du frontend
- Les URLs de connexion

## 🚨 En cas de conflit

```bash
# Voir quels ports sont occupés
netstat -ano | findstr :3000

# Tuer processus Node.js
taskkill /F /IM node.exe

# Ou utiliser le script (plus propre)
start.bat
```

## 📱 URLs selon votre choix

| Option | Frontend | Backend |
|--------|----------|---------|
| Défaut | http://localhost:3000 | http://localhost:4000 |
| Alternatif | http://localhost:8080 | http://localhost:8081 |
| Personnalisé | Votre choix | Votre choix |
| Auto | Vite décide | Node décide |

**🎯 Conseil : Le script `start.bat` évite tous les problèmes !**