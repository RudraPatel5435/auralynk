package middleware

import (
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/RudraPatel5435/auralynk/server/database"
	"github.com/RudraPatel5435/auralynk/server/models"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

var jwtSecret = []byte(os.Getenv("JWT_SECRET"))

type Claims struct {
	UserID uuid.UUID `json:"user_id"`
	jwt.RegisteredClaims
}

func GenerateJWT(userID uuid.UUID) (string, error) {
	claims := Claims{
		UserID: userID,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtSecret)
}

func ValidateJWT(tokenString string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (any, error) {
		return jwtSecret, nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*Claims); ok && token.Valid {
		return claims, nil
	}

	return nil, err
}

func Auth() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(401, gin.H{"error": "Unauthorized"})
			c.Abort()
			return
		}

		parts := strings.Split(authHeader, "")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Invalid authorization header format",
			})
			c.Abort()
			return
		}

		tokenString := parts[1]

		claims, err := ValidateJWT(tokenString)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Invalid or expired token",
			})
			c.Abort()
			return
		}

		var user models.User
		if err := database.DB.First(&user, "id = ?", claims.UserID).Error; err != nil {
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
