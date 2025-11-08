package models

import (
	"github.com/google/uuid"
	"gorm.io/gorm"
	"time"
)

type User struct {
	ID            uuid.UUID      `gorm:"type:uuid;primaryKey"`
	Username      string         `gorm:"uniqueIndex;not null"`
	Email         string         `gorm:"uniqueIndex;not null"`
	Password      string         `gorm:"not null"`
	OwnedChannels []*Channel     `gorm:"many2many:user_owned_channels;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`
	LastOnline    time.Time      `gorm:"default:CURRENT_TIMESTAMP"`
	CreatedAt     time.Time      `gorm:"autoCreateTime"`
	UpdatedAt     time.Time      `gorm:"autoUpdateTime"`
	DeletedAt     gorm.DeletedAt `gorm:"index"`
}

// func (u *User) BeforeCreate(tx *gorm.DB) (err error) {
// 	u.ID = uuid.New()
// 	return
// }
//
// func (u *User) AfterCreate(tx *gorm.DB) (err error) {
// 	return
// }
