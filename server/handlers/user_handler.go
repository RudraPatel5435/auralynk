package handlers

import (
	"github.com/RudraPatel5435/auralynk/server/database"
	"github.com/RudraPatel5435/auralynk/server/middleware"
	"github.com/RudraPatel5435/auralynk/server/models"
	"github.com/RudraPatel5435/auralynk/server/utils"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func RegisterUser(c *gin.Context) {
	var input struct {
		Username string `json:"username" binding:"required"`
		Email    string `json:"email" binding:"required,email"`
		Password string `json:"password" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ValidationErrorResponse(c, err.Error())
		return
	}

	if err := utils.ValidateUsername(input.Username); err != nil {
		utils.ErrorResponse(c, 400, err.Error())
		return
	}

	if err := utils.ValidatePassword(input.Password); err != nil {
		utils.ErrorResponse(c, 400, err.Error())
		return
	}

	input.Email = utils.SanitizeEmail(input.Email)

	var existingUser models.User
	if err := database.DB.Where("username = ? OR email = ?", input.Username, input.Email).First(&existingUser).Error; err == nil {
		utils.ErrorResponse(c, 409, "Username or email already exists")
		return
	}

	hashedPassword, err := utils.HashPassword(input.Password)
	if err != nil {
		utils.ErrorResponse(c, 500, "Failed to process password")
		return
	}

	user := models.User{
		ID:       uuid.New(),
		Username: input.Username,
		Email:    input.Email,
		Password: hashedPassword,
	}

	if err := database.DB.Create(&user).Error; err != nil {
		utils.ErrorResponse(c, 500, "Failed to register user")
		return
	}

	if err := middleware.SetUserSession(c, user.ID); err != nil {
		utils.ErrorResponse(c, 500, "Failed to create session")
		return
	}

	utils.SuccessResponse(c, 201, "User registered successfully", gin.H{
		"user": gin.H{
			"id":       user.ID,
			"username": user.Username,
			"email":    user.Email,
		},
	})
}

func LoginUser(c *gin.Context) {
	var input struct {
		Email    string `json:"email" binding:"required,email"`
		Password string `json:"password" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ValidationErrorResponse(c, err.Error())
		return
	}

	input.Email = utils.SanitizeEmail(input.Email)

	var user models.User
	if err := database.DB.Where("email = ?", input.Email).First(&user).Error; err != nil {
		utils.ErrorResponse(c, 401, "Invalid credentials")
		return
	}

	if !utils.CheckPasswordHash(input.Password, user.Password) {
		utils.ErrorResponse(c, 401, "Invalid credentials")
		return
	}

	if err := middleware.SetUserSession(c, user.ID); err != nil {
		utils.ErrorResponse(c, 500, "Failed to create session")
		return
	}

	utils.SuccessResponse(c, 200, "Login successful", gin.H{
		"user": gin.H{
			"id":       user.ID,
			"username": user.Username,
			"email":    user.Email,
		},
	})
}

func LogoutUser(c *gin.Context) {
	if err := middleware.ClearUserSession(c); err != nil {
		utils.ErrorResponse(c, 500, "Failed to logout")
		return
	}

	utils.SuccessResponse(c, 200, "Logout successful", nil)
}

func GetMe(c *gin.Context) {
	user := middleware.GetCurrentUser(c)
	if user == nil {
		utils.ErrorResponse(c, 401, "User not authenticated")
		return
	}

	utils.SuccessResponse(c, 200, "User profile fetched", gin.H{
		"id":          user.ID,
		"username":    user.Username,
		"email":       user.Email,
		"last_online": user.LastOnline,
		"created_at":  user.CreatedAt,
	})
}
