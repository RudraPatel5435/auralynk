package handlers

import (
	"strconv"
	"time"

	"github.com/RudraPatel5435/vyenet/server/database"
	"github.com/RudraPatel5435/vyenet/server/middleware"
	"github.com/RudraPatel5435/vyenet/server/models"
	"github.com/RudraPatel5435/vyenet/server/utils"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func CreateMessage(c *gin.Context) {
	channelID := c.Param("id")

	if !utils.IsValidUUID(channelID) {
		utils.ErrorResponse(c, 400, "Invalid channel ID")
		return
	}

	var input struct {
		Content string `json:"content" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ErrorResponse(c, 400, "Content is required")
		return
	}

	user := middleware.GetCurrentUser(c)
	if user == nil {
		utils.ErrorResponse(c, 401, "User not authenticated")
		return
	}

	var channel models.Channel
	if err := database.DB.Preload("Members").First(&channel, "id = ?", channelID).Error; err != nil {
		utils.ErrorResponse(c, 404, "Channel not found")
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
		utils.ErrorResponse(c, 403, "You must be a member to send messages in this channel")
		return
	}

	if len(input.Content) > 2000 {
		utils.ErrorResponse(c, 400, "Message content must be less than 2000 characters")
		return
	}

	message := models.Message{
		ID:        uuid.New(),
		Content:   input.Content,
		UserID:    user.ID,
		ChannelID: uuid.MustParse(channelID),
	}

	if err := database.DB.Create(&message).Error; err != nil {
		utils.ErrorResponse(c, 500, "Failed to create message")
		return
	}

	database.DB.Preload("User").First(&message, "id = ?", message.ID)

	utils.SuccessResponse(c, 201, "Message created successfully", gin.H{
		"id":         message.ID,
		"content":    message.Content,
		"created_at": message.CreatedAt,
		"user": gin.H{
			"id":       message.User.ID,
			"username": message.User.Username,
		},
	})
}

func ListMessages(c *gin.Context) {
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

	var channel models.Channel
	if err := database.DB.Preload("Members").First(&channel, "id = ?", channelID).Error; err != nil {
		utils.ErrorResponse(c, 404, "Channel not found")
		return
	}

	if channel.AccessType == "private" {
		isMember := false
		for _, member := range channel.Members {
			if member.ID == user.ID {
				isMember = true
				break
			}
		}
		if !isMember && channel.AdminID != user.ID {
			utils.ErrorResponse(c, 403, "You don't have access to this private channel")
			return
		}
	}

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	if limit < 1 || limit > 100 {
		limit = 50
	}

	beforeCursor := c.Query("before")
	afterCursor := c.Query("after")

	query := database.DB.
		Preload("User").
		Where("channel_id = ?", channelID)

	if beforeCursor != "" {
		var cursorMsg models.Message
		if err := database.DB.First(&cursorMsg, "id = ?", beforeCursor).Error; err == nil {
			query = query.Where("created_at < ?", cursorMsg.CreatedAt)
		}
		query = query.Order("created_at DESC")
	} else if afterCursor != "" {
		var cursorMsg models.Message
		if err := database.DB.First(&cursorMsg, "id = ?", afterCursor).Error; err == nil {
			query = query.Where("created_at > ?", cursorMsg.CreatedAt)
		}
		query = query.Order("created_at ASC")
	} else {
		query = query.Order("created_at DESC")
	}

	var messages []models.Message
	err := query.Limit(limit + 1).Find(&messages).Error

	if err != nil {
		utils.ErrorResponse(c, 500, "Failed to fetch messages")
		return
	}

	hasMore := len(messages) > limit
	if hasMore {
		messages = messages[:limit]
	}

	if afterCursor != "" {
		for i, j := 0, len(messages)-1; i < j; i, j = i+1, j-1 {
			messages[i], messages[j] = messages[j], messages[i]
		}
	}

	var response []gin.H
	for _, msg := range messages {
		response = append(response, gin.H{
			"id":         msg.ID,
			"content":    msg.Content,
			"is_pinned":  msg.IsPinned,
			"created_at": msg.CreatedAt,
			"user": gin.H{
				"id":       msg.User.ID,
				"username": msg.User.Username,
			},
		})
	}

	var firstCursor, lastCursor *string
	if len(messages) > 0 {
		first := messages[0].ID.String()
		last := messages[len(messages)-1].ID.String()
		firstCursor = &first
		lastCursor = &last
	}

	c.JSON(200, gin.H{
		"success": true,
		"message": "Messages fetched successfully",
		"data": gin.H{
			"messages":     response,
			"has_more":     hasMore,
			"first_cursor": firstCursor,
			"last_cursor":  lastCursor,
		},
		"timestamp": time.Now(),
	})
}
