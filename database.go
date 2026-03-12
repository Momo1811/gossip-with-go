package main

import (
	"database/sql"
	"fmt"
	"os"

	_ "github.com/go-sql-driver/mysql"
	"golang.org/x/crypto/bcrypt"
)

var DB *sql.DB

func InitDB() {
	dsn := os.Getenv("DB_URL")
	if dsn == "" {
		dsn = "root:@tcp(127.0.0.1:3306)/gossip_db"

	}
	var err error
	DB, err = sql.Open("mysql", dsn)
	if err != nil {
		panic(err)
	}

	if err = DB.Ping(); err != nil {
		panic(err)
	}

	fmt.Println("Connected to MySQL successfully!")

	createTables()
}

func createTables() {
	queryTopics := `CREATE TABLE IF NOT EXISTS topics (
		id INT AUTO_INCREMENT PRIMARY KEY,
		name VARCHAR(255) NOT NULL,
		description TEXT,
		author VARCHAR(100) DEFAULT 'Admin'
	)`
	_, err := DB.Exec(queryTopics)
	if err != nil {
		fmt.Println("Error creating topics table:", err)
	}

	queryPosts := `CREATE TABLE IF NOT EXISTS posts (
		id INT AUTO_INCREMENT PRIMARY KEY,
		topic_id INT,
		title VARCHAR(255) NOT NULL,
		content TEXT,
		author VARCHAR(100),
		image_url VARCHAR(255),
		likes INT DEFAULT 0,
		dislikes INT DEFAULT 0,
		shares INT DEFAULT 0,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (topic_id) REFERENCES topics(id)
	)`
	_, err = DB.Exec(queryPosts)
	if err != nil {
		fmt.Println("Error creating posts table:", err)
	} else {
		fmt.Println("Database tables are ready!")
	}

	queryUsers := `CREATE TABLE IF NOT EXISTS users (
		id INT AUTO_INCREMENT PRIMARY KEY,
		username VARCHAR(100) NOT NULL UNIQUE,
		password TEXT NOT NULL,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	)`
	_, err = DB.Exec(queryUsers)
	if err != nil {
		fmt.Println("Error creating users table:", err)
	}

	commentQuery := `CREATE TABLE IF NOT EXISTS comments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        post_id INT NOT NULL,
        author VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        parent_id INT DEFAULT 0,
        likes INT DEFAULT 0,
        is_pinned BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
    );`

	_, err = DB.Exec(commentQuery)
	if err != nil {
		fmt.Println("Error creating comments table:", err)
	}

	queryPostLikes := `CREATE TABLE IF NOT EXISTS post_likes (
		id INT AUTO_INCREMENT PRIMARY KEY,
		post_id INT,
		username VARCHAR(255),
		UNIQUE KEY unique_post_like (post_id, username)
	)`
	_, err = DB.Exec(queryPostLikes)
	if err != nil {
		fmt.Println("Error creating post_likes table:", err)
	}

	queryPostDislikes := `CREATE TABLE IF NOT EXISTS post_dislikes (
		id INT AUTO_INCREMENT PRIMARY KEY,
		post_id INT,
		username VARCHAR(255),
		UNIQUE KEY unique_dislike (post_id, username)
	)`
	_, err = DB.Exec(queryPostDislikes)
	if err != nil {
		fmt.Println("Error creating post_dislikes table:", err)
	}

	queryCommentLikes := `CREATE TABLE IF NOT EXISTS comment_likes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        comment_id INT,
        username VARCHAR(255),
        UNIQUE KEY unique_comment_like (comment_id, username)
    )`
	_, err = DB.Exec(queryCommentLikes)
	if err != nil {
		fmt.Println("Error creating comment_likes table:", err)
	} else {
		fmt.Println("Comment Likes table is ready!")
	}
}

// AddTopic
func AddTopic(name string, description string, author string) error {
	_, err := DB.Exec("INSERT INTO topics (name, description, author) VALUES (?, ?, ?)", name, description, author)
	return err
}

// GetTopics
func GetTopics() ([]map[string]interface{}, error) {
	rows, err := DB.Query("SELECT id, name, author FROM topics")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var topics []map[string]interface{}
	for rows.Next() {
		var id int
		var name, author string
		err := rows.Scan(&id, &name, &author)
		if err != nil {
			return nil, err
		}

		topics = append(topics, map[string]interface{}{
			"id":     id,
			"name":   name,
			"author": author,
		})
	}
	return topics, nil
}

