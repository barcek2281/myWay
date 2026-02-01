package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// User model
type User struct {
	ID           uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()"`
	Email        string    `gorm:"unique;not null"`
	PasswordHash string    `gorm:"not null"`
	Name         string    `gorm:"not null"`
	Role         string    `gorm:"not null;default:'STUDENT'"`
	CreatedAt    time.Time
	LastLogin    *time.Time

	Memberships       []OrgMembership    `gorm:"foreignKey:UserID"`
	Enrollments       []Enrollment       `gorm:"foreignKey:UserID"`
	CreatedCourses    []Course           `gorm:"foreignKey:CreatedBy"`
	QuizAttempts      []QuizAttempt      `gorm:"foreignKey:UserID"`
	FlashcardSessions []FlashcardSession `gorm:"foreignKey:UserID"`
	ProgressEvents    []ProgressEvent    `gorm:"foreignKey:UserID"`
	Submissions       []Submission       `gorm:"foreignKey:UserID"`
	Threads           []Thread           `gorm:"foreignKey:CreatedBy"`
	Replies           []Reply            `gorm:"foreignKey:CreatedBy"`
	RefreshTokens     []RefreshToken     `gorm:"foreignKey:UserID"`
}

// RefreshToken model
type RefreshToken struct {
	ID        uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()"`
	UserID    uuid.UUID `gorm:"type:uuid;not null"`
	Token     string    `gorm:"unique;not null"`
	ExpiresAt time.Time `gorm:"not null"`
	CreatedAt time.Time

	User User `gorm:"foreignKey:UserID;references:ID"`
}

// Organization model
type Organization struct {
	ID        uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()"`
	Name      string    `gorm:"not null"`
	Plan      string    `gorm:"default:'Free'"`
	CreatedAt time.Time

	Memberships  []OrgMembership  `gorm:"foreignKey:OrgID"`
	Courses      []Course         `gorm:"foreignKey:OrgID"`
	DailyMetrics []DailyOrgMetric `gorm:"foreignKey:OrgID"`
}

// OrgMembership model
type OrgMembership struct {
	ID     uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()"`
	OrgID  uuid.UUID `gorm:"type:uuid;not null"`
	UserID uuid.UUID `gorm:"type:uuid;not null"`
	Role   string    `gorm:"not null"` // STUDENT, TEACHER, ORGANIZER
	Status string    `gorm:"default:'Active'"`

	Organization Organization `gorm:"foreignKey:OrgID;references:ID"`
	User         User         `gorm:"foreignKey:UserID;references:ID"`
}

// Course model
type Course struct {
	ID          uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()"`
	OrgID       uuid.UUID `gorm:"type:uuid;not null"`
	Code        string    `gorm:"not null"`
	Title       string    `gorm:"not null"`
	Description string    `gorm:"not null"`
	CreatedBy   uuid.UUID `gorm:"type:uuid;not null"`

	Organization Organization   `gorm:"foreignKey:OrgID;references:ID"`
	Creator      User           `gorm:"foreignKey:CreatedBy;references:ID"`
	Enrollments  []Enrollment   `gorm:"foreignKey:CourseID"`
	Modules      []Module       `gorm:"foreignKey:CourseID"`
	Assignments  []Assignment   `gorm:"foreignKey:CourseID"`
	Threads      []Thread       `gorm:"foreignKey:CourseID"`
	Metrics      []CourseMetric `gorm:"foreignKey:CourseID"`
}

// Enrollment model
type Enrollment struct {
	ID        uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()"`
	CourseID  uuid.UUID `gorm:"type:uuid;not null"`
	UserID    uuid.UUID `gorm:"type:uuid;not null"`
	Role      string    `gorm:"not null"`
	CreatedAt time.Time

	Course Course `gorm:"foreignKey:CourseID;references:ID"`
	User   User   `gorm:"foreignKey:UserID;references:ID"`
}

// Module model
type Module struct {
	ID         uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()"`
	CourseID   uuid.UUID `gorm:"type:uuid;not null"`
	Title      string    `gorm:"not null"`
	Order      int       `gorm:"not null"`
	LockedRule *string

	Course    Course     `gorm:"foreignKey:CourseID;references:ID"`
	Materials []Material `gorm:"foreignKey:ModuleID"`
}

