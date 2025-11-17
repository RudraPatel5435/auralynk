package handlers

import (
	"encoding/json"
	"log"
	"sync"
	"time"

	"github.com/RudraPatel5435/vyenet/server/database"
	"github.com/RudraPatel5435/vyenet/server/middleware"
	"github.com/RudraPatel5435/vyenet/server/models"
	"github.com/RudraPatel5435/vyenet/server/utils"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

type RTCClient struct {
	Conn      *websocket.Conn
	User      *models.User
	ChannelID uuid.UUID
	Send      chan []byte
	mu        sync.Mutex
}

type RTCHub struct {
	Channels   map[uuid.UUID]map[*RTCClient]bool
	Register   chan *RTCClient
	Unregister chan *RTCClient
	Signal     chan *SignalMessage
	Mutex      sync.RWMutex
}

type SignalMessage struct {
	Type      string         `json:"type"` // "offer", "answer", "ice-candidate", "join", "leave", "media-state"
	ChannelID uuid.UUID      `json:"channel_id"`
	From      uuid.UUID      `json:"from"`
	To        *uuid.UUID     `json:"to,omitempty"` // nil for broadcast
	Payload   map[string]any `json:"payload,omitempty"`
}

var rtcHub = &RTCHub{
	Channels:   make(map[uuid.UUID]map[*RTCClient]bool),
	Register:   make(chan *RTCClient),
	Unregister: make(chan *RTCClient),
	Signal:     make(chan *SignalMessage),
}

func StartRTCHub() {
	go rtcHub.Run()
}

func (h *RTCHub) Run() {
	for {
		select {
		case client := <-h.Register:
			h.Mutex.Lock()
			if h.Channels[client.ChannelID] == nil {
				h.Channels[client.ChannelID] = make(map[*RTCClient]bool)
			}
			h.Channels[client.ChannelID][client] = true
			h.Mutex.Unlock()

			log.Printf("RTC: User %s (%s) joined channel %s", client.User.Username, client.User.ID, client.ChannelID)

			// Send list of existing peers to the new client
			h.Mutex.RLock()
			peers := make([]map[string]any, 0) // Initialize as empty array instead of nil
			for c := range h.Channels[client.ChannelID] {
				if c != client {
					peers = append(peers, map[string]any{
						"user_id":  c.User.ID,
						"username": c.User.Username,
					})
				}
			}
			h.Mutex.RUnlock()

			log.Printf("RTC: Sending %d existing peers to %s", len(peers), client.User.Username)

			peersMsg := SignalMessage{
				Type:      "existing-peers",
				ChannelID: client.ChannelID,
				Payload: map[string]any{
					"peers": peers, // This is now always an array, never nil
				},
			}
			peerData, _ := json.Marshal(peersMsg)
			select {
			case client.Send <- peerData:
				log.Printf("RTC: Successfully sent existing peers list to %s", client.User.Username)
			default:
				log.Printf("Failed to send existing peers to %s", client.User.Username)
			}

			// Notify others that a new peer joined
			joinMsg := SignalMessage{
				Type:      "peer-joined",
				ChannelID: client.ChannelID,
				From:      client.User.ID,
				Payload: map[string]any{
					"user_id":  client.User.ID,
					"username": client.User.Username,
				},
			}
			data, _ := json.Marshal(joinMsg)
			h.BroadcastToChannel(client.ChannelID, data, client)

		case client := <-h.Unregister:
			h.Mutex.Lock()
			if clients, ok := h.Channels[client.ChannelID]; ok {
				if _, ok := clients[client]; ok {
					delete(clients, client)
					close(client.Send)

					if len(clients) == 0 {
						delete(h.Channels, client.ChannelID)
					}
				}
			}
			h.Mutex.Unlock()

			// Notify others that peer left
			leaveMsg := SignalMessage{
				Type:      "peer-left",
				ChannelID: client.ChannelID,
				From:      client.User.ID,
				Payload: map[string]any{
					"user_id": client.User.ID,
				},
			}
			data, _ := json.Marshal(leaveMsg)
			h.BroadcastToChannel(client.ChannelID, data, nil)

			log.Printf("RTC: User %s (%s) left channel %s", client.User.Username, client.User.ID, client.ChannelID)

		case signal := <-h.Signal:
			data, _ := json.Marshal(signal)

			if signal.To != nil {
				// Send to specific peer
				h.SendToPeer(signal.ChannelID, *signal.To, data)
			} else {
				// Broadcast to all except sender
				h.Mutex.RLock()
				clients := h.Channels[signal.ChannelID]
				h.Mutex.RUnlock()

				for client := range clients {
					if client.User.ID != signal.From {
						select {
						case client.Send <- data:
						default:
							log.Printf("Failed to send signal to %s", client.User.Username)
						}
					}
				}
			}
		}
	}
}

func (h *RTCHub) BroadcastToChannel(channelID uuid.UUID, data []byte, exclude *RTCClient) {
	h.Mutex.RLock()
	clients := h.Channels[channelID]
	h.Mutex.RUnlock()

	for client := range clients {
		if client != exclude {
			select {
			case client.Send <- data:
			default:
				log.Printf("Failed to broadcast to %s", client.User.Username)
			}
		}
	}
}

func (h *RTCHub) SendToPeer(channelID, peerID uuid.UUID, data []byte) {
	h.Mutex.RLock()
	clients := h.Channels[channelID]
	h.Mutex.RUnlock()

	for client := range clients {
		if client.User.ID == peerID {
			select {
			case client.Send <- data:
			default:
				log.Printf("Failed to send to peer %s", peerID)
			}
			break
		}
	}
}

func (c *RTCClient) ReadPump() {
	defer func() {
		rtcHub.Unregister <- c
		c.Conn.Close()
	}()

	// Set read deadline with pong handler
	c.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	c.Conn.SetPongHandler(func(string) error {
		c.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})

	for {
		_, messageBytes, err := c.Conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure, websocket.CloseNormalClosure) {
				log.Printf("WebSocket RTC error for %s: %v", c.User.Username, err)
			}
			break
		}

		var signal SignalMessage
		if err := json.Unmarshal(messageBytes, &signal); err != nil {
			log.Printf("Failed to parse RTC signal from %s: %v", c.User.Username, err)
			continue
		}

		signal.From = c.User.ID
		signal.ChannelID = c.ChannelID

		log.Printf("RTC Signal from %s: type=%s, to=%v", c.User.Username, signal.Type, signal.To)

		// Handle media state changes
		if signal.Type == "media-state" {
			mediaType, _ := signal.Payload["media_type"].(string)
			isActive, _ := signal.Payload["is_active"].(bool)

			// Update or create media session in DB
			var session models.MediaSession
			err := database.DB.Where(
				"channel_id = ? AND user_id = ? AND media_type = ?",
				c.ChannelID, c.User.ID, mediaType,
			).First(&session).Error

			if err != nil {
				// Create new session
				session = models.MediaSession{
					ID:        uuid.New(),
					ChannelID: c.ChannelID,
					UserID:    c.User.ID,
					MediaType: mediaType,
					IsActive:  isActive,
				}
				database.DB.Create(&session)
			} else {
				// Update existing
				database.DB.Model(&session).Update("is_active", isActive)
			}

			// Don't forward media-state messages to other peers
			continue
		}

		// Forward signal to appropriate peer(s)
		rtcHub.Signal <- &signal
	}
}