// AddPost
func AddPost(topicID int, title string, content string, author string, imageURL string) error {
	_, err := DB.Exec("INSERT INTO posts (topic_id, title, content, author,image_url) VALUES (?, ?, ?, ?, ?)",
		topicID, title, content, author, imageURL)
	return err
}

// GetPostsByTopic
func GetPostsByTopic(topicID int) ([]map[string]interface{}, error) {
	rows, err := DB.Query("SELECT id, title, content, author, created_at, likes, dislikes, shares, image_url FROM posts WHERE topic_id = ?", topicID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var posts []map[string]interface{}
	for rows.Next() {
		var id, likes, dislikes, shares int
		var title, content, author, createdAt, imageURL string

		err := rows.Scan(&id, &title, &content, &author, &createdAt, &likes, &dislikes, &shares, &imageURL)
		if err != nil {
			return nil, err
		}
		posts = append(posts, map[string]interface{}{
			"id":         id,
			"title":      title,
			"content":    content,
			"author":     author,
			"created_at": createdAt,
			"likes":      likes,
			"dislikes":   dislikes,
			"shares":     shares,
			"image_url":  imageURL,
		})
	}
	return posts, nil
}

// editpost
func UpdatePost(postID int, newTitle string, newContent string) error {
	_, err := DB.Exec("UPDATE posts SET title = ?, content = ? WHERE id = ?", newTitle, newContent, postID)
	return err
}

func DeletePost(postID int) error {
	_, _ = DB.Exec("DELETE FROM comments WHERE post_id = ?", postID)
	_, _ = DB.Exec("DELETE FROM post_likes WHERE post_id = ?", postID)
	_, _ = DB.Exec("DELETE FROM post_dislikes WHERE post_id = ?", postID)

	_, err := DB.Exec("DELETE FROM posts WHERE id = ?", postID)
	return err
}

// AddComment
func AddComment(postID int, author string, content string, parentID any) error {
	_, err := DB.Exec("INSERT INTO comments (post_id, author, content,parent_id) VALUES (?, ?, ?, ?)", postID, author, content, parentID)
	return err
}

func GetComments(postID int) ([]map[string]interface{}, error) {
	rows, err := DB.Query("SELECT id, author, content, created_at, likes, is_pinned FROM comments WHERE post_id = ? ORDER BY is_pinned DESC, created_at ASC", postID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var comments []map[string]interface{}
	for rows.Next() {
		var id, likes int
		var isPinned bool
		var author, content, createdAt string

		err := rows.Scan(&id, &author, &content, &createdAt, &likes, &isPinned)
		if err != nil {
			return nil, err
		}

		comments = append(comments, map[string]interface{}{
			"id":         id,
			"author":     author,
			"content":    content,
			"created_at": createdAt,
			"likes":      likes,
			"is_pinned":  isPinned,
		})
	}
	return comments, nil
}

func LikePost(postID int) error {
	_, err := DB.Exec("UPDATE posts SET likes = likes + 1 WHERE id = ?", postID)
	return err
}

func SharePost(postID int) error {
	_, err := DB.Exec("UPDATE posts SET shares = shares + 1 WHERE id = ?", postID)
	return err
}

func DeleteTopic(topicID int) error {
	_, err := DB.Exec("DELETE FROM posts WHERE topic_id = ?", topicID)
	if err != nil {
		return fmt.Errorf("failed to delete related posts: %v", err)
	}

	_, err = DB.Exec("DELETE FROM topics WHERE id = ?", topicID)
	if err != nil {
		return fmt.Errorf("failed to delete topic: %v", err)
	}

	return nil
}

// update topic name
func UpdateTopic(topicID int, newName string) error {
	_, err := DB.Exec("UPDATE topics SET name = ? WHERE id = ?", newName, topicID)
	return err
}

// Register
func RegisterUser(username string, password string) error {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), 10)
	if err != nil {
		return err
	}
	_, err = DB.Exec("INSERT INTO users (username, password) VALUES (?, ?)", username, string(hashedPassword))
	return err
}

// Login
func CheckUserLogin(username string, password string) (int, error) {
	var id int
	var hashedPassword string

	err := DB.QueryRow("SELECT id, password FROM users WHERE username = ?", username).Scan(&id, &hashedPassword)
	if err != nil {
		return 0, err
	}

	err = bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(password))
	if err != nil {
		return 0, err
	}

	return id, nil
}
