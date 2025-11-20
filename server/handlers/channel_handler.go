package handlers

import (
	"github.com/RudraPatel5435/vyenet/server/database"
	"github.com/RudraPatel5435/vyenet/server/middleware"
	"github.com/RudraPatel5435/vyenet/server/models"
	"github.com/RudraPatel5435/vyenet/server/utils"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func CreateChannel(c *gin.Context) {
	var input struct {
		Name       string `json:"name" binding:"required"`
		AccessType string `json:"access_type" binding:"required,oneof=public private"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ErrorResponse(c, 400, "Invalid input")
		return
	}

	if err := utils.ValidateChannelName(input.Name); err != nil {
		utils.ErrorResponse(c, 400, err.Error())
		return
	}

	user := middleware.GetCurrentUser(c)
	if user == nil {
		utils.ErrorResponse(c, 401, "User not authenticated")
		return
	}

	channel := models.Channel{
		ID:         uuid.New(),
		Name:       input.Name,
		AccessType: input.AccessType,
		AdminID:    user.ID,
	}

	if err := database.DB.Create(&channel).Error; err != nil {
		utils.ErrorResponse(c, 500, "Failed to create channel")
		return
	}

	if err := database.DB.Model(&channel).Association("Members").Append(user); err != nil {
		utils.ErrorResponse(c, 500, "Failed to add user to channel")
		return
	}

	if err := database.DB.Model(&user).Association("OwnedChannels").Append(channel); err != nil {
		utils.ErrorResponse(c, 500, "Failed to associate user to channel")
	}

	utils.SuccessResponse(c, 201, "Channel created successfully", gin.H{
		"id":          channel.ID,
		"name":        channel.Name,
		"access_type": channel.AccessType,
		"admin_id":    channel.AdminID,
		"created_at":  channel.CreatedAt,
	})
}

func GetChannels(c *gin.Context) {
	user := middleware.GetCurrentUser(c)
	if user == nil {
		utils.ErrorResponse(c, 401, "User not authenticated")
		return
	}

	var channelIDs []uuid.UUID

	database.DB.Table("channels").
		Select("DISTINCT channels.id").
		Joins("LEFT JOIN channel_members ON channel_members.channel_id = channels.id").
		Where("channels.access_type = ? OR channel_members.user_id = ?", "public", user.ID).
		Pluck("id", &channelIDs)

	var channels []models.Channel

	err := database.DB.
		Preload("Admin").
		Preload("Members").
		Where("id IN ?", channelIDs).
		Find(&channels).Error

	if err != nil {
		utils.ErrorResponse(c, 500, "Failed to fetch channels")
		return
	}

	var response []gin.H
	for _, channel := range channels {
		isMember := false

		var members []gin.H
		for _, member := range channel.Members {
			if member.ID == user.ID {
				isMember = true
			}
			members = append(members, gin.H{
				"id":       member.ID,
				"username": member.Username,
			})
		}

		response = append(response, gin.H{
			"id":          channel.ID,
			"name":        channel.Name,
			"access_type": channel.AccessType,
			"admin": gin.H{
				"id":       channel.AdminID,
				"username": channel.Admin.Username,
			},
			"is_member":    isMember,
			"is_admin":     channel.AdminID == user.ID,
			"member_count": len(channel.Members),
			"members":      members,
			"created_at":   channel.CreatedAt,
		})
	}

	utils.SuccessResponse(c, 200, "Channels fetched successfully", response)

}

func GetChannel(c *gin.Context) {
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
	err := database.DB.
		Preload("Admin").
		Preload("Members").
		First(&channel, "id = ?", channelID).Error

	if err != nil {
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
			utils.ErrorResponse(c, 403, "You don't have access to this channel")
			return
		}
	}

	var members []gin.H
	for _, member := range channel.Members {
		members = append(members, gin.H{
			"id":       member.ID,
			"username": member.Username,
		})
	}

	utils.SuccessResponse(c, 200, "Channel details fetched", gin.H{
		"id":          channel.ID,
		"name":        channel.Name,
		"access_type": channel.AccessType,
		"admin": gin.H{
			"id":       channel.Admin.ID,
			"username": channel.Admin.Username,
		},
		"members":      members,
		"member_count": len(members),
		"is_admin":     channel.AdminID == user.ID,
		"created_at":   channel.CreatedAt,
	})
}

func UpdateChannel(c *gin.Context) {
	channelID := c.Param("id")

	if !utils.IsValidUUID(channelID) {
		utils.ErrorResponse(c, 400, "Invalid channel ID")
		return
	}

	var input struct {
		Name       *string `json:"name"`
		AccessType *string `json:"access_type" binding:"omitempty,oneof=public private"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ErrorResponse(c, 400, "Invalid input")
		return
	}

	user := middleware.GetCurrentUser(c)
	if user == nil {
		utils.ErrorResponse(c, 401, "User not authenticated")
		return
	}

	var channel models.Channel
	if err := database.DB.First(&channel, "id = ?", channelID).Error; err != nil {
		utils.ErrorResponse(c, 404, "Channel not found")
		return
	}

	if channel.AdminID != user.ID {
		utils.ErrorResponse(c, 403, "Only channel admin can update channel")
		return
	}

	updates := make(map[string]any)

	if input.Name != nil {
		if err := utils.ValidateChannelName(*input.Name); err != nil {
			utils.ErrorResponse(c, 400, err.Error())
			return
		}
		updates["name"] = *input.Name
	}

	if input.AccessType != nil {
		updates["access_type"] = *input.AccessType
	}

	if len(updates) == 0 {
		utils.ErrorResponse(c, 400, "No fields to update")
		return
	}

	if err := database.DB.Model(&channel).Updates(updates).Error; err != nil {
		utils.ErrorResponse(c, 500, "Failed to update channel")
		return
	}

	utils.SuccessResponse(c, 200, "Channel updated successfully", gin.H{
		"id":          channel.ID,
		"name":        channel.Name,
		"access_type": channel.AccessType,
	})
}

func DeleteChannel(c *gin.Context) {
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
	if err := database.DB.First(&channel, "id = ?", channelID).Error; err != nil {
		utils.ErrorResponse(c, 404, "Channel not found")
		return
	}

	if channel.AdminID != user.ID {
		utils.ErrorResponse(c, 403, "Only channel admin can delete channel")
		return
	}

	if err := database.DB.Delete(&channel).Error; err != nil {
		utils.ErrorResponse(c, 500, "Failed to delete channel")
		return
	}

	utils.SuccessResponse(c, 200, "Channel deleted successfully", nil)
}

func JoinChannel(c *gin.Context) {
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

	for _, member := range channel.Members {
		if member.ID == user.ID {
			utils.ErrorResponse(c, 400, "You are already a member of this channel")
			return
		}
	}

	// Only public channels can be joined freely
	if channel.AccessType == "private" {
		utils.ErrorResponse(c, 403, "Cannot join private channel without invitation")
		return
	}

	// Add user to channel
	if err := database.DB.Model(&channel).Association("Members").Append(user); err != nil {
		utils.ErrorResponse(c, 500, "Failed to join channel")
		return
	}

	utils.SuccessResponse(c, 200, "Successfully joined channel", gin.H{
		"channel_id":   channel.ID,
		"channel_name": channel.Name,
	})
}

func LeaveChannel(c *gin.Context) {
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

	if channel.AdminID == user.ID {
		utils.ErrorResponse(c, 403, "Channel admin cannot leave. Delete the channel instead")
		return
	}

	// Check if user is a member
	isMember := false
	for _, member := range channel.Members {
		if member.ID == user.ID {
			isMember = true
			break
		}
	}

	if !isMember {
		utils.ErrorResponse(c, 400, "You are not a member of this channel")
		return
	}

	// Remove user from channel
	if err := database.DB.Model(&channel).Association("Members").Delete(user); err != nil {
		utils.ErrorResponse(c, 500, "Failed to leave channel")
		return
	}

	utils.SuccessResponse(c, 200, "Successfully left channel", gin.H{
		"channel_id": channel.ID,
	})
}

func ChangeAccessType(c *gin.Context) {
	channelID := c.Param("id")
	access_type := c.Param("type")

	if !utils.IsValidUUID(channelID) {
		utils.ErrorResponse(c, 400, "Invalid channel ID")
		return
	}

	if access_type != "public" && access_type != "private" {
		utils.ErrorResponse(c, 400, "Invalid access type")
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

	if channel.AdminID != user.ID {
		utils.ErrorResponse(c, 403, "Channel settings can't be changed by members")
		return
	}

	if err := database.DB.Model(&channel).Update("access_type", access_type).Error; err != nil {
		utils.ErrorResponse(c, 500, "Failed to update channel access type")
		return
	}

	utils.SuccessResponse(c, 200, "Successfully changed channel access type", gin.H{
		"channel_id":  channel.ID,
		"access_type": channel.AccessType,
	})
}