func (c *RTCClient) WritePump() {
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
				log.Printf("Write error for %s: %v", c.User.Username, err)
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

func RTCSignalingWebSocket(c *gin.Context) {
	channelID := c.Param("channelId")

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

	if !isMember {
		c.JSON(403, gin.H{"error": "You must be a member to join voice/video"})
		return
	}

	conn, err := utils.Upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("Failed to upgrade to WebSocket for %s: %v", user.Username, err)
		return
	}

	client := &RTCClient{
		Conn:      conn,
		User:      user,
		ChannelID: uuid.MustParse(channelID),
		Send:      make(chan []byte, 256),
	}

	rtcHub.Register <- client

	go client.WritePump()
	go client.ReadPump()
}

func GetActiveMediaSessions(c *gin.Context) {
	channelID := c.Param("id")

	if !utils.IsValidUUID(channelID) {
		utils.ErrorResponse(c, 400, "Invalid channel ID")
		return
	}

	user := middleware.GetCurrentUser(c)
	if user == nil {
		utils.ErrorResponse(c, 401, "User not authenticated")
		return
	}

	var sessions []models.MediaSession
	err := database.DB.
		Preload("User").
		Where("channel_id = ? AND is_active = ?", channelID, true).
		Find(&sessions).Error

	if err != nil {
		utils.ErrorResponse(c, 500, "Failed to fetch media sessions")
		return
	}

	var response []gin.H
	for _, session := range sessions {
		response = append(response, gin.H{
			"id":         session.ID,
			"media_type": session.MediaType,
			"user": gin.H{
				"id":       session.User.ID,
				"username": session.User.Username,
			},
		})
	}

	utils.SuccessResponse(c, 200, "Active media sessions", response)
}
