# AEK CK & HRV Monitor

Praćenje kreatin kinaze i varijabilnosti srčanog ritma za prvi tim AEK Athens FC.
Jedna stranica, bez build-a. Odvojena od Player Hub-a: svoja tabela, svoj skript, svoj link.

**Živo:** https://goranbasaric77-netizen.github.io/aek-ck/

## Kako se radi zajedno

Svaki član staffa otvori isti link i ukuca svoj PIN. Vrednost koju neko upiše stiže u
zajedničku Google tabelu istog trenutka, a kod ostalih se pojavi čim pogledaju aplikaciju,
najkasnije za dvadesetak sekundi. Pored svake vrednosti piše ko ju je uneo.

Dvoje mogu da kucaju isti dan u isto vreme: spajanje ide po igraču, ne po danu, pa se
unosi ne gaze. Ako nema mreže, vrednosti čekaju u redu i same odlaze kad se veza vrati;
tačkica u zaglavlju je zelena kad je sve poslato, žuta dok šalje, crvena kad ne može.

Postavljanje zadnjeg dela je opisano u [backend/UPUTSTVO.md](backend/UPUTSTVO.md).

## Ekrani

Levi meni ima tri sekcije.

**Creatine kinase** — Squad (status celog tima), Draw entry (unos jednog vađenja za ceo tim),
Baseline (2 do 4 mirna uzorka po igraču, referenca na koju se sve ostalo poredi).

**Heart rate variability** — Status (jutarnje stanje tima), Morning entry (RMSSD i puls),
Method (protokol merenja i kako se čita, sa referencama).

**Everything else** — Player (karton igrača sa oba markera i grafikonima) i Data
(pragovi, izvoz CSV, rezervna kopija, spisak igrača).

## Kako se čita

CK se nikad ne gleda prema fiksnoj granici nego prema sopstvenoj baznoj liniji igrača:
Elevated na 1.5x, High na 2x. Posle utakmice je 2 do 4 puta iznad mirne vrednosti normalno
i vraća se za 48 do 72 sata.

HRV se unosi kao RMSSD u milisekundama. Aplikacija računa lnRMSSD, prikazuje skor
20 x lnRMSSD i crta lični opseg: prosek 28 dana plus minus 0.5 SD. Jedno jutro ispod
opsega je Watch, dva uzastopna ili sedmodnevni prosek ispod opsega je Low. Igrači se
nikad ne porede međusobno.

Na ekranu Squad stoji kartica **Read together**: igrači kod kojih je CK povišen i HRV u
isto vreme pao. To je par koji nosi odluku; pojedinačno je svaki od njih obično normalan
odgovor na opterećenje.

Oba markera su sito za pažnju, ne dijagnoza. Čitaju se uz jutarnji upitnik, plan sesije
i GPS izlaz, a odluka o treningu ostaje na struci.

## Fajlovi

```
index.html          cela aplikacija
config.js           URL zadnjeg dela (bez njega radi samo lokalno)
backend/Code.gs     Google Apps Script
backend/UPUTSTVO.md postavljanje, korak po korak
```
