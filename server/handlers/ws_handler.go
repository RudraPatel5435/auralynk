package handlers

import (
	"encoding/json"
	"log"
	"sync"
	"time"

	"github.com/RudraPatel5435/auralynk/server/database"
	"github.com/RudraPatel5435/auralynk/server/middleware"
	"github.com/RudraPatel5435/auralynk/server/models"
	"github.com/RudraPatel5435/auralynk/server/utils"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

type Client struct {
	Conn      *websocket.Conn
	User      *models.User
	ChannelID uuid.UUID
	Send      chan []byte
	IsMember  bool
}

type Hub struct {
	Channels map[uuid.UUID]map[*Client]bool

	Register chan *Client

	Unregister chan *Client

	Broadcast chan *BroadcastMessage

	Mutex sync.RWMutex
}

type BroadcastMessage struct {
	ChannelID uuid.UUID
	Data      []byte
}

var hub = &Hub{
	Channels:   make(map[uuid.UUID]map[*Client]bool),
	Register:   make(chan *Client),
	Unregister: make(chan *Client),
	Broadcast:  make(chan *BroadcastMessage),
}

type WSMessage struct {
	Type      string         `json:"type"` // "message", "typing", "user_joined", "user_left"
	Content   string         `json:"content,omitempty"`
	MessageID string         `json:"message_id,omitempty"`
	User      map[string]any `json:"user"`
	Timestamp time.Time      `json:"timestamp"`
}

func StartHub() {
	go hub.Run()
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.Register:
			h.Mutex.Lock()
			if h.Channels[client.ChannelID] == nil {
				h.Channels[client.ChannelID] = make(map[*Client]bool)
			}
			h.Channels[client.ChannelID][client] = true
			h.Mutex.Unlock()

			joinMsg := WSMessage{
				Type: "user_joined",
				User: map[string]any{
					"id":       client.User.ID,
					"username": client.User.Username,
				},
				Timestamp: time.Now(),
			}
			data, _ := json.Marshal(joinMsg)
			h.BroadcastToChannel(client.ChannelID, data, client)

			log.Printf("User %s joined channel %s", client.User.Username, client.ChannelID)

		case client := <-h.Unregister:
			h.Mutex.Lock()
			if clients, ok := h.Channels[client.ChannelID]; ok {
				if _, ok := clients[client]; ok {
					delete(clients, client)
					close(client.Send)

					// Remove channel if empty
					if len(clients) == 0 {
						delete(h.Channels, client.ChannelID)
					}
				}
			}
			h.Mutex.Unlock()

			// Notify others that user left
			leaveMsg := WSMessage{
				Type: "user_left",
				User: map[string]any{
					"id":       client.User.ID,
					"username": client.User.Username,
				},
				Timestamp: time.Now(),
			}
			data, _ := json.Marshal(leaveMsg)
			h.BroadcastToChannel(client.ChannelID, data, nil)

			log.Printf("User %s left channel %s", client.User.Username, client.ChannelID)

		case message := <-h.Broadcast:
			h.BroadcastToChannel(message.ChannelID, message.Data, nil)
		}
	}
}

func (h *Hub) BroadcastToChannel(channelID uuid.UUID, data []byte, exclude *Client) {
	h.Mutex.RLock()
	clients := h.Channels[channelID]
	h.Mutex.RUnlock()

	for client := range clients {
		if client != exclude {
			select {
			case client.Send <- data:
			default:
				close(client.Send)
				h.Mutex.Lock()
				delete(h.Channels[channelID], client)
				h.Mutex.Unlock()
			}
		}
	}
}

func (c *Client) ReadPump() {
	defer func() {
		hub.Unregister <- c
		c.Conn.Close()
	}()

	c.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	c.Conn.SetPongHandler(func(string) error {
		c.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})

	for {
		_, messageBytes, err := c.Conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket error: %v", err)
			}
			break
		}

		var incoming struct {
			Type    string `json:"type"`
			Content string `json:"content"`
		}

		if err := json.Unmarshal(messageBytes, &incoming); err != nil {
			log.Printf("Failed to parse message: %v", err)
			continue
		}

		if incoming.Type == "typing" {
			if !c.IsMember {
				continue
			}

			typingMsg := WSMessage{
				Type: "typing",
				User: map[string]any{
					"id":       c.User.ID,
					"username": c.User.Username,
				},
				Timestamp: time.Now(),
			}
			data, _ := json.Marshal(typingMsg)
			hub.BroadcastToChannel(c.ChannelID, data, c)
			continue
		}

		if incoming.Type == "message" && incoming.Content != "" {
			if !c.IsMember {
				errorMsg := WSMessage{
					Type:      "error",
					Content:   "You must be a member to send messages in this channel",
					Timestamp: time.Now(),
				}
				data, _ := json.Marshal(errorMsg)
				c.Send <- data
				continue
			}

			if len(incoming.Content) > 2000 {
				errorMsg := WSMessage{
					Type:      "error",
					Content:   "Message must be less than 2000 characters",
					Timestamp: time.Now(),
				}
				data, _ := json.Marshal(errorMsg)
				c.Send <- data
				continue
			}

			message := models.Message{
				ID:        uuid.New(),
				Content:   incoming.Content,
				UserID:    c.User.ID,
				ChannelID: c.ChannelID,
			}

			if err := database.DB.Create(&message).Error; err != nil {
				log.Printf("Failed to save message: %v", err)
				continue
			}

			now := time.Now()
			c.User.LastOnline = now
			database.DB.Model(&c.User).Update("last_online", now)

			wsMsg := WSMessage{
				Type:      "message",
				Content:   message.Content,
				MessageID: message.ID.String(),
				User: map[string]any{
					"id":       c.User.ID,
					"username": c.User.Username,
				},
				Timestamp: message.CreatedAt,
			}

			data, _ := json.Marshal(wsMsg)
			hub.Broadcast <- &BroadcastMessage{
				ChannelID: c.ChannelID,
				Data:      data,
			}
		}
	}
}

func (c *Client) WritePump() {
	ticker := time.NewTicker(54 * time.Second)
	defer func() {
		ticker.Stop()
		c.Conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.Send:
			c.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if !ok {
				c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			if err := c.Conn.WriteMessage(websocket.TextMessage, message); err != nil {
				return
			}

		case <-ticker.C:
			c.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if err := c.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

func ChatWebSocket(c *gin.Context) {
	channelID := c.Param("channelID")

	if !utils.IsValidUUID(channelID) {
		c.JSON(400, gin.H{"error": "Invalid channel ID"})
		return
	}

	user := middleware.GetCurrentUser(c)
	if user == nil {
		c.JSON(401, gin.H{"error": "User not authenticated"})
		return
	}

	var channel models.Channel
	if err := database.DB.Preload("Members").First(&channel, "id = ?", channelID).Error; err != nil {
		c.JSON(404, gin.H{"error": "Channel not found"})
		return
	}

	isMember := false
	for _, member := range channel.Members {
		if member.ID == user.ID {
			isMember = true
			break
		}
	}

	if channel.AccessType == "private" && !isMember {
		c.JSON(403, gin.H{"error": "You must be a member of this private channel"})
		return
	}

	conn, err := utils.Upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("Failed to upgrade to WebSocket: %v", err)
		return
	}

	client := &Client{
		Conn:      conn,
		User:      user,
		ChannelID: uuid.MustParse(channelID),
		Send:      make(chan []byte, 256),
		IsMember:  isMember,
	}

	hub.Register <- client

	go client.WritePump()
	go client.ReadPump()
}
