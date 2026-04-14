# Cocaltrain

Веб-приложение для тренировки слуха, разучивания песен по фразам и отработки интонации.

## Как запустить локально

1. Установи Node.js 20+.
2. Установи зависимости:

   ```bash
   npm install
   ```

3. Запусти dev-сервер:

   ```bash
   npm run dev
   ```

4. Открой адрес из терминала.
5. Для production-сборки:

   ```bash
   npm run build
   npm run preview
   ```

## Что внутри

- тренировка по нотам
- тренировка по фразам
- режим полного прохода песни
- микрофон и определение высоты звука
- каталог песен через JSON manifest
- выбор песни на главном экране

## Стек

- React
- Vite
- TypeScript
- CSS
- Web Audio API

## Как теперь хранятся песни

Каталог лежит в `public/songs/index.json`.

Каждая запись в каталоге хранит:
- `id`
- `title`
- `artist`
- `tempo`
- `defaultKey`
- `range`
- `file`

Полная схема песни лежит в отдельном JSON-файле, на который указывает `file`.

Пример структуры:

```text
public/
  songs/
    index.json
    net-bez-trevog.json
    svet-v-okne.json
```

## Структура

```text
public/
  songs/
    index.json
    net-bez-trevog.json
    svet-v-okne.json
src/
  data/
    demoSong.ts
  features/
    audio/
    pitch/
    songs/
    training/
  lib/
  types/
  App.tsx
  main.tsx
  index.css
```

## Что сделано

- экран выбора песни на главной
- загрузка каталога из JSON
- загрузка выбранной песни из JSON
- режимы phrases / notes / full работают от выбранной песни
- состояния loading / empty / error для каталога и песни
- текущий прогресс хранится отдельно для каждой песни

## Следующий шаг

Подключить реальные `fullmix / vocal / instrumental` и применить громкости дорожек к настоящему микшеру, а не только к эталонным тонам.
