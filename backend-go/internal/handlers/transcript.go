package handlers

import (
	"encoding/json"
	"encoding/xml"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"regexp"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

type TranscriptRequest struct {
	VideoURL string `json:"videoUrl"`
}

type TranscriptResponse struct {
	Transcript string `json:"transcript"`
}

// FetchTranscriptHandler handles the request to get a YouTube transcript
func FetchTranscriptHandler(c *gin.Context) {
	var req TranscriptRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	videoID, err := extractVideoIDForTranscript(req.VideoURL)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid YouTube URL"})
		return
	}

	transcript, err := getTranscript(videoID)
	if err != nil {
		// Fallback to detailed error message for debugging
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to fetch transcript: %v", err)})
		return
	}

	c.JSON(http.StatusOK, TranscriptResponse{Transcript: transcript})
}

func extractVideoIDForTranscript(videoURL string) (string, error) {
	u, err := url.Parse(videoURL)
	if err != nil {
		return "", err
	}

	if u.Host == "youtu.be" {
		return strings.TrimPrefix(u.Path, "/"), nil
	}

	q := u.Query()
	videoID := q.Get("v")
	if videoID == "" {
		return "", fmt.Errorf("no video ID found")
	}
	return videoID, nil
}

func getTranscript(videoID string) (string, error) {
	client := &http.Client{
		Timeout: 10 * time.Second,
	}

	// 1. Fetch the video page
	resp, err := client.Get(fmt.Sprintf("https://www.youtube.com/watch?v=%s", videoID))
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}
	html := string(bodyBytes)

	// 2. Extract captionTracks JSON
	// Look for "captionTracks":[{...}] inside the "player_response"
	// Regex is fragile but often works for simple scraping
	re := regexp.MustCompile(`"captionTracks":(\[.*?\])`)
	matches := re.FindStringSubmatch(html)
	if len(matches) < 2 {
		return "", fmt.Errorf("no captions found (or scraping failed)")
	}

	jsonStr := matches[1]

	// 3. Parse JSON to find the English track (or first available)
	var tracks []struct {
		BaseURL string `json:"baseUrl"`
		Name    struct {
			SimpleText string `json:"simpleText"`
		} `json:"name"`
		LanguageCode string `json:"languageCode"`
	}

	if err := json.Unmarshal([]byte(jsonStr), &tracks); err != nil {
		return "", fmt.Errorf("failed to parse caption tracks: %v", err)
	}

	if len(tracks) == 0 {
		return "", fmt.Errorf("no caption tracks available")
	}

	// Prefer English
	var captionURL string
	for _, t := range tracks {
		if strings.HasPrefix(t.LanguageCode, "en") {
			captionURL = t.BaseURL
			break
		}
	}
	if captionURL == "" {
		captionURL = tracks[0].BaseURL // Fallback to first
	}

	// 4. Fetch the actual transcript XML
	respCaptions, err := client.Get(captionURL)
	if err != nil {
		return "", fmt.Errorf("failed to fetch caption content: %v", err)
	}
	defer respCaptions.Body.Close()

	capBytes, err := io.ReadAll(respCaptions.Body)
	if err != nil {
		return "", err
	}

	// 5. Parse XML
	// Format: <transcript><text start="0" dur="5">Hello</text>...</transcript>
	type Text struct {
		Start   string `xml:"start,attr"`
		Dur     string `xml:"dur,attr"`
		Content string `xml:",chardata"`
	}
	type TranscriptXML struct {
		Texts []Text `xml:"text"`
	}

	var tXML TranscriptXML
	// Some tracks are actually JSON if 'fmt=json3' is in URL, but default scrape usually gives XML or we can force it.
	// However, the scraped URL often doesn't have format specified, defaulting to XML.
	// If it fails, we might need to handle JSON format (rare in this specific scrape method).
	if err := xml.Unmarshal(capBytes, &tXML); err != nil {
		// It might be JSON3 format if default changed
		return "", fmt.Errorf("failed to parse XML captions: %v", err)
	}

	// 6. Format into readable text
	var sb strings.Builder
	for _, text := range tXML.Texts {
		// Simple decoding of HTML entities might be needed
		decoded := strings.ReplaceAll(text.Content, "&#39;", "'")
		decoded = strings.ReplaceAll(decoded, "&quot;", "\"")
		decoded = strings.ReplaceAll(decoded, "&amp;", "&")

		// Optional: Add timestamps? User wanted "Format: Time - Text"
		// For now, let's look at the user's previous example:
		// "0:00 - Introduction"
		// The XML gives seconds (e.g., start="0.45"). We can format this.

		startTime, _ := time.ParseDuration(text.Start + "s")
		timestamp := fmt.Sprintf("%d:%02d", int(startTime.Minutes()), int(startTime.Seconds())%60)

		sb.WriteString(fmt.Sprintf("%s - %s\n\n", timestamp, decoded))
	}

	return sb.String(), nil
}
