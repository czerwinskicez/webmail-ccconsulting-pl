# CC Consulting Webmail

Next.js App Router, TypeScript i ciemny interfejs. Logowanie jednym kluczem, chroniony dashboard, komponowanie ofert w edytorze Tiptap i wysyłka przez Resend. Podpis jest przechowywany w prywatnym Vercel Blob.

## Lokalnie

Wymagany Node.js >= 20.9.

```powershell
npm install
Copy-Item .env.example .env.local
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Wklej wygenerowaną wartość do `WEBMAIL_SECRET` w `.env.local`, następnie:

```powershell
npm run dev
```

Otwórz http://localhost:3000 i zaloguj się ustawionym kluczem. Zalecany klucz to 64 znaki hex z generatora powyżej. Pusty klucz lub klucz dłuższy niż 1024 znaki blokuje logowanie. Pliki `.env` są ignorowane przez Git. Nie dodawaj prefiksu `NEXT_PUBLIC_`.

Do działania wysyłek dodaj także `RESEND_API_KEY`. Nadawca jest ustawiony na `Cezary Czerwiński <biuro@ccconsulting.pl>`, dlatego domena `ccconsulting.pl` musi być zweryfikowana w Resend. Wiadomości do wielu odbiorców są wysyłane osobno; nie zawierają automatycznego UDW.

Połącz z projektem prywatny Vercel Blob i udostępnij mu `BLOB_STORE_ID` oraz `BLOB_READ_WRITE_TOKEN`. Lokalną konfigurację można pobrać poleceniem `vercel env pull`. Blob przechowuje podpis, archiwum wysłanych wiadomości oraz ich załączniki. Tymczasowe kopie załączników są usuwane po zakończeniu próby wysyłki; obsługiwanych jest maksymalnie 10 plików i 20 MB łącznie. Archiwum jest dostępne wyłącznie do odczytu pod `/dashboard/wyslane`.

## Vercel

1. Umieść projekt w repozytorium Git i zaimportuj je do Vercel jako projekt Next.js.
2. W Settings → Environment Variables dodaj `WEBMAIL_SECRET` z wygenerowanym losowym kluczem i `RESEND_API_KEY`. Dla Preview użyj osobnych kluczy.
3. Wdróż projekt. Zmiana zmiennych środowiskowych wymaga ponownego wdrożenia.
4. W Settings → Domains dodaj `webmail.ccconsulting.pl` i ustaw rekord DNS zgodnie z wartością pokazaną przez Vercel. Vercel obsłuży HTTPS.

## Sesje

Serwer sprawdza klucz i podpisuje token HMAC-SHA256. Ciasteczko nie zawiera klucza; ma `HttpOnly`, `SameSite=Strict`, ścieżkę `/`, a na produkcji `Secure` i prefiks `__Host-`. Sesja wygasa po 7 dniach. Dashboard sprawdza autoryzację po stronie serwera przy każdym żądaniu. Zmiana klucza unieważnia wszystkie wcześniejsze sesje. Wylogowanie usuwa ciasteczko z przeglądarki; skopiowany token pozostaje ważny do wygaśnięcia lub zmiany klucza.

Przy dodawaniu kolejnych operacji i endpointów sprawdzaj uprawnienia również w ich kodzie, nie tylko w układzie strony. Aplikacja nie ma współdzielonego limitera prób logowania; przed publicznym udostępnieniem ustaw regułę rate limiting w Vercel Firewall lub dodaj limiter ze wspólnym magazynem. Nie zastępuj losowego klucza krótkim hasłem.

## Weryfikacja

```powershell
npm run lint
npm run typecheck
npm test
npm run build
npx playwright test
```

Implementacja sesji korzysta z serwerowych cookies i Server Actions opisanych w [dokumentacji Next.js](https://nextjs.org/docs/app/guides/authentication).
