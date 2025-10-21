# 🚀 Guide de déploiement sur Vercel avec Stripe

Ce guide vous aide à déployer votre application de réservation de gâteaux sur Vercel avec paiements Stripe fonctionnels.

## 📋 Prérequis

- Compte GitHub (gratuit)
- Compte Vercel (gratuit) - https://vercel.com
- Compte Stripe (gratuit en mode test) - https://stripe.com

## ⚡ Déploiement rapide (5 minutes)

### Étape 1 : Pousser le code sur GitHub

```bash
# Assurez-vous que tous les fichiers sont bien commités
git status
git add .
git commit -m "feat: add Stripe payment integration with Vercel Functions"
git push origin main
```

### Étape 2 : Connecter Vercel à GitHub

1. Allez sur https://vercel.com
2. Cliquez sur **"Add New Project"**
3. Sélectionnez **"Import Git Repository"**
4. Choisissez votre repository `birthday-reservation-fred`
5. Cliquez sur **"Import"**

### Étape 3 : Configurer les variables d'environnement

**IMPORTANT** : Avant de déployer, configurez ces variables :

1. Dans Vercel, allez dans **Settings → Environment Variables**
2. Ajoutez ces 5 variables :

| Variable Name | Value | Where to find it |
|--------------|-------|------------------|
| `VITE_STRIPE_PUBLISHABLE_KEY` | `pk_test_51SGXawJd...` | Stripe Dashboard → Developers → API keys |
| `STRIPE_SECRET_KEY` | `sk_test_51SGXawJd...` | ⚠️ GARDEZ SECRÈTE |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | On le configurera après |
| `RESEND_API_KEY` | `re_...` | Resend Dashboard → API Keys |
| `RESEND_FROM_EMAIL` | `onboarding@resend.dev` | Pour test, ou votre email vérifié |

**Note** : Pour l'instant, laissez `STRIPE_WEBHOOK_SECRET` vide, on le configurera à l'étape 5.

**Pour Resend** :
- Allez sur https://resend.com et créez un compte (gratuit)
- Dans **API Keys**, créez une nouvelle clé
- Pour tester, utilisez `onboarding@resend.dev` comme email expéditeur
- Pour la production, vérifiez votre propre domaine

### Étape 4 : Déployer

1. Vercel va automatiquement détecter Vite
2. Cliquez sur **"Deploy"**
3. Attendez 2-3 minutes ☕
4. Votre app est en ligne ! 🎉

Vous aurez une URL comme : `https://birthday-reservation-fred.vercel.app`

### Étape 5 : Configurer les webhooks Stripe

Les webhooks permettent à Stripe de confirmer les paiements de manière sécurisée.

1. **Allez dans Stripe Dashboard** :
   - https://dashboard.stripe.com/test/webhooks

2. **Créez un nouveau webhook** :
   - Cliquez sur **"+ Add endpoint"**
   - URL : `https://VOTRE-APP.vercel.app/api/webhook`
   - Événements à écouter :
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
     - `charge.succeeded`
     - `charge.refunded`

3. **Récupérez la clé secrète du webhook** :
   - Après création, cliquez sur le webhook
   - Copiez le "Signing secret" (commence par `whsec_...`)

4. **Ajoutez la clé dans Vercel** :
   - Retournez dans Vercel → Settings → Environment Variables
   - Modifiez `STRIPE_WEBHOOK_SECRET` avec la valeur copiée
   - **Important** : Redéployez l'application pour appliquer les changements

## 🧪 Tester les paiements

### Cartes de test Stripe

Une fois déployé, testez avec ces cartes :

| Carte | Résultat attendu |
|-------|------------------|
| `4242 4242 4242 4242` | ✅ Paiement réussi |
| `4000 0000 0000 0002` | ❌ Carte refusée |
| `4000 0000 0000 9995` | ❌ Fonds insuffisants |
| `4000 0000 0000 9987` | ❌ Carte perdue |

**Pour tous les tests** :
- Date d'expiration : n'importe quelle date future
- CVC : n'importe quel 3 chiffres
- Code postal : n'importe quoi

### Vérifier que tout fonctionne

1. **Frontend** :
   - Allez sur votre URL Vercel
   - Créez une commande
   - Testez un paiement avec `4242 4242 4242 4242`
   - ✅ Le paiement devrait réussir