// Material model
type Material struct {
	ID             uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()"`
	ModuleID       uuid.UUID `gorm:"type:uuid;not null"`
	Type           string    `gorm:"not null"` // VIDEO, TEXT, DOC
	Title          string    `gorm:"not null"`
	SourceURL      *string
	FileURL        *string
	TranscriptText *string `gorm:"type:text"`

	Module     Module      `gorm:"foreignKey:ModuleID;references:ID"`
	StudyPacks []StudyPack `gorm:"foreignKey:MaterialID"`
}

// StudyPack model
type StudyPack struct {
	ID               uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()"`
	MaterialID       uuid.UUID `gorm:"type:uuid;not null"`
	CreatedBy        string    `gorm:"not null"`
	Status           string    `gorm:"not null"` // PENDING, GENERATED, FAILED
	CreatedAt        time.Time
	PublishedAt      *time.Time
	RequiresApproval bool `gorm:"default:false"`
	ApprovedBy       *string

	Material   Material           `gorm:"foreignKey:MaterialID;references:ID"`
	Summary    *Summary           `gorm:"foreignKey:StudyPackID"`
	Quizzes    []Quiz             `gorm:"foreignKey:StudyPackID"`
	Flashcards []Flashcard        `gorm:"foreignKey:StudyPackID"`
	Sessions   []FlashcardSession `gorm:"foreignKey:StudyPackID"`
}

// Summary model
type Summary struct {
	ID          uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()"`
	StudyPackID uuid.UUID `gorm:"type:uuid;unique;not null"`
	Content     string    `gorm:"type:jsonb;not null"`

	StudyPack StudyPack `gorm:"foreignKey:StudyPackID;references:ID"`
}

// Quiz model
type Quiz struct {
	ID          uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()"`
	StudyPackID uuid.UUID `gorm:"type:uuid;not null"`
	Version     int       `gorm:"default:1"`
	Metadata    string    `gorm:"type:jsonb"`

	StudyPack StudyPack      `gorm:"foreignKey:StudyPackID;references:ID"`
	Questions []QuizQuestion `gorm:"foreignKey:QuizID"`
	Attempts  []QuizAttempt  `gorm:"foreignKey:QuizID"`
}

// QuizQuestion model
type QuizQuestion struct {
	ID          uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()"`
	QuizID      uuid.UUID `gorm:"type:uuid;not null"`
	Type        string    `gorm:"not null"` // MCQ, SHORT_ANSWER
	Prompt      string    `gorm:"not null"`
	Options     string    `gorm:"type:jsonb;not null"`
	AnswerKey   string    `gorm:"type:jsonb;not null"`
	Explanation *string

	Quiz Quiz `gorm:"foreignKey:QuizID;references:ID"`
}

// Flashcard model
type Flashcard struct {
	ID          uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()"`
	StudyPackID uuid.UUID `gorm:"type:uuid;not null"`
	Front       string    `gorm:"not null"`
	Back        string    `gorm:"not null"`
	Tags        *string   `gorm:"type:jsonb"`

	StudyPack StudyPack `gorm:"foreignKey:StudyPackID;references:ID"`
}

// QuizAttempt model
type QuizAttempt struct {
	ID        uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()"`
	QuizID    uuid.UUID `gorm:"type:uuid;not null"`
	UserID    uuid.UUID `gorm:"type:uuid;not null"`
	Score     int       `gorm:"not null"`
	Answers   string    `gorm:"type:jsonb;not null"`
	CreatedAt time.Time

	Quiz Quiz `gorm:"foreignKey:QuizID;references:ID"`
	User User `gorm:"foreignKey:UserID;references:ID"`
}

// FlashcardSession model
type FlashcardSession struct {
	ID           uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()"`
	StudyPackID  uuid.UUID `gorm:"type:uuid;not null"`
	UserID       uuid.UUID `gorm:"type:uuid;not null"`
	KnownCount   int       `gorm:"not null"`
	UnknownCount int       `gorm:"not null"`
	DurationSec  int       `gorm:"not null"`
	CreatedAt    time.Time

	StudyPack StudyPack `gorm:"foreignKey:StudyPackID;references:ID"`
	User      User      `gorm:"foreignKey:UserID;references:ID"`
}

