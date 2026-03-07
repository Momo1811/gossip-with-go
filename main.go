package main

import (
    "fmt"
    "net/http"
)

func main() {
    fmt.Println("Server is starting on http://localhost:8080...")
    http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
        fmt.Fprintf(w, "Gossip with Go - Real-life Project start!")
    })
    http.ListenAndServe(":8080", nil)
}