2. **Backend (API)** :
   - Ouvrez la console de votre navigateur (F12)
   - Vous devriez voir : `"Payment confirmed successfully"`

3. **Webhooks** :
   - Allez dans Stripe Dashboard → Webhooks
   - Vous devriez voir les événements reçus
   - ✅ Status: `200 OK`

## 🔒 Passer en production

Quand vous êtes prêt pour de vrais paiements :

### 1. Activez votre compte Stripe

- Complétez les informations de votre entreprise
- Ajoutez les détails bancaires
- Activez le mode production

### 2. Utilisez les vraies clés

Dans Vercel, remplacez les clés test par les clés de production :

- `VITE_STRIPE_PUBLISHABLE_KEY` → `pk_live_...`
- `STRIPE_SECRET_KEY` → `sk_live_...`
- `STRIPE_WEBHOOK_SECRET` → Créez un nouveau webhook avec l'URL de production

### 3. Testez en production

⚠️ **Important** : Testez d'abord avec de petits montants !

## 📊 Surveiller les paiements

### Dans Stripe Dashboard

- **Paiements** : https://dashboard.stripe.com/payments
- **Logs** : https://dashboard.stripe.com/logs
- **Webhooks** : https://dashboard.stripe.com/webhooks

### Dans Vercel

- **Logs des fonctions** : Vercel Dashboard → Your Project → Functions
- **Erreurs** : Vous verrez les erreurs dans les logs

## 🐛 Dépannage

### Les paiements ne fonctionnent pas

**Symptôme** : Erreur "Failed to create payment intent"

**Solutions** :
1. Vérifiez que `STRIPE_SECRET_KEY` est bien configurée dans Vercel
2. Regardez les logs Vercel : Dashboard → Functions → Logs
3. Vérifiez que l'API `/api/create-payment-intent` répond

**Test rapide** :
```bash
curl https://VOTRE-APP.vercel.app/api/create-payment-intent \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"amount": 5000}'
```

### Les webhooks ne sont pas reçus

**Symptôme** : Les paiements passent mais les webhooks ne sont pas déclenchés

**Solutions** :
1. Vérifiez l'URL du webhook dans Stripe Dashboard
2. Elle doit être : `https://VOTRE-APP.vercel.app/api/webhook`
3. Testez le webhook avec le bouton "Send test webhook" dans Stripe

### Erreur CORS

**Symptôme** : Erreur "CORS policy" dans la console

**Solutions** :
1. Le fichier `vercel.json` est déjà configuré avec les headers CORS
2. Si le problème persiste, redéployez l'app

## 📝 Structure du backend

```
api/
├── create-payment-intent.js  # Crée un PaymentIntent Stripe
└── webhook.js                # Reçoit les confirmations Stripe
```

## 🔐 Sécurité

### ✅ Bonnes pratiques appliquées

- ✅ Clé secrète Stripe uniquement côté serveur
- ✅ Validation des webhooks avec signature Stripe
- ✅ Variables d'environnement sécurisées
- ✅ CORS configuré correctement

### ⚠️ À NE JAMAIS FAIRE

- ❌ Commiter les clés secrètes dans Git
- ❌ Exposer `STRIPE_SECRET_KEY` dans le frontend
- ❌ Désactiver la vérification des webhooks

## 💰 Coûts

### Vercel (tier gratuit)

- ✅ 100 Go de bande passante / mois
- ✅ Déploiements illimités
- ✅ Fonctions serverless incluses
- 💵 Au-delà : ~$20/mois

### Stripe

- ✅ Mode test : Gratuit et illimité
- 💵 Mode production : 2.9% + ¥40 par transaction

## 🎓 Ressources

- [Documentation Vercel](https://vercel.com/docs)
- [Documentation Stripe](https://stripe.com/docs)
- [Stripe Test Cards](https://stripe.com/docs/testing)
- [Vercel Functions](https://vercel.com/docs/functions)

## 🆘 Besoin d'aide ?

1. **Vercel Support** : https://vercel.com/support
2. **Stripe Support** : https://support.stripe.com
3. **GitHub Issues** : Créez une issue dans votre repository

---

🎉 **Félicitations !** Votre application est maintenant déployée avec des paiements Stripe fonctionnels !
