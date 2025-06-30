package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"

	"github.com/go-telegram/bot"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

type Client struct {
	conn *websocket.Conn
	nick string
}

type Hub struct {
	clients    map[*Client]bool
	register   chan *Client
	unregister chan *Client
	sync.Mutex
}

var telegramBot *bot.Bot

var telegramChatID int64 = 0

func initTelegram() {
	token := "7086553014:AAFOcLmpEW9elip9q0vHgDQEGJTlJ8B4OnM" //Для тестировки и последующего удаления(по желанию)
	if token == "" {
		log.Println("[Telegram] TELEGRAM_BOT_TOKEN not set, Telegram integration disabled")
		return
	}
	b, err := bot.New(token)
	if err != nil {
		log.Println("[Telegram] Failed to init bot:", err)
		return
	}
	telegramBot = b
	log.Println("[Telegram] Bot initialized")

	if telegramChatID != 0 {
		sendToTelegram("✅ Telegram бот успешно инициализирован и готов принимать сообщения из чата!")
	}
}

func sendToTelegram(text string) {
	if telegramBot == nil || telegramChatID == 0 {
		return
	}
	ctx := context.Background()
	_, err := telegramBot.SendMessage(ctx, &bot.SendMessageParams{
		ChatID: telegramChatID,
		Text:   text,
	})
	if err != nil {
		log.Println("[Telegram] Send error:", err)
	}
}

func newHub() *Hub {
	h := &Hub{
		clients:    make(map[*Client]bool),
		register:   make(chan *Client),
		unregister: make(chan *Client),
	}
	go h.run()
	return h
}

func (h *Hub) run() {
	for {
		select {
		case client := <-h.register:
			h.Lock()
			h.clients[client] = true
			h.sendOnline()
			h.Unlock()
		case client := <-h.unregister:
			h.Lock()
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				client.conn.Close()
			}
			h.sendOnline()
			h.Unlock()
		}
	}
}

func (h *Hub) sendOnline() {
	nicks := make([]string, 0, len(h.clients))
	for c := range h.clients {
		nicks = append(nicks, c.nick)
	}
	msg, _ := json.Marshal(map[string]interface{}{
		"type":  "online",
		"users": nicks,
	})
	for c := range h.clients {
		c.conn.WriteMessage(websocket.TextMessage, msg)
	}
}

func (h *Hub) broadcast(msg interface{}) {
	var data []byte
	switch v := msg.(type) {
	case string:
		data = []byte(v)
	default:
		data, _ = json.Marshal(v)
	}
	h.Lock()
	for c := range h.clients {
		c.conn.WriteMessage(websocket.TextMessage, data)
	}
	h.Unlock()
}

func serveWs(hub *Hub, w http.ResponseWriter, r *http.Request) {
	var nick string
	if r.Method == "GET" {
		nick = r.URL.Query().Get("nick")
	}
	if nick == "" {

		var tmp struct{ Nick string }
		json.NewDecoder(r.Body).Decode(&tmp)
		nick = tmp.Nick
	}
	if nick == "" {
		nick = "Гость"
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("Upgrade error:", err)
		return
	}
	client := &Client{conn: conn, nick: nick}
	hub.register <- client

	defer func() {
		hub.unregister <- client
	}()

	for {
		_, msg, err := conn.ReadMessage()
		if err != nil {
			break
		}
		var data struct {
			Text string `json:"text"`
			Nick string `json:"nick"`
		}
		if err := json.Unmarshal(msg, &data); err != nil {
			continue
		}
		client.nick = data.Nick
		hub.sendOnline()
		hub.broadcast(map[string]interface{}{
			"text": data.Text,
			"nick": data.Nick,
		})

		if data.Text != "" {
			sendToTelegram(fmt.Sprintf("[%s]: %s", data.Nick, data.Text))
		}
	}
}

func main() {
	initTelegram()
	hub := newHub()
	http.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		serveWs(hub, w, r)
	})

	http.Handle("/", http.FileServer(http.Dir("static")))

	fmt.Println("Server started at http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
