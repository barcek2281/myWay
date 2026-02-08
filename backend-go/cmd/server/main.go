package main

import (
	"log"
	"myway-backend/internal/config"
	"myway-backend/internal/database"
	"myway-backend/internal/handlers"
	"myway-backend/internal/middleware"

	"github.com/gin-gonic/gin"
)

func main() {
	// Load configuration
	cfg := config.LoadConfig()

	// Set Gin mode
	gin.SetMode(cfg.GinMode)

	// Connect to database
	if err := database.Connect(cfg.DatabaseURL); err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// Run migrations
	if err := database.AutoMigrate(); err != nil {
		log.Fatalf("Failed to migrate database: %v", err)
	}

	// Initialize Gin router
	router := gin.Default()

	// Apply middleware
	router.Use(middleware.CORSMiddleware())

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(cfg.JWTSecret)
	orgHandler := handlers.NewOrganizationHandler()
	courseHandler := handlers.NewCourseHandler()
	moduleHandler := handlers.NewModuleHandler()
	assignmentHandler := handlers.NewAssignmentHandler()
	discussionHandler := handlers.NewDiscussionHandler()
	flashcardHandler := handlers.NewFlashcardHandler()
	progressHandler := handlers.NewProgressHandler()
	analyticsHandler := handlers.NewAnalyticsHandler()
	aiHandler := handlers.NewAIHandler(cfg.GeminiAPIKey)
	importsHandler := handlers.NewImportsHandler()

	// Root route
	router.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "MyWay LMS - Go Backend API",
			"version": "1.0.0",
			"endpoints": gin.H{
				"health":        "GET /health",
				"auth":          "POST /auth/signup, POST /auth/signin, GET /auth/me",
				"organizations": "GET/POST /organizations",
				"courses":       "GET/POST /courses",
				"analytics":     "GET /analytics/student, GET /analytics/teacher",
				"ai":            "GET /ai/studypack/:id, POST /ai/tutor",
				"imports":       "POST /imports/youtube",
			},
		})
	})

	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "healthy"})
	})

	// Public YouTube transcript endpoint
	router.GET("/youtube/transcript", importsHandler.GetYouTubeTranscript)
	router.POST("/ai/transcript", handlers.FetchTranscriptHandler)
	// Keep existing GET for backward compatibility if needed, or replace.
	// User asked for "backend service", usually POST for actions, but user code might expect GET.
	// The previous implementation was GET, but my new handler expects JSON body (POST).
	// I will use POST for robustness and update frontend to POST.

	// Auth routes (no auth required)
	auth := router.Group("/auth")
	{
		auth.POST("/signup", authHandler.SignUp)
		auth.POST("/signin", authHandler.SignIn)
		auth.POST("/refresh", authHandler.RefreshToken)
		auth.GET("/me", middleware.AuthMiddleware(cfg.JWTSecret), authHandler.GetMe)
	}

	// Protected routes
	api := router.Group("")
	api.Use(middleware.AuthMiddleware(cfg.JWTSecret))
	{
		// Auth
		api.POST("/auth/logout", authHandler.Logout)

		// Organizations
		api.POST("/organizations", orgHandler.CreateOrganization)
		api.GET("/organizations", orgHandler.GetOrganizations)
		api.POST("/organizations/:id/join", orgHandler.JoinOrganization)
		api.POST("/organizations/:id/invite", orgHandler.InviteToOrganization)
		api.POST("/organizations/:id/switch", orgHandler.SwitchOrganization)

		// Courses
		api.POST("/courses", courseHandler.CreateCourse)
		api.GET("/courses/:id", courseHandler.GetCourse)
		api.GET("/courses/org/:orgId", courseHandler.GetCoursesByOrg)

		// Modules
		api.POST("/modules", moduleHandler.CreateModule)
		api.GET("/modules/course/:courseId", moduleHandler.GetModulesByCourse)
		api.GET("/modules/:id", moduleHandler.GetModule)
		api.PUT("/modules/:id", moduleHandler.UpdateModule)
		api.DELETE("/modules/:id", moduleHandler.DeleteModule)

		// Assignments
		api.POST("/assignments", assignmentHandler.CreateAssignment)
		api.GET("/assignments/course/:courseId", assignmentHandler.GetAssignmentsByCourse)
		api.GET("/assignments/:id", assignmentHandler.GetAssignment)
		api.POST("/assignments/:id/submit", assignmentHandler.SubmitAssignment)
		api.PUT("/submissions/:id/grade", assignmentHandler.GradeSubmission)

		// Discussions
		api.POST("/discussions/threads", discussionHandler.CreateThread)
		api.GET("/discussions/threads/course/:courseId", discussionHandler.GetThreadsByCourse)
		api.GET("/discussions/threads/:id", discussionHandler.GetThread)
		api.POST("/discussions/threads/:threadId/replies", discussionHandler.CreateReply)
		api.POST("/discussions/replies", discussionHandler.CreateReplyByBody)

		// Flashcards
		api.GET("/flashcards/studypack/:studyPackId", flashcardHandler.GetFlashcardsByStudyPack)
		api.POST("/flashcards/sessions", flashcardHandler.RecordSession)
		api.GET("/flashcards/sessions", flashcardHandler.GetSessionsByUser)

		// Progress
		api.GET("/progress/course/:courseId", progressHandler.GetCourseProgress)
		api.GET("/progress/org", middleware.OrgMembershipMiddleware(), progressHandler.GetProgressByOrg)

		// Analytics
		api.GET("/analytics/student", analyticsHandler.GetStudentDashboard)
		api.GET("/analytics/teacher", analyticsHandler.GetTeacherDashboard)
		api.GET("/analytics/organizer", middleware.OrgMembershipMiddleware(), middleware.RBACMiddleware("ORGANIZER"), analyticsHandler.GetOrganizerDashboard)
		api.POST("/analytics/quiz/attempt", analyticsHandler.RecordQuizAttempt)

		// AI
		api.GET("/ai/studypack/:materialId", aiHandler.GetStudyPack)
		api.GET("/ai/review/:materialId", aiHandler.GetReviewDraft)
		api.POST("/ai/review/:materialId/approve", aiHandler.ApproveStudyPack)
		api.POST("/ai/review/:materialId/regenerate", aiHandler.RegenerateStudyPack)
		api.POST("/ai/tutor", aiHandler.TutorChat)

		// Imports
		api.POST("/imports/youtube", importsHandler.ImportYouTube)
		api.POST("/imports/document", importsHandler.ImportDocument)
		api.GET("/imports/status/:materialId", importsHandler.GetImportStatus)
	}

	// Start server
	log.Printf("Server starting on port %s", cfg.Port)
	if err := router.Run(":" + cfg.Port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
