package handlers

import (
	"myway-backend/internal/database"
	"myway-backend/internal/models"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type DiscussionHandler struct{}

func NewDiscussionHandler() *DiscussionHandler {
	return &DiscussionHandler{}
}

type CreateThreadRequest struct {
	CourseID string `json:"courseId" binding:"required"`
	Title    string `json:"title" binding:"required"`
	Body     string `json:"body" binding:"required"`
}

func (h *DiscussionHandler) CreateThread(c *gin.Context) {
	userID := c.MustGet("userID").(uuid.UUID)
	var req CreateThreadRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	courseID, err := uuid.Parse(req.CourseID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid course ID"})
		return
	}

	thread := models.Thread{
		CourseID:  courseID,
		CreatedBy: userID,
		Title:     req.Title,
		Body:      req.Body,
	}

	if err := database.GetDB().Create(&thread).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create thread"})
		return
	}

	// Load creator info
	database.GetDB().Preload("Creator").First(&thread, thread.ID)

	c.JSON(http.StatusCreated, thread)
}

func (h *DiscussionHandler) GetThreadsByCourse(c *gin.Context) {
	courseID, err := uuid.Parse(c.Param("courseId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid course ID"})
		return
	}

	var threads []models.Thread
	if err := database.GetDB().
		Preload("Creator").
		Preload("Replies.Creator").
		Where("course_id = ?", courseID).
		Order("created_at DESC").
		Find(&threads).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch threads"})
		return
	}

	c.JSON(http.StatusOK, threads)
}

func (h *DiscussionHandler) GetThread(c *gin.Context) {
	threadID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid thread ID"})
		return
	}

	var thread models.Thread
	if err := database.GetDB().
		Preload("Creator").
		Preload("Replies.Creator").
		Preload("Course").
		First(&thread, threadID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Thread not found"})
		return
	}

	c.JSON(http.StatusOK, thread)
}

type CreateReplyRequest struct {
	Body string `json:"body" binding:"required"`
}

type CreateReplyByBodyRequest struct {
	ThreadID string `json:"threadId" binding:"required"`
	Body     string `json:"body" binding:"required"`
}

func (h *DiscussionHandler) CreateReply(c *gin.Context) {
	userID := c.MustGet("userID").(uuid.UUID)
	threadID, err := uuid.Parse(c.Param("threadId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid thread ID"})
		return
	}

	var req CreateReplyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	h.createReply(c, userID, threadID, req.Body)
}

func (h *DiscussionHandler) CreateReplyByBody(c *gin.Context) {
	userID := c.MustGet("userID").(uuid.UUID)

	var req CreateReplyByBodyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	threadID, err := uuid.Parse(req.ThreadID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid thread ID"})
		return
	}

	h.createReply(c, userID, threadID, req.Body)
}

func (h *DiscussionHandler) createReply(c *gin.Context, userID uuid.UUID, threadID uuid.UUID, body string) {
	// Verify thread exists
	var thread models.Thread
	if err := database.GetDB().First(&thread, threadID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Thread not found"})
		return
	}

	reply := models.Reply{
		ThreadID:  threadID,
		CreatedBy: userID,
		Body:      body,
	}

	if err := database.GetDB().Create(&reply).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create reply"})
		return
	}

	// Load creator info
	database.GetDB().Preload("Creator").First(&reply, reply.ID)

	c.JSON(http.StatusCreated, reply)
}
