# Postavljanje zadnjeg dela

> **Vec je postavljeno 07.11.2026.** Tabela, skript i objavljivanje su gotovi, `config.js` ima
> adresu, aplikacija deli podatke. Ispod je opis za slucaj da nesto treba ponoviti ili razumeti.
>
> - Tabela: Google Drive, `AEK CK & HRV` (listovi Staff, Days, Base, Squad, Cfg)
> - Skript: script.google.com, projekat `AEK CK & HRV`, verzija objave 1
> - PIN-ovi: u listu **Staff** u tabeli. Tamo se i menjaju, i tamo upisujes pravo ime saradnika.
>   Ne lepiti ih u ovaj repo, javan je.

Ovo je zasebna tabela i zaseban skript. Player Hub se ne dira.

## 1. Tabela

Na drive.google.com napravi praznu Google tabelu i nazovi je `AEK CK & HRV`.
Iz adrese prepisi ID, to je deo izmedju `/d/` i `/edit`:

```
https://docs.google.com/spreadsheets/d/OVAJ_DEO_JE_ID/edit
```

## 2. Skript

1. Otvori https://script.google.com i napravi novi projekat, nazovi ga `AEK CK & HRV`.
2. Obrisi ono sto pise u `Code.gs` i zalepi ceo sadrzaj fajla `backend/Code.gs` iz ovog repoa.
3. U drugom redu odozgo, u `var SHEET_ID = "";` izmedju navodnika upisi ID tabele iz koraka 1.
4. Sacuvaj (disketa).

## 3. Prvo pokretanje

U editoru gore izaberi funkciju `setup` i klikni Run. Google ce prvi put traziti dozvolu:
Review permissions, izaberi svoj nalog, Advanced, Go to AEK CK & HRV (unsafe), Allow.
To je normalno za sopstvene skriptove.

Kada zavrsi, iskocice prozorcic sa dva PIN-a, tvojim i saradnikovim. **Prepisi ih.**
Kasnije ih vidis i menjas u listu `Staff` u tabeli, tamo menjas i imena.

## 4. Objavljivanje

Deploy > New deployment > zupcanik > Web app

- Execute as: **Me**
- Who has access: **Anyone**

Deploy, pa kopiraj Web app URL. Zavrsava se na `/exec`.

`Anyone` znaci da svako ko pogodi URL moze da posalje zahtev, ali bez ispravnog PIN-a
ne dobija nista i ne moze nista da upise. PIN je jedina brava, zato ga ne lepi u poruke
zajedno sa linkom.

## 5. Povezivanje aplikacije

U fajlu `config.js` u korenu repoa upisi taj URL:

```js
window.AEK_CK = { url: "https://script.google.com/macros/s/.../exec" };
```

Pa push na GitHub. Za minut-dva stranica je ziva.

## 6. Prvo otvaranje

Otvori https://goranbasaric77-netizen.github.io/aek-ck/ i ukucaj svoj PIN.
Saradniku posalji isti link i **njegov** PIN, odvojenom porukom.

## Kasnije izmene

Posle svake izmene `Code.gs`: zalepi novi sadrzaj u editor, pa
Deploy > Manage deployments > olovka > Version: New version > Deploy.
URL ostaje isti, `config.js` se ne dira.

## Sta gde stoji u tabeli

| List | Sta drzi |
|---|---|
| Staff | PIN, ime i da li je nalog aktivan. Jedini list koji ti menjas rukom. |
| Days | Jedan red po danu po markeru (ck ili hrv). Vrednosti svih igraca su u jednoj JSON celiji. |
| Base | CK bazna linija po igracu. |
| Squad | Spisak igraca onakav kakav je u aplikaciji. |
| Cfg | Pragovi (CK 1.5x i 2x, HRV opseg) koje svi dele. |

Redovi se ne gomilaju: jedan dan je jedan red koji se dopunjuje, pa tabela ostaje mala
i kroz celu sezonu.
