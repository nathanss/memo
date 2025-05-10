import React from "react";
import {
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
} from "@mui/material";
import FolderIcon from "@mui/icons-material/Folder";
import DescriptionIcon from "@mui/icons-material/Description";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import "./App.css";
import { useState } from "react";

const Category = ({
  category,
  selected,
  onCategoryClick,
  onExpand,
  memos,
  onMemoClick,
}) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <ListItemButton
        id={`category-${category.id}`}
        selected={selected}
        onClick={async () => {
          onCategoryClick(category);
          if (!expanded && !memos) {
            await onExpand(category);
          }
          setExpanded(!expanded);
        }}
      >
        <ListItemIcon>
          <FolderIcon />
        </ListItemIcon>
        <ListItemText id={`category-${category.id}-title`} primary={category.name} />
        {expanded ? <ExpandLess /> : <ExpandMore />}
      </ListItemButton>
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <List>
          {memos &&
            memos.map((memo) => (
              <ListItemButton
                id={`memo-${memo.id}`}
                key={memo.id}
                onClick={() => {
                  onMemoClick(memo, category);
                }}
              >
                <ListItemIcon>
                  <DescriptionIcon />
                </ListItemIcon>
                <ListItemText primary={memo.title} />
              </ListItemButton>
            ))}
        </List>
      </Collapse>
    </>
  );
};

export default Category;
