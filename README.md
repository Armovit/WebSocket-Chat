# Go WebSocket Chat

Браузерное чат-приложение на Go (WebSocket).

## Запуск

1. Установите зависимости:

```
go mod tidy
```

2. Запустите сервер:

```
go run main.go
```

3. Откройте в браузере:

```
http://localhost:8080
```

Откройте несколько вкладок — сообщения будут видны всем подключённым пользователям.

---

**Зависимости:**
- Go 1.21+
- github.com/gorilla/websocket 
