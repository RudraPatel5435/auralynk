package utils

import (
	"errors"
	"regexp"
	"slices"
	"strings"
	"unicode"
)

func ValidatePassword(password string) error {
	if len(password) < 8 {
		return errors.New("Password must be atleast 8 characters long")
	}

	var (
		hasUpper   bool
		hasLower   bool
		hasNumber  bool
		hasSpecial bool
	)

	for _, char := range password {
		switch {
		case unicode.IsUpper(char):
			hasUpper = true
		case unicode.IsLower(char):
			hasLower = true
		case unicode.IsNumber(char):
			hasNumber = true
		case unicode.IsPunct(char) || unicode.IsSymbol(char):
			hasSpecial = true
		}
	}

	if !hasUpper {
		return errors.New("Password must contain at least one uppercase letter")
	}
	if !hasLower {
		return errors.New("Password must contain at least one lowercase letter")
	}
	if !hasNumber {
		return errors.New("Password must contain at least one number")
	}
	if !hasSpecial {
		return errors.New("Password must contain at least one special character")
	}

	return nil
}

func ValidateUsername(username string) error {
	if len(username) < 3 {
		return errors.New("Username must be at least 3 characters long")
	}
	if len(username) > 50 {
		return errors.New("Username must be less than 50 characters")
	}

	// Only allow alphanumeric and underscores
	matched, _ := regexp.MatchString("^[a-zA-Z0-9_]+$", username)
	if !matched {
		return errors.New("Username can only contain letters, numbers, and underscores")
	}

	// Check for reserved usernames
	reserved := []string{"admin", "root", "system", "anonymous"}
	if slices.Contains(reserved, strings.ToLower(username)) {
		return errors.New("This username is reserved")
	}

	return nil
}

func ValidateChannelName(name string) error {
	name = strings.TrimSpace(name)

	if len(name) < 3 {
		return errors.New("Channel name must be at least 3 characters long")
	}
	if len(name) > 100 {
		return errors.New("Channel name must be less than 100 characters")
	}

	return nil
}

func SanitizeEmail(email string) string {
	return strings.ToLower(strings.TrimSpace(email))
}
