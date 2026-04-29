# Реальные аудиодорожки

Проект уже поддерживает описание аудиодорожек в JSON-песне через поле `tracks`.

```json
{
  "tracks": {
    "fullmix": "songs/audio/song-fullmix.mp3",
    "vocal": "songs/audio/song-vocal.mp3",
    "instrumental": "songs/audio/song-instrumental.mp3"
  }
}
```

## Как хранить файлы

Рекомендуемая структура:

```text
public/
  songs/
    index.json
    net-bez-trevog.json
    svet-v-okne.json
    audio/
      net-bez-trevog-fullmix.mp3
      net-bez-trevog-vocal.mp3
      net-bez-trevog-instrumental.mp3
```

## Правила

- пути должны быть относительными к `public/`
- пустая строка означает, что дорожка пока не подключена
- `fullmix` — полный микс
- `vocal` — вокальная дорожка/референс
- `instrumental` — минус

## Следующий технический шаг

Добавить в `AudioEngine` отдельный режим playback для HTMLAudioElement/Web Audio buffer:

- загрузка дорожек из `song.tracks`
- отдельные gain-ноды для vocal/instrumental
- master volume
- play / pause / stop
- синхронный старт дорожек
- сохранение текущего синтезированного playback нот как fallback
