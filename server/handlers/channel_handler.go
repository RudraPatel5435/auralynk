package handlers

import (
	"net/http"

	"github.com/RudraPatel5435/auralynk/server/database"
	"github.com/RudraPatel5435/auralynk/server/models"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func CreateChannel(c *gin.Context) {
	var input struct {
		Name       string `json:"name" binding:"required"`
		AccessType string `json:"access_type" binding:"required,oneof=public private"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	//TODO: Get user from auth

	channel := models.Channel{
		ID:         uuid.New(),
		Name:       input.Name,
		AccessType: input.AccessType,
		// AdminID:    user.ID,
	}
	if err := database.DB.Create(&channel).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create channel"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Channel created successfully",
		"channel": channel,
	})
}
func GetChannels(c *gin.Context)   {}
func GetChannel(c *gin.Context)    {}
func UpdateChannel(c *gin.Context) {}
func DeleteChannel(c *gin.Context) {}
func JoinChannel(c *gin.Context)   {}
func LeaveChannel(c *gin.Context)  {}
