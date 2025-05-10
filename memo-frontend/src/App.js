import {
  Button,
  TextField,
  Grid,
  Box,
  AppBar,
  Toolbar,
  Typography,
  ThemeProvider,
  createTheme,
} from "@mui/material";
import "./App.css";
import { useState } from "react";
import DetailPanel from "./DetailPanel";
import MasterPanel from "./MasterPanel";

const URL = process.env.REACT_APP_API_URL || "http://localhost:8080";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
    error: {
      main: "#f77", // A lighter shade of red for error states
    },
  },
});

function App() {
  const [accessToken, setAccessToken] = useState("");
  const [accessTokenError, setAccessTokenError] = useState(false);
  const [accessTokenDisabled, setAccessTokenDisabled] = useState(false);
  const [memoLoading, setMemoLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [memos, setMemos] = useState({});

  const [selectedMemo, setSelectedMemo] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(-1);

  const cannotSendForm =
    accessTokenError || !accessToken || accessTokenDisabled;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: "hidden",
      }}
    >
      <AppBar position="static">
        <Toolbar>
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{ flexGrow: 1, display: { xs: "none", sm: "block" } }}
          >
            Memo App
          </Typography>
          <Box sx={{ padding: 2 }}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (cannotSendForm) {
                  return;
                }
                setAccessTokenDisabled(true);
                fetch(`${URL}/category`, {
                  method: "GET",
                  headers: {
                    "Content-Type": "application/json",
                    "X-ACCESS-TOKEN": accessToken,
                  },
                })
                  .then((response) => {
                    if (response.ok) {
                      return response.json();
                    } else {
                      throw new Error("Login failed");
                    }
                  })
                  .then((data) => {
                    setCategories(data);
                  })
                  .catch((error) => {
                    console.error("Error:", error);
                    setAccessTokenDisabled(false);
                  });
              }}
            >
              <Box sx={{ display: "flex", gap: 2 }}>
                <ThemeProvider theme={darkTheme}>
                  <TextField
                    id="access_token"
                    variant="filled"
                    label="Access Token"
                    disabled={accessTokenDisabled}
                    value={accessToken}
                    fullWidth
                    error={accessTokenError}
                    onChange={(e) => {
                      setAccessToken(e.target.value);
                      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(
                        e.target.value
                      )
                        ? setAccessTokenError(false)
                        : setAccessTokenError(true);
                    }}
                  />
                  <Button
                    id="login"
                    type="submit"
                    disabled={cannotSendForm}
                    sx={{ minWidth: "100px", color: "white" }}
                  >
                    LOGIN
                  </Button>
                </ThemeProvider>
              </Box>
            </form>
          </Box>
        </Toolbar>
      </AppBar>
      <Grid container sx={{ overflow: "hidden", height: "100%" }}>
        {/* Master Panel */}
        <MasterPanel
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryExpand={(category) => {
            return fetch(
              `${URL}/memo?category_id=${category.id}`,
              {
                method: "GET",
                headers: {
                  "Content-Type": "application/json",
                  "X-ACCESS-TOKEN": accessToken,
                },
              }
            )
              .then((response) => {
                if (response.ok) {
                  return response.json();
                } else {
                  throw new Error("Failed to fetch memos");
                }
              })
              .then((data) => {
                setMemos({ ...memos, [category.id]: data });
              })
              .catch((error) => {
                console.error("Error:", error);
              });
          }}
          onCategoryClick={(category) => setSelectedCategory(category.id)}
          onMemoClick={(memo, category) => {
            setMemoLoading(true);
            fetch(
              `${URL}/memo/${memo.id}`,
              {
                method: "GET",
                headers: {
                  "Content-Type": "application/json",
                  "X-ACCESS-TOKEN": accessToken,
                },
              }
            )
              .then((response) => {
                if (response.ok) {
                  return response.json();
                } else {
                  throw new Error("Failed to fetch memo");
                }
              })
              .then((data) => {
                setSelectedMemo({ ...data, category_id: category.id });
                setMemoLoading(false);
              })
              .catch((error) => {
                console.error("Error:", error);
                setMemoLoading(false);
              });
          }}
        />

        <DetailPanel
          selectedMemo={selectedMemo}
          setSelectedMemo={setSelectedMemo}
          loading={memoLoading}
          onSaveMemo={() => {
            if (!selectedMemo || memoLoading) return;
            setMemoLoading(true);
            fetch(`${URL}/memo/${selectedMemo.id}`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                "X-ACCESS-TOKEN": accessToken,
              },
              body: JSON.stringify({
                title: selectedMemo.title,
                content: selectedMemo.content,
                category_id: selectedMemo.category_id,
              }),
            })
              .then((response) => {
                if (response.ok) {
                  return response.json();
                } else {
                  throw new Error("Failed to save memo");
                }
              })
              .then((data) => {
                setMemos({
                  ...memos,
                  [selectedMemo.category_id]: memos[
                    selectedMemo.category_id
                  ].map((memo) =>
                    memo.id === data.id ? { ...memo, title: data.title } : memo
                  ),
                });
              })
              .catch((error) => {
                console.error("Error saving memo:", error);
              })
              .finally(() => {
                setMemoLoading(false);
              });
          }}
          onDeleteMemo={() => {
            if (!selectedMemo || memoLoading) return;
            setMemoLoading(true);
            fetch(`${URL}/memo/${selectedMemo.id}`, {
              method: "DELETE",
              headers: {
                "X-ACCESS-TOKEN": accessToken,
              },
            })
              .then((response) => {
                if (response.ok) {
                  setMemos({
                    ...memos,
                    [selectedMemo.category_id]: memos[
                      selectedMemo.category_id
                    ].filter((memo) => memo.id !== selectedMemo.id),
                  });
                  setSelectedMemo(null);
                } else {
                  throw new Error("Failed to delete memo");
                }
              })
              .catch((error) => {
                console.error("Error deleting memo:", error);
              })
              .finally(() => {
                setMemoLoading(false);
              });
          }}
          onTitleChange={(e) => {
            setSelectedMemo({ ...selectedMemo, title: e.target.value });
          }}
          onContentChange={(e) => {
            setSelectedMemo({ ...selectedMemo, content: e.target.value });
          }}
        />
      </Grid>
    </Box>
  );
}

export default App;
