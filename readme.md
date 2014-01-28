# Perfite

Problématique: Conception / Développement d'une solution de monitoring
de perfs coté clients, comme http://speedcurve.com (pour moi la
meilleure solution commerciale du moment, se basant sur webpagetest).

- Récupération des métriques
- Exploitation, affichage et gestion des métriques au niveau d'une
  application web ou dashboard.

# Tasks

- Setup Graphite server
- Setup AT component (PhantomJS package, gather metrics, send remotely
  to graphite)
- Setup webserver component (webapp)

### Webapp

1. Manage test scenario
2. First page is the list of scenarios
3. A scenario is a testing feature to be pushed to AT, and run on a
   specific frequency
4. AT push results back to the server
5. Webapp shows result

# Meeting notes

## Architecture

Très rapide et haut niveau.

1. Graphite pour collection / stockage des métriques (rétention données
   ?), Autre chose pour stockage HAR (rétention données ?)
2. Récup métriques: Utilisation de soit PhantomJS (plus simple, moins
   d'infra, on a l'xp), soit webpagetest (idéalement et à terme, c'est
   ce qu'on doit viser)
3. Webapp permettant de gérer les métriques et de les exploiter
   (probablement du play2 ou nodejs)
4. Graphite + Plugin et définition de certains seuils pour alerting /
   monitoring

Nous aurons besoin à terme d'une machine permettant de host la partie
"server / webapp", et 1-n agents de tests disséminés de part le monde
(idéalement 2-3).

Les agents de tests peuvent dans un premier temps se contenter de
PhantomJS, lancer l'analyse de perf et envoie des métriques à Graphite.
Dans un second temps, si l'on y arrive, on remplace la partie PhantomJS
par Webpagetest pour récupérer toutes les métriques possibles et
imaginables (plus support Chrome / Firefox / IE9-10-11)

diagram witbo


## Métriques

- Full HAR par URL
- Liste des métriques (nb requêtes, taille moyenne JS / CSS, time to
  first byte etc. - voir https://github.com/macbre/phantomas#metrics
  pour une liste des métriques possibles)
- Solution "simple": PhantomJS, phantomas & har-graphite

## Kelkoo & Third parties

Une contrainte forte: possibilité de monitorer Kelkoo vs reste du monde.

Beacons, pub & ads, waiting page etc. Nous voulons être en mesure de
grapher les performances des pages globales, et par beacons / domaine
différents de kelkoo. Nous voulons pouvoir établir une corrélation entre
drop de perf sur la page, avec certains beacons ou ads. (cf.
http://blog.catchpoint.com/2010/07/20/3rd-party-performance-monitoring/
pour plus d'info sur le concept)

## Perf & non regression

Nous devrons être vigilent sur la partie réseau et accès a nos
plateformes de dev / QA, pour pouvoir lancer les tests de perfs sur des
env internes.

L'avantage du développement de la solution kelkoo nous permet ça. Le
partenariat ac un organisme commercial comme witbe ou speedcurve nous
permet de monitorer "que la prod" (ce qui est déja bien).

L'idée est d'avoir le tooling et l'infrastructure pour pouvoir mettre
facilement une politique de non régression de perf.


## Divers

Possibilité de définir des "scénarios". Probablement format Gherkin
(Given / When / Then)

Witbe offre le même type de service (navig telle URL, click sur un lien,
attends event, lance analyse). L'application web devrait pouvoir fournir
une IHM pour pouvoir gérer les scénarios, voire même les éditer depuis
l'interface (ou plus simple, un simple repo SVN / Git quelque part)


Note / Interrogation: J'ai une idée claire de comment pouvoir le mettre
en place avec PhantomJS, beaucoup moins avec webpagetest.

## Dashboard

Prévoir un focus sur features à implémenter, concernant gestions des
scénarios de test (page à prévoir, feature, etc.)

1. Graphs / métriques
2. IHM pour gestion tests
  - URLs
  - Fréquence
  - Type de métriques monitorés
  - Seuils métriques
  - Alarming
