// Fonction pour nettoyer le localStorage si nécessaire
export const clearAuthStorage = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  console.log('🧹 localStorage nettoyé');
};

// Appel automatique au chargement si des données corrompues sont détectées
try {
  const storedUser = localStorage.getItem('user');
  if (storedUser) {
    const user = JSON.parse(storedUser);
    // Vérifier si l'utilisateur a les nouvelles propriétés multi-tenant
    if (!user.hasOwnProperty('organizationId')) {
      console.log('⚠️ Données utilisateur obsolètes détectées, nettoyage...');
      clearAuthStorage();
    }
  }
} catch (error) {
  console.log('❌ Erreur lors de la lecture du localStorage, nettoyage...');
  clearAuthStorage();
}