// ProgressEvent model
type ProgressEvent struct {
	ID        uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()"`
	UserID    uuid.UUID `gorm:"type:uuid;not null"`
	CourseID  string    `gorm:"not null"`
	EventType string    `gorm:"not null"`
	Payload   string    `gorm:"type:jsonb;not null"`
	CreatedAt time.Time

	User User `gorm:"foreignKey:UserID;references:ID"`
}

// Assignment model
type Assignment struct {
	ID           uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()"`
	CourseID     uuid.UUID `gorm:"type:uuid;not null"`
	Title        string    `gorm:"not null"`
	DueAt        time.Time `gorm:"not null"`
	Points       int       `gorm:"not null"`
	Instructions string    `gorm:"not null"`
	Status       string    `gorm:"not null"` // ACTIVE, ARCHIVED

	Course      Course       `gorm:"foreignKey:CourseID;references:ID"`
	Submissions []Submission `gorm:"foreignKey:AssignmentID"`
}

// Submission model
type Submission struct {
	ID           uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()"`
	AssignmentID uuid.UUID `gorm:"type:uuid;not null"`
	UserID       uuid.UUID `gorm:"type:uuid;not null"`
	Status       string    `gorm:"not null"` // SUBMITTED, GRADED, RE_SUBMIT_REQUESTED
	FileURL      *string
	SubmittedAt  time.Time
	Grade        *string
	Feedback     *string

	Assignment Assignment `gorm:"foreignKey:AssignmentID;references:ID"`
	User       User       `gorm:"foreignKey:UserID;references:ID"`
}

// Thread model
type Thread struct {
	ID        uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()"`
	CourseID  uuid.UUID `gorm:"type:uuid;not null"`
	CreatedBy uuid.UUID `gorm:"type:uuid;not null"`
	Title     string    `gorm:"not null"`
	Body      string    `gorm:"not null"`
	CreatedAt time.Time

	Course  Course  `gorm:"foreignKey:CourseID;references:ID"`
	Creator User    `gorm:"foreignKey:CreatedBy;references:ID"`
	Replies []Reply `gorm:"foreignKey:ThreadID"`
}

// Reply model
type Reply struct {
	ID        uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()"`
	ThreadID  uuid.UUID `gorm:"type:uuid;not null"`
	CreatedBy uuid.UUID `gorm:"type:uuid;not null"`
	Body      string    `gorm:"not null"`
	CreatedAt time.Time

	Thread  Thread `gorm:"foreignKey:ThreadID;references:ID"`
	Creator User   `gorm:"foreignKey:CreatedBy;references:ID"`
}

// DailyOrgMetric model
type DailyOrgMetric struct {
	ID             uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()"`
	OrgID          uuid.UUID `gorm:"type:uuid;not null"`
	Date           time.Time `gorm:"not null"`
	DAU            int       `gorm:"not null"`
	WAU            int       `gorm:"not null"`
	ActivationRate float64   `gorm:"not null"`
	Retention7d    float64   `gorm:"not null"`
	RunsCount      int       `gorm:"not null"`
	QuizzesTaken   int       `gorm:"not null"`

	Organization Organization `gorm:"foreignKey:OrgID;references:ID"`
}

// CourseMetric model
type CourseMetric struct {
	ID             uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()"`
	CourseID       uuid.UUID `gorm:"type:uuid;not null"`
	Date           time.Time `gorm:"not null"`
	AvgProgress    float64   `gorm:"not null"`
	AvgScore       float64   `gorm:"not null"`
	EngagementRate float64   `gorm:"not null"`

	Course Course `gorm:"foreignKey:CourseID;references:ID"`
}

// BeforeCreate hooks to ensure UUID generation
func (u *User) BeforeCreate(tx *gorm.DB) error {
	if u.ID == uuid.Nil {
		u.ID = uuid.New()
	}
	return nil
}

func (o *Organization) BeforeCreate(tx *gorm.DB) error {
	if o.ID == uuid.Nil {
		o.ID = uuid.New()
	}
	return nil
}

func (c *Course) BeforeCreate(tx *gorm.DB) error {
	if c.ID == uuid.Nil {
		c.ID = uuid.New()
	}
	return nil
}
