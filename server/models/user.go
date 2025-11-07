package models

import (
	"github.com/google/uuid"
	"gorm.io/gorm"
	"time"
)

type User struct {
	ID        uuid.UUID  `gorm:"type:uuid;primaryKey"`
	Username  string     `gorm:"uniqueIndex;not null"`
	Email     string     `gorm:"uniqueIndex;not null"`
	Password  string     `gorm:"not null"`
	Messages  []Message  `gorm:"foreignKey:UserID"`
	Channels  []*Channel `gorm:"many2many:user_channels;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`
	CreatedAt time.Time
	UpdatedAt time.Time
	DeletedAt gorm.DeletedAt `gorm:"index"`
}

func (u *User) BeforeCreate(tx *gorm.DB) (err error) {
	u.ID = uuid.New()
	return
}

func (u *User) AfterCreate(tx *gorm.DB) (err error) {
	return
}
