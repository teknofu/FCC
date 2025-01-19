import React from 'react';
import { useSelector } from 'react-redux';
import {
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Typography,
  Paper,
  Box
} from '@mui/material';
import {
  Check as CheckIcon,
  Close as CloseIcon,
  Delete as DeleteIcon,
  Edit as EditIcon
} from '@mui/icons-material';

const getStatusColor = (status) => {
  switch (status) {
    case 'pending':
      return 'warning';
    case 'completed':
      return 'info';
    case 'verified':
      return 'success';
    case 'rejected':
      return 'error';
    default:
      return 'default';
  }
};

const ChoreList = ({ 
  chores, 
  onComplete, 
  onVerify, 
  onReject,
  onEdit,
  onDelete 
}) => {
  const { role } = useSelector(state => state.auth);
  const isParent = role === 'parent';

  if (!chores.length) {
    return (
      <Paper sx={{ p: 2, textAlign: 'center' }}>
        <Typography color="textSecondary">
          No chores found
        </Typography>
      </Paper>
    );
  }

  return (
    <List>
      {chores.map((chore) => (
        <ListItem
          key={chore.id}
          sx={{
            mb: 1,
            bgcolor: 'background.paper',
            borderRadius: 1,
            boxShadow: 1
          }}
        >
          <ListItemText
            primary={
              <Typography variant="subtitle1" component="div">
                {chore.title}
              </Typography>
            }
            secondary={
              <Box>
                <Typography variant="body2" color="text.secondary">
                  {chore.description}
                </Typography>
                <Box sx={{ mt: 1 }}>
                  <Chip
                    label={chore.status}
                    size="small"
                    color={getStatusColor(chore.status)}
                    sx={{ mr: 1 }}
                  />
                  <Chip
                    label={`$${chore.reward}`}
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ mr: 1 }}
                  />
                  <Chip
                    label={chore.timeframe}
                    size="small"
                    variant="outlined"
                  />
                </Box>
              </Box>
            }
          />
          <ListItemSecondaryAction>
            {isParent ? (
              // Parent actions
              chore.status === 'completed' ? (
                <>
                  <IconButton
                    edge="end"
                    aria-label="verify"
                    onClick={() => onVerify(chore.id)}
                    color="success"
                    sx={{ mr: 1 }}
                  >
                    <CheckIcon />
                  </IconButton>
                  <IconButton
                    edge="end"
                    aria-label="reject"
                    onClick={() => onReject(chore.id)}
                    color="error"
                  >
                    <CloseIcon />
                  </IconButton>
                </>
              ) : (
                <>
                  <IconButton
                    edge="end"
                    aria-label="edit"
                    onClick={() => onEdit(chore)}
                    sx={{ mr: 1 }}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    edge="end"
                    aria-label="delete"
                    onClick={() => onDelete(chore.id)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </>
              )
            ) : (
              // Child actions
              chore.status === 'pending' && (
                <IconButton
                  edge="end"
                  aria-label="complete"
                  onClick={() => onComplete(chore.id)}
                  color="primary"
                >
                  <CheckIcon />
                </IconButton>
              )
            )}
          </ListItemSecondaryAction>
        </ListItem>
      ))}
    </List>
  );
};

export default ChoreList;
