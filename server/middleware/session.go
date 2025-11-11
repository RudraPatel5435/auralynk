package middleware

import (
	"net/http"
	"os"

	"github.com/gin-contrib/sessions"
	"github.com/gin-contrib/sessions/postgres"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/RudraPatel5435/auralynk/server/database"
	"github.com/RudraPatel5435/auralynk/server/models"
)

func InitSessionStore(db *gorm.DB) (sessions.Store, error) {
	sqlDB, err := db.DB()
	if err != nil {
		return nil, err
	}

	store, err := postgres.NewStore(sqlDB, []byte(os.Getenv("SESSION_SECRET")))
	if err != nil {
		return nil, err
	}

	store.Options(sessions.Options{
		Path:     "/",
		MaxAge:   86400 * 7, // 7 days
		HttpOnly: true,
		Secure:   os.Getenv("GIN_MODE") == "release", // true in production
		SameSite: http.SameSiteLaxMode,
	})

	return store, nil
}

func SessionAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		session := sessions.Default(c)
		userID := session.Get("user_id")

		if userID == nil {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Unauthorized - Please log in",
			})
			c.Abort()
			return
		}

		uid, err := uuid.Parse(userID.(string))
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Invalid session",
			})
			c.Abort()
			return
		}

		var user models.User
		if err := database.DB.First(&user, "id = ?", uid).Error; err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "User not found",
			})
			c.Abort()
			return
		}

		c.Set("user", &user)
		c.Set("userID", user.ID)

		c.Next()
	}
}

func SetUserSession(c *gin.Context, userID uuid.UUID) error {
	session := sessions.Default(c)
	session.Set("user_id", userID.String())
	return session.Save()
}

func ClearUserSession(c *gin.Context) error {
	session := sessions.Default(c)
	session.Clear()
	return session.Save()
}

func GetCurrentUser(c *gin.Context) *models.User {
	user, exists := c.Get("user")
	if !exists {
		return nil
	}
	return user.(*models.User)
}

func GetCurrentUserID(c *gin.Context) uuid.UUID {
	userID, exists := c.Get("userID")
	if !exists {
		return uuid.Nil
	}
	return userID.(uuid.UUID)
}
