package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"sync"

	"github.com/golang-migrate/migrate"
	"github.com/golang-migrate/migrate/database/postgres"
	_ "github.com/golang-migrate/migrate/source/file"
	"github.com/gorilla/mux"
	"github.com/jackc/pgx"
)

type Memo struct {
	ID      int    `json:"id"`
	Title   string `json:"title"`
	Content string `json:"content"`
}

type Category struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
}

// InMemoryMemoStore simulates a database
type InMemoryMemoStore struct {
	sync.Mutex
	memos  map[int]Memo
	nextID int
}

// NewInMemoryMemoStore creates a new in-memory memo store
func NewInMemoryMemoStore() *InMemoryMemoStore {
	return &InMemoryMemoStore{
		memos:  make(map[int]Memo),
		nextID: 1,
	}
}

// CreateMemo adds a new memo to the store
func (s *InMemoryMemoStore) CreateMemo(memo Memo) int {
	s.Lock()
	defer s.Unlock()
	memo.ID = s.nextID
	s.memos[s.nextID] = memo
	s.nextID++
	return memo.ID
}

// GetMemo retrieves a memo by its ID
func (s *InMemoryMemoStore) GetMemo(id int) (Memo, bool) {
	s.Lock()
	defer s.Unlock()
	memo, ok := s.memos[id]
	return memo, ok
}

// UpdateMemo updates an existing memo
func (s *InMemoryMemoStore) UpdateMemo(id int, updatedMemo Memo) bool {
	s.Lock()
	defer s.Unlock()
	if _, ok := s.memos[id]; ok {
		updatedMemo.ID = id
		s.memos[id] = updatedMemo
		return true
	}
	return false
}

// DeleteMemo removes a memo by its ID
func (s *InMemoryMemoStore) DeleteMemo(id int) bool {
	s.Lock()
	defer s.Unlock()
	if _, ok := s.memos[id]; ok {
		delete(s.memos, id)
		return true
	}
	return false
}

var store *InMemoryMemoStore

func main() {

	performDatabaseMigrations()
	setupDatabaseConnection()

	store = NewInMemoryMemoStore()
	router := mux.NewRouter()

	router.HandleFunc("/memos", createMemoHandler).Methods("POST")
	router.HandleFunc("/memos", getAllMemosHandler).Methods("GET")
	router.HandleFunc("/memos/{id}", getMemoHandler).Methods("GET")
	router.HandleFunc("/memos/{id}", updateMemoHandler).Methods("PUT")
	router.HandleFunc("/memos/{id}", deleteMemoHandler).Methods("DELETE")

	fmt.Println("Server listening on port 8080")
	log.Fatal(http.ListenAndServe(":8080", router))
}

func setupDatabaseConnection() {
	connConfig, err := pgx.ParseConnectionString("postgres://localhost:5432/memo-db")
	if err != nil {
		fmt.Fprintf(os.Stderr, "Unable to parse connection string: %v\n", err)
		os.Exit(1)
	}

	conn, err := pgx.Connect(connConfig)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Unable to connect to database: %v\n", err)
		os.Exit(1)
	}
	defer conn.Close()
}

func performDatabaseMigrations() {
	db, err := sql.Open("postgres", "postgres://localhost:5432/memo-db?sslmode=disable")
	if err != nil {
		fmt.Fprintf(os.Stderr, "Unable to open database: %v\n", err)
		os.Exit(1)
	}
	driver, err := postgres.WithInstance(db, &postgres.Config{})

	if err != nil {
		fmt.Fprintf(os.Stderr, "Unable to create driver: %v\n", err)
		os.Exit(1)
	}
	m, err := migrate.NewWithDatabaseInstance(
		"file://migrations",
		"postgres", driver)

	if err != nil {
		fmt.Fprintf(os.Stderr, "Unable to create migration instance: %v\n", err)
		os.Exit(1)
	}

	if err := m.Up(); err != nil && err != migrate.ErrNoChange {
		fmt.Fprintf(os.Stderr, "Error applying migrations: %v\n", err)
		os.Exit(1)
	}
	fmt.Println("Database migrations applied successfully")
}

func createMemoHandler(w http.ResponseWriter, r *http.Request) {
	var memo Memo
	err := json.NewDecoder(r.Body).Decode(&memo)
	if err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	id := store.CreateMemo(memo)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]int{"id": id})
}

func getAllMemosHandler(w http.ResponseWriter, r *http.Request) {
	var memos []Memo
	for _, memo := range store.memos {
		memos = append(memos, memo)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(memos)
}

func getMemoHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	idStr := vars["id"]
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid memo ID", http.StatusBadRequest)
		return
	}

	memo, ok := store.GetMemo(id)
	if !ok {
		http.Error(w, "Memo not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(memo)
}

func updateMemoHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	idStr := vars["id"]
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid memo ID", http.StatusBadRequest)
		return
	}

	var updatedMemo Memo
	err = json.NewDecoder(r.Body).Decode(&updatedMemo)
	if err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if store.UpdateMemo(id, updatedMemo) {
		w.WriteHeader(http.StatusOK)
	} else {
		http.Error(w, "Memo not found", http.StatusNotFound)
	}
}

func deleteMemoHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	idStr := vars["id"]
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid memo ID", http.StatusBadRequest)
		return
	}

	if store.DeleteMemo(id) {
		w.WriteHeader(http.StatusOK)
	} else {
		http.Error(w, "Memo not found", http.StatusNotFound)
	}
}
