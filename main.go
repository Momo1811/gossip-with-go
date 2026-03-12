package main

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

var jwtKey = []byte("momo_secret_key_123")

func main() {
	InitDB()

	//Get Topics API
	http.HandleFunc("/api/topics", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Content-Type", "application/json")

		topics, err := GetTopics()
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		json.NewEncoder(w).Encode(topics)
	})

	//Add Topic API
	http.HandleFunc("/api/add-topic", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		name := r.URL.Query().Get("name")
		author := r.URL.Query().Get("author")

		if name == "" {
			fmt.Fprintf(w, "Please provide a name")
			return
		}
		if author == "" {
			author = "Anonymous"
		}
		err := AddTopic(name, "Description", author)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		fmt.Fprintf(w, "Success")
	})

	//Add post
	http.HandleFunc("/api/add-post", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		err := r.ParseMultipartForm(10 << 20)
		if err != nil {
			http.Error(w, "File too large", http.StatusBadRequest)
			return
		}

		topicIDStr := r.FormValue("topic_id")
		title := r.FormValue("title")
		content := r.FormValue("content")
		author := r.FormValue("author")

		topicID, _ := strconv.Atoi(topicIDStr)

		file, handler, err := r.FormFile("image")
		var imageURL string
		if err == nil {
			defer file.Close()

			imagePath := "./uploads/" + handler.Filename
			dst, err := os.Create(imagePath)
			if err == nil {
				defer dst.Close()
				io.Copy(dst, file)
				imageURL = "/uploads/" + handler.Filename
			}
		}

		err = AddPost(topicID, title, content, author, imageURL)
		if err != nil {
			http.Error(w, "Failed to add post: "+err.Error(), http.StatusInternalServerError)
			return
		}
		w.WriteHeader(http.StatusOK)
		fmt.Fprintf(w, "Successfully added post!")
	})

	// Get Posts API
	http.HandleFunc("/api/get-posts", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Content-Type", "application/json")

		topicIDStr := r.URL.Query().Get("topic_id")
		id, _ := strconv.Atoi(topicIDStr)

		posts, err := GetPostsByTopic(id)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		json.NewEncoder(w).Encode(posts)
	})

	// Edit Post API
	http.HandleFunc("/api/edit-post", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")

		postIDStr := r.URL.Query().Get("id")
		title := r.URL.Query().Get("title")
		content := r.URL.Query().Get("content")
		currentUsername := r.URL.Query().Get("username")
		var id int
		fmt.Sscanf(postIDStr, "%d", &id)

		var author string

		err := DB.QueryRow("SELECT author FROM posts WHERE id = ?", id).Scan(&author)
		if err != nil {
			http.Error(w, "Post not found", http.StatusNotFound)
			return
		}

		if author != currentUsername {
			http.Error(w, "Unauthorized", http.StatusForbidden)
			return
		}

		err = UpdatePost(id, title, content)
		if err != nil {
			http.Error(w, "Failed to update post", http.StatusInternalServerError)
			return
		}
		fmt.Fprintf(w, "Post %d updated successfully!", id)
	})

	// Add Cmt API
	http.HandleFunc("/api/add-comment", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == "OPTIONS" {
			return
		}

		var data struct {
			PostID   int    `json:"post_id"`
			Author   string `json:"author"`
			Content  string `json:"content"`
			ParentID *int   `json:"parent_id"`
		}

		if err := json.NewDecoder(r.Body).Decode(&data); err != nil {
			http.Error(w, "JSON error: "+err.Error(), http.StatusBadRequest)
			return
		}
		err := AddComment(data.PostID, data.Author, data.Content, data.ParentID)
		if err != nil {
			log.Println("Database Error:", err)
			http.Error(w, "DB error: "+err.Error(), http.StatusInternalServerError)
			return
		}

		fmt.Fprint(w, "Comment added")
	})

	// Get Cmts API
	http.HandleFunc("/api/get-comments", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		postID, _ := strconv.Atoi(r.URL.Query().Get("post_id"))
		comments, _ := GetComments(postID)
		json.NewEncoder(w).Encode(comments)
	})

	//Delete cmt
	http.HandleFunc("/api/delete-comment", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		commentID := r.URL.Query().Get("id")
		currentUsername := r.URL.Query().Get("username")

		var author string
		err := DB.QueryRow("SELECT author FROM comments WHERE id = ?", commentID).Scan(&author)
		if err != nil {
			http.Error(w, "Comment not found", http.StatusNotFound)
			return
		}

		if author != currentUsername {
			http.Error(w, "Unauthorized", http.StatusForbidden)
			return
		}

		_, err = DB.Exec("DELETE FROM comments WHERE id = ?", commentID)
		fmt.Fprint(w, "Deleted")
	})

	//Update cmt
	http.HandleFunc("/api/edit-comment", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		commentID, _ := strconv.Atoi(r.URL.Query().Get("id"))
		newContent := r.URL.Query().Get("content")
		username := r.URL.Query().Get("username")

		var author string
		err := DB.QueryRow("SELECT author FROM comments WHERE id = ?", commentID).Scan(&author)
		if err != nil {
			http.Error(w, "Comment not found", http.StatusNotFound)
			return
		}

		if author != username {
			http.Error(w, "Unauthorized", http.StatusForbidden)
			return
		}

		_, err = DB.Exec("UPDATE comments SET content = ? WHERE id = ?", newContent, commentID)
		fmt.Fprint(w, "Updated")
	})

	http.HandleFunc("/api/pin-comment", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		commentID := r.URL.Query().Get("id")
		_, _ = DB.Exec("UPDATE comments SET is_pinned = NOT is_pinned WHERE id = ?", commentID)
		fmt.Fprint(w, "Pinned/Unpinned")
	})

	//like cmt
	http.HandleFunc("/api/like-comment", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == "OPTIONS" {
			return
		}

		var requestData map[string]interface{}
		if err := json.NewDecoder(r.Body).Decode(&requestData); err != nil {
			http.Error(w, "JSON Decode Error", http.StatusBadRequest)
			return
		}

		commentIDFloat, ok1 := requestData["id"].(float64)
		username, ok2 := requestData["username"].(string)

		if !ok1 || !ok2 {
			http.Error(w, "Missing id or username in request", http.StatusBadRequest)
			return
		}

		commentID := int(commentIDFloat)

		var exists bool
		err := DB.QueryRow("SELECT EXISTS(SELECT 1 FROM comment_likes WHERE comment_id = ? AND username = ?)", commentID, username).Scan(&exists)
		if err != nil {
			fmt.Println("Check Existence Error:", err)
			http.Error(w, "Database Check Error", http.StatusInternalServerError)
			return
		}

		if exists {
			_, err = DB.Exec("DELETE FROM comment_likes WHERE comment_id = ? AND username = ?", commentID, username)
			_, err = DB.Exec("UPDATE comments SET likes = CASE WHEN likes > 0 THEN likes - 1 ELSE 0 END WHERE id = ?", commentID)
		} else {
			_, err = DB.Exec("INSERT INTO comment_likes (comment_id, username) VALUES (?, ?)", commentID, username)
			_, err = DB.Exec("UPDATE comments SET likes = likes + 1 WHERE id = ?", commentID)
		}

		if err != nil {
			fmt.Println("Action Failed Error:", err)
			http.Error(w, "Action Failed", http.StatusInternalServerError)
			return
		}

		fmt.Fprint(w, "Success")
	})

	// Like API
	http.HandleFunc("/api/like-post", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")

		id := r.URL.Query().Get("id")
		username := r.URL.Query().Get("username")

		if username == "" {
			http.Error(w, "Login Required", http.StatusUnauthorized)
			return
		}

		var exists int
		_ = DB.QueryRow("SELECT COUNT(*) FROM post_likes WHERE post_id = ? AND username = ?", id, username).Scan(&exists)

		if exists > 0 {
			_, _ = DB.Exec("DELETE FROM post_likes WHERE post_id = ? AND username = ?", id, username)
			_, _ = DB.Exec("UPDATE posts SET likes = CASE WHEN likes > 0 THEN likes - 1 ELSE 0 END WHERE id = ?", id)
			fmt.Fprint(w, "Like Removed")
		} else {
			_, _ = DB.Exec("INSERT INTO post_likes (post_id, username) VALUES (?, ?)", id, username)
			_, _ = DB.Exec("UPDATE posts SET likes = likes + 1 WHERE id = ?", id)
			fmt.Fprint(w, "Liked")
		}
	})

	//Dislike
	http.HandleFunc("/api/dislike-post", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")

		id := r.URL.Query().Get("id")
		username := r.URL.Query().Get("username")

		if username == "" {
			http.Error(w, "Login Required", http.StatusUnauthorized)
			return
		}

		var exists int
		_ = DB.QueryRow("SELECT COUNT(*) FROM post_dislikes WHERE post_id = ? AND username = ?", id, username).Scan(&exists)

		if exists > 0 {

			_, _ = DB.Exec("DELETE FROM post_dislikes WHERE post_id = ? AND username = ?", id, username)
			_, _ = DB.Exec("UPDATE posts SET dislikes = CASE WHEN dislikes > 0 THEN dislikes - 1 ELSE 0 END WHERE id = ?", id)

			fmt.Fprint(w, "Dislike Removed")
		} else {
			_, _ = DB.Exec("INSERT INTO post_dislikes (post_id, username) VALUES (?, ?)", id, username)
			_, _ = DB.Exec("UPDATE posts SET dislikes = dislikes + 1 WHERE id = ?", id)

			fmt.Fprint(w, "Disliked")
		}
	})

	// Share API
	http.HandleFunc("/api/share-post", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		id, _ := strconv.Atoi(r.URL.Query().Get("id"))
		SharePost(id)
		fmt.Fprint(w, "Shared")
	})

	// Delete Post API
	http.HandleFunc("/api/delete-post", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")

		postIDStr := r.URL.Query().Get("id")
		currentUsername := r.URL.Query().Get("username")

		var id int
		fmt.Sscanf(postIDStr, "%d", &id)

		var author string
		err := DB.QueryRow("SELECT author FROM posts WHERE id = ?", id).Scan(&author)
		if err != nil {
			http.Error(w, "Post not found", http.StatusNotFound)
			return
		}

		if author != currentUsername {
			http.Error(w, "Unauthorized", http.StatusForbidden)
			return
		}

		err = DeletePost(id)
		if err != nil {
			http.Error(w, "Failed to delete post", http.StatusInternalServerError)
			return
		}
		fmt.Fprintf(w, "Post %d deleted successfully!", id)
	})

	// Topic Name Update API
	http.HandleFunc("/api/edit-topic", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")

		idStr := r.URL.Query().Get("id")
		newName := r.URL.Query().Get("name")
		currentUsername := r.URL.Query().Get("username")

		id, _ := strconv.Atoi(idStr)

		var originalAuthor string
		err := DB.QueryRow("SELECT author FROM topics WHERE id = ?", id).Scan(&originalAuthor)
		if err != nil {
			http.Error(w, "Topic not found", http.StatusNotFound)
			return
		}

		if originalAuthor != currentUsername {
			http.Error(w, "Unauthorized access!", http.StatusForbidden)
			return
		}

		err = UpdateTopic(id, newName)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		fmt.Fprintf(w, "Topic updated successfully!")
	})

	// Delete topic
	http.HandleFunc("/api/delete-topic", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		idStr := r.URL.Query().Get("id")
		currentUsername := r.URL.Query().Get("username")
		id, _ := strconv.Atoi(idStr)

		var originalAuthor string
		err := DB.QueryRow("SELECT author FROM topics WHERE id = ?", id).Scan(&originalAuthor)

		if err != nil {
			http.Error(w, "Topic not found", http.StatusNotFound)
			return
		}

		if originalAuthor != currentUsername {
			http.Error(w, "Unauthorized: You don't own this topic", http.StatusForbidden)
			return
		}

		err = DeleteTopic(id)
		if err != nil {
			http.Error(w, "Failed to delete topic", http.StatusInternalServerError)
			return
		}

		fmt.Fprint(w, "Deleted")
	})

	//Register API
	http.HandleFunc("/api/register", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		username := r.URL.Query().Get("username")
		password := r.URL.Query().Get("password")

		err := RegisterUser(username, password)
		if err != nil {
			http.Error(w, "Username already exists or Error", http.StatusInternalServerError)
			return
		}
		fmt.Fprintf(w, "User %s registered successfully!", username)
	})

	//login API
	http.HandleFunc("/api/login", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		username := r.URL.Query().Get("username")
		password := r.URL.Query().Get("password")

		userID, err := CheckUserLogin(username, password)
		if err != nil {
			http.Error(w, "Invalid credentials", http.StatusUnauthorized)
			return
		}

		token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
			"user_id":  userID,
			"username": username,
			"exp":      time.Now().Add(time.Hour * 24).Unix(),
		})

		tokenString, _ := token.SignedString(jwtKey)

		w.Header().Set("Content-Type", "application/json")
		fmt.Fprintf(w, `{"token": "%s", "username": "%s"}`, tokenString, username)
	})

	fs := http.FileServer(http.Dir("./uploads"))
	http.Handle("/uploads/", http.StripPrefix("/uploads/", fs))

	fmt.Println("Backend Server running at https://gossip-with-go-n9z1.onrender.com")
	err := http.ListenAndServe(":8080", nil)
	if err != nil {
		fmt.Printf("Server failed: %s\n", err)
	}
}
