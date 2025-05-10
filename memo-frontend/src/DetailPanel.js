import { Button, TextField, Grid, Paper, Box } from "@mui/material";
import "./App.css";

const DetailPanel = ({
  onDeleteMemo,
  onSaveMemo,
  selectedMemo,
  onTitleChange,
  onContentChange,
  loading,
}) => (
  <Grid size={{ xs: 12, md: 8 }}>
    <Paper sx={{ height: "100%", width: "100%" }}>
      <form
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          padding: "16px",
        }}
      >
        <TextField
          id="memo-title"
          label="Title"
          variant="standard"
          disabled={!selectedMemo || loading}
          value={(selectedMemo && selectedMemo.title) || ""}
          onChange={onTitleChange}
        />
        <TextField
          id="memo-content"
          label="Content"
          multiline
          rows={4}
          disabled={!selectedMemo || loading}
          value={(selectedMemo && selectedMemo.content) || ""}
          onChange={onContentChange}
        />
        <Box
          sx={{ display: "flex", justifyContent: "flex-start", gap: "10px" }}
        >
          <Button
            id="save-memo"
            disabled={!selectedMemo || loading}
            type="submit"
            variant="contained"
            color="success"
            onClick={onSaveMemo}
          >
            Save
          </Button>
          <Button
            id="delete-memo"
            disabled={!selectedMemo || loading}
            variant="contained"
            color="error"
            onClick={onDeleteMemo}
          >
            Delete
          </Button>
        </Box>
      </form>
    </Paper>
  </Grid>
);

export default DetailPanel;
