# usage-band

Un mod Claude Code qui affiche, sur une seule ligne au-dessus de la zone de saisie, où tu en es :

```
[ S (72k/200k) $0.17 ]  [ 5h ━━────── 8% +21.5% 3h ]  [ Semaine ━─────── 10% +3.9% 6j ]
```

- **Contexte** : tokens utilisés sur la taille de la fenêtre, dans une pastille qui se remplit (bleue, orange à 70 %, rouge à 90 %).
- **Coût** : coût estimé de la session, tel que `/cost` le calcule. C'est une estimation, pas une facture.
- **5h** et **Semaine** : quota utilisé avec une barre, le pourcentage, la hausse depuis le début de la session (en vert) et le temps restant avant la remise à zéro.

Les quotas 5h et semaine n'apparaissent que sur un abonnement Claude, après la première réponse du modèle.

## Installation

Dans une session Claude Code lancée depuis un terminal :

```
/plugin install usage-band --marketplace SteveMav/claude-usage-band
```

Réponds `y` pour ajouter le marketplace, puis choisis la portée (user pour l'avoir dans toutes tes sessions).

Depuis un shell :

```
claude plugin install usage-band --marketplace SteveMav/claude-usage-band
```

Dans l'app desktop, où `/plugin` ne fonctionne pas : clique sur **+** à côté de la zone de saisie, puis **Plugins**, **Add marketplace** avec `SteveMav/claude-usage-band`, puis **Add plugin**.

Une fois installé à la portée user, la barre s'affiche aussi dans l'onglet Code de l'app desktop.

## Licence

MIT
