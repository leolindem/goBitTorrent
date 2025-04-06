package main

import (
	"fmt"
	"os"
	// "net/http"

	"github.com/leolindem/torrent-client/torrent"
	"github.com/gin-gonic/gin"
	"github.com/gin-contrib/cors"
)

func main() {
	router := gin.Default()
	router.Use(cors.Default())
	router.Static("/downloads", "./downloads")
	router.POST("/api/upload", postTorrent)
	router.GET("/api/status/:filename", statusHandler)
	router.Run("localhost:8080")
}

func postTorrent(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		c.String(400, "Failed to get file")
		return
	}

	tempPath := "./" + file.Filename
	if err := c.SaveUploadedFile(file, tempPath); err != nil {
		c.String(500, "Failed to save file")
		return
	}
	fmt.Println("File received")

	// Start download in a goroutine
	go func(path string) {
		_, err := getOrDownloadTorrent(path)
		if err != nil {
			fmt.Println("Async download failed:", err)
		}
	}(tempPath)

	tfFile, _ := os.Open(tempPath)
	tf, _ := torrent.Open(tfFile)
	tfFile.Close()

	// Return immediately, letting frontend poll for file readiness
	c.JSON(200, gin.H{
		"filename": tf.Name,
	})
}

func statusHandler(c *gin.Context) {
	filename := c.Param("filename")
	path := "./downloads/" + filename

	if _, err := os.Stat(path); err == nil {
		c.JSON(200, gin.H{"ready": true})
	} else {
		c.JSON(200, gin.H{"ready": false})
	}
}


func getOrDownloadTorrent(torrentPath string) (string, error) {
	file, err := os.Open(torrentPath)
	if err != nil {
		return "", fmt.Errorf("error opening torrent file: %v", err)
	}
	defer file.Close()

	tf, err := torrent.Open(file)
	if err != nil {
		return "", fmt.Errorf("failed to parse torrent file: %v", err)
	}

	outputPath := "./downloads/" + tf.Name

	// Check if file already exists
	if _, err := os.Stat(outputPath); err == nil {
		fmt.Println("File already downloaded:", outputPath)
		return tf.Name, nil
	}

	fmt.Println("Downloading file:", tf.Name)
	err = tf.DownloadToFile(outputPath)
	if err != nil {
		return "", fmt.Errorf("download failed: %v", err)
	}

	fmt.Println("File downloaded to:", outputPath)
	return tf.Name, nil
}

