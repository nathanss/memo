import { Button, Grid, Paper, Box } from "@mui/material";
import Category from "./Category";

const MasterPanel = ({
  categories,
  selectedCategory,
  memos,
  onCategoryExpand,
  onCategoryClick,
  onMemoClick,
  onNewMemo,
}) => (
  <Grid size={{ xs: 12, md: 4 }}>
    <Paper
      sx={{
        height: "100%",
      }}
    >
      {categories.map((category, index) => (
        <Category
          selected={selectedCategory === category.id}
          category={category}
          memos={memos[category.id]}
          key={index}
          onExpand={onCategoryExpand}
          onCategoryClick={onCategoryClick}
          onMemoClick={onMemoClick}
        />
      ))}
      <Box sx={{ display: "flex", justifyContent: "flex-end", padding: 2 }}>
        <Button
          id="new-memo"
          disabled={selectedCategory === -1}
          variant="contained"
          color="primary"
          onClick={onNewMemo}
        >
          New
        </Button>
      </Box>
    </Paper>
  </Grid>
);

export default MasterPanel;
